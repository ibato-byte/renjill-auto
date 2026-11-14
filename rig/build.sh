#!/bin/bash
# 使い方: ./build.sh ep名 出力パス（mp4） [noend]
set -e
R=$(dirname "$0"); e=$1; out=$2
dur=$(python3 -c "import json;print(json.load(open('$R/out/$e/meta.json'))['dur'])")
holds=$(python3 -c "import json;print(json.load(open('$R/out/$e/meta.json')).get('bgmHolds') or '')")
if grep -q "v2/lib.js" "$R/ep/${e%_nohook}.js" 2>/dev/null; then
  # v2 の回：ステレオの効果音＋BGM（rig/v2/audio.py。2026-11）
  python3 $R/v2/audio.py $R/out/$e/meta.json $R/out/$e/audio.wav >/dev/null
else
  python3 $R/sfx.py $R/out/$e/meta.json $R/out/$e/sfx.wav >/dev/null
  python3 $R/bgm2.py $R/out/$e/bgm.wav $dur "$holds" >/dev/null
  ffmpeg -y -loglevel error -i $R/out/$e/sfx.wav -i $R/out/$e/bgm.wav -filter_complex "[1:a]volume=0.32[b];[0:a][b]amix=inputs=2:duration=first:normalize=0[a]" -map "[a]" $R/out/$e/audio.wav
fi
# 音量をそろえる（全話：-14 LUFS・-1.5 dBTP。2026-11 までは話ごとに -20〜-15 LUFS とばらばらだった）
python3 $R/v2/norm.py $R/out/$e/audio.wav >/dev/null
# 動画にまとめる（設定は rig/video.json）。2026-11-15：
#  ・1.5 倍で描いたコマを Lanczos で 1080×1920 に縮める（輪郭がなめらか）
#  ・色の決まり（BT.709・テレビの範囲）に正しく直して、その印を付ける（前は印がなく、SNS やスマホによって色が少しずれて見えることがあった）
#  ・アニメ向けの圧縮（-tune animation）で、べた塗りと輪郭をきれいに。2 秒ごとに区切り（どの SNS でも頭出しが速い）
#  ・古いスマホでも再生できる範囲に（レベル 4.1・参照 4 コマ・閉じた GOP＝Instagram の投稿の決まり）
read FPS CRF PRESET VW VH <<< "$(python3 -c "import json;v=json.load(open('$R/video.json'));print(v['fps'],v['crf'],v['preset'],v['width'],v['height'])")"
ffmpeg -y -loglevel error -framerate $FPS -i $R/out/$e/f%04d.jpg -i $R/out/$e/audio.wav \
  -vf "scale=${VW}:${VH}:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt601:in_range=pc:out_color_matrix=bt709:out_range=tv,format=yuv420p" \
  -c:v libx264 -preset $PRESET -crf $CRF -tune animation -refs 4 -level:v 4.1 -flags +cgop -g $((FPS*2)) -keyint_min $FPS \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "$out"
echo built $out
