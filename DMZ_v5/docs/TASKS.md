---
created: 2026-05-14
tags:
  - DMZ
  - 통일부
  - 개발
  - 진행작업
author: 아리공
---
### DMZ v5 분기 진행 작업

> v4 통째 복사로 v5 신설. v4 마지막 미커밋 패치(`.bd-hidden .detail-close button` 가시화) 푸시 후 분기. mobile/offline/sequential 3 빌드 구조 유지. 새 변경은 v5에서.

---

#### 분기 ✅

- [x] v4 미커밋 패치 커밋 + 푸시 (`3a3435c`) — `.bd-hidden .detail-close button` 배경색 표시
- [x] `_dev/DMZ_v4/` → `_dev/DMZ_v5/` 통째 복사 (mobile + offline + sequential + shared + docs + scripts)
- [x] localStorage prefix 교체 — `dmz_v4_*` → `dmz_v5_*` (3 빌드 분리 유지, 한 도메인에서 v4/v5 동시 플레이 가능)
- [x] 경로/문서 참조 갱신 — `DMZ_v4` → `DMZ_v5` (README, docs 7종, scripts 2종, HTML 5개)
- [x] 빌드 재실행 — `bash scripts/build.sh` (mobile 163,496 / offline 163,495) + `bash scripts/build_sequential.sh` (sequential 170,927, mappings 71, JS OK)
- [x] 커밋 + 푸시 (`b2b5d95`)

#### 배포 URL

| 빌드 | URL |
| --- | --- |
| mobile | `.../DMZ_v5/mobile/` |
| offline | `.../DMZ_v5/offline/` |
| sequential | `.../DMZ_v5/sequential/` |

GitHub Pages 자동 배포 — `https://mice3nyc.github.io/ari_gitrepo_1/DMZ_v5/{mobile,offline,sequential}/`

#### 새 변경 (예정)

피터공 사양 대기. v5에서 들어갈 업데이트는 별도 Phase로 추가.

#### 메모

- v4는 보존 상태 유지 — 필요 시 `b2b5d95` 이전 커밋 또는 `_dev/DMZ_v4/` 직접 참조
- v4→v5 분기 시 교체 항목 (메모리 [[memory/feedback_version_branch_checklist|버전 분기 시 연결 값 교체]] 적용):
  - storageKey prefix ✅
  - 빌드 산출 경로 ✅
  - GitHub Pages URL (자동, 폴더 이름만 다름)
  - 문서 내 경로 인용 ✅

→ [[PLAN|v4 PLAN]] / [[TASKS-sequential|v4 sequential TASKS]] / [[2026-05-14]]
