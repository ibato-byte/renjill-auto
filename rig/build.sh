#!/bin/bash
# 使い方: ./build.sh ep名 出力パス（mp4） [noend]
set -e
R=$(dirname "$0"); e=$1; out=$2
python3 $R/sfx.py $R/out/$e/meta.json $R/out/$e/sfx.wav >/dev/null
dur=$(python3 -c "import json;print(json.load(open('$R/out/$e/meta.json'))['dur'])")
holds=$(python3 -c "import json;print(json.load(open('$R/out/$e/meta.json')).get('bgmHolds') or '')")
python3 $R/bgm2.py $R/out/$e/bgm.wav $dur "$holds" >/dev/null
ffmpeg -y -loglevel error -i $R/out/$e/sfx.wav -i $R/out/$e/bgm.wav -filter_complex "[1:a]volume=0.32[b];[0:a][b]amix=inputs=2:duration=first:normalize=0[a]" -map "[a]" $R/out/$e/audio.wav
ffmpeg -y -loglevel error -framerate 24 -i $R/out/$e/f%04d.jpg -i $R/out/$e/audio.wav -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium -c:a aac -b:a 160k -shortest -movflags +faststart "$out"
echo built $out
