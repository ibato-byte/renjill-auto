#!/usr/bin/env python3
"""「その日の話題」の確認（依頼 #38-4）。Claude を使わずに、季節・天気・祝日・月末で話題になる職場あるあるがあるかを毎日確かめる。
- 天気：Open-Meteo（無料・キー不要）。東京の最低気温が前日より 5 度以上下がった朝／雨が多い平日
- 祝日：holidays-jp（無料）。連休明け・祝日前日
- 月末の最終営業日
使える話題がある日だけ content/topic_queue.json に足す（同じ話題は 14 日あけて出し直す）。
短い回を作って schedule.json に入れるのは週次 PDCA（Claude）が、この待ち行列を見て行う（品質の審査は通常どおり）。
`python auto/topics.py [--date YYYY-MM-DD] [--offline]`
"""
import datetime as dt, json, pathlib, sys
import requests

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))
QUEUE = ROOT / "content" / "topic_queue.json"
COOLDOWN_DAYS = 14
HOLIDAYS_URL = "https://holidays-jp.github.io/api/v1/date.json"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

HINTS = {
    "cold_snap": "急に寒い朝。ジルは上着、課長は半袖のまま",
    "rainy_commute": "雨の朝の出勤。課長の傘がない／濡れた書類",
    "month_end": "月末の締め。課長が今日になって『まだ間に合うよね？』",
    "after_holiday": "連休明け。課長の頭がまだ休み",
    "before_holiday": "連休前日。課長がそわそわ、ジルは淡々と仕事",
}


def is_workday(d, holidays):
    return d.weekday() < 5 and d.isoformat() not in holidays


def last_workday_of_month(d, holidays):
    x = (d.replace(day=28) + dt.timedelta(days=4)).replace(day=1) - dt.timedelta(days=1)
    while not is_workday(x, holidays): x -= dt.timedelta(days=1)
    return x


def calendar_topics(d, holidays):
    out = []
    if not is_workday(d, holidays): return out
    if d == last_workday_of_month(d, holidays): out.append("month_end")
    prev = d - dt.timedelta(days=1)
    if not is_workday(prev, holidays):
        gap = 0; x = prev
        while not is_workday(x, holidays) and gap < 10: gap += 1; x -= dt.timedelta(days=1)
        if gap >= 3: out.append("after_holiday")
    nxt = d + dt.timedelta(days=1)
    if not is_workday(nxt, holidays) and nxt.weekday() < 5 and nxt.isoformat() in holidays: out.append("before_holiday")
    return out


def weather_topics(daily, today):
    """daily：Open-Meteo の daily（time・temperature_2m_min・precipitation_sum）。today：'YYYY-MM-DD'"""
    out = []
    try:
        i = daily["time"].index(today)
        if i >= 1 and daily["temperature_2m_min"][i - 1] - daily["temperature_2m_min"][i] >= 5: out.append("cold_snap")
        if (daily["precipitation_sum"][i] or 0) >= 10: out.append("rainy_commute")
    except (ValueError, KeyError, IndexError, TypeError):
        pass
    return out


def update_queue(queue, today, topics):
    """新しい話題だけ足す。14 日以内に出した同じ話題は足さない。戻り値：足したもの"""
    added = []
    cutoff = (dt.date.fromisoformat(today) - dt.timedelta(days=COOLDOWN_DAYS)).isoformat()
    for t in topics:
        if any(q["topic"] == t and q["date"] >= cutoff for q in queue): continue
        q = {"date": today, "topic": t, "hint": HINTS[t], "used": False}
        queue.append(q); added.append(q)
    return added


def main(argv):
    today = dt.datetime.now(JST).date()
    offline = "--offline" in argv
    if "--date" in argv: today = dt.date.fromisoformat(argv[argv.index("--date") + 1])
    holidays, topics = {}, []
    if not offline:
        try: holidays = requests.get(HOLIDAYS_URL, timeout=20).json()
        except Exception as e: print("[topics] 祝日を取れず、曜日だけで判断", type(e).__name__)
        try:
            w = requests.get(WEATHER_URL, params={"latitude": 35.68, "longitude": 139.76, "daily": "temperature_2m_min,precipitation_sum",
                                                 "timezone": "Asia/Tokyo", "past_days": 1, "forecast_days": 2}, timeout=20).json()
            topics += weather_topics(w.get("daily", {}), today.isoformat())
        except Exception as e: print("[topics] 天気を取れず", type(e).__name__)
    topics += calendar_topics(today, holidays)
    queue = json.loads(QUEUE.read_text()) if QUEUE.exists() else []
    added = update_queue(queue, today.isoformat(), topics)
    queue = [q for q in queue if q["date"] >= (today - dt.timedelta(days=60)).isoformat()]
    QUEUE.parent.mkdir(exist_ok=True)
    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=1) + "\n")
    print("[topics]", today, "見つけた話題:", [q["topic"] for q in added] or "なし")
    (ROOT / "dist").mkdir(exist_ok=True)
    (ROOT / "dist" / "topics_summary.txt").write_text("、".join(HINTS[q["topic"]].split("。")[0] for q in added) or "なし")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
