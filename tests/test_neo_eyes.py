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


def test_face_parts_and_props_crisp():
    # 2026-11-24 オーナー：ひげ・鼻・口・社員証・ネクタイにも毛ふわがかかっていた → 目と同じく、くっきり
    s = (ROOT / "rig/rig.js").read_text()
    assert s.count("G({ 'data-crisp': 1 }, [mouthEl])") == 2, "口"
    assert s.count("G({ 'data-crisp': 1, transform: noseT(p,") == 2, "鼻"
    assert s.count("G({ 'data-crisp': 1, transform: p.nose ? `translate(") == 2, "ひげ"
    assert "const lanyard = p.prop ? G({ 'data-crisp': 1 }" in s, "社員証"
    assert "const tie = p.prop ? G({ 'data-crisp': 1," in s, "ネクタイ"


def test_fluff_edges_only():
    # 毛並みは「定時1分前」と同じく、ふちにだけ短い毛（中はなめらか）。ふわっとし過ぎに戻さない
    s = (ROOT / "rig/v2/neo_ui.js").read_text()
    assert 'operator="erode"' in s and '<feMergeNode in="core"/>' in s
    m = re.search(r'id="neoFluff".*?scale="(\d+(?:\.\d+)?)"', s, re.S)
    assert m and float(m.group(1)) <= 6, "毛のゆらし幅が大きすぎる"


def test_paper_bag_logo_is_green_heart():
    # 2026-11-24 オーナー：紙袋の赤い十字が救急箱に見えた → 緑のハート
    s = (ROOT / "rig/v2/timothy_set.js").read_text()
    bag = s[s.index("TM.paperBag"):s.index("TM.crunch")]
    assert "#4E9A52" in bag and "#C8263C" not in bag


def test_crisp_layers_keep_draw_order():
    # 2026-11-24 オーナー：社員証・ネクタイが口元からぶら下がって見えた（くっきり版を全部いちばん上に重ねていた）
    #   → 体（ふわ）→ 社員証・ネクタイ → 頭（ふわ）→ 目・鼻・口・ひげ の順に重ねる
    s = (ROOT / "rig/rig.js").read_text()
    assert s.count("const head = G({ 'data-neo-head': 1,") == 2
    n = (ROOT / "rig/v2/neo_ui.js").read_text()
    assert "g.after(crispBody, ...(headFluff ? [headFluff] : []), crispHead);" in n
    assert "body,headfluff,head" in (ROOT / "rig/qa.js").read_text()


def test_part3_akire_sweat():
    # 2026-11-24 オーナー：Part 3 の 0:28 のユズに呆れた汗マーク
    s = (ROOT / "rig/ep/timothy3.js").read_text()
    assert "akireSweat(jp, tt)" in s and 'data-sweat="akire"' in s
