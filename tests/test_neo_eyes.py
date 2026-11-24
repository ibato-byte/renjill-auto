"""2026-11-24 オーナー：「定時1分前」と同じ、くっきりした目にする。
NEO の毛ふわ（neoFluff）は体だけにかけ、目とメガネ（data-crisp）はふわなしの写しで上に描く。
この印や仕組みが消えると、目がまたザラザラにぼやけるので、ここで止める（動きの確認は rig/qa.js の NEO.crisp）。"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[1]


def test_eye_groups_marked_crisp():
    s = (ROOT / "rig/rig.js").read_text()
    assert s.count("return G({ 'data-crisp': 1 }, kids);") == 2, "モチ・ユズの目の group に data-crisp が要る"
    assert "Object.assign({ 'data-crisp': 1 }" in s, "メガネにも data-crisp が要る"
    assert "window.NEO_EYES ? neoEye(" in s and "rg('eyeN'" in s


def test_neo_install_overlays_crisp_eyes():
    s = (ROOT / "rig/v2/neo_ui.js").read_text()
    assert "window.NEO_EYES = true" in s
    assert re.search(r"NEO\.crisp = \(id\) => \{\n\s+const svg", s), "NEO.crisp の中身が空になっていないか"
    assert "L.char = function (id) { orig.apply(this, arguments); NEO.crisp(id); }" in s


def test_qa_checks_crisp_eyes():
    assert "NEO.crisp" in (ROOT / "rig/qa.js").read_text()


def test_lid_clip_kept_visible():
    # 2026-11-24：ふわをかけた方の目を隠したら、半目の切り抜き（clipPath）まで隠れて、ジロッの目が線だけになった
    assert "g.querySelectorAll('clipPath *').forEach(n => n.setAttribute('visibility', 'visible'))" in (ROOT / "rig/v2/neo_ui.js").read_text()
    assert "半目の切り抜きが消えて" in (ROOT / "rig/qa.js").read_text()
