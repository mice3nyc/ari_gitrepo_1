# TASKS — 초등 분리 빌드 (v13-elem)

**최종 업데이트**: 2026-06-21
**SPEC**: SPEC-elem-variant.md · **PLAN**: PLAN.md

> 이 TASKS는 초등 분리 빌드 전용. 중등 작업 기록은 `../v13-mid/TASKS.md`.

## ★ 2026-06-21 — 초등 분리 빌드 v13-elem 구축

### 완료
- [x] v13-mid → v13-elem 분리 폴더 복사 (builds·변종오버레이 제외). v13-mid 무수정.
- [x] 데이터: 초등 5종 scenarios.yaml (브랜칭 CSV 변환 + docx 콘텐츠). 회복력→적응성. ⟨TODO⟩ 0.
- [x] 카드 모델: CSV 명시 per-choice (`awardCards`). 엔진 awardCards 우선 분기(중등 무영향). CDP 검증(A→주체성+문해력 등).
- [x] 엔진 핫스팟 초등화(v13-elem 내부): 00-config·15-card-per-choice×2·12-debug·build.py EXPECTED키.
- [x] 콘텐츠 저작 5종: 독후감(직접 docx), 동물발표·캐릭터·역사검증(백도 docx), 진로카드(라벨 기반). desc/lesson·만화캡션·리포트·중간결과.

### 빌드 기록
- `2026-06-21 20:41` — `index.html` **1,014,768 bytes** / scenarios.yaml 514KB / 5종 ⟨TODO⟩ 0 / CDP 예외 0. → 피터공 검토 통과 후 커밋 **`0b4711b`** (main 푸시).
- `2026-06-21 (라벨+이미지)` — 라벨 v1.3-elem 통일 + 초등 컷 이미지 분리(`v13-elem/images/` 125장 PIL 처리·237 webp q88 + _unused 15). id맵·경로 초등화. CDP 125/125 로드·237². 커밋 **`623aefc`** (main 푸시).
- `2026-06-21 (타이틀 stretch)` — 타이틀 c1 5장 모서리 pad → **237² stretch**(피터공: 좌우 빈 공간 제거, 텍스트 전체 보존). 캐시버스트 `v20260621c`. 커밋 **`5a2d687`** (main 푸시).

### 미완 (SPEC §7 — 착수 전 SPEC 갱신)
- [x] footer/타이틀 라벨 변종화 (6/21) — index.shell.html 타이틀·footer + 00-config.js version 직접 elem화. 빌드 모델 메모 SPEC §7.
- [x] 초등 컷 이미지 (6/21) — v13-elem/images/ 자체 분리. B안 매핑(cut1=타이틀). CDP 검증. → [[요청.26.0621.2143-초등이미지]]
- [ ] review-tier 카드 leaf별 확인 (tier1·tier2 검증됨)
- [ ] 배포 storage/gameId 분리 + 동현공 Lambda 등록
- [ ] git 커밋·푸시 (라벨 변경분)
