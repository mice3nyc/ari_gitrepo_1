---
created: 2026-04-29
tags:
  - DMZ
  - 통일부
  - 개발
  - 개발계획
author: 아리공
---
### DMZ v4 개발 계획

> 세 빌드 fork(모바일 풀 / 공간 설치물 연동 / 순차 unlock 플테) — Live document. 방향 전환 시 즉시 갱신. 진행 체크리스트는 [[TASKS|v4 TASKS]] (mobile/offline) / [[TASKS-sequential|v4 sequential TASKS]] (sequential)

---

#### 의도 (왜 v4인가)

**v3.2 → v4 = 베이스 교체.** 정예공이 4/28 보낸 새 빌드(`dmz_game_jygong.html`)는 우리 v3.2 위 콘텐츠 추가본이 아니라 **아키텍처 전면 교체된 별개 빌드**다. 데이터 구조(`GAME_DATA → CATEGORIES/STORIES`), 템플릿 방식(하드코딩 → `renderSource()`), 이미지 경로 규칙(`char{N}_photo{M}` → `photos/cat0N/`), 폰트(시스템 → 픽셀 게임 폰트), 화면 흐름 전부 다름. v3.2 회귀 의미 없음 → **v4를 새 베이스로**.

#### 두 빌드 분기 설계

| 빌드 | 사용처 | 일정 | 핵심 차이 |
|------|--------|------|-----------|
| **mobile** | 인턴 베타 / 모바일 데모 | 5/26 (월) 통일부 대회의실, 24명 | 새 빌드 그대로. 모든 자료 모바일에서 텍스트+자료 표시 |
| **offline** | 피스트레인 부스 / 공간 설치물 | 6/12~14 소이산 전망대 | 자료 **B, D는 본문 가림** + `<현장의 출력물을 확인하세요>` 안내 + 정답 입력 시 자료 본문 unlock |
| **sequential** | 순차 unlock 플테 (4/30 새 디자인) | 미정 — 플테 일정에 따라 | 자료 4개 **순차 잠금** A→B→C→D. 빈칸 모달에 정답이 있는 자료 라벨 강조(볼드+컬러). 종이 페어 유지 |

##### sequential 빌드 메카닉 (4/30 추가)

mobile/offline과 병렬로 새 플테 버전. 4/30 플테 후 게임 디자인 변경:

- **순차 잠금**: 진입 시 자료 A만 활성. B/C/D는 회색 처리 + 클릭 차단
- **unlock 조건**: 자료의 모든 빈칸이 풀리면 다음 자료(알파벳 순) 활성
- **빈칸 0개 자료**: 진입 즉시 자동 완성 → 다음 unlock
- **정답 자료 라벨 강조**: 빈칸 모달에 "정답은 자료 D — 카카오톡 대화에서 찾으세요"를 볼드+컬러로 표시 (CSV `in_source` + 자료 `title` 매핑)
- **종이 페어 유지**: 모든 정답은 종이 출력물에서 찾는 구조 (cross-source 정답 OK)
- **베이스 분리**: `shared/index_sequential.html` 별도 file (mobile 베이스에서 fork, OFFLINE_MODE 흔적 제거)
- **LS prefix**: `dmz_v4_s_` (mobile/offline과 분리)

##### offline 빌드 메카닉

각 스토리는 4개 자료(A/B/C/D)로 구성. offline 빌드에서는:
- **A, C**: 모바일에 본문+자료 그대로 표시 (현재 동작 유지)
- **B, D**: 본문 자리에 `<현장의 출력물을 확인하세요>` 안내만. 빈칸 입력란은 그대로
- 정답 입력 → 같은 `source-detail` 오버레이 안에서 본문이 추가되어 보임 (in-place unlock)

→ 오프라인 출력물(B/D)이 있어야 게임 진행 가능. 공간 설치물 활동 강제.

#### 폴더 구조

```
_dev/DMZ_v4/
├── shared/                ← 공통 자산 (두 빌드가 공유)
│   ├── index_base.html    ← 베이스 (정예공 빌드 + 영문화 패치)
│   ├── photos/cat01~06/   ← 영문화된 이미지
│   ├── photos/resized/    ← s0101 전용 잔존 (그대로 유지)
│   ├── photos_manifest.csv ← 영문화 매핑 + 원본 한글명 + 출처 보존
│   ├── dmz_blanks.csv     ← 정답표 (갱신 예정)
│   └── dmz_choices.csv
├── mobile/index.html      ← 모바일 풀 빌드
├── offline/index.html     ← 공간 설치물 빌드 (BD 가림 + unlock)
└── docs/
    ├── SPEC.md
    ├── ARCHITECTURE.md
    ├── UI-MAP.md
    ├── DATA-SPEC.md
    ├── BUILD-VARIANTS.md  ← ★ 두 빌드 분기 명세
    ├── HANDOFF.md
    └── CODE-FORK-POINTS.md
```

#### GitHub 빌드/링크 구분

**A안 (채택)**: 폴더 분리. main 브랜치 한 번 push → 두 GitHub Pages URL.
- 모바일: `mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/mobile/`
- 오프라인: `mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/offline/`
- 기존 `/DMZ/`(v3.2)는 그대로 유지(과거 빌드 보존)

장점: 단일 브랜치 / 동시 배포 / 비교 디버깅 / Obsidian Sync와 충돌 없음
단점: 콘텐츠 변경 시 동기 작업 필요 (shared/ 갱신 후 mobile/, offline/ rebuild)

#### 핵심 결정사항

1. **베이스 교체**: v3.2 회귀 X. 정예공 새 빌드 = v4 베이스
2. **이미지 네이밍 단순화**: `{cat}-{N}.{ext}` 형식. 출처/설명은 `photos_manifest.csv`에서 보존
3. **cat02 `2-6_` 충돌 정정**: 용늪 → `2-9.jpg`로 번호 정정 (수원청개구리는 `2-6.jpg` 유지)
4. **cat06 번호 prefix 통일**: `06_*` → `6-1~6-11` (다른 cat과 일관성)
5. **한글 미러 폴더**: incoming은 정예공 원본이라 보존. shared/photos/는 영문 폴더만 생성
6. **분기 토글**: 단일 코드에 mode 플래그(`window.OFFLINE_MODE = true/false`) 또는 빌드 시점 분기 — SPEC에서 결정
7. **shared/ 갱신 → 두 빌드 rebuild** 파이프라인: 정예공 cat04~06 콘텐츠 도착 시점에 작동 필요 (4/21 회의 약속: 이번 주 갈등과협력, 다음 주 평화관광)

#### 분기 전 베이스 패치 후보

shared/index_base.html에 미리 적용해서 두 빌드 모두 혜택 받게:

- [ ] **s0101 D 빈칸 altAnswers 부활** — `사;4km;4킬로미터` (CSV에는 있지만 새 빌드에서 누락)
- [ ] **`normalizeAnswer` 부활** — 공백/괄호/대소문자 무시. 4/21 회의 "복수정답=필수" 정신
- [ ] **cat02 `2-6_` 번호 충돌 정정** (백도 작업에 포함)
- [ ] **dmz_blanks.csv 전면 갱신** — 18 스토리 정답 + altAnswers (CSV가 다시 source of truth가 되도록)

#### 미해결 (피터공 결정 필요)

- [ ] cat04~06 콘텐츠 도착 일정 — 정예공에게 확인 (4/21 약속 진행 상태)
- [ ] 공간 출력물 디자인은 별도 산출물(수영공) — 우리 빌드와 동기 일정 필요
- [ ] 인코딩 검증 — 영문화 후 GitHub Pages http://에서 정상 로드 확인

#### 일정 백워드

```
6/12 (금)  피스트레인 D-day → offline 빌드 ready
  ↑
6/05경      offline 빌드 1차 완성 + 출력물 인쇄 시안
  ↑
5/26 (월)  인턴 베타 D-day → mobile 빌드 ready (24명 플레이)
  ↑
5/22경     mobile 빌드 1차 완성 + 통일부 사전 점검
  ↑
5/15경     공통 베이스(shared/) + 두 빌드 분기 로직 완성. cat04~06 통합
  ↑
5/01~07   분기 SPEC 확정 + 코드 fork (이번 주~다음 주)
  ↑
4/29 (오늘) 개발 준비 — 환경 세팅 + 개발 문서
```

#### 참고

- [[요청.26.0429.1555-DMZ플테빌드]] — 진입 박스 + 분석 결과 압축
- [[26.0421 통일부 회의 — 정리]] — 4/21 회의(피스트레인 6/12, 인턴 베타 5/26, 콘텐츠 피드백)
- [[DMZ 다이어리 v3.1 업데이트 과정 노트]] — 3월 v3.1 작업 (v3.2 베이스)
- `_dev/DMZ_v4/docs/` — 기술 SPEC (생성 예정)
- 정예공 새 빌드: `Assets/incoming/통일부/dmz_game_jygong.html`
