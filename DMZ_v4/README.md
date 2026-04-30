# DMZ v4

DMZ 다이어리 — 두 플레이테스팅 빌드 (모바일 / 공간 설치물)

## 빌드 URL (GitHub Pages, 배포 후)

- **mobile** (인턴 베타 5/26): https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/mobile/
- **offline** (피스트레인 6/12~14): https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v4/offline/

## 빠른 진입

| 작업 | 어느 파일 / 어떤 명령 |
|------|----------------------|
| 콘텐츠 수정 | `shared/index_base.html` STORIES |
| 새 이미지 추가 | `shared/photos/cat0N/{N}-{M}.{ext}` + `photos_manifest.csv` |
| 빈칸/정답 수정 | `shared/index_base.html` (또는 `dmz_blanks.csv` 갱신 시) |
| 두 빌드 산출 | `bash scripts/build.sh` |
| 분기 명세 | `docs/BUILD-VARIANTS.md` |
| 코드 분기 지점 | `docs/CODE-FORK-POINTS.md` |

## 폴더 구조

```
_dev/DMZ_v4/
├── shared/                      ← 단일 source. 작업은 여기서.
│   ├── index_base.html          ← 베이스 코드
│   ├── photos/cat01~06/         ← 영문화된 이미지
│   ├── photos/resized/          ← s0101 전용
│   ├── photos_manifest.csv      ← 영문화 매핑 + 출처 보존
│   ├── dmz_blanks.csv           ← 정답표 (예정 갱신)
│   └── dmz_choices.csv          ← 선택지
├── mobile/index.html            ← 산출물 (OFFLINE_MODE=false)
├── offline/index.html           ← 산출물 (OFFLINE_MODE=true)
├── scripts/build.sh             ← 빌드 스크립트 (예정)
└── docs/
    ├── SPEC.md                  ← 기술 명세 (★ 시작점)
    ├── BUILD-VARIANTS.md        ← 두 빌드 차이 + 빌드 방법
    ├── ARCHITECTURE.md          ← 화면 흐름 + 데이터 구조 (mermaid)
    ├── DATA-SPEC.md             ← 영문화 / STORIES / 빈칸 규칙
    ├── UI-MAP.md                ← 화면/요소 이름 (예정)
    ├── HANDOFF.md               ← 아리공↔아리온 인수인계 (예정)
    └── CODE-FORK-POINTS.md      ← 코드 라인별 분기 정찰 (예정)
```

## 베이스

**v3.2와의 관계**: 베이스 교체. v3.2 `_dev/DMZ/`(레거시 보존) ↔ v4 `_dev/DMZ_v4/`(신규).  
정예공 4/28 빌드(`Assets/incoming/통일부/dmz_game_jygong.html`)를 베이스로 영문화 패치 + 두 빌드 분기 적용.

## 기획 맥락 노트 (볼트)

- [[26.0429 DMZ v4 개발 계획]] — 의도, 두 빌드 분기 설계, 일정
- [[26.0429 DMZ v4 진행 작업]] — 체크리스트
- [[요청.26.0429.1555-DMZ플테빌드]] — 분석 결과 압축
- [[26.0421 통일부 회의 — 정리]] — 4/21 회의(피스트레인 / 인턴 베타 / 콘텐츠 피드백)

## 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-04-29 | v4.0-prep | 환경 세팅 (폴더 트리, 영문화, photos_manifest, 개발 문서 4종) |
