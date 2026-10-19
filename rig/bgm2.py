# BGM v2：ローファイ／チル系（エレピの7thコード＋サブベース＋スウィングした軽いビート＋まばらなカリンバ）
# 耳に刺さらないよう、高域を落として飽和させない。完全自作・著作権フリー。
# 使い方: python3 bgm2.py out.wav 秒数 [無音区間 "a-b,c-d"] [bpm] [seed]
import numpy as np, sys, wave
SR = 44100
dur = float(sys.argv[2])
holds = [tuple(map(float, h.split('-'))) for h in sys.argv[3].split(',')] if len(sys.argv) > 3 and sys.argv[3] else []
bpm = float(sys.argv[4]) if len(sys.argv) > 4 else 92
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 1
rng = np.random.default_rng(seed)
beat = 60 / bpm
N = int(SR * (dur + 1.0))
pad = np.zeros(N); bass = np.zeros(N); drums = np.zeros(N); mel = np.zeros(N)
note = lambda m: 440 * 2 ** ((m - 69) / 12)

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def add(buf, x, t):
    i = int(t * SR)
    if i >= N: return
    buf[i:i + len(x)] += x[:N - i]

def epiano(f, length, vel=0.12):
    n = int(SR * length); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.012) * np.exp(-t / 1.1)
    tine = np.sin(2 * np.pi * f * t + 0.6 * np.exp(-t / 0.25) * np.sin(2 * np.pi * f * 2 * t))   # やわらかいFM
    body = 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.5) + 0.12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.3) + 0.05 * np.sin(2 * np.pi * f * 7 * t) * np.exp(-t / 0.08)
    trem = 1 + 0.08 * np.sin(2 * np.pi * 4.5 * t)
    return vel * env * (tine + body) * trem

def kalimba(f, vel=0.09):
    n = int(SR * 0.9); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.35)
    return vel * env * (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.05))

def sub(f, length, vel=0.22):
    n = int(SR * length); t = np.arange(n) / SR
    env = np.minimum(1, t / 0.02) * np.minimum(1, (length - t) / 0.05).clip(0, 1)
    return vel * env * np.tanh(1.3 * np.sin(2 * np.pi * f * t))

def kick(vel=0.5):
    n = int(SR * 0.35); t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t / 0.03)
    return vel * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)

def snap(vel=0.12):
    n = int(SR * 0.12); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.03)
    return vel * lowpass(x, 3500)

def hat(vel=0.03):
    n = int(SR * 0.05); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / 0.012)
    return vel * (x - lowpass(x, 5000)) * 0.8 + vel * 0.2 * lowpass(x, 6000)

# Fmaj7 → Em7 → Dm7 → Cmaj7（ボイシングは中音域に寄せる）
chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]
roots = [41, 40, 38, 36]
# まばらなメロディ（拍位置, MIDI）。1小節=4拍、4小節で一周
motif = [(0.0, 72), (1.5, 76), (2.5, 74), (6.0, 71), (7.0, 72), (10.0, 69), (11.5, 72), (14.0, 74), (15.0, 72)]
bar = 4 * beat
swing = 0.18 * beat   # 8分の裏を少し遅らせる
t0 = 0.0; b = 0
while t0 < dur + bar:
    ci = b % 4
    for j, m in enumerate(chords[ci]): add(pad, epiano(note(m + 12), bar * 1.1, 0.06), t0 + j * 0.018)
    add(pad, epiano(note(chords[ci][1] + 24), beat * 1.5, 0.03), t0 + 2.5 * beat + swing)    # 裏のコード刻み
    add(bass, sub(note(roots[ci]), beat * 1.8), t0)
    add(bass, sub(note(roots[ci]), beat * 0.9, 0.16), t0 + 2.5 * beat + swing)
    for k in range(4):
        tb = t0 + k * beat
        if k in (0, 2): add(drums, kick(0.2 if k == 0 else 0.14), tb)
        if k in (1, 3): add(drums, snap(), tb)
        add(drums, hat(), tb); add(drums, hat(0.012), tb + beat / 2 + swing)
    if b >= 1:   # 2小節目からメロディ
        for pos, m in motif:
            if int(pos // 4) == (b - 1) % 4: add(mel, kalimba(note(m)), t0 + (pos % 4) * beat + (swing if pos % 1 else 0))
    t0 += bar; b += 1

# キックで中低域を少し沈める（サイドチェイン）
duck = np.ones(N)
for k in np.arange(0, dur + bar, beat * 2):
    i = int(k * SR); L = int(0.25 * SR)
    duck[i:i + L] = np.minimum(duck[i:i + L], 0.6 + 0.4 * np.linspace(0, 1, len(duck[i:i + L])) ** 1.5)
mix = 2.2 * lowpass(pad * duck, 6000) + bass * duck * 0.22 + drums * 0.55 + 2.0 * lowpass(mel, 7000)
mix = lowpass(mix, 9000)
# 頭0.4秒はフェードイン、オチ前の「間」は無音
env = np.ones(N); fi = int(0.4 * SR); env[:fi] = np.linspace(0, 1, fi)
for a, c in holds:
    ia, ib = int(a * SR), int(c * SR); f = int(0.06 * SR)
    env[ia:ib] = 0; env[max(0, ia - f):ia] = np.linspace(1, 0, len(env[max(0, ia - f):ia])); env[ib:ib + f] = np.linspace(0, 1, len(env[ib:ib + f]))
mix *= env
end = int(dur * SR); fo = int(1.0 * SR)
mix[end - fo:end] *= np.linspace(1, 0, fo); mix[end:] = 0
mix = mix / (np.abs(mix).max() + 1e-9) * 0.6      # 飽和させずにピークを揃える
mix = mix[:int(SR * (dur + 0.2))]
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype(np.int16).tobytes())
print('bgm2 ok', dur)
