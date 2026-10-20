#!/usr/bin/env python3
"""手動予約モード（auto/mode.json）の SNS を、オーナーが Meta Business Suite で予約するための素材を作る。
.github/workflows/manual.yml が毎週（と schedule.json が更新されたとき）実行し、成果物 manual-YYYYMMDD（7日）にする。

  python auto/manual_pack.py <出力先> [--days 8] [--ep <ep> …] [--mark "<ep> <ep> …"]

- 対象：今日から --days 日の間（日本時間）の回のうち、手動予約モードの SNS がまだ posted.json にないもの（--ep で指定も可）
- 回ごとに：<ep>.mp4（Instagram・Facebook 共通の動画＝ループ版・9:16・QA 合格のみ）、ig_<ep>_cover.jpg（チェック済みのサムネ）、
  ig_<ep>.txt・fb_<ep>.txt（予約日時と投稿文）。全体の 一覧.txt
- --mark：予約が済んだ回を posted.json に "manual" と記録する（自動の二重投稿を防ぐ。素材づくりの前に行う）
- Automation Hub の「やること」（今週の予約）を dist/manual_hub_args に書く
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


def when(p):
    d = dt.date.fromisoformat(p["date"])
    return f'{d.month}/{d.day}（{WEEK[d.weekday()]}）{p["slot"]}'


def key(p):
    return f'{p["date"]}_{p["ep"]}'


def pending(sch, posted, today, days, eps=None):
    """[(p, [手動の SNS…])]：まだ予約の記録がない回"""
    manual = mode.manual_platforms()
    last = today + dt.timedelta(days=days)
    out = []
    for p in sch["posts"]:
        d = dt.date.fromisoformat(p["date"])
        if eps is not None:
            if p["ep"] not in eps: continue
        elif not (today <= d <= last): continue
        done = posted.get(key(p), {})
        pls = [x for x in p.get("platforms", sch["defaults"]["platforms"]) if x in manual and x not in done]
        if pls: out.append((p, pls))
    return sorted(out, key=lambda t: (t[0]["date"], t[0]["slot"]))


def mark(sch, posted, eps, now):
    """予約が済んだ回に "manual" を記録。記録した [(key, SNS…)] を返す"""
    manual, done = mode.manual_platforms(), []
    for p in sch["posts"]:
        if p["ep"] not in eps: continue
        rec = posted.setdefault(key(p), {"tag_set": p.get("tag_set", "A"), "no": p["no"], "title": p["title"]})
        pls = [x for x in p.get("platforms", sch["defaults"]["platforms"]) if x in manual and x not in rec]
        for x in pls:
            rec[x] = "manual"; rec[x + "_at"] = now.isoformat(timespec="minutes")
        if pls: done.append((key(p), pls))
    return done


def text_for(p, d, platform):
    import post
    cap = post.caption(p, d) if platform == "ig" else fb.caption(p, d)
    name = mode.NAMES[platform]
    extra = f'カバー画像：ig_{p["ep"]}_cover.jpg\n' if platform == "ig" else ""
    return (f'{name}（Business Suite で予約）\n予約日時（日本時間）：{p["date"]} {p["slot"]}（{when(p)}）\n'
            f'タイトル：{p["title"]}\n動画：{p["ep"]}.mp4\n{extra}{CUT}\n{cap}\n')


def aspect(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", str(path)],
                       capture_output=True, text=True)
    s = (json.loads(r.stdout or "{}").get("streams") or [{}])[0]
    return s.get("width"), s.get("height")


def build(out, items, d):
    """素材を作る。戻り値：(一覧の行, 作れなかった ep)"""
    import post  # 描画・QA・サムネは投稿と同じ処理を使う
    lines, ng = [], []
    for p, pls in items:
        ep, names = p["ep"], "・".join(mode.NAMES[x] for x in pls)
        try:
            yt, loop = post.render(ep)
            ok = post.qa_gate(ep, yt, loop)
        except Exception as e:
            ok = False; print("描画に失敗", ep, type(e).__name__)
        if not ok:
            lines.append(f"- {when(p)}　{p['title']}（{ep}）：QA 不合格のため動画なし。予約しないでください"); ng.append(ep); continue
        w, h = aspect(loop)
        if not (w and h and abs(w / h - 9 / 16) < 0.01):
            lines.append(f"- {when(p)}　{p['title']}（{ep}）：縦横比が 9:16 でない（{w}x{h}）。予約しないでください"); ng.append(ep); continue
        shutil.copyfile(loop, out / f"{ep}.mp4")
        files = [f"{ep}.mp4"]
        for x in pls:
            if x == "ig":
                try: shutil.copyfile(post.thumbnail(p), out / f"ig_{ep}_cover.jpg")
                except Exception as e:
                    print("サムネに失敗", ep, type(e).__name__)
                    lines.append(f"- {when(p)}　{p['title']}（{ep}）：サムネのチェックが不合格。Instagram は予約しないでください"); ng.append(ep); continue
                files.append(f"ig_{ep}_cover.jpg")
            (out / f"{'ig' if x == 'ig' else 'fb'}_{ep}.txt").write_text(text_for(p, d, x), encoding="utf-8")
            files.append(f"{'ig' if x == 'ig' else 'fb'}_{ep}.txt")
        lines.append(f"- {when(p)}　{p['title']}（{names}）：{'・'.join(files)}")
    return lines, ng


def hub_action(items, ng, artifact, run_url):
    ok = [(p, pls) for p, pls in items if p["ep"] not in ng]
    if not ok: return "none"
    p0 = ok[0][0]
    names = "・".join(sorted({mode.NAMES[x] for _, pls in ok for x in pls}))
    rest = f"ほか計{len(ok)}本" if len(ok) > 1 else "の1本"
    return (f"今週の予約（Business Suite）：{when(p0)}「{p0['title']}」{rest}の {names}。素材は Actions の {artifact}（{run_url}、7日で消える）。"
            f"予約したら Actions の manual を「Run workflow」で scheduled に回の名前（例 {p0['ep']}）を入れて実行するか、Claude に伝える")[:300]


def main(argv):
    out = pathlib.Path(argv[0]); out.mkdir(parents=True, exist_ok=True)
    days, eps, marks = 8, None, []
    it = iter(argv[1:])
    for a in it:
        if a == "--days": days = int(next(it))
        elif a == "--ep": eps = (eps or []) + [next(it)]
        elif a == "--mark": marks += next(it).split()
    now = dt.datetime.now(JST)
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted_f = AUTO / "posted.json"
    posted = json.loads(posted_f.read_text()) if posted_f.exists() else {}
    if marks:
        done = mark(sch, posted, set(marks), now)
        posted_f.write_text(json.dumps(posted, ensure_ascii=False, indent=2))
        for k, pls in done: print("予約済みとして記録：", k, "・".join(mode.NAMES[x] for x in pls))
    items = pending(sch, posted, now.date(), days, set(eps) if eps else None)
    lines, ng = build(out, items, sch["defaults"]) if items else ([], [])
    manual = "・".join(sorted(mode.NAMES[x] for x in mode.manual_platforms())) or "なし"
    (out / "一覧.txt").write_text(
        f"Meta Business Suite で手動予約する回（手動予約モード：{manual}。動画は Instagram・Facebook 共通、時刻は予定どおり）\n\n"
        + ("\n".join(lines) if lines else "- 予約が必要な回はありません") + "\n\n"
        "投稿文は ig_<回>.txt・fb_<回>.txt の区切り線より下を貼ります。Instagram はカバー画像に ig_<回>_cover.jpg を使います。\n"
        "予約したら、Actions の manual を「Run workflow」で scheduled に回の名前（スペース区切り）を入れて実行するか、Claude に伝えてください（posted.json に manual と記録し、自動の二重投稿を防ぎます）。\n",
        encoding="utf-8")
    print("\n".join(lines) or "予約が必要な回はありません")
    artifact = os.environ.get("ARTIFACT_NAME", f"manual-{now:%Y%m%d}")
    run_url = f"{os.environ.get('GITHUB_SERVER_URL', 'https://github.com')}/{os.environ.get('GITHUB_REPOSITORY', 'ibato-byte/renjill-auto')}/actions/runs/{os.environ.get('GITHUB_RUN_ID', '')}"
    action = hub_action(items, ng, artifact, run_url)
    args = ["--kpi", f"今週の予約={len(items) - len(set(ng))}本", "--kpi", f"手動予約モード={manual}"]
    if ng: args += ["--kpi", f"素材NG={len(set(ng))}本"]
    acts = [action] if action != "none" else []
    if ng: acts.append(f"素材を作れなかった回：{' '.join(sorted(set(ng)))}（QA 不合格など。一覧.txt を参照）。その回は予約しないで、Claude に相談する")
    for a in acts or ["none"]: args += ["--owner-action", a]
    DIST.mkdir(exist_ok=True)
    (DIST / "manual_hub_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")
    return 1 if ng else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
