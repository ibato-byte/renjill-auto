#!/usr/bin/env python3
"""コメントへの自動返信（依頼 #37-2）。Instagram・Facebook・YouTube の自分たちの投稿に付いたコメントに、レンとジルらしい短い返事を返す。
決まり：
- 最初は「候補を記録するだけ」（auto/reply_mode.json の mode が "draft"）。問題がないことを確かめて "live" にしてから実際に返す
- 1日に返す数の上限（SNS ごと）。同じ文を 14 日以内に繰り返さない
- 宣伝・リンクは書かない。質問・悪口・個人情報・政治などの話題には返さない。不適切なコメントは非表示にする（削除はしない）
- 返した記録を auto/replies.json に残し、同じコメントに二重に返さない
- 返事は決まった型から選ぶ（Claude を使わない）
`python auto/comments.py [--dry-run]`。--dry-run はネットワークに出ない（posted.json のコメント取得もしない）
"""
import datetime as dt, hashlib, json, os, pathlib, re, sys
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUTO = ROOT / "auto"
JST = dt.timezone(dt.timedelta(hours=9))
G = "https://graph.facebook.com/v21.0"
NOT_ID = ("manual", "bs-scheduled")
DAILY_LIMIT = 8            # SNS ごとの 1 日の返信（または候補）の上限
LOOKBACK_DAYS = 7          # 何日前までの投稿を見るか
NO_REPEAT_DAYS = 14
MAX_LEN = 60               # 長いコメントは、意図が読み取れないので返さない

REPLIES = {
    "praise": ["ありがとうございます！課長も喜びます🐰", "見てくださって嬉しいです。ジルも小さくうなずいています", "Thank you! Ren is pretending he knew it all along 🐰",
               "ありがとうございます。次の回もお楽しみに", "Jill says thank you (silently) 🐰", "うれしいです。課長には内緒にしておきます"],
    "relate": ["わかります…職場にもいますよね", "あるあるですよね。ジルも深くうなずいています", "Right? Every office has a Ren 🐰",
               "ご共感ありがとうございます。月曜もがんばりましょう", "Same here! Jill sees everything 🐰", "そうなんです。課長は悪気がないんです"],
    "cute": ["かわいいと言ってもらえて、レンが耳をぴくぴくさせています", "ありがとうございます！たれ耳が自慢です", "Thanks! The lop ears are Ren's pride 🐰",
             "ジルも照れています", "うさぎ好きさんに届いて嬉しいです", "Aww, thank you 🐰"],
    "laugh": ["笑ってもらえて嬉しいです", "ありがとうございます。次もどうぞ", "Glad it made you smile 🐰", "くすっとしてもらえたら大成功です", "Ren will be thrilled (he won't notice) 🐰"],
}
KEYWORDS = {
    "praise": ["好き", "最高", "すごい", "良い", "いい", "素敵", "ありがとう", "love", "great", "nice", "best", "👏", "❤", "💕", "🥰"],
    "relate": ["あるある", "いる", "うちの", "わかる", "分かる", "同じ", "same", "relatable", "me too", "上司", "課長", "月曜"],
    "cute": ["かわいい", "可愛い", "癒", "cute", "adorable", "うさぎ", "🐰", "🐇", "ふわふわ"],
    "laugh": ["笑", "草", "ww", "lol", "haha", "😂", "🤣", "くすっ"],
}
# 返さない：質問・悪口・個人情報・政治・宣伝など。見つかったら返事を作らない（悪口・宣伝は非表示にする）
SKIP_PATTERNS = [r"[?？]", r"どう(?:して|やって|すれば)", r"教えて", r"なんで", r"いつ", r"どこ", r"誰", r"how\b", r"what\b", r"why\b", r"when\b", r"where\b", r"\bwho\b",
                 r"選挙", r"政治", r"政党", r"首相", r"大統領", r"戦争", r"宗教", r"election", r"politic", r"president",
                 r"病気", r"死", r"自殺", r"うつ", r"訴", r"弁護士", r"給料", r"年収", r"退職", r"パワハラ", r"セクハラ"]
HIDE_PATTERNS = [r"https?://", r"www\.", r"\.com\b", r"@\w{3,}", r"line\.me", r"dm(?:me|ください)", r"副業", r"稼げ", r"儲", r"フォロバ", r"相互", r"プレゼント企画", r"click", r"subscribe to my", r"check my",
                 r"死ね", r"きもい", r"キモ", r"うざ", r"ばか", r"バカ", r"アホ", r"クソ", r"つまらん", r"消えろ", r"fuck", r"shit", r"stupid", r"trash", r"\bhate\b"]
PERSONAL = [r"\d{2,4}[-\s]?\d{2,4}[-\s]?\d{3,4}", r"[\w.+-]+@[\w-]+\.[\w.]+", r"〒?\d{3}-\d{4}"]


def classify(text):
    """('reply', 型) / ('hide', 理由) / ('skip', 理由)"""
    t = (text or "").strip()
    if not t: return "skip", "空"
    low = t.lower()
    for pat in PERSONAL:
        if re.search(pat, t): return "hide", "個人情報のおそれ"
    for pat in HIDE_PATTERNS:
        if re.search(pat, low): return "hide", "宣伝・リンク・悪口"
    for pat in SKIP_PATTERNS:
        if re.search(pat, low): return "skip", "質問や慎重な話題"
    if len(t) > MAX_LEN: return "skip", "長いコメント"
    for kind in ("relate", "laugh", "cute", "praise"):
        if any(k.lower() in low for k in KEYWORDS[kind]): return "reply", kind
    return "skip", "内容を判断できない"


def pick_reply(kind, cid, recent):
    """型の中から、14 日以内に使っていない文を選ぶ（コメント ID から決まる＝同じコメントなら同じ候補）。残りがなければ None"""
    pool = [r for r in REPLIES[kind] if r not in recent]
    if not pool: return None
    h = int(hashlib.sha256(cid.encode()).hexdigest(), 16)
    return pool[h % len(pool)]


def load_mode(path=AUTO / "reply_mode.json"):
    try: m = json.loads(pathlib.Path(path).read_text()).get("mode", "draft")
    except FileNotFoundError: m = "draft"
    return m if m in ("draft", "live") else "draft"


def plan(comments, state, now, mode):
    """comments：[{platform, id, text, own, media}]。state：replies.json の中身。戻り値：[(コメント, 動作, 返事または理由)]。
    状態の更新はしない（呼び出し側が実行できたものだけ記録する）"""
    today = now.strftime("%Y-%m-%d")
    cutoff = (now - dt.timedelta(days=NO_REPEAT_DAYS)).strftime("%Y-%m-%d")
    recent = {v["reply"] for v in state.values() if v.get("reply") and v.get("at", "")[:10] >= cutoff}
    count = {}
    for v in state.values():
        if v.get("reply") and v.get("at", "")[:10] == today: count[v["platform"]] = count.get(v["platform"], 0) + 1
    out = []
    for c in comments:
        key = f'{c["platform"]}:{c["id"]}'
        if key in state or c.get("own"): continue  # 返した・見た記録がある／自分たちのコメント
        act, what = classify(c["text"])
        if act == "reply":
            if count.get(c["platform"], 0) >= DAILY_LIMIT: out.append((c, "skip", "今日の上限")); continue
            r = pick_reply(what, c["id"], recent)
            if r is None: out.append((c, "skip", "同じ文を繰り返さないため見送り")); continue
            recent.add(r); count[c["platform"]] = count.get(c["platform"], 0) + 1
            out.append((c, "reply", r))
        else:
            out.append((c, act, what))
    return out


# ---------- 取得・実行（SNS ごと）。引数 http は requests 互換 ----------
def recent_posts(posted, now):
    """直近 LOOKBACK_DAYS の投稿 → [(platform, 投稿ID)]"""
    out = []
    for key, rec in posted.items():
        try: day = dt.date.fromisoformat(key.split("_")[0])
        except ValueError: continue
        if (now.date() - day).days > LOOKBACK_DAYS: continue
        for pl in ("ig", "facebook", "yt"):
            if rec.get(pl) and rec[pl] not in NOT_ID: out.append((pl, rec[pl]))
    return out


def fetch_meta(platform, media_id, tok, http=requests):
    if platform == "ig":
        r = http.get(f"{G}/{media_id}/comments", params={"fields": "id,text,username,timestamp", "limit": 50, "access_token": tok}).json()
        key = "text"
    else:
        r = http.get(f"{G}/{media_id}/comments", params={"fields": "id,message,from,created_time", "filter": "toplevel", "limit": 50, "access_token": tok}).json()
        key = "message"
    if "error" in r: raise PermissionError(str(r["error"].get("message", ""))[:120])
    return [{"platform": platform, "id": c["id"], "text": c.get(key, ""), "media": media_id, "own": False} for c in r.get("data", [])]


def reply_meta(platform, cid, text, tok, http=requests):
    url = f"{G}/{cid}/replies" if platform == "ig" else f"{G}/{cid}/comments"
    r = http.post(url, data={"message": text, "access_token": tok}).json()
    if "id" not in r: raise RuntimeError(str(r)[:200])
    return r["id"]


def hide_meta(platform, cid, tok, http=requests):
    r = http.post(f"{G}/{cid}", data={("hide" if platform == "ig" else "is_hidden"): "true", "access_token": tok}).json()
    if not r.get("success"): raise RuntimeError(str(r)[:200])


def yt_client():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"])
    return build("youtube", "v3", credentials=creds)


def fetch_yt(yt, video_id):
    r = yt.commentThreads().list(part="snippet", videoId=video_id, maxResults=50, textFormat="plainText").execute()
    out = []
    for it in r.get("items", []):
        top = it["snippet"]["topLevelComment"]
        out.append({"platform": "yt", "id": top["id"], "text": top["snippet"].get("textDisplay", ""), "media": video_id,
                    "own": top["snippet"].get("authorChannelId", {}).get("value") == it["snippet"].get("channelId") and bool(it["snippet"].get("channelId")),
                    "replied": it["snippet"].get("totalReplyCount", 0) > 0})
    return out


def run(now=None, dry_run=False, log=print, http=requests):
    now = now or dt.datetime.now(JST)
    mode = load_mode()
    state_f = AUTO / "replies.json"
    state = json.loads(state_f.read_text()) if state_f.exists() else {}
    posted = json.loads((AUTO / "posted.json").read_text())
    summary = {"mode": mode, "candidates": 0, "replied": 0, "hidden": 0, "skipped": 0, "problems": []}
    if dry_run:
        for t in ["最高でした！", "うちの課長みたい", "かわいい🐰", "副業はこちら https://x.example", "これはどこで買えますか？"]:
            log("  ", t, "→", classify(t))
        return summary
    tok = os.environ.get("IG_ACCESS_TOKEN")
    yt = None
    comments = []
    for pl, mid in recent_posts(posted, now):
        try:
            if pl in ("ig", "facebook"):
                if not tok: continue
                if pl == "facebook":
                    import facebook as fb
                    acc = fb.diagnose()
                    if not acc.get("ok"): summary["problems"].append("Facebook の権限なし"); continue
                    ptok = acc["token"]
                else: ptok = tok
                for c in fetch_meta(pl, mid, ptok, http): c["tok"] = ptok; comments.append(c)
            elif pl == "yt" and os.environ.get("YT_REFRESH_TOKEN"):
                yt = yt or yt_client()
                comments += [c for c in fetch_yt(yt, mid) if not c.get("replied")]
        except PermissionError as e:
            summary["problems"].append(f"{pl}: コメントの権限なし（{e}）")
        except Exception as e:
            summary["problems"].append(f"{pl}: 取得に失敗（{type(e).__name__}）")
    tokmap = {(c["platform"], c["id"]): c.get("tok") for c in comments}
    for c, act, what in plan(comments, state, now, mode):
        key = f'{c["platform"]}:{c["id"]}'
        at = now.isoformat(timespec="minutes")
        try:
            if act == "reply":
                summary["candidates"] += 1
                if mode == "live":
                    if c["platform"] == "yt":
                        yt.comments().insert(part="snippet", body={"snippet": {"parentId": c["id"], "textOriginal": what}}).execute()
                    else:
                        reply_meta(c["platform"], c["id"], what, tokmap[(c["platform"], c["id"])], http)
                    summary["replied"] += 1
                state[key] = {"platform": c["platform"], "mode": mode, "reply": what, "text": c["text"][:80], "at": at}
            elif act == "hide":
                if mode == "live":
                    if c["platform"] == "yt":
                        yt.comments().setModerationStatus(id=c["id"], moderationStatus="heldForReview").execute()
                    else:
                        hide_meta(c["platform"], c["id"], tokmap[(c["platform"], c["id"])], http)
                    summary["hidden"] += 1
                state[key] = {"platform": c["platform"], "mode": mode, "hide": what, "text": c["text"][:80], "at": at}
            else:
                summary["skipped"] += 1
                state[key] = {"platform": c["platform"], "mode": mode, "skip": what, "at": at}
        except Exception as e:
            summary["problems"].append(f'{c["platform"]}: 返信・非表示に失敗（{type(e).__name__}）')
    state_f.write_text(json.dumps(state, ensure_ascii=False, indent=1))
    return summary


if __name__ == "__main__":
    s = run(dry_run="--dry-run" in sys.argv)
    print("[comments]", json.dumps(s, ensure_ascii=False))
    pathlib.Path(ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "comments_summary.json").write_text(json.dumps(s, ensure_ascii=False))
