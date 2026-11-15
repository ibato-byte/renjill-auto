#!/usr/bin/env python3
"""出した回を取り下げる（出し直しの前に）。2026-11-15：「10分の会議」がちかちかしたまま出たので、オーナーの指示で消して出し直した。

  python auto/unpost.py 2026-11-15            # その日の回を、出した SNS から消す
  python auto/unpost.py 2026-11-15 --dry-run  # 何を消すかだけ見る

- 消せた SNS の記録だけ posted.json から外す（→ そのあとの post.py --date が、外した SNS にだけ出し直す）。
- 消せなかった SNS は記録を残す（二重に出さない）。その SNS は手で消してから、記録を外して出し直す。
- TikTok（tt）は触らない（自動では出していない）。
- 取り消せない操作なので、オーナーの指示があった時だけ使う。
"""
import json, os, pathlib, sys
import requests

AUTO = pathlib.Path(__file__).resolve().parent
G = "https://graph.facebook.com/v21.0"
TH = "https://graph.threads.net/v1.0"
KEYS = ["yt", "facebook", "ig", "threads", "ig_story", "fb_story"]


def log(*a): print("[unpost]", *a, flush=True)


def _ok(r):
    try: j = r.json()
    except Exception: j = {}
    if r.status_code < 300 and (j.get("success") is True or j == {} or j.get("deleted") is True or r.status_code == 204): return True, ""
    e = j.get("error") if isinstance(j, dict) else None
    return False, (str(e.get("message", ""))[:140] if isinstance(e, dict) else f"HTTP {r.status_code}")


def page_token(http=requests):
    import facebook as fb
    d = fb.diagnose(os.environ, http)
    return d.get("token") if isinstance(d, dict) else None


def delete_one(key, rid, http=requests, cache={}):
    if key == "yt":
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token", client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
        build("youtube", "v3", credentials=creds).videos().delete(id=rid).execute(); return True, ""
    if key == "threads":
        return _ok(http.delete(f"{TH}/{rid}", params={"access_token": os.environ["THREADS_ACCESS_TOKEN"]}))
    if key in ("ig", "ig_story"):
        return _ok(http.delete(f"{G}/{rid}", params={"access_token": os.environ["IG_ACCESS_TOKEN"]}))
    if "tok" not in cache: cache["tok"] = page_token(http)
    tok = cache["tok"]
    if not tok: return False, "ページのトークンが取れない"
    return _ok(http.delete(f"{G}/{rid}", params={"access_token": tok}))


def main(argv):
    date = argv[0]; dry = "--dry-run" in argv
    f = AUTO / "posted.json"; posted = json.loads(f.read_text())
    todo = [k for k in posted if k.startswith(date)]
    if not todo: log(date, "の記録がない"); return 0
    left = 0
    for k in todo:
        rec = posted[k]
        for key in KEYS:
            rid = rec.get(key)
            if not rid or rid in ("manual", "skip", "bs-scheduled"): continue
            if dry: log(k, key, rid, "を消す（dry）"); continue
            try: ok, why = delete_one(key, str(rid))
            except Exception as e: ok, why = False, f"{type(e).__name__}: {str(e)[:140]}"
            if ok:
                log(k, key, "消した"); rec.pop(key, None); rec.pop(key + "_at", None)
            else:
                left += 1; log(k, key, "消せなかった（記録は残す）:", why)
        if not dry and rec.get("tt") == "manual":
            # TikTok は手で出す回。記録を外すと、出し直しのときに置き場の tt_ の動画も新しい絵に差し替わる
            # （2026-11-15：外さなかったので、置き場に古い「ちかちか」の動画が残った）
            rec.pop("tt", None); log(k, "tt", "手動の記録を外した（動画を置き直す）")
        if not dry: f.write_text(json.dumps(posted, ensure_ascii=False, indent=2))
    log("消せなかった数", left)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
