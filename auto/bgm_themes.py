"""作業用BGMのテーマ（その回の「曲調・窓の景色・時間帯・天気」の組み合わせ）。
2026-11-14 オーナーの指示「2回目っていうのはやめて。同じやつが2度と出ないようにして」「曲も映像も完全な新作だけを出し続けて」。
決まり：
- 同じテーマは二度と出さない。それまでは 10 個のテーマを順番にくり返していた（11 本目から「2回目」になるところだった）
- 映像の組み合わせ（窓の景色 × 時間帯 × 天気）も二度と使わない。曲調だけ変えて同じ景色を出すこともしない
- 最初の 10 本は手で作ったテーマ（auto/bgm.py の THEMES）。11 本目からは、まだ使っていない組み合わせから、前の回となるべく違うものを選ぶ
- 使い切ったら出さない（同じものを出すより止める）。残りが少なくなったら bgm の実行結果で知らせるので、新しい景色（VIEWS）を足す
"""

# 手で作った 10 本のテーマが使っている組み合わせ：（曲調, 景色, 時間帯, 天気）
HAND = {
    "rain_night": ("lofi", "city", "night", "rain"), "seaside": ("sea", "sea", "noon", "clear"), "wa_evening": ("wa", "garden", "sunset", "clear"),
    "dance_night": ("club", "neon", "night", "clear"), "quiet_ballads": ("ballad", "stars", "night", "clear"), "morning": ("lofi", "city", "morning", "clear"),
    "clear_night": ("lofi", "city", "night", "clear"), "rain_afternoon": ("lofi", "city", "noon", "rain"), "sunset": ("lofi", "city", "sunset", "clear"),
    "rain_morning": ("lofi", "city", "morning", "rain"),
}

# 時間帯：章ごとの時刻・2匹のようす（レン／ジル）・表紙に使う場面（章, 秒）
ARCS = {
    "morning": {"hours": [8.5, 9.5, 10.5, 11.5], "ren": ["sleepy", "type", "hay", "type"], "jil": ["type", "happy", "glance", "type"], "thumb": [1, 20.0],
                "en": "Morning", "ja": "朝", "zh": "早晨", "ko": "아침", "b_en": "A slow start to the day.", "b_ja": "ゆっくり始まる朝。"},
    "noon": {"hours": [11.5, 12.5, 13.5, 14.5], "ren": ["hay", "sleepy", "type", "type"], "jil": ["type", "glance", "type", "happy"], "thumb": [1, 13.5],
             "en": "Midday", "ja": "昼下がり", "zh": "午後", "ko": "오후", "b_en": "After lunch, staying awake is Ren's biggest task.", "b_ja": "お昼のあと、眠気とたたかうのが課長のいちばんの仕事。"},
    "sunset": {"hours": [15.5, 16.5, 17.5, 19.0], "ren": ["type", "hay", "type", "sleepy"], "jil": ["type", "type", "happy", "glance"], "thumb": [2, 20.0],
               "en": "Sunset", "ja": "夕暮れ", "zh": "黃昏", "ko": "해 질 녘", "b_en": "One more task before going home.", "b_ja": "帰る前に、もうひと仕事。"},
    "night": {"hours": [18.0, 20.0, 22.0, 23.75], "ren": ["type", "type", "hay", "asleep"], "jil": ["happy", "type", "glance", "type"], "thumb": [2, 14.5],
              "en": "Night", "ja": "夜", "zh": "夜晚", "ko": "밤", "b_en": "Two bunnies finishing the day.", "b_ja": "2匹が一日の仕事を終えるまで。"},
}
# 曲調ごとの 2匹のようす（時間帯の決まりより優先）と、説明の一言
STYLE_POSES = {"club": (["type", "dance", "hay", "dance"], ["glance", "type", "dance", "dance"]), "ballad": (["gaze", "type", "gaze", "asleep"], ["type", "gaze", "type", "gaze"])}
STYLE_BLURB = {"lofi": ("Soft lofi beats to keep you company.", "やわらかなローファイのビートと一緒に。"), "sea": ("A slow guitar and marimba.", "ゆったりしたギターとマリンバ。"),
               "wa": ("Koto- and shakuhachi-style melodies.", "琴と尺八ふうの音色。"), "club": ("An upbeat mix for when the work needs to move.", "仕事を一気に進めたいときの、アップテンポなミックス。"),
               "ballad": ("Piano and strings for a quiet hour.", "ピアノとストリングスの、しっとりした1時間。")}
WEATHERS = {"clear": {"en": "", "ja": "", "zh": "", "ko": "", "b_en": "", "b_ja": ""},
            "rain": {"en": "Rainy ", "ja": "雨の", "zh": "下雨的", "ko": "비 오는 ", "b_en": "It's raining outside. ", "b_ja": "外は雨。"},
            "snow": {"en": "Snowy ", "ja": "雪の", "zh": "下雪的", "ko": "눈 오는 ", "b_en": "Snow is falling outside. ", "b_ja": "外は雪。"}}
SNOW_MONTHS = (12, 1, 2)
# 窓の景色：題名の形・使える時間帯・天気・曲調（{a}＝時間帯）。曲調は「その景色に合うもの」だけ
VIEWS = {
    "city": {"en": "{a} at the Office", "ja": "{a}のオフィス", "zh": "{a}的辦公室", "ko": "{a}의 사무실", "arcs": ["morning", "noon", "sunset", "night"], "weather": ["clear", "rain", "snow"],
             "styles": {"lofi": None, "club": ["sunset", "night"], "ballad": ["sunset", "night"]}, "b_en": "City buildings outside the window.", "b_ja": "窓の外にはビルの街。"},
    "sea": {"en": "Seaside {a}", "ja": "海辺の{a}", "zh": "海邊的{a}", "ko": "바닷가의 {a}", "arcs": ["morning", "noon", "sunset", "night"], "weather": ["clear", "rain"],
            "styles": {"sea": None, "lofi": None, "ballad": ["night"]}, "b_en": "Today the office has an ocean view.", "b_ja": "今日のオフィスは海の見える窓。"},
    "garden": {"en": "Japanese Garden {a}", "ja": "和の庭の{a}", "zh": "和風庭園的{a}", "ko": "일본식 정원의 {a}", "arcs": ["morning", "noon", "sunset", "night"], "weather": ["clear", "rain", "snow"],
               "styles": {"wa": None, "ballad": ["night"]}, "b_en": "A quiet Japanese garden outside the window.", "b_ja": "窓の外には静かな和の庭。"},
    "neon": {"en": "Neon City {a}", "ja": "ネオンの街の{a}", "zh": "霓虹街的{a}", "ko": "네온 거리의 {a}", "arcs": ["sunset", "night"], "weather": ["clear", "rain", "snow"],
             "styles": {"club": None}, "b_en": "Neon signs light up the city.", "b_ja": "街にネオンが灯る。"},
    "stars": {"en": "Starry {a}", "ja": "星空の{a}", "zh": "星空的{a}", "ko": "별이 빛나는 {a}", "arcs": ["night"], "weather": ["clear"],
              "styles": {"ballad": None}, "b_en": "A sky full of stars.", "b_ja": "満天の星空。"},
    "hills": {"en": "Countryside {a}", "ja": "田園の{a}", "zh": "田園的{a}", "ko": "시골의 {a}", "arcs": ["morning", "noon", "sunset", "night"], "weather": ["clear", "rain", "snow"],
              "styles": {"lofi": None, "wa": ["morning", "noon"], "ballad": ["sunset", "night"]}, "b_en": "Quiet fields and a little train outside the window.", "b_ja": "窓の外には、のどかな田園と小さな電車。"},
    "mountain": {"en": "Mountain Lake {a}", "ja": "山の湖の{a}", "zh": "山中湖的{a}", "ko": "산속 호수의 {a}", "arcs": ["morning", "noon", "sunset", "night"], "weather": ["clear", "rain", "snow"],
                 "styles": {"lofi": None, "wa": None, "ballad": ["sunset", "night"]}, "b_en": "Mountains and a still lake outside the window.", "b_ja": "窓の外には、山と静かな湖。"},
}


def gen_id(style, view, arc, weather): return f"g-{style}-{view}-{arc}-{weather}"


def sig(theme_id):
    """テーマの（曲調, 景色, 時間帯, 天気）。知らない id は None"""
    if theme_id in HAND: return HAND[theme_id]
    p = (theme_id or "").split("-")
    return tuple(p[1:]) if len(p) == 5 and p[0] == "g" and p[2] in VIEWS and p[3] in ARCS and p[4] in WEATHERS else None


def visual(theme_id):
    """映像の組み合わせ（景色, 時間帯, 天気）。これが同じ回は、同じ映像に見える"""
    s = sig(theme_id); return s[1:] if s else None


def generated(style, view, arc, weather):
    """組み合わせからテーマを作る（題名・説明・2匹のようす）"""
    V, A, Wt = VIEWS[view], ARCS[arc], WEATHERS[weather]
    ren, jil = STYLE_POSES.get(style, (A["ren"], A["jil"]))
    name = {k: Wt[k] + V[k].format(a=A[k]) for k in ("en", "ja", "zh", "ko")}
    th = {"id": gen_id(style, view, arc, weather), "style": style, "view": view, "arc": arc, "weather": weather, "hours": A["hours"], "ren": ren, "jil": jil, "thumb": A["thumb"], **name,
          "blurb_en": f'{Wt["b_en"]}{V["b_en"]} {STYLE_BLURB[style][0]} {A["b_en"]}', "blurb_ja": f'{Wt["b_ja"]}{V["b_ja"]}{STYLE_BLURB[style][1]}{A["b_ja"]}'}
    if style == "lofi": th.pop("style")                       # 手で作ったテーマと同じ形（lofi は style を書かない）
    return th


def all_combos(month):
    """その月に出せる全部の組み合わせ（雪は冬だけ）"""
    out = []
    for view, V in VIEWS.items():
        for arc in V["arcs"]:
            for weather in V["weather"]:
                if weather == "snow" and month not in SNOW_MONTHS: continue
                for style, arcs in V["styles"].items():
                    if arcs is None or arc in arcs: out.append((style, view, arc, weather))
    return out


def _h(s):
    import hashlib
    return int(hashlib.sha1(s.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF


def next_id(chain, month, hand_ids):
    """次の回のテーマ。chain＝これまでの回のテーマ id（古い順）。hand_ids＝手で作ったテーマの順番。
    手で作ったテーマが残っていれば順番どおり。なければ、まだ使っていない映像の組み合わせから、前の回となるべく違うものを選ぶ。
    使い切ったら None（同じものは出さない）"""
    used = set(chain)
    if len(chain) < len(hand_ids) and hand_ids[len(chain)] not in used: return hand_ids[len(chain)]
    seen = {visual(x) for x in chain}
    cands = [c for c in all_combos(month) if c[1:] not in seen and gen_id(*c) not in used]
    if not cands: return None
    sigs = [s for s in map(sig, chain) if s]
    p1 = sigs[-1] if sigs else (None,) * 4; p2 = sigs[-2] if len(sigs) > 1 else (None,) * 4
    recent = sigs[-10:]

    def cost(c):
        style, view, arc, weather = c
        return ((style == p1[0]) * 100 + (style == p2[0]) * 25 + (view == p1[1]) * 60 + (view == p2[1]) * 20 + (arc == p1[2]) * 15 + (weather == p1[3]) * (30 if weather != "clear" else 8)
                + sum(s[0] == style for s in recent) * 9 + sum(s[1] == view for s in recent) * 7 + sum(s[3] == weather for s in recent) * (5 if weather != "clear" else 1)
                - (weather == "snow") * 6 + _h(gen_id(*c)))             # 雪は冬のうちに使う。最後は決まった順（同じ入力なら同じ結果）
    return gen_id(*min(cands, key=cost))


def left(chain, month):
    """まだ使っていない映像の組み合わせの数（その月に出せるもの）"""
    seen = {visual(x) for x in chain}
    return len({c[1:] for c in all_combos(month)} - seen)
