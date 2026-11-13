#!/usr/bin/env python3
"""作業用BGM（長尺）の音楽を作る。完全自作（数式で音を合成）なので、著作権の申し立てが来ない。
使い方: python3 rig/bgm/music.py 出力フォルダ --seed 20261114 --minutes 60 [--ambience rain|room]
出力: track_01.wav …（1曲ごと・ステレオ 44.1kHz）、ambience.wav（つなぎ目のない環境音 60 秒）、tracks.json（曲の一覧：調・速さ・長さ）
1本ごとに seed が違う＝曲（調・速さ・コード進行・旋律・楽器の組み合わせ）が毎回違う。同じ曲を別の動画で使い回さない。
"""
import argparse, json, pathlib, wave
import numpy as np
from scipy.signal import butter, sosfilt, lfilter, fftconvolve

SR = 44100
NOTE = lambda m: 440.0 * 2 ** ((m - 69) / 12)


def lp(x, f, order=2): return sosfilt(butter(order, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)
def tt(d): return np.arange(int(SR * d)) / SR


# ---------- コード進行（度数。0=主音からの半音数, 種類）----------
Q = {'maj7': (0, 4, 7, 11, 14), 'm7': (0, 3, 7, 10, 14), '7': (0, 4, 7, 10, 14), 'm6': (0, 3, 7, 9, 14), 'maj6': (0, 4, 7, 9, 14), 'm7b5': (0, 3, 6, 10, 13)}
PROGS = {
    'major': [
        [(5, 'maj7'), (4, 'm7'), (2, 'm7'), (0, 'maj7')],
        [(2, 'm7'), (7, '7'), (0, 'maj7'), (9, 'm7')],
        [(0, 'maj7'), (9, 'm7'), (2, 'm7'), (7, '7')],
        [(5, 'maj7'), (7, '7'), (4, 'm7'), (9, 'm7')],
        [(0, 'maj7'), (4, 'm7'), (5, 'maj7'), (5, 'm6')],
        [(9, 'm7'), (2, 'm7'), (7, '7'), (0, 'maj7')],
        [(5, 'maj7'), (4, 'm7'), (9, 'm7'), (0, 'maj7')],
        [(0, 'maj7'), (5, 'maj7'), (2, 'm7'), (7, '7')],
    ],
    'minor': [
        [(0, 'm7'), (5, 'm7'), (10, '7'), (3, 'maj7')],
        [(0, 'm7'), (8, 'maj7'), (3, 'maj7'), (10, '7')],
        [(5, 'm7'), (10, '7'), (3, 'maj7'), (0, 'm7')],
        [(0, 'm7'), (10, '7'), (8, 'maj7'), (7, 'm7')],
    ],
}
PENT = {'major': (0, 2, 4, 7, 9), 'minor': (0, 3, 5, 7, 10)}


def voice(root_pc, kind, prev=None, lo=55, hi=72):
    """3度・7度・9度（＋5度）を中音域に置く。前の和音から動きが小さい並びを選ぶ（なめらかにつながる）"""
    iv = Q[kind]
    pcs = [(root_pc + iv[1]) % 12, (root_pc + iv[3]) % 12, (root_pc + iv[4]) % 12, (root_pc + iv[2]) % 12]
    best, bc = None, 1e9
    use = pcs[:3] + ([pcs[3]] if kind != 'm7b5' else [])
    for base in range(lo, lo + 12):
        notes = [base + ((pc - base) % 12) for pc in use]      # 1オクターブの中に寄せた並び
        cost = 0 if prev is None else sum(min(abs(n - p) for p in prev) for n in notes)
        cost += abs(np.mean(notes) - (lo + hi) / 2) * 0.35
        s_ = sorted(notes)
        cost += sum(3 for x, y in zip(s_, s_[1:]) if y - x == 1)   # 半音でぶつかる並びは避ける
        if cost < bc: best, bc = notes, cost
    return sorted(best)


# ---------- 楽器 ----------
def epiano(f, dur, vel, rng):
    t = tt(dur + 0.6)
    idx = (1.6 + 4.0 * vel) * np.exp(-t / 0.45) + 0.35
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 1.0 * t) * 0.8)
    y += 0.22 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / 0.035) * vel       # 打ったときの「チン」
    y += 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.6)
    env = np.minimum(1, t / 0.006) * np.exp(-t / (1.6 + 0.6 * rng.random()))
    rel = np.clip((dur + 0.6 - t) / 0.5, 0, 1)
    return vel * env * rel * y


def pad(f, dur):
    t = tt(dur + 1.2)
    y = sum(a * np.sin(2 * np.pi * f * h * (1 + d) * t + ph) for h, a, d, ph in ((1, 1, 0, 0), (1, .7, .004, 1.1), (2, .28, -.003, .4), (3, .1, .002, 2.0)))
    env = np.minimum(1, t / 0.9) * np.clip((dur + 1.2 - t) / 1.1, 0, 1)
    return env * y * 0.5


def bass(f, dur, vel):
    t = tt(dur)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.25) + 0.08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.12)
    env = np.minimum(1, t / 0.012) * np.exp(-t / 1.4) * np.clip((dur - t) / 0.06, 0, 1)
    return vel * np.tanh(1.4 * env * y)


def kalimba(f, vel, rng):
    t = tt(1.4)
    y = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * f * 5.43 * t) * np.exp(-t / 0.05) + 0.1 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.3)
    return vel * np.minimum(1, t / 0.003) * np.exp(-t / 0.42) * y


def bell(f, vel, rng):
    t = tt(2.2)
    y = np.sin(2 * np.pi * f * t + 1.2 * np.exp(-t / 0.4) * np.sin(2 * np.pi * f * 3.5 * t)) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.5)
    return vel * 0.8 * np.minimum(1, t / 0.004) * np.exp(-t / 0.75) * y


def guitar(f, vel, rng):
    """ナイロン弦ふう（Karplus-Strong）"""
    n = int(SR * 1.8); N = max(2, int(round(SR / f)))
    x = np.zeros(n); burst = rng.standard_normal(N); burst = lp(burst, 2600); x[:N] = burst
    a = np.zeros(N + 2); a[0] = 1; g = 0.994; a[N] = -0.5 * g; a[N + 1] = -0.5 * g
    y = lfilter([1.0], a, x)
    y = y / (np.abs(y).max() + 1e-9)
    t = np.arange(n) / SR
    return vel * 0.9 * y * np.clip((1.8 - t) / 0.3, 0, 1)


def flute(f, dur, vel, rng):
    t = tt(dur + 0.25)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / 0.4)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    breath = lp(rng.standard_normal(len(t)), 3000) * 0.04
    env = np.minimum(1, t / 0.07) * np.clip((dur + 0.25 - t) / 0.22, 0, 1)
    return vel * 0.75 * env * (y + breath)


def kick(vel):
    t = tt(0.4); f = 46 + 75 * np.exp(-t / 0.028)
    return vel * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13)


def snare(vel, rng):
    t = tt(0.22)
    nz = bp(rng.standard_normal(len(t)), 900, 4200) * np.exp(-t / 0.055)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    return vel * (0.8 * nz + 0.35 * tone)


def rim(vel, rng):
    t = tt(0.09)
    return vel * (np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.008) + 0.5 * np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.015))


def hat(vel, rng, open_=False):
    t = tt(0.22 if open_ else 0.06)
    nz = bp(rng.standard_normal(len(t)), 5200, 9500) * np.exp(-t / (0.07 if open_ else 0.016))
    return vel * nz


class Bus:
    """ステレオの1トラック。add(音, 時刻, 左右)"""
    def __init__(self, dur):
        self.n = int(SR * dur); self.b = np.zeros((self.n, 2), dtype=np.float32)

    def add(self, x, t, pan=0.0):
        i = int(t * SR)
        if i >= self.n or i < 0: return
        x = x[:self.n - i]
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        self.b[i:i + len(x), 0] += (x * l).astype(np.float32); self.b[i:i + len(x), 1] += (x * r).astype(np.float32)


def reverb_ir(rng, dur=1.7):
    t = tt(dur)
    ir = np.stack([rng.standard_normal(len(t)), rng.standard_normal(len(t))], axis=1) * np.exp(-t / 0.42)[:, None]
    ir = lp(hp(ir, 250), 4200); ir[:int(0.012 * SR)] *= 0.15
    return (ir / np.sqrt((ir ** 2).sum(axis=0))).astype(np.float32)


def wow(x, rng):
    """テープの回転むら（ごく小さい音程のゆれ）"""
    n = len(x); t = np.arange(n) / SR
    f1, f2 = 0.35 + 0.3 * rng.random(), 4.5 + 2 * rng.random()
    pos = np.arange(n) + SR * (0.0009 * np.sin(2 * np.pi * f1 * t + rng.random() * 6) + 0.00006 * np.sin(2 * np.pi * f2 * t))
    pos = np.clip(pos, 0, n - 1)
    return np.stack([np.interp(pos, np.arange(n), x[:, 0]), np.interp(pos, np.arange(n), x[:, 1])], axis=1).astype(np.float32)


# ---------- 旋律 ----------
RHYTHMS = [  # 2小節（8拍）の中の音の位置（拍）。まばらに
    [0, 1.5, 3, 4.5, 6], [0.5, 2, 3.5, 6, 7], [0, 2.5, 4, 5.5], [1, 2, 3.5, 5, 6.5], [0, 1, 2.5, 4.5, 6, 7], [0.5, 3, 4.5, 7], [0, 3, 3.5, 6],
]


def make_motif(rng, scale_pcs, key, center=74):
    r = list(RHYTHMS[rng.integers(len(RHYTHMS))])
    pool = sorted(m for m in range(center - 9, center + 10) if (m - key) % 12 in scale_pcs)
    i = int(np.argmin([abs(m - center) for m in pool])) + int(rng.integers(-1, 2))
    notes = []
    for _ in r:
        i = int(np.clip(i + rng.choice([-2, -1, -1, 0, 1, 1, 2]), 0, len(pool) - 1)); notes.append(pool[i])
    return r, notes, pool


def snap_chord(m, chord_pcs, pool):
    """強拍の音を、いちばん近い和音の音に寄せる（にごらない）"""
    c = [p for p in pool if p % 12 in chord_pcs]
    return min(c, key=lambda p: abs(p - m)) if c else m


def make_track(rng, idx):
    mode = 'minor' if rng.random() < 0.3 else 'major'
    key = int(rng.choice([48, 50, 51, 53, 55, 57, 58]))            # C D Eb F G A Bb
    bpm = float(rng.integers(66, 87)); beat = 60 / bpm; bar = 4 * beat
    swing = (0.10 + 0.12 * rng.random()) * beat
    prog = PROGS[mode][rng.integers(len(PROGS[mode]))]
    lead = [kalimba, bell, guitar, 'flute'][rng.integers(4)]
    # 構成（小節）：前奏4 → A8 → A'8（旋律）→ B8 → 間奏4 → A''8 → 後奏4〜
    sections = [('intro', 4), ('a', 8), ('am', 8), ('b', 8), ('break', 4), ('am', 8), ('b', 8 if rng.random() < .5 else 0), ('am', 8), ('outro', 4)]
    sections = [s for s in sections if s[1]]
    nbars = sum(n for _, n in sections); dur = nbars * bar + 3.0
    comp, mel, bs, dr, pd = Bus(dur), Bus(dur), Bus(dur), Bus(dur), Bus(dur)
    scale = PENT[mode]
    motifA = make_motif(rng, scale, key); motifB = make_motif(rng, scale, key, center=77)
    kick_pat = [[0, 2.5], [0, 1.5, 2.5], [0, 2, 2.75], [0, 2.5, 3.5]][rng.integers(4)]
    use_rim = rng.random() < 0.4
    prev = None; b = 0; kicks = []
    for sec, n in sections:
        for k in range(n):
            t0 = b * bar; root, kind = prog[b % 4]; rpc = (key + root) % 12
            v = voice(rpc, kind, prev); prev = v; cpcs = {m % 12 for m in v} | {rpc}
            drums_on = sec in ('a', 'am', 'b'); last_of_sec = k == n - 1
            # 和音（エレピ）：1拍目にじゃらん、2.5拍目の裏に軽く
            vel = 0.085 if sec != 'intro' else 0.07
            for j, m in enumerate(v):
                comp.add(epiano(NOTE(m), bar * 0.95, vel * (0.9 + 0.2 * rng.random()), rng), t0 + j * (0.012 + 0.01 * rng.random()), pan=-0.35 + 0.23 * j)
            if sec != 'intro' and rng.random() < 0.75:
                for j, m in enumerate(v[1:]):
                    comp.add(epiano(NOTE(m), beat * 1.2, vel * 0.55, rng), t0 + 2.5 * beat + swing + j * 0.01, pan=0.3 - 0.2 * j)
            if sec in ('b', 'break', 'outro'):
                for j, m in enumerate(v[:3]): pd.add(pad(NOTE(m), bar) * 0.03, t0, pan=(-0.6, 0, 0.6)[j])
            # ベース
            if sec != 'intro':
                br = 36 + (rpc - 36) % 12; br = br if br <= 46 else br - 12
                bs.add(bass(NOTE(br), beat * 1.9, 0.5), t0)
                if drums_on:
                    bs.add(bass(NOTE(br), beat * 0.8, 0.36), t0 + 2.5 * beat + swing)
                    if last_of_sec or rng.random() < 0.3:
                        nxt = prog[(b + 1) % 4][0]; nb = 36 + ((key + nxt) % 12 - 36) % 12; nb = nb if nb <= 46 else nb - 12
                        bs.add(bass(NOTE(nb + (1 if rng.random() < .5 else -1)), beat * 0.45, 0.3), t0 + 3.5 * beat + swing)   # 次の根音へ半音で近づく
            # ドラム
            if drums_on:
                for kpos in kick_pat:
                    tk = t0 + kpos * beat + (swing if kpos % 1 == 0.5 else 0) + rng.normal(0, 0.004)
                    dr.add(kick(0.55 if kpos == 0 else 0.4), tk); kicks.append(tk)
                for s in (1, 3):
                    ts = t0 + s * beat + 0.012 + rng.normal(0, 0.004)                                   # スネアは少し遅らせる（ゆったり聞こえる）
                    dr.add((rim if use_rim else snare)(0.3 + 0.05 * rng.random(), rng), ts, pan=0.08)
                for h in range(8):
                    th = t0 + h * beat / 2 + (swing if h % 2 else 0) + rng.normal(0, 0.005)
                    dr.add(hat((0.16 if h % 2 == 0 else 0.09) * (0.8 + 0.4 * rng.random()), rng, open_=(h == 7 and last_of_sec)), th, pan=-0.2)
                if last_of_sec:
                    for q in (3.0, 3.5, 3.75): dr.add(snare(0.13 + 0.06 * rng.random(), rng), t0 + q * beat, pan=0.1)   # 小さなおかず
            # 旋律（2小節ごとの形。A=A 型、B=B 型。区切りの小節は休む）
            if sec in ('am', 'b') and k % 2 == 0 and not (k >= n - 2 and rng.random() < 0.5):
                r, ns, pool = motifA if sec == 'am' else motifB
                var = (k // 2) % 2 == 1
                for q, (pos, m) in enumerate(zip(r, ns)):
                    if var and q >= len(r) - 2: m = pool[int(np.clip(pool.index(m) + rng.choice([-1, 1, 2]), 0, len(pool) - 1))]   # 2回目は終わりだけ変える
                    croot, ckind = prog[(b + int(pos // 4)) % 4]
                    cp = {((key + croot) % 12 + i) % 12 for i in Q[ckind][:4]}
                    if pos % 2 == 0: m = snap_chord(m, cp, pool)
                    tm = t0 + pos * beat + (swing if pos % 1 == 0.5 else 0) + rng.normal(0, 0.006)
                    vv = 0.11 * (0.8 + 0.4 * rng.random())
                    if lead == 'flute':
                        nxt = r[q + 1] if q + 1 < len(r) else 8
                        mel.add(flute(NOTE(m), min(1.6, (nxt - pos) * beat * 0.9), vv, rng), tm, pan=0.15)
                    else:
                        mel.add(lead(NOTE(m), vv, rng), tm, pan=0.15 + 0.1 * np.sin(q))
            b += 1
    # サイドチェイン（キックのたびに和音とパッドを少し下げる）
    duck = np.ones(comp.n, dtype=np.float32); L = int(0.22 * SR); ramp = (0.72 + 0.28 * np.linspace(0, 1, L) ** 1.5).astype(np.float32)
    for tk in kicks:
        i = int(tk * SR)
        if 0 <= i < comp.n: duck[i:i + L] = np.minimum(duck[i:i + L], ramp[:len(duck[i:i + L])])
    music = (lp(comp.b * duck[:, None], 6500) * 1.6 + lp(pd.b * duck[:, None], 3000) * 2.0 + lp(mel.b, 7000) * 2.9)
    ir = reverb_ir(rng)
    wet = np.stack([fftconvolve(music[:, c], ir[:, c])[:len(music)] for c in (0, 1)], axis=1)
    mix = music + 0.16 * wet + lp(bs.b, 900) * 0.42 + lp(dr.b, 9000) * 1.25 + 0.05 * np.stack([fftconvolve(dr.b[:, c], ir[:, c])[:len(music)] for c in (0, 1)], axis=1)
    mix = wow(mix.astype(np.float32), rng)
    mix = mix + 1.7 * hp(mix, 1300, 1)                        # 中高域を少し持ち上げる（こもりすぎない）
    mix = lp(hp(mix, 32), 9500)                               # ローファイの丸さ（高域を落とす）
    mix = np.tanh(mix * 1.6) / 1.6                            # やわらかい飽和
    # 前奏はこもった音から開く・最後は消える
    n = len(mix); t = np.arange(n) / SR
    env = np.minimum(1, t / 1.2) * np.clip((dur - t) / 4.0, 0, 1)
    mix = mix * env[:, None]
    # 曲ごとの音量をそろえる（ピークではなく、鳴っている部分の平均の大きさで合わせる。大きすぎる山だけやわらかく抑える）
    body = mix[int(len(mix) * 0.15):int(len(mix) * 0.85)]
    mix = mix * (0.105 / (np.sqrt((body ** 2).mean()) + 1e-9))
    mix = np.where(np.abs(mix) > 0.6, np.sign(mix) * (0.6 + 0.3 * np.tanh((np.abs(mix) - 0.6) / 0.3)), mix)
    name = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][key % 12] + (' minor' if mode == 'minor' else ' major')
    info = {'no': idx, 'key': name, 'bpm': bpm, 'bars': nbars, 'sec': round(dur, 2), 'lead': lead if isinstance(lead, str) else lead.__name__, 'prog': [f'{r}{k}' for r, k in prog], 'swing': round(swing / beat, 3)}
    return mix.astype(np.float32), info


def ambience(kind, rng, dur=60.0):
    """つなぎ目のない環境音（60秒をくり返して使う）。rain＝やさしい雨、room＝静かな部屋の空気"""
    n = int(SR * dur); x = int(SR * 3)
    def loopable(sig):                                        # 最後の3秒を頭に重ねて、くり返しても途切れないように
        k = np.linspace(0, 1, x)[:, None]
        out = sig[:n].copy(); out[:x] = sig[:x] * np.sqrt(k) + sig[n:n + x] * np.sqrt(1 - k); return out
    raw = np.stack([rng.standard_normal(n + x), rng.standard_normal(n + x)], axis=1)
    if kind == 'rain':
        body = bp(raw, 500, 6000) * 0.5 + lp(raw, 400) * 0.6
        drops = np.zeros((n + x, 2))
        for _ in range(int(dur * 14)):
            i = rng.integers(0, n + x - 2000); f = 1500 + 3500 * rng.random(); t = np.arange(900) / SR
            d = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.004) * (0.2 + 0.8 * rng.random()); p = rng.random()
            drops[i:i + 900, 0] += d * p; drops[i:i + 900, 1] += d * (1 - p)
        sig = body + drops * 0.9
        sig *= (1 + 0.15 * np.sin(2 * np.pi * np.arange(n + x) / SR / 20.0))[:, None]   # 雨足のゆっくりした強弱（20秒周期＝60秒でちょうど3回）
    else:
        sig = lp(raw, 220) * 1.0 + bp(raw, 2000, 5000) * 0.03
    # レコードのぱちぱち（ごく小さく）
    cr = np.zeros((n + x, 2))
    for _ in range(int(dur * 5)):
        i = rng.integers(0, n + x - 200); a = (0.3 + 0.7 * rng.random()) * rng.choice([-1, 1]); c = rng.integers(2)
        cr[i:i + 40, c] += a * np.exp(-np.arange(40) / 6.0)
    sig = sig + hp(lp(cr, 6000), 800) * (2.2 if kind == 'rain' else 3.0)
    sig = loopable(sig)
    return (sig / (np.abs(sig).max() + 1e-9) * 0.5).astype(np.float32)


def write_wav(path, x):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--minutes', type=float, default=60); ap.add_argument('--ambience', default='rain')
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(a.seed)
    tracks, total, i = [], 0.0, 0
    used = set()
    while total < a.minutes * 60:
        i += 1
        for _ in range(20):                                    # 同じ調・同じ進行・同じ旋律楽器が続かないようにやり直す
            x, info = make_track(rng, i)
            sig = (info['key'], tuple(info['prog']))
            if sig not in used and (not tracks or (tracks[-1]['key'] != info['key'] and tracks[-1]['lead'] != info['lead'])): break
        used.add(sig)
        write_wav(out / f'track_{i:02d}.wav', x); info['file'] = f'track_{i:02d}.wav'
        tracks.append(info); total += info['sec'] - 3.0          # 3秒ずつ重ねてつなぐ
        print('track', i, info['key'], info['bpm'], info['lead'], info['sec'], flush=True)
    write_wav(out / 'ambience.wav', ambience(a.ambience, np.random.default_rng(a.seed + 1)))
    (out / 'tracks.json').write_text(json.dumps({'seed': a.seed, 'ambience': a.ambience, 'tracks': tracks}, ensure_ascii=False, indent=1))
    print('music ok', len(tracks), 'tracks', round(total / 60, 1), 'min')


if __name__ == '__main__':
    main()
