## AI 리터러시 v1.1 — 개발자 핸드오프

**작성일**: 2026-05-13 (세션342 갱신)
**대상**: 동현공 (코드리뷰 + 런칭 점검)
**라이브 URL**: https://mice3nyc.github.io/ari_gitrepo_1/ai-literacy-delegation-boundary/v11/
**리포**: https://github.com/mice3nyc/ari_gitrepo_1

> v1.0 핸드오프 내용 + v1.1 변경사항. v1.0 → v1.1는 분기 + 성장 리포트 PDF 저장 기능 추가. **현재 서버사이드 구축은 보류**(클라이언트 단독 빌드).

---

### 1. 프로젝트 개요

고등학생/대학생 대상 AI 리터러시 교육 프로그램. 학생이 5개 시나리오(자기소개서, 모둠 발표, 어린왕자 독후감, 진로 탐색, 시험 공부)를 플레이하며, 각 시나리오에서 "AI에게 맡길 것 vs 직접 할 것"을 선택한다. 선택의 결과가 누적되어 학기 종합 성장 리포트가 생성된다.

**핵심 교육 메시지**: "위임의 경계" — AI에게 무엇을 맡기고 무엇을 직접 할지 판단하는 힘이 AI 리터러시의 핵심이다.

---

### 2. 기술 스택

| 항목 | 스택 |
|------|------|
| 프론트엔드 | 바닐라 JS + CSS, 프레임워크 없음 |
| 배포 | 단일 HTML 파일 (~864KB), GitHub Pages |
| 빌드 도구 | Python 3 (PyYAML) |
| 데이터 | YAML 3종 → 빌드 시 JS 변수로 주입 |
| 상태 관리 | localStorage (클라이언트 전용) |
| 이미지 | WebP, 130개 (별도 `../images/` 폴더, v06~v11 공유) |
| 폰트 | Paperlogy (CDN) + 나눔손글씨 펜 (Google Fonts) |
| PDF 출력 | 브라우저 `window.print()` + `@media print` CSS |

---

### 3. v1.0 → v1.1 변경 요약

| 항목 | 변경 |
|------|------|
| **storageKey** | `ai-literacy-delegation-boundary-v10` → `ai-literacy-delegation-boundary-v11` |
| **version** | v1.0 → v1.1 |
| **신규 기능** | 성장 리포트 PDF 저장 버튼 (window.print() 기반) |
| **신규 파일** | `src/styles/11-print.css` — 인쇄 전용 CSS |
| **신규 함수** | `11-report.js` 안 `printReport()`, `extractReportData()` |
| **리포트 하단 UI** | [리포트 저장 (PDF)] (노랑) + [시작 화면 돌아가기] (핑크) 2개 버튼 |
| **참고 보존** | `pdf-test/` 폴더 — 폐기된 PDF 라이브러리 프로토타입 (jsPDF/pdfmake) |

기능/밸런스/데이터 구조/디자인은 v1.0 그대로. v1.0 SPEC을 계승.

---

### 4. 파일 구조

```
v11/
├── index.html              ← 빌드 산출물 (배포용, 직접 수정 X)
├── build.py                ← 소스 → index.html 빌드
├── update.py               ← CSV → YAML → 빌드 통합 스크립트
│
├── src/                    ← 소스 코드
│   ├── index.shell.html    ← HTML 뼈대 (CSS/JS 주입 자리)
│   ├── styles/             ← CSS 12개 (파일명 순서로 연결)
│   │   ├── 00-base.css           전역 토큰, 리셋
│   │   ├── 01-hud.css            상단 자원/역량 바
│   │   ├── 02-choice-costs.css   선택지 비용 표시
│   │   ├── 03-overlays-and-board.css  오버레이, 게임 보드
│   │   ├── 04-choice-cards.css   선택지 카드
│   │   ├── 05-report-and-debug.css   리포트 + 디버그 + PDF 버튼 색 구분
│   │   ├── 06-scenario-select.css    시나리오 선택 화면
│   │   ├── 07-modals.css         레벨업/분배/할인 모달
│   │   ├── 08-inventory-and-rewards.css  인벤토리 + 카드 보상
│   │   ├── 09-gameover.css       게임 오버
│   │   ├── 10-paperlogy-reference-theme.css  Neo-Brutalism 테마
│   │   └── 11-print.css          ★ v1.1 신설 — @media print CSS
│   └── js/                 ← JS 15개 (파일명 순서로 연결)
│       ├── 00-config.js          설정값 + _t() 텍스트 헬퍼
│       ├── 01-data.generated.js  빌드 시 YAML 데이터 주입 자리
│       ├── 02-state.js           gameState 생성/초기화
│       ├── 03-engine.js          시나리오 진행 엔진 (컷 전환)
│       ├── 04-resources.js       자원(시간/에너지) 관리 + RP 분배
│       ├── 05-modals.js          레벨업/확인/리셋 모달
│       ├── 06-exp-level.js       경험치 + 레벨업
│       ├── 07-storage.js         localStorage 저장/불러오기
│       ├── 08-event-log.js       이벤트 추적 (분석용)
│       ├── 09-render-scenario.js 시나리오 렌더링 (선택지, 패널, 비용)
│       ├── 10-event-handlers.js  사용자 입력 핸들러
│       ├── 11-report.js          시나리오 리포트 + 학기 종합 리포트 + PDF 저장
│       ├── 12-debug.js           디버그 패널 (숨김)
│       ├── 13-inventory.js       역량 카드 인벤토리
│       └── 14-init.js            초기화 + UI 텍스트 바인딩
│
├── data/                   ← 콘텐츠 데이터
│   ├── scenarios.yaml      ← 5 시나리오 전체
│   ├── texts.yaml          ← UI 텍스트 전체 (258항목, 17섹션)
│   ├── cuts.yaml           ← 이미지 경로 매핑
│   ├── competency_cards.csv← 역량 카드 정의
│   │
│   ├── scenario_meta.csv       ← scenarios.yaml에서 추출 (5행)
│   ├── scenario_choices.csv    ← scenarios.yaml에서 추출 (75행)
│   ├── scenario_leaves.csv     ← scenarios.yaml에서 추출 (135행)
│   └── ui_texts.csv            ← texts.yaml에서 추출 (258행)
│
├── scenarios_to_csv.py     ← scenarios.yaml → 3 CSV 추출
├── csv_to_scenarios.py     ← 3 CSV → scenarios.yaml 복원
├── texts_to_csv.py         ← texts.yaml → CSV 추출
├── csv_to_texts.py         ← CSV → texts.yaml 복원
│
├── pdf-test/               ← ★ 참고 보존 (폐기된 시도, SPEC §13.3.3)
│   ├── jspdf-test.html     ← jsPDF 자동 다운로드 프로토타입 (폐기)
│   └── pdfmake-test.html   ← pdfmake 자동 다운로드 프로토타입 (폐기)
│
├── SPEC.md                 ← 디자인 상세 명세 (+ §13 성장 리포트 독립화)
├── PLAN.md                 ← 개발 단계 계획
├── TASKS.md                ← 작업 체크리스트
├── DESIGN-REGISTRY.md      ← Neo-Brutalism 디자인 레지스트리
├── SCENARIO-GUIDELINES.md  ← 시나리오 콘텐츠 가이드
├── PAPERLOGY-THEME-HANDOFF.md ← 폰트/테마 핸드오프
└── HANDOFF.md              ← 이 문서
```

---

### 5. 빌드 방법

```bash
cd _dev/ai-literacy-delegation-boundary/v11

# 기본 빌드 (src/ + data/ → index.html)
python3 build.py

# CSV에서 데이터 업데이트 후 빌드 (한 번에)
python3 update.py

# 외부 CSV 폴더 지정 (구글 시트에서 다운로드한 경우)
python3 update.py -i ~/Downloads/

# 검증만 (빌드 안 함)
python3 update.py --verify
```

**의존성**: Python 3 + PyYAML (`pip install pyyaml`)

**빌드 과정**:
1. `src/styles/*.css` 파일명 순서로 연결 (12개)
2. `src/js/*.js` 파일명 순서로 연결 (15개)
3. `data/scenarios.yaml` → `SCENARIOS` JS 변수
4. `data/cuts.yaml` → `CUT_IMAGES` JS 변수
5. `data/texts.yaml` → `TEXTS` JS 변수
6. `src/index.shell.html`에 CSS/JS/DATA 삽입 → `index.html` 출력

---

### 6. 데이터 편집 워크플로우

콘텐츠 수정은 YAML 직접 편집이 아닌 CSV 경유로 진행한다.

**시나리오 데이터** (5시나리오 × 27분기 = 135 leaf):
```
scenarios.yaml ─→ scenarios_to_csv.py ─→ 3 CSV (Google Sheets 편집)
                                              ↓
scenarios.yaml ←─ csv_to_scenarios.py ←── CSV 다운로드
                                              ↓
index.html     ←─ build.py ←─────────── scenarios.yaml
```

**UI 텍스트** (258항목):
```
texts.yaml ─→ texts_to_csv.py ─→ ui_texts.csv (Google Sheets 편집)
                                       ↓
texts.yaml ←─ csv_to_texts.py ←── CSV 다운로드
```

round-trip 검증: CSV→YAML→CSV 변환 후 원본과 diff 비교. `--verify` 플래그로 확인.

---

### 7. 게임 흐름

```
타이틀 → 튜토리얼(최초 1회) → 시나리오 선택
                                    ↓
           ┌─ CUT 1 (상황 제시) ─────────────────────┐
           │  CUT 2 (1차 선택 — tier1: A/B/C)        │  5 시나리오
           │  CUT 3 (1차 결과)                        │  반복
           │  CUT 4 (세부 상황)                       │
           │  CUT 5 (2차 선택 — tier2: V1/V2/V3)     │
           │  CUT 6 (결과 + 리뷰 선택 + 점수)         │
           └──────────────────────────────────────────┘
                                    ↓
              시나리오 리포트 → pending 흡수 → 카드 보상
              → 레벨업(조건부) → RP 분배 → 다음 시나리오
                                    ↓
              5개 완료 시 → 학기 종합 성장 리포트
                                    ↓
              [리포트 저장 (PDF)]  /  [시작 화면 돌아가기]  ← v1.1 신규
```

**선택 구조**: 3단 분기 (tier1 A/B/C × tier2 V1/V2/V3 × review R1/R2/R3 = 27 leaf/시나리오)
**점수 체계**: leaf별 고정 점수. 등급 S(95+)/A(85+)/B(75+)/C(60+)/D.
**자원**: 시간 100 + 에너지 100 고정. 선택마다 비용 소모. 자동 회복 없음.

---

### 8. 성장 리포트 PDF 저장 (v1.1 신규)

학기 종합 리포트 하단의 [리포트 저장 (PDF)] 버튼이 브라우저 인쇄 다이얼로그를 호출한다.

**구현 위치**:
- 함수: `src/js/11-report.js` 안 `printReport()` — `window.print()` 호출
- CSS: `src/styles/11-print.css` — `@media print` 블록 한 곳
- HTML: `showFinalReport()` 안 하단 액션 영역

**사용자 흐름**:
1. 게임 완주 → 학기 종합 리포트 화면
2. [리포트 저장 (PDF)] 클릭
3. 브라우저 print 다이얼로그
4. **대상: "PDF로 저장"** 선택
5. 저장 위치 지정 → 저장

**print CSS 처리**:
- `.no-print` 클래스: 상단 패널, 인벤토리, 디버그, 버튼 등 숨김
- `.report-overlay`: 모달 → 단순 흐름 변경
- 카툰 시나리오별 `page-break-inside: avoid`
- 배경색·그림자 인쇄 활성화: `-webkit-print-color-adjust: exact`

**`extractReportData()` 함수**: gameState에서 리포트 데이터를 평탄한 객체로 추출. 현재 호출되지 않으나, 추후 서버사이드 PDF 또는 외부 시스템 연동 시 사용 예정.

상세 명세: `SPEC.md` §13.

---

### 9. 상태 관리

```javascript
// localStorage key
'ai-literacy-delegation-boundary-v11'

// 저장 구조
{
  state: {
    currentScenarioId, currentTier, selectedTier1/2, selectedReview,
    competencies: { delegationChoice, knowledge },
    score, totalScore, itemsCollected, scenarioHistory,
    resources: { time: {current, max}, energy: {current, max} },
    exp: { current, level }, inventory, clearedScenarios, ...
  },
  at: "ISO timestamp"
}
```

게임 진행 상태 전체가 localStorage 한 키에 JSON으로 저장된다. 브라우저를 닫아도 유지되지만, 다른 기기에서는 접근할 수 없다.

---

### 10. 배포

현재 GitHub Pages로 배포. `git push` 시 자동 반영.

```
https://mice3nyc.github.io/ari_gitrepo_1/ai-literacy-delegation-boundary/v11/
```

이미지는 `../images/` 상대 경로로 참조 (v06~v11 공유).

---

### 11. 런칭 전 점검 항목

| 항목 | 상태 | 비고 |
|------|------|------|
| 5 시나리오 콘텐츠 | ✅ 완료 | YAML에 135 leaf 전체 데이터 |
| UI 텍스트 분리 | ✅ 완료 | texts.yaml 258항목, CSV 편집 가능 |
| 시나리오 데이터 CSV | ✅ 완료 | 3 CSV round-trip 검증 통과 |
| Neo-Brutalism 디자인 | ✅ 완료 | Phase 1~6 전체 적용 |
| 점수/밸런스 | ✅ 완료 | 비용 배율 1.25, 바닥값 폐지 |
| 역량 카드 시스템 | ✅ 완료 | 인간중심 12종 + 도메인 10종 + 성장 12종 |
| 할인 쿠폰 UX | ✅ 완료 | 무신사 쿠폰 모델, 수동 적용 |
| 이미지 | ✅ 130개 webp | 5시나리오 × 컷별 이미지 |
| **PDF 저장** | ✅ 완료 (v1.1) | window.print() 기반. 학생 수동 "PDF로 저장" |
| 5시나리오 완주 플테 | ⬜ 미완료 | 전체 흐름 통합 테스트 필요 |
| 모바일 뷰포트 | ⬜ 미점검 | 반응형 대응 확인 필요 |
| 서버사이드 저장 | ⬜ 보류 | Phase 2 (놀공 서버). 본 빌드 범위 외 |

---

### 12. 알려진 제약 + 폐기 결정

1. **클라이언트 전용**: 서버 없음. 모든 데이터가 브라우저 localStorage에 저장. 기기 변경/브라우저 초기화 시 데이터 손실.
2. **단일 HTML**: 빌드 산출물이 ~864KB 단일 파일. 이미지만 외부 참조.
3. **데이터 노출**: 시나리오 정답/점수가 클라이언트 코드에 포함됨. 의도적으로 보안하지 않음 (교육 콘텐츠).
4. **이벤트 로그**: `08-event-log.js`가 플레이 이벤트를 localStorage에 기록. 서버로 전송하는 구조 없음.
5. **PDF 저장 한계**: 학생이 print 다이얼로그에서 "PDF로 저장"을 수동 선택해야 함. 원클릭 자동 다운로드 아님.

**폐기된 시도** (참고용 — `pdf-test/` 폴더와 SPEC §13.3.3):

| 시도 | 폐기 사유 |
|------|----------|
| html2pdf.js (canvas) | 출력 품질 미달, 이미지·레이아웃 무너짐 |
| jsPDF + Paperlogy ttf | 한글 글리프 빈 출력 |
| jsPDF + NanumBarunGothic 4MB | 본 게임 통합 시 한글 출력 실패 |
| jsPDF/pdfmake + 폰트 임베딩 없음 | 한글 깨짐. OS별 시스템 폰트 차이로 통일 불가 |

**근본 결론**: 클라이언트 라이브러리는 폰트 임베딩 필요·라이브러리별 글리프 매핑 실패·OS 폰트 차이로 통일된 한글 출력 어려움. 원클릭 자동 다운로드는 서버사이드 렌더링(Puppeteer 등)이 깔끔. **현재 본 빌드에서는 보류**.

---

### 13. 코드 읽기 가이드

**진입점**: `14-init.js` → `DOMContentLoaded` → `initGame()`

**핵심 흐름**:
1. `initGame()` → localStorage에서 이전 상태 복원 or 새 게임 생성
2. `showScenarioSelect()` → 시나리오 선택 화면
3. `startScenario(id)` → `goCut(1)` → 순차 진행
4. `showChoices()` → tier1/tier2/review 선택
5. `confirmChoice()` → 점수 계산 + 자원 소모
6. `showReport()` → 시나리오 리포트
7. `goNextScenario()` → 다음 시나리오 or `showFinalReport()`
8. `printReport()` → 브라우저 print 다이얼로그 (v1.1 신규)

**데이터 접근**:
- `SCENARIOS[시나리오ID]` — 시나리오 데이터
- `TEXTS` — UI 텍스트 (`_t('경로.키', '폴백')` 헬퍼로 접근)
- `gameState` — 런타임 게임 상태
- `extractReportData()` — gameState → 평탄한 리포트 객체 (현재 미호출, 추후 사용 예정)

---

### 14. 관련 문서

| 문서 | 내용 |
|------|------|
| `SPEC.md` | v1.0 디자인 상세 + §13 성장 리포트 독립화 (v1.1 추가) |
| `DESIGN-REGISTRY.md` | Neo-Brutalism 디자인 원칙 + 체크리스트 |
| `SCENARIO-GUIDELINES.md` | 시나리오 콘텐츠 가이드 (분기 구조, 점수 철학) |
| `src/README.md` | 소스 레이아웃 요약 |
| `PLAN.md` | 개발 Phase 구조 |
| `TASKS.md` | Phase별 작업 체크리스트 |
| `PAPERLOGY-THEME-HANDOFF.md` | 폰트/테마 핸드오프 |

---

### 15. 코드리뷰 포인트 제안

동현공이 살펴보면 좋을 부분:

1. **`11-report.js`의 `printReport()` + `extractReportData()`** — v1.1 신규. 단순한 구조지만 `extractReportData()`는 추후 외부 연동을 가정해 작성.
2. **`11-print.css`** — print 출력 시 보일/안 보일 요소 선택. `.no-print` 클래스 적용 규칙.
3. **`07-storage.js`** — storageKey 한 키에 전체 gameState 직렬화. 데이터 손실 시나리오 검토 가치.
4. **`08-event-log.js`** — 현재 localStorage 한 키에만 누적. 추후 서버 전송 가능성.
5. **빌드 파이프라인** (`build.py` / `update.py`) — Python + YAML + CSV 다단계 파이프라인. 단일 HTML 산출.
