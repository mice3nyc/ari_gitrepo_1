## TASKS — v0.7

**최종 업데이트**: 2026-05-04 세션287 (§0~§6 결정 묶음 박힘, Phase v0.7 단계 1 진입)
**PLAN**: [[PLAN|PLAN.md]] / **SPEC**: [[SPEC|SPEC.md]]
**작업 계획 컨테이너**: [[26.0504 v0.7 작업 계획]] / **결정 컨테이너**: [[26.0504 v0.7 논의 자리들]]

> 매 작업 완료 시 즉시 체크. 에이전트 위임 시 이 노트 + SPEC만으로 자급자족 가능해야 함.

---

#### 현재 단계: Phase v0.7 — §0~§6 결정 박힘, 단계 1 SPEC·PLAN·TASKS 갱신 진행 중

##### Phase v0.7 — 단계 1 SPEC·PLAN·TASKS 갱신
- [x] 1.1 PLAN.md 재작성 — v0.7 핵심 + 결정 묶음 §0~§6 요약 + Phase v0.7 단계 1~7 (5/4 세션287)
- [x] 1.2 TASKS.md 재작성 — Phase v0.7 체크리스트 신설 (5/4 세션287, 이 노트)
- [x] 1.3 SPEC.md 갱신 — §0 v0.7 변경 요약 신설 + §2 합산 모델 + §3 공식형 박스 + §7 카드 매칭 + §11 타이틀 정정 (5/4 세션287)

##### Phase v0.7 — 단계 2 yaml 재설계 (백도 5개 병렬)
- [ ] 2.1 selfintro yaml — 단계별 점수 + supplements 27 자리 + 카드 매칭 룰
- [ ] 2.2 groupwork yaml — 동일 패턴
- [ ] 2.3 eorinwangja yaml — 동일 패턴
- [ ] 2.4 career yaml — 동일 패턴
- [ ] 2.5 studyplan yaml — 동일 패턴
- [ ] 2.6 results.basePoint·finals.score 폐기 (또는 검수 보존)
- [ ] 2.7 reviewSupplements 학생 톤 narrative 메인 격상

##### Phase v0.7 — 단계 3 코드 재작성 (메인 직도)
- [ ] 3.1 calculateFinalScore 합산 함수 재작성
- [ ] 3.2 buildEffectCell·buildCostHTML 공식형 박스 두 줄 라벨 (위임 할인 / 지식 할인)
- [ ] 3.3 Cut5 review 패널 supplements 메인 텍스트
- [ ] 3.4 Cut6 결과 패널 단계별 점수 + narrative + 카드 매칭 보너스 한 줄
- [ ] 3.5 useReviewLevelBoost·detected·levelStep·levelExtraBonus 폐기
- [ ] 3.6 cardSlots·cardsHeld → getCardMatchBonus
- [ ] 3.7 §11 타이틀 화면 정정 (제목·도입·버튼)
- [ ] 3.8 §11 튜토리얼 4문장 학생 톤
- [ ] 3.9 캐논 도입 별도 자리 이동

##### Phase v0.7 — 단계 4 csv 재구성 (백도 1개)
- [ ] 4.1 build_csv.py 재작성 — 단계별 점수 컬럼
- [ ] 4.2 axisDelta 컬럼 = 카드 매칭 룰 데이터로 재정의
- [ ] 4.3 "더자세히 점수"·"R1·R2·R3 점수" 컬럼 처리
- [ ] 4.4 reviewSupplements 컬럼 풍부화

##### Phase v0.7 — 단계 5 19종 카드 시트 (메인)
- [ ] 5.1 `competency_cards.csv` 신설
- [ ] 5.2 19종 카드 그룹 정의
- [ ] 5.3 매칭 보너스 룰 데이터

##### Phase v0.7 — 단계 6 § 심볼 자연어 풀이 (백도 1개)
- [ ] 6.1 [[26.0504 v0.7 논의 자리들]] §X.Y 참조 자연어 풀이
- [ ] 6.2 헤딩 구조 유지

##### Phase v0.7 — 단계 7 빌드 + 동현공 재플테 (메인)
- [ ] 7.1 build.py 빌드 → bytes 변화
- [ ] 7.2 git 커밋 + push
- [ ] 7.3 GitHub Pages 배포 확인
- [ ] 7.4 동현공 텔레그램 안내

---

#### v0.6 freeze (인수 시점 상태, 5/3 23:30)

- [x] v0.6 sessions 268~284 모든 Phase 완료 — 옵션 1 매트릭스 + 19종 카드 시스템 + UI 정정 묶음 + texts.yaml 분리 + git push (dbcb60f) + GitHub Pages 배포

v0.6 freeze 시점 상세 체크리스트는 `v06/TASKS.md` 참조. v0.7는 v0.6 통째 복사 후 §0~§6 결정 묶음으로 새 사이클.

---

#### 미결정 큐 (닿을 때 결정)

- [ ] 5d 위 축 표현 — 위임 판단력 측정 (1차 v0.7 플테 후)
- [ ] review.varPoint leaf별 변수 — v0.7 단순 분배 후 플테 결과로 결정
- [ ] 캐논 도입 별도 자리 — README + ending 후보
- [ ] 19종 카드 그룹 정의 — 피터공과 한 호흡 (단계 5.2)
