# DMZ v4 — BUILD-VARIANTS

> 세 빌드(mobile / offline / sequential) 차이, fork 지점, 빌드 산출 방법, GitHub Pages URL 분기. 코드 작업 + 배포 시 핵심 참조.

## 세 빌드 비교

| 항목 | **mobile** | **offline** | **sequential** (4/30 신설) |
|------|-----------|-------------|---------------------------|
| 사용처 | 인턴 베타 데모 | 피스트레인 부스 (공간 설치물) | 새 디자인 플테 |
| 일정 | 5/26 (월) 통일부 대회의실 24명 | 6/12~14 소이산 전망대 | 미정 — 플테 일정에 따라 |
| 자료 표시 | 모든 자료 본문+빈칸 표시 | A/C는 표시, B/D는 가림 → unlock | 모든 자료 본문 표시되나 **순차 잠금** A→B→C→D |
| 진행 메카닉 | 자유 진입 | BD에 빈칸 풀면 본문 unlock | 이전 자료 빈칸 다 풀어야 다음 자료 활성 + 빈칸 모달에 정답 자료 라벨 강조 |
| 출력물 의존 | 없음 | 필수 (B/D 본문은 출력물에서) | 필수 (cross-source 정답은 종이에서) |
| 베이스 file | `shared/index_base.html` | `shared/index_base.html` | `shared/index_sequential.html` (별도) |
| 토글/분기 | `OFFLINE_MODE = false` | `OFFLINE_MODE = true` | 별도 베이스 (OFFLINE 흔적 제거) |
| LS prefix | `dmz_v5_m_` | `dmz_v5_o_` | `dmz_v5_s_` |
| 디바이스 | 모바일 웹 | 모바일 웹 + 공간 출력물 | 모바일 웹 + 종이 출력물 |
| URL | `.../DMZ_v5/mobile/` | `.../DMZ_v5/offline/` | `.../DMZ_v5/sequential/` |
| SPEC | `SPEC.md` | `SPEC.md` (offline 섹션) | `SPEC-sequential.md` ★ |

## fork 지점 (분기 단일 토글)

`shared/index_base.html` 상단 1줄:
```js
const OFFLINE_MODE = false;  // ← 빌드 시점에 mobile=false / offline=true
```

이 한 줄을 빌드 산출 단계에서 두 값으로 sed/replace.

## 빌드 산출 방법

### 디렉토리

```
_dev/DMZ_v5/
├── shared/index_base.html      ← 단일 source (작업 대상)
├── mobile/index.html           ← 산출물 (shared 그대로 카피)
├── offline/index.html          ← 산출물 (shared + OFFLINE_MODE=true)
└── scripts/build.sh            ← 빌드 스크립트 (생성 예정)
```

### 빌드 스크립트 (`scripts/build.sh`)

```bash
#!/bin/bash
# DMZ v4 두 빌드 산출
SHARED="_dev/DMZ_v5/shared/index_base.html"

# mobile: 그대로 카피
cp "$SHARED" "_dev/DMZ_v5/mobile/index.html"

# offline: OFFLINE_MODE 줄만 true로
sed 's/const OFFLINE_MODE = false;/const OFFLINE_MODE = true;/' "$SHARED" > "_dev/DMZ_v5/offline/index.html"

# photos 자산 심볼릭 링크 (또는 카피)
ln -sfn "../shared/photos" "_dev/DMZ_v5/mobile/photos"
ln -sfn "../shared/photos" "_dev/DMZ_v5/offline/photos"
```

> 심볼릭 링크는 GitHub Pages에서 안 통할 수 있음. 그 경우 `cp -r`로 카피 (디스크 비용 ↑) 또는 photos 경로를 절대화.

### 검증

빌드 후:
- `grep "OFFLINE_MODE" mobile/index.html` → `false`
- `grep "OFFLINE_MODE" offline/index.html` → `true`
- 두 빌드 file size 차이 ≈ 0 (한 줄 차이만)

## GitHub Pages URL 분기

```
mice3nyc.github.io/ari_gitrepo_1/
├── DMZ/                        ← v3.2 레거시 (보존)
│   └── index.html
└── DMZ_v5/
    ├── mobile/index.html       ← https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/mobile/
    └── offline/index.html      ← https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/offline/
```

push → main 브랜치 → GitHub Actions(자동 Pages 배포) → 두 URL 동시 활성화.

## shared 갱신 → rebuild 파이프라인

콘텐츠/코드 변경 시:

1. `shared/index_base.html` 수정
2. `bash scripts/build.sh` 실행 → mobile/, offline/ 갱신
3. 브라우저 검증 (file:// + http://)
4. git commit + push → GitHub Pages 자동 배포

**예상 트리거**:
- 정예공이 cat04/05/06 STORIES 추가 (Phase 6)
- 베이스 패치 (s0101 altAnswers, normalizeAnswer 부활)
- offline 분기 로직 보강 (unlock UX, BD 안내 카드 디자인)

## 변형 추가 가이드 (3번째 빌드를 만들게 된다면)

예: "튜토리얼 없는 데모 빌드"가 필요하다면:

1. SPEC에 새 토글 추가: `const SKIP_TUTORIAL = false`
2. `_dev/DMZ_v5/demo/` 폴더 추가
3. `scripts/build.sh`에 새 산출물 라인 추가
4. BUILD-VARIANTS.md 비교 표에 컬럼 추가

토글 변수가 늘어나면 `const BUILD_FLAGS = { offline: false, skipTutorial: false }` 객체로 통합.

## 알려진 이슈 / 주의

- **photos 자산 공유**: shared/photos를 두 빌드가 공유. 심볼릭 링크 vs 카피 결정 필요(GitHub Pages 환경 검증)
- **localStorage 키 충돌**: mobile/offline이 같은 도메인(`mice3nyc.github.io`)이라 localStorage 공유. 빌드별로 키 prefix 구분 권장:
  - mobile: `dmz_v5_mobile_*`
  - offline: `dmz_v5_offline_*`
  - 또는 한 사용자가 두 빌드 다 플레이할 일이 없으면 무시 가능
- **캐시 무효화**: GitHub Pages CDN 캐시. 빌드 후 강제 새로고침 또는 URL에 `?v=N` 쿼리 파라미터 권장

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | 두 빌드 분기 설계 + 빌드 스크립트 명세 |
| 2026-04-30 | v4.1-seq | 세 번째 빌드 sequential 추가 — 자료 순차 잠금 + 정답 자료 라벨 강조. 별도 베이스 file. SPEC-sequential.md 신설 |
