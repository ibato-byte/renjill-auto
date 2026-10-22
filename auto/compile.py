#!/usr/bin/env python3
"""YouTube の「まとめ動画」（依頼 #37-3）。その週に出したショートをつないだ縦の動画を、通常の動画として YouTube に出す。
- 毎週日曜の夜。その週（月〜日）に YouTube に出た回が 2 本以上あるときだけ作る
- 最初の 3 回は「非公開」で出す（Hub の返事のとおり確認できる）。そのあとは公開（auto/compile_state.json の privacy_after で切り替え）
- 再生リスト「まとめ動画（毎週）」に入れる。同じ週は二重に作らない
`python auto/compile.py [--date YYYY-MM-DD] [--dry-run]`"""
import datetime as dt, json, os, pathlib, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUTO, DIST = ROOT / "auto", ROOT / "dist"
JST = dt.timezone(dt.timedelta(hours=9))
PRIVATE_FIRST = 3
PLAYLIST = "まとめ動画（毎週）"
NOT_ID = ("manual", "bs-scheduled")


def week_id(day):
    y, w, _ = day.isocalendar()
    return f"{y}-W{w:02d}"


def week_episodes(sch, posted, day):
    """day と同じ週（月〜日）に YouTube へ出た回 → [(日付, ep, タイトル)] 古い順"""
    wk = week_id(day)
    out = []
    for p in sch["posts"]:
        rec = posted.get(f'{p["date"]}_{p["ep"]}') or {}
        if week_id(dt.date.fromisoformat(p["date"])) == wk and rec.get("yt") and rec["yt"] not in NOT_ID:
            out.append((p["date"], p["ep"], p["title"], p))
    return sorted(out, key=lambda x: (x[0], x[1]))


def privacy_for(state):
    return "private" if len(state.get("weeks", {})) < state.get("private_first", PRIVATE_FIRST) else "public"


def build_title(items, wk):
    first, last = items[0][0][5:].replace("-", "/"), items[-1][0][5:].replace("-", "/")
    return f"Ren & Jill weekly: {len(items)} episodes ({first}–{last}) | レンとジル 今週のまとめ"[:100]


def concat(paths, out, run=subprocess.run):
    """縦 9:16 のまま、同じ設定にそろえてつなぐ（音声あり）"""
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for p in paths: cmd += ["-i", str(p)]
    n = len(paths)
    f = "".join(f"[{i}:v]scale=1080:1920,setsar=1,fps=30,format=yuv420p[v{i}];[{i}:a]aresample=44100[a{i}];" for i in range(n))
    f += "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
    cmd += ["-filter_complex", f, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-c:a", "aac", "-movflags", "+faststart", str(out)]
    r = run(cmd, capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError("つなぎ失敗: " + (r.stderr or "")[-200:])
    return out


def main(argv):
    day = dt.datetime.now(JST).date()
    if "--date" in argv: day = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    dry = "--dry-run" in argv
    sch = json.loads((AUTO / "schedule.json").read_text())
    posted = json.loads((AUTO / "posted.json").read_text())
    state_f = AUTO / "compile_state.json"
    state = json.loads(state_f.read_text()) if state_f.exists() else {"weeks": {}, "private_first": PRIVATE_FIRST}
    wk = week_id(day)
    items = week_episodes(sch, posted, day)
    if wk in state["weeks"]: print("[compile]", wk, "は作成済み"); return 0
    if len(items) < 2: print("[compile]", wk, f"YouTube に出た回が{len(items)}本なので見送り"); return 0
    privacy = privacy_for(state)
    title = build_title(items, wk)
    print("[compile]", wk, [i[1] for i in items], privacy, title)
    if dry: return 0
    import post as postmod
    import stories, growth
    DIST.mkdir(exist_ok=True)
    paths = [postmod.render(ep)[1] for _, ep, _, _ in items]  # ループ版（エンドカードなし）をつなぐ
    out = concat(paths, DIST / f"weekly_{wk}.mp4")
    from googleapiclient.http import MediaFileUpload
    yt = __import__("comments").yt_client()
    d = sch["defaults"]
    desc = d["yt_description"] + "\n\n" + "\n".join(f'EP.{p["no"]} {p["title"]} — {p["caption_en"]}' for _, _, _, p in items)
    loc = growth.youtube_localizations({}, d, title, desc)
    body = {"snippet": {"title": title, "description": desc, "categoryId": "23", "defaultLanguage": "en"}, "localizations": loc,
            "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False}}
    vid = yt.videos().insert(part="snippet,status,localizations", body=body, media_body=MediaFileUpload(str(out), chunksize=-1, resumable=True)).execute()["id"]
    try: stories.add_to_playlist(yt, vid, PLAYLIST)
    except Exception as e: print("[compile] 再生リストに入れられず", type(e).__name__)
    state["weeks"][wk] = {"yt": vid, "privacy": privacy, "eps": [i[1] for i in items], "at": dt.datetime.now(JST).isoformat(timespec="minutes")}
    state_f.write_text(json.dumps(state, ensure_ascii=False, indent=1))
    DIST.joinpath("compile_summary.txt").write_text(f"{wk}：{len(items)}本を{'非公開' if privacy == 'private' else '公開'}で出した")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
