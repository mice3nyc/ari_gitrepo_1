# devlog

### 2026-05-18 (2차) — m2a egogram 5/18 회의 반영 (도입부·§1·코칭·마무리·리쿠르팅) (세션367)
- **회의 (피터공·손소장·애련공)**: 보험설계사/코치/지점장 포맷 정리. 클공이 정리한 수정 목록(v2) → 피터공 검토 → 모호한 자리 정정 → 시스템 반영
- **§1 통합**: 기존 §1(님의 성향, CM1 짧은 한 줄)과 §2(자아상태의 성향과 말투, CM2 본문) 통합. CM1 한 줄 삭제, CM2를 §1 점수 표시 바로 아래로 이동. §2 섹션 폐지. 후속 섹션 번호 -1 시프트
- **도입부 응축**: "성향 코칭 리포트의 목적" 1블록만 유지. "우수 보험설계사는?" sub 블록 폐기
- **§3(이전 §4) 코칭 로직**: (1) CM4-3 some_coaching ("코치님의 영향력이 줄어드는 것은 아닙니다" 안내 멘트) 삭제 — `allNoCoaching` 일 때만 `all_no_coaching` 표시 (2) CM4-4 해당 ego는 CM4-1·CM4-2 대신 CM4-4 텍스트로 대치 — 별도 detailed 섹션 폐지, 각 ego 카드 안에서 분기
- **명언 §8 폐기**: cm8 렌더 제거 (yaml/lookup 데이터는 보존, 회복 가능)
- **마무리**: "마지막으로 드리고 싶은 말씀" 4문단 + 시그니처 폐기 → 한두 줄 인사 + 연락처(이름·이메일·인스타·전화). 인스타·전화 빈 값일 때 미렌더 (손소장님 답 대기)
- **설문**: "직전 1년 리크루팅 수" 입력 삭제 (옛 admin 데이터는 표·CSV에 유지)
- **메모리 신설**: [[memory/feedback_links_always_as_list]] — 노트 본문 어디서든 위키 링크 둘 이상은 한 줄 슬래시 묶기 금지, 들여쓰기 목록
- **돌릴 자리**: 안정점 `9bc3807` (오늘 작업 전), 중간점 `473da73`(번호 제거 후) — `git revert` 가능
- **커밋 c0b1151 / gh-pages publish**: https://mice3nyc.github.io/mind2action/egogram/
- **문서 갱신**: mind2action/{SPEC, PLAN, TASKS, ROADMAP, ARCHITECTURE}.md 5종 / Assets/incoming/에고그램/26_0518_에고그램_리포트_수정목록_v2.md (§2 한 줄 정정)
- **다음 진입점**: 손소장님 호칭 일원화 xlsx 도착 → cm_*.yaml 재변환 / 5/18 회의 미결 8건 답 오면 추가 반영

### 2026-05-18 — m2a egogram 설문 직무 항목 3종 축소 + 라벨 변경 (세션367)
- **변경 (피터공 박은 자리)**: 설문 6번 항목 라벨 "직무" → "성향 코칭을 받고 싶은 역할". 선택지 7종 → 3종 — ① 고객 컨설팅 영업 / ② 신인 육성 코칭 / ③ 조직운영 리더
- **매핑 (코드 키 유지)**: sales → ①(CM=sales) / coach → ②(CM=coach) / sales_leader → ③(CM=manager). 기존 샘플 데이터 22건(sales 14·coach 3·sales_leader 5) 자연 매핑
- **잔여 4종 보존**: branch_manager·training_leader·division_head·executive는 사용자 화면에서만 삭제, AdminDashboard.JOB_LABELS / cmLookup.JOB_TO_CM에 유지 — 옛 데이터 호환용
- **변경 파일**: SurveyIntro.jsx(JOB_OPTIONS 3종 + 라벨 "역할") / AdminDashboard.jsx(JOB_LABELS sales/coach/sales_leader 새 라벨) / SPEC.md(field 6·역할→CM 매핑 표)
- **빌드**: dist/index.html 0.94kB / index-*.js 1,323kB. vite 462ms OK

### 2026-05-03 (6차) — ai-literacy v0.6 시나리오 단위 누적 + 점수 ±1 단순화 + UI 재배치 (세션278)
- **진단 (피터공)**: 5차 정정 후에도 역량이 빠르게 증가. "x2의 두 번 적용" 의문 → 코드 진단으로 ×2 한 번이지만 root cause는 mult가 아니라 회로 (한 시나리오 안 즉시 누적 → 다음 선택 비용 효과 즉시 변화)
- **디자인 변경 (피터공 박은 자리)**: 누적 단위를 **시나리오로 끌어올림**. 한 시나리오 안에서는 비용 효과 고정. 매 선택은 pending에 쌓이고 시나리오 끝에서 게이지로 흡수. 음수도 ×2 대칭 가능 (시나리오 단위가 안전장치)
- **§12 신설 — pending + 원 마커 시스템**:
  - gameState `pending:{delegation,knowledge}` 신설
  - applyTier1/2/Review 누적 즉시 → pending에 반영으로 변경
  - `_applyDiscount`는 누적값 기준 (pending 배제) → 한 시나리오 안 비용 효과 고정
  - 원 마커 UI: 두 트랙(위·도) 게이지 위에 작은 원 줄. 양수 초록 N개, 음수 빨강 N개
  - 양↔음 전환 시 깨짐 keyframe (0.35s rotate -180deg)
  - `absorbPending()` Promise 함수: 0.6s 흡수 keyframe → value+=pending → setBipolar 갱신
  - cut6 chain의 [0]단계로 흡수 추가: 결과 패널 → **흡수** → 카드 → 레벨업 → 자원 충전
  - startScenario에서 pending 0 reset
- **점수 ±1 단순화 (피터공 박은 결정)**: 한 시나리오 max 6 → max 3, min -6 → min -3
  - DELTA_POS / DELTA_NEG 변수 폐기
  - `getAxisDelta(sign)` 부호 함수로 단순화 (++/+ → 1, --/- → -1, 0 → 0)
  - yaml ++/+/-/--는 그대로 (정정 X)
- **시나리오 선택 UI 재배치**: 가운데 큰 [다음 시나리오] 메인 + 좌측 [학기 처음부터] 보조
  - 메인 라벨 다이내믹: 진행 중 → "이어서 진행" / 새 시나리오 → "다음 시나리오" / 학기 끝 → "학기 종합 리포트"
  - 학기 처음부터 클릭 시 확인 모달 (계속하기 / 다시 시작)
- **빌드**: 257,351 bytes (이전 247,679 → +9,672)
- **다음**: 피터공 플테 — 한 시나리오 안 비용 효과 고정 / 원 마커 max 3 / 흡수 애니메이션 / UI 재배치 + 모달 / 그 후 git 푸시

### 2026-05-03 (5차) — ai-literacy v0.6 발란스 ×4 폭주 정정 + 카드 휘리릭 (세션278)
- **진단 (피터공 박음)**: 위 누적 +6에 비용 효과가 -12로 표시되는 것 발견. 두 자리에 ×2가 동시에 박혀 실효 ×4 회로 — DELTA_POS ×2 (5/3 박힘) + competencyDiscountMult=2 (v0.5 잔존)
- **정정 (피터공 결정)**: 양수 점수 1 = 효과 2 / 음수 점수 1 = 효과 1 비대칭. ×2는 효과 자리에만 박힘
- **코드 변경 3건**:
  - DELTA_POS = `{'++':2,'+':1}` 복귀 (line 595, 5/3 ×2 폐기)
  - CONFIG: `competencyDiscountMult` 폐기 → `competencyDiscountMultPos:2`/`Neg:1` 분리 (line 554)
  - `_applyDiscount` 부호 분기: `dlg>=0?dlg*mPos:dlg*mNeg` (line 835)
- **SPEC §3.3 신설**: 비대칭 효과 배율 — 진단 표 + 코드 자리 박음
- **카드 휘리릭** (별건): travel 0.6s→0.35s + ease-in cubic-bezier(0.55,0,0.85,0.3) + `rotate(720deg)` + buffer 0.2s→0.1s (총 0.8s→0.45s)
- **빌드**: 247,516 bytes (휘리릭 포함). 발란스 정정 후 다시 빌드 필요
- **다음**: 빌드 + 발란스 시뮬 백도 결과 통합 + 피터공 시각 검증

### 2026-05-03 (4차) — ai-literacy v0.6 타이틀+튜토리얼 화면 신설 (세션278, Phase 6)
- **목적**: 게임 진입 직진(시나리오 선택)을 폐기. 메카닉 무게(두 축·자원·카드·레벨업·4유형)에 들어가기 전에 한 화면 펼쳐 보고 진입
- **카피 (피터공 박힘, 두 톤 결합)**:
  - 도입(캐논): "딸깍하면 누구나 할 수 있는 AI 시대라고 한다 / 누구나 할 수 있다면, 누구인가가 중요하다"
  - 진행자 톤: "무엇을 AI가 해야 하고 무엇은 내가 직접 해야 하는지 / 당신은 구별할 수 있을까? / AI 리터러시, 위임의 경계! / 상황에 따른 당신의 선택이 결과물의 점수를 바꾼다 / 높은 점수, 역량 레벨업!"
  - 1·2·3 게임 진행자 톤: 다섯 상황 / 세 번의 선택의 순간 / 점수→경험치→레벨업
  - 버튼: "[게임 시작]"
- **SPEC §11 신설**: 컨셉·진입 흐름·gameState 확장·화면 구성·카피·코드 자리
- **코드 변경**:
  - `showTitleScreen()` 함수 신설 — title-frame 레이아웃 (제목 / 도입 / host-text 박스 / 1·2·3 ol / 큰 시작 버튼)
  - `enterFromTitle()` — tutorialSeen=true → saveGame → showStartScreen
  - `createInitialState()` 에 `tutorialSeen:false` 추가
  - `continueGame()` guard — 구버전 save는 tutorialSeen=true로 (다시 안 보여줌)
  - `initEntry` IIFE — `tutorialSeen===true` 또는 `clearedScenarios.length>0`이면 시나리오 선택, 아니면 타이틀
  - `showStartScreen()` 하단에 "튜토리얼 다시 보기" 링크
- **CSS 추가**: `.title-frame`/`.intro-text`/`.host-text`/`.tutorial-list`(번호 카운터)/`.start-btn-large`/`.tutorial-link`. semester-frame 톤 따라 B&W 미니멀
- **빌드**: 247,447 bytes (이전 242,906 → +4,541 bytes)
- **다음**: 피터공 시각 확인 (시나리오 선택 화면 하단 "튜토리얼 다시 보기" 링크 또는 localStorage 클리어로 진입)

### 2026-05-03 (3차) — ai-literacy v0.6 시나리오 끝 chain 재배치 + 카드 reward 단건 컨펌 (세션278)
- **목적**: 시나리오 종료 시 팝업 순서 정합화. 피터공 안 = "역량 카드 하나씩 + 획득 컨펌 → 레벨업 → 자원 충전"
- **chain 재배치 (SPEC §6.3)**: 결과 패널 1.4초 노출 → [1] 카드 단건 (도 양수+카드 있을 때) → [2] 레벨업 (didLevelUp) → [3] 자원 충전 (학기 끝 아닐 때) → 다음 버튼
- **카드 reward 단건 컨펌 (SPEC §7.6 재작성)**:
  - cascade(2초 자동 간격) + skip 버튼 + ESC + 배경 클릭 폐기
  - 카드 1장 fadein → "획득" 버튼 클릭 → 인벤토리 탭으로 travel(0.6s) → 다음 카드 자동 진입
  - `playCardRewardSequential(cards, note)` Promise 반환 → chain 합류
  - awardCompetencyCards는 데이터 적립만. 시각 reward는 cut6 chain의 첫 단계
- **카드 못 받은 회기 안내**: 결과 패널에 "이번엔 역량 카드를 받지 못했어요" 박스 (도 음수 || 카드 0장)
- **CSS 추가**: `.card-reward-confirm` 버튼, `.no-card-notice` 박스. `.card-reward-skip` 폐기
- **빌드**: 242,906 bytes (이전 242,449 → +457 bytes)
- **다음**: 피터공 selfintro 플테 — A1R3(3장) / A2R1(1장) / A3R1(0장) 세 케이스로 chain 흐름 + 단건 컨펌 동작 확인

### 2026-05-03 (2차) — ai-literacy v0.6 코드 framework 완료 + selfintro 데이터 채움 (세션275)
- **백도 2개 launch + 직도 병렬**:
  - 백도 A: selfintro yaml tier1·tier2 두 축 채움 가설 작성 (`_놀공노트/26.0503 yaml 채움 — selfintro.md`)
  - 백도 B: raw 비용 재조정 (5 시나리오 × 270 라인 × 0.6, 0 발생 없음, 백업 `scenarios.yaml.before-raw-rebalance`)
  - 직도: score-display·stats-bar 진행 중 숨김 정책 (`updateStats` 함수에 currentTier 기반 visibility 토글)
- **multiplier 1.0**: `CONFIG.resourceCostMultiplier:0.6 → 1.0` (raw가 이미 0.6 곱한 값으로 마이그됨)
- **selfintro yaml 적용**: tier1 3건 두 축 추가 + tier2 9건 knowledge 추가. finals 27건 점검 어긋남 없음
- **MIGRATION-VALUES.md** 신설 — 채움 룰 + 시나리오별 도메인 정의 + 매핑 가설 + 자동화 스크립트. 나머지 4 시나리오 백도 작업의 shared spec
- **빌드 검증**: 228,493 bytes 정상
- **다음 세션 진입점**: groupwork·eorinwangja·career·studyplan yaml 채움 백도 4개 병렬 launch. selfintro 의문 4건 피터공 결정 ([[26.0503 yaml 채움 — selfintro]] §의문)

### 2026-05-03 — ai-literacy v0.6 코드 framework 1차 진행 (세션275)
- **목적**: SPEC ↔ 코드 mismatch 해소. v0.5 Phase 8 이후 v0.6 데이터/SPEC만 박혔고 코드는 v0.5 메커니즘 잔존 발견
- **변경 1**: 음수 매핑 압축 + 함수 분기 (커밋 3afd831)
  - `DELEGATION_DELTA={'++':2,'+':1,'0':0,'-':-1,'--':-2}` → `DELTA_POS={'++':2,'+':1}` + `DELTA_NEG={'-':-1,'--':-1}` + `getAxisDelta(sign)` 함수
  - 음수 폭 절반(-2 → -1). 양수·음수 다른 룰 적용 가능 구조 (피터공 5/3 결정: -인 경우 x1)
- **변경 2**: tier1 점수 기여 framework
  - `applyTier1` 함수에 `getAxisDelta` 호출 자리 추가. yaml tier1에 `delegation`·`knowledge` 필드 있으면 위·도 누적, 없으면 fallback 0
- **변경 3**: SPEC.md §6 진행 상태 표 갱신 + 미정 결정 갱신. PLAN.md / TASKS.md Phase 분할(3a/3b/4a/4b/4c)로 코드·데이터 작업 분리
- **별개 미진행** (외부 LLM 분석 사이클로 분리):
  - multiplier 0.6 폐지 + raw 재조정 (발란스 묶음 작업)
  - 시나리오 끝 화면 진행 중 노출 정책 (score-display 토글)
  - yaml tier1·tier2·finals 위·도 두 축 데이터 검증·정정
- **이미 작동** (오진단 정정): 학기 끝 4유형 라벨 화면은 v0.5 Phase 8에서 이미 구현됨 (line 1991·1998·2021)
- **빌드 검증**: 227,543 bytes 정상

### 2026-04-12 — clip_localize.py 신규 생성
- **목적**: Clippings 폴더의 웹 클리핑에서 원격 이미지/비디오를 다운로드하여 로컬 참조로 교체
- **파일**: `_dev/clip_localize.py`
- **기능**: `![](url)` → `![[로컬파일]]` + `[image_url](원본url)` 교체. 비디오는 볼트 외부(OSDN_VAULT)에 저장
- **첫 실행**: Städel Monet 디지토리얼 — 95 이미지(330MB) + 1 비디오(8.7MB) 성공
