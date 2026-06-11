## SPEC — v1.3-mid (중등)

**최종 업데이트**: 2026-06-08 (v1.2-mid에서 분기 — 1차 교사 피드백 반영 착수)
**PLAN**: [[PLAN|PLAN.md]] / **TASKS**: [[TASKS|TASKS.md]] / **DESIGN**: [[DESIGN-REGISTRY|DESIGN-REGISTRY.md]]
**스타일 가이드 원본**: [[AI 리터러시 게임 — 스타일 가이드]]
**요청 노트**: [[요청.26.0608.0851-AI리터러시교사반영]]

> v1.2 SPEC을 계승. 기능/밸런스/데이터 구조/디자인은 v1.1~v1.2 SPEC 참조.
> 이 빌드(v1.3-mid)는 중등용 — 1차 교사 검토(5명) 피드백을 반영하는 작업 빌드. 초등용은 중등 수리 완료 후 v13-elem로 분기.
> v1.3 신규 명세는 §14 이하 (진행 상태 복원 + 재도전 노출). 본문 §0~§13은 v1.1~v1.2 시점 그대로.

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

---

#### 14. 진행 상태 복원 + 재도전 노출 (v1.3 — 1차 교사 피드백)

1차 교사 검토(5명)에서 나온 "진행 상태가 끊긴다 / 완료 후 재진입이 막힌다" 계열을 묶어 처리한다. 셋 다 새 엔진을 짜지 않고 이미 구현된 함수를 진입점에 연결하는 작업이다.

##### 14.1 새로고침 시 현재 위치 복원 (최서연샘)

- **문제**: 시나리오 진행 중 새로고침하면 진행 데이터(자원·결과·클리어 기록)는 `loadGame()`으로 복원되나, 화면은 무조건 홈(`showStartScreen`) 또는 타이틀로만 진입한다. 시나리오 한복판이어도 그 안으로 돌아가지 않는다.
- **원인**: `14-init.js`의 `initEntry`가 `tutorialSeen`/`clearedScenarios` 유무로 홈·타이틀 두 갈래만 분기. 진행 중 시나리오로 복귀하는 분기가 없음.
- **해결**: `initEntry` 맨 앞에 분기 추가 — `saved && saved.currentScenarioId && !saved.completed`이면 `continueGame()` 호출 후 return. `continueGame`은 `renderCut1 → selectedTier1 → showCut2Summary → ... → goCut6`로 **컷 단계까지 복원**하는, "이어서 진행" 버튼이 이미 쓰는 검증된 함수.
- **결과**: 새로고침 = 하던 자리로 복귀. "처음부터 다시"는 §14.3 경로로 분리.
- **AC**: 각 컷(1~6) 진행 중 새로고침 → 같은 컷 화면으로 복귀. 완료 상태(`completed`)면 기존대로 홈(리포트 버튼). 미시작이면 타이틀.

##### 14.2 완료 시나리오 재도전 — 대시보드 노출 (사성진샘)

- **문제**: 최종 결과를 보고 대시보드로 빠져나오면 시나리오가 `clearedScenarios`에 들어가 완료 카드가 **클릭 비활성**(`clickAttr=isCleared?'':...`). 재도전 엔진(`replayScenario`)은 시나리오 끝 화면·회복력 모달에만 노출돼, 그 순간을 지나치면 재진입 경로가 사라진다.
- **재도전 엔진(이미 구현, `replayScenario`)**: 해당 시나리오의 점수·역량·EXP·획득 카드·자원을 **시나리오 시작 전으로 정확히 롤백**(누적 영향 역산, 도전력 카드만 보상으로 유지), `resourceSnapshot`으로 자원 원복, 직전 최고 기록을 `replay[scid].bestScore`/`bestGrade`로 보관.
- **해결**: `showStartScreen`의 완료 카드를 비활성 대신 **(a) 기존 등급/점수 뱃지 표시**(`replay[scid].bestGrade` + `bestScore`) **+ (b) "재도전" 버튼**(`replayScenario(scid)` 연결)으로 바꾼다.
- **재도전 진입 확인**: 이전 기록이 롤백되므로 확인 모달을 거친다(기존 점수는 `bestScore`로 보존되어 비교 표시되니, 문구는 "기록을 지우는" 것이 아니라 "다시 도전" 톤).
- **AC**: 완료 카드에 등급·점수 보임 → "재도전" 클릭 → 확인 → 해당 시나리오 Cut 1부터 재시작. 학기 전체 진행(다른 완료 시나리오)은 유지.

##### 14.3 전체 초기화 — 숨김 노출 (피터공 결정)

- **"처음부터 다시"** = 전체 기록 초기화(`confirmReset` → `clearGame`). 파괴적이라 우발 사용을 막아 **눈에 덜 띄는 곳**에 둔다(피터공 결정, 6/8).
- **위치**: 역량 카드 인벤토리 패널(`toggleInventory`) **하단에 작은 "처음부터 다시" 버튼**. 클릭 시 기존 `reset-confirm-modal`로 확인 후 초기화. 새 설정/메뉴 UI는 만들지 않음(현재 없음, 인벤토리 패널이 상시 노출되는 가장 가까운 자리).
- **§14.2와 구분**: §14.2는 한 시나리오만 재도전(학기 진행 유지), §14.3은 전체 학기 기록 초기화.
- **AC**: 인벤토리 패널 하단 버튼 → 확인 모달 → 확정 시 전체 초기화 후 타이틀/홈 진입.

##### 14.4 시나리오 선택 카드 라벨 정리 (피터공 6/8)

- **문제**: 미완료 카드의 '다음 추천 →'/'자유 선택' 마크가 어수선하고 의미 전달이 약하다.
- **해결**: 다음 추천(`isNext`) 카드만 **하늘색 "PLAY" 배지**(`.sc-play` — `#1e90ff` 배경 + 검정 2px 테두리 + offset shadow). 그 외 미완료 카드는 마크 없음('자유 선택' 라벨 제거 — 순서 무관 진입은 그대로 가능). 완료 카드는 §14.2 등급 뱃지 + 재도전 버튼.
- 배지 문구는 `start_screen.mark_play`(기본 'PLAY', 'PLAY'/'시작' 교체 용이).
- **AC**: 다음 추천 카드에만 PLAY 배지, 나머지 미완료 카드는 라벨 없음. 완료 카드는 등급+재도전.

#### 15. 판단하는 힘(delegation) 부호 데이터 규칙 (v1.3 — S3 기획 수정, 6/10)

교사 피드백 S3 대응 점검에서 발견된 delegation 부호 이상 2건의 데이터 수정. 코드 변경 없음, `data/scenarios.yaml`만 수정. 결정 배경: 볼트 [[26.0610 AI리터러시 S3 점검 — 할인 UI·카드 획득·명칭 현황과 수정안]].

##### 15.1 1차 선택 부호 재배치 — A +, B 0, C − (전 시나리오)

- **문제**: 기존 A +, B −, C 0. "AI 도움으로 시작"(B, 부분 위임)이 "회피·통째 맡김"(C)보다 나쁘게 매겨진 역전. 다섯 시나리오 모두 동일했음.
- **규칙(피터공 확정 6/10)**: 판단하는 힘 = 위임 판단의 질. **B는 위임을 시도한 판단이므로 중립(0)** — 질은 2차가 가른다(빈손 의존 B1 −, 재료 주고 섞기 B3 ++). **C는 판단의 회피이므로 이 축의 최저(−)**.
- **적용**: 5개 시나리오 tier1 — B `-`→`0`, C `0`→`-` (10셀). A는 + 유지.

##### 15.2 어린왕자 C3 delegation + → −

- **문제**: "유명한 문장이나 분위기만으로 독후감을 쓴다"가 + 였음. 같은 경로의 결말이 등급 D·knowledge − 라 한 결말 안에서 자기모순.
- **규칙**: C3 계열의 + 는 재소유 행동이 있을 때만(자기소개글 C3 "AI 글을 내 글로 다시 쓴다"). 회피+남의 평판 의존은 −.
- **적용**: eorinwangja tier2 C3 delta afterA/B/C delegation 모두 `-` (knowledge는 무변경).

##### 15.3 부호 강도(`++`/`--`)는 현재 죽은 표기 — ±2 활성화 보류

- `getAxisDelta`(`00-config.js:88`)가 `++`/`+`를 모두 +1로 변환. 데이터의 강도 구분은 의도 기록으로만 존재.
- **결정(6/10, 갈래 1)**: 이번 라운드 ±1 유지. ±2 활성화(갈래 2)는 게이지(±10)·할인·유형판정(midZone ±2) 연쇄 재조정이 필요해 **S1 자원 재밸런싱과 묶어 후속 결정**.
- 진로·시험2주전의 afterX 분화 부재는 ±1 체제에서는 기계적 차이 없음 — 분화 패턴 보강안은 결정 로그 노트 참조(피터공 검토 대기).

#### 16. 평가 정합 규칙과 자동 검사 (v1.4 — 논리정합/밸런스 Phase 1~2, 6/10)

결말 135개의 출력(등급·점수·델타·카드)이 전부 수기 대응표라 섞인 경로에서 일관성이 샌다. 이 절은 **합성 규칙을 기계 검사 가능한 형태로 명세**하고, 린터(`scripts/check_consistency.py`)가 이 절을 그대로 구현한다. 결정 배경: `PLAN-logic-balance.md` Phase 0(D-1 카드=선택 기준, D-2 검토 차등, D-3 6/19 범위) + 볼트 [[26.0610 AI리터러시 최종 빌드 — 기획 수정 결정 로그]].

> ⚠️ 6/11 카드 선택별 획득 전체 적용(SPEC-card-per-choice.md §5) 이후 **역량카드 런타임 지급은 finals가 아니라 선택 시점 규칙 엔진**이 한다. finals의 카드 필드(humanCentric*/domainCards)는 데이터 기준치로 유지되며 R3·R4 검사는 계속 유효. 회복력·도전력만 결말 지급.

##### 16.1 용어와 검사 대상

- **경로(leaf)**: tier1(A/B/C) × tier2(1/2/3) × review(R1/R2/R3) = 시나리오당 27, 전체 135. leaf ID 예: `B2R3` = tier1 B → tier2 B2 → 검토 R3.
- **등급 사다리**: `D < C < B < A < S` (높을수록 좋음).
- **카드 모델(새 모델, 라이브)**: 인간중심 3축(중심잡기·융합하기·성찰하기) × 12태그 + 도메인 10종(자기이해·표현력·문해력·분석력·검토력·자료판단력·소통력·협업력·학습력·탐색력) + 성장 2종(회복력·도전력) = 학생 실수령 24장. 축은 카테고리(카드 아님). 정본: `data/exports/검토_260609/역량카드_새모델+레거시.csv`. ⚠️ scenarios.yaml의 시나리오 레벨 `domainPool`·`competencyCards`는 레거시 19종 기준의 죽은 데이터 — 검사 기준으로 쓰지 않는다.
- **행동 태그(discountTags)**: 각 선택지(tier1·tier2·review)에 붙은 `{humanCentric: 축명, domain: [도메인...], strongDomain: [...]}`. **경로 태그 풀** = 그 leaf를 만든 세 선택지의 discountTags 합집합. D-1 원리("카드는 결말이 아니라 선택에서 나온다")의 기계적 대응물.
- **leaf 카드 필드**: `cardEarned`(bool), `humanCentricAxis`, `humanCentricTag`, `domainCards[]`, `growthCard`.
- **leaf 델타 표기**: `delegation`·`knowledge` ∈ {`--`,`-`,`0`,`+`,`++`} (경로 누적 표기, 표시용).

##### 16.2 규칙 명세

| ID | 규칙 | 검사 식 | 상태 |
|----|------|---------|------|
| R1 | **검토 단조성** — 같은 tier2 가지(X1·X2·X3 동일, R만 다름) 안에서 검토가 깊을수록 나빠지지 않는다 | XR1→XR2→XR3 순으로 ① 등급 비하락 ② score 비하락 ③ 역량카드 수 비하락. 카드 수는 **실지급 기준**(cardEarned=false면 0, 아니면 인간중심 태그 1 + domainCards 수) — 필드에 값이 있어도 게이트가 꺼져 있으면 플레이어는 못 받는다 | 채택 |
| R2 | **델타-등급 정합** — 두 힘 부호와 등급의 정면 모순 금지 | delegation·knowledge 둘 다 {+,++} 인데 grade=D → 위반 / 둘 다 {-,--} 인데 grade∈{A,S} → 위반 | 채택 |
| R3a | **D 결말 카드 규약** — D는 역량카드 0 + 회복력 | grade=D → humanCentricTag·domainCards 비움 ∧ growthCard=회복력. ⚠️ cardEarned는 false가 아니라 **true가 정상** — 성장카드 포함 모든 finals 카드 지급의 게이트(`03-engine.js:89`)라 D도 회복력을 주려면 켜져 있어야 한다 | 채택 |
| R3b | **카드 지급선** (6/10 저녁 피터공 "마무리까지 잘해야" 반영) — B 이상 = 역량카드 1장 이상(검토 무관) / **C = 검토가 가른다**: R1(생략)이면 역량카드 0, R2·R3면 1장 이상 / D는 R3a | grade≥B → 실지급 카드 1+ ∧ grade=C: R1이면 실지급 0, R2·R3면 실지급 1+. cardEarned=false인데 카드 필드에 값이 있으면 플레이어에게 영영 안 가는 죽은 데이터 — 같은 규칙으로 걸린다. 데이터 전수 근거: B 이상 54/54 카드, C+R2·R3 11/13 카드(無 2곳=게이트 꺼짐), C+R1만 4:3 혼재 → 무카드로 통일 | 채택 |
| R3c | **카드-행동 정합(D-1)** — 카드는 경로의 행동 태그 풀 안에서만 | humanCentricAxis ∈ 경로 태그 풀의 humanCentric 집합 ∧ domainCards ⊆ 경로 태그 풀의 domain∪strongDomain | 채택 |
| R4 | **카드 라벨 정합** — 24장 모델에 있는 라벨만 | humanCentricAxis ∈ 3축 ∧ humanCentricTag ∈ 12태그 ∧ 태그가 그 축 소속 ∧ domainCards ⊆ 도메인10 ∧ growthCard ∈ {빈값, 회복력, 도전력} | 채택 |
| R5 | **검토 무차별 금지(D-2)** — 세 검토가 결과적으로 동일하면 차등 실패 | 같은 tier2 가지에서 R1·R2·R3 leaf의 (score, knowledge 델타, 카드 구성) 3종이 전부 동일 → 위반. 수치 스킴(넘기기 0/손보기 절반/검토 온전)은 Phase 3 정비 표에서 확정 | 채택 |
| R8 | **1차 부호 규칙(§15.1)** — A +, B 0, C − | 전 시나리오 tier1: A.delegation=`+` ∧ B.delegation=`0` ∧ C.delegation=`-` | 채택(적용 완료, 회귀 가드) |
| R6 | 5분면 시그니처 — 선택지 의미 유형과 비용 칸 일치 | 가설표(`검토_260610/선택지_5분면_1차가설_45행.csv`) 대조 | 보류(Phase 5 재밸런싱 패키지) |
| R7 | 맥락 의존 — aiSuitability별 칸 평가 | aiSuitability 배선 후 | 보류(차기) |
| R9 | **텍스트-경로 정합** (6/10 저녁 피터공) — 결말 텍스트(만화 캡션·피드백·요약)가 실제 경로와 모순 금지: AI를 안 고른 경로인데 AI 산출물 전제 서술 / 통째 위임인데 직접 쓴 듯한 서술 / R1인데 검토했다는 말 등 | 기계 검사 한계 → 2층: ① 백도 시나리오별 전수 정독 대조표(우선) ② 휴리스틱 플래그(차기, 후보만). S2 시나리오 검토(만화컷)와 한 묶음 | 채택(백도 트랙) |

##### 16.3 린터 운영

- **스크립트**: `scripts/check_consistency.py` — `data/scenarios.yaml` 로드 → 채택 규칙(R1·R2·R3a/b/c·R4·R5·R8) 전수 검사.
- **출력**: ① 콘솔 요약(규칙별 위반 수) ② `data/exports/consistency_report.md`(위반 전수, 사람 읽기) ③ `data/exports/consistency_report.csv`(시나리오·leaf·규칙·내용 — 분류 작업용).
- **의도 예외(allowlist)**: `data/consistency_exceptions.yaml` — `- {rule: R1, scenario: groupwork, leaf: B2R3, reason: "..."}` 형식. 등록된 위반은 리포트에서 "예외(사유)"로 분리 표기. **예외가 보이는 상태**를 유지한다(숨기지 않음).
- **빌드 연결**: `update.py` 마지막에 린터 실행, 위반 수를 경고로 출력. **빌드 차단은 하지 않는다** (정비 완료 전까지 위반이 존재하는 게 정상 상태).
- **종료 코드**: 위반 0(예외 제외)이면 0, 있으면 1 — 단독 실행 시 스크립트로 후킹 가능하게.
- 초등 분기(v13-elem) 데이터 검증에 동일 린터 재사용 예정.
