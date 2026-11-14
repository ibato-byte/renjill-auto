#!/usr/bin/env python3
"""作業用BGM（長尺）の音楽を作る。完全自作（数式で音を合成）なので、著作権の申し立てが来ない。
使い方: python3 rig/bgm/music.py 出力フォルダ --seed 20261114 --minutes 60 [--ambience rain|room] [--avoid 使った曲.json]
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

# ---------- 曲調（スタイル）。回ごとに1つ（auto/bgm.py のテーマが決める）。絵・小物・衣装も同じスタイルに合わせる（rig/bgm/scene.js）
#   lofi＝ゆったり（これまでの作業用BGM）／sea＝海辺（ギターとマリンバ、波の音）／wa＝和（琴・尺八ふう、平調子）／club＝あげあげ（4つ打ち）／ballad＝しっとり（ピアノとストリングス）
STYLE_PROGS = {
    'sea': {'major': [[(0, 'maj7'), (9, 'm7'), (5, 'maj7'), (7, '7')], [(5, 'maj7'), (7, '7'), (0, 'maj7'), (0, 'maj6')], [(0, 'maj6'), (2, 'm7'), (7, '7'), (0, 'maj7')], [(0, 'maj7'), (4, 'm7'), (5, 'maj7'), (7, '7')], [(5, 'maj7'), (4, 'm7'), (2, 'm7'), (7, '7')]]},
    'wa': {'minor': [[(0, 'm7'), (8, 'maj7'), (0, 'm7'), (7, 'm7')], [(0, 'm7'), (5, 'm7'), (8, 'maj7'), (7, 'm7')], [(8, 'maj7'), (7, 'm7'), (0, 'm7'), (0, 'm6')], [(0, 'm6'), (8, 'maj7'), (5, 'm7'), (7, 'm7')], [(5, 'm7'), (0, 'm7'), (8, 'maj7'), (0, 'm7')]]},
    'club': {'minor': [[(0, 'm7'), (8, 'maj7'), (3, 'maj7'), (10, '7')], [(0, 'm7'), (10, '7'), (8, 'maj7'), (8, 'maj7')], [(0, 'm7'), (5, 'm7'), (8, 'maj7'), (10, '7')], [(8, 'maj7'), (10, '7'), (0, 'm7'), (0, 'm7')]],
             'major': [[(5, 'maj7'), (7, '7'), (9, 'm7'), (9, 'm7')], [(0, 'maj7'), (7, '7'), (9, 'm7'), (5, 'maj7')]]},
    'ballad': {'major': [[(0, 'maj7'), (7, '7'), (9, 'm7'), (5, 'maj7')], [(9, 'm7'), (5, 'maj7'), (0, 'maj7'), (7, '7')], [(5, 'maj7'), (7, '7'), (4, 'm7'), (9, 'm7')], [(0, 'maj7'), (4, 'm7'), (5, 'maj7'), (7, '7')]],
               'minor': [[(0, 'm7'), (8, 'maj7'), (3, 'maj7'), (10, '7')], [(0, 'm7'), (5, 'm7'), (8, 'maj7'), (10, '7')], [(8, 'maj7'), (10, '7'), (0, 'm7'), (0, 'm7')]]},
}
STYLES = {
    'lofi':   dict(bpm=(66, 87),   minor=0.3,  leads=['kalimba', 'bell', 'guitar', 'flute'], drums='lofi',  comp='block', swing=(0.10, 0.22), wow=True,  lp=9500,  rev=0.16, mult=1, tilt=1.7),
    'sea':    dict(bpm=(78, 96),   minor=0.0,  leads=['guitar', 'marimba', 'flute'],         drums='light', comp='strum', swing=(0.04, 0.10), wow=False, lp=12000, rev=0.20, mult=1, tilt=1.2),
    'wa':     dict(bpm=(60, 76),   minor=1.0,  leads=['koto', 'shaku'],                      drums='wa',    comp='koto',  swing=(0.0, 0.03),  wow=False, lp=11000, rev=0.30, mult=1, tilt=1.2, scale=(0, 2, 3, 7, 8)),
    'club':   dict(bpm=(120, 128), minor=0.8,  leads=['pluck', 'bell'],                      drums='four',  comp='stab',  swing=(0.0, 0.0),   wow=False, lp=15000, rev=0.14, mult=2, tilt=0.9),
    'ballad': dict(bpm=(56, 68),   minor=0.35, leads=['piano', 'flute', 'bell'],             drums='none',  comp='arp',   swing=(0.0, 0.0),   wow=False, lp=10000, rev=0.34, mult=1, tilt=1.0),
}


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


def marimba(f, vel, rng):
    t = tt(1.0)
    y = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.04) + 0.1 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t / 0.02)
    return vel * np.minimum(1, t / 0.002) * np.exp(-t / 0.3) * y


def koto(f, vel, rng):
    """琴ふう（はじいた直後が明るく、長く響く）"""
    n = int(SR * 2.4); N = max(2, int(round(SR / f)))
    x = np.zeros(n); x[:N] = lp(rng.standard_normal(N), 5200)
    a = np.zeros(N + 2); a[0] = 1; g = 0.9965; a[N] = -0.5 * g; a[N + 1] = -0.5 * g
    y = lfilter([1.0], a, x); y = y / (np.abs(y).max() + 1e-9)
    t = np.arange(n) / SR
    return vel * 0.9 * y * np.clip((2.4 - t) / 0.4, 0, 1)


def shaku(f, dur, vel, rng):
    """尺八ふう（下からすくい上げる入り・息の音・ゆっくり深くなるゆれ）"""
    t = tt(dur + 0.3)
    scoop = 1 - 0.035 * np.exp(-t / 0.07)
    vib = 1 + 0.007 * np.sin(2 * np.pi * 4.4 * t) * np.minimum(1, t / 0.8)
    ph = 2 * np.pi * np.cumsum(f * scoop * vib) / SR
    y = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(len(t)), 1500, 5000) * (0.10 + 0.25 * np.exp(-t / 0.08))
    env = np.minimum(1, t / 0.09) * np.clip((dur + 0.3 - t) / 0.26, 0, 1)
    return vel * 0.7 * env * (y + breath)


def pluck(f, vel, rng):
    """クラブ系のシンセ（のこぎり波をはじく）"""
    t = tt(0.7); y = np.zeros(len(t))
    for h in range(1, 13):
        if f * h > 9000: break
        y += np.sin(2 * np.pi * f * h * t + 0.3 * h) / h * np.exp(-t * (1.5 + 2.2 * h))
    return vel * 1.3 * np.minimum(1, t / 0.003) * y


def piano(f, dur, vel, rng):
    t = tt(dur + 0.8); y = np.zeros(len(t))
    for h in range(1, 8):
        fh = f * h * (1 + 0.0004 * h * h)
        if fh > 8000: break
        y += np.sin(2 * np.pi * fh * t) / h ** 1.25 * np.exp(-t * (0.35 + 0.42 * h))
    env = np.minimum(1, t / 0.005) * np.clip((dur + 0.8 - t) / 0.7, 0, 1)
    return vel * 1.25 * env * y


def strings(f, dur):
    t = tt(dur + 1.6); y = np.zeros(len(t))
    for h, a in ((1, 1), (2, .5), (3, .28), (4, .14)):
        for d in (-0.004, 0.003):
            y += a * np.sin(2 * np.pi * f * h * (1 + d) * t + h * 1.3 + d * 400)
    vib = 1 + 0.05 * np.sin(2 * np.pi * 5 * t)
    env = np.minimum(1, t / 0.7) * np.clip((dur + 1.6 - t) / 1.5, 0, 1)
    return env * vib * y * 0.2


def clap(vel, rng):
    t = tt(0.25); nz = bp(rng.standard_normal(len(t)), 900, 3500)
    env = sum(np.exp(-np.maximum(t - d, 0) / 0.012) * (t >= d) for d in (0, 0.011, 0.023)) * 0.5 + np.exp(-t / 0.09) * 0.5
    return vel * nz * env


def shaker(vel, rng):
    t = tt(0.09); nz = hp(rng.standard_normal(len(t)), 5000)
    return vel * nz * np.minimum(1, t / 0.012) * np.exp(-t / 0.03)


def taiko(vel, rng):
    t = tt(0.9); f = 62 + 40 * np.exp(-t / 0.05)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3) + 0.25 * lp(rng.standard_normal(len(t)), 900) * np.exp(-t / 0.05)
    return vel * y


def woodblock(vel, rng):
    t = tt(0.12)
    return vel * (np.sin(2 * np.pi * 980 * t) * np.exp(-t / 0.02) + 0.4 * np.sin(2 * np.pi * 1630 * t) * np.exp(-t / 0.012))


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


RHYTHMS_CLUB = [[0, 0.75, 1.5, 2.5, 3, 4, 4.75, 5.5, 6.5], [0, 1, 1.5, 3, 3.5, 4, 5, 5.5, 7], [0.5, 1.5, 2, 3.5, 4.5, 5.5, 6, 7.5], [0, 1.5, 3, 4, 5.5, 7]]
RHYTHMS_SLOW = [[0, 2, 4, 6], [0, 3, 4, 7], [1, 3, 5], [0, 2.5, 4, 6.5], [0, 4, 6]]
# 旋律の楽器：(作る関数, 音をのばす楽器か)
LEADS = {'kalimba': (kalimba, False), 'bell': (bell, False), 'guitar': (guitar, False), 'marimba': (marimba, False), 'koto': (koto, False), 'pluck': (pluck, False),
         'flute': (flute, True), 'shaku': (shaku, True), 'piano': (piano, True)}


KEYS = [48, 50, 51, 53, 55, 57, 58]                               # C D Eb F G A Bb
KEY_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']


def pick_head(rng, style='lofi'):
    """1曲の骨組み（調・速さ・進行・旋律の楽器・構成）だけを決める。音は作らないので一瞬で終わる。
    tk＝「調|進行|速さ」。これが同じ曲は、ほかの回と「同じ曲」に聞こえやすいので、回をまたいで二度使わない（オーナー依頼 2026-11-14「曲はできるだけ被らないように」）"""
    S = STYLES[style]
    mode = 'minor' if rng.random() < S['minor'] else 'major'
    key = int(rng.choice(KEYS))
    bpm = float(rng.integers(S['bpm'][0], S['bpm'][1] + 1))
    swing = S['swing'][0] + (S['swing'][1] - S['swing'][0]) * rng.random()      # 拍に対する割合
    table = (STYLE_PROGS.get(style) or PROGS)
    if mode not in table: mode = next(iter(table))
    pi = int(rng.integers(len(table[mode])))
    lead_name = S['leads'][rng.integers(len(S['leads']))]
    m_ = S['mult']
    # 構成（小節）：前奏 → A → A'（旋律）→ B → 間奏 → A'' → 後奏。クラブ系は小節が短いので倍にする
    sections = [('intro', 4 * m_), ('a', 8 * m_), ('am', 8 * m_), ('b', 8 * m_), ('break', 4 * m_), ('am', 8 * m_), ('b', 8 * m_ if rng.random() < .5 and m_ == 1 else 0), ('am', 8 if m_ == 1 else 16), ('outro', 4 * m_)]
    sections = [x for x in sections if x[1]]
    nbars = sum(n for _, n in sections); dur = nbars * 4 * 60 / bpm + 3.0
    name = KEY_NAMES[key % 12] + (' minor' if mode == 'minor' else ' major')
    prog = [f'{r}{k}' for r, k in table[mode][pi]]
    return {'mode': mode, 'keynote': key, 'key': name, 'bpm': bpm, 'swing': round(swing, 3), 'pi': pi, 'prog': prog, 'lead': lead_name, 'sections': sections, 'bars': nbars, 'sec': round(dur, 2),
            'style': style, 'tk': f'{name}|{"-".join(prog)}|{bpm}'}


def choose(seed, minutes, style='lofi', avoid=()):
    """その回の曲の並びを決める（音は作らない）。同じ seed・同じ avoid なら、いつも同じ並びになる。
    avoid＝これまでの回（出した回・作り置き）で使った tk。必ず守る：前の曲と調を変える。できる限り守る：avoid と同じ曲を使わない・回の中で同じ調×進行を使わない・旋律の楽器を続けない。
    どうしても avoid を避けられなかった曲には reused を付ける（検査がその数だけ見逃す。組み合わせを使い切ったときだけ起きる）"""
    avoid, tracks, total, i, used, mine = set(avoid), [], 0.0, 0, set(), set()
    many_leads = len(STYLES[style]['leads']) >= 3
    while total < minutes * 60:
        i += 1; cands = []
        for j in range(80):
            h = pick_head(np.random.default_rng([seed, i, j]), style); h['try'] = j
            if tracks and tracks[-1]['key'] == h['key']: continue                       # 前の曲と同じ調は使わない（続けて聞くと同じ曲に聞こえる）
            fresh = h['tk'] not in avoid and h['tk'] not in mine
            soft = (h['key'], tuple(h['prog'])) not in used and not (tracks and many_leads and tracks[-1]['lead'] == h['lead'])
            cands.append((0 if fresh and soft else 1 if fresh else 2, j, h))
            if fresh and soft: break
        if not cands: h = pick_head(np.random.default_rng([seed, i, 80]), style); h['try'] = 80; rank = 2
        else: rank, _, h = min(cands, key=lambda c: c[:2])
        if rank == 2: h['reused'] = True
        h['no'] = i; used.add((h['key'], tuple(h['prog']))); mine.add(h['tk'])
        tracks.append(h); total += h['sec'] - 3.0                                       # 3秒ずつ重ねてつなぐ
    return tracks


def make_track(rng, idx, style='lofi', head=None):
    S = STYLES[style]
    head = head or pick_head(rng, style)
    mode, key, bpm, lead_name, sections = head['mode'], head['keynote'], head['bpm'], head['lead'], [tuple(x) for x in head['sections']]
    beat = 60 / bpm; bar = 4 * beat
    swing = head['swing'] * beat
    prog = (STYLE_PROGS.get(style) or PROGS)[mode][head['pi']]
    lead, sustained = LEADS[lead_name]
    m_ = S['mult']
    nbars = head['bars']; dur = nbars * bar + 3.0
    comp, mel, bs, dr, pd = Bus(dur), Bus(dur), Bus(dur), Bus(dur), Bus(dur)
    scale = S.get('scale') or PENT[mode]
    rh = RHYTHMS_CLUB if style == 'club' else RHYTHMS_SLOW if style in ('ballad', 'wa') else RHYTHMS
    def motif(center):
        r = list(rh[rng.integers(len(rh))])
        pool = sorted(m for m in range(center - 9, center + 10) if (m - key) % 12 in scale)
        i = int(np.argmin([abs(m - center) for m in pool])) + int(rng.integers(-1, 2)); notes = []
        for _ in r:
            i = int(np.clip(i + rng.choice([-2, -1, -1, 0, 1, 1, 2]), 0, len(pool) - 1)); notes.append(pool[i])
        return r, notes, pool
    motifA, motifB = motif(74), motif(77)
    kick_pat = [[0, 2.5], [0, 1.5, 2.5], [0, 2, 2.75], [0, 2.5, 3.5]][rng.integers(4)]
    use_rim = rng.random() < 0.4
    stab_pat = [[0.5, 1.5, 2.5, 3.5], [0, 0.75, 1.5, 2.5, 3.25], [0.5, 1.25, 2.5, 3.25]][rng.integers(3)]
    prev = None; b = 0; kicks = []
    for sec, n in sections:
        for k in range(n):
            t0 = b * bar; root, kind = prog[b % 4]; rpc = (key + root) % 12
            v = voice(rpc, kind, prev); prev = v
            drums_on = sec in ('a', 'am', 'b'); last_of_sec = k == n - 1; quiet = sec in ('intro', 'outro', 'break')
            br = 36 + (rpc - 36) % 12; br = br if br <= 46 else br - 12
            nxt = prog[(b + 1) % 4][0]; nb = 36 + ((key + nxt) % 12 - 36) % 12; nb = nb if nb <= 46 else nb - 12
            # ---- 和音
            if S['comp'] == 'block':                                   # エレピ：1拍目にじゃらん、2.5拍目の裏に軽く
                vel = 0.085 if sec != 'intro' else 0.07
                for j, m in enumerate(v): comp.add(epiano(NOTE(m), bar * 0.95, vel * (0.9 + 0.2 * rng.random()), rng), t0 + j * (0.012 + 0.01 * rng.random()), pan=-0.35 + 0.23 * j)
                if sec != 'intro' and rng.random() < 0.75:
                    for j, m in enumerate(v[1:]): comp.add(epiano(NOTE(m), beat * 1.2, vel * 0.55, rng), t0 + 2.5 * beat + swing + j * 0.01, pan=0.3 - 0.2 * j)
                if sec in ('b', 'break', 'outro'):
                    for j, m in enumerate(v[:3]): pd.add(pad(NOTE(m), bar) * 0.03, t0, pan=(-0.6, 0, 0.6)[j])
            elif S['comp'] == 'strum':                                 # 海：ナイロンギターのストローク（下ろす→軽く上げる）
                for j, m in enumerate(v): comp.add(guitar(NOTE(m), 0.075 * (0.85 + 0.3 * rng.random()), rng), t0 + j * 0.028, pan=-0.3 + 0.2 * j)
                if not quiet:
                    for q, vv in ((1.5, 0.04), (2.5, 0.055), (3.5, 0.04)):
                        for j, m in enumerate(reversed(v[1:])): comp.add(guitar(NOTE(m), vv * (0.85 + 0.3 * rng.random()), rng), t0 + q * beat + (swing if q % 1 else 0) + j * 0.02, pan=0.25 - 0.2 * j)
                for j, m in enumerate(v[:3]): pd.add(pad(NOTE(m), bar) * 0.022, t0, pan=(-0.6, 0, 0.6)[j])
            elif S['comp'] == 'koto':                                  # 和：琴の分散和音をゆっくり＋低い持続音
                order = [0, 2, 1, 3] if len(v) > 3 else [0, 2, 1, 2]
                for q, oi in enumerate(order):
                    if quiet and q % 2: continue
                    comp.add(koto(NOTE(v[oi % len(v)]), 0.085 * (0.8 + 0.4 * rng.random()), rng), t0 + q * beat + rng.normal(0, 0.006), pan=-0.3 + 0.2 * q)
                pd.add(pad(NOTE(br + 24), bar) * 0.02, t0, pan=0); pd.add(pad(NOTE(br + 19), bar) * 0.014, t0, pan=0.3)
            elif S['comp'] == 'stab':                                  # クラブ：シンセの刻み＋のびるパッド
                if sec != 'intro':
                    for q in stab_pat:
                        for j, m in enumerate(v): comp.add(pluck(NOTE(m + 12), 0.05 * (0.85 + 0.3 * rng.random()), rng), t0 + q * beat, pan=-0.45 + 0.3 * j)
                for j, m in enumerate(v[:3]): pd.add(pad(NOTE(m), bar) * (0.05 if quiet else 0.035), t0, pan=(-0.6, 0, 0.6)[j])
            else:                                                      # バラード：ピアノの分散和音＋ストリングス
                seq = [v[0], v[2 % len(v)], v[1], v[2 % len(v)], v[-1], v[2 % len(v)], v[1], v[2 % len(v)]]
                for q, m in enumerate(seq):
                    if quiet and q % 2: continue
                    comp.add(piano(NOTE(m), beat * 0.9, 0.06 * (0.8 + 0.35 * rng.random()) * (1.15 if q == 0 else 1), rng), t0 + q * beat / 2 + rng.normal(0, 0.007), pan=-0.3 + 0.08 * q)
                if sec != 'intro':
                    for j, m in enumerate(v[:3]): pd.add(strings(NOTE(m + (12 if j == 2 else 0)), bar) * 0.05, t0, pan=(-0.5, 0.1, 0.5)[j])
            # ---- ベース
            if sec != 'intro':
                if style == 'club':
                    if drums_on or sec == 'outro':
                        for q in (0.5, 1.5, 2.5, 3.5): bs.add(bass(NOTE(br), beat * 0.42, 0.5), t0 + q * beat)          # 4つ打ちの裏
                    else: bs.add(bass(NOTE(br), bar * 0.95, 0.3), t0)
                elif style == 'ballad': bs.add(piano(NOTE(br), bar * 0.95, 0.16, rng), t0); bs.add(bass(NOTE(br), bar * 0.95, 0.2), t0)
                elif style == 'wa': bs.add(bass(NOTE(br), beat * 3.2, 0.3), t0)
                elif style == 'sea':
                    bs.add(bass(NOTE(br), beat * 1.3, 0.42), t0); bs.add(bass(NOTE(br + 7), beat * 0.8, 0.3), t0 + 1.5 * beat + swing); bs.add(bass(NOTE(br), beat * 0.9, 0.36), t0 + 2.5 * beat + swing)
                else:
                    bs.add(bass(NOTE(br), beat * 1.9, 0.5), t0)
                    if drums_on:
                        bs.add(bass(NOTE(br), beat * 0.8, 0.36), t0 + 2.5 * beat + swing)
                        if last_of_sec or rng.random() < 0.3: bs.add(bass(NOTE(nb + (1 if rng.random() < .5 else -1)), beat * 0.45, 0.3), t0 + 3.5 * beat + swing)   # 次の根音へ半音で近づく
            # ---- 打楽器
            D = S['drums']
            if D == 'lofi' and drums_on:
                for kpos in kick_pat:
                    tk = t0 + kpos * beat + (swing if kpos % 1 == 0.5 else 0) + rng.normal(0, 0.004)
                    dr.add(kick(0.55 if kpos == 0 else 0.4), tk); kicks.append(tk)
                for q in (1, 3): dr.add((rim if use_rim else snare)(0.3 + 0.05 * rng.random(), rng), t0 + q * beat + 0.012 + rng.normal(0, 0.004), pan=0.08)   # スネアは少し遅らせる
                for h in range(8): dr.add(hat((0.16 if h % 2 == 0 else 0.09) * (0.8 + 0.4 * rng.random()), rng, open_=(h == 7 and last_of_sec)), t0 + h * beat / 2 + (swing if h % 2 else 0) + rng.normal(0, 0.005), pan=-0.2)
                if last_of_sec:
                    for q in (3.0, 3.5, 3.75): dr.add(snare(0.13 + 0.06 * rng.random(), rng), t0 + q * beat, pan=0.1)
            elif D == 'light' and sec != 'intro':                       # 海：シェイカーとリム、やわらかいキック
                for h in range(8): dr.add(shaker((0.10 if h % 2 else 0.06) * (0.8 + 0.4 * rng.random()), rng), t0 + h * beat / 2 + (swing if h % 2 else 0) + rng.normal(0, 0.004), pan=0.3)
                if drums_on:
                    for kpos in (0, 2.5): dr.add(kick(0.3), t0 + kpos * beat + (swing if kpos % 1 else 0)); kicks.append(t0 + kpos * beat)
                    for q in (1, 3): dr.add(rim(0.2 + 0.04 * rng.random(), rng), t0 + q * beat + rng.normal(0, 0.004), pan=-0.15)
            elif D == 'wa' and drums_on:                                # 和：太鼓を2小節に1回、ときどき拍子木
                if k % 2 == 0: dr.add(taiko(0.42, rng), t0); kicks.append(t0)
                if k % 4 == 3: dr.add(woodblock(0.12, rng), t0 + 3 * beat, pan=0.3); dr.add(woodblock(0.09, rng), t0 + 3.5 * beat, pan=0.3)
                if k % 2 == 1 and rng.random() < 0.5: dr.add(taiko(0.2, rng), t0 + 2 * beat)
            elif D == 'four':                                           # クラブ：4つ打ち・2拍4拍に手拍子・裏にハイハット
                if drums_on:
                    for q in range(4): dr.add(kick(0.62), t0 + q * beat); kicks.append(t0 + q * beat)
                    for q in (1, 3): dr.add(clap(0.3, rng), t0 + q * beat, pan=0.05)
                    for q in range(4): dr.add(hat(0.22, rng, open_=True), t0 + (q + 0.5) * beat, pan=-0.2)
                    for h in range(16):
                        if h % 4 != 2: dr.add(hat(0.05 * (0.7 + 0.6 * rng.random()), rng), t0 + h * beat / 4, pan=0.25)
                    if last_of_sec:
                        for q in (3, 3.25, 3.5, 3.75): dr.add(snare(0.16 + 0.05 * (q - 3) * 4, rng), t0 + q * beat)
                elif sec == 'break' and k >= n - 2:                    # 盛り上げ：スネアを細かく
                    for h in range(8 if k == n - 2 else 16): dr.add(snare(0.07 + 0.012 * h, rng), t0 + h * bar / (8 if k == n - 2 else 16))
                elif sec in ('intro', 'outro'):
                    for q in range(4): dr.add(hat(0.14, rng, open_=True), t0 + (q + 0.5) * beat, pan=-0.2)
                    if k >= n // 2 or sec == 'outro':
                        for q in range(4): dr.add(kick(0.5), t0 + q * beat); kicks.append(t0 + q * beat)
            # ---- 旋律（2小節ごとの形。A=A 型、B=B 型。区切りの小節は休む）
            if sec in ('am', 'b') and k % 2 == 0 and not (k >= n - 2 and rng.random() < 0.5):
                r, ns, pool = motifA if sec == 'am' else motifB
                var = (k // 2) % 2 == 1
                for q, (pos, m) in enumerate(zip(r, ns)):
                    if var and q >= len(r) - 2: m = pool[int(np.clip(pool.index(m) + rng.choice([-1, 1, 2]), 0, len(pool) - 1))]   # 2回目は終わりだけ変える
                    croot, ckind = prog[(b + int(pos // 4)) % 4]
                    cp = {((key + croot) % 12 + i) % 12 for i in Q[ckind][:4]}
                    if pos % 2 == 0: m = snap_chord(m, cp, pool)
                    tm = t0 + pos * beat + (swing if pos % 1 == 0.5 else 0) + rng.normal(0, 0.006 if style != 'club' else 0.001)
                    vv = 0.11 * (0.8 + 0.4 * rng.random())
                    if sustained:
                        nx = r[q + 1] if q + 1 < len(r) else 8
                        mel.add(lead(NOTE(m), min(2.6 if style in ('ballad', 'wa') else 1.6, (nx - pos) * beat * 0.92), vv, rng), tm, pan=0.15)
                    else:
                        mel.add(lead(NOTE(m), vv, rng), tm, pan=0.15 + 0.1 * np.sin(q))
            b += 1
    # サイドチェイン（キックのたびに和音とパッドを少し下げる。クラブ系は深く＝うねり）
    depth = 0.38 if style == 'club' else 0.72
    duck = np.ones(comp.n, dtype=np.float32); L = int((0.26 if style == 'club' else 0.22) * SR); ramp = (depth + (1 - depth) * np.linspace(0, 1, L) ** 1.5).astype(np.float32)
    for tk in kicks:
        i = int(tk * SR)
        if 0 <= i < comp.n: duck[i:i + L] = np.minimum(duck[i:i + L], ramp[:len(duck[i:i + L])])
    music = (lp(comp.b * duck[:, None], 6500 if style == 'lofi' else 9000) * 1.6 + lp(pd.b * duck[:, None], 3000 if style != 'club' else 5000) * 2.0 + lp(mel.b, 7000 if style == 'lofi' else 9500) * 2.9)
    ir = reverb_ir(rng, 1.7 if style in ('lofi', 'club') else 2.4)
    wet = np.stack([fftconvolve(music[:, c], ir[:, c])[:len(music)] for c in (0, 1)], axis=1)
    bassg = lp(bs.b * (duck[:, None] if style == 'club' else 1), 900) * {'club': 0.5, 'sea': 0.3, 'wa': 0.26, 'ballad': 0.62}.get(style, 0.42)
    mix = music + S['rev'] * wet + bassg + lp(dr.b, 9000 if style == 'lofi' else 13000) * 1.25 + 0.05 * np.stack([fftconvolve(dr.b[:, c], ir[:, c])[:len(music)] for c in (0, 1)], axis=1)
    if S['wow']: mix = wow(mix.astype(np.float32), rng)                # テープの回転むら（ローファイだけ）
    mix = mix + S['tilt'] * hp(mix, 1300, 1)                           # 中高域を少し持ち上げる（こもりすぎない）
    mix = lp(hp(mix, 32), S['lp'])
    mix = np.tanh(mix * 1.6) / 1.6                                     # やわらかい飽和
    n = len(mix); t = np.arange(n) / SR
    env = np.minimum(1, t / 1.2) * np.clip((dur - t) / 4.0, 0, 1)
    mix = mix * env[:, None]
    # 曲ごとの音量をそろえる（ピークではなく、鳴っている部分の平均の大きさで合わせる。大きすぎる山だけやわらかく抑える）
    body = mix[int(len(mix) * 0.15):int(len(mix) * 0.85)]
    mix = mix * (0.105 / (np.sqrt((body ** 2).mean()) + 1e-9))
    mix = np.where(np.abs(mix) > 0.32, np.sign(mix) * (0.32 + 0.13 * np.tanh((np.abs(mix) - 0.32) / 0.13)), mix)   # 山は 0.45 まで（平均の約12dB上）。あとで全体を上げてもピークが -1 dB を超えない
    info = {'no': idx, 'key': head['key'], 'bpm': bpm, 'bars': nbars, 'sec': round(dur, 2), 'lead': lead_name, 'prog': head['prog'], 'swing': round(swing / beat, 3), 'style': style}
    if head.get('reused'): info['reused'] = True
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
    elif kind == 'waves':                                    # 波：10秒ごとに寄せて返す（60秒でちょうど6回）
        tt_ = np.arange(n + x) / SR
        swell = (0.5 - 0.5 * np.cos(2 * np.pi * tt_ / 10.0)) ** 2.2
        hiss = (0.5 - 0.5 * np.cos(2 * np.pi * (tt_ - 2.2) / 10.0)) ** 3
        sig = bp(raw, 150, 2200) * (0.15 + 0.85 * swell)[:, None] + hp(raw, 2500) * 0.35 * hiss[:, None] + lp(raw, 150) * 0.5
    elif kind == 'garden':                                   # 庭：細い水の音と、ときどき風鈴
        sig = bp(raw, 1800, 6500) * 0.22 + lp(raw, 200) * 0.6
        for _ in range(7):
            i = rng.integers(0, n - SR * 3); f = rng.choice([2093.0, 2349.3, 2793.8, 3136.0]); t_ = np.arange(int(SR * 2.5)) / SR
            d = (np.sin(2 * np.pi * f * t_) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t_)) * np.exp(-t_ / 0.7) * 0.5; pn = rng.random()
            sig[i:i + len(d), 0] += d * pn; sig[i:i + len(d), 1] += d * (1 - pn)
    else:
        sig = lp(raw, 220) * 1.0 + bp(raw, 2000, 5000) * 0.03
    # レコードのぱちぱち（ごく小さく）
    cr = np.zeros((n + x, 2))
    for _ in range(int(dur * 5)):
        i = rng.integers(0, n + x - 200); a = (0.3 + 0.7 * rng.random()) * rng.choice([-1, 1]); c = rng.integers(2)
        cr[i:i + 40, c] += a * np.exp(-np.arange(40) / 6.0)
    if kind in ('rain', 'room'): sig = sig + hp(lp(cr, 6000), 800) * (2.2 if kind == 'rain' else 3.0)   # レコードのぱちぱちはローファイの回だけ
    sig = loopable(sig)
    return (sig / (np.abs(sig).max() + 1e-9) * 0.5).astype(np.float32)


def write_wav(path, x):
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('out'); ap.add_argument('--seed', type=int, required=True)
    ap.add_argument('--minutes', type=float, default=60); ap.add_argument('--ambience', default='rain'); ap.add_argument('--style', default='lofi', choices=sorted(STYLES))
    ap.add_argument('--avoid', help='これまでの回で使った曲（調|進行|速さ）の一覧（JSON のファイル）。同じ曲を作らない'); ap.add_argument('--plan-only', action='store_true', help='曲の並びだけ決めて表示（音は作らない）')
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    avoid = json.loads(pathlib.Path(a.avoid).read_text()) if a.avoid else []
    heads = choose(a.seed, a.minutes, a.style, avoid)
    if a.plan_only:
        print(json.dumps(heads, ensure_ascii=False)); return
    tracks, total = [], 0.0
    for h in heads:
        i = h['no']
        x, info = make_track(np.random.default_rng([a.seed, i, h['try'], 7]), i, a.style, head=h)   # 曲ごとに別の乱数（骨組みと同じ seed・番号から。旋律は曲ごとに新しく作る）
        write_wav(out / f'track_{i:02d}.wav', x); info['file'] = f'track_{i:02d}.wav'
        tracks.append(info); total += info['sec'] - 3.0          # 3秒ずつ重ねてつなぐ
        print('track', i, info['key'], info['bpm'], info['lead'], info['sec'], flush=True)
    write_wav(out / 'ambience.wav', ambience(a.ambience, np.random.default_rng(a.seed + 1)))
    (out / 'tracks.json').write_text(json.dumps({'seed': a.seed, 'ambience': a.ambience, 'style': a.style, 'tracks': tracks}, ensure_ascii=False, indent=1))
    print('music ok', len(tracks), 'tracks', round(total / 60, 1), 'min')


if __name__ == '__main__':
    main()
