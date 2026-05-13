## SPEC — v1.1

**최종 업데이트**: 2026-05-13 세션342 (v1.0에서 분기, 성장 리포트 독립화)
**PLAN**: [[PLAN|PLAN.md]] / **TASKS**: [[TASKS|TASKS.md]] / **DESIGN**: [[DESIGN-REGISTRY|DESIGN-REGISTRY.md]]
**스타일 가이드 원본**: [[AI 리터러시 게임 — 스타일 가이드]]

> v1.0 SPEC을 계승. 기능/밸런스/데이터 구조/디자인은 v1.0 SPEC 참조.
> 이 문서는 v1.1 성장 리포트 독립화 변경사항을 추가 기록한다.

---

#### 0. v1.0 변경 요약 (v0.9 → v1.0)

Neo-Brutalism 디자인 시스템 전면 적용. marjoballabani.me 영감.
기능 변경 없음 — 시각·인터랙션·레이아웃 품질을 최종 수준으로.

##### 0.1 v0.9에서 계승 (변경 없음)

- 자원: 시간·에너지 100/100 시작, 자동 회복 없음, RP 직접 배분
- 할인: 고정 (역량 점수 = 할인액) + 카드 쿠폰 수동 적용. 바닥값 없음 — 할인이 비용 이상이면 0까지 내려감 (직관 우선, 세션332 폐지). 카드 1개여도 선택 모달 표시 (학습 효과). 배지 "역량카드 할인가능 – 할인 적용하기" → 적용 후 "{카드명} 역량카드 효과: -{할인액} 할인" + 비용 UI 실시간 갱신 (할인+최종 동시 깜빡임)
- 피드백: 2레이어 (shortFeedback + reportFeedback)
- 용어: 판단하는 힘 / 아는것의 힘
- 선택지: 인라인 전개 (Cut 1~5 순차)
- XP: score × 0.3
- 이미지: 5시나리오 130개 webp

---

#### 1. 디자인 원칙 (스타일 가이드 §1)

1. **숨기지 않는다.** 그림자·테두리는 블러/그라디언트 없이 단색으로.
2. **블록 단위로 사고한다.** 모든 UI 요소는 사각형 카드. 영역 경계 분명.
3. **색은 의미로 쓴다.** 노랑=활성, 시안=정보, 민트=완료, 핑크=위험. 화면당 1~2색.
4. **타이포는 Paperlogy + 손글씨 2종.** 위계는 굵기+크기로. 색으로 위계 만들지 않는다.
5. **사람 냄새를 남긴다.** 카드는 차갑게, 한 곳쯤 손글씨/이모지로 온도.

---

#### 2. 컬러 토큰

##### 2.1 CSS Custom Properties

```css
:root {
  /* Surface */
  --bg-page:        #d0d0d0;
  --bg-card:        #ffffff;
  --bg-soft:        #f4f1ea;
  --bg-dark:        #000000;

  /* Ink */
  --ink:            #000000;
  --ink-mute:       #3c3c3c;
  --ink-soft:       rgba(0,0,0,.55);

  /* Accent 4색 */
  --acc-yellow:     #ffd93d;
  --acc-cyan:       #66d9ef;
  --acc-mint:       #a8e6cf;
  --acc-pink:       #ff6b9d;

  /* Accent 변형 */
  --acc-yellow-soft: rgba(255,217,61,0.70);
  --acc-yellow-deep: #d9b620;
  --acc-cyan-soft:   rgba(102,217,239,0.70);
  --acc-cyan-deep:   #2ba8c6;
  --acc-mint-soft:   rgba(168,230,207,0.70);
  --acc-mint-deep:   #5fbf95;
  --acc-pink-soft:   rgba(255,107,157,0.70);
  --acc-pink-deep:   #d63f7a;

  /* Geometry */
  --border-w:       3px;
  --shadow-offset:  4px;
  --shadow:         var(--shadow-offset) var(--shadow-offset) 0 var(--ink);
  --shadow-press:   2px 2px 0 var(--ink);
  --radius:         0;
}
```

##### 2.2 색상 매핑 (v0.9 → v1.0)

| v0.9 값 | 용도 | v1.0 토큰 |
|---------|------|----------|
| `#1a8c1a` | 긍정/할인/자원+ | `--acc-mint` / `--acc-mint-deep` |
| `#c44` | 부정/부족/자원- | `--acc-pink` / `--acc-pink-deep` |
| `#f5f5f5` | 페이지 배경 | `--bg-page` (#d0d0d0) |
| `#fff` | 카드 배경 | `--bg-card` |
| `#f8f8f8`, `#fafafa` | 보조 배경 | `--bg-soft` (#f4f1ea) |
| `#111 bg + #fff text` (버튼) | 어두운 버튼 | `--acc-yellow` bg + `--ink` text |

##### 2.3 절대 규칙

1. **글씨는 어떤 배경 위에서도 항상 `--ink` (검정).** 흰 글씨 금지.
2. 한 화면 액센트 **1~2색**. 나머지는 흑/백/회색.
3. 액센트 색끼리 **나란히 두지 않는다.** 사이에 흑/백/회색 텍스트.
4. 그라디언트·블렌드 금지. **단색 채움만.**

---

#### 3. 타이포그래피

##### 3.1 폰트 스택

```css
--font-main: "Paperlogy", "Pretendard", system-ui, sans-serif;
--font-hand: "Nanum Pen Script", "Caveat", cursive;
```

##### 3.2 스케일

| 역할 | 크기/굵기 | 용도 |
|------|----------|------|
| Display | 56/800 | 게임 시작, 챕터 표지 |
| H1 | 36/700 | 스테이지 제목 |
| H2 | 24/700 | 섹션 제목, 카드 헤드 |
| Body | 16/400 | 본문, 설명 |
| Caption | 13/500 | 보조 안내, 메타 |
| Tag/Label | 12/700 (letter-spacing:1.5px) | STAGE 03/12, +120 XP |
| Button | 14/700 | 모든 버튼 |
| Hand | 24/400 | 힌트, 대사 (나눔손글씨 펜) |

##### 3.3 운용 원칙

- 위계: Regular(400) / Bold(700) / ExtraBold(800) 세 단계만.
- 색 변화로 위계 만들지 않음 (색은 의미용).
- 손글씨는 **힌트·캐릭터 대사 전용**. 본문·버튼·태그에 쓰지 않는다.

---

#### 4. 테두리·그림자·간격

- 테두리: **3px solid black**. 옅은 회색 테두리 금지.
- 그림자: **4px 4px 0 #000** (블러 0). 누른 상태 2px 2px.
- 간격: 8의 배수 (8/16/24/32/48).
- 코너: **border-radius: 0**. 직각 모서리. (예외: 원형 아바타/도트 1곳)

##### 4.1 v0.9 → v1.0 변환 대상

| v0.9 패턴 | 변환 |
|-----------|------|
| `border-radius: 3~24px` (카드, 버튼, 모달) | → `0` |
| `border-radius: 50%` (도트, 라디오, 뱃지) | 유지 (원형 요소) |
| `border: 1~2px solid #aaa/#ccc/#e5e5e5` | → `3px solid var(--ink)` |
| `box-shadow: 0 Npx Mpx rgba(...)` (블러 있음) | → `var(--shadow)` |
| `box-shadow: 0 2px 0 #111` (오프셋만) | → `var(--shadow)` (4px 4px) |

---

#### 5. 버튼 체계

##### 5.1 공통 버튼 (.btn)

```css
.btn {
  font-family: var(--font-main);
  font-weight: 700;
  font-size: 14px;
  background: var(--acc-yellow);
  color: var(--ink);
  border: var(--border-w) solid var(--ink);
  border-radius: 0;
  padding: 12px 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform .05s, box-shadow .05s;
}
.btn:active {
  transform: translate(2px, 2px);
  box-shadow: var(--shadow-press);
}
```

##### 5.2 변형

| 변형 | 배경 | 용도 |
|------|------|------|
| `.btn` (기본) | `--acc-yellow` | 주 행동 (다음, 시작) |
| `.btn--ghost` | `--bg-card` | 보조 행동 (다시, 취소) |
| `.btn--correct` | `--acc-mint` | 정답 피드백 |
| `.btn--wrong` | `--acc-pink` | 오답 피드백 |

> 모든 변형에서 글씨 색 = `--ink`. v0.9의 `color:#fff` 버튼들은 전부 전환.

##### 5.3 v0.9 버튼 매핑

| v0.9 클래스 | 현재 스타일 | v1.0 전환 |
|------------|-----------|----------|
| `.start-btn` | bg:#111, color:#fff | → `.btn` (yellow bg, black text) |
| `.advance-btn` | bg:#111, color:#fff | → `.btn` |
| `.next-btn` | bg:#111, color:#fff | → `.btn` |
| `.action-main` | bg:#111, color:#fff | → `.btn` (Display 크기) |
| `.lvup-confirm` | bg:#111, color:#fff | → `.btn` |
| `.rp-confirm` | bg:#111, color:#fff | → `.btn` |
| replay-btn (인라인) | bg:#fff, border:#ccc | → `.btn--ghost` |
| `.recovery-card-btn` | 각종 | → `.btn` / `.btn--ghost` |

---

#### 6. 컴포넌트 변환

##### 6.1 선택지 카드 (.choice-card)

현재: `border:2px solid #111, box-shadow:0 2px 0 #111`
전환: `border:3px solid var(--ink), box-shadow:var(--shadow), border-radius:0`
hover: `transform:translate(-2px,-2px), box-shadow:6px 6px 0 var(--ink)` (리프트)
active: `transform:translate(2px,2px), box-shadow:var(--shadow-press)` (누름)
비용 간격: `.choice-cost` margin-top `1px` (텍스트와 점선 구분선 최소 간격)
역량카드 배지: choice-text 밖, 비용 섹션 아래 block 배치. 미적용 "역량카드 할인가능 – 할인 적용하기" → 적용 후 "{카드명} 역량카드 효과: -{N} 할인". 적용 시 할인 금액+최종 에너지 동시 2회 깜빡임(cost-blink 0.8s) → 새 값 교체 → 2회 깜빡임 후 확정

##### 6.2 패널 (.panel)

현재: `border:2px solid #111, box-shadow:0 2px 4px rgba(...)`
전환: `border:var(--border-w) solid var(--ink), box-shadow:var(--shadow)`

`.cut-num` 라벨: 숫자만 표시 ("CUT 3" → "3"). 세션333.

시나리오 종료 후 다음 시나리오 버튼: Cut 6 패널 body 안에 full-width yellow `.next-btn`으로 배치. 하단 별도 `next-wrap` 대신 패널 안에서 바로 접근. 세션333.

리플레이 버튼 등급별 노출: S/A — 없음, B — Cut 6 body 하단 작은 ghost 버튼, C/D — 등급 박스 안 큰 yellow 버튼. 세션333 (A 제거).

##### 6.3 모달 (.modal-card, .coupon-box)

현재: `box-shadow:0 8px 32px rgba(...)`
전환: `border:var(--border-w) solid var(--ink), box-shadow:8px 8px 0 var(--ink), border-radius:0`

##### 6.4 리포트 섹션

현재: `border:2px solid #111, box-shadow:0 2px 0 rgba(0,0,0,0.1)`
전환: `border:var(--border-w) solid var(--ink), box-shadow:var(--shadow)`
리포트 내부 배경: `#f8f8f8` → `var(--bg-soft)`

##### 6.5 인벤토리 (.inv-tab, .inv-card)

inv-tab: `border-radius:14px` → `0`, `box-shadow:-3px 3px 0 #111` → `-4px 4px 0 var(--ink)`
inv-card: `border-radius:8px` → `0`, `box-shadow:0 2px 0 #111` → `var(--shadow)`

##### 6.6 카드 보상 (.card-reward-card)

현재: `border-radius:12px, box-shadow:0 4px 0 #111`
전환: `border-radius:0, box-shadow:var(--shadow)`

##### 6.7 비용 박스

cost-box-effect: `border:#1a8c1a, background:#f3faf3, color:#1a8c1a` → mint 계열
card-chip: `color:#1a8c1a, background:#e8f5e9, border-radius:8px` → `--acc-mint, --acc-mint-soft, border-radius:0`

---

#### 7. 상단 패널 색상

##### 7.1 자원 바 (resource-bar)

변경 없음 (이미 2px→3px, 그림자 교체만).

##### 7.2 역량 바 (stats-bar)

bipolar-fill:
- positive: `#1a8c1a` → `var(--acc-mint-deep)` (#5fbf95)
- negative: `#c44` → `var(--acc-pink-deep)` (#d63f7a)

pending-dot (gauge-with-pending 래퍼 안, gauge 위 absolute 배치 — 0점과 정렬):
- positive: `#1a8c1a` → `var(--acc-mint)`, 0점 오른쪽에 배치
- negative: `#c44` → `var(--acc-pink)`, 0점 왼쪽에 배치
- pending-dots를 stat-header에서 분리 → gauge와 같은 너비로 50/50 분할하여 bipolar-zero와 정렬

##### 7.3 이미지 프레임 효과 (세션332)

문제: AI 생성 이미지가 정사각형이 아니고 크기도 제각각 — 테두리·여백이 다 달라서 지저분하게 보임.

적용 대상: 시나리오 패널 이미지(`.panel-image`) + 리포트 카툰 이미지(인라인 스타일, `11-report.js` L480) 두 곳 모두.

처리:
1. **이미지 크기 고정**: 컨테이너의 정사각형 크기에 맞춰 `width:100%; height:100%` + `object-fit:cover`. 시나리오 패널은 실제 이미지보다 크면 스트레칭 — 허용.
2. **흰색 inner border**: 정사각형 전체 크기로 5px 두께 흰색 내부 테두리를 이미지 위에 overlay. 지저분한 가장자리를 가린다.
3. **검정색 inner border**: 흰색 보더 위에 2px 검정색 내부 테두리 프레임.
4. 구현: `::after` pseudo-element로 `box-shadow: inset 0 0 0 5px #fff, inset 0 0 0 7px var(--ink)`. `pointer-events:none; z-index:1`.

---

#### 8. 모션

- 인터랙션: **50~80ms** transform. 짧고 단단하게.
- 누름: `translate(2px,2px)` + shadow 축소.
- ease: `cubic-bezier(0.2, 0.8, 0.2, 1)`. "있는 척하는 ease-out" 피함.
- v0.9의 `transition: all 0.2s` → `transition: transform 0.05s, box-shadow 0.05s`.

---

#### 9. 인라인 하이라이트 (새 패턴)

```css
.hl       { padding: 1px 8px; color: var(--ink); white-space: nowrap; }
.hl--y    { background: var(--acc-yellow); }
.hl--c    { background: var(--acc-cyan); }
.hl--m    { background: var(--acc-mint); }
.hl--p    { background: var(--acc-pink); }
```

한 문단에 **2~3색까지**. 같은 의미 카테고리 = 같은 색. 하이라이트 위 글씨 항상 검정.
적용 위치: texts.yaml 내 본문, 튜토리얼 안내문, 시나리오 인트로.

---

#### 10. 손글씨 폰트

```css
@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');
```

적용 위치: 힌트, 캐릭터 대사, 정답/오답 피드백의 한마디, 리포트 카툰 캡션.
- Cut 6 awareness: `font-family:var(--font-hand); font-size:22px`
- 리포트 시나리오별 피드백: `font-family:var(--font-hand); font-size:20px`
- 리포트 카툰 캡션: 이미 적용 (`font-family:var(--font-hand); font-size:20px`)
본문·헤더·버튼·태그에 절대 쓰지 않는다.

---

#### 11. UI 텍스트 분리 (Phase 7)

시나리오 콘텐츠 이외 모든 UI 텍스트가 `data/texts.yaml`에 집중. 코드에는 fallback만 남김.

**texts.yaml 구조** (258개 항목, 17 섹션):
- `humanCentricCards` / `domainCards` / `growthCards` / `cards` — 카드 정의
- `narrative` — 내러티브 (4유형, tier1 패턴, 카드 분포)
- `ui_messages` — 게임오버, 인벤토리, 카드리워드, 리셋 확인
- `report` / `growthReport` — 리포트
- `title_screen` — 타이틀 화면
- `start_screen` — 시나리오 선택 화면
- `game_flow` — 게임 진행 UI (질문, 버튼, 패널 라벨)
- `cost_labels` — 비용 표시 (시간/에너지/할인/최종)
- `hud` — 상단 패널 라벨
- `modals` — 레벨업, RP 분배
- `coupon` — 할인 카드 선택
- `recovery` — 회복력 특별 UI
- `config_texts` — 결과 유형별 텍스트, 등급별 무드
- `inventory_labels` — 인벤토리 섹션 라벨
- `scenario_report` / `final_report` — 리포트 확장

**JS 텍스트 헬퍼**: `_t(path, fallback)` — dot notation으로 TEXTS 접근, 없으면 fallback 반환.

**CSV 편집 워크플로우**:
```bash
python3 texts_to_csv.py          # texts.yaml → data/ui_texts.csv (258행)
# Google Sheets에서 편집
python3 csv_to_texts.py           # csv → texts.yaml 복원
python3 csv_to_texts.py --verify  # round-trip 검증
python3 build.py                  # 빌드
```

---

#### 12. 시나리오 데이터 CSV 편집 워크플로우 (Phase 8)

`data/scenarios.yaml` (9,604행, 5 시나리오)의 콘텐츠를 3 CSV로 분리해 스프레드시트 편집 가능하게 한다.

##### 12.1 CSV 구조

| CSV 파일 | 행 수 | 컬럼 수 | 내용 |
|----------|------|---------|------|
| `scenario_meta.csv` | 5 | 15 | 시나리오 메타 (제목, 상황 텍스트, domainPool, cuts 등) |
| `scenario_choices.csv` | 75 | 32 | tier1(15) + tier2(45) + review(15) 선택지, 텍스트, 밸런스, 비용, 결과 |
| `scenario_leaves.csv` | 135 | 45 | leaf별 전체 데이터 (finals, 리포트, 비용, 카드, axisDelta) |

**합계**: 215행, 3 CSV

##### 12.2 tier2 포맷 차이

| 시나리오 | tier2 방향성 표현 |
|----------|------------------|
| selfintro, groupwork, eorinwangja | `delta.afterA/B/C.delegation/knowledge` (중첩) |
| career, studyplan | 직접 `delegation`, `knowledge` 필드 |

CSV에서 두 포맷 공존: `delta_afterA_del` 등 6컬럼 + `delegation`/`knowledge` 2컬럼. rebuild 시 어느 쪽이 채워져 있는지로 자동 판별.

##### 12.3 특수 필드 처리

- **리스트 → 세미콜론(;) 구분**: domainPool, competencyCards, domainCards, matchGroups 등
- **cuts (dict)**: `1:상황 제시;2:1차 선택지;...` key:value 쌍
- **reportData**: finals 필드에서 자동 재생성 (중복 저장 X)
- **axisDelta**: leaf당 최대 1건. 해당 leaf 행에 requireCard/bonusPoint/note 컬럼
- **finals.item**: null 가능 (CSV 빈 셀 → YAML null)
- **finals.earnedCards**: 선택적 (CSV 빈 셀 → YAML에서 키 생략)

##### 12.4 워크플로우

```bash
# CSV 추출
python3 scenarios_to_csv.py              # scenarios.yaml → 3 CSV (data/ 폴더)
python3 scenarios_to_csv.py -o ~/Downloads/  # 지정 폴더로 출력

# Google Sheets에서 편집 → CSV 다운로드

# 통합 업데이트 (CSV → YAML → 빌드 한 번에)
python3 update.py                        # 텍스트 + 시나리오 CSV 전부 → 빌드
python3 update.py -i ~/Downloads/        # 덱스가 보낸 CSV 폴더 지정
python3 update.py --skip-texts           # 시나리오만
python3 update.py --verify               # 검증만 (빌드 안 함)
```

개별 실행도 가능:
```bash
python3 csv_to_scenarios.py              # 3 CSV → scenarios.yaml
python3 csv_to_texts.py                  # ui_texts.csv → texts.yaml
python3 build.py                         # 빌드
```

##### 12.5 v0.7 CSV와의 관계

v0.7에 있던 `yaml_to_csv.py`/`csv_to_yaml.py`는 `texts.yaml` 전용이었고, `data/exports/` 135행/45행 CSV는 읽기 전용 밸런스 검수용이었다. v1.0 Phase 8은 **양방향 round-trip** 편집 워크플로우로, scenarios.yaml 전체를 커버한다.

---

#### 13. 성장 리포트 독립화 (v1.1)

학기 종합 리포트를 게임 밖에서도 볼 수 있게 한다. 현재 `showFinalReport()`는 게임 안 localStorage 기반이라 브라우저를 닫으면 사라지고 다른 기기에서 접근 불가.

##### 13.1 두 단계

| Phase | 기능 | 서버 필요 | 구현 범위 |
|-------|------|----------|----------|
| **Phase 1** | PDF 다운로드 버튼 | X | 클라이언트만 |
| **Phase 2** | 독립 HTML 생성 → 놀공 서버 저장 → 영구 URL | O | 클라이언트 + 서버 API |

##### 13.2 리포트 데이터 스키마

게임 종료 시 gameState에서 추출하는 최소 데이터. 서버 저장과 PDF 모두 이 스키마를 기반으로 한다.

```javascript
var reportData = {
  v: "1.1",                    // 데이터 버전
  ts: "2026-05-13T10:00:00Z",  // 생성 시각
  name: "",                    // 학생 이름 (입력했으면)

  // 학기 요약
  totalScore: 350,
  level: 3,
  comp: { d: 5, k: -3 },      // delegation, knowledge (effective 값)
  compType: "pn",              // 4유형 코드

  // 시나리오별 히스토리
  hist: [
    { s: "selfintro", l: "A1R2", sc: 85, g: "A", t1: "A", t2: "A1", rv: "R2" },
    { s: "groupwork", l: "B2R1", sc: 70, g: "B", t1: "B", t2: "B2", rv: "R1" }
    // ... 5건
  ],

  // 카드 인벤토리
  inv: {
    hc: [{ a: "중심잡기", t: "주체성", s: "selfintro" }],  // humanCentricCards
    dc: [{ l: "자기이해", s: "selfintro" }],                // domainCards
    gc: [{ l: "회복력", s: "groupwork" }],                  // growthCards
    cc: [{ l: "검수능력", s: "career", st: "진로 탐색" }]   // competencyCards
  }
};
// 예상 크기: 400~800 bytes (JSON), gzip 후 ~300 bytes
```

데이터 추출 함수: `extractReportData()` — gameState → reportData 변환. 11-report.js에 추가.

##### 13.3 Phase 1 — PDF 저장 (window.print 단일 옵션 결정)

###### 13.3.1 채택안

리포트 화면 하단에 두 버튼만 배치:

```
[ 리포트 저장 (PDF) ]   |   [ 시작 화면 돌아가기 ]
   acc-yellow                acc-pink
```

- **PDF 저장**: `printReport()` → `window.print()` 호출. 학생이 다이얼로그에서 "PDF로 저장" 수동 선택
- **시작 화면**: 핑크. 분리된 종결 액션
- 두 버튼 모두 `.no-print` → 인쇄 출력에는 안 들어감

###### 13.3.2 Print CSS

`src/styles/11-print.css` — `window.print()` 호출 시 리포트 영역만 출력:
- 상단 패널/인벤토리/디버그/.no-print 숨김
- 카툰 시나리오별 page-break-inside: avoid
- 배경색·그림자 인쇄 활성화 (`-webkit-print-color-adjust: exact`)

###### 13.3.3 사용자 흐름

1. 학생 게임 완료 → 성장 리포트 화면
2. [리포트 저장 (PDF)] 클릭
3. 브라우저 print 다이얼로그
4. 대상: **"PDF로 저장"** 선택 → 저장 위치 지정 → 저장
5. 한 단계 추가는 있지만 출력 품질 깔끔, 학생 한글 정상, 게임 폰트 그대로


##### 13.4 Phase 2 — 보류

서버사이드 PDF/HTML 저장 + 영구 URL은 현재 본 빌드 범위 외. 필요 발생 시 별도 결정. 결정 기록은 [[DECISIONS.md]] 참조.
