# DMZ v4 — HANDOFF

> 아리공(로컬 Air) ↔ 아리온(클라우드) 인수인계. 작업 시작 전 이 문서 + SPEC.md + 진행 작업 노트를 먼저 읽기.

## v4 도입 배경

- 정예공이 4/28 보낸 새 빌드(`dmz_game_jygong.html`)는 우리 v3.2 위 추가본이 아니라 **아키텍처 전면 교체된 별개 빌드**다.
- 데이터 구조, 템플릿 방식, 이미지 경로 규칙, 폰트, 화면 흐름 전부 다름.
- v3.2 `_dev/DMZ/`는 레거시로 보존, 신규 작업은 `_dev/DMZ_v5/`에서 진행.
- 두 플레이테스팅 빌드 fork — mobile (인턴 베타 5/26) / offline (피스트레인 6/12).

## 작업 시작 시 읽기 순서

1. **`README.md`** — 폴더 구조 + 빌드 URL
2. **`docs/SPEC.md`** — 무엇을 만드는가, AC/BD 분기 명세
3. **`docs/BUILD-VARIANTS.md`** — 두 빌드 차이 + 빌드 방법
4. **볼트 [[26.0429 DMZ v4 진행 작업]]** — 현재 위치 + 체크리스트
5. (필요 시) `docs/CODE-FORK-POINTS.md` — 코드 라인별 분기 지점

## 작업 시 지켜야 할 룰

### 단일 source 원칙
- 작업은 항상 `shared/index_base.html`에. mobile/offline의 index.html은 빌드 산출물.
- `bash scripts/build.sh` 실행으로 두 빌드 동기화.

### 데이터 source of truth
- 정답표: `shared/dmz_blanks.csv` (예정 갱신). v3.2의 incoming CSV는 stale.
- 새 빌드는 STORIES 인라인 데이터가 실질 source. CSV는 검증/추적용으로 갱신.
- 이미지 매니페스트: `shared/photos_manifest.csv` — 영문화 매핑 + 출처 보존.

### 이미지 추가 절차
1. `shared/photos/cat0N/{N}-{M}.{ext}` (영문 파일명만)
2. `photos_manifest.csv` 한 행 추가
3. `shared/index_base.html` STORIES src 갱신
4. rebuild

### 코드 변경
- `shared/index_base.html` 수정 → rebuild → 두 빌드 모두 검증
- 분기 지점은 `CODE-FORK-POINTS.md` 참조 (특히 `renderSource`, `submitAnswer`, localStorage)
- v4 베이스 패치(s0101 altAnswers, normalizeAnswer 부활, localStorage 키)는 양쪽 빌드 공통

## v3.2 → v4 전환 메모

- **DATA-SPEC.md 일부 폐기**: `char{N}_photo{M}.jpg` 규칙은 v3.2 전용. v4는 `photos/cat0N/{N}-{M}.{ext}`
- **CSV 자리 변동**: v3.2 시점 CSV는 12 빈칸. v4는 18 스토리(38 예정) 약 70+ 빈칸. CSV 갱신 시 v4용 새로 작성.
- **localStorage 키**: v3.2 = `dmz_diary_{이름}` / v4 = `dmz_diary_v2`(기본) → 정책 재검토 필요(인턴 24명 동시 플레이 환경).
- **스크린 ID 변경**: `#delivery-screen` 제거, `#completion-screen` 신규.

## 두 빌드 분기 토글

```js
const OFFLINE_MODE = false;  // shared/index_base.html 상단
```

빌드 산출 시점에 sed로 분기:
- mobile: `false` (그대로)
- offline: `true`

런타임 분기는 `renderSource()`, `submitAnswer()`, localStorage unlock 처리에서 발생.

## GitHub Pages

- 두 URL이 동시 배포됨:
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/mobile/`
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/offline/`
- `.github/workflows/`는 main 브랜치에 push 시 자동 배포
- 캐시 무효화: 강제 새로고침 또는 `?v=N` 쿼리 파라미터

## 코드 작업 컨벤션

- 단일 HTML 파일 (HTML+CSS+JS 한 파일)
- 바닐라 JS, 프레임워크 없음
- 흰 배경, 미니멀, B&W 기본
- 한국어 우선 (UI 텍스트, 주석)
- 픽셀폰트 (Galmuri11, DotGothic16)
- offline 분기 클래스는 `.bd-*` prefix (UI-MAP.md)

## 아리공(로컬, Air)에게

- 코드 수정은 **Air에서만**. 볼트 Sync와 충돌 회피.
- git commit + push는 Air에서. 푸시 전 두 빌드 빌드 + 로컬 검증.
- 백도 위임 시 SPEC.md + 진행 작업 노트가 자급자족 가능한지 확인.
- 새 노트 생성 → DN 오늘의 링킹에 즉시 등록.

## 아리온(클라우드)에게

- 모바일에서 피터공이 지시하면 코드 수정 + 커밋. PR 또는 직접 main push.
- v4 작업 시 반드시 `shared/index_base.html`만 수정. mobile/offline의 index.html은 빌드 산출물이라 직접 수정 금지.
- 변경 후 rebuild + 검증.

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | v4 작업 디렉토리 도입, 두 빌드 분기 설계 |
