#!/usr/bin/env python3
# レンとジル v2 の音（効果音＋BGM）を作る。使い方: python3 audio.py meta.json out.wav
# 旧版（sfx.py＋bgm2.py：モノラルの純音）からの改善：ステレオ・48kHz、効果音を「木・紙・ばね・鈴」などの質感で作り直し、
# 部屋の響き、BGM はウクレレ風の和音＋ベース＋シェイカー＋鉄琴、効果音が鳴る間は BGM を少し下げる、
# 「間」（bgmHolds）は BGM を止めて笑いの間を作る、最後は短く消して頭に戻っても途切れて聞こえないように。
# 音量そろえ（-14 LUFS）は norm.py が最後にまとめて行う。
import json, sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.003, d=0.2):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(d, 1e-4))
    return e
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def A(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def noise(d): return rng.standard_normal(int(SR * d))
def modal(f0, ratios, amps, decays, d):
    t = t_(d); y = np.zeros_like(t)
    for r, a, dc in zip(ratios, amps, decays): y += a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / dc)
    return y * np.minimum(1, t / .002)
def sweep(f0, f1, d, shape='exp'):
    t = t_(d); f = f0 * (f1 / f0) ** (t / d) if shape == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------- 効果音（種類は旧 sfx.py と同じ名前） ----------
def S(kind):
    if kind == 'tap':    # 机をとんっ（木の音）
        return A(0.55 * modal(820, [1, 2.32, 3.9], [1, .5, .25], [.035, .02, .012], .14), 0.12 * bp(noise(.03), 1500, 5000) * env(int(SR * .03), .001, .008))
    if kind == 'thump':  # どんっ（足ダン・ハンコ）
        k = sweep(140, 48, .32) * env(int(SR * .32), .002, .09)
        return A(0.9 * k, 0.25 * lp(noise(.05), 900) * env(int(SR * .05), .001, .015))
    if kind == 'pop':    # ぽんっ（出てくる）
        return A(0.55 * sweep(380, 1250, .09) * env(int(SR * .09), .002, .03), 0.1 * hp(noise(.02), 3000) * env(int(SR * .02), .001, .004))
    if kind == 'boing':  # ばね
        t = t_(.5); f = 260 * (1 + .35 * np.exp(-t / .12) * np.sin(2 * np.pi * 14 * t)) * (1 + .4 * t)
        return 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), .004, .2)
    if kind == 'pon':    # 木琴（ぽーん）
        return 0.5 * modal(1046.5, [1, 3.98, 9.1], [1, .35, .12], [.35, .12, .05], .7)
    if kind == 'clink':  # グラス・コップ
        return 0.35 * modal(2100, [1, 1.62, 2.48, 3.4], [1, .7, .5, .3], [.25, .2, .15, .1], .5)
    if kind == 'chime':  # 定時のチャイム（2音・鐘の倍音）
        a = modal(659.3, [1, 2.0, 2.76, 5.4], [1, .45, .3, .15], [1.1, .6, .4, .2], 1.6)
        b = modal(523.3, [1, 2.0, 2.76, 5.4], [1, .45, .3, .15], [1.3, .7, .45, .2], 1.8)
        out = np.zeros(int(SR * 2.3)); out[:len(a)] += a; o = int(SR * .45); out[o:o + len(b)] += b
        return 0.45 * out
    if kind == 'click':
        return 0.4 * bp(noise(.012), 2500, 7000) * env(int(SR * .012), .0005, .003)
    if kind == 'whoosh':  # しゅばっ（消える・走る）
        d = .45; n = noise(d); t = t_(d); fc = 400 * (10 ** (1.2 * np.sin(np.pi * t / d)))
        y = np.zeros_like(n); seg = int(SR * .015)
        for i in range(0, len(n), seg):
            f = float(np.clip(fc[i], 300, 9000)); y[i:i + seg] = bp(n[max(0, i - 200):i + seg], f * .7, min(f * 1.4, 20000))[-len(y[i:i + seg]):]
        return 0.35 * y * np.sin(np.pi * t / d) ** 1.5
    if kind == 'swish':
        d = .22; t = t_(d)
        return 0.3 * bp(noise(d), 2500, 9000) * np.sin(np.pi * t / d) ** 2
    if kind == 'blink':  # ぱちっ（まばたき）
        return 0.28 * sweep(2600, 1800, .05) * env(int(SR * .05), .001, .015)
    if kind == 'twitch':  # ぴくっ（耳）
        a = 0.3 * modal(1500, [1, 2.7], [1, .3], [.03, .015], .06); out = np.zeros(int(SR * .14)); out[:len(a)] += a; out[int(SR * .07):int(SR * .07) + len(a)] += a * .8
        return out
    if kind == 'flop':   # ぺたん（倒れる）
        return A(0.5 * lp(noise(.25), 600) * env(int(SR * .25), .005, .07), 0.5 * sweep(110, 60, .2) * env(int(SR * .2), .003, .06))
    raise Exception('unknown sfx ' + kind)

# ---------- BGM ----------
def ks_pluck(f, d, bright=.5):
    # はじいた弦（倍音を足して作る。音程が正確・速い）。旧版の KS は整数の遅れで最大 +23 セント音程がずれていた
    t = t_(d); y = np.zeros_like(t)
    for k in range(1, 9):
        y += (1 / k ** 1.3) * np.sin(2 * np.pi * f * k * (1 + .0004 * k * k) * t) * np.exp(-t * (2.2 + 1.6 * k))
    return y * np.minimum(1, t / .003) * .6
_pl = {}
def pluck(f, d=.9):
    k = (round(f, 1), d)
    if k not in _pl: _pl[k] = ks_pluck(f, d)
    return _pl[k]
def note(m): return 440 * 2 ** ((m - 69) / 12)
def bgm(dur, holds):
    bpm = 104; beat = 60 / bpm; n = int(SR * (dur + 1)); L = np.zeros(n); R = np.zeros(n)
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]  # C Am F G
    mel = [76, 79, 81, 79, 76, 74, 72, 74, 76, 72, 69, 72, 74, 71, 67, 71]  # 鉄琴のくり返し
    def add(x, at, pan=0, g=1.0):
        i = int(at * SR); x = x[:max(0, n - i)]
        L[i:i + len(x)] += x * g * (1 - pan) * .5 ** .5 * 1.2; R[i:i + len(x)] += x * g * (1 + pan) * .5 ** .5 * 1.2
    b = 0
    while b * beat < dur + .5:
        t0 = b * beat; ch = chords[(b // 4) % 4]
        if b % 2 == 0:  # ウクレレ風（ジャカ）
            for j, m in enumerate(ch): add(pluck(note(m + 12), .8), t0 + j * .012, -.25 + j * .05, .16)
        else:
            for j, m in enumerate(ch[::-1]): add(pluck(note(m + 12), .5), t0 + j * .01, -.2, .09)
        if b % 2 == 0:  # ベース
            t = t_(beat * 1.6); bs = (np.sin(2 * np.pi * note(ch[0] - 24) * t) + .25 * np.sin(4 * np.pi * note(ch[0] - 24) * t)) * env(len(t), .01, .35)
            add(bs, t0, 0, .32)
        for h in (0, .5):  # シェイカー（8分）
            sh = hp(noise(.06), 6000) * env(int(SR * .06), .004, .02)
            add(sh, t0 + h * beat, .35, .05 if h else .035)
        add(.5 * modal(note(mel[b % 16]), [1, 2.76, 5.4], [1, .25, .08], [.5, .2, .08], .8), t0, .3, .07)  # 鉄琴
        b += 1
    st = np.stack([L, R], 1)[:int(SR * dur)]
    # 「間」：BGM を 60ms で切って止め、明けたら戻す
    g = np.ones(len(st))
    for h in (holds or '').split(','):
        if '-' not in h: continue
        a, c = [float(v) for v in h.split('-')]
        ia, ic = int(a * SR), int(c * SR); r = int(.06 * SR)
        g[ia:ic] = 0; g[max(0, ia - r):ia] = np.linspace(1, 0, len(g[max(0, ia - r):ia])); g[ic:ic + r] = np.linspace(0, 1, len(g[ic:ic + r]))
    return st * g[:, None]

def reverb(x, d=.55, wet=.16):
    n = int(SR * d); t = np.arange(n) / SR
    ir = np.stack([lp(rng.standard_normal(n), 5000) * np.exp(-t / (d / 5)), lp(rng.standard_normal(n), 5000) * np.exp(-t / (d / 5))], 1)
    ir /= np.abs(ir).sum(0) ** .5 * 6
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in (0, 1)], 1)
    return x + wet * y

def main():
    meta = json.load(open(sys.argv[1])); dur = float(meta['dur'])
    n = int(SR * (dur + .3)); fx = np.zeros((n, 2)); duck = np.zeros(n)
    for i, s in enumerate(meta['sfx']):
        x = np.asarray(S(s['type']), float); at = int(float(s['t']) * SR)
        pan = float(s.get('pan', ((i * 37) % 7 - 3) / 12))  # 指定がなければ少しずつ左右に散らす
        x = x[:max(0, n - at)]
        fx[at:at + len(x), 0] += x * (1 - pan) ** .5; fx[at:at + len(x), 1] += x * (1 + pan) ** .5
        duck[at:at + len(x)] = np.maximum(duck[at:at + len(x)], np.abs(x))
    fx = reverb(fx, .5, .14)
    m = bgm(dur, meta.get('bgmHolds'))
    m = np.pad(m, ((0, n - len(m)), (0, 0)))
    # 効果音が鳴っている間は BGM を最大 -5dB 下げる（なめらかに）
    de = lp(np.minimum(1, duck * 4), 12, 1); gain = 10 ** (-5 * np.clip(de, 0, 1) / 20)
    mix = fx + m * gain[:, None] * .9
    # 終わりの 0.25 秒を消す（ループの頭につないでも、ぶつっと聞こえない）
    end = int(SR * dur); f = int(SR * .25); mix[end - f:end] *= np.linspace(1, 0, f)[:, None]; mix = mix[:end]
    mix = hp(mix.T, 35).T  # 聞こえない低音を切る
    # やわらかい頭打ち（最大でも 0.7＝約 -3dBFS。旧版は 1.12 まで行って割れていた：qa「音がクリップ peak 1.06」2026-11-08）
    mix = np.tanh(mix * 1.1) * .7
    with wave.open(sys.argv[2], 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes())
    print('ok', sys.argv[2], round(dur, 2))

if __name__ == '__main__': main()
