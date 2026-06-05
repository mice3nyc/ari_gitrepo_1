#!/bin/bash
# whisperx_stt.sh — 음성 파일 → 텍스트 변환 (화자 분리 포함)
# Usage: whisperx_stt.sh file.m4a or whisperx_stt.sh *.wav

VENV="$HOME/whisperx_env"
HF_TOKEN=$(grep HF_TOKEN "$HOME/Neo-Obsi-Sync/.env" 2>/dev/null | cut -d= -f2)

if [ ! -d "$VENV" ]; then
  echo "whisperx 가상환경이 없습니다: $VENV"
  exit 1
fi

source "$VENV/bin/activate"

if [ $# -eq 0 ]; then
  echo "Usage: whisperx_stt.sh <audio_file> [file2 ...]"
  exit 1
fi

for audio in "$@"; do
  if [ ! -f "$audio" ]; then
    echo "[SKIP] 파일 없음: $audio"
    continue
  fi

  base="${audio%.*}"
  txt="${base}_stt.txt"

  echo "[변환] $audio → 텍스트"

  DIARIZE_FLAGS=""
  if [ -n "$HF_TOKEN" ]; then
    DIARIZE_FLAGS="--diarize --hf_token $HF_TOKEN"
  fi

  whisperx "$audio" --language ko --model large-v3 $DIARIZE_FLAGS --output_dir "$(dirname "$audio")" --output_format txt 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "[완료] 텍스트 저장됨"
  else
    echo "[실패] 변환 오류: $audio"
  fi
done
