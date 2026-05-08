## PLAN — v0.9

**v0.8 베이스**에서 분기. CODEX v20 데이터+설계 패키지 반영.

### 핵심 문제

v0.8까지 "비용 높은 선택 = 좋은 선택"으로 읽히는 구조. 학생이 선택지 내용보다 숫자를 보고 판단하게 되면 핵심 레슨("AI에게 무엇을 맡기고 무엇을 직접 할지")이 사라진다.

### v0.9 목표

> 비용은 선택의 부담을 보여주는 참고 정보이고, 점수는 선택의 의미와 결과 품질을 판정한다.

### 구현 Phase

#### Phase 1 — SPEC 세팅 + 데이터 준비 ✅
- [x] v09 폴더 생성, v08 코드 복사
- [x] SPEC §0 변경 요약 + §19~§22 신규 섹션
- [x] v20 CSV 마이그레이션 스크립트 (migrate_v20.py) → 135행 완료

#### Phase 2 — 자원 체계 전환 ✅
- [x] 시간 120 / 에너지 70, 고정 +18 회복, 등급별 차등 폐기
- [x] RP 분배 제거 → 에너지 게이지 애니메이션 + 레벨업 에너지 자동충전
- [x] storageKey v09 분리
- [x] 도전력 첫 플레이 오지급 수정 (wasReplay + challengeAwardedNow, 덱스 권장안)
- [x] 3 commits push + GitHub Pages 배포

#### Phase 3 — 할인 이중 구조 ✅
- [x] v21 핸드오프 수신 + 마이그레이션 (콘텐츠/비용/카드할인태그)
- [x] 축 숙련도 할인 폭 축소 (시간 상한 20%, 에너지 상한 40%+절대6)
- [x] `_calculateCardEnergyDiscount` 함수 (인간중심-2/도메인-2/강한도메인-3, 최대-6)
- [x] `_applyDiscount` 이중 할인 통합 + UI 카드 할인 표시

#### Phase 4 — 피드백 2레이어 ✅
- [x] CUT6: shortFeedback 우선 (awareness fallback)
- [x] 리포트: reportFeedback 우선 (awareness fallback)

#### Phase 5 — 용어 교체 ✅
- [x] texts.yaml + HTML: 위임판단력→판단하는 힘, 도메인지식→아는것의 힘
- [x] 공식형 박스: 숙련도 할인/총 할인
- [x] narrative 5종 본문 교체

#### Phase 6 — 빌드 + 검증
- [x] build.py 빌드 (823,113 bytes)
- [ ] 브라우저 검증 + git commit + push

### 데이터 소스

- content CSV: `Assets/incoming/AI리터러시/codex/ari-handoff-v20/v20-draft-content-{scenario}.csv`
- costs CSV: `Assets/incoming/AI리터러시/codex/ari-handoff-v20/v20-draft-costs-{scenario}.csv`
- 설계 문서: `Assets/incoming/AI리터러시/codex/ari-handoff-v20/07-*.md`, `08-*.md`, `10-*.md`, `11-*.md`

### 결정 사항

- **용어 확정** (5/8 피터공): 위임판단력 → 판단하는 힘, 도메인지식 → 아는것의 힘
- **회복력/도전력 유지**: 리플레이 장치로 기존 체계 그대로. 새 카드 할인과 공존
- **점수 런타임 계산 없음**: 코드는 `최종점수`/`최종등급` CSV 값을 그대로 사용
