#!/bin/bash
# wav2m4a.sh — WAV to M4A (AAC 256kbps) converter
# Usage: wav2m4a.sh file.wav or wav2m4a.sh *.wav

if ! which ffmpeg > /dev/null 2>&1; then
  echo "ffmpeg이 설치되어 있지 않습니다."
  echo "설치: brew install ffmpeg"
  exit 1
fi

if [ $# -eq 0 ]; then
  echo "Usage: wav2m4a.sh <file.wav> [file2.wav ...]"
  exit 1
fi

for wav in "$@"; do
  if [ ! -f "$wav" ]; then
    echo "[SKIP] 파일 없음: $wav"
    continue
  fi

  m4a="${wav%.wav}.m4a"

  if [ -f "$m4a" ]; then
    echo "[SKIP] 이미 존재: $m4a"
    continue
  fi

  echo "[변환] $wav → $m4a"
  ffmpeg -i "$wav" -c:a aac -b:a 256k -movflags +faststart -n "$m4a" 2>/dev/null

  if [ $? -eq 0 ] && [ -f "$m4a" ]; then
    wav_size=$(stat -f "%z" "$wav")
    m4a_size=$(stat -f "%z" "$m4a")
    ratio=$(echo "scale=1; $m4a_size * 100 / $wav_size" | bc)
    echo "[완료] WAV: $(echo "scale=1; $wav_size/1048576" | bc)MB → M4A: $(echo "scale=1; $m4a_size/1048576" | bc)MB (${ratio}%)"
  else
    echo "[실패] 변환 오류: $wav"
  fi
done
