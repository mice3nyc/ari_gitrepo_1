## TASKS — v0.9

**현재 Phase**: Phase 9 — XP score 기반 전환 + 카드 할인 쿠폰 UX
**마지막 커밋**: 108266d (5/9, 디버그 패널 수정)
**롤백 태그**: `v0.9-before-xp-coupon`

---

### Phase 1 — SPEC 세팅 + 데이터 준비 ✅

- [x] v09 폴더 생성 + v08 코드/데이터 복사
- [x] SPEC §0 v0.9 변경 요약 작성
- [x] SPEC §19 자원 체계 v20 전환
- [x] SPEC §20 할인 이중 구조
- [x] SPEC §21 피드백 2레이어
- [x] SPEC §22 용어 교체
- [x] PLAN.md 작성
- [x] TASKS.md 작성
- [x] v20 CSV → yaml 마이그레이션 스크립트 작성 (`data/migrate_v20.py`)
- [x] 마이그레이션 실행 + scenarios.yaml 갱신 (5시나리오 × 27leaf = 135행 완료)
- [ ] texts.yaml 용어 교체 (판단하는 힘 / 아는것의 힘) → Phase 5
- [x] v21 핸드오프 수신 + 카드 할인 태그 데이터 마이그레이션 (`data/migrate_v21.py`)

### Phase 2 — 자원 체계 전환 ✅

- [x] `index.html.template` — 시간 시작값 120, 에너지 시작값 70
- [x] 시나리오 종료 후 에너지 고정 +18 회복 (등급별 차등 제거)
- [x] 1차 선택 비용 — v20 costs CSV에서 전 시나리오 time:1/energy:1 확인 (데이터 반영)
- [x] v0.8 회복 관련 CONFIG 변경 (recoverBase→0, gradeBonus→0, energyRecoverFlat:18 신설)
- [x] meterMaxByLevel 전 레벨 120/70 통일
- [x] HTML 초기 표시값 120/70 교체
- [x] RP 분배 화면(showRPDistributionModal) 제거
- [x] 에너지 회복 게이지 애니메이션 신설 (showEnergyRecoverAnimation — 바 상승 + 숫자 팝)
- [x] 레벨업 모달 수정 (RP 분배 없이 에너지 자동 충전 + 팝업 표시)
- [x] storageKey v09로 분리 (v08 세이브 데이터 오염 방지)
- [x] GitHub Pages 배포 + 브라우저 검증 완료

### Phase 2b — 버그 수정 ✅

- [x] 도전력 첫 플레이 오지급: startScenario에서 replay[scid] 미리 생성 → 결과 화면에서 리플레이 오판정
- [x] 수정: played 플래그 기반 판정 (wasReplay 변수로 완료 전 상태 저장)
- [x] 덱스 12-ari-challenge-card-bug.md 권장안 적용 (wasReplay + challengeAwardedNow 3분기 구조)
- [x] 카드 애니메이션 도전력 표시도 challengeAwardedNow 사용으로 교체

### Phase 3 — 할인 이중 구조 ✅

- [x] v21 핸드오프 수신 (28파일 — 콘텐츠/비용/카드할인태그 CSV + 카드체계 표준안 + 맥락우선 재설계)
- [x] `migrate_v21.py` 작성 + 실행 (135행 finals + tier1/tier2/review labels+desc+lesson + discountTags)
- [x] 축 숙련도 할인 폭 축소 (시간 상한 20%, 에너지 상한 40%+절대 최대 6)
- [x] `_getChoiceDiscountTags(stageType, choiceId)` — 선택지별 할인 태그 조회
- [x] `_calculateCardEnergyDiscount(discountTags)` — 인간중심(-2)/도메인(-2)/강한도메인(-3) 매칭, 최대 -6
- [x] `_applyDiscount` 이중 할인 통합 (축+카드 합산, 양수 할인만 캡, 페널티 통과)
- [x] UI — 공식형 박스에 카드 할인 상세 표시 (`cost-card-discount-line`)
- [x] v21 콘텐츠 변경 반영 (eorinwangja B, career C, studyplan C/C3 텍스트 갱신)
- [x] 빌드 성공 (823,056 bytes)

### Phase 4 — 피드백 2레이어 ✅

- [x] CUT6 결과 화면: `finals.shortFeedback` 우선 사용 (awareness fallback)
- [x] 성장/학기 리포트: `finals.reportFeedback` 우선 사용 (awareness fallback)
- [x] 데이터: v21 마이그레이션에서 shortFeedback/reportFeedback 이미 반영

### Phase 5 — 용어 교체 ✅

- [x] texts.yaml — 리포트 라벨: "위임 판단력" → "판단하는 힘", "도메인 지식" → "아는것의 힘"
- [x] texts.yaml — 4유형 narrative 5종 본문 용어 교체
- [x] HTML stats-bar: "위임 판단력" → "판단하는 힘", "도메인 지식" → "아는것의 힘"
- [x] 시나리오별 도메인 라벨: "도메인 지식" → "아는것의 힘"
- [x] 공식형 박스: "위임 할인"/"지식 할인" → "숙련도 할인"/"총 할인" → "할인"/"할인" (Phase 7에서 통일)
- [x] 타이틀: v0.8 → v0.9
- [x] 빌드 검증: "위임 판단력" 0건, "도메인 지식" 2건 (코드 주석만, 학생 미노출)

### Phase 6 — 빌드 + UI 피드백 반영

- [x] build.py 빌드 (822,602 bytes)
- [x] UI: 카드 할인 칩 → 에너지 칸 위 가로 표시 ("주체성 적용" 형태)
- [x] UI: 시작 화면 subtitle 22px 키움 + 진행 바 제거
- [x] UI: 선택지 텍스트~비용 점선 사이 마진 축소 (header padding 2px)
- [x] UI: 할인 0일 때도 공식형 박스 통일 표시
- [x] git commit + push — 416057f (Phase 3~6 구현분)
- [x] GitHub Pages 배포 확인

### Phase 7 — 피터공 플테 피드백 반영 (세션319, 5/9)

- [x] Cut2(1차 선택) 비용 UI 제거 — 순수 선택, 비용은 Cut3+Review부터 (17f591f)
- [x] 할인 라벨 통일 — "숙련도 할인"/"총 할인" → "할인" (17f591f)
- [x] 비용 색상 반전 — 원가 검정 / 실제 비용 빨강 (17f591f)
- [x] Cut2 선택지 패딩 확대 — nocost 클래스, 상하 12px (a89b8aa)
- [x] 할인 없을 때 단순 표시 — 같은 박스 레이아웃, 비용 라벨+빨강 숫자만. 할인 있을 때만 공식 노출 (3fed956)
- [x] 선택 완료 요약(chosen-summary) 박스 제거 — 테두리+배경 없이 텍스트만 얹히는 형태 (36f8fc6)
- [x] Cut1 타이틀(.highlight)과 선택 완료 제목(.chosen-title) 15px 통일 (36f8fc6)
- [x] SPEC §3.4 갱신
- [x] 자원/역량 패널 레이아웃 변경 — 왼쪽 세로 라벨("자원"/"역량") + 오른쪽 바 콘텐츠, 구분선 포함 (세션320)
- [x] 역량 패널 pending dots → stat-header 인라인 이동 — 라벨과 같은 줄로 올려 높이 절약 (세션320)
- [x] 역량 라벨 볼드화 — color #555→#111, weight 600→700 (세션320)
- [x] Cut4 result-text 박스 제거 — border/background 없이 텍스트만 (세션320)
- [x] SPEC §12.4 갱신
- [ ] 미결: 인간중심 카드 → 시간 할인 분리 여부 (피터공 결정 대기)
- [ ] 검증: 5개 시나리오 여러 경로 완주 가능
- [ ] 검증: 카드 할인 적용 화면 인지 가능 (tier2부터)

### Phase 8 — 선택지 인라인 전개 (세션320, SPEC §23)

- [x] `showTier1Choices()` 신설 — Cut 1 body에 1차 선택지 append
- [x] `showCut2Summary()` 신설 — Cut 2 활성화 (이미지+요약+"더 자세히" 버튼)
- [x] `onTier1()` 수정 — fadeOut → showCut2Summary 호출
- [x] `showTier2Choices()` 신설 — Cut 2 body에 2차 선택지 append
- [x] `showCut3Summary()` 신설 — Cut 3 활성화 (이미지+요약+"결과 확인하기" 버튼)
- [x] `onTier2()` 수정 — fadeOut → showCut3Summary 호출
- [x] `goCut4()` 수정 — "결과 확인하기" 클릭 시 호출, 버튼이 showReviewChoices 호출
- [x] `showReviewChoices()` 신설 — Cut 4 body에 검토 선택지 append
- [x] `showCut5Summary()` 신설 — Cut 5 활성화 (검토 요약)
- [x] `onReview()` 수정 — fadeOut → showCut5Summary + goCut6
- [x] `goCut6()` 수정 — Cut 5 요약 설정 제거
- [x] `continueGame()` 복원 chain 갱신
- [x] `dbgJumpCut()` 디버그 chain 갱신
- [x] 기존 `goCut2()`, `goCut3()`, `goCut5()` 제거
- [x] `fadeOutChoices()` 수정 — fade 후 choices-area DOM 제거 (패널 크기 복원)
- [x] 피터공 플테 확인
- [x] 커밋 + 푸시 (6f07f63)

### Phase 9 — XP score 기반 전환 + 카드 할인 쿠폰 UX (세션321, SPEC §24~§25)

**9a. XP score 기반 전환 (§24)**

- [ ] `calculateExpGain` 수정 — `expRewards[leafPath]` → `finals[leafPath].score * CONFIG.expScoreMultiplier`
- [ ] CONFIG에 `expScoreMultiplier: 0.3` 추가
- [ ] 등급 배율(`gradeMultiplier`) 제거 — score에 이미 등급 반영
- [ ] 시나리오 데이터에서 `expRewards` 맵 전체 삭제 (5시나리오)
- [ ] 빌드 검증: XP 획득량이 이전과 유사한 범위인지 확인

**9b. 카드 할인 쿠폰 UX (§25)**

- [ ] `_applyDiscount` 분리 — 축 숙련도(자동) + 카드 할인(별도 반환, 미적용 상태)
- [ ] `getAvailableCardDiscounts(stageType, choiceId)` 신설 — 적용 가능한 카드 목록 + 각 할인량 반환
- [ ] `showCouponSelect(choiceId, stageType, callback)` 신설 — 쿠폰 선택 UI
- [ ] 쿠폰 UI CSS — 라디오 선택, 카드명+할인량, 확인 버튼
- [ ] `buildCostHTML` 수정 — 할인 가능 시 "할인 가능" 뱃지 표시 (확정 전)
- [ ] `onTier2` 수정 — 적용 가능 카드 있으면 쿠폰 UI 삽입 → 확인 후 비용 차감
- [ ] `onReview` 수정 — 동일
- [ ] 카드 소모 안 함 확인 — 인벤토리에서 제거하지 않음
- [ ] 공식형 박스 — 쿠폰 선택 후 최종 비용 표시 (축 할인 + 선택한 카드 할인 반영)
- [ ] 빌드 + 플테 검증

### 다음 작업 (플테 후)

- [ ] UI: 시간/에너지 미터를 시각적으로 분리 — 두 자원이 다르게 작동하므로 (시간=학기 예산, 에너지=회복 가능) 구분이 필요
- [ ] 레벨 체계: XP/레벨을 역량과 연결 — 현재 랜덤·분리된 XP 대신 역량 성장이 레벨에 반영되어야
- [ ] 미결: 인간중심 카드 → 시간 할인 분리 여부 (피터공 보류)

---

### 볼트 노트 갱신

- [x] 세션 체크리스트 갱신
- [x] DN 오늘의 요청 등록
- [x] 요청 노트 생성 + 갱신
- [x] 세션 로그 (백그라운드)
