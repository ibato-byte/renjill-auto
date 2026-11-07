#!/usr/bin/env python3
# 音量をそろえる（全話共通）：python3 norm.py in.wav
# 各SNSの目安 -14 LUFS・ピーク -1.5 dBTP に、2回測って（ffmpeg loudnorm の2パス）そのまま上書きする。
# 旧版は話ごとに -20〜-15 LUFS とばらばらだった（2026-11 実測）。
import json, subprocess, sys, os, re
src = sys.argv[1]; tmp = src + '.norm.wav'
T = 'I=-14:TP=-1.5:LRA=11'
r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', src, '-af', f'loudnorm={T}:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
af = f"loudnorm={T}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', af, '-ar', '48000', tmp], check=True)
os.replace(tmp, src)
print('norm', src, 'from', m['input_i'], 'LUFS')
