## PLAN — v1.3-mid (중등)

**최종 업데이트**: 2026-06-08 (v12-mid → v13-mid 분기, 1차 교사 피드백 반영 착수)

> [!info] 이 빌드(v1.3-mid)는 1차 교사 검토(5명) 피드백을 반영하는 작업 빌드.
> **방향**: 중등 메인을 먼저 완전 수리하고, 그걸 기반으로 초등 `v13-elem` 분기(기존 v12-elem 6/1 시나리오 정본 2노트 이전). 빌드 구조가 데이터 외부화(yaml/csv → build.py)라 코드는 공유, 초등은 데이터만 교체.
> **v1.3 1차 작업(완료)**: 진행 상태 복원 + 재도전 노출 3건 — 새로고침 위치 복원(최서연샘) / 완료 카드 재도전(사성진샘) / 처음부터 다시(피터공). 전부 기존 함수를 진입점에 연결. 상세는 SPEC §14, 진행은 TASKS, 요청 노트 [[요청.26.0608.0851-AI리터러시교사반영]].
> v1.1 본문은 아래 그대로 보존. 초등 정정 방향은 `v13-elem` PLAN에서 이어받음.

> [!important] 논리정합/밸런스 작업 계획 → **`PLAN-logic-balance.md`** (6/10 신설, Phase 0 피터공 결정 대기)

### 핵심 설계 의도 — 두 힘과 카드 두 트랙 (6/10 기록)

까먹기 쉬운 그림이라 여기 박아둔다. 상세 논의: 볼트 [[26.0610 AI리터러시 최종 빌드 — 기획 수정 결정 로그]].

- **두 수치의 개념**: 판단하는 힘 = 위임 판단의 질(위임 관련해서만 변동) / 아는것의 힘 = 학생이 직접 노력해 쌓은 지식.
- **두 수치 ↔ 두 카드 트랙 페어링**: 판단하는 힘 ↔ **인간중심 역량 카드**(특히 문제해결적 사고·주체성·자기이해가 위임 판단 역량) / 아는것의 힘 ↔ **도메인 역량 카드**. 종합 리포트가 이미 이 묶음으로 표시 중(`final_report.delegation_header`/`knowledge_header`) — 단 현재 **메커니즘에는 미구현**(모든 카드가 에너지 할인 한 줄). 정렬안 = 인간중심 카드→시간 할인 / 도메인 카드→에너지 할인 ("시간은 위임이 아껴주는 것, 에너지는 직접 할 때 쓰는 것"). 갈래 2(±2)·S1 재밸런싱 패키지에서 결정.
- **카드 지급 구조(135결말 분포 확인)**: 좋은·중간 결말 = 인간중심 1장 + 도메인 0~3장. **나쁜 결말(D 위주 51곳) = 역량 카드 없음, 회복력만** — 역량 카드는 참가상이 아니라 선별 지급. 시나리오마다 주인 태그·주인 도메인이 있음(자기소개=주체성·표현력 / 모둠=사회·관계적 사고·협업력 / 어린왕자=주체성·호기심·문해력 / 진로=주체성·창의적 사고·탐색력 / 시험=문제해결적 사고·학습력).

---

## PLAN — v1.0 (역사 본문)

**v0.9 베이스**에서 분기. Neo-Brutalism 디자인 최종.
**스타일 가이드**: [[AI 리터러시 게임 — 스타일 가이드]]

### 핵심 목표

v0.9까지의 기능 완성 위에 Neo-Brutalism 디자인 시스템을 전면 적용한다.
기능 변경 없음 — 시각·인터랙션·레이아웃만 최종 품질로.

### Phase 구조

6단계로 끊어서 진행. 각 Phase 끝에 브라우저 검증 + 커밋.

#### Phase 1 — CSS 토큰 + 전역 리셋
- `:root` CSS custom properties 선언 (컬러, geometry, font)
- `body` 배경: #f5f5f5 → #d0d0d0
- 나눔손글씨 펜 font-face import
- 전역 border-radius: 0 리셋 (원형 도트 제외)
- 전역 border: 옅은 회색 → 3px solid black
- 전역 box-shadow: 블러 있는 것 → 4px 4px 0 #000

> 이 Phase만으로 전체 톤이 Neo-Brutalism으로 전환된다.

#### Phase 2 — 버튼 체계 통일
- .btn 공통 클래스 + 변형 (yellow/ghost/correct/wrong)
- v0.9의 dark 버튼(#111 bg, #fff text) → yellow bg, black text
- 모든 버튼에 누름 피드백 (translate 2px + shadow 축소)
- 대상: start-btn, advance-btn, next-btn, action-main, lvup-confirm, rp-confirm, replay-btn, recovery-card-btn

#### Phase 3 — 카드·패널·모달 컴포넌트
- choice-card: 3px border + 4px shadow + hover 리프트
- panel: border/shadow 교체
- modal-card, coupon-box: 블러 shadow → 단색 offset shadow
- inv-tab, inv-card: radius 0 + shadow 교체
- card-reward-card: radius 0 + shadow 교체
- report 섹션들: border/shadow + 내부 배경 bg-soft

#### Phase 4 — 색상 재매핑
- 긍정 계열: #1a8c1a → mint 토큰
- 부정 계열: #c44 → pink 토큰
- bipolar-fill, pending-dot, cost-box, card-chip 등
- 보조 배경: #f8f8f8, #fafafa → bg-soft
- 인라인 스타일의 색상도 포함 (JS 내부 HTML 생성)

#### Phase 4.5 — 이미지 프레임 효과 (SPEC §7.3)
- AI 생성 이미지의 불균일한 테두리/크기 문제 해결
- 정사각형 컨테이너에 맞춰 object-fit:cover (스트레칭 허용)
- 5px 흰색 inner border + 2px 검정 inner border (::after pseudo-element)
- 적용 대상: 시나리오 패널 이미지 + 리포트 카툰 이미지

#### Phase 5 — 인라인 하이라이트 + 손글씨 적용
- .hl 클래스 4종 (yellow/cyan/mint/pink)
- texts.yaml 키워드에 하이라이트 마크업 적용
- 피드백 한마디에 손글씨 폰트 적용

#### Phase 6 — 모션 통일 + 체크리스트 검증
- transition 타이밍: all 0.2s → transform 0.05s, box-shadow 0.05s
- 모든 인터랙션에 누름 피드백 점검
- 스타일 가이드 §9 체크리스트 전항목 검증
- 빌드 + 브라우저 5시나리오 검증

### v0.9에서 가져온 것 (변경 없음)

- 자원 100/100, 자동 회복 없음, RP 직접 배분
- 고정 할인 + 카드 할인 쿠폰 (바닥값 폐지, 0까지 내려감)
- 피드백 2레이어, 용어, 선택지 인라인 전개
- XP score 기반, 이미지 webp

### v0.9 미결 이월

- 인간중심 카드 → 시간 할인 분리 여부 (피터공 보류)
- 5시나리오 완주 검증 (Phase 6에서 함께)

#### Phase 7 — UI 텍스트 분리 + CSV 편집 워크플로우
- texts.yaml에 모든 UI 텍스트 통합 (258개 항목, 12 신규 섹션)
- JS 코드에서 `_t(path, fallback)` 헬퍼로 참조 (fallback 안전 가드)
- 14-init.js에서 HTML shell 고정 텍스트를 TEXTS로 덮어씌움
- CSV 변환: `texts_to_csv.py` → Google Sheets 편집 → `csv_to_texts.py --verify` → `build.py`

#### Phase 8 — 시나리오 데이터 CSV 편집 워크플로우
- scenarios.yaml (9,604행) → 3 CSV로 분리 (meta 5행 + choices 75행 + leaves 135행 = 215행)
- 덱스가 Google Sheets에서 콘텐츠 편집 (선택지 텍스트, 점수, 비용, 리포트 텍스트)
- CSV → scenarios.yaml 역변환 + round-trip 검증
- tier2 두 포맷(delta 중첩 / 직접 delegation) 자동 판별
- reportData는 finals에서 자동 재생성 (중복 저장 X)

### 데이터 소스

v0.9와 동일 — `data/scenarios.yaml`, `data/cuts.yaml`, `data/texts.yaml`
- `texts.yaml`: 시나리오 콘텐츠 이외 모든 UI 텍스트의 single source of truth
- `data/ui_texts.csv`: texts.yaml에서 추출한 편집용 CSV (258행)
- `data/scenario_meta.csv` + `scenario_choices.csv` + `scenario_leaves.csv`: scenarios.yaml에서 추출한 편집용 CSV (215행)
