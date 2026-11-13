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
設定は auto/bgm_config.json（曜日・長さ・公開範囲）。
"""
import argparse, datetime as dt, json, os, pathlib, shutil, subprocess, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import bgm_qa

ROOT = pathlib.Path(__file__).resolve().parent.parent
AUTO, DIST, RIG = ROOT / "auto", ROOT / "dist", ROOT / "rig" / "bgm"
JST = dt.timezone(dt.timedelta(hours=9))
PLAYLIST = "Lofi with Ren & Jill / 作業用BGM"
FPS, LOOP = 24, 60          # 1章の絵は 60 秒のループ
XF = 4                      # 章の切り替えは 4 秒かけてなめらかに（瞬間カット禁止）

# テーマ（時間帯×天気）。hours＝4つの章の時刻。ren / jil＝章ごとのようす（rig/bgm/scene.js）
THEMES = [
    {"id": "rain_night", "weather": "rain", "hours": [17.5, 19.5, 21.5, 23.5], "en": "Rainy Night Overtime", "ja": "雨の夜の残業",
     "ren": ["type", "hay", "sleepy", "asleep"], "jil": ["type", "glance", "glance", "happy"], "thumb": [2, 13.5],
     "blurb_en": "It's raining outside. Jill keeps working; Ren… tries his best until he doesn't.", "blurb_ja": "外は雨。ジルは黙々と、課長のレンは…がんばって、やがて寝ます。"},
    {"id": "morning", "weather": "clear", "hours": [8.5, 9.5, 10.5, 11.5], "en": "Morning Focus", "ja": "朝の集中タイム",
     "ren": ["sleepy", "type", "hay", "type"], "jil": ["type", "happy", "glance", "type"], "thumb": [1, 20.0],
     "blurb_en": "A bright morning at the office. Ren wakes up slowly; Jill is already in the zone.", "blurb_ja": "晴れた朝のオフィス。レンはゆっくり目を覚まし、ジルはもう集中しています。"},
    {"id": "clear_night", "weather": "clear", "hours": [18.0, 20.0, 22.0, 23.75], "en": "Late Night at the Office", "ja": "夜のオフィス",
     "ren": ["type", "type", "hay", "asleep"], "jil": ["happy", "type", "glance", "type"], "thumb": [2, 14.5],
     "blurb_en": "City lights, a warm desk lamp, and two bunnies finishing the day.", "blurb_ja": "街の明かりとデスクランプ。2匹が一日の仕事を終えるまで。"},
    {"id": "rain_afternoon", "weather": "rain", "hours": [13.0, 14.0, 15.0, 16.0], "en": "Rainy Afternoon", "ja": "雨の午後",
     "ren": ["hay", "sleepy", "type", "type"], "jil": ["type", "glance", "type", "happy"], "thumb": [1, 13.5],
     "blurb_en": "A slow, rainy afternoon. After lunch, staying awake is Ren's biggest task.", "blurb_ja": "雨の午後。お昼のあと、眠気とたたかうのが課長のいちばんの仕事。"},
    {"id": "sunset", "weather": "clear", "hours": [15.5, 16.5, 17.5, 19.0], "en": "Sunset at the Office", "ja": "夕暮れのオフィス",
     "ren": ["type", "hay", "type", "sleepy"], "jil": ["type", "type", "happy", "glance"], "thumb": [2, 20.0],
     "blurb_en": "The sky turns orange, then blue. One more task before going home.", "blurb_ja": "空がオレンジから青へ。帰る前に、もうひと仕事。"},
    {"id": "rain_morning", "weather": "rain", "hours": [8.0, 9.0, 10.0, 11.0], "en": "Rainy Morning", "ja": "雨の朝",
     "ren": ["sleepy", "sleepy", "type", "hay"], "jil": ["type", "glance", "type", "happy"], "thumb": [2, 5.0],
     "blurb_en": "Rain on the window, coffee on the desk. A quiet start to the day.", "blurb_ja": "窓に雨、机にコーヒー。静かな一日のはじまり。"},
]
TRACK_NAMES = ["Hay Break", "Second Coffee", "Soft Deadline", "Paper Stack", "Window Seat", "Quiet Floor", "Long Ears", "Desk Lamp", "Slow Reply", "Sticky Note",
               "Carrot Budget", "Nine to Five", "Elevator Hum", "Warm Mug", "After Lunch", "Tidy Drawer", "Timothy Field", "Nose Wiggle", "Overtime Snack", "Spreadsheet Rain",
               "Paw Stamp", "Last Train", "Meeting Ended", "Fluffy Monday", "Inbox Zero", "Lop Ear Lullaby", "Blue Hour", "Printer Song", "Small Thump", "Clock Out",
               "Corner Office", "Binky", "Sunbeam Nap", "Pencil Cup", "Rainy Commute", "Good Job Today", "Round Glasses", "Tea Time", "Soft Keyboard", "See You Tomorrow"]
I18N = {  # YouTube の多言語の題名・説明（作業用BGM用）
    "ja": ("【作業用BGM】{ja}｜レンとジルと一緒に1時間 lofi", "うさぎの課長レンと部下ジルと一緒に、作業や勉強を。音楽もアニメもこの動画のためのオリジナルです。"),
    "ko": ("{en} – 렌과 질과 함께하는 1시간 로파이 | 공부·작업용 음악", "토끼 과장 렌과 부하 질과 함께 공부하고 일해요. 음악과 애니메이션 모두 이 영상을 위해 만든 오리지널입니다."),
    "zh-Hant": ("{en}｜和蓮與吉兒一起的 1 小時 Lofi｜讀書・工作用音樂", "和兔子課長蓮、部下吉兒一起讀書工作。音樂與動畫都是為這支影片原創製作。"),
    "es": ("{en} – 1 hora de lofi para trabajar y estudiar con Ren & Jill", "Trabaja o estudia junto a Ren y Jill, dos conejos de oficina. Música y animación originales, hechas para este vídeo."),
    "pt": ("{en} – 1 hora de lofi para trabalhar e estudar com Ren & Jill", "Trabalhe ou estude com Ren e Jill, dois coelhos de escritório. Música e animação originais, feitas para este vídeo."),
}


def log(*a): print("[bgm]", *a, flush=True)
def load(p, default): return json.loads(p.read_text()) if p.exists() else default
def config(): return {**{"days": [2, 5], "minutes": 60, "privacy": "unlisted", "enabled": True}, **load(AUTO / "bgm_config.json", {})}
def state(): return load(AUTO / "bgm_state.json", {"episodes": {}})
def run(cmd, **kw): return subprocess.run([str(c) for c in cmd], check=True, **kw)


def plan(date, st=None, cfg=None):
    """その日の回の計画。回の番号＝これまでに出した本数（同じテーマ・同じ部屋が続かない）。seed は日付"""
    st, cfg = st or state(), cfg or config()
    done = sorted(k for k, v in st["episodes"].items() if v.get("yt") and k != date)
    n = len(done)
    th = THEMES[n % len(THEMES)]
    seed = int(date.replace("-", ""))
    minutes = cfg["minutes"]
    title = f'{th["en"]} – {_dur_en(minutes)} Lofi for Work & Study with Ren & Jill | 作業用BGM {th["ja"]}'
    return {"date": date, "no": n + 1, "theme": th["id"], "seed": seed, "look": n % 4, "minutes": minutes, "weather": th["weather"], "hours": th["hours"],
            "ren": th["ren"], "jil": th["jil"], "thumb": th["thumb"], "title": title[:100], "en": th["en"], "ja": th["ja"], "blurb_en": th["blurb_en"], "blurb_ja": th["blurb_ja"]}


def _dur_en(m): return "1 Hour" if m == 60 else f"{int(m)} Min" if m < 60 else f"{m / 60:g} Hours"
def _ts(s): s = int(round(s)); return f"{s // 3600}:{s % 3600 // 60:02d}:{s % 60:02d}" if s >= 3600 else f"{s // 60}:{s % 60:02d}"
def query(pl, i): return f'hour={pl["hours"][i]}&ren={pl["ren"][i]}&jil={pl["jil"][i]}&weather={pl["weather"]}&look={pl["look"]}&seed={pl["seed"] % 97 + i}'


def description(pl, tracks):
    """説明：英語が主・日本語が従。曲の一覧（時刻つき＝YouTube のチャプターになる）"""
    import numpy as np
    rng = np.random.default_rng(pl["seed"])
    names = [TRACK_NAMES[i] for i in rng.permutation(len(TRACK_NAMES))[:len(tracks)]]
    t, lines = 0.0, []
    for nm, tr in zip(names, tracks):
        if t < pl["minutes"] * 60 - 20: lines.append(f"{_ts(t)} {nm}")
        t += tr["sec"] - 3.0
    body = (f'Work or study alongside Ren & Jill, two office bunnies. {pl["blurb_en"]}\n'
            f'レンとジルと一緒に、作業や勉強を。{pl["blurb_ja"]}\n\n'
            f'The clock moves on every {pl["minutes"] // len(pl["hours"])} minutes – see how the two of them are doing.\n'
            f'{pl["minutes"] // len(pl["hours"])}分ごとに時計が進みます。ときどき2匹のようすをのぞいてみてください。\n\n'
            'Tracklist\n' + "\n".join(lines) + '\n\n'
            'All music and animation are original, made in-house for this video (no samples). Feel free to play it in the background.\n'
            '音楽もアニメーションも、この動画のために作ったオリジナルです。\n\n'
            '▶ Daily shorts: a wordless office comedy / 毎日のショート（セリフなしのオフィスコメディ）もどうぞ\n'
            'Instagram / TikTok / X: @renjill_office\n© COANA TOKYO')
    return body, names


def localizations(pl, title, desc):
    out = {}
    for lang, (t, d) in I18N.items():
        out[lang] = {"title": t.format(en=pl["en"], ja=pl["ja"])[:100], "description": f"{d}\n\n{desc}"[:5000]}
    return out


# ---------- 音 ----------
def build_audio(pl, work):
    mdir = work / "music"
    run([sys.executable, RIG / "music.py", mdir, "--seed", pl["seed"], "--minutes", pl["minutes"] + 0.5, "--ambience", "rain" if pl["weather"] == "rain" else "room"])
    info = json.loads((mdir / "tracks.json").read_text()); tracks = info["tracks"]
    total = pl["minutes"] * 60
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    for tr in tracks: cmd += ["-i", mdir / tr["file"]]
    cmd += ["-stream_loop", "-1", "-i", mdir / "ambience.wav"]
    f, cur = "", "[0:a]"
    for i in range(1, len(tracks)):
        f += f"{cur}[{i}:a]acrossfade=d=3:c1=tri:c2=tri[x{i}];"; cur = f"[x{i}]"
    amb = 0.30 if pl["weather"] == "rain" else 0.16
    f += f"[{len(tracks)}:a]volume={amb}[amb];{cur}[amb]amix=inputs=2:duration=first:normalize=0,atrim=0:{total},afade=t=in:d=2,afade=t=out:st={total - 6}:d=6[a]"
    raw = work / "audio_raw.wav"
    run(cmd + ["-filter_complex", f, "-map", "[a]", "-ar", "44100", raw])
    # 音量をそろえる（-15 LUFS・-1.5 dBTP。2回測る＝全体を同じ倍率で動かすだけ。曲の強弱はそのまま）
    T = "I=-15:TP=-1.5:LRA=11"
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(raw), "-af", f"loudnorm={T}:print_format=json", "-f", "null", "-"], capture_output=True, text=True)
    import re
    m = json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])
    af = f"loudnorm={T}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
    out = work / "audio.m4a"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "48000", "-c:a", "aac", "-b:a", "256k", out])
    raw.unlink()
    return out, tracks


# ---------- 絵 ----------
ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", "-r", str(FPS), "-x264-params", f"keyint={FPS * 2}:min-keyint={FPS * 2}:scenecut=0:open-gop=0", "-bf", "0", "-video_track_timescale", "12288"]


def enc(frames, out, start=0, n=None, vf=None):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", FPS, "-start_number", start, "-i", frames / "f%05d.jpg"]
    if n: cmd += ["-frames:v", n]
    if vf: cmd += ["-vf", vf]
    run(cmd + ENC + [out])


def build_video(pl, work, par=3):
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


def build(date, minutes=None, keep=False, par=3):
    cfg = config()
    if minutes: cfg["minutes"] = minutes
    pl = plan(date, cfg=cfg)
    work = DIST / "bgm" / date
    if work.exists(): shutil.rmtree(work)
    work.mkdir(parents=True)
    log("計画", json.dumps({k: pl[k] for k in ("no", "theme", "seed", "look", "minutes", "title")}, ensure_ascii=False))
    audio, tracks = build_audio(pl, work)
    video, frames = build_video(pl, work, par)
    out = work / "bgm.mp4"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-i", audio, "-c", "copy", "-shortest", "-movflags", "+faststart", out])
    ci, tt = pl["thumb"]
    thumb_full, thumb = work / "thumb_full.jpg", work / "thumb.jpg"
    run(["node", RIG / "render.js", thumb_full, query(pl, ci), "thumb", tt])
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", thumb_full, "-vf", "crop=1440:810:400:200,scale=1280:720", "-q:v", "2", thumb])   # 2匹とランプに寄る（文字なし。YouTube の表紙は文字なしにそろえる＝2026-10-26 の決定）
    desc, names = description(pl, tracks)
    meta = {**pl, "description": desc, "track_names": names, "tracks": tracks, "localizations": localizations(pl, pl["title"], desc),
            "tags": ["lofi", "lofi hip hop", "study music", "work music", "作業用BGM", "勉強用BGM", "lofi 作業用", "relaxing music", "focus music", "Ren and Jill", "レンとジル", "bunny", "うさぎ", "chill beats", "background music"]}
    (work / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1))
    st = state()
    prev = [v for k, v in sorted(st["episodes"].items()) if v.get("yt") and k != date]
    qa = bgm_qa.check_all(work, meta, frames, prev)
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
    privacy = privacy or cfg["privacy"]
    from googleapiclient.http import MediaFileUpload
    import comments, stories, sns_policy
    yt = comments.yt_client()
    desc = sns_policy.yt_description(meta["description"]) + "\n\n#lofi #studymusic #作業用BGM"
    loc = {k: {"title": v["title"], "description": (sns_policy.yt_description(v["description"]) + "\n\n#lofi #studymusic #作業用BGM")[:5000]} for k, v in meta["localizations"].items()}
    body = {"snippet": {"title": meta["title"], "description": desc[:5000], "tags": meta["tags"], "categoryId": "10", "defaultLanguage": "en", "defaultAudioLanguage": "zxx"},
            "localizations": loc, "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False, "embeddable": True}}
    req = yt.videos().insert(part="snippet,status,localizations", body=body, media_body=MediaFileUpload(str(work / "bgm.mp4"), chunksize=32 * 1024 * 1024, resumable=True))
    resp, tries = None, 0
    while resp is None:
        try:
            status, resp = req.next_chunk(num_retries=5)
            if status: log(f"送信 {int(status.progress() * 100)}%")
        except Exception as e:                      # 途中で切れても、続きから送り直す（最初からやり直さない＝二重に出さない）
            tries += 1
            if tries > 8: raise
            log("送信をやり直す", type(e).__name__); __import__("time").sleep(10 * tries)
    vid = resp["id"]
    rec = {"yt": vid, "privacy": privacy, "title": meta["title"], "theme": meta["theme"], "seed": meta["seed"], "look": meta["look"], "minutes": meta["minutes"],
           "at": dt.datetime.now(JST).isoformat(timespec="minutes"), "track_keys": [f'{t["key"]}|{"-".join(t["prog"])}|{t["bpm"]}' for t in meta["tracks"]]}
    st["episodes"][date] = rec
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))     # 出した直後に記録（あとの処理が失敗しても二重に出さない）
    for name, fn in (("表紙", lambda: yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(work / "thumb.jpg"), mimetype="image/jpeg")).execute()),
                     ("再生リスト", lambda: stories.add_to_playlist(yt, vid, PLAYLIST))):
        try: fn()
        except Exception as e: log(name, "を付けられず", type(e).__name__, str(e)[:160]); rec.setdefault("todo", []).append(name)
    (AUTO / "bgm_state.json").write_text(json.dumps(st, ensure_ascii=False, indent=1))
    log("投稿した", f"https://youtu.be/{vid}", privacy)
    return vid


def due(date, cfg, st):
    d = dt.date.fromisoformat(date)
    return cfg["enabled"] and d.weekday() in cfg["days"] and not (st["episodes"].get(date) or {}).get("yt")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "build", "upload", "run"])
    ap.add_argument("--date"); ap.add_argument("--minutes", type=int); ap.add_argument("--privacy"); ap.add_argument("--force", action="store_true"); ap.add_argument("--keep", action="store_true"); ap.add_argument("--par", type=int, default=3)
    a = ap.parse_args(argv)
    date = a.date or dt.datetime.now(JST).date().isoformat()
    DIST.mkdir(exist_ok=True)
    summary = DIST / "bgm_hub_summary"
    if a.cmd == "plan": print(json.dumps(plan(date), ensure_ascii=False, indent=1)); return 0
    if a.cmd == "build": return 0 if build(date, a.minutes, a.keep, a.par)[0] else 3
    if a.cmd == "upload": upload(date, a.privacy); return 0
    cfg, st = config(), state()
    if not a.force and not due(date, cfg, st):
        log(date, "は予定の日ではない／投稿済み"); summary.write_text(f"{date}：出す回なし"); return 0
    ok, work, meta = build(date, a.minutes, a.keep, a.par)
    if not ok:
        summary.write_text(f"{date}：検査に落ちたので出さなかった（dist/bgm/{date}/qa.json）"); return 3
    vid = upload(date, a.privacy)
    summary.write_text(f'{date}：作業用BGM「{meta["en"]}」を出した（{a.privacy or cfg["privacy"]}） https://youtu.be/{vid}')
    return 0


if __name__ == "__main__":
    sys.exit(main())
