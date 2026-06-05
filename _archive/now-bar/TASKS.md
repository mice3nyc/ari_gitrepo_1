---
tags:
  - 개발
  - now-bar
  - TASKS
created: 2026-06-02
author: 아리공
---
## Now Bar — 진행 작업 (live)

> 에이전트가 이것 + SPEC.md만 보고 작업 가능해야 한다. 완료 즉시 체크.

### Phase 0 — 설계 (선문후코)
- [x] 데이터 포맷·재사용 로직 검증 (hop_logger.sh, JSONL, getHopDuration 등)
- [x] 핵심 뷰 결정 (현재 시각 + 오늘 누적, 별도 창)
- [x] SPEC v1 작성
- [x] 피터공 SPEC 확인 → 코드 진입 승인 ("가자" 6/2)

### Phase 1 — v1 빌드
- [x] HBIOS-SYS CDN 경로 확정 (`hbios-sys@latest/hbios-sys.css`)
- [x] `index.html` 단일 파일 — 시각 tick(1s) + 오늘 누적(getHopDuration 이식) + 지금 무엇(현재 프로젝트·머문 시간·최근 파일1) + idle 신호
- [x] 로그 fetch(15s 폴링, 오늘 날짜 파일, 캐시 무력화) + actor=피터공 필터
- [x] 디자인: 흰 배경·검정 모노 HBIOS-SYS·점선 프레임
- [x] 빈 로그/이른 아침 깨짐 방지(시각 항상, 누적/현재 `—`)
- [x] `start_server.sh` (포트 8788, Chrome app 슬림 창, logs 심링크 공유)

### Phase 1 — 검증 (SPEC 검증 기준 5개)
- [x] 시각 1초 tick 정확 (headless 스크린샷 확인)
- [~] 오늘 누적 = 기존 Hop Bar dur와 동일 — 같은 로직 이식. now-bar 2h 40m, Hop Bar 창과 나란히 육안 대조 권장
- [x] 빈 로그 안 깨짐 (null → `—` 분기)
- [x] 15s 폴링이 새 hop 반영 (서버 로그상 폴링 동작 확인)
- [x] 한글 표시 정상 (요일·프로젝트명·"분째" 렌더 확인)

### 검증 중 발견 → 처리
- [x] now-bar 작업이 hop 로그에서 "기타"로 분류됨 → `hop_logger.sh` detect_project에 `*now-bar*` 추가, ToolDev로 잡히게 패치

### Phase 2 — v2 활동 피드 전환 (피터공 피드백 "v1은 그냥 시계, 실패")
- [x] SPEC v2 전환 기록 (활동 주인공 / 카테고리 금지 / 가로 리스트)
- [x] index.html 재작성 — 머리글(시각·누적 작게) + 활동 피드(최신순 누적)
- [x] 행동 한 줄 가공 — tool→동사(읽기·편집·작성·실행…) + 실제 대상(파일명/명령 요지)
- [x] actor 결 구분 — 피터공 진하게 / 아리공 옅게(필터 아님)
- [x] headless 스크린샷 검증 통과
- [ ] 피터공 육안 피드백 → 조정(표시 개수·Bash 노이즈·동사색·아리공 노출 여부)

### Phase 3 — v3 작업 내러티브 전환 (피터공 "기능 나열은 무슨 작업인지 모른다 / 시스템 폰트로")
- [x] SPEC v3 전환 기록 (데이터=아리공 작업 내러티브, hop 로그 폐기)
- [x] `now_status.jsonl` 신설 + 오늘 작업 seed 4줄
- [x] index.html 재작성 — 머리글(시각 작게) + 지금 하는 일(큰 headline+detail+경과) + 그 전까지(흐름)
- [x] 시스템 폰트 전환 (HBIOS 도스 폰트 폐기, Apple SD Gothic Neo 계열)
- [x] headless 검증 통과 — 한글 또렷, 내러티브 읽힘
- [ ] 피터공 육안 피드백
- [ ] **운영 규칙 정착**: 아리공이 작업 전환마다 now_status.jsonl append (지금은 수동)

### Phase 4 — 메뉴바판 (SwiftBar)
- [x] `swiftbar-plugins/nowbar.5s.sh` — now_status.jsonl 읽어 메뉴바 한 줄 + 드롭다운
- [x] 메뉴바 = 짧은 라벨(`short`) + 트리거시각 + 누적(현재시각 없음, 피터공 요구)
- [x] status에 `short` 필드 추가(메뉴바용 짧은 이름, 브라우저는 full headline)
- [x] 스크립트 출력 검증 (`▸ Now Bar 메뉴바판  11:06·26m`)
- [ ] 피터공: `brew install --cask swiftbar` + 플러그인 폴더 지정 → 메뉴바 표시 확인

### 후속 후보
- [ ] status append 자동화 (hook / 습관 정착 / 메모리화)
- [ ] app 슬림 창 안정화 / raw hop 로그 보조 줄(옵션)
