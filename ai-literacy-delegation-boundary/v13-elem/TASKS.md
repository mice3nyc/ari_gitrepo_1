# TASKS — 초등 분리 빌드 (v13-elem)

**최종 업데이트**: 2026-06-21
**SPEC**: SPEC-elem-variant.md · **PLAN**: PLAN.md

> 이 TASKS는 초등 분리 빌드 전용. 중등 작업 기록은 `../v13-mid/TASKS.md`.

## ✓ 2026-06-29 — 입장 화면(이름·수업코드) + 리포트 이름 개인화 (피터공, 요청 [[요청.26.0629.1341-이름수업코드입장]])

- [x] 입장 화면(별도 첫 레이어 `#crtEntry`) + 리포트 이름 3곳 + 캐싱 안 함 — 중등과 동일 수정. 상세는 `../v13-mid/TASKS.md` 2026-06-29 항목.
- [x] **빌드** — `index.html` + `builds/elem`(802,616 B, --release). **커밋 75a7728** push. 동현공 전달본 `~/Downloads/AI리터러시_동현공전달_260629/elem`.

## ★ 2026-06-21 — 초등 분리 빌드 v13-elem 구축

### 완료
- [x] v13-mid → v13-elem 분리 폴더 복사 (builds·변종오버레이 제외). v13-mid 무수정.
- [x] 데이터: 초등 5종 scenarios.yaml (브랜칭 CSV 변환 + docx 콘텐츠). 회복력→적응성. ⟨TODO⟩ 0.
- [x] 카드 모델: CSV 명시 per-choice (`awardCards`). 엔진 awardCards 우선 분기(중등 무영향). CDP 검증(A→주체성+문해력 등).
- [x] 엔진 핫스팟 초등화(v13-elem 내부): 00-config·15-card-per-choice×2·12-debug·build.py EXPECTED키.
- [x] 콘텐츠 저작 5종: 독후감(직접 docx), 동물발표·캐릭터·역사검증(백도 docx), 진로카드(라벨 기반). desc/lesson·만화캡션·리포트·중간결과.

### 빌드 기록
- `2026-06-23` — **커밋 dc0e433 dev-live 반영** (오늘 초등 작업 일괄 푸시). 이미지 125장 교체 + RP 레벨업 보너스 OFF + S→A 통합 + 카드팝업 앵커 변경이 한 커밋(**dc0e433**, main)으로 GitHub push, 개발 라이브(github.io) 반영 확인. 최종 `index.html` **1,029,724 bytes**, 캐시버스트 `20260623a`. (학교 배포본 builds/elem은 별개·미전달.)
- `2026-06-23` — **S 등급 폐지 → A 통합** (피터공 결정, DECISIONS §10.17). "S도 A". `getGrade`가 A부터 시작(95점+도 A), 최고 등급 A. S=30 리워드는 최고 등급이 A가 되며 자연 제거. `_judgePattern`은 `(S+A)` 합산이라 영향 없음. S 라벨·무드·30 리워드 config 항목은 미사용 dead로 잔존. 초등·중등 둘 다 동일. 커밋 **dc0e433**.
- `2026-06-23` — **초등 카드팝업 앵커 `.panel-image` → `.panel` 전체** (`16-card-rail.js`). 선택지 포함 박스 하단 정렬. **초등만**(중등 미적용). 커밋 **dc0e433**.
- `2026-06-23` — **RP 레벨업 보너스 OFF** (피터공 결정, DECISIONS §10.16). `rpLevelUpBonusByLevel:{2:10,3:15,4:20,5:25}` → `{2:0,3:0,4:0,5:0}` (`src/js/00-config.js:51`). 등급 리워드(S30/A20/B15/C10/D5)만 남김. 이유: 보이는 레벨업 연출 6/16 폐기 후 숨은 RP 레벨업 보너스만 남아 리워드가 화면 설명 없이 +10~25씩 커지던 것 제거. 초등·중등 둘 다 동일 수정. `python3 build.py` → `index.html` **1,029,352 bytes**, 산출물에 0 반영 확인. → 커밋 **dc0e433**(main) dev-live 반영.
- `2026-06-23` — **초등 새 컷 26장 기준 이미지 교체** (피터공 6/23: "중등과 같은 기준으로 작성, 딱 26개"). 새 원본 `Assets/incoming/AI리터러시/scenario_elementary_images2/`(시나리오당 28파일 중 img01~26 실제, img27·28 빈 장). 확정 매핑: img01=c1(타이틀)·img02=무시(상황, 슬롯 없음)·img03~05=c2 A/B/C·img06~14=c3(9)·img15~23=c4(9)·img24~26=c5 R1~R3(3) = 시나리오당 25장. 중등과 동일 25슬롯 구조라 코드 무변경. 신규 스크립트 `scripts/convert_elem_images.py`(중앙 정사각 crop→237² LANCZOS→webp q88). **125장** 변환·전부 237²·총 2.0MB, 기존 동일 파일명 제자리 교체. 옛 이미지 백업 `images/_backup_pre_0623_1752/` + git `623aefc`. 캐시버스트 `20260621d`→**`20260623a`**(`src/js/02-state.js`). `python3 build.py` → `index.html` **1,029,200 bytes**(코드 동일, 이미지만 변경). 검증: 125/125 참조 존재·변환 육안 확인(s01_c1 타이틀·c2_A 책상·c5_R3 결말=img26)·로컬 Chrome 오픈. 커밋은 피터공 육안 플레이 확인 후 보류. → [[요청.26.0623.1752-초등이미지업데이트]]
- `2026-06-22` — **replaySuggestion 135개 저작 + 주입** (피터공 6/21 요청: 빈 텍스트 채우기, 범위=replaySuggestion만). 가시 텍스트 전수 감사 결과 만화·리포트 본문은 이미 135/135 채워짐, 빈 채 코드가 읽는 건 replaySuggestion(C/D/B 다시도전 팁)뿐 확인. 백도(sonnet) 저작 → `merge_replaysug.py` 무결성 검증(다른 필드 변경 0) → `build.py`. `index.html` **1,029,200 bytes**. CDP 스모크 검증: 콘솔 에러 0·예외 0·5종 135 leaf·빈 replaySuggestion 0. 신규 스크립트: `data/merge_replaysug.py`·`data/export_full_csv.py`. 전체 데이터 CSV(135행×56컬럼) → `data/elem_full_data.csv` + `~/Downloads/AI리터러시_초등_전체데이터.csv`. 커밋 **`62cff33`** (main 푸시, 라이브 반영). → [[요청.26.0621.2323-초등텍스트채우기]]
- `2026-06-21 20:41` — `index.html` **1,014,768 bytes** / scenarios.yaml 514KB / 5종 ⟨TODO⟩ 0 / CDP 예외 0. → 피터공 검토 통과 후 커밋 **`0b4711b`** (main 푸시).
- `2026-06-21 (라벨+이미지)` — 라벨 v1.3-elem 통일 + 초등 컷 이미지 분리(`v13-elem/images/` 125장 PIL 처리·237 webp q88 + _unused 15). id맵·경로 초등화. CDP 125/125 로드·237². 커밋 **`623aefc`** (main 푸시).
- `2026-06-21 (타이틀 stretch)` — 타이틀 c1 5장 모서리 pad → **237² stretch**(피터공: 좌우 빈 공간 제거, 텍스트 전체 보존). 캐시버스트 `v20260621c`. 커밋 **`5a2d687`** (main 푸시).

### 미완 (SPEC §7 — 착수 전 SPEC 갱신)
- [x] footer/타이틀 라벨 변종화 (6/21) — index.shell.html 타이틀·footer + 00-config.js version 직접 elem화. 빌드 모델 메모 SPEC §7.
- [x] 초등 컷 이미지 (6/21) — v13-elem/images/ 자체 분리. B안 매핑(cut1=타이틀). CDP 검증. → [[요청.26.0621.2143-초등이미지]]
- [ ] review-tier 카드 leaf별 확인 (tier1·tier2 검증됨)
- [ ] 배포 storage/gameId 분리 + 동현공 Lambda 등록
- [ ] git 커밋·푸시 (라벨 변경분)
