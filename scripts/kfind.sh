#!/bin/bash
# kfind — 한글 NFD 안전한 파일 검색
# macOS가 한글 파일명을 NFD로 저장하기 때문에 find -name이 실패하는 문제를 해결
#
# 사용법:
#   kfind "패턴" [검색경로]
#   kfind "*모듈로*"                    # 현재 디렉토리에서
#   kfind "*0415*베를린*" /path/to/dir  # 특정 경로에서
#   kfind "*.txt" /path/to/dir          # 확장자 검색도 가능

python3 -c "
import os, unicodedata, sys, fnmatch

if len(sys.argv) < 2:
    print('사용법: kfind \"패턴\" [검색경로]')
    sys.exit(1)

pattern = sys.argv[1]
root = sys.argv[2] if len(sys.argv) > 2 else '.'
nfd_pattern = unicodedata.normalize('NFD', pattern)

for dirpath, dirs, files in os.walk(root):
    for f in files:
        nfd_f = unicodedata.normalize('NFD', f)
        if fnmatch.fnmatch(nfd_f, nfd_pattern):
            print(os.path.join(dirpath, f))
" "$@"
