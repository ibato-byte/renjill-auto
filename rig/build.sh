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
ffmpeg -y -loglevel error -framerate 24 -i $R/out/$e/f%04d.jpg -i $R/out/$e/audio.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 192k -shortest -movflags +faststart "$out"
echo built $out
