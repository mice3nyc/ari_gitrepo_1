# SPEC — v14 빌드/개발 체계 (단일 마스터 통합)

**작성**: 2026-06-24 / author: 아리공
**요청 컨테이너**: [[요청.26.0624.1540-v14빌드체계통합]]
**전제 진입점**: 이 SPEC + `../v13-mid/build.py`(복제본 `build.py`) + 6개 파일 diff 판정(요청 노트)

## 0. 목적

v13에서 `v13-elem`·`v13-mid`가 평행 트리로 갈라져 로직(src/js)이 이중 관리되던 것을, v14에서 **단일 마스터 + 데이터 오버레이** 구조로 되돌린다. 로직은 한 벌, 데이터(`data/elem`·`data/mid`)는 전용 분리. 빌드는 build.py가 variant로 파생.

되감기(QA) 기능은 이 통합과 분리한다. v14 통합 검증 완료 후 별도 단계(§7).

## 1. 빌드 체계 정의 (용어 확정)

| 빌드 | 명령 | 산출 | debug | 용도 |
|---|---|---|---|---|
| 개발 라이브(루트) | `python3 build.py` | `index.html` (중등 데이터, `../images` 참조) | ON | 마스터 로컬 플레이테스트 |
| 개발 라이브(초등) | `python3 build.py --variant=elem --dev` | `builds/elem-dev/` | ON | 초등 개발 확인 |
| 배포(중등) | `python3 build.py --variant=mid` | `builds/mid/` | OFF | 동현공 → KT 하이러닝 |
| 배포(초등) | `python3 build.py --variant=elem` | `builds/elem/` | OFF | 동현공 → KT 하이러닝 |

- **개발 라이브** = `debug:true`. git URL 접근. 디버그/QA 기능(되감기 등) 노출.
- **배포 빌드** = `debug:false`. 디버그 UI 자동 숨김(학교 라이브 보호).
- 둘의 차이는 `debug` 플래그 하나. 같은 데이터를 공유.
- 로직 변경 = 마스터 `src/js` 한 곳 → 양쪽 자동. 데이터 변경 = `data/{variant}/` → 한쪽만.

## 2. 통합 항목 (선문후코 — 코드 전 명세)

### 2.1 시나리오 ID 목록 단일화 (핵심)

**문제**: 시나리오 ID 목록이 5곳에 하드코딩(00-config·02-state·11-report·12-debug·15-card). 드리프트 근원.

**단일 소스**: `CONFIG.scenarios` (00-config.js). build.py가 이미 variant별 치환(`build.py:71`).

**작업**: 나머지 4곳을 `CONFIG.scenarios` 참조로 변경.
- `02-state.js`·`11-report.js`: 이미지 번호 매핑 `{'selfintro':'01',...}` 하드코딩 제거 → `CONFIG.scenarios.indexOf(scenarioId)` 기반 번호 생성. 예: `var idx=CONFIG.scenarios.indexOf(scenarioId); var n=String(idx<0?0:idx+1).padStart(2,'0');`
- `12-debug.js`: `order=[...]` → `CONFIG.scenarios.slice()` 직접 참조.
- `15-card-per-choice.js`: `scenarios:[...]` PILOT 배열 → `CONFIG.scenarios` 참조(또는 build.py 치환 앵커 유지 확인).

**검증**: 단일화 후 `data/elem` 오버레이로 빌드 시 초등 5종, base로 빌드 시 중등 5종 — 양쪽 시나리오·이미지 매핑 정상.

### 2.2 이미지 경로

**발견**: build.py `build_variant`이 변종 빌드 때 `../images/ → images/` 자동 치환(`build.py:262`). build.py 수정 불필요.

**작업**: src 전체를 `../images/`로 통일(mid 방식). elem이 박았던 `images/` 상대경로 제거.

### 2.3 15-card awardCards 분기 (elem 상위호환 채택)

**판정**: elem 코드는 "awardCards 있으면 우선, 없으면 기존 도출". 중등은 필드 없어 자동 fallback. elem 코드가 상위호환.

**작업**: `15-card-per-choice.js`에 elem 버전(awardCards 우선 + else 기존 도출) 채택. 중등 회귀 동일성 검증.

### 2.4 버전 라벨·캐시버스트 정리

- `index.shell.html` title·version-label: 마스터 기준 정리. title 변종 라벨 필요 시 build.py 치환 추가(현재 version만 치환).
- `_imgCacheBust`: 한 값으로 통일(최신 `?v=20260623a` 기준).

## 3. 버전 분기 체크리스트 (storageKey/version/배포경로)

> 메모리: 버전 분기 시 연결 값 교체. 세션316 사고 방지.

- [ ] `version`: `v1.3-mid-r39` → `v1.4-mid-r0`(또는 합의 라벨). build.py VARIANT_CONFIG_REPLACEMENTS 앵커도 동시 갱신.
- [ ] `storageKey`/`eventLogKey`/`sessionIdKey`/`outboxKey`: `...-v13-mid` → `...-v14-mid`. build.py elem 치환 앵커도 v14로.
- [ ] 배포 경로: github.io `/v13-mid/` → `/v14/`(또는 합의). HANDOFF-deploy 갱신.
- [ ] `gameId`: 유지(`ai_literacy_md`/`ai_literacy_el`) — 동현공 ALLOWED_GAME_IDS 등록값. 버전과 무관.

## 4. 마스터/변종 구조 (확정)

- **마스터**: `v14/` (mid 기반 복제). 로직 src/js 단일.
- **데이터**: `data/`(중등 base) + `data/elem/`(초등 오버레이). 변경 시 초등 전용은 반드시 `data/elem/`.
- **v13-elem 은퇴**: v14에서 elem은 variant로만 존재. v13-elem 폴더는 v13에 동결 보존(삭제 안 함).

## 5. 병행 기간 규칙 (v13 배포 / v14 통합)

- 데이터 작업(초등 콘텐츠 등): **v13에서**. 로직/구조: **v14에서**.
- v14 전환 직전 v13 `data/` 최종 동기화(로직/데이터 분리 덕에 안전).

## 6. 검증 항목 (위임=확인까지, _dev/CLAUDE.md 26.0622)

**[아리공 자가점검]**
- 4종 빌드 성공(중등개발/초등개발/중등배포/초등배포), build.py 검증 단계 통과(scenarios 키·micro·aiflags 정합)
- CDP: 각 빌드 런타임 예외 0, 시나리오 1개 첫 스텝 진행, 이미지 로드
- **회귀 동일성**: v13 초등 배포빌드 vs v14 초등 배포빌드 결과 동등(시나리오·카드·점수 경로). v13 중등도 동일.
- 배포빌드 debug:false 확인(디버그 UI 미노출)

**[피터공 확인]**
- 개발 라이브에서 중등/초등 실제 플레이 화면·톤
- 배포빌드 라이브 URL

## 7. 되감기 QA 기능 (별도 단계 — 통합 검증 후)

자리만 표시. v14 통합·검증 완료 후 착수. 설계 요지: 선택 직전 gameState 전체 스냅샷 스택 + 화면별 "뒤로" 버튼, `debug` 게이트(개발 라이브에만 노출). 별도 SPEC로 분리 예정.
