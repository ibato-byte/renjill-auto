"""作業用BGMの曲名（説明欄の Tracklist に出る）。
2026-11-14 オーナーの指摘「Tracklist が意味不明」：海の回に「Rainy Commute」「Carrot Budget」のような、その回と関係のない英語だけの名前が並んでいた。
決まり：
- 曲名はその回のテーマ（雨の夜・海・和…）に合った言葉だけで作る
- 英語と日本語を並べる（「Evening Tide｜夕方の潮」）。日本語だけで意味が分かる
- 回をまたいで同じ曲名を二度使わない（オーナー依頼 2026-11-14「曲はできるだけ被らないように」）
作り方：テーマごとに「いつ・どんな（A）」×「なに（B）」と、B だけの名前。
A は時間・場面の言葉（朝の・夜ふけの・静かな・いつもの…）だけにする。色・温度・速さの形容（青い・あたたかい・ゆっくりした…）は、
B と組み合わせると「ゆっくりしたデスクランプ」「音のないマフラー」のような意味の通らない名前になるので使わない（2026-11-14 に試して外した）。
"""
import numpy as np

SEP = "｜"
THEME_NAMES = {
    "rain_night": (
        [("Late", "夜ふけの"), ("Quiet", "静かな"), ("Midnight", "真夜中の"), ("Rainy Night", "雨の夜の"), ("Tonight's", "今夜の"), ("Usual", "いつもの"), ("After-Hours", "定時すぎの")],
        [("Overtime", "残業"), ("Desk Lamp", "デスクランプ"), ("Window", "窓辺"), ("Raindrops", "雨つぶ"), ("Puddles", "水たまり"), ("Umbrella", "かさ"), ("Keyboard", "キーボード"), ("Coffee", "コーヒー"), ("Streetlights", "街灯"), ("Office", "オフィス"), ("Hallway", "廊下"), ("Paperwork", "書類"), ("Yawn", "あくび"), ("Train Home", "帰りの電車")]),
    "seaside": (
        [("Morning", "朝の"), ("Noon", "お昼の"), ("Evening", "夕方の"), ("Quiet", "静かな"), ("Distant", "遠くの"), ("Sunny", "晴れた日の"), ("Today's", "今日の")],
        [("Waves", "波"), ("Shore", "浜辺"), ("Harbor", "港"), ("Sea Breeze", "潮風"), ("Lighthouse", "灯台"), ("Sailboat", "ヨット"), ("Seashell", "貝がら"), ("Pier", "桟橋"), ("Horizon", "水平線"), ("Seagulls", "カモメ"), ("Straw Hat", "麦わら帽子"), ("Sandy Path", "砂の道"), ("Cove", "入り江"), ("Ocean View", "海の見える窓")]),
    "wa_evening": (
        [("Evening", "夕暮れの"), ("Quiet", "静かな"), ("Autumn", "秋の"), ("Moonlit", "月あかりの"), ("Usual", "いつもの")],
        [("Maple Leaves", "もみじ"), ("Garden", "庭"), ("Paper Screen", "障子"), ("Lantern", "行灯"), ("Tea Cup", "湯のみ"), ("Stone Path", "石だたみ"), ("Koi Pond", "鯉の池"), ("Veranda", "縁側"), ("Bamboo", "竹林"), ("Wind Chime", "風鈴"), ("Temple Bell", "鐘の音"), ("Moss", "苔"), ("Tatami Room", "たたみの部屋"), ("Hair Pin", "かんざし")]),
    "dance_night": (
        [("Neon", "ネオンの"), ("Friday", "金曜の"), ("Midnight", "真夜中の"), ("Tonight's", "今夜の"), ("Our", "ぼくらの"), ("After-Hours", "定時すぎの")],
        [("Dance Floor", "ダンスフロア"), ("Mirror Ball", "ミラーボール"), ("Headphones", "ヘッドホン"), ("Speakers", "スピーカー"), ("City Lights", "街の明かり"), ("Deadline Rush", "しめきり前"), ("Late Shift", "遅番"), ("Sunglasses", "サングラス"), ("Rooftop", "屋上"), ("Elevator", "エレベーター"), ("Office Party", "オフィスパーティー"), ("Keyboard Solo", "キーボードソロ"), ("Bunny Hop", "うさぎステップ"), ("Last Lap", "ラストスパート")]),
    "quiet_ballads": (
        [("Quiet", "静かな"), ("Winter", "冬の"), ("Late", "夜ふけの"), ("Tonight's", "今夜の"), ("Remembered", "いつかの")],
        [("Candlelight", "ろうそくの灯"), ("Night Sky", "夜空"), ("Snowfall", "雪"), ("Scarf", "マフラー"), ("Window", "窓辺"), ("Letter", "手紙"), ("Memory", "思い出"), ("Promise", "約束"), ("Footsteps", "足音"), ("Piano", "ピアノ"), ("Goodnight", "おやすみ"), ("Walk Home", "帰り道"), ("Starlight", "星あかり"), ("Lullaby", "子守うた")]),
    "morning": (
        [("Monday", "月曜の"), ("Today's", "今日の"), ("First", "最初の"), ("Quiet", "静かな"), ("Sunny", "晴れた日の"), ("Usual", "いつもの"), ("Early", "朝いちばんの")],
        [("Sunbeam", "日ざし"), ("Coffee", "コーヒー"), ("Commute", "通勤"), ("Window", "窓辺"), ("Desk", "机"), ("To-Do List", "やることリスト"), ("Greeting", "あいさつ"), ("Stretch", "のび"), ("Notebook", "ノート"), ("Blue Sky", "青空"), ("Breakfast", "朝ごはん"), ("Timothy Hay", "チモシー"), ("Blinds", "ブラインド"), ("Start", "はじまり")]),
    "clear_night": (
        [("Late", "夜ふけの"), ("Quiet", "静かな"), ("Midnight", "真夜中の"), ("Tonight's", "今夜の"), ("Usual", "いつもの"), ("After-Hours", "定時すぎの")],
        [("City Lights", "夜景"), ("Desk Lamp", "デスクランプ"), ("Office", "オフィス"), ("Moon", "月"), ("Skyline", "ビルの明かり"), ("Elevator", "エレベーター"), ("Extra Task", "ひと仕事"), ("Mug", "マグカップ"), ("Train Home", "帰りの電車"), ("Window", "窓辺"), ("Vending Machine", "自動販売機"), ("Stairwell", "階段"), ("Clock", "時計"), ("Way Home", "帰り道")]),
    "rain_afternoon": (
        [("Rainy", "雨の日の"), ("Afternoon", "午後の"), ("Quiet", "静かな"), ("Usual", "いつもの"), ("Three O'Clock", "三時の"), ("Today's", "今日の")],
        [("Raindrops", "雨つぶ"), ("Nap", "ひるね"), ("Window", "窓辺"), ("Tea Break", "お茶の時間"), ("Meeting Room", "会議室"), ("Umbrella Stand", "かさ立て"), ("Puddles", "水たまり"), ("Notebook", "ノート"), ("Clouds", "雲"), ("Daydream", "空想"), ("Snack", "おやつ"), ("Paper Stack", "書類の山"), ("Wet Street", "ぬれた道"), ("Hallway", "廊下")]),
    "sunset": (
        [("Evening", "夕方の"), ("Quiet", "静かな"), ("Usual", "いつもの"), ("Today's", "今日の"), ("Five O'Clock", "五時の"), ("Homebound", "帰りぎわの")],
        [("Orange Sky", "オレンジの空"), ("Long Shadows", "長い影"), ("Window", "窓辺"), ("Rooftop", "屋上"), ("One More Task", "もうひと仕事"), ("Clouds", "雲"), ("City Blocks", "ビル街"), ("Desk", "机"), ("Way Home", "帰り道"), ("Station", "駅"), ("First Star", "一番星"), ("Blinds", "ブラインド"), ("Closing Chime", "終業のチャイム"), ("Low Sun", "西日")]),
    "rain_morning": (
        [("Rainy", "雨の日の"), ("Morning", "朝の"), ("Quiet", "静かな"), ("Usual", "いつもの"), ("Today's", "今日の"), ("Monday", "月曜の")],
        [("Raindrops", "雨つぶ"), ("Umbrella", "かさ"), ("Coffee", "コーヒー"), ("Commute", "通勤"), ("Window", "窓辺"), ("Rain Boots", "長ぐつ"), ("Puddles", "水たまり"), ("Wet Leaves", "ぬれた葉"), ("Desk", "机"), ("Timothy Hay", "チモシー"), ("Hallway", "廊下"), ("Clouds", "雲"), ("Bus Stop", "バス停"), ("Start", "はじまり")]),
}
DEFAULT = "clear_night"


def pool(theme):
    A, B = THEME_NAMES.get(theme) or THEME_NAMES[DEFAULT]
    return [f"{be}{SEP}{bj}" for be, bj in B] + [f"{ae} {be}{SEP}{aj}{bj}" for ae, aj in A for be, bj in B]


def english(name): return name.split(SEP)[0]


def pick(seed, n, used=(), theme=DEFAULT):
    """その回の曲名（「英語｜日本語」）。テーマに合った名前から、これまでの回で使っていないものを選ぶ。同じ seed・同じ used なら同じ結果。
    テーマの名前を使い切ったら「II」「III」…を付ける（同じ名前にはしない）"""
    rng = np.random.default_rng(seed); used = set(used); base = pool(theme)
    order = [base[i] for i in rng.permutation(len(base))]
    out, k = [], 1
    while len(out) < n:
        for x in order:
            nm = x if k == 1 else (lambda e, j: f"{e} {_roman(k)}{SEP}{j} {k}")(*x.split(SEP))
            if nm not in used and nm not in out: out.append(nm)
            if len(out) == n: break
        k += 1
    return out


def _roman(k):
    out = ""
    for v, s in ((10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")):
        while k >= v: out += s; k -= v
    return out
