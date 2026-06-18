---
author: 아리공
created: 2026-06-17
status: focused 구현 완료 (2026-06-18 세션498) · 전체 v14-split 외부화는 post-KT
implemented: §3a(--variant), §3c(변종 변수 5키 주입), §6(자기완결 builds/{variant}/) — v13-mid build.py에 추가. §3b(--release)는 terser 폴백 stub. H1~H9 외부화·content/_shared override·v14-split 신규 루트는 미착수(post-KT).
---

## SPEC — 초등/중등 변종 분기 (단일 코드 × 변종 콘텐츠)

> 짝 노트: [[PLAN-variant-split]] (감사 근거 + 결정 기록). 이 SPEC은 그 결정을 "어떻게 만드느냐"의 기술 명세.
> 선례: `_dev/DMZ_v5/` — `shared/index_base.html` 하나에서 build.sh가 플래그로 3변종 산출.

### 0. 한 줄 요약

코드(`src/`)는 한 벌 공유, 콘텐츠(yaml + 이미지)만 변종별로 가른다. `build.py --variant=mid|elem`이 **공유 default + 변종 차이**를 빌드 시점에 합쳐 변종별 단일 `index.html`을 산출한다. 변종 빌드는 그 자체로 완결된 정적 파일이라, 초등 URL로 들어오면 바로 초등이 시작된다(런타임 변종 판별 없음).

---

### 1. 머지 모델 — 공유 default + 변종 override

콘텐츠 yaml을 두 층으로 둔다.

- `content/_shared/` — 공유 default 전체 (현재 중등 콘텐츠가 베이스)
- `content/{mid,elem}/` — 그 변종의 **차이만** (override). 키가 없으면 `_shared`로 폴백

빌드 시 `build.py`가 `_shared`를 먼저 적재하고 그 위에 변종 파일을 deep-merge한다.

| 자료형 | 머지 규칙 |
|--------|-----------|
| dict (맵) | 키 단위 재귀 병합. 같은 키는 변종 값이 이긴다 |
| 스칼라 (문자열·숫자) | 변종 값이 있으면 교체, 없으면 default |
| list (배열) | **통째 교체** (변종에 그 키가 있으면 그 배열로 대체). 부분 병합 안 함 — 예측 가능성 우선 |

> v1 원칙: 리스트는 통째 교체. 시나리오 선택지 같은 배열을 "공유 절반 + 변종 절반"으로 섞지 않는다. 변종이 그 배열을 손대면 전체를 책임진다. 나중에 부분 병합이 필요하면 그때 키 기반 병합으로 승격.

핵심 이점: 공유(`_shared`)를 한 번 고치면 두 변종에 자동 반영. v12-elem(통째 복사) 실패의 재발 방지.

---

### 2. 폴더 골격 (v14-split)

신규 루트이므로 `_dev/CLAUDE.md` 6/14 위치 컨벤션(설계 문서는 `docs/`)을 적용한다.

**원칙(피터공 6/17): 빌드에 필요한 모든 하위파일(데이터·이미지·폰트)을 `content/` 변종 구조 안에서 관리한다.** 빌드 밖(부모 루트)에 흩어진 에셋에 의존하지 않는다. 데이터든 이미지든 동일한 "공유 default + 변종 override" 규칙. 빌드는 합친 결과를 자기완결 폴더로 산출.

```
v14-split/
  build.py              ← --variant / --release 지원
  src/                  ← 공유 코드 한 벌 (복사 아님)
    js/ (17개)
    styles/
    index.shell.html
  content/              ← 빌드에 들어가는 모든 것. 변종 구조로 관리
    _shared/            ← 공유 default
      *.yaml            ← scenarios·texts·cuts·ai_flags·micro_offsets
      images/           ← 공유 기본 이미지 (중등 베이스 135개)
      fonts/            ← 폰트 (변종 공유 — _shared에 둠)
    mid/                ← 중등 차이만 (yaml override + 교체 이미지)
      images/
    elem/               ← 초등 차이만 (yaml override + 교체 이미지). 초기엔 비어 _shared 폴백
      images/
  data/                 ← 빌드 스크립트·CSV (변종 무관 도구, 빌드 산출물엔 안 들어감)
  docs/                 ← PLAN-variant-split.md · SPEC-variant.md · TASKS.md · DECISIONS.md
  builds/
    mid/                ← 산출 (자기완결 배포 단위 = index.html + 합친 images + fonts)
      index.html
      images/
      fonts/
    elem/
      index.html  images/  fonts/
  README.md
```

> v13-mid의 기존 PLAN/SPEC/TASKS는 flat 유지(이사 안 함, 6/14 규칙). docs/ 컨벤션은 v14-split에만.

---

### 3. build.py 변경 명세

현재 build.py는 `src/` + `data/*.yaml`을 합쳐 루트 `index.html` 하나를 만든다. 변종 대응으로 다음을 추가한다.

#### 3a. `--variant=mid|elem` (필수 인자)

- 콘텐츠 적재를 `content/_shared/` → `content/{variant}/` deep-merge로 변경 (현재 `data/*.yaml` 직독 대체)
- 산출 경로를 `builds/{variant}/index.html`로
- `EXPECTED_SCENARIO_KEYS` 하드코딩(build.py:41) 폐지 → 변종 yaml 간 **상대 검증**(`_shared`와 변종의 키 집합 일치)으로 전환. 이게 H1 외부화

#### 3b. `--release` (배포용 minify, 1단계)

- 합쳐진 JS를 minify 한 번 통과시켜 산출(변수명 단축·공백 제거)
- 도구: terser (`npx terser`) 또는 동급. node 도구를 build.py가 shell-out
- **기본은 평문**(개발·디버깅). `--release`일 때만 minify
- 2단계(난독화: 문자열 인코딩·제어흐름 꼬기)는 **보류** — 피터공 추후 결정. 파일 비대·성능 저하 트레이드오프 때문
- 한계 명시: minify는 캐주얼 복제(소스 보기→복사)를 막는 과속방지턱. 작정한 해독은 못 막고, 시나리오 텍스트 같은 문자열은 여전히 노출. 진짜 은닉은 서버 구조뿐(이 게임엔 과함)

#### 3c. 변종 변수 주입 (CONFIG)

`00-config.js`의 다음 값을 변종별로 갈라 주입한다(현재 `-v13-mid` 하드코딩). 이게 H2 + 로그 SPEC의 "변종 변수 2개".

| 키 | mid 예 | elem 예 | 이유 |
|----|--------|---------|------|
| `storageKey` | `...-v14-mid` | `...-v14-elem` | 같은 도메인 배포 시 진행상황 충돌 방지 |
| `eventLogKey` | `...-v14-mid-events` | `...-v14-elem-events` | 동상 |
| `sessionIdKey` | `...-v14-mid-session-id` | `...-v14-elem-session-id` | 동상 |
| `version` | `v1.4-mid-...` | `v1.4-elem-...` | 로그 변종 식별자(이미 "mid" 포함) |
| `outboxKey` | `...-v14-mid-outbox` | `...-v14-elem-outbox` | 플레이로그 전송 큐 분리 |

주입 방식: 변종 manifest(예 `content/{variant}/config.yaml`)에서 읽거나 build.py 인자로 합성. _shared에 default, 변종에 override.

---

### 4. 외부화 대상 (H/M) — 코드 박힘 → yaml/CONFIG

[[PLAN-variant-split]] 감사 결과. 영향도 높음(분기 차단, 반드시) + 중간(권장). 각 항목이 "무엇을 어디로 내리는가".

#### 영향도 높음 — 반드시 외부화

| # | 현재 위치 | 변종화 방법 |
|---|-----------|------------|
| H1 | build.py:41 `EXPECTED_SCENARIO_KEYS` | 상대 검증(§3a)으로 전환 |
| H2 | 00-config.js `CONFIG.scenarios`/`scenarioCostMultiplier` | `Object.keys(SCENARIOS)` 파생 또는 build.py 주입. 이중 진실원 해소 |
| H3 | 02-state.js:51 + 11-report.js:324 (중복) 이미지 폴더 매핑 | yaml로. 중복 2곳 일원화. 폴백 `\|\|'01'` 제거(조용한 깨짐 방지) |
| H4 | 15-card-per-choice.js:7-16 `axisTagMap` | scenarios.yaml로 외부화 |
| H5 | 15-card-per-choice.js:48-79 카드 지급 규칙 | 데이터 주도로(2축·2종 전제) |
| H6 | 13-inventory.js·16-card-rail.js·04-resources.js 카드 3종 카테고리 | 카테고리를 TEXTS 메타로 읽어 순회 |
| H7 | 04-resources.js:117-135 + 16-card-rail.js:38-39 할인=카드장수, 레벨=카드장수 | 산식을 CONFIG/data로 |
| H8 | 11-report.js:791-808 `_judgePattern` 학습자 6종 판정 | 판정 규칙을 CONFIG 배열로(§5) |
| H9 | 11-report.js:662-696 `HC_ALL`/`DOM_ALL` 리포트 카드 마스터 | yaml로 |

#### 영향도 중간 — 권장(차단 아님)

M1 03-engine.js `COMP_GROUP` / M2 13-inventory.js 성장카드 심볼 / M3 11-report.js 일부 문안 리터럴 / M4 check_consistency.py 상수 / M5 04-resources.js 보너스 점수 리터럴. (상세는 PLAN 표)

---

### 5. 다이나믹 요소 + 학습자 유형 전략

게임 안에서 변하는 건 둘뿐, 나머지는 사전 고정 데이터(피터공 6/17 확정).

- **할인** = 보유 카드 장수 (시간=위임칸 / 에너지=능력칸)
- **RP(자원 충전)** = 시나리오 컷6 `awardRP` 적립. CONFIG 데이터 주도(값만 변종화): `rpRewardByGrade`(S30/A20/B15/C10/D5), `rpLevelUpBonusByLevel`(Lv2+10~Lv5+25), `rpCost.time/energy=1`
  - ⚠️ 후속 후보(분기 무관): `awardRP`의 `balance=total` 덮어쓰기 → 안 쓴 RP 소멸. 누적 의도면 버그. 피터공 판단 대기

**학습자 유형 — 텍스트만 분기 + 판정 함수 공유:**
- 두 층 분리: **판정 규칙**(분포→유형키)과 **표현 텍스트**(이름·거울문장·설명)
- 판정 규칙 = 공유 (런칭 시 초등/중등 동일 6종). 판정 함수는 **한 곳**(H8 자리)에서 리포트·로그·게임이 공유. 분산 금지
- 표현 텍스트 = 변종별 분리
- 미래: 유형 개수·판정이 갈리면 변종 폴더에 규칙 override. 없으면 공유 폴백. 미리 다 준비 안 함

---

### 6. 에셋 = 빌드 자기완결 원칙 (★ 피터공 6/17 결정)

**현재 문제(고치는 대상)**: 이미지(135개)·폰트(3개)가 v13-mid 안이 아니라 부모 루트에 흩어져 있고, index.html은 `images/`·`fonts/`를 상대참조한다. 즉 산출 index.html은 **혼자서 못 돈다** — 에셋과 같은 위치에 놓여야 작동. 변종이 갈리면 이 흩어진 의존이 조용히 깨질 위험.

**v14 원칙**: 빌드에 들어가야 하는 모든 하위파일을 `content/` 변종 구조 안에서 관리하고, 빌드는 자기완결 폴더를 산출한다. 빌드 밖 에셋 의존 0.

#### 6a. 이미지도 yaml과 같은 override 모델

이미지는 변종마다 다를 자산. 데이터와 동일 규칙 적용.

- `content/_shared/images/` — 공유 기본 (중등 베이스)
- `content/{variant}/images/` — 그 변종이 바꾸는 이미지만. 같은 파일명이면 변종이 이김, 없으면 `_shared` 폴백
- 4단계 점진 저작과 정합: 초등은 처음 전부 공유 이미지로 돌다가, 초등 그림 나오는 대로 `content/elem/images/`에 그 파일만 추가

#### 6b. 빌드 = 머지 + 복사

build이 `_shared` + 변종 에셋을 합쳐 `builds/{variant}/`에 index.html과 함께 복사한다. 폰트는 `_shared/fonts/`(변종 공유)에서 복사. 결과 `builds/{variant}/` 폴더가 통째로 배포 단위.

> 산출 index.html의 상대경로(`images/`·`fonts/`)는 그대로 두고, 에셋을 같은 폴더에 복사해 맞춘다. 경로 재작성보다 단순·안전.

---

### 7. 작업 순서 (4단계 + 동결)

KT(중등) 전달 끝난 뒤 착수. v13-mid 보호 위해 새 루트 v14-split에서만 작업.

| 단계 | 내용 | 콘텐츠 필요? | 성공 기준 |
|------|------|-------------|-----------|
| 0 | v13-mid 동결 (KT 전달용 보호) | - | 작업 중 미수정 |
| 1 | v14-split 골격 + 회귀 검증 | 0 (중등 복사) | `--variant=mid` 산출 = v13-mid와 기능 동일 |
| 2 | **외부화** (H1~H9, 일의 대부분) | 0 (중등에서 리팩토링) | 매 항목 후 회귀 검증 통과 |
| 3 | 변종 파이프라인 가동 | 0 (elem=중등 복사) | `--variant=elem` 산출이 elem 키로 정상 도는지 |
| 4 | **초등 콘텐츠·이미지 저작** | ★ 여기서 비로소 필요 | 받는 대로 `content/elem/` 파일 교체. 항상 도는 빌드 유지 |

> 4단계는 점진 가능: 만든 파일만 override, 나머지는 `_shared` 폴백. 다 안 만들어도 항상 작동.

---

### 8. 테스팅 + 배포

#### 플레이테스트 (항상 빌드 후)

소스(`src/`·`content/`) 수정 → `python3 build.py --variant=elem` → 나온 `builds/elem/index.html`을 연다. index.html은 직접 수정 금지(빌드가 덮어씀).

- 로컬 서버 권장(`python3 -m http.server`) — file://은 이미지 차단 가능
- storageKey 분리로 한 브라우저에서 두 변종 테스트해도 진행상황 안 엉킴
- dev-nav(좌하단)로 화면 점프, CDP 헤드리스로 회귀 자동 검증(특히 1·2단계)

#### 배포 (동현공 → AWS → KT)

동현공에게 넘기는 건 **소스가 아니라 빌드 산출 폴더**. build.py는 동현공이 돌리지 않는다. 그가 받는 건 정적 파일 묶음.

- 전달물 = `python3 build.py --variant=mid --release`로 만든 **`builds/mid/` 폴더 통째** (minify된 index.html + images + fonts. §6 자기완결 원칙으로 폴더만 올리면 작동)
- 동현공이 그 폴더를 AWS(S3/CloudFront 등)에 올리고 index.html을 가리키는 URL을 KT에 전달
- 변종별로 별도 URL: 중등은 `builds/mid/`, 초등은 `builds/elem/` → 각각 다른 URL. 초등 링크 = 초등 빌드라 바로 초등 시작
- 1차(KT 6/19)는 중등만. 초등은 4단계 콘텐츠 완료 후 별도 URL

---

### 9. 로그 시스템 합류

[[SPEC-play-log]] 흡수 — 충돌 없음. `v`(CONFIG.version)가 변종 식별자, `outboxKey` 변종 분리(§3c). 학습자 유형 판정 함수 공유(§5). additive라 로그 구현과 외부화 리팩토링 독립 진행 가능.
> 합류 규칙: src 재편 = 분기 창, 로그 기능 = 로그 창, 인터페이스만 합의(중복 수정 방지).

---

### 10. 미해결 / 추후 결정

- [x] 에셋 = 빌드 자기완결 원칙 확정 (6/17 피터공: 이미지·데이터 모두 content/ 변종 구조 안에서 관리, 이미지도 override 모델, 빌드가 머지+복사)
- [ ] 폴더 골격 docs/ 컨벤션 최종 확인 (현재 권장안)
- [ ] 난독화 2단계 채택 여부 (피터공 보류)
- [ ] RP `balance=total` 덮어쓰기 — 리셋/누적 의도 (피터공 판단)
- [ ] terser 도입 방식 (npx vs 로컬 설치)
