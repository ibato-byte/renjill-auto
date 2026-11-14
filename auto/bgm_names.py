"""作業用BGMの曲名（説明欄の Tracklist に出る）。
2026-11-14 オーナーの指摘「Tracklist が意味不明」：海の回に「Rainy Commute」「Carrot Budget」のような、その回と関係のない英語だけの名前が並んでいた。
決まり：
- 曲名はその回のテーマ（雨の夜・海・和…）に合った言葉だけで作る
- 英語と日本語を並べる（「Evening Tide｜夕方の潮」）。日本語だけで意味が分かる
- 回をまたいで同じ曲名を二度使わない（オーナー依頼 2026-11-14「曲はできるだけ被らないように」）
作り方：その回の（曲調・景色・時間帯・天気）に合った言葉だけを集めて、「いつ・どんな（A）」×「なに（B）」と、B だけの名前を作る。
A は時間・場面の言葉（朝の・夜ふけの・静かな・いつもの…）だけにする。色・温度・速さの形容（青い・あたたかい・ゆっくりした…）は、
B と組み合わせると「ゆっくりしたデスクランプ」「音のないマフラー」のような意味の通らない名前になるので使わない（2026-11-14 に試して外した）。
同じテーマは二度と出さない（auto/bgm_themes.py）ので、言葉は景色・時間帯・天気ごとに持ち、回ごとに組み合わせる。
"""
import numpy as np
import bgm_themes

SEP = "｜"
# 「なに」：景色ごと
N_VIEW = {
    "city": [("Office", "オフィス"), ("Desk Lamp", "デスクランプ"), ("Keyboard", "キーボード"), ("Coffee", "コーヒー"), ("Hallway", "廊下"), ("Paperwork", "書類"), ("Yawn", "あくび"), ("Mug", "マグカップ"),
             ("Elevator", "エレベーター"), ("Notebook", "ノート"), ("Desk", "机"), ("Clock", "時計"), ("Stairwell", "階段"), ("Vending Machine", "自動販売機"), ("To-Do List", "やることリスト"), ("Blinds", "ブラインド"),
             ("Timothy Hay", "チモシー"), ("Meeting Room", "会議室"), ("Paper Stack", "書類の山"), ("Window", "窓辺")],
    "sea": [("Waves", "波"), ("Shore", "浜辺"), ("Harbor", "港"), ("Sea Breeze", "潮風"), ("Lighthouse", "灯台"), ("Sailboat", "ヨット"), ("Seashell", "貝がら"), ("Pier", "桟橋"), ("Horizon", "水平線"), ("Seagulls", "カモメ"),
            ("Straw Hat", "麦わら帽子"), ("Sandy Path", "砂の道"), ("Cove", "入り江"), ("Ocean View", "海の見える窓"), ("Tide Pool", "潮だまり"), ("Driftwood", "流木"), ("Palm Leaves", "ヤシの葉"), ("Fishing Boat", "漁船")],
    "garden": [("Garden", "庭"), ("Paper Screen", "障子"), ("Lantern", "行灯"), ("Tea Cup", "湯のみ"), ("Stone Path", "石だたみ"), ("Koi Pond", "鯉の池"), ("Veranda", "縁側"), ("Bamboo", "竹林"), ("Temple Bell", "鐘の音"),
               ("Moss", "苔"), ("Tatami Room", "たたみの部屋"), ("Hair Pin", "かんざし"), ("Stone Lantern", "石灯ろう"), ("Green Tea", "お茶"), ("Pine Tree", "松"), ("Garden Gate", "庭の門")],
    "neon": [("Dance Floor", "ダンスフロア"), ("Mirror Ball", "ミラーボール"), ("Headphones", "ヘッドホン"), ("Speakers", "スピーカー"), ("City Lights", "街の明かり"), ("Deadline Rush", "しめきり前"), ("Late Shift", "遅番"),
             ("Sunglasses", "サングラス"), ("Rooftop", "屋上"), ("Elevator", "エレベーター"), ("Office Party", "オフィスパーティー"), ("Keyboard Solo", "キーボードソロ"), ("Bunny Hop", "うさぎステップ"), ("Last Lap", "ラストスパート"),
             ("Neon Signs", "ネオンサイン"), ("Spotlight", "スポットライト"), ("Encore", "アンコール"), ("Back Alley", "裏通り")],
    "stars": [("Night Sky", "夜空"), ("Starlight", "星あかり"), ("Shooting Star", "流れ星"), ("Constellation", "星座"), ("Window", "窓辺"), ("Rooftop", "屋上")],
    "hills": [("Fields", "田んぼ"), ("Little Train", "小さな電車"), ("Farmhouse", "農家"), ("Hills", "丘"), ("Country Road", "いなか道"), ("Railroad Crossing", "ふみきり"), ("Scarecrow", "かかし"), ("Barn", "納屋"),
              ("Village", "村"), ("Footpath", "あぜ道"), ("Windmill", "風車"), ("Haystack", "干し草"), ("Clover Field", "クローバー畑"), ("Small Station", "小さな駅"), ("Tree Line", "並木"), ("Stream", "小川")],
    "mountain": [("Mountain", "山"), ("Lake", "湖"), ("Pine Forest", "松林"), ("Lakeshore", "湖畔"), ("Mountain Path", "山道"), ("Cabin", "山小屋"), ("Summit", "山頂"), ("Ridge", "尾根"), ("Rowboat", "ボート"),
                 ("Valley", "谷"), ("Echo", "こだま"), ("Mountain Air", "山の空気"), ("Reflection", "湖にうつる山"), ("Campfire", "たき火"), ("Trailhead", "登山口"), ("Mist", "霧")],
}
# 「なに」：曲調の小物（その曲調の回だけ）
N_STYLE = {"ballad": [("Candlelight", "ろうそくの灯"), ("Scarf", "マフラー"), ("Letter", "手紙"), ("Memory", "思い出"), ("Promise", "約束"), ("Footsteps", "足音"), ("Piano", "ピアノ"), ("Goodnight", "おやすみ"), ("Walk Home", "帰り道"), ("Lullaby", "子守うた")],
           "club": [("Dance Break", "ダンスタイム"), ("Bass Line", "ベースライン"), ("Disco Ball", "ミラーボール")], "wa": [("Koto", "琴"), ("Bamboo Flute", "尺八"), ("Headband", "鉢巻き")], "sea": [("Tropical Drink", "トロピカルドリンク"), ("Starfish", "ヒトデ")], "lofi": []}
# 「なに」：時間帯（晴れの日だけの言葉は別にする：雨や雪の回に「青空」「夕焼け」は出さない）
N_ARC = {"morning": [("Commute", "通勤"), ("Greeting", "あいさつ"), ("Stretch", "のび"), ("Breakfast", "朝ごはん"), ("Start", "はじまり")],
         "noon": [("Lunch Box", "お弁当"), ("Lunch Break", "昼休み"), ("Nap", "ひるね"), ("Snack", "おやつ"), ("Tea Break", "お茶の時間"), ("Daydream", "空想")],
         "sunset": [("One More Task", "もうひと仕事"), ("Way Home", "帰り道"), ("Station", "駅"), ("Closing Chime", "終業のチャイム"), ("Streetlights", "街灯")],
         "night": [("Overtime", "残業"), ("Train Home", "帰りの電車"), ("Extra Task", "ひと仕事"), ("Streetlights", "街灯"), ("Night Shift", "夜の当番")]}
N_CLEAR = {"morning": [("Sunbeam", "日ざし"), ("Blue Sky", "青空")], "noon": [("Sunny Spot", "ひだまり"), ("Blue Sky", "青空")], "sunset": [("Orange Sky", "オレンジの空"), ("Long Shadows", "長い影"), ("First Star", "一番星"), ("Low Sun", "西日")],
           "night": [("Moon", "月"), ("Stars", "星")]}
N_WEATHER = {"clear": [], "rain": [("Raindrops", "雨つぶ"), ("Puddles", "水たまり"), ("Umbrella", "かさ"), ("Rain Boots", "長ぐつ"), ("Wet Street", "ぬれた道"), ("Umbrella Stand", "かさ立て"), ("Rain Clouds", "雨雲"), ("Wet Leaves", "ぬれた葉")],
             "snow": [("Snowfall", "雪"), ("Snowflakes", "雪のかけら"), ("Scarf", "マフラー"), ("Mittens", "手ぶくろ"), ("Footprints", "足あと"), ("Hot Cocoa", "ココア"), ("Heater", "ストーブ"), ("Snowman", "雪だるま"), ("Frosty Window", "くもった窓")]}
# 「いつ・どんな」
A_COMMON = [("Quiet", "静かな"), ("Usual", "いつもの")]
A_ARC = {"morning": [("Morning", "朝の"), ("Today's", "今日の"), ("Monday", "月曜の"), ("Early", "朝いちばんの")], "noon": [("Midday", "昼下がりの"), ("Afternoon", "午後の"), ("Today's", "今日の"), ("Three O'Clock", "三時の")],
         "sunset": [("Evening", "夕方の"), ("Today's", "今日の"), ("Five O'Clock", "五時の"), ("Homebound", "帰りぎわの")], "night": [("Late", "夜ふけの"), ("Midnight", "真夜中の"), ("Tonight's", "今夜の"), ("After-Hours", "定時すぎの")]}
A_WEATHER = {"clear": [], "rain": [("Rainy", "雨の日の")], "snow": [("Snowy", "雪の日の"), ("Winter", "冬の")]}
A_STYLE = {"club": [("Neon", "ネオンの"), ("Friday", "金曜の")], "ballad": [], "wa": [], "sea": [], "lofi": []}
DEFAULT = "clear_night"


def words(theme):
    """そのテーマの（A, B）"""
    style, view, arc, weather = bgm_themes.sig(theme) or bgm_themes.sig(DEFAULT)
    A = A_COMMON + A_ARC[arc] + A_WEATHER[weather] + A_STYLE[style]
    B = N_VIEW[view] + N_STYLE[style] + N_ARC[arc] + N_WEATHER[weather] + (N_CLEAR[arc] if weather == "clear" else [])
    if view != "city" and style != "club": B = B + N_VIEW["city"][:10]                  # 景色が変わっても、2匹がいるのはオフィス
    seen, out = set(), []
    for x in B:
        if x[0] not in seen: seen.add(x[0]); out.append(x)
    return A, out


def pool(theme):
    A, B = words(theme)
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
