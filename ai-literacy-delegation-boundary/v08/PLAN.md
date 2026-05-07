## PLAN — AI 리터러시: 위임의 경계 v0.8

**최종 업데이트**: 2026-05-07 세션308 (v14-slim + v14 리포트 텍스트 반영 — 단계 10~13 신설)
**진입점**: v14-slim (`Assets/incoming/AI리터러시/codex/ari-final-delivery-v14-slim/`) + v14 리포트 (`Assets/incoming/AI리터러시/codex/ari-report-text-v14/`)
**v0.7 freeze**: `_dev/ai-literacy-delegation-boundary/v07/` (5/7 ad5168c, GitHub Pages 배포)

> Live document — 항상 "지금 상태". 방향 전환 시 즉시 갱신.

---

#### 0. v0.8 핵심

v0.7 플테 후 CODEX(덱스)가 점수/등급/카드/피드백을 전면 재설계한 **v11 데이터 패키지** 도착. 세 가지 큰 전환:

1. **점수 표시 전환**: `합산점수`(내부 계산) → `최종점수/최종등급`(CSV 확정값). 합산점수는 검수용으로만 남긴다.
2. **카드 체계 전환**: 19종 단일 풀 → **인간중심(3축 12태그) + 도메인(10종) + 성장(2종)** 3트랙. D 결과에 회복력 지급, 리플레이 시 도전력 지급.
3. **결과 피드백 전환**: results.text/summary/lesson → **CUT6 보정 피드백**(학생 언어). 리플레이 제안 문구 신설.

v0.7 QA 미수정 항목(P1-1 콘텐츠, P1-3 이중 클릭, 점수 납득감)을 v0.8에 흡수.

v0.8 빌드(439446d) push 후 CODEX v14-slim 최종 전달본 + v14 리포트 텍스트 도착. 추가 전환 세 가지:

4. **리포트 카툰 돌아보기 전환**: 기존 reviewSupplements 긴 설명 → 컷당 1문장 캡션(cartoonCaption1~5) + 핵심 돌아보기(reportReflection) + 카드 요약(reportCardSummary). 내부 수치(도메인지식 +3, 위 +2 등) 학생 화면에서 제거.
5. **AI리터러시 성장 리포트 신설**: 5패턴별 성장 요약 + reportStrengthTags/reportGrowthTags 기반 개인화 피드백 + 교사용 관찰 포인트.
6. **자원 비용 교체 + 바닥값**: v14-slim resourceCosts yaml로 전면 교체. 할인 후 비용이 0이 되지 않도록 최소 1 유지.

콘텐츠 수정 2건: eorinwangja C1 방향 정정(AI 줄거리+독후감 위임), groupwork B3R1 A→C 하향(AI 대본 그대로 읽기).

---

#### 1. v0.7 → v0.8 변경 사항

| 영역 | v0.7 | v0.8 |
|---|---|---|
| 점수 표시 | 합산점수 (코드 내부 계산) | **최종점수/최종등급** (CSV 확정값, leaf별 고정) |
| 합산점수 역할 | 학생 화면 공식 결과 | 검수/디버그 참고용 |
| 등급컷 | S95 / A90 / B80 / C70 / D60 | **S95 / A85 / B75 / C60 / D<60** |
| 역량카드 | 19종 단일 풀 (대부분 비활성) | **3트랙**: 인간중심 3축 + 도메인 10종 + 성장 2종 |
| D 결과 | 카드 없음 | **회복력 카드 지급** + 리플레이 제안 |
| 리플레이 | 미구현 (결정만 있었음) | **다시 해보기 버튼 + 도전력 조건부 지급** |
| 결과 피드백 | results.text / summary / lesson | **CUT6 보정 피드백** (leaf별 학생 문장) |
| 리플레이 제안 | 없음 | **리플레이 제안** (leaf별 학생 문장) |
| 데이터 소스 | yaml 단일 진실 | **v11 CSV 단일 진실** → yaml 변환 |
| 시나리오 텍스트 | v0.7 텍스트 (내부 검수어 잔존) | **v11 텍스트** (R1 S차단, C1 하향, 학생용 문장) |

---

#### 2. 자산 인수 (v0.7 → v0.8)

| 자산 | 처리 |
|---|---|
| `02-ai-literacy-v11-final-integrated-data.csv` | **v0.8 단일 진실** — 135행 × 49컬럼. `data/`에 복사 완료 |
| `01-ai-literacy-v11-implementation-handoff.md` | 구현 지침 참조 문서 |
| v07 `index.html` | 코드 베이스 — 점수/카드/결과화면 수정 |
| v07 `data/scenarios.yaml` | **재생성** — v11 CSV에서 변환 |
| v07 `data/texts.yaml` | **카드 섹션 재작성** — 19종 → 3트랙 |
| v07 `data/competency_cards.csv` | **교체** — v11 CSV 카드 컬럼으로 대체 |
| v07 `data/build_csv.py` | **재작성** — v14 컬럼 구조 반영 |
| **v14-slim** `01-final-integrated-data.csv` | **v0.8 최종 진실** — 135행, v13 기준 + 수정 2건(eorinwangja C1, groupwork B3R1) |
| **v14-slim** `02-resourceCosts-yaml-snippet.yaml` | 5시나리오 × 27 leaf 자원 비용 → scenarios.yaml 교체 |
| **v14-slim** `03-report-cartoon-text-135.csv` | 135 leaf별 카툰 캡션 + 핵심 돌아보기 + 카드 요약 → scenarios.yaml finals에 추가 |
| **v14** `03-growth-report-template-text.md` | 5패턴별 성장 리포트 문장 템플릿 → texts.yaml에 추가 |

---

#### 3. 단계별 구현 — Phase v0.8

상세 체크리스트는 [[TASKS|TASKS.md]]. 큰 흐름만 PLAN에 둔다.

##### 단계 1 — 문서 갱신 (메인)
PLAN·TASKS 작성, SPEC 갱신. v11 핸드오프 내용을 3계층 노트에 반영.

##### 단계 2 — 데이터 마이그레이션 (메인 + 백도)
v11 CSV → scenarios.yaml 변환. 새 yaml 스키마: 기존 구조 + 최종점수/최종등급/보정피드백/리플레이제안/카드3트랙. texts.yaml 카드 섹션 3트랙 재작성. build_csv.py를 v11 컬럼 구조에 맞춰 재작성. 변환 후 135행 전수 대조.

##### 단계 3 — 점수 시스템 변경 (메인)
calculateFinalScore → CSV 최종점수 lookup. 결과 화면과 리포트가 최종점수/최종등급을 사용하도록 전환. 합산점수는 디버그 콘솔로 밀어냄. 등급컷 S95/A85/B75/C60 적용.

##### 단계 4 — 카드 시스템 재작업 (메인 + 백도)
gameState 카드 구조 3트랙 분리. 인벤토리 UI: 인간중심 프로필(3축 분포) + 도메인 프로필 + 성장 카드. 카드 reward 팝업: 인간중심 + 도메인 두 종류 순차 표시. 기존 19종 코드 정리.

##### 단계 5 — 성장 카드 + 리플레이 (메인)
D 결과 시 회복력 자동 지급. "이 시나리오 다시 해보기" 버튼 + 리플레이 제안 문구. 리플레이 완료/개선 시 도전력 지급. best score 유지 + 자원 스냅샷 원복.

##### 단계 6 — CUT6 결과 화면 간소화 (메인, v12 요청)
v12 구조: 등급+점수(panel-image) + awareness(결과 설명) + CUT6 보정 피드백(하단 메시지). C/D는 "다시 도전하기" 버튼 등급 박스 안. Cut6에서 빼는 것: 선택 경로(→리포트), 획득 카드 목록(→팝업/인벤토리), 리플레이 제안(→버튼 클릭 시). 이중 클릭 방어.

##### 단계 7 — 학기 종합 리포트 갱신 (메인)
카드 누적 리뷰: 인간중심 프로필(3축 분포) + 도메인 프로필 + 성장 카드. 최종점수/최종등급 기준 종합.

##### 단계 8 — 1차 빌드 + 종합 자체 검수 ✅ (세션304~307)
build.py 빌드 → 바이트 변화 → 자체 검수 체크리스트 전항목 → git tag `v0.8-pre-test` → 커밋·push → GitHub Pages 배포. 검수 항목은 TASKS QC-1~QC-11 참조.

##### 단계 10 — v14-slim 데이터 재마이그레이션 (메인 + 백도)
v14-slim CSV를 새 단일 진실로 교체. migrate_v11.py 수정하여 v14-slim CSV 경로 + 리포트 텍스트 CSV 통합. resourceCosts yaml 교체. finals 블록에 리포트 필드 6종(reportPathSummary, cartoonCaption1~5, reportReflection, reportCardSummary, reportStrengthTags, reportGrowthTags) 추가. 135행 전수 대조.

##### 단계 11 — 리포트 카툰 돌아보기 재작성 (메인)
기존 reviewSupplements 긴 설명 → cartoonCaption1~5 컷당 1문장. reportPathSummary로 선택 경로 한 줄. reportReflection을 핵심 돌아보기로 강조 표시. reportCardSummary를 카드 요약 한 줄로. 내부 수치(도메인지식 +3 등) 학생 화면에서 제거.

##### 단계 12 — AI리터러시 성장 리포트 구현 (메인)
5패턴별 성장 요약(AI활용우세/직접시작우세/검토강점/검토부족/회복재도전) 판정 로직. reportStrengthTags/reportGrowthTags 기반 강점·보완 문장 선택. 다음 AI 사용 약속 문장 표시. 교사용 관찰 포인트 접기 영역.

##### 단계 13 — 2차 빌드 + 종합 재검수 + git push (메인)
v14-slim 반영 후 빌드 → 자체 검수 → 커밋·push.

##### 단계 14 — 플테 + QA (피터공 + 동현공)
플테 → QA 수집 → 수정 사이클.

---

#### 4. v0.7 QA 미수정 흡수

| 원래 ID | 내용 | v0.7 상태 | v0.8 단계 |
|---|---|---|---|
| P0-1 | 결과 제목 하드코딩 | ✅ 수정됨 (ad5168c) | 단계 8 QC-7 재확인 |
| P0-2 | 버전 표기 불일치 | ✅ 수정됨 (ad5168c) | 단계 8 QC-1 재확인 |
| P0-3 | 카드 인벤토리 초기화 | ✅ 수정됨 (ad5168c) | 단계 8 QC-6 재확인 |
| P1-1 | AI 피드백 콘텐츠 리뷰 | 미수정 (콘텐츠 리뷰 자리) | → 단계 2 (v11 CSV 반영) |
| P1-2 | texts.yaml 정합성 | ✅ 수정됨 (ad5168c) | → 단계 2 재작성 |
| P1-3 | 이중 클릭 방어 | 미수정 (실기기 확인 필요) | → 단계 6.4 |
| P1 점수 | 납득감/할인/등급 | 미수정 (학습 설계 판단) | → 단계 3 (v11 체계로 해소) |

---

#### 5. 미루는 결정 — 닿을 때

- **"융합하기" 이름**: 초등 고학년에게 어려운지 검증 (플테 후)
- **직관적 통찰 태그**: 학생 수준에서 작동 여부 (플테 후 사용 결정)
- **카드 매칭 활성화 메카닉**: v0.7 §7.8 설계가 카드 체계 변경으로 재검토 필요 — v0.8에서는 직접 매칭 보류, 3트랙 기본 지급만 먼저
- **캐논 도입 별도 자리**: README + ending 후보
- **위 축 표현**: 위임 판단력 측정 방법 (1차 플테 후)

---

#### 6. 참조

- [[TASKS|v0.8 TASKS.md]] — 진행 체크리스트 + 자체 검수
- [[SPEC|v0.8 SPEC.md]] — 기술 상세
- [[DESIGN-REGISTRY|DESIGN-REGISTRY.md]] — CSS 컴포넌트별 확정 값. 디자인 수정 전 필수 참조
- **v14-slim 최종 전달본**: `Assets/incoming/AI리터러시/codex/ari-final-delivery-v14-slim/`
- **v14 리포트 텍스트**: `Assets/incoming/AI리터러시/codex/ari-report-text-v14/`
- v12 핸드오프: `Assets/incoming/AI리터러시/codex/ari-final-delivery-v12/`
- v11 핸드오프: `Assets/incoming/AI리터러시/codex/ari-final-delivery/`
- v0.7 CODEX QA: `Assets/incoming/AI리터러시/AI리터러시-CODEX 테스트 의견.md`
- [[v07/PLAN|v0.7 PLAN]] — v0.7 freeze 시점
- 볼트: [[26.0504 v0.7 논의 자리들]] / [[26.0504 v0.7 작업 계획]]
