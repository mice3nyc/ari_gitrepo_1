# DESIGN REGISTRY — v0.8

> **이 문서의 목적**: CSS 수정 시 건드리지 말아야 할 확정 값을 기록한다.
> 수정 전에 이 문서를 읽고, 수정 대상 섹션만 변경하고, 나머지는 보존한다.
> 코드 변경 후 이 문서도 동기화한다.

## 수정 프로토콜

1. **수정 전**: 이 문서에서 해당 섹션의 확정 값을 확인
2. **수정 중**: Edit의 old_string은 해당 섹션 내부만. 인접 섹션 코멘트를 넘지 않는다
3. **수정 후**: 변경한 속성만 이 문서에 갱신. 나머지 값이 보존되었는지 diff로 확인
4. **검증**: `grep -c` 로 수정 전후 섹션 구분자(`/* =====`) 개수가 동일한지 확인

---

## 글로벌

| 속성 | 값 | 비고 |
|------|-----|------|
| font | `Paperlogy`, -apple-system, Noto Sans KR | CDN import |
| background | `#f5f5f5` | body |
| color | `#111` | body 기본 |
| container max-width | `1100px` | padding 0 24px 80px |

## 색상 팔레트 (확정)

| 용도 | 색상 | 사용처 |
|------|------|--------|
| 기본 텍스트/border | `#111` | 전역 |
| 양수/긍정 | `#1a8c1a` | stat, gauge, cost-effect |
| 음수/부정 | `#c44` | stat, gauge, cost-main, gameover |
| 비활성 텍스트 | `#888` | label, meta |
| 연한 비활성 | `#ccc`, `#ddd` | border, divider |
| 레벨업 강조 | `#b58900` | lvup badge, arrow |
| 레벨업 배경 | `#fff8d0`, `#fffceb` | lvup transition |
| 키워드-시간 | `#1976d2` | tutorial kw-time |
| 키워드-에너지 | `#e65100` | tutorial kw-energy |
| 키워드-위임 | `#6a1b9a` | tutorial kw-delegation |
| 키워드-문해력 | `#2e7d32` | tutorial kw-knowledge |

## 공통 패턴 (확정)

| 패턴 | 값 | 사용처 |
|------|-----|--------|
| box-shadow 기본 | `0 2px 0 #111` | resource-bar, stats-bar, score-display, inv-card |
| box-shadow 버튼 | `0 2px 0 #000` | start-btn, next-btn, advance-btn, lvup-confirm |
| border 기본 | `2px solid #111` | panel.active, report-stat-box, modal-card 등 |
| border 비활성 | `1px dashed #ccc` | panel 기본, divider |
| transition timing | `cubic-bezier(0.34,1.56,0.64,1)` | gauge fill, pending-dot, inv-panel |
| button active | `box-shadow:none; transform:translateY(2px)` | 모든 버튼 |
| button hover | `background:#444` 또는 `#333` | 대부분 |

---

## 섹션별 레지스트리

### L13 — Resource Header Bar
- 현재 비어 있음 (섹션 코멘트만 존재)

### L14~16 — Panel Row (좌우 분할 컨테이너)
| 속성 | 값 |
|------|-----|
| display | none → flex (`.visible`) |
| position | sticky, top:0, z-index:100 |
| max-width | 1100px |
| background | transparent |

### L18~25 — 경험치 + 레벨 (좌측 상단)
| 속성 | 값 |
|------|-----|
| exp-level font | 15px / 700 |
| exp-bar height | 6px |
| exp-bar-fill bg | `#111` |
| exp-bar-fill transition | width 0.6s cubic-bezier |
| exp-num font | 10px / `#888` |

### L27~29 — 레벨업 애니메이션
| 속성 | 값 |
|------|-----|
| keyframe | flashLevelUp: #fff8d0 → #fff3a0 → #fff |
| duration | 0.8s ease |

### L31~46 — 좌측 패널 (자원 게이지, 단방향)
| 속성 | 값 |
|------|-----|
| resource-bar border | 2px solid #111 |
| resource-bar bg | #fff |
| resource-name font | 11px / #555 / 600 |
| resource-num font | 15px / 700 |
| gauge height | 8px |
| gauge border | 1px solid #bbb |
| gauge-fill bg | #555 |
| change-indicator up | #1a8c1a |
| change-indicator down | #888 |
| flash-up | flashGreen (rgba(26,140,26,0.12)) |
| flash-down | flashGray (rgba(80,80,80,0.10)) |

### L47~84 — 우측 패널 (역량 양방향 + 점수)
| 속성 | 값 |
|------|-----|
| stats-bar gap | 6px |
| stats-bar padding | 6px 10px |
| stat-name font | 11px / #555 / 600 |
| stat-num font | 16px / 700 |
| bipolar-gauge height | 8px |
| bipolar-gauge bg | #f5f5f5 |
| bipolar-zero | left:50%, 1px, #111 |
| positive fill bg | #1a8c1a |
| negative fill bg | #c44 |
| bipolar-labels font | 8px / #aaa |
| changeFloat duration | 1.8s |
| numPulse | scale(1) → 1.4 → 1, 0.5s |
| score-stat | 12px/700, bg:#111, color:#fff |

### L79~84 — 시나리오 progress-strip
| 속성 | 값 |
|------|-----|
| border | 1.5px solid #111 |
| bg | #fafafa |
| cut font | 13px/700, num 18px/800 |
| items font | 12px / #555 / 600 |
| items border | 1px solid #aaa |

### L86~94 — 중앙 LV/SCORE 디스플레이
| 속성 | 값 |
|------|-----|
| min-width | 180px |
| panel-title | 15px/700, letter-spacing:3px |
| display-label | 9px / #888 / letter-spacing:1.5px |
| display-num | 34px / 700 |
| score-vsep | 1px / 46px / #ddd |

### L96~119 — 선택지 비용 표시 (4박스 + 공식형)
| 속성 | 값 |
|------|-----|
| cost-box-main | 38x36, 1.5px #c44, bg:#fff5f5, 18px/700 #c44 |
| cost-box-effect | 34x32, 1.5px #1a8c1a, bg:#f3faf3, 14px/700 #1a8c1a |
| cost-box-effect.penalty | border:#c44, bg:#fff5f5, color:#c44 |
| cost-formula-box | flex-row, 시간·에너지 좌우 배치 (세션310 레이아웃 변경) |
| cost-formula-val | 박스 제거, inline 12px/700 색 글씨만 (세션310) |
| cost-formula-raw | color:#c44 |
| cost-formula-discount | color:#1a8c1a |
| cost-formula-final b | 14px / 800 / #111 |
| cost-formula-line:first-child | border-right:1px solid #ccc (좌우 구분선) |

### L121~133 — Overlay (Start)
| 속성 | 값 |
|------|-----|
| min-height | 480px |
| card-inner max-width | 480px |
| h1 font | 22px / 700 |
| start-btn | bg:#111, padding:14px 40px, 14px |
| start-btn.secondary | bg:#fff, color:#111 |

### L135~138 — Binder
| 속성 | 값 |
|------|-----|
| height | 60px |
| bg-image | repeating-linear-gradient (줄무늬) |
| title font | 12px / 700 / letter-spacing:1.5px |

### L140~143 — 6-Cut Panel Grid
| 속성 | 값 |
|------|-----|
| grid | repeat(3, 1fr) |
| gap | 12px |

### L145~162 — Panel
| 속성 | 값 |
|------|-----|
| min-height | 380px |
| border 기본 | 1px dashed #ccc |
| border active | 2px solid #111, bg:#fff |
| panel-image aspect | 1/1 |
| cut-label | 48px / 200 / #ddd |
| cut-num | 10px / 700 / #999 |
| panel-body | 13px / 1.5 |
| advance-btn | bg:#111, padding:8px 24px, 12px |

### L164~200 — Choice Cards
| 속성 | 값 |
|------|-----|
| border | 2px solid #111 |
| shadow | 0 2px 0 #111 |
| hover | translateX(4px) |
| choice-card | flex-direction:column (세션310: 세로 바→헤더+바디 구조) |
| choice-header | flex, gap:8px, padding:9px 12px |
| choice-num | 24x24 inline-flex, bg:#111, 12px/700 (세션310: 인라인 박스로 변경) |
| choice-text | 15px / 700 (세션310 격상: 선택 텍스트 1순위) |
| choice-desc | 11px / #888 |
| choice-narrative | 12px / #222, border-left:2px solid #111 |
| score-breakdown border | 2px solid #111 |
| score-step-pts | 13px / 700 / #1a8c1a |
| delegation-tag | 10px / 700 / bg:#f0f0f0 / border:1px #ccc |
| disabled opacity | 0.45 |
| insufficient-tag | bg:#c44 / #fff / 10px |

### L202~204 — Result Block
| 속성 | 값 |
|------|-----|
| border | 2px solid #111 |
| bg | #fafafa |
| font | 13px / 1.5 |

### L206~218 — Final Block
| 속성 | 값 |
|------|-----|
| grade S/A color | #1a8c1a |
| grade B color | #111 |
| grade C color | #e65100 |
| grade D color | #c44 |
| grade font | 48px / 700 |
| awareness | border-left:3px solid #111, bg:#fafafa |

### L220~225 — Next Button
| 속성 | 값 |
|------|-----|
| padding | 10px 28px |
| font | 13px |
| transition | opacity 0.4s |

### L227~296 — Report (학기 종합)
| 속성 | 값 |
|------|-----|
| report-inner max-width | 540px |
| report-v813 max-width | 1040px |
| report-grid | 2컬럼 |
| report-grid-4 | 4컬럼 |
| comic-panel | 160px 고정 |
| comic-panel-prize | 107px |
| comic-caption font | 12px / 1.5 / #333 |
| report-cards-grid | 3컬럼 (720→2, 480→1) |
| report-card-count | 16px / 800 / #fff / bg:#888 / min-width:42px |
| report-card-label | 13px / 700 |
| report-narrative border | 1.5px solid #111 |
| narrative-cardtype | 15px / 800 / bg:#111 / #fff |

### L298~307 — Debug
| 속성 | 값 |
|------|-----|
| debug-panel bg | #1a1a1a |
| max-width | 420px |
| font | 11px / monospace |
| version | fixed / bottom:6px left:12px / 10px / #ccc |

### L309~316 — 반응형 (max-width:800px)
| 속성 | 값 |
|------|-----|
| panels-grid | 1fr |
| panel-row | column |
| display-num | 28px (축소) |

### L317~363 — 시나리오 선택 + 학기 프로그레스
| 속성 | 값 |
|------|-----|
| semester-frame max-width | 640px |
| h1 font | 22px / 700 |
| progress-bar height | 8px |
| progress-dot | 8px / 50% radius |
| scenario-card.next border | 2px solid #111 |
| action-main | 18px 56px / 16px / 700 / letter-spacing:2px |
| confirm-destructive | bg:#c44 / border:#c44 |

### L365~391 — Pending 원 마커
| 속성 | 값 |
|------|-----|
| 좌우 분할 | flex:0 0 50% 각각 |
| dot size | 11px |
| positive bg | #1a8c1a |
| negative bg | #c44 |
| dotAppear | scale(0→1.25→1), 0.35s |
| dotBreak | scale(1→1.3→0.4) + rotate, 0.35s |
| dotAbsorb | translateY(0→8→18px), 0.6s |

### L393~415 — 타이틀 화면
| 속성 | 값 |
|------|-----|
| title-frame max-width | 640px |
| h1 font | 22px (v0.8 정정) / line-height:1.45 |
| intro-text | 14px / #555 / 1.9 |
| host-text border | 2px solid #111 |
| host-call | 18px / 700 |
| tutorial-list li border-left | 3px solid #111 |
| tutorial li::before | 24px circle / 1.5px border |
| start-btn-large | 15px / 700 / letter-spacing:2px |

### L417~424 — 모달 공통
| 속성 | 값 |
|------|-----|
| overlay bg | rgba(0,0,0,0.55) |
| z-index | 1000 |
| modal-card width | min(440px, 90vw) |
| modal-card padding | 24px 28px |
| modal-title | 18px / 700 |
| modal-subtitle | 14px / 700 |

### L426~438 — 레벨업 모달
| 속성 | 값 |
|------|-----|
| lvup-badge | 10px / letter-spacing:3px / #b58900 |
| lvup-from | 22px / #999 |
| lvup-to | 36px / #111 / 700 |
| lvup-transition bg | #fffceb |
| lvup-confirm | bg:#111, 13px/700, letter-spacing:1px |

### L440~466 — 자원토큰 분배 모달
| 속성 | 값 |
|------|-----|
| rp-bal-num | 36px / 700 |
| rp-bucket-meter height | 22px |
| rp-btn size | 34x34 |
| rp-allocate | 15px / 700 |
| rp-confirm | bg:#111, 13px/700 |
| disabled | bg:#bbb |

### L467~501 — 역량 카드 인벤토리
| 속성 | 값 |
|------|-----|
| inv-tab z-index | 200 |
| inv-tab border-radius | 14px |
| inv-tab-name | 15px / 700 / letter-spacing:1.5px |
| inv-tab-badge | 10px / bg:#c44 |
| inv-panel width | 320px / max:90vw |
| inv-panel z-index | 310 |
| inv-panel border-left | 2px solid #111 |
| inv-panel shadow | -4px 0 0 #111 |
| inv-card border | 1.5px solid #111, radius:8px |
| inv-card-count | 22px / 800 / bg:#888 / 50px |
| inv-card-label | 18px / 700 |
| inv-card-chevron | 16px / #888 / rotate(180deg) on expand |
| inv-card-meaning border-left | 4px solid #888 |

### L503~532 — Reward 팝업 (카드 획득)
| 속성 | 값 |
|------|-----|
| overlay z-index | 400 |
| card width | 220px |
| card z-index | 405 |
| card border | 2px solid #111, left:6px |
| card border-radius | 12px |
| card shadow | 0 4px 0 #111 |
| cardPopIn | scale(0.3→1.15→0.96→1) + rotate, 0.5s |
| cardGlow | box-shadow pulse 금색(rgba(255,220,80)), 0.6s |
| travel transition | 0.35s |
| reward-label | 19px / 700 |
| confirm | bg:#111, 12px/700, letter-spacing:1px |

### L534~556 — 성장 카드 (회복력/도전력)
| 속성 | 값 |
|------|-----|
| growth-card border | 2.5px dashed #546e7a |
| growth-card bg | #f8f9fa |
| growth-card shadow | 0 4px 16px rgba(0,0,0,0.12) |
| growth-symbol font | 32px (카드), 48px (모달) |
| growth-symbol color | #546e7a |
| recovery-overlay z-index | 410 |
| recovery-overlay bg | rgba(0,0,0,0.5) |
| recovery-card width | 300px |
| recovery-card border | 2.5px dashed #546e7a |
| recovery-card radius | 16px |
| recoveryPopIn | scale(0.3→1.08→1), 0.5s |
| recovery-card-title | 20px / 700 / #546e7a |
| recovery-card-desc | 13px / #666 |
| btn primary | bg:#546e7a, border:#546e7a |
| btn primary hover | bg:#455a64 |
| btn secondary | transparent, border:1.5px #ccc, color:#888 |
| 심볼 | ↺ 회복력, ↑ 도전력 |

### L558~575 — GAME OVER 모달
| 속성 | 값 |
|------|-----|
| overlay bg | rgba(0,0,0,0.65) |
| z-index | 1100 |
| gameover-title | 26px / 800 / letter-spacing:2px |
| resource-num | 20px / 800 / #c44 |
| gameover-report | bg:#111 |
| gameover-restart | bg:#fff |

---

## z-index 스택 (확정)

| z-index | 컴포넌트 |
|---------|---------|
| 1100 | GAME OVER overlay |
| 1000 | 모달 overlay (레벨업/자원분배) |
| 410 | recovery overlay (성장 카드) |
| 405 | reward 카드 |
| 400 | reward overlay |
| 310 | 인벤토리 패널 |
| 300 | 인벤토리 backdrop / debug |
| 200 | 인벤토리 탭 |
| 100 | panel-row (sticky) |

---

## 마지막 동기화

- **기준 파일**: `index.html.template` L7~L551
- **날짜**: 2026-05-08 (세션313)
- **빌드**: 미빌드 (13d 코드 미커밋 상태)
