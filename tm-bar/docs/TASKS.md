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

## v0.7 — 사본 드리프트 감지 (26.0812) — SPEC § 사본 드리프트 감지

복사 배포라 정본·배포본이 실물로 둘인데, **어긋나도 아무도 모르는 것**이 문제였다. 8/12 `_dev` 미커밋 정리에서 사본 둘을 발견해 열어 둔 항목.

- [x] 배포본이 렌더마다 `cmp -s`로 정본과 대조 → 어긋나면 드롭다운에 빨간 줄 + 양쪽 mtime + 처방 두 줄 + 「차이 보기」
- [x] 어느 쪽이 새것인지 **단정하지 않음** — 두 경로(install.sh 안 돌림 / 배포본 직접 수정)가 정반대 처방을 요구하므로 잘못 단정하면 작업을 지운다
- [x] 검증 **양성·음성 둘 다**: 정본 자기실행 = 경고 0건 / 한 바이트 어긋낸 사본 실행 = 경고 1건. **「0건은 실패」를 통과 조건에 박아 확인** — 안 붉어지는 하니스는 통과해도 아무 말 안 한 것
- [x] `bash -n` 통과 · `install.sh` 배포 후 두 파일 `cmp` 일치 · 배포본 실행 시 경고 0건 · 메뉴바 두 플러그인 실행 폴링 확인(tm-bar·todoy-bar 각 1회 포착)
- ⚠️ 검사는 **배포본에 있어야** 작동한다. 정본만 고친 상태에선 스스로 못 알리므로 첫 배포는 손으로 `install.sh` 한 번

## 확정

- 노트명 `TM_log_YYMMDD` · 저장 위치 `_클로드코드노트/` (26.0705 피터공 "그대로")
- **정본 = `tm-bar/swiftbar-plugins/tm-bar.3s.sh`, 배포본 = SwiftBar PluginDirectory 사본.** 심링크는 SwiftBar가 안 따라가 폐기된 길(26.0705 확인). 중복은 의도된 것이고, v0.7 감지가 그 대가를 갚는다

## 빌드 기록

- `762e6f7` (26.0710) — 창 포커스(focus): tm.sh focus + 플러그인 헤드 클릭 배선 + SPEC §10. push 완료
- `b63d09f` (26.0710) — herdr 검토 노트 커밋(별건)
- (26.0812) — v0.7 사본 드리프트 감지. 정본 5,401 → 6,449 bytes, `install.sh` 배포 후 정본=배포본 일치. 같은 날 `_dev` 두 달 미커밋 정리(13커밋)에서 발견된 항목
