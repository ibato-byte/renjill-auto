#!/usr/bin/env python3
"""作業用BGM（長尺・横長）を作って YouTube に出す（オーナー依頼 2026-11-13）。
ねらい：短尺（言葉なしのコメディ）で知ってもらい、長尺の作業用BGMで視聴時間を積み上げる。

1本ごとに全部ちがう作品にする（同じ型の量産にしない）：
- 音楽：その回の seed で毎回あたらしく作る（rig/bgm/music.py。調・速さ・進行・旋律・楽器が変わる。完全自作＝権利の申し立てなし）
- 絵：その回のテーマ（時間帯・天気・部屋）と、4つの章（15分ごとに時刻が進み、2匹のようすが変わる）
- 題名・説明・曲名の一覧もその回のもの

  python auto/bgm.py plan  [--date YYYY-MM-DD]          その回の計画を表示
  python auto/bgm.py build [--date …] [--minutes 60]    作る → 検査（dist/bgm/<date>/）。検査に落ちたら終了コード 3
  python auto/bgm.py upload [--date …]                  検査に通ったものだけ出す（auto/bgm_state.json に記録。同じ日は二重に出さない）
  python auto/bgm.py run   [--date …] [--force]         予定の曜日なら build → upload（GitHub Actions の bgm.yml から）
  python auto/bgm.py todos                              前の回でやり残したこと（表紙・再生リスト）を片付ける
  python auto/bgm.py publish                            限定公開で出した回を公開に切り替える（オーナーの OK のあと）
  python auto/bgm.py relabel                            出した回の曲名（説明欄の Tracklist）を、いまの決まりに付け直す
作り置き（オーナー依頼 2026-11-14：先の回の動画を前もって作っておく。出すのは予定の日。bgm-stock.yml から）：
  python auto/bgm.py stock-plan [--until YYYY-MM-DD]    これから作り置きする回の一覧（日付と回の番号）
  python auto/bgm.py build --date … --n N               先の日付の回を、回の番号を指定して作る
  python auto/bgm.py stock-record --src DIR --run ID    作った回を並び順に検査し直して auto/bgm_state.json の stock に記録
  python auto/bgm.py stock-fetch [--date …]             その日の作り置きを dist/bgm_stock/<date>/ に取ってくる（なければ何もしない）
設定は auto/bgm_config.json（曜日・長さ・公開範囲）。
"""
import argparse, datetime as dt, json, os, pathlib, shutil, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import bgm_qa, bgm_names

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUTO, DIST, RIG = ROOT / "auto", ROOT / "dist", ROOT / "rig" / "bgm"
JST = dt.timezone(dt.timedelta(hours=9))
PLAYLIST = "Lofi with Ren & Jill / 作業用BGM"
FPS, LOOP = 24, 60          # 1章の絵は 60 秒のループ
XF = 4                      # 章の切り替えは 4 秒かけてなめらかに（瞬間カット禁止）
TARGET_LUFS = -15.0
VIDEO_NAME = "bgm.mov"       # H.264 ＋ 圧縮しない音（PCM）。MOV は YouTube が正式に受け付ける形

# テーマ（時間帯×天気×曲調）。hours＝4つの章の時刻。ren / jil＝章ごとのようす（rig/bgm/scene.js）。style＝曲調（rig/bgm/music.py の STYLES。なければ lofi）。
# 曲調ごとに、音楽だけでなく窓の外・小物・衣装・動きも変わる（オーナー依頼 2026-11-14：海・和・あげあげ・バラードなど、いろんなパターンを）。順番に出す
GENRE = {"lofi": ("Lofi", "for Work & Study"), "sea": ("Seaside Chill Music", "for Work & Study"), "wa": ("Japanese-style Chill Music", "for Work & Study"),
         "club": ("Upbeat House Mix", "to Get Things Done"), "ballad": ("Piano Ballads", "for Quiet Nights")}
AMBIENCE = {"sea": ("waves", 0.34), "wa": ("garden", 0.22), "club": (None, 0.0), "ballad": ("room", 0.12)}   # 環境音と大きさ（lofi は天気で決まる）
LUFS = {"club": -14.0}                                                                                      # 曲調ごとの音量の目安（ほかは TARGET_LUFS）
THEMES = [
    {"id": "rain_night", "weather": "rain", "hours": [17.5, 19.5, 21.5, 23.5], "en": "Rainy Night Overtime", "ja": "雨の夜の残業", "zh": "下雨夜的加班", "ko": "비 오는 밤의 야근",
     "ren": ["type", "hay", "sleepy", "asleep"], "jil": ["type", "glance", "glance", "happy"], "thumb": [2, 13.5],
     "blurb_en": "It's raining outside. Jill keeps working; Ren… tries his best until he doesn't.", "blurb_ja": "外は雨。ジルは黙々と、課長のレンは…がんばって、やがて寝ます。"},
    {"id": "seaside", "style": "sea", "weather": "clear", "hours": [13.0, 15.0, 17.2, 18.6], "en": "Seaside Office", "ja": "海辺のオフィス", "zh": "海邊的辦公室", "ko": "바닷가 사무실",
     "ren": ["type", "hay", "sleepy", "type"], "jil": ["type", "happy", "glance", "happy"], "thumb": [1, 14.0],
     "blurb_en": "Today the office has an ocean view. Waves, a slow guitar, and a boss in a straw hat.", "blurb_ja": "今日のオフィスは海の見える窓。波の音とゆったりしたギター、麦わら帽子の課長。"},
    {"id": "wa_evening", "style": "wa", "weather": "clear", "hours": [15.5, 16.8, 17.6, 18.4], "en": "Japanese Garden Evening", "ja": "和の夕べ", "zh": "和風的傍晚", "ko": "일본풍의 저녁",
     "ren": ["type", "hay", "type", "sleepy"], "jil": ["type", "glance", "happy", "glance"], "thumb": [2, 14.5],
     "blurb_en": "Koto- and shakuhachi-style melodies, maple leaves outside, and green tea on the desk.", "blurb_ja": "琴と尺八ふうの音色、窓の外にはもみじ、机にはお茶。"},
    {"id": "dance_night", "style": "club", "weather": "clear", "hours": [20.0, 21.5, 23.0, 23.9], "en": "Office Dance Night", "ja": "オフィス・ダンスナイト", "zh": "辦公室舞夜", "ko": "오피스 댄스 나이트",
     "ren": ["type", "dance", "hay", "dance"], "jil": ["glance", "type", "dance", "dance"], "thumb": [3, 13.4],
     "blurb_en": "Headphones on. An upbeat mix for when the work needs to move – and so does the boss.", "blurb_ja": "ヘッドホンをつけて、ノリノリで。仕事を一気に進めたいときの、アップテンポなミックス。"},
    {"id": "quiet_ballads", "style": "ballad", "weather": "clear", "hours": [18.5, 20.0, 21.5, 23.0], "en": "Quiet Night Ballads", "ja": "静かな夜のバラード", "zh": "靜夜的抒情曲", "ko": "조용한 밤의 발라드",
     "ren": ["gaze", "type", "gaze", "asleep"], "jil": ["type", "gaze", "type", "gaze"], "thumb": [0, 9.0],
     "blurb_en": "Piano and strings by candlelight. A slow, sentimental hour to end the day.", "blurb_ja": "ろうそくの灯りと、ピアノとストリングス。一日の終わりの、しっとりした1時間。"},
    {"id": "morning", "weather": "clear", "hours": [8.5, 9.5, 10.5, 11.5], "en": "Morning Focus", "ja": "朝の集中タイム", "zh": "早晨的專注時間", "ko": "아침 집중 타임",
     "ren": ["sleepy", "type", "hay", "type"], "jil": ["type", "happy", "glance", "type"], "thumb": [1, 20.0],
     "blurb_en": "A bright morning at the office. Ren wakes up slowly; Jill is already in the zone.", "blurb_ja": "晴れた朝のオフィス。レンはゆっくり目を覚まし、ジルはもう集中しています。"},
    {"id": "clear_night", "weather": "clear", "hours": [18.0, 20.0, 22.0, 23.75], "en": "Late Night at the Office", "ja": "夜のオフィス", "zh": "夜晚的辦公室", "ko": "밤의 사무실",
     "ren": ["type", "type", "hay", "asleep"], "jil": ["happy", "type", "glance", "type"], "thumb": [2, 14.5],
     "blurb_en": "City lights, a warm desk lamp, and two bunnies finishing the day.", "blurb_ja": "街の明かりとデスクランプ。2匹が一日の仕事を終えるまで。"},
    {"id": "rain_afternoon", "weather": "rain", "hours": [13.0, 14.0, 15.0, 16.0], "en": "Rainy Afternoon", "ja": "雨の午後", "zh": "下雨的午後", "ko": "비 오는 오후",
     "ren": ["hay", "sleepy", "type", "type"], "jil": ["type", "glance", "type", "happy"], "thumb": [1, 13.5],
     "blurb_en": "A slow, rainy afternoon. After lunch, staying awake is Ren's biggest task.", "blurb_ja": "雨の午後。お昼のあと、眠気とたたかうのが課長のいちばんの仕事。"},
    {"id": "sunset", "weather": "clear", "hours": [15.5, 16.5, 17.5, 19.0], "en": "Sunset at the Office", "ja": "夕暮れのオフィス", "zh": "黃昏的辦公室", "ko": "해 질 녘의 사무실",
     "ren": ["type", "hay", "type", "sleepy"], "jil": ["type", "type", "happy", "glance"], "thumb": [2, 20.0],
     "blurb_en": "The sky turns orange, then blue. One more task before going home.", "blurb_ja": "空がオレンジから青へ。帰る前に、もうひと仕事。"},
    {"id": "rain_morning", "weather": "rain", "hours": [8.0, 9.0, 10.0, 11.0], "en": "Rainy Morning", "ja": "雨の朝", "zh": "下雨的早晨", "ko": "비 오는 아침",
     "ren": ["sleepy", "sleepy", "type", "hay"], "jil": ["type", "glance", "type", "happy"], "thumb": [2, 5.0],
     "blurb_en": "Rain on the window, coffee on the desk. A quiet start to the day.", "blurb_ja": "窓に雨、机にコーヒー。静かな一日のはじまり。"},
]
# 曲名（説明欄の Tracklist）は auto/bgm_names.py：その回のテーマに合った「英語｜日本語」の名前。回をまたいで二度使わない
def pick_names(seed, n, used=(), theme=None): return bgm_names.pick(seed, n, used, theme or bgm_names.DEFAULT)


I18N = {  # YouTube の多言語の題名・説明（{en}{ja}{zh}{ko}＝テーマ名、{g}＝曲調）
    "ja": ("【作業用BGM】{ja}｜レンとジルと一緒に1時間 {g}", "うさぎの課長レンと部下ジルと一緒に、作業や勉強を。音楽もアニメもこの動画のためのオリジナルです。"),
    "ko": ("{ko} – 렌과 질과 함께하는 1시간 {g} | 공부·작업용 음악", "토끼 과장 렌과 부하 질과 함께 공부하고 일해요. 음악과 애니메이션 모두 이 영상을 위해 만든 오리지널입니다."),
    "zh-Hant": ("{zh}｜和 Ren 與 Jill 一起的 1 小時 {g}｜讀書・工作用音樂", "和兔子課長 Ren、部下 Jill 一起讀書工作。音樂與動畫都是為這支影片原創製作。"),
    "es": ("{en} – 1 hora de {g} para trabajar y estudiar con Ren & Jill", "Trabaja o estudia junto a Ren y Jill, dos conejos de oficina. Música y animación originales, hechas para este vídeo."),
    "pt": ("{en} – 1 hora de {g} para trabalhar e estudar com Ren & Jill", "Trabalhe ou estude com Ren e Jill, dois coelhos de escritório. Música e animação originais, feitas para este vídeo."),
}
STYLE_TAGS = {"lofi": ["lofi", "lofi hip hop", "lofi 作業用", "chill beats", "relaxing music"], "sea": ["seaside music", "ocean waves", "chill guitar", "海 BGM", "relaxing music"],
              "wa": ["japanese music", "koto", "shakuhachi", "和風BGM", "relaxing music"], "club": ["house music", "upbeat music", "dance mix", "テンション上がる BGM", "workout music"],
              "ballad": ["piano ballad", "sad piano", "emotional music", "ピアノ BGM", "relaxing music"]}
STYLE_HASH = {"lofi": "#lofi", "sea": "#chillmusic", "wa": "#japanesemusic", "club": "#housemusic", "ballad": "#pianomusic"}
GENRE_I18N = {"lofi": {"ja": "lofi", "ko": "로파이", "zh-Hant": "Lofi", "es": "lofi", "pt": "lofi"}, "sea": {"ja": "海辺のチル", "ko": "바닷가 칠 음악", "zh-Hant": "海邊輕音樂", "es": "música chill de playa", "pt": "música chill de praia"},
              "wa": {"ja": "和のチル", "ko": "일본풍 칠 음악", "zh-Hant": "和風輕音樂", "es": "música chill japonesa", "pt": "música chill japonesa"},
              "club": {"ja": "アップテンポ・ミックス", "ko": "업템포 하우스 믹스", "zh-Hant": "快節奏 House Mix", "es": "house animado", "pt": "house animado"},
              "ballad": {"ja": "ピアノ・バラード", "ko": "피아노 발라드", "zh-Hant": "鋼琴抒情曲", "es": "baladas de piano", "pt": "baladas de piano"}}


def log(*a): print("[bgm]", *a, flush=True)
def load(p, default): return json.loads(p.read_text()) if p.exists() else default
def config(): return {**{"days": [2, 5], "minutes": 60, "privacy": "unlisted", "enabled": True}, **load(AUTO / "bgm_config.json", {})}
def state(): return load(AUTO / "bgm_state.json", {"episodes": {}})
def run(cmd, **kw): return subprocess.run([str(c) for c in cmd], check=True, **kw)


def plan(date, st=None, cfg=None, theme=None, n=None):
    """その日の回の計画。回の番号＝これまでに出した本数＋その日より前の作り置き（同じテーマ・同じ部屋が続かない）。seed は日付。
    n＝作り置きで先の日付の回を作るときに、回の番号（0 始まり）を指定する"""
    st, cfg = st or state(), cfg or config()
    done = sorted(k for k, v in st["episodes"].items() if v.get("yt") and k != date)
    if n is None: n = len(done) + sum(1 for k in st.get("stock", {}) if k < date and k not in done)
    th = next(x for x in THEMES if x["id"] == theme) if theme else THEMES[n % len(THEMES)]   # theme＝手元で特定のテーマを試すとき
    seed = int(date.replace("-", ""))
    minutes = cfg["minutes"]
    style = th.get("style", "lofi"); g, use = GENRE[style]
    title = f'{th["en"]} – {_dur_en(minutes)} {g} {use} with Ren & Jill | 作業用BGM {th["ja"]}'
    if len(title) > 100: title = f'{th["en"]} – {_dur_en(minutes)} {g} with Ren & Jill | 作業用BGM {th["ja"]}'
    return {"date": date, "no": n + 1, "theme": th["id"], "seed": seed, "look": n % 4, "minutes": minutes, "weather": th["weather"], "hours": th["hours"], "style": style, "month": int(date[5:7]),
            "ren": th["ren"], "jil": th["jil"], "thumb": th["thumb"], "title": title[:100], "en": th["en"], "ja": th["ja"], "blurb_en": th["blurb_en"], "blurb_ja": th["blurb_ja"]}


TRACKLIST = "Tracklist｜曲目"      # 見出しも日本語を並べる（2026-11-14 オーナーの指摘「Tracklist が意味不明」）


def _dur_en(m): return "1 Hour" if m == 60 else f"{int(m)} Min" if m < 60 else f"{m / 60:g} Hours"
def _ts(s): s = int(round(s)); return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"
def query(pl, i): return f'hour={pl["hours"][i]}&ren={pl["ren"][i]}&jil={pl["jil"][i]}&weather={pl["weather"]}&look={pl["look"]}&seed={pl["seed"] % 97 + i}&style={pl.get("style", "lofi")}&month={pl.get("month", 11)}'


def description(pl, tracks, used_names=()):
    """説明：英語が主・日本語が従。曲の一覧（時刻つき＝YouTube のチャプターになる）。used_names＝これまでの回で使った曲名（使わない）"""
    names = pick_names(pl["seed"], len(tracks), used_names, pl["theme"])
    t, lines = 0.0, []
    for nm, tr in zip(names, tracks):
        if t < pl["minutes"] * 60 - 20: lines.append(f"{_ts(t)} {nm}")
        t += tr["sec"] - 3.0
    body = (f'Work or study alongside Ren & Jill, two office bunnies. {pl["blurb_en"]}\n'
            f'レンとジルと一緒に、作業や勉強を。{pl["blurb_ja"]}\n\n'
            f'The clock moves on every {pl["minutes"] // len(pl["hours"])} minutes – see how the two of them are doing.\n'
            f'{pl["minutes"] // len(pl["hours"])}分ごとに時計が進みます。ときどき2匹のようすをのぞいてみてください。\n\n'
            f'{TRACKLIST}\n' + "\n".join(lines) + '\n\n'
            'All music and animation are original, made in-house for this video (no samples). Feel free to play it in the background.\n'
            '音楽もアニメーションも、この動画のために作ったオリジナルです。\n\n'
            '▶ Daily shorts: a wordless office comedy / 毎日のショート（セリフなしのオフィスコメディ）もどうぞ\n'
            'Instagram / TikTok / X: @renjill_office\n© COANA TOKYO')
    return body, names


def localizations(pl, title, desc):
    out = {}
    for lang, (t, d) in I18N.items():
        th = next((x for x in THEMES if x["id"] == pl["theme"]), {})
        out[lang] = {"title": t.format(en=pl["en"], ja=pl["ja"], zh=th.get("zh", pl["en"]), ko=th.get("ko", pl["en"]), g=GENRE_I18N[pl.get("style", "lofi")][lang])[:100], "description": f"{d}\n\n{desc}"[:5000]}
    return out


# ---------- 音 ----------
def build_audio(pl, work, avoid=()):
    """avoid＝これまでの回で使った曲（調|進行|速さ）。同じ曲を作らない"""
    mdir = work / "music"; mdir.mkdir(parents=True, exist_ok=True)
    (work / "avoid.json").write_text(json.dumps(sorted(avoid)))
    style = pl.get("style", "lofi")
    amb_kind, amb = AMBIENCE.get(style) or (("rain", 0.30) if pl["weather"] == "rain" else ("room", 0.16))
    run([sys.executable, RIG / "music.py", mdir, "--seed", pl["seed"], "--minutes", pl["minutes"] + 0.5, "--ambience", amb_kind or "room", "--style", style, "--avoid", work / "avoid.json"])
    info = json.loads((mdir / "tracks.json").read_text()); tracks = info["tracks"]
    total = pl["minutes"] * 60
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for tr in tracks: cmd += ["-i", mdir / tr["file"]]
    cmd += ["-stream_loop", "-1", "-i", mdir / "ambience.wav"]
    f, cur = "", "[0:a]"
    for i in range(1, len(tracks)):
        f += f"{cur}[{i}:a]acrossfade=d=3:c1=tri:c2=tri[x{i}];"; cur = f"[x{i}]"
    f += f"[{len(tracks)}:a]volume={amb}[amb];{cur}[amb]amix=inputs=2:duration=first:normalize=0,atrim=0:{total},afade=t=in:d=2,afade=t=out:st={total - 6}:d=6[a]"
    raw = work / "audio_raw.wav"
    run(cmd + ["-filter_complex", f, "-map", "[a]", "-ar", "44100", raw])
    # 音量をそろえる（-15 LUFS）。全体を同じ倍率で動かすだけ（曲の強弱はそのまま。loudnorm の自動調整は、まれな山があると場所ごとに音量を変えてしまう＝2026-11-13 の1本目でピークが +0.3 dB になった）
    m = bgm_qa.loudness(raw)
    gain = max(-12.0, min(12.0, LUFS.get(style, TARGET_LUFS) - m["lufs"]))
    out = work / "audio.wav"
    # 最後に安全のためのリミッター（0.7＝-3.1 dB）。音は圧縮しない（48kHz・16bit の PCM のまま YouTube に渡す）。
    # ffmpeg の AAC は、1時間の中に1〜2か所、元の音にない大きな山（+0.4 dB）を作った（2026-11-13 に3回再現。場所は毎回違う）ので使わない
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", f"volume={gain:.2f}dB,alimiter=limit=0.7:attack=5:release=60:level=disabled", "-ar", "48000", "-c:a", "pcm_s16le", out])
    log("音量", f'{m["lufs"]} LUFS・ピーク {m["peak"]} dB → {gain:+.2f} dB')
    raw.unlink()
    pk = bgm_qa.loudness(out)["peak"]
    if pk > -1.0: raise SystemExit(f"音のピークが {pk} dBFS（-1.0 以下のはず）。絵を作る前に止める")
    return out, tracks


# ---------- 絵 ----------
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", str(FPS), "-x264-params", f"keyint={FPS * 2}:min-keyint={FPS * 2}:scenecut=0:open-gop=0", "-bf", "0", "-video_track_timescale", "12288"]


def enc(frames, out, start=0, n=None, vf=None):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", FPS, "-start_number", start, "-i", frames / "f%05d.jpg"]
    if n: cmd += ["-frames:v", n]
    if vf: cmd += ["-vf", vf]
    run(cmd + ENC + [out])


def set_crf(style):
    """あげあげの回は画面全体の色が動き続けてファイルが大きくなる（8分で 227MB）ので、少しだけ圧縮を強める"""
    ENC[ENC.index("-crf") + 1] = "24" if style == "club" else "21"


def build_video(pl, work, par=3):
    set_crf(pl.get("style", "lofi"))
    n = len(pl["hours"]); reps = pl["minutes"] // n          # 1章＝reps 分（60秒ループ×reps）
    assert pl["minutes"] % n == 0 and reps >= 2, "長さは章の数（4）の倍数の分にする"
    fr = [work / f"ch{i}" for i in range(n)]
    for i in range(n):
        run(["node", RIG / "render.js", fr[i], query(pl, i), FPS, par, LOOP])
    seg = work / "seg"; seg.mkdir(exist_ok=True)
    N, X = FPS * LOOP, FPS * XF
    order = []
    for i in range(n):
        enc(fr[i], seg / f"loop{i}.mp4")
        if i == 0:
            enc(fr[i], seg / "first.mp4", vf="fade=t=in:st=0:d=2"); order += ["first.mp4"] + ["loop0.mp4"] * (reps - 1)
        else:
            # 前の章 → この章へ 4 秒かけて溶けるように切り替える。どちらもループの頭（t=0〜4）なので、前後がぴったりつながる
            run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", FPS, "-i", fr[i - 1] / "f%05d.jpg", "-framerate", FPS, "-i", fr[i] / "f%05d.jpg",
                 "-filter_complex", f"[0:v][1:v]blend=all_expr='A*(1-T/{XF})+B*(T/{XF})'", "-frames:v", X] + ENC + [seg / f"x{i}.mp4"])
            enc(fr[i], seg / f"tail{i}.mp4", start=X, n=N - X)
            order += [f"x{i}.mp4", f"tail{i}.mp4"] + [f"loop{i}.mp4"] * (reps - 1)
    enc(fr[n - 1], seg / "last.mp4", vf=f"fade=t=out:st={LOOP - 5}:d=5")
    order[-1] = "last.mp4"
    (seg / "list.txt").write_text("".join(f"file '{x}'\n" for x in order))
    video = work / "video.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", seg / "list.txt", "-c", "copy", video])
    return video, fr


def build(date, minutes=None, keep=False, par=3, theme=None, n=None, redo=False):
    cfg = config()
    if minutes: cfg["minutes"] = minutes
    pl = plan(date, cfg=cfg, theme=theme, n=n)
    avoid, used_names = history(date, state(), cfg, redo=redo)
    work = DIST / "bgm" / date
    if work.exists(): shutil.rmtree(work)
    work.mkdir(parents=True)
    log("計画", json.dumps({k: pl[k] for k in ("no", "theme", "seed", "look", "minutes", "title")}, ensure_ascii=False))
    log("これまでの回で使った曲", len(avoid), "・曲名", len(used_names), "は使わない")
    audio, tracks = build_audio(pl, work, avoid)
    video, frames = build_video(pl, work, par)
    out = work / VIDEO_NAME
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", audio, "-c", "copy", "-shortest", "-movflags", "+faststart", out])
    audio.unlink()
    ci, tt = pl["thumb"]
    thumb_full, thumb = work / "thumb_full.jpg", work / "thumb.jpg"
    run(["node", RIG / "render.js", thumb_full, query(pl, ci), "thumb", tt])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", thumb_full, "-vf", "crop=1440:810:400:200,scale=1280:720", "-q:v", "2", thumb])   # 2匹とランプに寄る（文字なし。YouTube の表紙は文字なしにそろえる＝2026-10-26 の決定）
    desc, names = description(pl, tracks, used_names)
    meta = {**pl, "code": code_hash(), "description": desc, "track_names": names, "tracks": tracks, "localizations": localizations(pl, pl["title"], desc),
            "tags": STYLE_TAGS[pl.get("style", "lofi")] + ["study music", "work music", "作業用BGM", "勉強用BGM", "focus music", "Ren and Jill", "レンとジル", "bunny", "うさぎ", "background music"]}
    (work / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    st = state()
    qa = bgm_qa.check_all(work, meta, frames, prev_of(date, st))
    (work / "qa.json").write_text(json.dumps(qa, ensure_ascii=False, indent=1))
    bgm_qa.contact_sheet(frames, work / "sheet.jpg")
    for p in qa["problems"]: log("NG", p)
    for p in qa["warnings"]: log("注意", p)
    log("検査", "合格" if qa["ok"] else "不合格", json.dumps(qa["numbers"], ensure_ascii=False))
    if not keep:
        for d in frames: shutil.rmtree(d, ignore_errors=True)
        shutil.rmtree(work / "seg", ignore_errors=True); shutil.rmtree(work / "music", ignore_errors=True); (work / "video.mp4").unlink(missing_ok=True); thumb_full.unlink(missing_ok=True)
    return qa["ok"], work, meta


def upload(date, privacy=None):
    cfg, st = config(), state()
    if (st["episodes"].get(date) or {}).get("yt"):
        log(date, "は投稿済み（二重に出さない）", st["episodes"][date]["yt"]); return st["episodes"][date]["yt"]
    work = DIST / "bgm" / date
    meta, qa = json.loads((work / "meta.json").read_text()), json.loads((work / "qa.json").read_text())
    if not qa["ok"]: raise SystemExit("検査に落ちた回は出さない")
    style = meta.get("style", "lofi")
    heard = {"lofi"} | {(next((x for x in THEMES if x["id"] == r.get("theme")), {}) or {}).get("style", "lofi") for r in st["episodes"].values() if r.get("yt") and r.get("privacy") == "public"}
    # 新しい曲調の1本目は限定公開で出す（Claude は音を聞けないので、オーナーが聞いて OK を出してから公開にする。cfg の new_style_privacy を public にすればこの確認をやめられる）
    first_of_style = style not in heard
    privacy = privacy or (cfg.get("new_style_privacy", "unlisted") if first_of_style and cfg["privacy"] == "public" else cfg["privacy"])
    from googleapiclient.http import MediaFileUpload
    import comments, stories, sns_policy
    yt = comments.yt_client()
    desc = sns_policy.yt_description(meta["description"]) + f"\n\n{STYLE_HASH[meta.get('style', 'lofi')]} #studymusic #作業用BGM"
    loc = {k: {"title": v["title"], "description": (sns_policy.yt_description(v["description"]) + f"\n\n{STYLE_HASH[meta.get('style', 'lofi')]} #studymusic #作業用BGM")[:5000]} for k, v in meta["localizations"].items()}
    snippet = {"title": meta["title"], "description": desc[:5000], "tags": meta["tags"], "categoryId": "10", "defaultLanguage": "en"}
    status = {"privacyStatus": privacy, "selfDeclaredMadeForKids": False, "embeddable": True}
    # YouTube が題名・説明・タグ・多言語のどれかを受け付けないとき（400 INVALID_REQUEST_METADATA。2026-11-13 の1本目）は、
    # 疑わしいものから外して出す（多言語 → タグ → 説明を短く）。動画は出し、外したものは記録して次の実行までに直す。
    # この確認は送信の最初（動画を送る前）に返るので、やり直しても時間はかからない
    plans = [("全部", {"snippet": snippet, "localizations": loc, "status": status}, "snippet,status,localizations"),
             ("多言語なし", {"snippet": snippet, "status": status}, "snippet,status"),
             ("多言語・タグなし", {"snippet": {k: v for k, v in snippet.items() if k != "tags"}, "status": status}, "snippet,status"),
             ("題名と短い説明だけ", {"snippet": {"title": meta["title"], "description": f'{meta["blurb_en"]}\n{meta["blurb_ja"]}', "categoryId": "10"}, "status": status}, "snippet,status")]
    resp, used = None, None
    for name, body, part in plans:
        req = yt.videos().insert(part=part, body=body, media_body=MediaFileUpload(str(work / VIDEO_NAME), mimetype="video/quicktime", chunksize=32 * 1024 * 1024, resumable=True))
        try:
            resp, used = _send(req), name; break
        except Exception as e:
            if "INVALID_REQUEST_METADATA" in str(e) or "invalid" in str(e).lower():
                log(f"YouTube が受け付けない（{name}）→ 次の形で出す", str(e)[:200]); continue
            raise
    if resp is None: raise SystemExit("YouTube が題名・説明を受け付けなかった")
    vid = resp["id"]
    rec = {"yt": vid, "privacy": privacy, "title": meta["title"], "theme": meta["theme"], "style": style, "seed": meta["seed"], "look": meta["look"], "minutes": meta["minutes"],
           "at": dt.datetime.now(JST).isoformat(timespec="minutes"), "track_keys": [f'{t["key"]}|{"-".join(t["prog"])}|{t["bpm"]}' for t in meta["tracks"]], "track_names": meta["track_names"]}
    st["episodes"][date] = rec
    st.get("stock", {}).pop(date, None)                                                    # 出した回の作り置きは役目を終えた
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))     # 出した直後に記録（あとの処理が失敗しても二重に出さない）
    if used != "全部": rec["todo"] = [f"題名・説明の一部を外して出した（{used}）"]
    for name, fn in (("表紙", lambda: yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(work / "thumb.jpg"), mimetype="image/jpeg")).execute()),
                     ("再生リスト", lambda: stories.add_to_playlist(yt, vid, PLAYLIST))):
        if not _try(fn, name): rec.setdefault("todo", []).append(name)      # 付けられなかったものは記録し、次の実行（todos）でやり直す
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
    log("投稿した", f"https://youtu.be/{vid}", privacy)
    media_sync()
    return vid


def _try(fn, name, tries=3, wait=8):
    """表紙・再生リストのような後付けの処理。再生リストは作った直後に 409（処理中）が返ることがある（2026-11-13 の1本目）ので、間をあけてやり直す"""
    import time
    for i in range(tries):
        try: fn(); return True
        except Exception as e:
            log(name, f"を付けられず（{i + 1}/{tries}）", type(e).__name__, str(e)[:160])
            if i < tries - 1: time.sleep(wait * (i + 1))
    return False


def todos():
    """前の回でやり残したこと（表紙・再生リスト）を片付ける。表紙は content/bgm/<日付>_thumb.jpg を使う"""
    st = state(); left = [(d, r) for d, r in st["episodes"].items() if r.get("yt") and r.get("todo")]
    if not left: log("やり残しなし"); media_sync(); return 0
    from googleapiclient.http import MediaFileUpload
    import comments, stories
    yt = comments.yt_client()
    for d, r in left:
        keep = []
        for name in r["todo"]:
            if name == "再生リスト": ok = _try(lambda: stories.add_to_playlist(yt, r["yt"], PLAYLIST), name)
            elif name == "表紙" and (ROOT / "content" / "bgm" / f"{d}_thumb.jpg").exists():
                ok = _try(lambda: yt.thumbnails().set(videoId=r["yt"], media_body=MediaFileUpload(str(ROOT / "content" / "bgm" / f"{d}_thumb.jpg"), mimetype="image/jpeg")).execute(), name)
            else: ok = False
            if not ok: keep.append(name)
            else: log(d, name, "を付けた")
        if keep: r["todo"] = keep
        else: r.pop("todo", None)
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
    media_sync()
    return 0


def publish():
    """限定公開・非公開で出した回を「公開」に切り替える（オーナーが聞いて OK を出したあとに使う）。YouTube で切り替わったことを読み直して確かめる"""
    st = state(); todo = [(d, r) for d, r in st["episodes"].items() if r.get("yt") and r.get("privacy") != "public"]
    if not todo: log("公開に切り替える回なし"); media_sync(); return 0
    import comments
    yt = comments.yt_client(); bad = 0
    for d, r in todo:
        res = yt.videos().update(part="status", body={"id": r["yt"], "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False, "embeddable": True}}).execute()
        log(d, "切り替えの返事", (res.get("status") or {}).get("privacyStatus"))
        now = {}
        for i in range(6):                       # 読み直しは反映が少し遅れることがある（2026-11-14：直後は unlisted のままだった）ので、間をあけて確かめる
            now = (yt.videos().list(part="status", id=r["yt"]).execute().get("items") or [{}])[0].get("status", {})
            if now.get("privacyStatus") == "public": break
            __import__("time").sleep(10)
        if now.get("privacyStatus") == "public": r["privacy"] = "public"; log(d, "を公開にした", f'https://youtu.be/{r["yt"]}', "処理:", now.get("uploadStatus"))
        else: bad += 1; log(d, "を公開にできず", now)
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
    media_sync()
    return 1 if bad else 0


TS_LINE = r"(?m)^(\d+:\d{2}(?::\d{2})?) (.+)$"


def relabel_text(text, names):
    """説明の中の曲の一覧（「0:00 曲名」の行）の曲名だけを、上から順に names に入れ替える。時刻はそのまま。見出しも「Tracklist｜曲目」にする"""
    import re
    it = iter(names)
    out = re.sub(TS_LINE, lambda m: f"{m.group(1)} {next(it, m.group(2))}", text)
    return re.sub(r"(?m)^Tracklist$", TRACKLIST, out)


def relabel(dry=False):
    """出した回の曲名を、いまの決まり（テーマに合った「英語｜日本語」・回をまたいでかぶらない）に付け直す。動画と時刻は変えない（説明の文字だけ）。
    2026-11-14 オーナーの指摘「Tracklist が意味不明」：1・2本目は、回と関係のない英語だけの名前で、2本のあいだで13個かぶっていた"""
    import re
    st = state(); todo = [(d, r) for d, r in sorted(st["episodes"].items()) if r.get("yt") and not all(bgm_names.SEP in x for x in (r.get("track_names") or [""]))]
    if not todo: log("曲名を付け直す回なし"); return 0
    import comments
    yt = None if dry else comments.yt_client(); bad = 0
    for d, r in todo:
        used = set()
        for k, v in list(st["episodes"].items()) + list(st.get("stock", {}).items()):
            if k != d: used |= {x for x in (v.get("track_names") or []) if bgm_names.SEP in x}
        names = pick_names(r["seed"], len(r.get("track_keys") or []) or 30, used, r.get("theme"))
        if dry: log(d, r.get("theme"), names[:4]); r["track_names"] = names; continue
        try:
            it = (yt.videos().list(part="snippet,localizations", id=r["yt"]).execute().get("items") or [None])[0]
            if not it: raise RuntimeError("動画が見つからない")
            sn = it["snippet"]; n = len(re.findall(TS_LINE, sn.get("description", "")))
            if n < 3: raise RuntimeError(f"説明に曲の一覧が見つからない（{n} 行）")
            body = {"id": r["yt"], "snippet": {"title": sn["title"], "categoryId": sn.get("categoryId", "10"), "description": relabel_text(sn["description"], names)[:5000]}}
            for k in ("tags", "defaultLanguage"):
                if sn.get(k): body["snippet"][k] = sn[k]
            part = "snippet"
            if it.get("localizations"):
                body["localizations"] = {lang: {"title": v["title"], "description": relabel_text(v.get("description", ""), names)[:5000]} for lang, v in it["localizations"].items()}; part = "snippet,localizations"
            yt.videos().update(part=part, body=body).execute()
            r["track_names"] = names
            (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
            log(d, "の曲名を付け直した", f'https://youtu.be/{r["yt"]}', n, "曲：", names[0], "…")
        except Exception as e:
            bad += 1; log(d, "の曲名を付け直せず", type(e).__name__, str(e)[:200])
    return 1 if bad else 0


MEDIA_REPO = "ibato-byte/renjill-media"


def media_list(st):
    """公式サイト（renjill.coana.co.jp）の「長い動画」の一覧。公開した回だけ・新しい順。サイトが renjill-media/bgm.json を読む"""
    th = {t["id"]: t for t in THEMES}; out = []
    for d, r in st["episodes"].items():
        if not r.get("yt") or r.get("privacy") != "public": continue
        t = th.get(r.get("theme")) or {}
        out.append({"date": (r.get("at") or d)[:10], "youtube_id": r["yt"], "minutes": r.get("minutes"), "thumb": f"bgm_{d}_thumb.jpg",
                    "title": {"ja": t.get("ja") or r.get("title", ""), "en": t.get("en") or r.get("title", ""), "zh": t.get("zh") or t.get("en", ""), "ko": t.get("ko") or t.get("en", "")}})
    return sorted(out, key=lambda x: x["date"], reverse=True)


def media_sync():
    """公式サイト用に、表紙（bgm_<日付>_thumb.jpg）と一覧（bgm.json）を公開リポジトリ renjill-media に置く。失敗しても投稿は止めない（次の実行でやり直す）"""
    tok = os.environ.get("MEDIA_TOKEN")
    if not tok: log("MEDIA_TOKEN がないので、サイト用の一覧は書かない"); return False
    import base64, requests
    H = {"Authorization": f"Bearer {tok}", "Accept": "application/vnd.github+json"}
    def put(name, data):
        api = f"https://api.github.com/repos/{MEDIA_REPO}/contents/{name}"
        cur = requests.get(api, headers=H, timeout=30)
        if cur.status_code == 200 and base64.b64decode(cur.json().get("content") or "") == data: return        # 同じ中身なら書かない
        body = {"message": f"bgm: {name}", "content": base64.b64encode(data).decode()}
        if cur.status_code == 200: body["sha"] = cur.json()["sha"]
        r = requests.put(api, headers=H, json=body, timeout=60)
        if r.status_code not in (200, 201): raise RuntimeError(f"{name}: HTTP {r.status_code}")
        log("サイト用に置いた", name)
    try:
        st = state(); items = []
        for it in media_list(st):
            d = it["thumb"][4:14]
            f = next((x for x in (DIST / "bgm" / d / "thumb.jpg", ROOT / "content" / "bgm" / f"{d}_thumb.jpg") if x.exists()), None)
            if f: put(it["thumb"], f.read_bytes())
            items.append(it)
        put("bgm.json", (json.dumps(items, ensure_ascii=False, indent=1) + "\n").encode())
        return True
    except Exception as e:
        log("サイト用の一覧を書けず", type(e).__name__, str(e)[:160]); return False


def _send(req):
    """動画を送る。通信が切れたら続きから送り直す（最初からやり直さない）。YouTube が内容を断った（400 番台）ときは、やり直さずにすぐ返す"""
    import time
    resp, tries = None, 0
    while resp is None:
        try:
            status, resp = req.next_chunk(num_retries=5)
            if status: log(f"送信 {int(status.progress() * 100)}%")
        except Exception as e:
            code = int(getattr(getattr(e, "resp", None), "status", 0) or 0)
            if 400 <= code < 500: raise                      # 内容を断られた。同じものを送り直しても通らない
            tries += 1
            if tries > 8: raise
            log("送信をやり直す", type(e).__name__); time.sleep(10 * tries)
    return resp


# ---------- 作り置き（先の回を前もって作っておく） ----------
# オーナー依頼 2026-11-14「今年いっぱい分の動画作成まで進めて」。動画は GitHub Actions の保管場所（artifact）に置き、出すのは予定の日（水・土 20:23）のまま。
# 当日の流れ（run）：作り置きがあり、作り方（code_hash）が作ったときと同じ → 作り置きを出す。
#                    作り方が変わっていた（週次PDCAが直した）→ 新しい作り方で作り直す。それが検査に落ちたら作り置きを出す。
#                    作り置きがない・取ってこられない → これまでどおり当日に作る。
STOCK = DIST / "bgm_stock"
STOCK_FILES = (VIDEO_NAME, "meta.json", "qa.json", "thumb.jpg")


def code_hash():
    """作り方の指紋。音楽・絵・テーマ・題名の決まりのどれかが変わると変わる（作り置きが古い作り方のままかどうかの判定に使う）"""
    import hashlib
    h = hashlib.sha1()
    files = sorted(p for p in RIG.iterdir() if p.is_file() and p.suffix in (".py", ".js", ".html")) + [ROOT / "rig" / "rig.js", ROOT / "rig" / "v2" / "lib.js"]
    for p in files + [AUTO / "bgm_names.py"]:
        if p.exists(): h.update(p.name.encode()); h.update(p.read_bytes())
    h.update(json.dumps([THEMES, GENRE, AMBIENCE, LUFS, TARGET_LUFS, FPS, LOOP, XF, TRACKLIST, I18N, STYLE_TAGS, STYLE_HASH, GENRE_I18N], ensure_ascii=False, sort_keys=True).encode())
    return h.hexdigest()[:12]


def prev_of(date, st):
    """その日より前に出た回＋その日より前の作り置き（日付順）。前の回とのかぶりの検査に使う"""
    eps = {k: v for k, v in st["episodes"].items() if v.get("yt") and k != date}
    for k, v in st.get("stock", {}).items():
        if k < date and k not in eps: eps[k] = v
    return [v for _, v in sorted(eps.items())]


def history(date, st, cfg, today=None, redo=False):
    """その回が避ける「これまでの回の曲（調|進行|速さ）」と「曲名」。出した回・ほかの日の作り置きの記録に加えて、
    今日〜その日の前までの、まだ作っていない回の分も先に数える（曲の並びは音を作らなくても決まる＝music.choose）。
    作り置きは並べて同時に作るので、こうしないと作り置きどうしで曲がかぶる。redo＝作り置きを全部作り直すとき（古い記録を数えない）"""
    sys.path.insert(0, str(RIG)); import music
    today = today or dt.datetime.now(JST).date().isoformat(); code = code_hash()
    done = {k: v for k, v in st["episodes"].items() if v.get("yt") and k != date}
    stock = {k: v for k, v in st.get("stock", {}).items() if k != date and k not in done and v.get("code") == code and not redo}
    keys, names = set(), set()
    for v in list(done.values()) + list(stock.values()):
        keys |= set(v.get("track_keys") or []); names |= set(v.get("track_names") or [])
    n = len(done)
    for d in slots(today, date, cfg):
        if d in done: continue
        if d >= date: break
        if d not in stock:                                    # まだ作っていない回：計画から曲の並びと曲名を先に決める
            pl = plan(d, st, cfg, n=n)
            heads = music.choose(pl["seed"], pl["minutes"] + 0.5, pl["style"], keys)
            nm = pick_names(pl["seed"], len(heads), names, pl["theme"])
            keys |= {h["tk"] for h in heads}; names |= set(nm)
        n += 1
    return keys, names


def slots(start, until, cfg):
    d, end, out = dt.date.fromisoformat(start), dt.date.fromisoformat(until), []
    while d <= end:
        if d.weekday() in cfg["days"]: out.append(d.isoformat())
        d += dt.timedelta(days=1)
    return out


def stock_plan(until, st, cfg, today, redo=False):
    """これから作り置きする回。今日より後〜until の予定の日のうち、まだ出していない・作り置きがない（または作り方が変わった・順番がずれた）回"""
    done = {k for k, v in st["episodes"].items() if v.get("yt")}
    stock, code, n, out = st.get("stock", {}), code_hash(), len(done), []
    for d in slots(today, until, cfg):
        if d in done: continue
        s = stock.get(d)
        if d > today and (redo or not s or s.get("code") != code or s.get("no") != n + 1): out.append({"date": d, "n": n})
        n += 1
    return out


def stock_record(src, run_id, st=None, now=None):
    """作った回を日付順に並べ、前の回（出した回＋作り置き）とのかぶりを検査し直してから記録する。
    作り置きは並べて同時に作るので、作り置きどうしのかぶりはここで初めて分かる。落ちた回は記録しない（当日に作る）"""
    st = st or state(); stock = st.setdefault("stock", {}); src = pathlib.Path(src); bad = []
    new = {}
    for d in sorted(p for p in src.iterdir() if p.is_dir()):
        date = d.name.replace("bgm-stockmeta-", "")
        if (d / "meta.json").exists() and (d / "qa.json").exists(): new[date] = d
    done = {k for k, v in st["episodes"].items() if v.get("yt")}
    for date in new: stock.pop(date, None)                     # 作り直した回は、古い記録を捨ててから検査する
    for date in sorted(set(new) | set(stock)):
        if date in done: stock.pop(date, None); continue
        if date in new:
            d = new[date]; meta, qa = json.loads((d / "meta.json").read_text()), json.loads((d / "qa.json").read_text())
            probs = list(qa.get("problems") or []) if not qa.get("ok") else []
            probs += [p for p in bgm_qa.check_novelty(meta, prev_of(date, st)) if p not in probs]
            (ROOT / "content" / "bgm").mkdir(parents=True, exist_ok=True)
            for name in ("qa.json", "sheet.jpg", "thumb.jpg"):
                if (d / name).exists(): shutil.copy(d / name, ROOT / "content" / "bgm" / f"{date}_{name}")
            if probs:
                bad.append(date); log("NG", date, " / ".join(probs)); continue
            stock[date] = {"run": str(run_id), "artifact": f"bgm-stock-{date}", "code": meta.get("code"), "no": meta["no"], "theme": meta["theme"], "style": meta.get("style", "lofi"),
                           "title": meta["title"], "seed": meta["seed"], "look": meta["look"], "minutes": meta["minutes"], "mb": (qa.get("numbers") or {}).get("mb"),
                           "made": (now or dt.datetime.now(JST)).isoformat(timespec="minutes"), "track_keys": [f'{t["key"]}|{"-".join(t["prog"])}|{t["bpm"]}' for t in meta["tracks"]], "track_names": meta["track_names"]}
            log("作り置きを記録", date, meta["theme"], f'{stock[date]["mb"]}MB')
    st["stock"] = dict(sorted(stock.items()))
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
    return bad


def stock_fetch(date, st=None):
    """その日の作り置きを GitHub Actions の保管場所から取ってくる。取れなくても止めない（当日に作る）"""
    s = (st or state()).get("stock", {}).get(date)
    if not s: log(date, "の作り置きはない"); return False
    out = STOCK / date
    if out.exists(): shutil.rmtree(out)
    out.mkdir(parents=True)
    cmd = ["gh", "run", "download", s["run"], "-n", s["artifact"], "-D", str(out)]
    if os.environ.get("GITHUB_REPOSITORY"): cmd += ["-R", os.environ["GITHUB_REPOSITORY"]]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=1500)
    except Exception as e:
        log("作り置きを取ってこられず", type(e).__name__); return False
    if r.returncode != 0 or not all((out / f).exists() for f in STOCK_FILES):
        log("作り置きを取ってこられず", (r.stderr or "")[:200]); return False
    log("作り置きを取ってきた", date, f"{(out / VIDEO_NAME).stat().st_size // 1_000_000}MB"); return True


def stock_problems(date, st):
    """取ってきた作り置きを、いま出してよいか。問題の一覧（空なら出せる）。作り方が変わったかどうかは見ない（run が見る）"""
    d, s = STOCK / date, st.get("stock", {}).get(date)
    if not s: return ["作り置きの記録がない"]
    if not all((d / f).exists() for f in STOCK_FILES): return ["作り置きのファイルがそろっていない"]
    meta, qa = json.loads((d / "meta.json").read_text()), json.loads((d / "qa.json").read_text())
    probs = []
    if not qa.get("ok"): probs.append("検査に落ちた回")
    if meta.get("date") != date or meta.get("seed") != int(date.replace("-", "")): probs.append("別の日の回")
    mb = (d / VIDEO_NAME).stat().st_size / 1e6
    if s.get("mb") and abs(mb - s["mb"]) > max(5, s["mb"] * 0.02): probs.append(f'動画の大きさが作ったときと違う（{mb:.0f}MB／{s["mb"]}MB）')
    done = [v for k, v in sorted(st["episodes"].items()) if v.get("yt") and k != date]
    return probs + bgm_qa.check_novelty(meta, done)            # 実際に出した回と比べ直す（順番がずれて、前の回と同じテーマになっていないか）


def stock_use(date):
    work = DIST / "bgm" / date
    if work.exists(): shutil.rmtree(work)
    work.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(STOCK / date), str(work))
    return json.loads((work / "meta.json").read_text())


def run_day(date, minutes=None, privacy=None, keep=False, par=3):
    """予定の日の本番。作り置きがあれば使う（上の「当日の流れ」）。戻り値＝（動画のID または None、Hub に出す一言）"""
    st = state(); s = st.get("stock", {}).get(date)
    probs = stock_problems(date, st) if s and (STOCK / date).exists() else ["作り置きがない"]
    same = bool(s) and s.get("code") == code_hash() and not minutes
    if not probs and same:
        meta = stock_use(date); log("作り置きを出す", date, meta["theme"])
        return upload(date, privacy), f'作業用BGM「{meta["en"]}」（作り置き）を出した'
    if s: log("作り置きをそのまま使わない：", "作り方が変わったので作り直す" if not probs else " / ".join(probs))
    try:
        ok, work, meta = build(date, minutes, keep, par)
    except (Exception, SystemExit) as e:
        if probs: raise
        ok = False; log("当日の作り直しが止まった", type(e).__name__, str(e)[:200])
    if ok: return upload(date, privacy), f'作業用BGM「{meta["en"]}」を出した'
    if probs: return None, f"検査に落ちたので出さなかった（dist/bgm/{date}/qa.json）"
    meta = stock_use(date); log("当日の作り直しが検査に落ちたので、作り置きを出す", date)
    return upload(date, privacy), f'作業用BGM「{meta["en"]}」（作り置き。当日の作り直しは検査に落ちた）を出した'


def due(date, cfg, st):
    d = dt.date.fromisoformat(date)
    return cfg["enabled"] and d.weekday() in cfg["days"] and not (st["episodes"].get(date) or {}).get("yt")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "build", "upload", "run", "todos", "publish", "relabel", "stock-plan", "stock-record", "stock-fetch"])
    ap.add_argument("--date"); ap.add_argument("--minutes", type=int); ap.add_argument("--privacy"); ap.add_argument("--force", action="store_true"); ap.add_argument("--keep", action="store_true"); ap.add_argument("--par", type=int, default=3); ap.add_argument("--theme", help="手元の試作用：テーマを指定（build だけ）")
    ap.add_argument("--n", type=int, help="作り置き：回の番号（0 始まり。stock-plan が出す）"); ap.add_argument("--until"); ap.add_argument("--redo", action="store_true"); ap.add_argument("--src"); ap.add_argument("--run", dest="run_id")
    a = ap.parse_args(argv)
    today = dt.datetime.now(JST).date().isoformat()
    date = a.date or today
    DIST.mkdir(exist_ok=True)
    summary = DIST / "bgm_hub_summary"
    if a.cmd == "plan": print(json.dumps(plan(date, n=a.n), ensure_ascii=False, indent=1)); return 0
    if a.cmd == "build": return 0 if build(date, a.minutes, a.keep, a.par, a.theme, a.n, a.redo)[0] else 3
    if a.cmd == "upload": upload(date, a.privacy); return 0
    if a.cmd == "todos": return todos()
    if a.cmd == "publish": return publish()
    if a.cmd == "relabel": return relabel()
    if a.cmd == "stock-plan": print(json.dumps(stock_plan(a.until or f"{today[:4]}-12-31", state(), config(), today, a.redo))); return 0
    if a.cmd == "stock-record":
        bad = stock_record(a.src, a.run_id)
        if bad: log("記録しなかった回（当日に作る）", ", ".join(bad))
        return 3 if bad else 0
    if a.cmd == "stock-fetch": stock_fetch(date); return 0
    cfg, st = config(), state()
    if not a.force and not due(date, cfg, st):
        log(date, "は予定の日ではない／投稿済み"); summary.write_text(f"{date}：出す回なし"); return 0
    vid, msg = run_day(date, a.minutes, a.privacy, a.keep, a.par)
    if not vid:
        summary.write_text(f"{date}：{msg}"); return 3
    summary.write_text(f'{date}：{msg}（{state()["episodes"][date]["privacy"]}） https://youtu.be/{vid}')
    return 0


if __name__ == "__main__":
    sys.exit(main())
