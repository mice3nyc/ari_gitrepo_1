## TASKS — v0.9

**현재 Phase**: 2 (자원 체계 전환) — 코드 수정 완료, 브라우저 검증 중

---

### Phase 1 — SPEC 세팅 + 데이터 준비

- [x] v09 폴더 생성 + v08 코드/데이터 복사
- [x] SPEC §0 v0.9 변경 요약 작성
- [x] SPEC §19 자원 체계 v20 전환
- [x] SPEC §20 할인 이중 구조
- [x] SPEC §21 피드백 2레이어
- [x] SPEC §22 용어 교체
- [x] PLAN.md 작성
- [x] TASKS.md 작성
- [x] v20 CSV → yaml 마이그레이션 스크립트 작성 (`data/migrate_v20.py`)
  - content CSV 51컬럼에서 필요 필드 추출
  - costs CSV 17컬럼에서 stageCosts 구조 생성
  - shortFeedback / reportFeedback 필드 매핑
- [x] 마이그레이션 실행 + scenarios.yaml 갱신 (5시나리오 × 27leaf = 135행 완료)
- [ ] texts.yaml 용어 교체 (판단하는 힘 / 아는것의 힘)
- [ ] energyDiscountTags 데이터 추가 (카드 매칭 — 덱스 데이터 구조 확정 후)

### Phase 2 — 자원 체계 전환

- [x] `index.html.template` — 시간 시작값 120, 에너지 시작값 70
- [x] 시나리오 종료 후 에너지 고정 +18 회복 (등급별 차등 제거)
- [x] 1차 선택 비용 — v20 costs CSV에서 전 시나리오 time:1/energy:1 확인 완료 (데이터 반영)
- [x] v0.8 회복 관련 CONFIG 변경 (recoverBase→0, gradeBonus→0, energyRecoverFlat:18 신설)
- [x] meterMaxByLevel 전 레벨 120/70 통일
- [x] HTML 초기 표시값 120/70 교체
- [x] 빌드 성공 (800,558 bytes)
- [ ] 브라우저 검증 — 시간/에너지 표시, 비용 차감, 시나리오 후 에너지 +18 회복

### Phase 3 — 할인 이중 구조

- [ ] 축 숙련도 할인 폭 축소 (시간 상한 20% 적용)
- [ ] `calculateCardEnergyDiscount(choice, inventory)` 함수 신설
- [ ] 합산 + 상한 로직 (에너지 40%, 최대 -6)
- [ ] UI — 카드 할인 표시 줄 추가 (공식형 박스 확장)
- [ ] 빌드 + 할인 검증

### Phase 4 — 피드백 2레이어

- [ ] `finals.awareness` → `finals.reportFeedback` 코드 교체
- [ ] `finals.shortFeedback` 필드 CUT6 결과 화면 연결
- [ ] 성장 리포트 (§17) reportFeedback 사용
- [ ] 학기 종합 리포트 (§18) reportFeedback 사용
- [ ] 빌드 + 피드백 표시 검증

### Phase 5 — 용어 교체

- [ ] texts.yaml — 카드 이름/설명 교체
- [ ] 튜토리얼 문장 (§11.5) 용어 갱신
- [ ] 공식형 박스 라벨 (위임 할인→판단하는 힘, 지식 할인→아는것의 힘)
- [ ] 리포트/결과 화면 라벨 갱신
- [ ] 빌드 + 용어 표시 검증

### Phase 6 — 빌드 + 전체 검증

- [ ] build.py 최종 빌드
- [ ] 검증: 5개 시나리오 여러 경로 완주 가능
- [ ] 검증: AI 대행 반복 → 시간/에너지 남지만 점수 낮음
- [ ] 검증: AI 활용+검토 경로 → A/S 도달 가능
- [ ] 검증: 직접 수행 경로 → 후반 과도하게 막히지 않음
- [ ] 검증: 카드 할인 적용 화면 인지 가능
- [ ] git commit + push
- [ ] GitHub Pages 배포 확인

---

### 볼트 노트 갱신 (Phase 완료 시)

- [ ] 세션 체크리스트 갱신 (v0.9 진입점)
- [ ] DN 오늘의 요청 등록
- [ ] 세션 로그 작업 기록
