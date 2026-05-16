# DMZ v5 — PLAN

> 개발 계획 (Live document). 방향 전환 시 즉시 갱신. 진행 체크리스트는 [[TASKS|v5 TASKS]] / 기술 명세는 [[SPEC]] / [[SPEC-sequential]] / [[SPEC-data-v2]].

## 5/15 5계층 + 마크다운 face — 데이터 구조 v2 (현재 진행)

### 왜

1. **yaml 분리만으로 부족** — 5/14 외부화 후에도 yaml `templateData` 12 type 가변 nested 구조에 콘텐츠가 박힘. cat05·06 사고에서 코드 case ↔ yaml field 다중 매칭 실수 발생.
2. **콘텐츠 작가 편집 친화** — 정예공/박성렬이 yaml 편집은 부담. md 5 파일 (대분류별) + frontmatter 단순 메타 + 본문 markdown 자유.
3. **표시 텍스트 본문화** — yaml meta string에 포맷(볼드/줄바꿈/따옴표) 박기 escape 지옥. 본문 통째 markdown → HTML이 자연.

### 무엇

- **5계층 폴더 구조**: `data/sources/cat*/s*/{_meta.md, A·B·C·D-{대분류}.md}` — SPEC-data-v2 §3
- **§17 마크다운 face**: 텍스트 subtype 9종 frontmatter 표시 메타 폐기, 본문 통째 markdown → HTML. 특수 5종(photo/oral/kakao/text/qna) 기존 분리 유지
- **파서**: `scripts/md_to_json.py` — frontmatter + body markdown → JSON
- **렌더**: `if (d.html)` 새 분기 + 옛 yaml 호환 폴백 (Phase 4.2까지 유지)

### 제약

- **5/26 베타 D-11** — 베타 위협 X 작업만. Phase 4.1 파일럿(s0202)까지만 진행, Phase 4.2 일괄 마이그는 베타 후
- **옛 yaml 35 스토리 호환** — 두 분기 임시 유지. Phase 4.2 일괄 마이그 완료 시 옛 분기 제거

### Phase

- **Phase 4.1 파일럿** (5/15~17) — s0202 두루미 한 자리 5계층 + §17 본문화 ✅
- **Phase 4.2 일괄** (5/27~6/3, 베타 후) — 나머지 35 스토리 백도 6개 병렬
- **Phase 4.3 작가 핸드오프** (6/4~) — 정예공/박성렬 가이드

## 5/14 v5 미션 — STORIES 데이터 외부화

### 왜

1. **콘텐츠가 도착했다** — 5/14 10:46 정예공이 `Assets/incoming/통일부/최종 원고/` 에 cat01~06 6 카테고리 모두 신착. cat04~06(빈 배열)을 채우는 작업 + cat01~03 갱신본이 같이 들어옴.
2. **현재 구조는 콘텐츠-코드 결합** — `shared/index_base.html` L655~ 인라인 STORIES. 베이스 코드 안 직접 박혀 있어 정예공 docx → 수동 파싱 → 코드 직접 수정 파이프라인. cat04~06 추가 시 베이스 2400→4000+ 줄로 커지고 콘텐츠 한 줄 수정도 코드 변경.
3. **선례** — AI 리터러시 v06가 `texts.yaml`로 콘텐츠 분리해서 정혜공/손소장 같은 비개발 협업자가 직접 편집. 같은 방향.
4. **검수 가능성** — CSV/yaml 분리 시 빈칸 정합, 정답 일관, source 라벨 검증을 빌드 단계에서 자동화 가능.

### 무엇

- **베이스 HTML에서 STORIES 인라인을 분리**해서 외부 편집 가능한 데이터 파일로.
- 외부 콘텐츠(`최종 원고/` 폴더 정예공 자료) → 우리 데이터 포맷으로 **변환하는 스크립트**.
- 빌드 단계에서 외부 데이터를 HTML에 **자동 주입**(현재 sequential의 BLANK_SOURCE_LOOKUP 주입 패턴 확장).

### 제약

- **단일 HTML 유지** — file:// 동작 + GitHub Pages 호스팅 + 인턴 베타 환경. fetch() 외부 파일 로드 X.
- **5/26 인턴 베타까지 안정성** — D-12. 큰 구조 변경이 베타를 깨면 안 됨.
- **회의 전 2시간 안에 PLAN+SPEC 골격**, 코드 진입은 회의 후.

## 외부화 형식 — 결정 (5/14)

### 큰 방향 (확정)

**인간 face = CSV, 중간 = yaml, 빌드 = JSON 주입.** AI 리터러시 v06 패턴(`csv_to_yaml.py` round-trip) 차용.

```
인간 편집(CSV) → csv_to_yaml.py → data/topics/*.yaml → build_stories_json.py → 빌드 주입
```

### 왜 (피터공 5/14 결정)

- **인간 face CSV** — 정예공·박성렬이 스프레드시트로 익숙하게 편집. AI 리터러시가 검증된 패턴.
- **주제별 분할** — 한 파일에 36+ 스토리 다 몰지 않기. 한 주제 단위로 쪼개면 인간이 한 번에 보는 양이 적고, 아리공 처리(변환·검증·diff)도 작은 호흡.
- **자료 type별 다름 인정** — 12 type 각각 nested 구조 다름(paragraphs 배열·photos[]·kakao messages 등). 평면 한 CSV로 다 표현 못 함. 자료별로 다른 구조로 처리.
- **yaml은 중간 형식** — CSV로 표현 어려운 nested 본문은 yaml에서 자연. 빌드도 yaml 단계에서 주입.

### 결정 자리 (회의 후 첫 자리)

CSV 단위 두 후보 중 결정:

| 안 | 구조 | 인간 편집 모양 |
|----|------|--------------|
| **두 CSV 분리** | `stories.csv` (메타·blanks·choices) + `sources.csv` (자료 본문, type별 컬럼) | 한 스토리 = stories 1행 + sources 4행 인접 |
| **type별 CSV 분리** | `stories.csv` + `letters.csv`·`newspapers.csv`·`photos.csv`... 12개 | 한 type 집중 편집 가능, 한 스토리는 여러 파일에 흩어짐 |

빌드 산출 yaml 구조는 결정 무관 — 아래 SPEC-data 스키마.

### yaml 구조 (빌드 중간 형식)

```
data/topics/
  01-{주제명}.yaml     # 한 주제 5~6 스토리
  02-{주제명}.yaml
  ...
  06-{주제명}.yaml
  archivist_types.yaml
```

## Phase

### Phase 1 — 분리 ✅ (5/14 완료, 1.2 + 1.10~13만 회의 후)

- Phase 1.1~1.9: 외부화 파이프라인 + 회귀 검증 완료. data/topics/*.yaml 6개 + archivist_types + build_stories_json.py + 두 베이스 HTML placeholder + build.sh/build_sequential.sh 갱신. cat01~03 18 스토리 1:1 일치 회귀 통과.
- Phase 1.2: **CSV 단위 결정 보류** — 5/14 결정: 인간 face는 일단 미루고 아리공 직도로 cat04~06 채움 우선. CSV face는 cat04~06 완료 후 진입.
- Phase 1.10~1.13: yaml_to_csv·csv_to_yaml·round-trip·validate — Phase 1.2 결정 후

### Phase 2 — cat04~06 yaml 채우기 (아리공 직도)

5/14 방향 전환: 자동 파서 대신 docx 텍스트 dump → 백도 yaml 작성 → 메인 통합 빌드. 사진은 정예공 폴더에서 일괄 카피.

- Phase 2.1~2.4: ✅ cat04 완료 (6 스토리: s0401 선전마을 / s0403 기정동 / s0404 사라진마을들 / s0405 UN과 대성동 / s0406 대성동 초등학교 / s0407 민통선 마을). 사용된 자료 type: blog/diary/scholar/report/newspaper/photo/oral/kakao. 5/14
- Phase 2.5: 피터공 cat04 브라우저 플테
- Phase 2.6~2.7: cat05·cat06 같은 패턴 (회의 후)
- Phase 2.8: cat01~03 갱신본 통합 (정예공 신착 vs 인라인 diff) — 후순위

### Phase 3 — 검수 & 베타 (5/26 전)

- Phase 3.1 — 5/26 베타 시나리오 완주 테스트
- Phase 3.2 — 콘텐츠 검수 시트(스프레드시트로 export) — 정예공·박성렬 검수용
- Phase 3.3 — 정정 round-trip (CSV/yaml → 코드)

### 5/15 세션355 — pickone 빌드 신설 (sequential + 첫 자료 가변)

- ✅ 네 번째 빌드 `pickone/` 신설 — sequential 룰 그대로, 진입 시 첫 자료 슬롯만 가변
- ✅ `data/first_source.csv` 신설 (24행) — 디폴트 자동 산출(photo answer_from owner) + 편집 가능 face
- ✅ unlock 알고리즘 — 첫 슬롯부터 A·B·C·D 사이클 (예: 첫=B → B→C→D→A)
- ✅ `shared/index_pickone.html` — index_sequential.html 복사 + getStoryFirstSlot/getUnlockOrder 추가, LS_PREFIX `dmz_v5_p_`
- ✅ `scripts/build_pickone.sh` — STORIES + BLANK_SOURCE_LOOKUP + FIRST_SOURCE_LOOKUP 주입
- ✅ `docs/SPEC-pickone.md` — 메카닉 명세
- ✅ 빌드 회귀 — pickone 267,564 bytes / 95 blank + 24 first / JS syntax OK
- **24 스토리 디폴트 산출**: B 3건(s0101·s0403·s0404), C 4건(s0601·s0602·s0604·s0605), A 명확 4건, A fallback 13건(photo answer_from 누락 — 정예공/박성렬 검토 자리)
- **다음 진입점**: 피터공 브라우저 플테 → 4 빌드 중 베타 사용 빌드 결정 → photo answer_from 누락 13 스토리 검토

### 5/16 세션359 — pickone 디자인 v2 (마닐라 폴더 패턴) ✅

피터공 "다이나믹·구체적 면 누락" 피드백 후 진입. 핵심 결과:

- **색 토큰 정정** — SVG export 17개에서 hex 직접 추출. cat-01~06 + bg 색 6개 정확한 값으로 정정
- **마닐라 폴더 패턴** — cat-card·story-card 본체 border-radius 0/14/14/14 + `::before` 좌상 사선 탭(clip-path) + `::after` 뒤 흰 layer + 폴더 안 글씨
- **226 스토리 선택** — BG=cat-color(헤더까지), 좌측 「← 주제선택」알약 버튼 + 우측 흰 탭 + 흰 시트 + 폴더 격자
- **240 자료 선택 Z 위계** — z=1 phase-cat-tab(전체 폭 회색 띠, 클릭→주제선택) + z=2 phase-sheet(흰 시트+자료 카드) + z=3 phase-story-tab(우측 50% 흰 BG, 시트 위로 솟음). BG=cat-color
- **자료 카드 겹겹이 쌓임** — margin-top -32px + JS inline z-index. padding-bottom 3rem
- **drop shadow 전부 off** (피터공 "지저분해" 결정)
- **unlock 깜빡** — opacity 1↔0 토글, steps(1), 0.16s × 4
- **SD 카드 진입 애니메이션** — 아래서 튕겨 올라오는 딸깍 cubic-bezier 1.05s
- **era/soundNote 자료 화면 제거** (다른 자리 결정 자리)
- **비교 빌드 pickone-v1/** 신설 — 어제 빌드 사본, `../pickone/assets/` 상대경로
- **빌드**: pickone/index.html 285,821 bytes. JS syntax OK

**잔여 (디자인 v2 정합 우선)**: 일러스트 자산 수령(편지+봉투·메가폰·액자·마이크), era/soundNote 위치 결정, 226·240 결 통일 여부 검토, Figma MCP 세팅.

### 5/15 세션354 — 런칭 스코프 축소 + canon 비교 + 베타 사전 인프라

- ✅ 36 → **24 스토리 축소** (5/14 회의 결정): cat05 통삭 + 8 스토리 archive
- ✅ s0506 B↔C swap (5계층 슬롯 정합), s0205/s0602 답 정정 + altAnswers
- ✅ 코드 정합 — `build_stories_json.py` TOPIC_FILES에서 cat05 제거, `index_base/sequential.html` categories에서 cat05 카드 제거, `dmz_blanks.csv` 48행 삭제(143→95)
- ✅ **DMZ 픽셀 맵 24셀 5존 재설계** (archive 화면) — `CAT_COLORS` 6→5, map 데이터 6→5 카테고리 정합. SPEC §DMZ 픽셀 맵 신설
- ✅ **디버그 패널 도입** (인턴 베타 자체 테스트) — 우하단 토글, 상태 표시 + 🧹 초기화 + ⚡ 자동 풀이 3종. URL `?reset=1` 파라미터 (Ctrl+Shift+R 대체). SPEC §디버그 패널 신설. 양 베이스 동일 갱신
- ✅ 빌드 회귀 — mobile 260,536 / offline 260,535 / sequential 266,591 bytes, JS syntax OK
- ⚠️ **canon 발견**: 통일부 docx 2차원고(5/7) + xlsx 정답표(5/14)가 현 게임 데이터와 다수 어긋남. 두루미 예시 [[CONTENT-DIVERGENCE-두루미-26.0515]]. 베타는 현 데이터로 진행, 베타 후 정예공/박성렬 합의 → Phase 4.5에서 정합화. 상세 [[CONTENT-AUDIT-26.0515]]
- **다음 진입점**: 메카닉 변경 (피터공 5/15 세션354 말 — 다음 세션에서 SPEC 갱신 후 코드)

## 외부화 형식 결정 자리

- [x] 큰 방향 — 인간 CSV face + 중간 yaml + 빌드 주입, 주제별 분할 (5/14)
- [ ] CSV 단위 — 두 CSV 분리 vs type별 CSV 분리 (회의 후 첫 자리)
- [ ] sequential 빌드도 같은 데이터 공유 vs 별도 — 같이가 자연 (cat04~06 동일 콘텐츠)
- [ ] 변환기 자동화 정도 — 100% 자동 vs 변환 후 수동 다듬기 (외부 자료 형식 자유도에 따라 결정)

## 미해결

- CSV 단위 결정 (위)
- 최종 원고 폴더가 cat01~03 갱신본도 포함하는지 (덮어쓰기 여부)
- 정혜공/박성렬 검수 워크플로우 — CSV 편집 후 csv_to_yaml.py 돌리는 주체(아리공 vs 자동화)

## React 마이그레이션 — 나중 결정 (5/14 합의)

지금은 vanilla 유지. cat01~06 외부화 + 5/26 인턴 베타 안정성 우선. **마이그레이션 시점 3단계**:

1. **~5/26 베타** → vanilla + 외부화만 (현재 작업)
2. **5/26 베타 ~ 6/12 피스트레인** → React 파일럿 1 컴포넌트 (12 type 중 letter 또는 photo) 시도, vanilla와 비교
3. **6/12 피스트레인 후** → 풀 마이그레이션 결정 (cat04~06 통합·베타 결과 반영)

외부화(yaml 분리)는 React로 가더라도 그대로 활용 — 마이그레이션과 직교.

## 인계

- 베이스 코드: `_dev/DMZ_v5/shared/index_base.html` L655~ STORIES 인라인
- 외부 데이터: `Assets/incoming/통일부/최종 원고/01.~06./`
- 참조 패턴: AI 리터러시 v06 `data/texts.yaml`, DMZ sequential의 `BLANK_SOURCE_LOOKUP` 자동 주입
- 변경 이력 / 의사결정: [[요청.26.0514.1120-DMZv5코드리뷰|코드 리뷰 요청 노트]]
