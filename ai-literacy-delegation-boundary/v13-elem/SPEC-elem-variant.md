# SPEC — 초등 분리 빌드 (v13-elem)

**최종 업데이트**: 2026-06-21
**작성**: 아리공
**원칙**: 최종 중등 코드 그대로 + 데이터만 초등. v13-mid 무수정.

---

## 0. 한 줄 정의

`v13-elem/`은 최종 중등 빌드(`v13-mid`)의 코드를 통째로 복사하고, 시나리오 데이터만 초등 5종으로 갈아끼운 **별도 형제 빌드**다. 엔진 로직은 중등과 동일하게 두되, 데이터가 요구하는 최소 지점만 v13-elem 복사본 안에서 손본다. v13-mid는 한 줄도 건드리지 않는다(배포 중등 안전).

> 배경·사고 경위: [[요청.26.0621.1539-초등데이터]] / [[초등 분리 빌드 v13-elem — 작업 기록]]

## 1. 폴더 구조

```
ai-literacy-delegation-boundary/
  v13-mid/    ← 최종 중등 (무수정, 배포본). github.io/v13-mid + goe-ai-md.nolgong.com
  v13-elem/   ← 초등 분리 빌드 (이 문서)
    src/      ← 중등 코드 복사 (아래 §4 핫스팟만 초등화)
    data/     ← scenarios.yaml = 초등 5종, 나머지(cuts/texts/ui_texts)는 중등 공유
    build.py  ← 중등 빌드 스크립트 복사 (EXPECTED 키만 초등으로)
    index.html ← 산출물
```

## 2. 초등 5종 시나리오

| id | 제목 | category |
|----|------|----------|
| bookreport | 독후감 쓰기 | 국어 |
| animaltalk | 좋아하는 동물 발표 | 발표 |
| jobcard | 진로 직업 소개 카드 | 진로 |
| classmascot | 반 캐릭터 만들기 | 창작 |
| historycheck | 역사 수행평가 검증 | 사회 |

각 시나리오: 1차 선택 3 × 2차 선택 3 × 검토 3 = 27경로. 5종 × 27 = 135경로.

## 3. 데이터 출처 (source of truth)

- **구조·선택지·점수·등급·카드·결과텍스트**: `Assets/incoming/AI리터러시/시나리오_초등/초등 전체브랜칭.csv` (피터공). 변환기 `data/elem_build_csv.py`.
- **선택 desc/lesson·만화캡션·리포트**: 시나리오별 docx (`시나리오_초등/*.docx`) + 아리공 저작. jobcard만 docx 없어 라벨 기반 저작.
- **결과텍스트(cut6Feedback)**: CSV 28열 "결과텍스트(피드백 반영 수정)" 그대로.
- **회복력 → 적응성**: 회복력은 폐지된 카드(중등 f5cfa62)라 초등 데이터에서 전부 적응성으로 교체.

## 4. 엔진 핫스팟 (v13-elem 내부만 수정 — 중등 무영향)

| 파일 | 변경 | 이유 |
|------|------|------|
| `src/js/00-config.js` | `CONFIG.scenarios` → 초등 5 id | 시나리오 목록 |
| `src/js/15-card-per-choice.js` | `PILOT_PER_CHOICE.scenarios` → 초등 5 id | per-choice 카드 활성화 |
| `src/js/15-card-per-choice.js` | `pilotCardsForChoice` tier1·tier2에 **awardCards 우선 분기** | 아래 §5 |
| `src/js/12-debug.js` | 디버그 시나리오 order → 초등 5 id | 디버그 네비 |
| `build.py` | `EXPECTED_SCENARIO_KEYS` → 초등 5 id | 빌드 키 검증 |

## 5. 카드 지급 모델 — CSV 명시 per-choice (피터공 결정 6/21)

**문제**: 중등 엔진은 카드를 `discountTags`+`axisTagMap`으로 **도출**한다(축마다 카드 1개 고정). 그러나 초등 CSV는 카드를 **선택마다 직접 지정**한다(같은 축이라도 선택에 따라 주체성/적응성 갈림).

**결정**: CSV 그대로 살린다. 데이터의 각 선택에 명시 카드 리스트 `awardCards`를 붙이고, 엔진은 그게 있으면 그대로 지급한다.

**엔진 변경 (최소·중등 중립)**:
```js
// pilotCardsForChoice — tier1/tier2
if(t1.awardCards && t1.awardCards.length){            // 초등: 데이터 명시 카드 우선
  for(...) out.push(t1.awardCards[i]);
}else if(t1 ...){ /* 기존 중등 도출 (awardCards 없음) */ }
```
- `awardCards` 항목 형식: `{kind:'hc',axis,tag,label}` 또는 `{kind:'domain',name,label}`.
- 중등 데이터엔 `awardCards`가 없으므로 기존 도출 경로로 폴백 → **중등 출력 불변**.
- 검증: tier1 A→주체성+문해력, B→적응성+탐색력, C→없음 / tier2 A1→맥락적 사고+문해력 (CSV 일치, CDP 확인).

## 6. 콘텐츠 스키마 (시나리오당)

- **선택 노드** (`tier1`/`tier2`/`reviews`): `desc`(트레이드오프 1문장) + `lesson`(성찰 1문장).
- **중간결과** (`results`, tier2별 9): `text`/`summary`/`lesson`.
- **leaf** (`finals`+`reportData`, 27): `cartoonCaption1~5`(만화 6컷 중 2~6), `reportPathSummary`, `reportReflection`, `shortFeedback`, `awareness` / reportData의 `caption1~5`·`pathSummary`·`reflection`.
- **캡션 조합 규칙**: cap1=상황 / cap2=tier1 행동 / cap3=tier2 행동 / cap4=review 행동 / cap5=결과텍스트.
- 합성 스크립트: `fill_bookreport.py`(독후감), `fill_all.py`(나머지 4 — 백도 저작 JSON 합성).

## 7. 미완 (SPEC 먼저 — 착수 전 이 절 갱신)

- [ ] **초등 컷 이미지**: 현재 H3 이미지맵이 중등 자기소개 컷으로 폴백. 초등 5종 × 6컷 이미지 소스 미정(제작 vs 임시).
- [ ] **footer/타이틀 라벨 변종화**: `index.shell.html` footer "v1.3-mid-r39" + 타이틀 "(중등)" 하드코딩 → elem 라벨.
- [ ] **review-tier 카드**: tier1·tier2 명시 카드 검증 완료. review는 leaf별이라 별도 확인 필요.
- [ ] **storage/gameId 분리**: 배포 시 elem 전용 storageKey·gameId(`ai_literacy_el`)·로깅 분리(동현공 Lambda 등록).

## 8. 빌드

```bash
cd v13-elem && python3 build.py   # → index.html (변종 플래그 불필요, 자기완결)
```
CDP 검증: `/tmp/cdp_*.mjs` (헤드리스 9333). 카드·콘텐츠·예외 확인.
