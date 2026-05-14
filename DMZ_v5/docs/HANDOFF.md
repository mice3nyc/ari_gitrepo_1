# DMZ v5 — HANDOFF

> 아리공(로컬 Air) ↔ 아리온(클라우드) 인수인계. 작업 시작 전 이 문서 + SPEC.md + 진행 작업 노트를 먼저 읽기.

## v4 → v5 분기 배경 (5/14)

- v4 인턴 베타(5/26 예정)를 위한 3 빌드(mobile/offline/sequential)는 4/30까지 완성·푸시됨.
- 5/14 v5 폴더 신설(`_dev/DMZ_v5/`). v4 통째 복사 + storageKey prefix `dmz_v5_*`로 분리. v4는 보존.
- v5에서 새 사양 적용 예정. 작업 노트는 `_dev/DMZ_v5/` 안에 통합 관리(PLAN/TASKS/SPEC 모두 코드 폴더 안).

### v3.2 → v4 도입 배경 (히스토리)

- 정예공이 4/28 보낸 새 빌드는 v3.2 위 추가본이 아니라 아키텍처 전면 교체된 별개 빌드.
- 데이터 구조, 템플릿 방식, 이미지 경로 규칙, 폰트, 화면 흐름 전부 다름.
- v3.2 `_dev/DMZ/`는 레거시 보존.

## 3 빌드 비교

| 빌드 | 사용 | 메카닉 |
|------|------|--------|
| mobile | 인턴 베타 5/26 | 자유 진입, 4 자료 본문+빈칸 모두 표시 |
| offline | 피스트레인 6/12 | B/D 자료 본문 가림 → 현장 출력물 보고 정답 → unlock |
| sequential | 플테 (4/30 신설) | A→B→C→D 순차 잠금, 빈칸 모달에 정답 자료 라벨 강조 |

베이스: mobile/offline은 `shared/index_base.html` 공유, sequential은 `shared/index_sequential.html` 별도.

## 작업 시작 시 읽기 순서

1. **`README.md`** — 폴더 구조 + 빌드 URL
2. **`docs/SPEC.md`** — mobile/offline 명세, AC/BD 분기
3. **`docs/SPEC-sequential.md`** — sequential 별도 명세
4. **`docs/BUILD-VARIANTS.md`** — 3 빌드 차이 + 빌드 방법
5. **`_dev/DMZ_v5/` 안 진행 작업 노트** — 현재 위치 + 체크리스트 (PLAN/TASKS는 코드 폴더에 통합)
6. (필요 시) `docs/CODE-FORK-POINTS.md` — 코드 라인별 분기 (라인 번호는 grep 재정찰 권장)

## 작업 시 지켜야 할 룰

### 단일 source 원칙
- mobile/offline 작업은 `shared/index_base.html`에. sequential은 `shared/index_sequential.html`에.
- 각 빌드 산출물은 `mobile/index.html`, `offline/index.html`, `sequential/index.html` — 직접 수정 금지.
- `bash scripts/build.sh` (mobile+offline) 또는 `bash scripts/build_sequential.sh` (sequential).

### 데이터 source of truth
- 정답표: `shared/dmz_blanks.csv`
- STORIES 인라인 데이터(베이스 HTML 안)가 실질 source. CSV는 검증·추적·sequential BLANK_SOURCE_LOOKUP 자동 주입용.
- 이미지 매니페스트: `shared/photos_manifest.csv` — 영문화 매핑 + 출처 보존.

### 이미지 추가 절차
1. `shared/photos/cat0N/{N}-{M}.{ext}` (영문 파일명만)
2. `photos_manifest.csv` 한 행 추가
3. 베이스 HTML STORIES src 갱신
4. rebuild

### 코드 변경 (선문후코)
- SPEC 먼저 갱신 → 코드. 탐색적 작업은 같은 턴 즉시 SPEC 반영.
- 분기 지점은 `CODE-FORK-POINTS.md` 참조 (특히 `renderSource`, `submitAnswer`, localStorage)
- v4 베이스 패치(s0101 altAnswers, normalizeAnswer 부활, localStorage 키 분리)는 v5에 그대로 인계됨.

## 빌드 토글

```js
const OFFLINE_MODE = false;  // shared/index_base.html 상단
```

빌드 산출 시점에 sed로 분기:
- mobile: `false` (그대로)
- offline: `true`
- sequential: `OFFLINE_MODE` 자체 없음 (별도 베이스)

런타임 분기는 `renderSource()`, `submitAnswer()`, localStorage unlock 처리에서 발생.

### localStorage 키 정책 (v5에서 완료)

```js
const LS_PREFIX = OFFLINE_MODE ? 'dmz_v5_o_' : 'dmz_v5_m_';  // mobile/offline
// sequential은 LS_PREFIX = 'dmz_v5_s_'
const LS_STATE_KEY = LS_PREFIX + 'state';
const LS_TUTORIAL_KEY = LS_PREFIX + 'tutorial';
const LS_OFFLINE_UNLOCKS_KEY = LS_PREFIX + 'unlocks';
```

3 빌드 완전 분리. 한 도메인에서 mobile/offline/sequential 동시 플레이해도 진행 상태 충돌 없음.

## GitHub Pages

- 3 URL 동시 배포:
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/mobile/`
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/offline/`
  - `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/sequential/`
- `.github/workflows/`는 main 브랜치에 push 시 자동 배포
- 캐시 무효화: 강제 새로고침 또는 `?v=N` 쿼리 파라미터

## 코드 작업 컨벤션

- 단일 HTML 파일 (HTML+CSS+JS 한 파일)
- 바닐라 JS, 프레임워크 없음
- 흰 배경, 미니멀, B&W 기본
- 한국어 우선 (UI 텍스트, 주석)
- 픽셀폰트 (Galmuri11, DotGothic16)
- offline 분기 클래스는 `.bd-*` prefix (UI-MAP.md)
- sequential 잠금 클래스는 `.source-card.locked`, `.modal-source-hint`, `.source-label-highlight` (SPEC-sequential.md)

## 아리공(로컬, Air)에게

- 코드 수정은 **Air에서만**. 볼트 Sync와 충돌 회피.
- git commit + push는 Air에서. 푸시 전 빌드 + 로컬 검증.
- 백도 위임 시 SPEC + 진행 작업 노트가 자급자족 가능한지 확인.
- 새 노트 생성 → DN 오늘의 링킹에 즉시 등록.

## 아리온(클라우드)에게

- 모바일에서 피터공이 지시하면 코드 수정 + 커밋. PR 또는 직접 main push.
- v5 작업 시 반드시 베이스 HTML(`shared/index_base.html` 또는 `shared/index_sequential.html`)만 수정. mobile/offline/sequential의 index.html은 빌드 산출물이라 직접 수정 금지.
- 변경 후 rebuild + 검증.

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | v4 작업 디렉토리 도입, 두 빌드(mobile/offline) 분기 설계 |
| 2026-04-30 | v4.1-seq | 세 번째 빌드 sequential 추가 — 자료 순차 잠금 + 정답 자료 라벨 강조 |
| 2026-05-14 | v5.0 | v5 분기 (v4 통째 복사). storageKey `dmz_v5_*`. docs·HANDOFF v5로 정정. PLAN/TASKS 코드 폴더 통합 |
