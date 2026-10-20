"""FLOTO の freee・Google 連携の確認の単体テスト（ネットワークに出ない。python -m unittest discover -s tests）"""
import base64, datetime as dt, json, pathlib, sys, unittest

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "auto"))
import floto_tokens as ft  # noqa: E402

NOW = dt.datetime(2026, 10, 26, 0, 0, tzinfo=dt.timezone.utc)


def entry(google, freee, at="2026-10-25T22:10:00Z"):
    return {"kpis": [{"label": "MyKomon 全件", "value": 10}, {"label": "Google 連携", "value": google}, {"label": "freee 連携", "value": freee}],
            "last_run": {"at": at, "result": "success", "summary": "x"} if at else None}


class Resp:
    def __init__(self, j, code=200): self._j, self.status_code = j, code
    def json(self): return self._j


class FlotoTokens(unittest.TestCase):
    def test_ok(self):
        k, a, p = ft.status(entry("OK", "OK"), NOW)
        self.assertEqual(k, ["Google（FLOTO）=OK", "freee（FLOTO）=OK"])
        self.assertEqual((a, p), ([], []))

    def test_setup_pending_is_not_a_problem(self):
        k, a, p = ft.status(entry("未登録", "未登録", at=None), NOW)
        self.assertEqual(k, ["Google（FLOTO）=初期設定待ち", "freee（FLOTO）=初期設定待ち"])
        self.assertEqual((a, p), ([], []))

    def test_expired_freee(self):
        k, a, p = ft.status(entry("OK", "期限切れ・無効"), NOW)
        self.assertIn("freee（FLOTO）=期限切れ・無効", k)
        self.assertEqual(p, ["freee（FLOTO）"])
        self.assertTrue(any("FREEE_AUTH_CODE" in x for x in a))

    def test_stale_record(self):
        k, a, p = ft.status(entry("OK", "OK", at="2026-10-20T22:10:00Z"), NOW)
        self.assertEqual(k, ["Google（FLOTO）=確認できず", "freee（FLOTO）=確認できず"])
        self.assertEqual(len(p), 2)

    def test_unreadable_registry(self):
        k, a, p = ft.status(None, NOW)
        self.assertEqual(p, ["FLOTO"])
        self.assertTrue(all("確認失敗" in x for x in k))

    def test_fetch(self):
        body = base64.b64encode(json.dumps(entry("OK", "OK"), ensure_ascii=False).encode()).decode()

        class Http:
            def get(self, url, headers, timeout):
                assert headers["Authorization"] == "Bearer t" and "floto-mykomon-sync.json" in url
                return Resp({"content": body})
        self.assertEqual(ft.fetch("t", Http())["kpis"][1]["value"], "OK")

        class Http404:
            def get(self, *a, **k): return Resp({}, 404)
        self.assertIsNone(ft.fetch("t", Http404()))


if __name__ == "__main__":
    unittest.main()
