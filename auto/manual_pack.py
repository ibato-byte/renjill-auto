#!/usr/bin/env python3
"""手動予約モード（auto/mode.json）の SNS を Meta Business Suite に予約するための素材を作る。
予約するのは、オーナーの iMac の Chrome で動く Claude のスケジュールタスク「レンとジル Business Suite 自動予約（Instagram・Facebook）」
（月・火 10:47／16:47）。.github/workflows/manual.yml が、週次PDCA の schedule.json の push と月曜 9:30 に実行し、
成果物 manual-YYYYMMDD（非公開・7日）にする。

  python auto/manual_pack.py <出力先> [--mark "<ep> <ep> …"]

- 対象：その週（月曜 12:00 〜 次の月曜 11:59、日本時間）に出る回のうち、まだ時刻が来ていない回。
  手動予約モードの SNS のうち、posted.json で manual・投稿ID があるものは除く（"bs-scheduled" はこの仕組みが記録したもの。
  同じ週に作り直しても同じ中身になるよう、対象に残す）
- 回ごとに：<ep>.mp4（Instagram・Facebook 共通＝ループ版・9:16・QA 合格のみ）、ig_<ep>_cover.jpg（チェック済みのサムネ）、
  ig_<ep>.txt・fb_<ep>.txt（予約日時と投稿文）。全体の manifest.json（Chrome 側が読む）と 一覧.txt
- manifest に入れた回は posted.json に "ig"/"facebook": "bs-scheduled" と記録する（Chrome 側は posted.json を書けないため。
  二重予約・自動に戻したあとの二重投稿を防ぐ）。コミットは manual.yml が行う
- --mark：オーナーが手で予約した回を "manual" と記録する
- Automation Hub に渡す KPI などを dist/manual_hub_args に書く
API は呼ばない。mp4 はコミットしない。
"""
import datetime as dt, json, os, pathlib, shutil, subprocess, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb  # noqa: E402
import mode  # noqa: E402

AUTO = pathlib.Path(__file__).resolve().parent
DIST = AUTO.parent / "dist"
JST = dt.timezone(dt.timedelta(hours=9))
WEEK = "月火水木金土日"
CUT = "---- ここから下を投稿文に貼る ----"
BS = "bs-scheduled"


def when(p):
    d = dt.date.fromisoformat(p["date"])
    return f'{d.month}/{d.day}（{WEEK[d.weekday()]}）{p["slot"]}'


def key(p):
    return f'{p["date"]}_{p["ep"]}'


def at(p):
    h, m = map(int, p["slot"].split(":"))
    return dt.datetime.fromisoformat(p["date"]).replace(hour=h, minute=m, tzinfo=JST)


def week_window(now):
    """その週の範囲：月曜（今日が月曜なら今日、それ以外は直前の月曜）12:00 〜 次の月曜 11:59（日本時間）"""
    now = now.astimezone(JST)
    monday = (now - dt.timedelta(days=now.weekday())).replace(hour=12, minute=0, second=0, microsecond=0)
    return monday, monday + dt.timedelta(days=7, minutes=-1)


def pending(sch, posted, now):
    """[(p, [予約する SNS…])]：その週のまだ時刻が来ていない回で、手動・投稿済みでない SNS があるもの"""
    manual = mode.manual_platforms()
    start, end = week_window(now)
    out = []
    for p in sch["posts"]:
        t = at(p)
        if not (start <= t <= end) or t <= now: continue
        done = posted.get(key(p), {})
        pls = [x for x in p.get("platforms", sch["defaults"]["platforms"]) if x in manual and done.get(x) in (None, BS)]
        if pls: out.append((p, pls))
    return sorted(out, key=lambda t: at(t[0]))


def record(posted, p, pls, value, now):
    rec = posted.setdefault(key(p), {"tag_set": p.get("tag_set", "A"), "no": p["no"], "title": p["title"]})
    changed = []
    for x in pls:
        if rec.get(x) in (None, BS) and rec.get(x) != value:
            rec[x] = value; rec[x + "_at"] = now.isoformat(timespec="minutes"); changed.append(x)
    return changed


def mark(sch, posted, eps, now):
    """オーナーが手で予約した回に "manual" を記録。記録した [(key, SNS…)] を返す"""
    manual, done = mode.manual_platforms(), []
    for p in sch["posts"]:
        if p["ep"] not in eps: continue
        pls = [x for x in p.get("platforms", sch["defaults"]["platforms"]) if x in manual]
        ch = record(posted, p, pls, "manual", now)
        if ch: done.append((key(p), ch))
    return done


def caption_ig(p, d):
    """caption_en → caption_ja → コメントを誘う一言 → tag_set のハッシュタグ"""
    cta = p.get("fb_cta") or d.get("fb_cta") or fb.DEFAULT_CTA
    tags = d["tag_sets"][p.get("tag_set", "A")]
    return fb.normalize_brand(f'{p["caption_en"]}\n{p["caption_ja"]}\n\n{cta}\n\n{tags}')


def caption_for(p, d, platform):
    return caption_ig(p, d) if platform == "ig" else fb.caption(p, d)


def text_for(p, d, platform):
    name = mode.NAMES[platform]
    extra = f'カバー画像：ig_{p["ep"]}_cover.jpg\n' if platform == "ig" else ""
    return (f'{name}（Business Suite で予約）\n予約日時（日本時間）：{p["date"]} {p["slot"]}（{when(p)}）\n'
            f'タイトル：{p["title"]}\n動画：{p["ep"]}.mp4\n{extra}{CUT}\n{caption_for(p, d, platform)}\n')


def aspect(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", str(path)],
                       capture_output=True, text=True)
    s = (json.loads(r.stdout or "{}").get("streams") or [{}])[0]
    return s.get("width"), s.get("height")


def build(out, items, d):
    """素材を作る。戻り値：(manifest の posts, 一覧の行, 作れなかった ep)"""
    import post  # 描画・QA・サムネは投稿と同じ処理を使う
    posts, lines, ng = [], [], []
    for p, pls in items:
        ep = p["ep"]
        try:
            yt, loop = post.render(ep)
            ok = post.qa_gate(ep, yt, loop)
        except Exception as e:
            ok = False; print("描画に失敗", ep, type(e).__name__)
        if not ok:
            lines.append(f"- {when(p)}　{p['title']}（{ep}）：QA 不合格のため動画なし。予約しない"); ng.append(ep); continue
        w, h = aspect(loop)
        if not (w and h and abs(w / h - 9 / 16) < 0.01):
            lines.append(f"- {when(p)}　{p['title']}（{ep}）：縦横比が 9:16 でない（{w}x{h}）。予約しない"); ng.append(ep); continue
        cover = None
        if "ig" in pls:
            try:
                shutil.copyfile(post.thumbnail(p), out / f"ig_{ep}_cover.jpg"); cover = f"ig_{ep}_cover.jpg"
            except Exception as e:
                print("サムネに失敗", ep, type(e).__name__)
                lines.append(f"- {when(p)}　{p['title']}（{ep}）：サムネのチェックが不合格。予約しない"); ng.append(ep); continue
        shutil.copyfile(loop, out / f"{ep}.mp4")
        for x in pls:
            (out / f"{'ig' if x == 'ig' else 'fb'}_{ep}.txt").write_text(text_for(p, d, x), encoding="utf-8")
        posts.append({"datetime_jst": at(p).isoformat(), "ep": ep, "title": p["title"], "video": f"{ep}.mp4",
                      **({"cover_ig": cover} if cover else {}), "platforms": pls,
                      **({"caption_ig": caption_for(p, d, "ig")} if "ig" in pls else {}),
                      **({"caption_fb": caption_for(p, d, "facebook")} if "facebook" in pls else {})})
        lines.append(f"- {when(p)}　{p['title']}（{'・'.join(mode.NAMES[x] for x in pls)}）：{ep}.mp4")
    return posts, lines, ng


def main(argv):
    out = pathlib.Path(argv[0]); out.mkdir(parents=True, exist_ok=True)
    marks = []
    it = iter(argv[1:])
    for a in it:
        if a == "--mark": marks += next(it).split()
    now = dt.datetime.now(JST)
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted_f = AUTO / "posted.json"
    posted = json.loads(posted_f.read_text()) if posted_f.exists() else {}
    changed = False
    if marks:
        for k, pls in mark(sch, posted, set(marks), now):
            print("手で予約済みとして記録：", k, "・".join(mode.NAMES[x] for x in pls)); changed = True
    items = pending(sch, posted, now)
    posts, lines, ng = build(out, items, sch["defaults"]) if items else ([], [], [])
    by_ep = {p["ep"]: p for p, _ in items}
    for m in posts:  # Chrome 側が予約する回：二重予約・二重投稿を防ぐため bs-scheduled と記録
        if record(posted, by_ep[m["ep"]], m["platforms"], BS, now): changed = True
    if changed: posted_f.write_text(json.dumps(posted, ensure_ascii=False, indent=2))
    start, end = week_window(now)
    artifact = os.environ.get("ARTIFACT_NAME", f"manual-{now:%Y%m%d}")
    run_url = f"{os.environ.get('GITHUB_SERVER_URL', 'https://github.com')}/{os.environ.get('GITHUB_REPOSITORY', 'ibato-byte/renjill-auto')}/actions/runs/{os.environ.get('GITHUB_RUN_ID', '')}"
    manifest = {"week_start": start.isoformat(), "week_end": end.isoformat(), "generated_at": now.isoformat(timespec="seconds"),
                "artifact": artifact, "run_url": run_url, "posts": posts,
                "excluded": [{"ep": e, "reason": "QA・サムネ・縦横比のどれかが不合格（予約しない）"} for e in sorted(set(ng))]}
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    manual = "・".join(sorted(mode.NAMES[x] for x in mode.manual_platforms())) or "なし"
    (out / "一覧.txt").write_text(
        f"Business Suite に予約する回（{start:%m/%d %H:%M}〜{end:%m/%d %H:%M}。手動予約モード：{manual}）\n"
        "予約は iMac の Chrome の Claude（スケジュールタスク「レンとジル Business Suite 自動予約」）が manifest.json を読んで行う。\n\n"
        + ("\n".join(lines) if lines else "- 予約が必要な回はありません") + "\n", encoding="utf-8")
    print("\n".join(lines) or "予約が必要な回はありません")
    args = ["--kpi", f"今週の予約={len(posts)}本", "--kpi", f"手動予約モード={manual}", "--kpi", "予約するところ=Chrome（Business Suite）"]
    if ng: args += ["--kpi", f"素材NG={len(set(ng))}本",
                    "--owner-action", f"素材を作れなかった回：{' '.join(sorted(set(ng)))}（QA 不合格など。成果物 {artifact} の 一覧.txt）。その回は予約されない。Claude に相談する"]
    else: args += ["--owner-action", "none"]
    DIST.mkdir(exist_ok=True)
    (DIST / "manual_hub_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")
    return 1 if ng else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
