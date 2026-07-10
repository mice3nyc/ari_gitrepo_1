# TASKS — TM (TerminalMonitor)

## 현재 단계: v0 코어 (헬퍼 + 플러그인)

- [x] `tm.sh` — register/log/set/note/unregister/render/slot/flush (전 명령 JSON 정합 테스트 통과)
- [x] `swiftbar-plugins/tm-bar.3s.sh` — 로테이션 + 핀 + 서브메뉴 로그 (SwiftBar 문법 출력 검증)
- [x] 심볼릭 링크로 SwiftBar PluginDirectory에 로드 + refreshallplugins
- [ ] 메뉴바 실동작 확인 (피터공) — ⚠️ 풀스크린 스페이스라 아리공 자가 캡처 불가. SwiftBar가 심링크를 따라가는지 여기서 판명(안 뜨면 실파일 복사로 폴백)

## 완료 (26.0705)

- [x] 노치 대응: 로테이션 텍스트 제거 → 아이콘(`TermMo N`)+풀다운. 배포는 실파일 복사(`install.sh`)
- [x] `README.md` — 창/스킬 공용 사용법(단일 진실)
- [x] 스킬 연동: goodmorning 2.7단계(창 등록) · recall 3.5단계(창 등록) · goodbye 4.8단계(unregister+flush+TM_log 통합)
- [x] CLAUDE.md 즉시 처리 규칙에 "작업 전환 → TM 상태 갱신" 행동 룰

## v0.4 — 색 상태 빨강/초록 (26.0709, Q2 구현) — SPEC §9

- [x] Q2-a: `tm.sh` `state`/`whoami-term`/`term` 명령 + `register` term_session 자동 캡처 (문법·정합·매핑 자가검증 통과)
- [x] Q2-b: register 자동 캡처라 스킬 편집 불요 — 기존 `register <ID> <UUID>`가 env에서 term_session 자동 저장. (recall/goodmorning 무변경)
- [x] Q2-c: 훅 배선 — `tm-hook.sh` 디스패처 + settings.local.json `Stop`(done)·`Notification`(attention)·`UserPromptSubmit`(working), async·timeout 5. PostToolUse 보존. 백업 `.bak.260709`
- [x] Q2-d: swiftbar 색 매핑 — per-window 우선순위(attention 빨강 > done 초록 > 최근 파랑 > 대기 회색) + 메뉴바 집계색(`! ` 빨강 / `✓` 초록) + 🔴🟢 마커. install.sh 재배포
- [x] Q2-e 자가검증: 훅 3종 end-to-end 시뮬(stdin JSON 흘리고 done/attention/working) → 배포 플러그인 출력 색 확인 (done=#2e9e44 ✓ / attention=#e5484d ! / working=해제)
- [ ] **피터공 라이브 확인**: 이 창(A) — 내 턴 끝나면 메뉴바 🟢, 메시지 보내면 해제, 권한 프롬프트 뜨면 🔴. ⚠️ **이미 떠 있는 세션이 새 훅을 리로드하는지**가 유일한 미검증점(프로브는 재시작 불요라 했음)
- [ ] B·C 창: 각 창에서 recall 재실행(또는 `tm.sh term <ID>`)로 term_session 캡처해야 그 창 훅도 매핑됨
- [ ] `hook-probe.sh`/`hook-probe.log` 정리(진단용, 목적 달성)

## v0.5 — 승인 복귀(빨강 자동 해제) (26.0709) — SPEC §9 "승인 복귀"

문제(피터공 발견): 창이 권한 프롬프트로 빨강이 됐다가 YES(승인)로 작업이 이어져도 빨강이 안 풀림. 원인=attention을 끄는 트리거가 UserPromptSubmit·Stop뿐이라 "승인·계속" 전이가 배선 누락(스펙엔 있었음).
- [x] SPEC §9 갱신 — working 트리거에 PostToolUse(빨강일 때만) 추가 + "승인 복귀" 문단
- [x] `tm-hook.sh` `resume` 모드 — whoami-term 매핑 후 현재 state가 attention일 때만 `state working`, 그 외 no-op(매 툴콜 파일 쓰기 방지, §6 안전선)
- [x] settings.local.json `PostToolUse`에 `tm-hook.sh resume` 블록 추가(기존 context-hop 로거와 공존, async·timeout 5)
- [x] 자가검증: attention→resume→working ✓ / working→resume→working(유지) ✓ / done→resume→done(초록 안 덮음) ✓ / 엉뚱 앵커→no-op ✓ (stdin JSON 파이프로 4케이스 실행)
- [ ] **피터공 라이브 확인**: 권한 프롬프트로 빨강 뜬 뒤 YES → 다음 도구 실행되며 파랑으로 풀리는지. ⚠️ 새 PostToolUse 훅이 **기존 세션에 즉시 반영되는지**가 미검증점(안 되면 창 새로 열거나 세션 재시작 후 확인)

## v0.6 — 창 포커스 클릭 이동 (26.0710) — SPEC §10

- [x] `tm.sh focus <ID>` — Terminal(tty)·iTerm(tty/UUID) osascript로 select+activate (기구현, SPEC §3·§10 반영)
- [x] 플러그인 헤드 라인에 focus 액션 부착 + 중복 서브메뉴 `▸ 이 창으로 가기` 제거 (SwiftBar 헤드 action + 로그 서브메뉴 공존)
- [x] install.sh 재배포 + **피터공 라이브 확인 완료**: 창 텍스트 클릭 → 그 창으로 이동 ✓, 자동화 프롬프트 첫 1회만 뜸 ✓
- [ ] (관찰) install.sh의 `rm 후 cp`가 SwiftBar를 잠깐 놓쳐 플러그인이 사라짐 → 이번엔 `killall SwiftBar` 재시작으로 복구. 재발하면 install.sh에 재시작/재-refresh 보강

## 이전 다음 단계

- [ ] goodbye 실행 시 `TM_log_YYMMDD` 노트 실제 생성 확인(첫 마감 때)
- [ ] settings allowlist에 `tm.sh`·`install.sh` 추가(권한 프롬프트 감소)

## 확정

- 노트명 `TM_log_YYMMDD` · 저장 위치 `_클로드코드노트/` (26.0705 피터공 "그대로")

## 빌드 기록

- `762e6f7` (26.0710) — 창 포커스(focus): tm.sh focus + 플러그인 헤드 클릭 배선 + SPEC §10. push 완료
- `b63d09f` (26.0710) — herdr 검토 노트 커밋(별건)
