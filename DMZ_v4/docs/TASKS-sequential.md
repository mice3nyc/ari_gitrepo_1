---
created: 2026-04-30
tags:
  - DMZ
  - 통일부
  - 개발
  - 진행작업
author: 아리공
---
### DMZ v4 순차 unlock 진행 작업

> 세 번째 빌드(`sequential/`) 신설. 4/30 플테 후 새 게임 디자인 — 자료 순차 잠금 + 정답 자료 라벨 강조. mobile/offline과 병렬. 의도/설계는 [[PLAN|v4 PLAN]] / 메카닉 명세는 `_dev/DMZ_v4/docs/SPEC-sequential.md`

---

#### Phase 1 — 베이스 + 데이터 매핑 ✅

- [x] `shared/index_sequential.html` — mobile/index.html을 fork (OFFLINE_MODE 변수, isOfflineUnlocked, .bd-hidden CSS 흔적 전부 제거)
- [x] LS prefix → `dmz_v4_s_` (state, tutorial 키)
- [x] `BLANK_SOURCE_LOOKUP` 자동 생성 — `dmz_blanks.csv` `answer_from` 컬럼 파싱 → JSON. 71개 매핑 주입
- [x] `scripts/build_sequential.sh` 신설 — placeholder 교체 + photos sync + JS syntax 검증

#### Phase 2 — 메카닉 적용 ✅

- [x] `isSourceUnlocked(storyId, sourceId)` — A는 항상 unlock + 이전 자료 모든 빈칸 풀이 시 unlock + 빈칸 0개 자료 재귀 통과
- [x] 자료 카드 렌더 — `.locked` 클래스 + "잠김" 라벨 + 🔒 아이콘
- [x] `openSource()` 잠금 진입 차단 (`isSourceUnlocked` false면 return)
- [x] 빈칸 풀이 시 다음 자료 unlock 체크 — `submitAnswer` 후 `setTimeout(openSource)` + closeSource 시 `renderExploration()` 호출
- [x] 빈칸 모달 정답 자료 라벨 — `modal-source-hint` 노란 박스 + `source-label-highlight` 빨간 볼드(`#c0392b`)
- [x] CSS — `.source-card.locked`(opacity 0.45 + grayscale 0.85 + pointer-events none), `.modal-source-hint`, `.source-label-highlight`

#### Phase 3 — 빌드 + 검증

- [x] `sequential/index.html` 빌드 — 169,437 bytes (메카닉 + unlock 효과 추가본)
- [x] JS syntax 검증 통과
- [x] file:// 시각 검증 — 자료 잠금/unlock 흐름 + 정답 라벨 + 큰 정답 팝업 + 카드 깜빡 OK (피터공 컨펌)
- [x] 한 스토리 완주 테스트 (s0101: 판문점/해리슨 2세/남일/4)

##### unlock UX 추가 (4/30 피터공 요청)

- [x] 정답 시 화면 중앙 큰 정답 팝업 (.answer-celebration) — 흰 박스 + 초록 굵은 테두리 + 2.6rem 글씨, 1.5초 표시 후 자료 detail 재진입
- [x] 빈칸 슬롯 정답 강조 — `.blank-slot.just-solved` 초록 펑 (scale 1.25 + glow ring), 1.4초
- [x] 자료 카드 unlock 깜빡 — `.source-card.just-unlocked` 초록 0.55s × 3회 + status "🔓 NEW"
- [x] 깜빡 정책 — 스토리당 자료별 1회만 (`state.flashedSources` 추적). 재진입 시 노이즈 없음

#### Phase 4 — push + 배포 ✅

- [x] git commit `ac3710d` + push (52 files, +5,452 lines)
- [x] GitHub Pages 배포 트리거 — `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/sequential/`
- [x] 내부 공유용 한 줄 메시지 작성 (세션 응답)

#### Phase 5 — 힌트 텍스트 자료 라벨 구체화 ✅ (4/30 추가)

- [x] 자료 라벨 형식 변경: `자료 X — "유형"` → `자료 X: 유형 [실제 제목]`
- [x] 출처: `Assets/incoming/통일부/주제1_스토리별_자료목록.txt` (s0101~s0106 × 4 = 24개)
- [x] `shared/index_sequential.html` source 객체에 `docTitle` 필드 신설 (24개 매핑)
- [x] modal-source-hint 렌더링 분기 — `docTitle` 있으면 `자료 X: 유형 [docTitle]`, 없으면 `자료 X: 유형` (s0107~s0306 fallback)
- [x] sequential/index.html 빌드 → 170,927 bytes, mappings 71, JS syntax OK
- [x] 시각 검증 — 피터공 컨펌 (모달 노란 박스 새 텍스트 OK)
- [x] git push — commit `ea7bebf` (2 files, +54/-50)

---

#### 현재 위치

**4/30 시점**: 문서 작성 진입. 코드 작업 대기.

**다음 한 동작**: shared/index_sequential.html fork → BLANK_SOURCE_LOOKUP 생성 → 메카닉 적용

#### 차단 / 대기

- 콘텐츠 매핑 검증 — `dmz_blanks.csv`에 모든 빈칸이 in_source 매핑되어 있는지 (누락 시 라벨 표시 안 됨)
- 자료 정렬 순서 — 'A','B','C','D' 외에 다른 ID가 있는지 확인 필요 (현재 없을 것으로 추정)

#### 메모

- 빌드 산출 후 mobile/offline은 그대로 유지. 세 빌드 병렬
- offline 빌드는 플테 결과에 따라 향후 폐기 가능성 있음 — 일단 보존
