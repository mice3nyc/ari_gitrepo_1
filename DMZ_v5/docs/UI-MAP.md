# DMZ v4 — UI-MAP

> 화면/요소 공식 이름. 소통 시 이 이름을 사용. v3.2 UI-MAP 갱신본.

## 화면 (#screen-id)

| ID | 화면 | 진입 |
|----|------|------|
| `#login-screen` | 로그인 (이름+코드) | 시작 |
| `#tutorial-screen` | 튜토리얼 4단계 | 첫 플레이 시 |
| `#category-screen` | 카테고리 6개 그리드 | 로그인/튜토리얼 후 |
| `#story-screen` | 카테고리 안 스토리 카드 목록 | 카테고리 클릭 |
| `#game-screen` | 게임 (자료 4개) | 스토리 클릭 |
| `#completion-screen` | 스토리 완료 | 4/4 빈칸 완료 |
| `#archive-screen` | 보관소 (픽셀맵 + 아키비스트 유형) | 결과 후 |
| `#result-screen` | 전체 결과 | 모든 카테고리 완료 |

## 요소 (.class)

### 자료 카드 (Game 안)
| 클래스 | 설명 |
|--------|------|
| `.source-list` | 자료 카드 4개 컨테이너 |
| `.source-card` | 개별 자료 카드 (A/B/C/D) |
| `.source-card.done` | 정답 채워진 자료 |
| `.source-detail` | 자료 뷰어 오버레이 |
| `.detail-inner` | 자료 본문 영역 (max-width 500px) |

### 자료 type별 (.detail-inner 안)
| 클래스 | type |
|--------|------|
| `.letter-paper` | letter (편지) |
| `.diary-paper` | diary (일기) |
| `.scholar-paper` | scholar (학술) |
| `.newspaper-paper` | newspaper (신문) |
| `.photo-frame` | photo (사진) |
| `.oral-player` | oral (구술) |
| `.kakao-chat` | kakao (카톡) |
| `.blog-post` | blog |
| `.report-doc` | report |
| `.homework-paper` | homework |
| `.text-message` | text (텍스트) |
| `.qna-pair` | qna |

### 빈칸
| 클래스 | 설명 |
|--------|------|
| `.blank-slot` | 빈칸 자체 (클릭 가능) |
| `.blank-slot.empty` | 미응답 |
| `.blank-slot.filled` | 정답 채워진 상태 |

### 모달
| ID/클래스 | 설명 |
|----------|------|
| `#modal-backdrop` | 배경 (반투명 검정) |
| `#answer-modal` | 답변 입력 모달 |
| `#modal-hint` | 힌트 텍스트 |
| `#modal-input` | 정답 입력 |

### 카테고리 화면
| 클래스 | 설명 |
|--------|------|
| `.category-grid` | 6개 카테고리 그리드 (2열, 600px+ 시 3열) |
| `.category-card` | 개별 카테고리 카드 |

### 보관소
| 클래스 | 설명 |
|--------|------|
| `.archive-container` | 보관소 컨테이너 |
| `.dmz-pixel-map` | DMZ 픽셀맵 SVG |
| `.archivist-type-card` | 아키비스트 유형 표시 |
| `.archivist-bar` | 성향 막대그래프 |

### 토스트 / 피드백
| 클래스 | 설명 |
|--------|------|
| `.toast.correct` | 정답 토스트 (검정 배경) |
| `.toast.wrong` | 오답 토스트 (빨강 테두리) |

## 신규 컴포넌트 (offline 빌드 전용 ★)

### `.bd-locked-card` — 현장 출력물 안내 카드

위치: `.detail-inner` 안 본문 자리 (B, D 자료, unlock 전)

구조:
```html
<div class="bd-locked-card">
  <div class="bd-locked-icon">📄</div>
  <div class="bd-locked-title">현장의 출력물을 확인하세요</div>
  <div class="bd-locked-sub">정답을 입력하면 자료가 여기에 나타납니다</div>
</div>
```

스타일:
- 점선 테두리 (`border: 2px dashed var(--fg)`)
- max-width 400px, 가운데 정렬
- 픽셀폰트 톤 유지 (Galmuri11)
- 패딩 충분히 (1.5~2rem)
- 클릭 불가 (자료 본문 영역 점유만)

### `.bd-unlock-transition` — 본문 unlock 트랜지션

정답 입력 → unlock 시 `.bd-locked-card`가 fade-out, 본문이 fade-in. CSS transition으로 처리:

```css
.bd-locked-card { transition: opacity 0.4s ease; }
.bd-unlocked-content { animation: fade-in 0.6s ease; }
@keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
```

### `.bd-unlock-indicator` — unlock 표시 (자료 카드)

`.source-card`의 자료가 B/D + unlocked 상태일 때 작은 표식(예: 🔓 또는 점):
```html
<div class="source-card source-B unlocked">
  <span class="bd-unlock-indicator"></span>
  ...
</div>
```

## 기존 v3.2 → v4 차이

| v3.2 | v4 |
|------|-----|
| `#delivery-screen` (봉투 우편 애니메이션) | 제거 |
| 4-4 올클리어 팝업 | 제거 (대신 `#completion-screen`) |
| 폰트: 시스템(`-apple-system`) | 픽셀폰트(`Galmuri11`+`DotGothic16`) |
| 캐릭터 선택(soldier/student/historian) | 카테고리 선택(cat01~06) |
| `media/char{N}_photo{M}.jpg` | `photos/cat0N/{N}-{M}.{ext}` |

## 명명 규칙

- 화면: `#kebab-case-screen` (예: `#story-screen`)
- 요소: `.kebab-case` (예: `.bd-locked-card`)
- 자료 type 클래스: `.{type}-{kind}` (예: `.letter-paper`, `.kakao-chat`)
- offline 전용 클래스: `.bd-*` prefix (예: `.bd-locked-card`)

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | v4 화면 8개, 자료 type 12종, offline 신규 컴포넌트 3종 정의 |
