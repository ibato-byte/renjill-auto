#!/usr/bin/env python3
"""Facebook リールを Meta Business Suite で手動予約するための素材を作る（.github/workflows/fb-manual.yml）。
Meta の開発者アカウントが復旧するまでの間、オーナーが Facebook ページ「レンとジル」に手で予約するため。

  python auto/fb_manual.py <出力先> <ep> [<ep> …]

各回について：
- <出力先>/fb_<ep>.mp4 … Instagram と同じ動画（ループ版 dist/<ep>_loop.mp4、9:16）。QA に合格した回だけ
- <出力先>/fb_<ep>.txt … 予約日時（日本時間）と投稿文（caption_en → caption_ja → fb_cta → ハッシュタグ3個以内）
- <出力先>/一覧.txt     … 全部の回の予約日時とファイル名、QA の結果
API は呼ばない。posted.json は書かない。mp4 はリポジトリにコミットしない（成果物として渡すだけ）。
"""
import json, pathlib, shutil, subprocess, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import facebook as fb  # noqa: E402

AUTO = pathlib.Path(__file__).resolve().parent
WEEK = "月火水木金土日"


def find(sch, ep):
    return next((p for p in sch["posts"] if p["ep"] == ep), None)


def when(p):
    import datetime as dt
    d = dt.date.fromisoformat(p["date"])
    return f'{d.month}/{d.day}（{WEEK[d.weekday()]}）{p["slot"]}'


def text_for(p, d):
    return (f'予約日時（日本時間）：{p["date"]} {p["slot"]}（{when(p)}）\n'
            f'タイトル：{p["title"]}\n'
            f'動画：fb_{p["ep"]}.mp4\n'
            f'---- ここから下を Facebook の投稿文に貼る ----\n'
            f'{fb.caption(p, d)}\n')


def aspect(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", str(path)],
                       capture_output=True, text=True)
    s = (json.loads(r.stdout or "{}").get("streams") or [{}])[0]
    return s.get("width"), s.get("height")


def main(argv):
    out, eps = pathlib.Path(argv[0]), argv[1:]
    out.mkdir(parents=True, exist_ok=True)
    import post  # 描画と QA は投稿と同じ処理を使う
    sch = json.loads((AUTO / "schedule.json").read_text())
    d = sch["defaults"]
    lines, ng = [], []
    for ep in eps:
        p = find(sch, ep)
        if not p:
            lines.append(f"- {ep}：schedule.json にない"); ng.append(ep); continue
        (out / f"fb_{ep}.txt").write_text(text_for(p, d), encoding="utf-8")
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
        shutil.copyfile(loop, out / f"fb_{ep}.mp4")
        lines.append(f"- {when(p)}　{p['title']}：fb_{ep}.mp4 ＋ fb_{ep}.txt（{w}x{h}）")
    (out / "一覧.txt").write_text(
        "Facebook ページ「レンとジル」に Meta Business Suite で手動予約する回（Instagram と同じ動画・同じ時刻）\n\n"
        + "\n".join(lines) + "\n\n予約したら、Claude に「Facebook を手動で予約した」と伝えてください（posted.json に manual と記録し、自動の二重投稿を防ぎます）。\n",
        encoding="utf-8")
    print("\n".join(lines))
    return 1 if ng else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
