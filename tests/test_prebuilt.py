"""2026-11-25：毛のふわっとした回は Actions で1本40分を超え、8:00 の投稿が描画の途中で打ち切られた。
手元で描いて確かめた動画（usagi-office-media の prebuilt/）を、台本・部品が同じとき（指紋が同じとき）だけ使う。"""
import pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "auto"))
import post


class R:
    def __init__(self, code, js=None, content=b""):
        self.status_code, self._js, self.content = code, js, content
    def json(self): return self._js


def test_stamp_ignores_cover_and_qa():
    a = post.rig_stamp("timothy1")
    assert len(a) == 16 and a == post.rig_stamp("timothy1")
    assert "thumb.js" not in post.RENDER_FILES and "qa.js" not in post.RENDER_FILES


def test_prebuilt_used_only_when_stamp_matches(monkeypatch, tmp_path):
    yt, loop = tmp_path / "yt.mp4", tmp_path / "loop.mp4"
    good = post.rig_stamp("timothy1")
    def get(url, timeout=0):
        if url.endswith(".json"): return R(200, {"stamp": stamp[0]})
        return R(200, content=b"x" * 200000)
    stamp = ["0000000000000000"]
    monkeypatch.setattr(post.requests, "get", get)
    assert not post.fetch_prebuilt("timothy1", yt, loop) and not yt.exists()
    stamp[0] = good
    assert post.fetch_prebuilt("timothy1", yt, loop) and yt.stat().st_size == 200000


def test_no_prebuilt_falls_back(monkeypatch, tmp_path):
    monkeypatch.setattr(post.requests, "get", lambda url, timeout=0: R(404))
    assert not post.fetch_prebuilt("timothy1", tmp_path / "a", tmp_path / "b")
