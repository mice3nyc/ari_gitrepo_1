# devlog

### 2026-05-25 — m2a egogram CM6 재정정 (손소장 새 파일) (세션378)
- **요청**: 손소장 "CM6번만 구글드라이브 올라온 것으로. 가장 최근에 문장 정정했는데 그것만 반영 안 됨". 새 파일 `Assets/incoming/에고그램/data/컨설턴트로 수정 - 손소장.xlsx`(379KB, 11:11) — CM6 시트 + **CM6 공통적용 시트 신규 추가**(기존 Archives엔 없던 시트)
- **CM6 클로징 조합(cm6)**: convert_cm.py `parse_combo_single`로 CM6 시트 변환 → cm_insurance.yaml의 cm6만 교체. 20조합 중 **9조합 정정**(CP_NP·CP_A·CP_FC·CP_AC·NP_CP·NP_A·NP_FC·NP_AC·A_CP). 정정 결: "고객님은 마음속으로~" → "이 상황에서 컨설턴트는~" 화자/표현 정정
- **CM6 공통적용(cm6_common)**: cm6_common_consultant.yaml 재생성. 피터공 안내 "좌열=소제목, 우열=본문" → 소제목을 시트 좌열로 교체(거절의 고객 심리→고객의 실제 심리 해석 / 화법 스크립트 코칭→재질문 및 재결정 유도 / 클로징 화법→최종 진행 멘트), 본문 2섹션 갱신(3섹션째는 동일)
- **검증**: 새 파일로 cm6 외 전 시트 파싱 → cm2·cm3·cm4_1·cm4_4·cm5·cm7 현재 yaml과 **완전 동일**(헤더 행 구조 차이는 라벨 앵커 스캔 덕에 본문 무영향). cm_insurance.yaml git diff = cm6 9조합만. 손소장 "CM6만" 요청과 일치
- **별도 발견 (반영 보류)**: ① cm4_2 2셀(17-20.A·14-16.A) "코칭이 필요없는 구간"→"조율이 필요없는 구간" — 전체 코칭→조율 방향 일치, 반영 추천하나 손소장 "CM6만"이라 피터공 확인 대기 ② Archives/컨설턴트.xlsx는 CM6 옛 버전 — 다음 전체 재변환 대비 새 파일로 교체 여부 확인 대기
- **변경 파일**: cm_insurance.yaml(cm6) / cm6_common_consultant.yaml / SPEC.md / TASKS.md
- **빌드/배포**: vite OK (87 모듈). gh-pages published → 피터공 라이브 확인 대기

### 2026-05-25 — m2a egogram 인쇄 컬러 바 + §4 소제목·cm7 섹션 삭제 (세션378)
- **인쇄 컬러 바 출력**: 피터공 "그래프 출력하면 컬러 바가 안 나온다". 브라우저 기본값이 배경색 미인쇄 → `@media print`에 `-webkit-print-color-adjust: exact; print-color-adjust: exact`를 `.report-container`(전체 캐스케이드) + `.report-chart-bar`·`.report-chart-success`·`.report-score-cell-label` 명시
- **§4(성향의 조율) 소제목 삭제**: cm5 블록 h4 두 개("이 성향의 말투와 태도"·"개선이 되는 코칭 내용") 제거. manner 본문 → `.report-cm5-improvement`(margin-top 16) improvement 본문 순서로 흐름. 16px 간격만으로 구분
- **신인 리크루팅 레벨업(cm7) 섹션 삭제**: `s7_title` 섹션 렌더 폐기(cm7 yaml/lookup 데이터 보존). 항상 마지막 섹션이라 번호 시프트 없음 → 보험설계사 최대 §5(cm6), 코치/리더 최대 §4(cm5)
- **변경 파일**: ReportPage.jsx / praxi.css / SPEC.md / TASKS.md
- **빌드/배포**: vite OK (87 모듈). gh-pages published → 피터공 Cmd+P 라이브 확인 대기

### 2026-05-25 — m2a egogram 인쇄 페이지 나눔 정밀화 — break-inside 작은 단위 (세션378)
- **출발**: v0.8에서 `@media print`의 섹션 통째 `break-inside: avoid`를 제거(빈 공간 방지)했으나, 이번엔 자아상태 항목·코칭 항목이 페이지 경계에서 쪼개지는 어정쩡한 잘림 발생. 피터공 "inside로 정의하는 구간을 작은 단위로"
- **변경**: 섹션 통째 avoid 폐기, **원자 단위에만** `break-inside: avoid` — `.report-cover`·`.report-intro`·`.report-chart`·`.report-trait-item`(자아상태 항목)·`.report-strength-badge`·`.report-coaching-item`(코칭 항목)·`.report-coaching-message`·`.report-combination`·`.report-cm6-common-item`(CM6 카드)·`.report-closing`·`.report-footer-bar`. 단위가 작아 남은 공간을 채우므로 빈 공간도 최소화 + 항목은 안 쪼개짐
- **제목 고립 방지**: `break-after: avoid`를 `.report-section-title`·`.report-intro h2`·`.report-cm5 h4`에 적용(제목이 페이지 맨 아래 홀로 안 남게)
- **cm5 예외**: 성향의 조합 manner/improvement는 별도 래핑이 없고 길어질 수 있어, 통째 보호하면 빈 공간 재발 위험 → 제목만 붙이고 본문은 흐르게 둠
- **문단**: `orphans: 2; widows: 2`로 고아·과부 줄 방지
- **변경 파일**: egogram/src/styles/praxi.css / SPEC.md / TASKS.md
- **빌드/배포**: vite OK (87 모듈). `npm run deploy` gh-pages published. 커밋 mind2action `2473537`
- **라이브**: https://mice3nyc.github.io/mind2action/egogram/ → **피터공 인쇄 미리보기(Cmd+P) 라이브 확인 대기**

### 2026-05-25 — m2a egogram v0.8 — 호칭 본문 업데이트 (Archives xlsx 전체 CM 재변환) (세션377)
- **출발**: 피터공 "에고그램 호칭 본문 업데이트 진행하자". v0.7까지 옛 호칭 잔존(insurance "설계사" 20·manager "지점장" 331·coach "멘토" 2) = 곧 5/8 옛 변환본 그대로였던 CM3·CM4·CM5 + 코치/리더 CM6 + 컨설턴트 CM7. 손소장 Archives xlsx에 호칭 일원화된 전체 새 데이터 있음 → **전체 재변환 = 호칭 동시 해소** (단순 치환은 지점장 331개 맥락 의존이라 불가)
- **변환기 `scripts/convert_cm.py` 신설**: `Assets/incoming/에고그램/data/Archives/{코치,리더,컨설턴트}.xlsx` → `cm_*.yaml`. cm1(자아상태 키워드)·cm8(명언, 렌더 폐기)은 xlsx에 시트 없어 기존 yaml 보존, cm2~cm7만 재변환
- **착수 전 구조 대조에서 잡은 함정 4건**:
  - **행 위치 직군별 상이** → 행 번호 하드코딩 폐기, 라벨 앵커 스캔("구분 TOP 1/2/BOTTOM"·"점수구간"·"에고그램 유형"). 예: CM3 TOP1 행이 코치/리더=행3, 컨설턴트=행5
  - **시트→yaml키 매핑 직군별 상이**: 코치/리더 CM6(리크루팅)→`cm7` / 컨설턴트 CM6(클로징)→`cm6`·CM7(리크루팅)→`cm7`. CM5 시트명 코치="CM5 코칭 추가"/리더="CM5추가"/컨설턴트="CM5" 접두어 매칭. 컨설턴트만 CM5 본문 2행(manner+improvement)
  - **CM4-4 AC 이중 컬럼**: 0~7점·17점이상 두 AC 중 트리거 조건(AC=17+) 채택 (기존 yaml·코드 동작과 동일)
  - **some_coaching 폐기**(5/18, cmLookup.js 미참조): 옛 호칭 잔존 죽은 데이터 → 빈 문자열 처리
- **결과**: 세 yaml 본문 옛 호칭 0건 (job_label "코치/멘토"·"보험설계사"만 정당 잔존). 키 구조 v0.7과 완전 동일(cm5=60·cm3=20·cm7=60), 텍스트만 손소장 최신본 교체 → 렌더 구조 안 깨짐
- **§1 점수 뒤 구간 표기 제거** (피터공 라이브 확인 후 요청): `report-trait-ego` `{점수}점 (11-13)` → `{점수}점`. `getScoreRange` import 정리(미사용)
- **리포트 디자인 재배치** (피터공 라이브 확인 반복 조정):
  - **상단 커버**: 두꺼운 선(위, border-top 3px + margin-top 40 숨통) → `.report-cover-title`(제목, 아래 두꺼운 선 3px) → `.report-cover-id`(이름·소속, 아래 점선) → 본문. MIND2ACTION 브랜드 폰트 800→300(얇게), 뒤 "성향 코칭 리포트"는 굵게 유지
  - **마무리**: `.report-closing` 인사 한 줄 가운데(좌측정렬·max-width 520 폐지) → `.report-footer-bar`(두꺼운 선 위, flex space-between: 좌 © 2026 MIND2ACTION 굵게 600 / 우 ✉ email). 인사 위 점선은 섹션 border-bottom 하나만(closing 자체 점선 제거로 이중선 해소), closing margin-top -36으로 인사 위/아래 여백 28px 대칭. 세로 나열 contact·`.report-copyright` 단독 div 폐지(인스타·전화 빈 값이라 새 한 줄 레이아웃서 제외)
  - **§1 그래프 아래 박스 — 시도 후 원복**: 점선+회색 박스 넣어봤으나 피터공 판단으로 원복. §1은 ScoreChart → traits 원래 구조 유지
  - **여백 미세조정**: 커버 상단 margin-top 40→20(반절), intro padding-bottom 40→20(목적↔점선 간격), closing 위 점선 제거 후 margin-top -36으로 인사 상하 28px 대칭
  - **인쇄 페이지 나눔**: `@media print .report-section { break-inside: avoid }` 제거 → §1이 커지며 통째 다음 장 밀려 빈 공간 생기던 문제 해소(페이지 채우며 흐름). **다음 작업**: break-inside 단위를 섹션보다 작은 단위(자아상태 항목)로 재설정해 깔끔한 출력
- **변경 파일**: cm_coach.yaml / cm_manager.yaml / cm_insurance.yaml / ReportPage.jsx / praxi.css / Footer.jsx(v0.8) / package.json(0.8.0) / scripts/convert_cm.py(신규) / SPEC·PLAN·TASKS
- **빌드/배포**: vite OK (87 모듈). `npm run deploy` gh-pages published. 피터공 라이브 확인 완료
- **라이브**: https://mice3nyc.github.io/mind2action/egogram/ / admin /#/admin (pw sonson)

### 2026-05-25 — m2a egogram v0.7 — 손소장 26.0525 수정 5건 + 리포트 정리 (세션375)
- **출발**: 손소장 새 수정 목록 `Assets/incoming/에고그램/수정 목록 26.0518.md`(오늘 07:03 도착, 이름만 0518) 5개 항목. 코드 대조 후 ①④⑤③ 반영 + 리포트 헤더/마무리 정리
- **⑤ 역할별 안전구간 (`scoreEngine.SAFE_RANGES`)**: 기존 `getSuccessRange`(그래프 밴드)와 `needsCoaching`(코칭 발동)이 서로 다른 값이던 것을 **하나의 역할×자아상태 테이블로 통합**. 컨설턴트 CP11-16/NP11-16/A14-20/FC11-16/AC8-16, 리더 NP14-20/A14-20/AC8-13, 코치 NP14-20/A11-20/AC11-16. `getSuccessRange(ego, jobType)` + `needsCoaching(ego, score, jobType)`, jobType→role은 `roleFromJobType`
- **③ CM6 공통 (컨설턴트)**: `cm6_consultant_pending.csv`(좌=타이틀, 우=본문) → `cm6_common_consultant.yaml` 3섹션(거절의 고객 심리·화법 스크립트 코칭·클로징 화법). yaml import + `lookupReport` insurance일 때 `cm6_common` 반환. ReportPage CM6 섹션이 조합 텍스트 유무와 무관하게 렌더 + 하단 공통 블록(`.report-cm6-common`). 점수·조합 무관 전 컨설턴트 공통
- **④ "코칭"→"조율"**: `ui_texts` s4_title "내 성향의 조율 포인트" / s4_no_coaching "조율을 하지 않아도 되는 성향" (5/18 미결 2번 확정)
- **① 결과화면**: ResultPage `result-total` + "처음부터 다시" 삭제 (총점 ≠ 성향 우열 / 재시도 = 왜곡). 그래프 경계선 `profile?.jobType` 반영
- **리포트 정리**: 커버 한 줄 "MIND2ACTION 성향 코칭 리포트"(브랜드 accent span) / closing 이름(손용배) 제거 + `✉  {email}`(레이블 폐기) / 하단 `© 2026 MIND2ACTION` 작은 회색
- **② 호칭 일원화 — 미반영(보류)**: 검증 결과 옛 호칭 잔존(insurance "설계사" 20·manager "지점장" 331·coach "멘토" 2). 어제 받은 `data_*.csv`는 cm2 데이터였고 호칭본은 별개 — 드라이브 "에고그램 리포트 콘텐츠 데이터"(어제 14:12) 수령 → cm_*.yaml 재변환 필요. v0.6 cm2 작업과 겹침 → 시트 최신본 확인 후
- **미결 잔존**: 세밀한 코칭 17점 초과 대상(5/18 미결 3·4) 새 문서에도 답 없음, AC 17+ 로직 유지
- **변경 파일**: scoreEngine.js / cmLookup.js / ReportPage.jsx / ResultPage.jsx / Footer.jsx(v0.7) / package.json(0.7.0) / praxi.css / ui_texts.yaml / cm6_common_consultant.yaml(신규) / SPEC·PLAN·TASKS·ROADMAP·ARCHITECTURE
- **빌드/배포**: vite OK (index-*.js 1,323kB). `npm run deploy` gh-pages published. 라이브 v0.7 확인 (피터공 육안 확인 완료)
- **라이브**: https://mice3nyc.github.io/mind2action/egogram/ / admin /#/admin (pw sonson)

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
