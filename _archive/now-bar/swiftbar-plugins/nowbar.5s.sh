#!/bin/bash
# <bitbar.title>Now Bar</bitbar.title>
# <bitbar.version>v3</bitbar.version>
# <bitbar.author>아리공</bitbar.author>
# <bitbar.desc>지금 무슨 작업 중인지 + 시작 시각 + 누적 시간을 메뉴바에 한 줄로</bitbar.desc>
# <swiftbar.refreshOnOpen>true</swiftbar.refreshOnOpen>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
# <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>

F="/Users/p.air15/Neo-Obsi-Sync/_dev/now-bar/now_status.jsonl"

exec /usr/bin/python3 - "$F" <<'PY'
import sys, json, datetime
f = sys.argv[1]
try:
    lines = [l for l in open(f, encoding='utf-8') if l.strip()]
except FileNotFoundError:
    print("▸ —"); sys.exit()
if not lines:
    print("▸ 대기 중"); sys.exit()

cur = json.loads(lines[-1])
ts = datetime.datetime.fromisoformat(cur['ts'])
now = datetime.datetime.now()
mins = max(0, int((now - ts).total_seconds() // 60))
el = f"{mins}m" if mins < 60 else f"{mins//60}h{mins%60}m"
start = ts.strftime("%H:%M")
head = cur['headline']
short = cur.get('short') or (head if len(head) <= 18 else head[:17] + "…")

# 메뉴바 한 줄: ▸ 짧은작업명  시작시각·누적
print(f"▸ {short}  {start}·{el}")
print("---")
# 드롭다운: 지금 하는 일 전체
print(f"{head} | size=14")
if cur.get('detail'):
    print(f"{cur['detail']} | size=12 color=gray")
print(f"시작 {start} · {el}째 | size=12 color=#1100ff")
print("---")
print("그 전까지 | size=11 color=gray")
for l in reversed(lines[:-1]):
    s = json.loads(l)
    t = datetime.datetime.fromisoformat(s['ts']).strftime("%H:%M")
    print(f"{t}  {s['headline']} | size=12 color=gray")
print("---")
print("브라우저 창 열기 | href=http://localhost:8788")
print("새로고침 | refresh=true")
PY
