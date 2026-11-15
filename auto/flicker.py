#!/usr/bin/env python3
"""ちかちか（描きかけのコマ）を見つける。2026-11-15 事故：「10分の会議」に、1 コマだけ絵が抜けて次のコマで戻るコマが 27 枚まざって出た。
見方：コマ i が前後と大きく違うのに、前（i-1）と後（i+1）はよく似ている＝「1 コマだけの変化」。演出の光（強く点滅させない決まり）ではふつう起きない。

  python3 auto/flicker.py <動画 または コマのフォルダ>     → 見つかれば 1 で終わり、コマの番号を出す
"""
import glob, os, subprocess, sys

W, H = 96, 170  # 小さくして比べる（全体の様子で足りる）


def frames(src):
    if os.path.isdir(src):
        fs = sorted(glob.glob(os.path.join(src, "f*.jpg")))
        for f in fs:
            yield subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
        return
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    n = W * H
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield b
    p.wait()


def diff(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def aligned(a, b, R=4):
    """少しずらして重ねたときの、いちばん小さい差（画面ぜんたいが 1 コマだけゆれる演出＝ずらせば合う。描きかけ＝ずらしても合わない）"""
    best = 1e9
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            s = n = 0
            x0, x1 = max(0, dx), min(W, W + dx)
            for y in range(max(0, dy), min(H, H + dy), 2):
                ra, rb = a[y * W + x0:y * W + x1], b[(y - dy) * W + x0 - dx:(y - dy) * W + x1 - dx]
                s += sum(abs(p - q) for p, q in zip(ra, rb)); n += x1 - x0
            if n and s / n < best: best = s / n
    return best


def find(src, here_min=1.2, ratio=2.2, shake=0.45):
    """[(コマの番号（1 始まり）, その差, 前後どうしの差)]"""
    out, prev2, prev1, i = [], None, None, 0
    d_prev = None
    for cur in frames(src):
        i += 1
        if prev2 is not None:
            d_in, d_out, back = diff(prev1, prev2), diff(cur, prev1), diff(cur, prev2)
            here = min(d_in, d_out)
            if here > here_min and here > back * ratio:
                # 画面ぜんたいのゆれ（ドン！の演出）は、ずらすと前後のコマに合う。ちかちかではない（2026-11-15：11/18「1枚だけ印刷」のゆれを止めかけた）
                if min(aligned(prev1, prev2), aligned(prev1, cur)) > here * shake: out.append((i - 1, round(here, 2), round(back, 2)))
        prev2, prev1 = prev1, cur
    return out


if __name__ == "__main__":
    bad = find(sys.argv[1])
    if bad:
        print("ちかちか NG：1 コマだけ絵が変わるコマが %d 枚 %s" % (len(bad), bad[:12])); sys.exit(1)
    print("ちかちか OK")
