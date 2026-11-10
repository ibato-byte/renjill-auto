"""公式サイトのエピソード一覧に、英語・中国語・韓国語の題が出ること（2026-11-10：英語のページに日本語の題が出ていた）。
投稿済みの回と、明日までに出る回は、site_i18n.title の en / zh / ko が必ずある。"""
import datetime as dt, json, pathlib, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
JST = dt.timezone(dt.timedelta(hours=9))


class SiteI18n(unittest.TestCase):
    def test_titles_for_posted_and_tomorrow(self):
        posts = json.loads((ROOT / "auto/schedule.json").read_text())["posts"]
        until = (dt.datetime.now(JST).date() + dt.timedelta(days=1)).isoformat()
        miss = [f'{p["date"]} {p["ep"]}' for p in posts if p["date"] <= until
                and not all(((p.get("site_i18n") or {}).get("title") or {}).get(k) for k in ("en", "zh", "ko"))]
        self.assertEqual(miss, [], "site_i18n.title の en/zh/ko がない回：" + ", ".join(miss))
