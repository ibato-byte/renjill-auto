#!/usr/bin/env python3
"""台本（rig/ep/*.js）と予定（schedule.json）の決まりの検査（総見直し 2026-11-10・OVERHAUL の A/D/E/F/G）。

  python3 auto/epcheck.py [--days 14]   … 今日以降の予定の回を検査。不合格があれば終了コード 2

決まりは目安（オーナー 2026-11-10：「決まりは常に変化していい。大事なのは質と結果。最終的な作品が最高になれば良い」）。
ここで見つかるのは「見直すきっかけ」。絵で見て良ければ決まりを破ってよいし、数字で効かない決まりは変える・捨てる。
不合格（ISSUE）にするのは、明らかな不具合だけ（今は該当なし。壊れた絵・表紙は rig/qa.js と rig/thumb.js が止める）。

検査すること（WARN＝知らせる）
- 途中の字幕（CHIP）の数：2回以上は WARN（目安は1回。冒頭の一言で状況は伝わる。言葉を入れすぎると世界観が崩れる＝オーナー 2026-11-10）… 156・157・174
- 字幕の長さ：英語 24 文字・日本語 18 文字を超えたら WARN                    … 38・159
- 冒頭の一言（pace.js の hook）：英語 5 語以上は WARN（3〜4 語）            … 136
- 尺：画面に出る長さが 7〜12 秒の外なら WARN                               … 5・143
- 同じ効果音の組み合わせ：「目立つ音」（pon/boing/chime/thump/flop）が3日続けて同じなら WARN … 127
- 同じ部屋：前の3話と同じ見た目（rig/v2/looks.js）なら WARN                … 179
- 小物の名前（L.xxx の小物）が3日続けて同じなら WARN                        … 15・180
- 字幕でオチを言う言葉（DONE / FINALLY / 結局 / オチ など）が2回目の字幕にあれば WARN … 26・157
- 腕（common.js の limb()）を使う回は ISSUE（レンとジルには元のデザインに腕がない。2026-11-10「変なところから腕が生える」→ 11-11 最後の1枚を口でくわえる形に作り直し。
  まだ出ていない回で二度と使わない。持つ・運ぶは口でくわえる・頭や体で押す・鼻で押す）… 298
- 冒頭の一言（pace.js）と表紙の文字（schedule.json の thumb.hook）が違えば WARN（2026-11-12）… 138
- 字幕が画面に出ている時間が 1.2 秒未満なら WARN（読み切れない。画面上の秒＝台本の秒÷速さ。2026-11-12）… 161
- 「…」を3回以上使う回は WARN（間を文字で埋めない。2026-11-12）… 164
- 字幕の英語に 11 文字以上の長い単語があれば WARN（海外の人がひと目で読める単語に。2026-11-12）… 166
- キャラの svg を CSS で 1.2 倍未満に縮めて「画面の中」に置く回は ISSUE（2026-11-13：wifi・mute で画面の中のレンが
  画面の高さの20%しかなく小さかった → 大きな画面＋pose の scale 1.75 に作り直し。縮めずに pose の x・y・scale で置く）… 112
"""
import datetime as dt, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EP = ROOT / "rig" / "ep"
JST = dt.timezone(dt.timedelta(hours=9))
LOUD = {"pon", "boing", "chime", "thump", "flop"}
PROPS = {"laptop", "papers", "bag", "chair", "hayStrand", "stamp", "stamper", "digital", "clock"}
PUNCH = re.compile(r"\b(DONE|FINALLY|SOLVED|THE END)\b|結局|オチ|解決|おわり", re.I)
_LIMB = re.compile(r"(?<![\w.])limb\(")


def uses_limb(src):
    """コメント（// 以降）を除いて limb( を呼んでいるか"""
    return any(_LIMB.search(line.split("//", 1)[0]) for line in src.splitlines())


_CHIP = re.compile(r"CHIP\(L,\s*(['\"])(.*?)(?<!\\)\1\s*,\s*(['\"])(.*?)(?<!\\)\3")
_CHIPWIN = re.compile(r"t\s*>\s*([\d.]+)\s*&&\s*t\s*<\s*([\d.]+)\s*\?\s*CHIP\(")
_LONGWORD = re.compile(r"[A-Za-z]{11,}")


_SHRINK = re.compile(r"style\.transform\s*=\s*`[^`]*scale\(\s*([\d.]+)\s*\)")


def shrinks(src):
    """キャラの svg を CSS の transform で 1.2 倍未満に縮めているか（コメントを除く）"""
    return any(float(v) < 1.2 for line in src.splitlines() for v in _SHRINK.findall(line.split("//", 1)[0]))


def chip_windows(src):
    """字幕（CHIP）の出ている時間（台本の秒）。「t > A && t < B ? CHIP(」の形だけ数える"""
    return [float(b) - float(a) for a, b in _CHIPWIN.findall(src)]


def captions(src):
    return [(m.group(2), m.group(4)) for m in _CHIP.finditer(src)]


def pace():
    src = (ROOT / "rig" / "pace.js").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"(?:PACE_ALL\.(\w+)\s*=\s*|^\s*(\w+):\s*)\{\s*start:\s*([\d.]+),\s*speed:\s*([\d.]+),\s*hook:\s*'([^']*)'", src, re.M):
        out[m.group(1) or m.group(2)] = {"start": float(m.group(3)), "speed": float(m.group(4)), "hook": m.group(5)}
    return out


def info(ep, pc):
    f = EP / f"{ep}.js"
    if not f.exists():
        return None
    src = f.read_text(encoding="utf-8")
    m = re.search(r"dur:\s*([\d.]+)", src)
    dur = float(m.group(1)) if m else None
    p = pc.get(ep, {"start": 0, "speed": 1, "hook": ""})
    return {
        "caps": captions(src),
        "chipwin": chip_windows(src),
        "ellipsis": sum(line.split("//", 1)[0].count("…") for line in src.splitlines()),
        "speed": p["speed"],
        "limb": uses_limb(src),
        "shrink": shrinks(src),
        "out": (dur - p["start"]) / p["speed"] if dur else None,
        "hook": p["hook"],
        "loud": frozenset(re.findall(r"type:\s*'([a-z]+)'", src)) & LOUD,
        "props": frozenset(re.findall(r"L\.(\w+)\(", src)) & PROPS,
    }


def looks():
    f = ROOT / "rig" / "v2" / "looks.js"
    return {k: int(v) for k, v in re.findall(r'"(\w+)":\s*(\d)', f.read_text())} if f.exists() else {}


def check(posts, today, days=14, pc=None, lk=None):
    """posts は schedule.json の posts。thumb.hook があれば冒頭の一言（pace.js）とそろっているかも見る"""
    pc = pace() if pc is None else pc
    lk = looks() if lk is None else lk
    rows = sorted([p for p in posts if p.get("ep")], key=lambda p: (p["date"], p.get("slot", "")))
    end = (today + dt.timedelta(days=days)).isoformat()
    issues, warns, hist = [], [], []
    for p in rows:
        ep, d = p["ep"], p["date"]
        i = info(ep, pc)
        if i is None:
            continue
        cur = d >= today.isoformat() and d < end
        tag = f"{d} {ep}"
        if cur:
            if i["limb"]:
                issues.append(f"{tag}: 腕（limb()）を描いている。レンとジルには腕がない：口でくわえる・頭や体で押す形に作り直す")
            if i.get("shrink"):
                issues.append(f"{tag}: キャラを CSS で縮めて置いている（画面の中のキャラが小さくなる）：pose の x・y・scale で大きく置く（画面の高さの35%以上）")
            if len(i["caps"]) > 1:
                warns.append(f"{tag}: 途中の字幕が{len(i['caps'])}回（1回まで。言葉を入れすぎると世界観が崩れる・オチは絵で見せる。2026-11-10 オーナー）")
            for en, ja in i["caps"]:
                if len(en) > 24: warns.append(f"{tag}: 字幕の英語が長い（{len(en)}文字）「{en}」")
                if len(ja) > 18: warns.append(f"{tag}: 字幕の日本語が長い（{len(ja)}文字）「{ja}」")
            if i["caps"] and PUNCH.search(" ".join(i["caps"][-1])):
                warns.append(f"{tag}: 最後の字幕がオチを言っている「{i['caps'][-1][0]}」")
            th = (p.get("thumb") or {}).get("hook")
            if th and i["hook"] and th != i["hook"]:
                warns.append(f"{tag}: 冒頭の一言と表紙の文字が違う（pace.js「{i['hook']}」／schedule.json「{th}」）")
            for w in i["chipwin"]:
                if w / (i["speed"] or 1) < 1.2: warns.append(f"{tag}: 字幕の出ている時間が{w / (i['speed'] or 1):.1f}秒（1.2秒以上に。読み切れない）")
            if i["ellipsis"] >= 3: warns.append(f"{tag}: 「…」が{i['ellipsis']}回（間を文字で埋めない。絵と動きで）")
            for en_, _ja in i["caps"]:
                for w in _LONGWORD.findall(en_):
                    warns.append(f"{tag}: 字幕の英語に長い単語「{w}」（短い単語に）")
            en = i["hook"].split("/")[0]
            if len(en.split()) > 4: warns.append(f"{tag}: 冒頭の英語が{len(en.split())}語（3〜4語に）")
            if i["out"] and not (7 <= i["out"] <= 12): warns.append(f"{tag}: 尺 {i['out']:.1f}秒（7〜12秒に）")
            if ep in lk and any(lk.get(h) == lk[ep] for h in hist[-3:]):
                warns.append(f"{tag}: 前の3話と同じ部屋（rig/v2/looks.js を作り直す：python3 auto/looks.py）")
            prev = [info(h, pc) for h in hist[-2:]]
            if len(prev) == 2 and all(x and x["loud"] and x["loud"] == i["loud"] for x in prev) and i["loud"]:
                warns.append(f"{tag}: 目立つ効果音が3話続けて同じ（{'・'.join(sorted(i['loud']))}）")
            if len(prev) == 2 and i["props"] and all(x and (x["props"] & i["props"]) for x in prev):
                common = i["props"] & prev[0]["props"] & prev[1]["props"]
                if common: warns.append(f"{tag}: 同じ小物が3話続く（{'・'.join(sorted(common))}）")
        hist.append(ep)
    return {"issues": issues, "warns": warns}


def main(argv):
    days = int(argv[argv.index("--days") + 1]) if "--days" in argv else 14
    posts = json.loads((ROOT / "auto" / "schedule.json").read_text())["posts"]
    r = check(posts, dt.datetime.now(JST).date(), days)
    for x in r["issues"]: print("ISSUE", x)
    for x in r["warns"]: print("WARN ", x)
    print(f"issues {len(r['issues'])} warns {len(r['warns'])}")
    return 2 if r["issues"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
