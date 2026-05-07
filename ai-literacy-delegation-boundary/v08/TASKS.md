## TASKS — v0.8

**최종 업데이트**: 2026-05-07 세션308 (v14-slim 반영 — 단계 10~13 신설)
**PLAN**: [[PLAN|PLAN.md]] / **SPEC**: [[SPEC|SPEC.md]]
**v14-slim**: `Assets/incoming/AI리터러시/codex/ari-final-delivery-v14-slim/`
**v14 리포트**: `Assets/incoming/AI리터러시/codex/ari-report-text-v14/`

> 매 작업 완료 시 즉시 체크. 에이전트 위임 시 이 노트 + SPEC만으로 자급자족 가능해야 함.

---

#### 현재 단계: v14-slim 데이터 재마이그레이션 (단계 10)

---

##### 단계 1 — 문서 갱신 ✅

- [x] 1.1 v08 폴더 신설 + v07 코드 복사 + v11 CSV 복사
- [x] 1.2 PLAN.md 작성
- [x] 1.3 TASKS.md 작성
- [x] 1.4 SPEC.md 갱신 — §0 v0.8 변경 요약 + §2 점수 전환 + §13 카드 확정 + §14 리플레이 + §15 결과 화면

---

##### 단계 2 — 데이터 마이그레이션 ✅ 5/7 세션304

v11 CSV가 단일 진실의 자리. 이것을 런타임 yaml로 변환한다.

- [x] 2.1 v11 CSV 컬럼 → yaml 필드 매핑 설계 — finals에 새 필드 추가 방식 채택
- [x] 2.2 CSV → scenarios.yaml 변환 스크립트 작성 (`data/migrate_v11.py`)
- [x] 2.3 scenarios.yaml 재생성 — 최종점수/최종등급/보정피드백/리플레이제안/카드3트랙 (153K → 216K)
- [x] 2.4 texts.yaml 카드 섹션 재작성 — humanCentricCards(3축 12태그) + domainCards(10종) + growthCards(2종). 레거시 19종 deprecated 보존
- [ ] 2.5 build_csv.py 재작성 — v12 컬럼 구조 반영 (단계 3~6 코드 작업 후)
- [ ] 2.6 competency_cards.csv 처리 결정 (v12 CSV에 카드 정보 통합됨, 폐기 후보)
- [x] **검수 2-A**: yaml 135행 ↔ v11 CSV 전수 대조 — 점수/등급 전수 일치 ✅
- [x] **검수 2-B**: texts.yaml 카드 이름 ↔ v11 CSV 카드명 전수 일치 ✅ (축 3종, 태그 10종, 도메인 10종, 성장 1종)
- [x] 빌드 확인: 462,473 bytes (v0.7 384,949 → +77K)

---

##### 단계 3 — 점수 시스템 변경

학생에게 보이는 모든 자리에서 합산점수 → 최종점수/최종등급으로 전환한다.

- [x] 3.1 calculateFinalScore → finals[leaf].score lookup + fallback 보존 + console.log 디버그
- [x] 3.2 getFinalGrade 함수 신설 → finals[leaf].grade lookup
- [x] 3.3 goCut6 grade 산출 → getFinalGrade(leaf) 전환
- [ ] 3.4 학기 종합 리포트 — `최종점수` / `최종등급` 기준 (단계 7에서)
- [x] 3.5 등급컷 변경: CONFIG.pointThresholds {S:95,A:85,B:75,C:60,D:0}
- [x] 3.6 CONFIG version/storageKey v0.7 → v0.8
- [ ] **검수 3-A**: 학생 화면 전체에서 `합산점수` 텍스트가 노출되는 자리 0건
- [ ] **검수 3-B**: 등급 임계값이 코드에 1곳만 정의 (중복 정의 없음)
- [ ] **검수 3-C**: 무작위 5개 leaf 직접 플레이 → 화면 최종점수/최종등급이 CSV값과 일치

---

##### 단계 4 — 카드 시스템 재작업

19종 단일 풀 → 3트랙으로 분리한다.

**인간중심 역량** — 3축(중심잡기/융합하기/성찰하기) × 12세부역량(태그)
**도메인 역량** — 10종 (자기이해/표현력/문해력/분석력/검토력/자료판단력/소통력/협업력/학습력/탐색력)
**성장 역량** — 2종 (회복력/도전력)

- [x] 4.1 gameState 카드 구조 3트랙 분리 — createInitialState에 humanCentricCards/domainCards/growthCards 추가
- [x] 4.2 applyReview 카드 지급 → finals 기반 3트랙 직접 지급
- [x] 4.3 카드 reward 팝업 — 3트랙 구분 표시 (_cardColor v0.8 3트랙 lookup + 트랙명/축 표시)
- [x] 4.4 인벤토리 UI — 3트랙 분리 표시 (이미 구현: renderInventory에서 hc/dc/gc 분리 렌더)
- [ ] 4.5 기존 19종 카드 관련 코드 정리 — deprecated 보존 (texts.yaml에 레거시 표기, 인벤토리에서 oldCards fallback)
- [ ] **검수 4-A**: 카드 이름이 v11 CSV 컬럼값과 정확히 일치 (오타/공백 차이 없음)
- [ ] **검수 4-B**: createInitialState에서 3트랙 모두 빈 상태 초기화
- [ ] **검수 4-C**: continueGame에서 카드 상태 guard 존재

---

##### 단계 5 — 성장 카드 + 리플레이 ✅ (코드 구현 완료, v12 리플레이 제안 위치 조정 대기)

D 결과 → 회복력, 리플레이 개선 → 도전력.

- [x] 5.1 D 결과 시 회복력 카드 자동 지급 (applyReview에서 finals.growthCard 기반)
- [x] 5.2 "다시 도전하기" 버튼 — C/D는 등급 박스 안 라운드 버튼, A/B는 low key, S는 없음
- [x] 5.3 리플레이 제안 문구 표시 (v12에서 위치 변경: 버튼 클릭 시만 → 단계 6.4)
- [x] 5.4 replayScenario 함수 — 역량/카드/점수/EXP 해당 시나리오분 롤백 + 자원 스냅샷 원복
- [x] 5.5 리플레이 완료/개선 시 도전력 지급 (goCut6에서 best score 비교)
- [x] 5.6 best score 유지 + 자원 시나리오 시작 전 스냅샷 저장/원복
- [ ] **검수 5-A**: D 결과 경로 진입 → 회복력 표시 + 인벤토리 반영
- [ ] **검수 5-B**: 리플레이 후 점수 개선 → 도전력 인벤토리 1회 추가 (중복 지급 없음)
- [ ] **검수 5-C**: 리플레이 시 자원+역량+카드+EXP 해당 시나리오분만 롤백

---

##### 단계 6 — CUT6 결과 화면 (v12 간소화 적용) ✅ 코드 구현 완료

v12 요청: Cut6는 등급+점수+awareness+하단메시지만. 선택경로/카드/리플레이제안은 Cut6에서 빼기.

- [x] 6.1 1차 구현: 선택 요약 + 보정 피드백 + 카드 + 리플레이 제안 (v11 기준)
- [x] 6.2 **v12 간소화**: Cut6에서 선택 경로 제거 → 리포트로 이동
- [x] 6.3 **v12 간소화**: Cut6에서 획득 카드 목록 제거 → 카드 팝업/인벤토리만
- [x] 6.4 **v12 간소화**: Cut6에서 리플레이 제안 제거 → 버튼 클릭 시만 표시 (C/D 등급 버튼 + A/B low key 버튼 모두)
- [x] 6.5 **v12 Cut6 구조**: awareness(결과 설명) + CUT6 보정 피드백(하단 메시지) 두 줄만
- [x] 6.6 C/D "다시 도전하기" 라운드 버튼 등급 박스 안
- [x] 6.7 이중 클릭 방어 — btnGuard 유틸 + 6개 핵심 함수에 적용 (enterFromTitle/goCut2/goCut5/startScenario/goNextScenario + replay 버튼 disabled)
- [ ] **검수 6-A**: Cut6에 선택 경로/카드 목록/리플레이 제안 텍스트 없음
- [ ] **검수 6-B**: Cut6에 awareness + 하단 메시지만 표시
- [ ] **검수 6-C**: 모든 버튼 연타 시 중복 동작 없음

---

##### 단계 7 — 학기 종합 리포트 갱신 ✅ 코드 구현 완료

- [x] 7.1 카드 누적 인사이트 — 3트랙 통합 (_reportAllCards → human/domain/growth 분포 narrative)
- [x] 7.2 카드 그리드 — 3트랙 통합 라벨+색상+시나리오 출처
- [x] 7.3 성장 카드 프로필 — narrative에 성장 카드 줄 추가
- [x] 7.4 4유형 판정 (위×도) — 기존 유지 (v11 등급 체계와 정합)
- [x] 7.5 선택 경로 — Cut6에서 제거 → 리포트 카툰 컷 위 메타 정보로 이동 (v12 §4)
- [ ] **검수 7-A**: 리포트 카드 총합 = 인벤토리 카드 총합
- [ ] **검수 7-B**: 5 시나리오 전체 완주 후 리포트 정상 렌더링

---

##### 단계 8 — 빌드 + 종합 자체 검수

- [x] 8.1 build.py 빌드 → 472,017 bytes (v0.7 384,949 → +87K)
- [x] 8.2 종합 자체 검수 QC-1~QC-11 전항목 통과 ✅
- [x] 8.3 git tag `v0.8-pre-test` ✅
- [x] 8.4 git 커밋 `439446d` + push ✅
- [x] 8.5 GitHub Pages 배포 진행 중 (https://mice3nyc.github.io/ari_gitrepo_1/ai-literacy-delegation-boundary/v08/)
- [x] 8.6 DESIGN-REGISTRY.md 생성 — CSS 27개 섹션 확정 값 + z-index 스택 + 수정 프로토콜. 디자인 수정 시 롤백 방지용 (세션307)

---

##### 단계 10 — v14-slim 데이터 재마이그레이션

v14-slim CSV가 새 단일 진실. v11 CSV를 대체한다.

- [x] 10.1 migrate_v14_slim.py 신설 — v14-slim CSV + 리포트 CSV + resourceCosts yaml 통합
- [x] 10.2 v14-slim CSV → scenarios.yaml 재생성 — finals 블록에 리포트 필드 6종 추가 (216K → 307K)
  - reportPathSummary, cartoonCaption1~5, reportReflection, reportCardSummary, reportStrengthTags, reportGrowthTags
- [x] 10.3 resourceCosts yaml 교체 — v14-slim snippet으로 5시나리오 전면 교체 (135건)
- [x] 10.4 growth report 템플릿 → texts.yaml growthReport 섹션 추가 (5패턴 + 강점/보완/약속 + 교사용)
- [x] 10.5 자원 비용 바닥값 — 이미 구현됨 (CONFIG.minResourceCost:1 + _applyDiscount에서 rawT>0 → max(1,...))
- [x] 10.6 eorinwangja C1R1 D등급 확인 + groupwork B3R1 C등급 확인
- [x] **검수 10-A**: yaml 135행 ↔ v14-slim CSV 전수 대조 ✅
- [x] **검수 10-B**: yaml 135행 ↔ v14-slim 리포트 CSV 전수 대조 ✅
- [x] **검수 10-C**: resourceCosts 135건 ↔ v14-slim yaml snippet 전수 대조 ✅
- [x] 빌드 확인: 594,004 bytes (이전 472K → +122K)

---

##### 단계 11 — 리포트 카툰 돌아보기 재작성

기존 reviewSupplements 긴 설명 → v14 컷당 1문장 캡션으로 전환.

- [x] 11.1 카툰 컷 캡션 → cartoonCaption1~5 전환 (getCutCaptionFor 재작성, fallback 보존)
- [x] 11.2 선택 경로 → reportPathSummary 전환 (3줄 → 한 줄 화살표)
- [x] 11.3 핵심 돌아보기 → reportReflection 강조 표시 (comic-scene-footer 블록)
- [x] 11.4 카드 요약 → reportCardSummary 한 줄 표시 ("없음"이면 미표시)
- [x] 11.5 내부 수치 제거 — 위/도 delta, scene-summary 위/도 세그먼트, _reportSceneMood 호출 제거
- [x] **검수 11-A**: 리포트 렌더링 코드에서 dlgDelta/knlDelta/fmtD/sceneMood 참조 0건 ✅
- [ ] **검수 11-B**: 5시나리오 완주 후 카툰 돌아보기 정상 렌더링 (브라우저 플테 필요)

---

##### 단계 12 — AI리터러시 성장 리포트 구현

학기 종합 리포트에 성장 리포트 섹션 추가.

- [x] 12.1 패턴 판정 로직 — tier1(A/B/C) + review(R1/R2/R3) + grade(S~D) 비율로 5패턴 판정. 우선순위: recovery>reviewWeak>aiHeavy>reviewStrong>selfStart
- [x] 12.2 패턴별 성장 요약 문장 표시 (texts.yaml growthReport.patterns)
- [x] 12.3 "내가 잘 붙잡은 과정" — reportStrengthTags 빈도 상위 3개 → strengths 풀 매칭
- [x] 12.4 "더 연습할 과정" — reportGrowthTags 빈도 상위 2개 → improvements 풀 매칭
- [x] 12.5 "다음 AI 사용 약속" — growthTags 기반 pledges 1~3개 선택
- [x] 12.6 교사용 관찰 포인트 — `<details>` 접기 영역
- [x] 12.7 리포트 어투 — texts.yaml 원문 그대로 (~이다/~했다 어투)
- [ ] **검수 12-A**: 5시나리오 전체 완주 후 성장 리포트 정상 렌더링 (브라우저 플테 필요)
- [ ] **검수 12-B**: D 경로 포함 완주 → 회복/재도전 패턴 정상 판정 (브라우저 플테 필요)

---

##### 단계 13 — 2차 빌드 + 종합 재검수

- [ ] 13.1 build.py 빌드 → 바이트 변화 확인
- [ ] 13.2 종합 자체 검수 QC-1~QC-11 + 신규 QC-12~14 전항목 통과
- [ ] 13.3 git 커밋 + push
- [ ] 13.4 GitHub Pages 배포 확인

---

##### 단계 14 — 플테 + QA

- [ ] 14.1 피터공 직접 플테
- [ ] 14.2 동현공 플테 안내
- [ ] 14.3 QA 피드백 수집 + 수정 사이클

---

#### 종합 자체 검수 체크리스트 (단계 8 시점)

빌드 후, 플테 전에 전항목 통과해야 한다. 실패 시 해당 단계로 돌아가 수정.

| ID | 검사 항목 | 방법 | 통과 기준 |
|---|---|---|---|
| QC-1 | 하드코딩 문자열 잔존 | `grep -i "100자\|독후감\|v0.3\|v0.5\|v0.6\|v0.7"` index.html | 0건 (v0.8만 허용) |
| QC-2 | 시스템 ID 학생 노출 | 학생 화면 텍스트에서 `A1R3`, `tier1`, `selfintro`, `leaf` 검색 | 0건 |
| QC-3 | 합산점수 학생 노출 | 학생 화면 전체에서 `합산` 텍스트 검색 | 0건 |
| QC-4 | 등급컷 일관성 | 코드에서 등급 threshold 정의 위치 검색 | 1곳만 정의 |
| QC-5 | 카드명 정합성 | texts.yaml 카드명 ↔ v11 CSV 카드명 | 전수 일치 |
| QC-6 | 초기화 안전 | createInitialState 점검 | 3트랙 카드 + 자원 + 점수 모두 초기화 |
| QC-7 | 결과 제목 동적 | 5 시나리오 플레이 → 각각 다른 제목 표시 | 5종 확인 |
| QC-8 | D 경로 회복력 | D 결과 진입 → 회복력 표시 + 인벤토리 | 정상 작동 |
| QC-9 | 리플레이 도전력 | 리플레이 완료 + 개선 → 도전력 1회 지급 | 중복 없음 |
| QC-10 | 이중 클릭 방어 | 모든 진행 버튼 연타 테스트 | 중복 동작 없음 |
| QC-11 | 135 leaf 전수 정합 | yaml 135행 ↔ v14-slim CSV 전수 대조 스크립트 | 전수 일치 |
| QC-12 | 리포트 카툰 캡션 정합 | yaml 135행 cartoonCaption1~5 ↔ v14-slim 리포트 CSV | 전수 일치 |
| QC-13 | 리포트 내부 수치 제거 | 학생 화면에서 `도메인지식 +`, `위 +`, `도 +`, `basePoint`, `varPoint` 검색 | 0건 |
| QC-14 | 성장 리포트 렌더링 | 5시나리오 완주 후 성장 리포트 섹션 표시 | 패턴·강점·보완 정상 |

---

#### v0.7 QA 흡수 현황

| ID | 내용 | v0.7 상태 | v0.8 대응 |
|---|---|---|---|
| P0-1 | 결과 제목 하드코딩 | ✅ 수정 (ad5168c) | QC-7 재확인 |
| P0-2 | 버전 표기 불일치 | ✅ 수정 (ad5168c) | QC-1 재확인 |
| P0-3 | 카드 인벤토리 초기화 | ✅ 수정 (ad5168c) | QC-6 재확인 |
| P1-1 | AI 피드백 콘텐츠 | 미수정 | → 단계 2 (v11 CSV) |
| P1-2 | texts.yaml 정합성 | ✅ 수정 (ad5168c) | → 단계 2 재작성 |
| P1-3 | 이중 클릭 방어 | 미수정 | → 단계 6.3 / QC-10 |
| P1 점수 | 납득감/할인/등급 | 미수정 | → 단계 3 (v11 체계) |
