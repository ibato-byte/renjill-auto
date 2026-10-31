"""SNS の多言語方針（auto/sns_policy.json）。各項目は false で止められる。どれも失敗しても本編の投稿は止めない"""
import json, pathlib

PATH = pathlib.Path(__file__).resolve().parent / "sns_policy.json"


def load():
    try: return json.loads(PATH.read_text(encoding="utf-8"))
    except Exception: return {}


def yt_description(desc, pol=None):
    """YouTube の説明に公式サイト・ゲームの行を足す（同じ URL がもうあれば足さない。最初の段の後ろに入れる）"""
    pol = load() if pol is None else pol
    if not pol.get("yt_extra_lines"): return desc
    add = [ln for ln in pol.get("yt_lines", []) if ln.split()[-1].split("?")[0] not in desc]
    if not add: return desc
    head, sep, rest = desc.partition("\n\n")  # 最初の段（ゲームの案内）のすぐ後ろに入れる（説明の冒頭に見えるように）
    return head + "\n" + "\n".join(add) + sep + rest


def tiktok_caption(cap, pol=None):
    """TikTok だけ、末尾に繁体字・韓国語のハッシュタグを合計 tt_max_tags 個まで。すでにある・上限を超えるなら足さない"""
    pol = load() if pol is None else pol
    if not pol.get("tt_i18n_tags"): return cap
    tags = [t for t in pol.get("tt_tags", []) if t not in cap.split()][: int(pol.get("tt_max_tags", 3))]
    if not tags: return cap
    out = cap + "\n" + " ".join(tags)
    return out if len(out.encode("utf-16-le")) // 2 <= int(pol.get("tt_caption_limit", 2200)) else cap  # TikTok は UTF-16 で数える
