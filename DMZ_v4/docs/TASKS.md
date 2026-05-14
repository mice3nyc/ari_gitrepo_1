---
created: 2026-04-29
tags:
  - DMZ
  - 통일부
  - 개발
  - 진행작업
author: 아리공
---
### DMZ v4 진행 작업

> 체크리스트 + 단계. 매 작업 완료 시 즉시 [x]. 세션 복귀 시 이 노트 먼저 읽기. 의도/설계는 [[PLAN|v4 PLAN]]

---

#### Phase 1 — 환경 세팅

- [x] `_dev/DMZ_v4/` 폴더 트리 생성 (shared/photos/cat01~06, resized, docs, mobile, offline)
- [x] **백도 완료**: photos 영문화 47개 + 정예공 빌드 카피 + src 패치 21곳 + photos_manifest.csv 47행. 검증 통과(broken 0, 한글 src 잔여 0)
- [x] 백도 결과 검증 — incoming resized/ 6개 중 코드 참조 2개만 카피 OK. 잔여 4개(`01_panmunjom_1953`, `03_school_sign`, `04_village_2022`, `05_cheorwon`)는 v3 시절 잔존, 코드 미참조 → 무시 결정
- [ ] incoming 한글 미러 폴더 처리 — 별도 confirm 후 (이번 백도 범위 밖)
- [x] `_setup_dmz_v4.py` `scripts/`로 이동 — 4/29 Phase 4에서 정리

#### Phase 2 — 개발 문서

- [x] `_dev/DMZ_v4/docs/SPEC.md` — 새 빌드 베이스 + AC/BD 분기 명세 + unlock UX
- [x] `_dev/DMZ_v4/docs/ARCHITECTURE.md` — 화면 흐름 mermaid (offline 모드 분기 추가)
- [x] `_dev/DMZ_v4/docs/UI-MAP.md` — 화면/요소 이름 + offline 신규 컴포넌트(`.bd-locked-card`, `.bd-unlock-transition`)
- [x] `_dev/DMZ_v4/docs/DATA-SPEC.md` — 영문화 photos 네이밍 + STORIES 구조 + AC/BD 자료 분류
- [x] `_dev/DMZ_v4/docs/BUILD-VARIANTS.md` ★ — 두 빌드 차이 + fork 지점 + GitHub Pages 분기 + 토글 키
- [x] `_dev/DMZ_v4/docs/HANDOFF.md` — 아리공↔아리온 인수인계
- [x] `_dev/DMZ_v4/docs/CODE-FORK-POINTS.md` — 코드 라인별 6개 분기 정찰 (renderSource/submitAnswer/localStorage/normalizeAnswer/altAnswers/디바이스)
- [x] `_dev/DMZ_v4/README.md` — 두 빌드 URL + 사용처 + 변경 이력
- [x] `_dev/CLAUDE.md` 갱신 — DMZ_v4 등재, DMZ는 v3.2 레거시 표시, v4.0-prep 변경 이력 추가

#### Phase 1+2 완료 (4/29 16:30경)

- 환경 세팅 + 영문화 + 개발 문서 8종 모두 작성. 코드 작업 진입 준비 완료.
- 다음 진입: Phase 3(베이스 패치) — 피터공 confirm 후 진행

#### Phase 3 — 베이스 패치 (분기 전 공통)

- [x] s0101 D 빈칸 altAnswers 부활 (`사;4km;4킬로미터`) — 4/29 직도, L691
- [x] `normalizeAnswer` 부활 — 4/29 직도, L2233 위에 함수 추가 + L2239 비교 로직 교체. 공백/괄호/대소문자 무시
- [x] cat02 `2-6_` 번호 충돌 정정 (백도 phase 1에서 처리)
- [x] `dmz_blanks.csv` 전면 갱신 — 4/29 백도 완료. 71행(헤더 제외). 스토리별 빈칸 수 비균질(아래 발견)
- [x] `dmz_choices.csv` 갱신 — 4/29 백도 완료. 72행(헤더 제외)

##### 발견 — 정예공 새 빌드는 스토리별 빈칸 수가 비균질

| 스토리 | 빈칸 수 | 빈칸 ID |
|--------|---------|---------|
| s0102 | 5 | A1, A2, B, C, D |
| s0103 | **3** | A, C, D (**B 없음**) |
| s0105 | 4 | A1, A2, B, D (**C 없음**) |
| s0201 | **2** | C, D만 (**A, B 없음**) |
| s0202 | 5 | A, B, C1, C2, D |
| 나머지 13개 | 4 | A, B, C, D |

- **의도/미완성 판단 필요**: s0103 B / s0105 C / s0201 A·B는 정예공이 의도적으로 비웠는지 미완성인지 미상. 정예공 확인 필요
- A1/A2, C1/C2는 한 자료에 빈칸 2개를 넣는 새 패턴 — v3.2에 없던 구조. 이미 코드에 반영되어 있고 동작함

#### Phase 4 — 두 빌드 fork ✅ (4/29 재작업, 새 명세)

##### ★ 회귀 사고 + 베이스 재구축

- 1차 시도(locked card 명세): OFFLINE_MODE 토글 + LS 키 playerName별 분리 + renderSource 분기 + locked card UI 패치 적용 → mobile에서 **빈칸 자체가 안 보이는 회귀** 발생 (피터공 시각 검증)
- 회귀 원인 추적 미완: diff상 의도된 차이만 보이는데 빈칸 안 보임. JS syntax는 통과. 추정만 가능 (loadPlayerState로 부팅 자동 로드 제거 변경이 어딘가 깨뜨렸을 가능성)
- 회귀 원인 깊이 파지 않고 **정예공 원본으로 다시 깔기 + 새 명세로 재패치** 결정 (피터공 제안). 옛 패치 베이스 → `shared/index_base.OLD-PATCHED.html`에 백업 보존
- 새 명세: locked card(통째 가림 + 안내 카드) 폐기 → **BD 본문 흰색(transparent) wrapper** 채택. 자료 마크업 그대로 두고 본문 텍스트만 안 보이게, 헤딩+빈칸 슬롯은 보임

##### 적용 패치 (정예공 원본 베이스 위)

- [x] **src 영문화 sed 23건** — `photos_manifest.csv` 매핑 기반 Python으로 원본 한글 src → 영문 src. 한글 src 잔여 0
- [x] **s0101 D altAnswers** — `['사', '4km', '4킬로미터']`
- [x] **normalizeAnswer 부활** — 함수 정의 + submitAnswer 비교 로직 교체 (공백/괄호/대소문자 무시)
- [x] **OFFLINE_MODE 토글** — `const OFFLINE_MODE = false` (L495). LS prefix 단순화: `LS_PREFIX = OFFLINE_MODE ? 'dmz_v4_o_' : 'dmz_v4_m_'` + `LS_STATE_KEY` `LS_TUTORIAL_KEY` `LS_OFFLINE_UNLOCKS_KEY` 상수. **playerName별 분리는 보류** (회귀 원인 가능성 있어서 단순화)
- [x] **옛 LS 키 6곳 교체** — `dmz_diary_v2` → `LS_STATE_KEY`, `dmz_diary_tutorial_done` → `LS_TUTORIAL_KEY` (Python 일괄)
- [x] **CSS — bd-hidden 패치**: `.bd-hidden { color: transparent !important }` + `.bd-hidden .src-heading * { color: var(--fg) !important }` + 빈칸 슬롯 명시 색 보존 + `img { opacity: 0.15 }` + `::before` 노란 안내박스 ("📄 현장의 출력물에서 본문을 확인하세요")
- [x] **15개 헤딩에 `src-heading` 클래스 주입** — Python 일괄. letter-meta/diary-meta/scholar-meta/news-header/oral-meta/oral-icon/tweet-header/chat-name/blog-title/blog-meta/report-header/hw-title/hw-meta/qna-label(×2)
- [x] **openSource BD wrapper 토글** — `isOfflineUnlocked(storyId, sourceId)` 헬퍼 추가. detail에 `bd-hidden` 클래스 add/remove. OFFLINE+B/D+미unlock = bd-hidden ON
- [x] **submitAnswer unlock 처리** — 정답 통과 후 OFFLINE+sourceId(B/D)면 `LS_OFFLINE_UNLOCKS_KEY`에 `{storyId: [B/D]}` push. 기존 setTimeout openSource가 자동으로 bd-hidden 클래스 제거하며 본문 노출

##### 빌드 산출

- [x] **mobile/index.html** — 163,417 bytes. OFFLINE_MODE=false
- [x] **offline/index.html** — 163,416 bytes. sed로 OFFLINE_MODE=true (1 byte 차이)
- [x] **JS syntax 검증** — `node -e new Function(...)` 통과
- [ ] **브라우저 시각 검증** — file:// 두 빌드 열어 mobile 빈칸 정상(회귀 통과) + offline BD 흰색+노란안내+빈칸 슬롯+unlock 흐름 확인 — **피터공 확인 대기**
- [ ] **GitHub Pages 배포** — git commit + push → Phase 5

##### Phase 4 설계 결정 + 메모 (새 명세 기준)

- **BD 가림 방식**: 자료 마크업 그대로 + `.bd-hidden` 컨테이너 클래스. 본문 `color: transparent`로 안 보이게. 헤딩에 `src-heading` 클래스 + CSS로 색 복원. blank-slot은 명시적 색으로 위치 표시. 이미지 opacity 0.15
- **헤딩 보존 규칙**: 본문성 텍스트(news-title=헤드라인, photo-caption, photo-source)는 가림 대상. meta/header/title/name 등 스키마성 텍스트만 src-heading 클래스로 보존
- **unlock 트리거**: "빈칸 위치 source(`solvedId.charAt(0)`)가 B/D면 unlock". 동일 정책 유지
- **BD에 빈칸 없는 스토리**: 영원히 잠금 (예: s0103 B). 정예공 콘텐츠 보강 시 점검
- **photos 카피 방식**: GitHub Pages 심볼릭 링크 미지원 → `cp -R` 양쪽 폴더에 photos 카피
- **백업**: `shared/index_base.OLD-PATCHED.html` 회귀 발생한 옛 베이스 보존 (회귀 원인 사후 추적용)

#### Phase 5 — 배포 + 테스트

- [ ] git commit (Air에서) + push → GitHub Pages 자동 배포
- [ ] URL 확인:
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/mobile/`
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/offline/`
- [ ] 브라우저 테스트 (file:// + http:// 양쪽)
- [ ] 한글 파일명 영문화 후 NFC/NFD 이슈 사라졌는지 확인
- [ ] 모바일 디바이스 테스트 (iOS/Android 실기)
- [ ] 데스크탑 풀스크린 테스트 (공간 설치물 가정)
- [ ] 인턴 베타(5/26) 1주 전 = 5/19 사전 점검
- [ ] 피스트레인(6/12) 1주 전 = 6/05 사전 점검 + 출력물 인쇄 시안 동기

#### Phase 6 — 콘텐츠 통합 (정예공 납품 도착 시)

- [ ] cat05 갈등과협력 (4/21 약속: 이번 주) → shared/index_base.html STORIES.cat05 채우기
- [ ] cat06 평화관광 (4/21 약속: 다음 주) → shared/index_base.html STORIES.cat06 채우기
- [ ] cat04 DMZ의 사람들 (대성동 등) → STORIES.cat04 채우기 (일정 확인 필요)
- [ ] 통합 후 mobile/, offline/ rebuild

---

#### 현재 위치 (자세히)

**4/29 15:55 시점**: 환경 세팅 진입. 백도 launch 직후. 백도 결과 받으면 Phase 2 진입.

**다음 한 동작**: 백도 완료 알림 → grep/ls 검증 → 개발 문서 7개 작성 진입

#### 차단 / 대기

- 피터공 confirm 대기: 영문화 단순 형식이 `{cat}-{N}.{ext}`로 OK인지 (백도 완료 후 결과 보고 시점에 확인)
- 정예공 cat04~06 콘텐츠 도착 일정 (Phase 6 의존)
- 공간 출력물 디자인(수영공) 일정 (offline 빌드 출력물과 동기 필요)
