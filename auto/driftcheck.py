#!/usr/bin/env python3
"""手で予約した TikTok・YouTube の投稿が、最新の予定表（schedule.json）の文言とずれていないか調べる（Hub 依頼 #113）。

  python auto/driftcheck.py                      … 調べる。ずれていれば dist/drift_hub_args に Hub への「あなたの番」を書く
  python auto/driftcheck.py --reserved ep …      … 手で予約した回を記録する（その時点の文言を auto/manual_texts.json に保存）

posted.json で tt/yt が "manual" の、まだ時刻が来ていない回が対象。予約したときの文言（manual_texts.json）と今の文言を比べる。
記録がない回は「予約時の文言が不明」として、今の文言を貼り直す案内を出す。
"""
import datetime as dt, hashlib, json, pathlib, sys

AUTO = pathlib.Path(__file__).resolve().parent
DIST = AUTO.parent / "dist"
JST = dt.timezone(dt.timedelta(hours=9))
SNS = {"tt": "TikTok", "yt": "YouTube"}
LABEL = {"title": "題名（動画の名前）", "caption_en": "英語の投稿文", "caption_ja": "日本語の投稿文", "hook": "表紙の文字", "tags": "ハッシュタグ"}


def texts(p, d):
    return {"title": p["title"], "caption_en": p["caption_en"], "caption_ja": p["caption_ja"],
            "hook": p.get("thumb", {}).get("hook", ""), "tags": d["tag_sets"][p.get("tag_set", "A")]}


def fp(t): return hashlib.sha256(json.dumps(t, ensure_ascii=False, sort_keys=True).encode()).hexdigest()[:12]


def at(p):
    h, m = map(int, p["slot"].split(":"))
    return dt.datetime.fromisoformat(p["date"]).replace(hour=h, minute=m, tzinfo=JST)


def find(sch, posted, saved, now):
    """[(p, sns, 食い違った項目（{項目: (予約時, 今)}）or None（記録なし）)]"""
    out = []
    for p in sch["posts"]:
        if at(p) <= now: continue
        k = f'{p["date"]}_{p["ep"]}'
        sns = [x for x in SNS if posted.get(k, {}).get(x) == "manual"]
        if not sns: continue
        cur, old = texts(p, sch["defaults"]), saved.get(k)
        if old is None: out.append((p, sns, None))
        elif fp(cur) != fp(old["texts"]):
            out.append((p, sns, {f: (old["texts"].get(f, ""), cur[f]) for f in cur if cur[f] != old["texts"].get(f, "")}))
    return out


def reserved(sch, saved, eps, now):
    for p in sch["posts"]:
        if p["ep"] in eps: saved[f'{p["date"]}_{p["ep"]}'] = {"texts": texts(p, sch["defaults"]), "at": now.isoformat(timespec="minutes")}


def task(p, sns, diff):
    names = "・".join(SNS[x] for x in sns)
    when = f'{p["date"][5:].replace("-", "/")} {p["slot"]}'
    head = f'{names}に手で予約した「{p["title"]}」（{when}）を、最新の文言に直す'
    if diff is None:
        body = "予約したときの文言の記録がないため、ずれがないか確かめられません。念のため次の文言に貼り直してください。\n"
        body += "\n".join(f'{LABEL[f]}：{v}' for f, v in texts(p, json.loads((AUTO / "schedule.json").read_text())["defaults"]).items())
    else:
        body = "\n".join(f'【{LABEL[f]}】\n  予約時：{o}\n  最新（貼る文）：{n}' for f, (o, n) in diff.items())
    return {"id": f'drift-{p["date"]}-{p["ep"]}', "text": head, "kind": "manual", "due": p["date"], "copy": body, "key": "renjill-manual-drift"}


def main(argv):
    sch = json.loads((AUTO / "schedule.json").read_text())
    pf, sf = AUTO / "posted.json", AUTO / "manual_texts.json"
    posted = json.loads(pf.read_text()) if pf.exists() else {}
    saved = json.loads(sf.read_text()) if sf.exists() else {}
    now = dt.datetime.now(JST)
    if argv[:1] == ["--reserved"]:
        reserved(sch, saved, set(argv[1:]), now); sf.write_text(json.dumps(saved, ensure_ascii=False, indent=2)); print("記録しました：", *argv[1:]); return 0
    found = find(sch, posted, saved, now)
    for p, sns, diff in found:
        print(f'ずれ：{p["date"]} {p["ep"]}（{"・".join(SNS[x] for x in sns)}）', "予約時の記録なし" if diff is None else "・".join(LABEL[f] for f in diff))
    if not found: print("手で予約した投稿に、最新の文言とのずれはありません")
    DIST.mkdir(exist_ok=True)
    args = ["--kpi", f"手動予約の文言のずれ={len(found)}件"]
    args += [x for p, s, d in found for x in ("--owner-task", json.dumps(task(p, s, d), ensure_ascii=False))] if found else ["--owner-action", "none"]
    (DIST / "drift_hub_args").write_bytes(b"\0".join(s.encode() for s in args) + b"\0")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
