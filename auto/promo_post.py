#!/usr/bin/env python3
"""ゲーム「チモシーダッシュ」の紹介動画（できあがった動画）を Instagram・Facebook・YouTube に出す（オーナー依頼 2026-11-04、Hub #209）
- エピソード（rig で描く回）ではないので post.py の予定表には入れず、このファイルだけで出す（新作の数え方 novelty にも入らない）
- 動画と表紙は公開済みの URL から取る（PROMO_BASE。既定は https://hay-dash.coana.co.jp/promo/）
  promo_s.mp4＝文字入り（Instagram・Facebook・ストーリーズ）、promo_yt.mp4＝文字なし（YouTube。依頼 #124）、
  promo_cover.jpg＝いつもの型の表紙（金の枠・英語の一言・REN & JILL。Instagram・Facebook）
- 二重投稿しない：auto/posted.json の "<最初に出した日>_<PROMO_ID>" に出した SNS を記録し、記録がある SNS は飛ばす
- `python auto/promo_post.py --dry-run` で送る内容だけ表示（API を呼ばない・何も書かない）
- 1つの SNS が失敗しても他は続ける。失敗があれば終了コード 1
"""
import datetime as dt, json, os, pathlib, sys
import requests
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import post as P
import facebook as fb
import stories

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUTO, DIST = ROOT / "auto", ROOT / "dist"
JST = dt.timezone(dt.timedelta(hours=9))
BASE = os.environ.get("PROMO_BASE", "https://hay-dash.coana.co.jp/promo/")
PROMO_ID = os.environ.get("PROMO_ID", "promo_hay_dash")
GAME = "https://hay-dash.coana.co.jp/"
ORDER = ["ig", "facebook", "yt", "ig_story", "fb_story"]


def promo(today):
    return {"ep": PROMO_ID, "no": 0, "date": today, "slot": "promo", "tag_set": "A", "title": "チモシーダッシュ",
            "caption_en": "The boss overslept. Run! Our free bunny game is here.",
            "caption_ja": "寝坊した課長と、東京を走って出社。無料のゲームができました。",
            "cta": "Ren or Jill — who do you run as? / レンとジル、どっちで走る？"}


def fetch(name):
    DIST.mkdir(exist_ok=True)
    out = DIST / f"{PROMO_ID}_{name}"
    r = requests.get(BASE + name, timeout=120)
    r.raise_for_status()
    if len(r.content) < 10000: raise RuntimeError(f"{name} が小さすぎる（{len(r.content)} バイト）")
    out.write_bytes(r.content)
    return out


def find_key(posted):
    for k in posted:
        if k.endswith("_" + PROMO_ID): return k
    return None


def post_youtube(p, d, path):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    yt = build("youtube", "v3", credentials=creds)
    title = "Free bunny running game | Ren & Jill: Hay Dash #Shorts"
    desc = f"{p['caption_en']}\n{p['caption_ja']}\n\nPlay free (no sign-up): {GAME}\n無料・登録なしで遊べます：{GAME}\n\n{P.tags(p, d)}"
    loc = {"ja": {"title": "寝坊した課長と東京ダッシュ｜無料ゲーム『レンとジルのチモシーダッシュ』 #Shorts", "description": desc},
           "zh-Hant": {"title": "和睡過頭的課長衝過東京｜免費遊戲「Ren & Jill：Hay Dash」 #Shorts", "description": desc},
           "ko": {"title": "늦잠 잔 과장님과 도쿄 질주｜무료 게임 「Ren & Jill: Hay Dash」 #Shorts", "description": desc}}
    body = {"snippet": {"title": title, "description": desc, "categoryId": "20", "defaultLanguage": "en"}, "localizations": loc,
            "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False}}
    res = yt.videos().insert(part="snippet,status,localizations", body=body,
                             media_body=MediaFileUpload(str(path), chunksize=-1, resumable=True)).execute()
    # 文字入りの表紙は送らない（YouTube は文字なしにそろえる。依頼 #124）
    return res["id"]


def main(argv):
    dry = "--dry-run" in argv or os.environ.get("DRY_RUN", "") not in ("", "0", "false")
    now = dt.datetime.now(JST); today = now.strftime("%Y-%m-%d")
    sch = json.loads((AUTO / "schedule.json").read_text()); d = sch["defaults"]
    pf = AUTO / "posted.json"
    posted = json.loads(pf.read_text()) if pf.exists() else {}
    key = find_key(posted) or f"{today}_{PROMO_ID}"
    p = promo(key.split("_")[0])
    rec = posted.get(key, {})
    todo = [x for x in ORDER if not rec.get(x)]
    print("[promo] key", key, "done", sorted(k for k in rec if not k.endswith("_at")), "todo", todo, flush=True)
    if dry:
        print("[promo] DRY-RUN caption:\n" + P.caption(p, d))
        print("[promo] DRY-RUN files:", BASE + "promo_s.mp4", BASE + "promo_yt.mp4", BASE + "promo_cover.jpg")
        return 0
    if not todo: print("[promo] すべて投稿済み"); return 0
    video, cover = fetch("promo_s.mp4"), fetch("promo_cover.jpg")
    yt_video = fetch("promo_yt.mp4") if "yt" in todo else None
    rec = posted.setdefault(key, {"title": "ゲーム紹介：チモシーダッシュ", "promo": 1})
    access, failed = None, []
    for pl in todo:
        try:
            if pl in ("ig", "facebook", "ig_story", "fb_story") and access is None:
                access = fb.diagnose()
                for r in access.get("reasons", []): print("[promo] Meta:", fb.scrub(r), flush=True)
            if pl == "ig":
                rec["ig"] = P.post_instagram(p, d, video, cover, uid=access.get("ig_user_id"))
            elif pl == "facebook":
                info = {}
                rec["facebook"] = fb.post(p, d, video, access=access, log=lambda *a: print("[promo]", *a, flush=True), thumb_path=cover, info=info)
                if rec["facebook"]:
                    try: fb.ensure_thumbnail(rec["facebook"], access["token"], cover)
                    except Exception as e: print("[promo] FB の表紙の確認に失敗", fb.scrub(repr(e))[:200])
            elif pl == "yt":
                rec["yt"] = post_youtube(p, d, yt_video)
            elif pl == "ig_story":
                if not rec.get("ig"): raise stories.StorySkip("本編が出ていない")
                sv = stories.build_story_video(p, video, DIST / f"{PROMO_ID}_story.mp4")
                url = P.media_publish(sv, f"{now.strftime('%Y%m%d')}_{PROMO_ID}_story.mp4")
                rec["ig_story"] = stories.post_ig_story(access["ig_user_id"], os.environ["IG_ACCESS_TOKEN"], url)
            elif pl == "fb_story":
                if not rec.get("facebook") or not access.get("ok"): raise stories.StorySkip("本編が出ていない・権限なし")
                sv = DIST / f"{PROMO_ID}_story.mp4"
                if not sv.exists(): stories.build_story_video(p, video, sv)
                rec["fb_story"] = stories.post_fb_story(access["page_id"], access["token"], sv)
            rec[pl + "_at"] = dt.datetime.now(JST).isoformat(timespec="minutes")
            print("[promo] OK", pl, rec.get(pl), flush=True)
        except stories.StorySkip as e:
            print("[promo] SKIP", pl, e, flush=True)
        except Exception as e:
            print("[promo] NG", pl, fb.scrub(repr(e))[:500], flush=True); failed.append(pl)
        pf.write_text(json.dumps(posted, ensure_ascii=False, indent=2))  # 1件ごとに書く（途中で止まっても二重に出さない）
    if failed: print("[promo] 失敗:", failed); return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
