## TASKS — v0.9

**현재 Phase**: Phase 3~6 완료. 커밋 대기.
**마지막 커밋**: (커밋 대기)

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
- [x] 공식형 박스: "위임 할인"/"지식 할인" → "숙련도 할인"/"총 할인"
- [x] 타이틀: v0.8 → v0.9
- [x] 빌드 검증: "위임 판단력" 0건, "도메인 지식" 2건 (코드 주석만, 학생 미노출)

### Phase 6 — 빌드 + UI 피드백 반영

- [x] build.py 빌드 (822,602 bytes)
- [x] UI: 카드 할인 칩 → 에너지 칸 위 가로 표시 ("주체성 적용" 형태)
- [x] UI: 시작 화면 subtitle 22px 키움 + 진행 바 제거
- [x] UI: 선택지 텍스트~비용 점선 사이 마진 축소 (header padding 2px)
- [x] UI: 할인 0일 때도 공식형 박스 통일 표시
- [ ] 미결: 인간중심 카드 → 시간 할인 분리 여부 (피터공 결정 대기)
- [ ] 검증: 5개 시나리오 여러 경로 완주 가능
- [ ] 검증: 카드 할인 적용 화면 인지 가능 (tier2부터)
- [ ] git commit + push
- [ ] GitHub Pages 배포 확인

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
