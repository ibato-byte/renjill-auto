"""2026-11-25 オーナー：表紙も「定時1分前のちょっといい？」とデザイン・演出をそろえる（variant N）。"""
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "auto"))


def test_neo_cover_style():
    s = (ROOT / "rig/thumb.js").read_text()
    assert "neoshade" in s, "上を暗くして題名を浮かせる"
    assert "&quot;${en}&quot;" in s, "英語は \"…\" でくくる"
    assert "transform:rotate(-3deg)" in s, "PART の札は少し傾ける"


def test_neo_cover_never_falls_back_to_A(monkeypatch, tmp_path):
    import post
    tried = []
    def fake_run(cmd, env=None):
        tried.append(cmd[-1])
        class R: returncode = 1
        return R()
    monkeypatch.setattr(post.subprocess, "run", fake_run)
    monkeypatch.setattr(post.subprocess, "check_output", lambda *a, **k: b"/x")
    p = {"ep": "timothy1", "no": 99, "title": "t", "thumb": {"t": 9.4, "cam": "1,1,1", "hook": "a/b/PART 1 / 3", "variant": "N"}}
    try:
        post.thumbnail(p)
    except Exception:
        pass
    assert tried and set(tried) == {"N"}


def test_timothy_covers_are_neo():
    s = json.loads((ROOT / "auto/schedule.json").read_text())
    for p in s["posts"]:
        if p.get("ep") in ("timothy1", "timothy2", "timothy3"):
            assert p["thumb"]["variant"] == "N"
            assert p["thumb"]["hook"].startswith("社員からの|お土産/")
