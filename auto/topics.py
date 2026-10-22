#!/usr/bin/env python3
"""「その日の話題」の候補を、Claude を使わずに毎日確認する（依頼 #38）。
季節・天気（Open-Meteo。無料・キー不要）・祝日・月末・連休明けを見て、使える話題がある日だけ auto/topic_queue.json に積む。
積んだ候補から短い回を作って予定に入れるのは週次の作業（Claude。品質の審査は通常どおり）。毎日 Claude を起こさない。
`python auto/topics.py [YYYY-MM-DD]`（天気は取れなければ飛ばす）
"""
import datetime as dt, json, pathlib, sys
import requests

AUTO = pathlib.Path(__file__).resolve().parent
QUEUE = AUTO / "topic_queue.json"
JST = dt.timezone(dt.timedelta(hours=9))
TOKYO = (35.68, 139.77)
KEEP_DAYS = 14

# 固定日の祝日（振替・移動する祝日は calendar_topics が曜日で補う）。次の連休明け・月末の話題に使う
FIXED_HOLIDAYS = {(1, 1), (2, 11), (2, 23), (4, 29), (5, 3), (5, 4), (5, 5), (8, 11), (11, 3), (11, 23)}


def is_off(d):
    """土日・主な祝日（移動祝日は第◯月曜で判定）"""
    if d.weekday() >= 5 or (d.month, d.day) in FIXED_HOLIDAYS: return True
    n = (d.day - 1) // 7 + 1
    return d.weekday() == 0 and (d.month, n) in {(1, 2), (7, 3), (9, 3), (10, 2)}


def calendar_topics(d):
    out = []
    if not is_off(d):
        x = d + dt.timedelta(days=1)
        while is_off(x) and x.month == d.month: x += dt.timedelta(days=1)
        if x.month != d.month: out.append(("month_end", "月末（締め・精算・請求書のバタバタ）"))  # その月の最後の出勤日
        days_off, y = 0, d - dt.timedelta(days=1)
        while is_off(y): days_off += 1; y -= dt.timedelta(days=1)
        if days_off >= 3: out.append(("after_holiday", "連休明けの朝"))
    if d.month == 4 and d.day <= 10: out.append(("new_year", "新年度・新入社員"))
    if d.month == 12 and 20 <= d.day <= 28: out.append(("year_end", "年末・仕事納め前"))
    if d.month in (6, 7) and d.weekday() < 5 and d.day % 7 == 0: out.append(("rainy", "梅雨・蒸し暑い通勤"))
    return out


def weather_topics(d, http=requests):
    """東京の予報から：急な冷え込み・猛暑・大雨。取れなければ空"""
    try:
        r = http.get("https://api.open-meteo.com/v1/forecast", params={
            "latitude": TOKYO[0], "longitude": TOKYO[1], "timezone": "Asia/Tokyo", "past_days": 1, "forecast_days": 2,
            "daily": "temperature_2m_min,temperature_2m_max,precipitation_sum"}, timeout=20).json()["daily"]
        i = r["time"].index(d.isoformat())
        mn, mx, rain = r["temperature_2m_min"][i], r["temperature_2m_max"][i], r["precipitation_sum"][i]
        prev_mn = r["temperature_2m_min"][i - 1] if i > 0 else None
    except Exception:
        return []
    out = []
    if prev_mn is not None and prev_mn - mn >= 4 and mn <= 14: out.append(("cold_snap", f"急に冷え込んだ朝（最低 {mn:.0f}℃、前日より {prev_mn - mn:.0f}℃低い）"))
    if mx >= 35: out.append(("heat", f"猛暑日（最高 {mx:.0f}℃）"))
    if rain >= 30: out.append(("heavy_rain", f"大雨の日（降水 {rain:.0f}mm）"))
    return out


def update_queue(d, topics, queue=None):
    """候補を積む（同じ日・同じ種類は重ねない）。KEEP_DAYS より古いものは捨てる。積んだ数を返す"""
    q = [x for x in (queue or []) if (d - dt.date.fromisoformat(x["date"])).days <= KEEP_DAYS]
    have = {(x["date"], x["kind"]) for x in q}
    n = 0
    for kind, label in topics:
        if (d.isoformat(), kind) in have: continue
        q.append({"date": d.isoformat(), "kind": kind, "label": label, "status": "new"}); n += 1
    return q, n


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    d = dt.date.fromisoformat(argv[0]) if argv else dt.datetime.now(JST).date()
    topics = calendar_topics(d) + weather_topics(d)
    queue = json.loads(QUEUE.read_text()) if QUEUE.exists() else []
    queue, n = update_queue(d, topics, queue)
    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=2) + "\n")
    print(f"[topics] {d}: 話題 {len(topics)} 件、新しく積んだのは {n} 件" + ("" if topics else "（使える話題なし。何もしない）"))
    for k, label in topics: print(f"  - {k}: {label}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
