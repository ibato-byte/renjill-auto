#!/usr/bin/env python3
"""これまでに出した短い動画を、全部の SNS から消す（2026-11-23 オーナーの指示：「これまでにアップした全ての動画を削除して」。作業用BGMの長い動画は除く）。

  python auto/unpost_all.py --dry-run   # 何を消すかだけ見る
  python auto/unpost_all.py             # 消す（取り消せない）

- posted.json に投稿IDがある回だけを消す（YouTube・Facebook・Instagram・Threads）。IDが無い投稿（2026-11-24 の新シリーズなど、手で予約した回）と長い動画には触らない。
- 消せた SNS は、記録を "manual" に置きかえ（ほかの仕組みが「未投稿」と見て出し直さないため）、元のIDは <SNS>_deleted に残す。
- ストーリーズは24時間で消えているので触らない。TikTok・X は API で消せないので触らない（手で消す）。
- 取り消せない操作なので、オーナーの指示があった時だけ使う。
"""
import datetime as dt, json, pathlib, sys
import unpost

AUTO = pathlib.Path(__file__).resolve().parent
KEYS = ["yt", "facebook", "ig", "threads"]
SKIP = ("manual", "skip", "bs-scheduled")


def main(argv):
    dry = "--dry-run" in argv
    f = AUTO / "posted.json"; posted = json.loads(f.read_text())
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=9))).strftime("%Y-%m-%dT%H:%M+09:00")
    done = left = 0
    for k in sorted(posted):
        rec = posted[k]
        for key in KEYS:
            rid = rec.get(key)
            if not rid or rid in SKIP: continue
            if dry: unpost.log(k, key, rid, "を消す（dry）"); continue
            try: ok, why = unpost.delete_one(key, str(rid))
            except Exception as e: ok, why = False, f"{type(e).__name__}: {str(e)[:140]}"
            if ok:
                done += 1; unpost.log(k, key, "消した")
                rec[key + "_deleted"] = rid; rec[key] = "manual"; rec["deleted_at"] = now; rec["skip_sns_check"] = True
            else:
                left += 1; unpost.log(k, key, "消せなかった（記録は残す）:", why)
        if not dry: f.write_text(json.dumps(posted, ensure_ascii=False, indent=2))
    unpost.log("消した数", done, "／消せなかった数", left)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
