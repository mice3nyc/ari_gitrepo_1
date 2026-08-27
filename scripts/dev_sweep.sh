#!/bin/bash
# 볼트에서 뜬 개발 프로세스를 훑고, 원하면 끈다. (2026-08-27 신설)
#
# ★왜 있는가 — 피터공 8/27: *"프로그램 종료했는데 뭔가 계속 돌고 있는게 3개 이상이었어 오늘"*
#   그날 실제로 넷이 남아 있었다:
#     ① `node -c ""`  — stdin을 읽어 영원히 멈춘 명령. **Bash 툴이 2분 타임아웃으로 끊겨도
#        프로세스는 살아 있었다.** 툴이 「끊겼다」고 말한 것과 「죽었다」는 다른 사실이다
#     ② 그 명령의 부모 zsh — 하네스가 「1 shell still running」으로 세던 것
#     ③ `npx vite preview` 셋 — 검사 러너가 npx만 죽여 손자가 남았다(그날 고침)
#     ④ `npm run daemon` — 일기앱 데몬. 낮에 원천이 AWS로 옮겨 **이미 필요 없어진 것**
#
# ⚠️★남은 서버는 위생 문제가 아니라 **정확성 문제**다. 다음 검사가 「누군가 예전에
#    띄워 놓은」 프리뷰에 붙어 **옛 빌드를 보고 통과한다**(그날 `verify:legal`이 그랬다).
#
# 사용:
#   dev_sweep.sh          훑기만 (아무것도 안 죽인다)
#   dev_sweep.sh --kill   전부 종료
set -u
VAULT=/Users/p.air15/Neo-Obsi-Sync
MODE="${1:-list}"

# 이름으로 무는 것 — 볼트 밖에서 떠도 개발용이면 잡는다
PAT='vite|npm (run|exec)|node .*(_dev|_devhaus)|node --experimental-strip-types|node -c|mock-display|http\.server'

found=$(ps -axo pid,etime,command \
  | grep -iE "$PAT" \
  | grep -v grep \
  | grep -viE 'Visual Studio Code|Cursor|Code Helper|claude' \
  | grep -v "dev_sweep")

if [ -z "$found" ]; then
  echo "볼트발 개발 프로세스 0개 ✓"
  exit 0
fi

echo "$found" | sed 's/^/  /'
n=$(echo "$found" | grep -c .)

if [ "$MODE" != "--kill" ]; then
  echo "── ${n}개. 끄려면: dev_sweep.sh --kill"
  exit 1
fi

# ⚠️ 그룹째 죽인다 — `npx`만 죽이면 실제로 포트를 쥔 손자가 남는다(8/27 실측)
for p in $(echo "$found" | awk '{print $1}'); do
  kill -9 -"$p" 2>/dev/null || kill -9 "$p" 2>/dev/null
done
sleep 1

left=$(ps -axo pid,command | grep -iE "$PAT" | grep -v grep \
  | grep -viE 'Visual Studio Code|Cursor|Code Helper|claude' | grep -v dev_sweep)
if [ -z "$left" ]; then
  echo "── ${n}개 종료 ✓ (남은 것 0)"
else
  # ★확인은 「죽였다」가 아니라 ps로 한다
  echo "── ${n}개 종료 시도했으나 남음:"
  echo "$left" | sed 's/^/  /'
  exit 2
fi
