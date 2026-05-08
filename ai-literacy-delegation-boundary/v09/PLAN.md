## PLAN — v0.9

**v0.8 베이스**에서 분기. CODEX v20 데이터+설계 패키지 반영.

### 핵심 문제

v0.8까지 "비용 높은 선택 = 좋은 선택"으로 읽히는 구조. 학생이 선택지 내용보다 숫자를 보고 판단하게 되면 핵심 레슨("AI에게 무엇을 맡기고 무엇을 직접 할지")이 사라진다.

### v0.9 목표

> 비용은 선택의 부담을 보여주는 참고 정보이고, 점수는 선택의 의미와 결과 품질을 판정한다.

### 구현 Phase

#### Phase 1 — SPEC 세팅 + 데이터 준비
- [x] v09 폴더 생성, v08 코드 복사
- [x] SPEC §0 변경 요약 작성
- [x] SPEC §19~§22 신규 섹션 작성
- [ ] v20 CSV 마이그레이션 스크립트 (content 51컬럼 + costs 17컬럼 → yaml)
- [ ] v20 데이터 yaml 반영 + 검증

#### Phase 2 — 자원 체계 전환
- [ ] 시간 시작값 120, 에너지 시작값 70 적용
- [ ] 시나리오 종료 후 에너지 고정 +18 회복 구현
- [ ] 1차 선택 비용 시간 1 / 에너지 1 적용
- [ ] v0.8 등급별 차등 회복 제거 (recoverBase, gradeBonus)

#### Phase 3 — 할인 이중 구조
- [ ] 축 숙련도 할인 폭 축소 (시간 상한 20%)
- [ ] 카드 태그 매칭 에너지 할인 함수 구현 (`calculateCardEnergyDiscount`)
- [ ] 합산 상한 적용 (에너지 40%, 최대 -6)
- [ ] 선택지 UI에 카드 할인 표시 추가

#### Phase 4 — 피드백 2레이어
- [ ] `finals.awareness` → `finals.reportFeedback` 마이그레이션
- [ ] `finals.shortFeedback` 신규 필드 추가
- [ ] CUT6 결과 화면: shortFeedback 표시
- [ ] 성장 리포트: reportFeedback 표시

#### Phase 5 — 용어 교체
- [ ] texts.yaml 용어 교체 (위임판단력→판단하는 힘, 도메인지식→아는것의 힘)
- [ ] 튜토리얼 문장 갱신
- [ ] 카드 이름/설명 갱신
- [ ] 리포트/결과 화면 라벨 갱신

#### Phase 6 — 빌드 + 검증
- [ ] build.py 빌드
- [ ] 5개 시나리오 완주 가능 검증
- [ ] AI 대행 반복 → 시간/에너지 남지만 점수/성장 낮은지 확인
- [ ] 좋은 AI 활용 경로가 A/S 받을 수 있는지 확인
- [ ] 카드 할인 적용 학생 화면 확인
- [ ] git commit + push

### 데이터 소스

- content CSV: `Assets/incoming/AI리터러시/codex/ari-handoff-v20/v20-draft-content-{scenario}.csv`
- costs CSV: `Assets/incoming/AI리터러시/codex/ari-handoff-v20/v20-draft-costs-{scenario}.csv`
- 설계 문서: `Assets/incoming/AI리터러시/codex/ari-handoff-v20/07-*.md`, `08-*.md`, `10-*.md`, `11-*.md`

### 결정 사항

- **용어 확정** (5/8 피터공): 위임판단력 → 판단하는 힘, 도메인지식 → 아는것의 힘
- **회복력/도전력 유지**: 리플레이 장치로 기존 체계 그대로. 새 카드 할인과 공존
- **점수 런타임 계산 없음**: 코드는 `최종점수`/`최종등급` CSV 값을 그대로 사용
