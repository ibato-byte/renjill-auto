#!/usr/bin/env python3
"""ちかちか（描きかけのコマ）を見つける。2026-11-15 事故：「10分の会議」に、1 コマだけ絵が抜けて次のコマで戻るコマが 27 枚まざって出た。
見方：コマ i が前後と大きく違うのに、前（i-1）と後（i+1）はよく似ている＝「1 コマだけの変化」。演出の光（強く点滅させない決まり）ではふつう起きない。

  python3 auto/flicker.py <動画 または コマのフォルダ>     → 見つかれば 1 で終わり、コマの番号を出す
"""
import glob, os, subprocess, sys

W, H = 96, 170  # 小さくして比べる（全体の様子で足りる）
BW, BH = W * 2, H * 2  # ゆれの見分けだけは 2 倍の細かさで（2026-11-16：カメラが寄った場面の小さなゆれは、96 幅では 1 点に満たず、ずらしても合わなかった。背景を作り込んだら差が大きくなり、演出のゆれを「ちかちか」と数えた）


def frames(src):
    if os.path.isdir(src):
        fs = sorted(glob.glob(os.path.join(src, "f*.jpg")))
        for f in fs:
            yield subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vf", f"scale={BW}:{BH}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
        return
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={BW}:{BH}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    n = BW * BH
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield b
    p.wait()


def small(b):
    """2 倍の絵を、もとの大きさ（96×170）に（2×2 の平均）"""
    out = bytearray(W * H)
    for y in range(H):
        r0, r1 = b[2 * y * BW:(2 * y + 1) * BW], b[(2 * y + 1) * BW:(2 * y + 2) * BW]
        out[y * W:(y + 1) * W] = bytes((r0[2 * x] + r0[2 * x + 1] + r1[2 * x] + r1[2 * x + 1]) >> 2 for x in range(W))
    return bytes(out)


def diff(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def aligned(a, b, R=8, w=None, h=None):
    """少しずらして重ねたときの、いちばん小さい差（画面ぜんたいが 1 コマだけゆれる演出＝ずらせば合う。描きかけ＝ずらしても合わない）。2 倍の絵で比べる"""
    w, h = w or BW, h or BH
    best = 1e9
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            s = n = 0
            x0, x1 = max(0, dx), min(w, w + dx)
            for y in range(max(0, dy), min(h, h + dy), 4):
                ra, rb = a[y * w + x0:y * w + x1:2], b[(y - dy) * w + x0 - dx:(y - dy) * w + x1 - dx:2]
                s += sum(abs(p - q) for p, q in zip(ra, rb)); n += len(ra)
            if n and s / n < best: best = s / n
    return best


def find(src, here_min=1.2, ratio=2.2, shake=0.45):
    """[(コマの番号（1 始まり）, その差, 前後どうしの差)]"""
    out, prev2, prev1, i = [], None, None, 0
    d_prev = None
    B2 = B1 = None
    for big in frames(src):
        cur = small(big) if len(big) == BW * BH else big
        i += 1
        if prev2 is not None:
            d_in, d_out, back = diff(prev1, prev2), diff(cur, prev1), diff(cur, prev2)
            here = min(d_in, d_out)
            if here > here_min and here > back * ratio:
                # 画面ぜんたいのゆれ（ドン！の演出）は、ずらすと前後のコマに合う。ちかちかではない（2026-11-15：11/18「1枚だけ印刷」のゆれを止めかけた）
                if min(aligned(B1, B2), aligned(B1, big)) > here * shake: out.append((i - 1, round(here, 2), round(back, 2)))
        prev2, prev1 = prev1, cur; B2, B1 = B1, big
    return out


if __name__ == "__main__":
    bad = find(sys.argv[1])
    if bad:
        print("ちかちか NG：1 コマだけ絵が変わるコマが %d 枚 %s" % (len(bad), bad[:12])); sys.exit(1)
    print("ちかちか OK")
