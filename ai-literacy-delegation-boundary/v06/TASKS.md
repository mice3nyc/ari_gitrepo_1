## TASKS — v0.6

**최종 업데이트**: 2026-05-03 세션282 (옵션 1 leaf.delta + 5 시나리오 정점 격상 + 공통 카드 풀 4종)
**PLAN**: [[PLAN|PLAN.md]] / **SPEC**: [[SPEC|SPEC.md]]

> 매 작업 완료 시 즉시 체크. 에이전트 위임 시 이 노트만 보고 자급자족 가능해야 함.

---

#### 현재 단계: Phase 3a (코드 framework) ✅ — Phase 3b·4b·4c 진행 대기 (외부 LLM 분석 사이클)

##### Phase 1 — 자산 인수 ✅ (5/1 세션267)
- [x] 1.1 v05 → v06 자산 복사 (data/, balance/, build.py, index.html.template, SCENARIO-GUIDELINES.md)
- [x] 1.2 localStorage key v05 → v06 (template patch)
- [x] 1.3 vtag 'v0.6 — 점수 framework 재설계' 갱신
- [x] 1.5 build.py 실행 → v05와 byte-level 동등 확인 (226,479 bytes 동일)
- [~] 1.4 백업 라벨 — 생략. 폴더 분리(v05/v06)로 추적 가능

**완료**: v06 폴더에서 build.py 실행 정상, vtag/storage key 갱신 후에도 빌드 정상(226,477 bytes).

##### Phase 2 — SPEC 본문 + 스키마 확장 ✅ (5/1 세션267)
- [x] 2.1 SPEC.md 본문 작성 (yaml delta 스키마 §1 + 점수 누적식 §2 + 비용 계산식 §3 + build.py 영향 §4)
- [x] 2.2 build.py — yaml passthrough, 새 delta 필드 자동 통과 (별도 패치 불필요)
- [x] 2.3 `cardSlots` → `axisDelta` parent key rename (yaml 5건 + template 1건 + fallback 1건)
- [x] 2.4 extract_balance.js — 8개 delta 컬럼 추가 (`t1/t2/review × 위/도 + total`). 38 → 46 컬럼
- [x] 2.5 빌드 → 226,558 bytes (rename 후 정상 빌드)
- [x] 2.6 v06 csv 4종 리젠 → `~/Downloads/v06_balance_2026-05-01/` (피터공 검수 대기)

**완료**: axisDelta 키 7건 정상 출력(yaml 5 + code 2). 내부 `boostCard`/`bonusPoint` 28건은 Phase 5에서 재구조. csv 8 delta 컬럼은 Phase 3에서 leaf delta 채워질 때까지 빈값.

##### Phase 3a — 코드 framework ✅ (5/3 세션275)
- [x] 3a.1 음수 매핑 압축 — `DELTA_NEG={'-':-1,'--':-1}`, `getAxisDelta` 함수 분기 (커밋 3afd831)
- [x] 3a.2 tier1 점수 기여 framework — `applyTier1`에 `getAxisDelta` 호출 자리, yaml fallback 0
- [x] 3a.3 빌드 검증
- [x] 3a.4 SPEC §6 진행 상태 표 갱신 + 미정 결정 갱신
- [x] 3a.5 multiplier 1.0 변경 (raw에 0.6 곱한 값으로 재조정 완료 후)
- [~] 3a.6 score-display·stats-bar 진행 중 숨김 정책 — **폐기 (5/3 plate)**: 점수 UI는 항상 보이는 상태가 기본. visibility 토글 코드 제거 (커밋 28fa77c → 후속)

##### Phase 3b — selfintro yaml 채움 ✅ (5/3 세션275, 백도+직도)
- [x] 3b.0 raw 비용 재조정 — 5 시나리오 × 270 라인 × 0.6 (백도 결과, 0 발생 없음, 백업 `scenarios.yaml.before-raw-rebalance`)
- [x] 3b.1 selfintro tier1 3건에 위·도 두 축 추가 (백도 가설값 적용)
- [x] 3b.2 selfintro tier2 9건에 knowledge 추가 (백도 가설값 적용)
- [x] 3b.3 selfintro finals 27건 점검 — 어긋남 없음 (백도 결과)
- [ ] 3b.4 selfintro 피터공 플테 → 발란스 피드백 인입
- [ ] 3b.5 의문 4건 결정 ([[26.0503 yaml 채움 — selfintro]] §의문)

##### Phase 3c — 나머지 4 시나리오 yaml 채움 (다음 세션, 백도 4개 병렬)
- [ ] 3c.1 groupwork yaml 채움
- [ ] 3c.2 eorinwangja yaml 채움
- [ ] 3c.3 career yaml 채움
- [ ] 3c.4 studyplan yaml 채움
- [ ] 3c.5 5 시나리오 통합 플테

##### Phase 4a — 학기 끝 4유형 화면 ✅ (v0.5 Phase 8에서 이미 구현)
- [x] 4a.1 `showFinalReport` (line 1998)
- [x] 4a.2 4유형 분류 함수 (line 1991, pp/pn/np/nn/mid)
- [x] 4a.3 4유형 의미 박스 (line 2021)

##### Phase 4b — 나머지 4 시나리오 데이터 마이그 (외부 LLM 분석 사이클)
- [ ] 4b.1 selfintro 검수 시트 분석 ([[26.0503 시나리오 리뷰 — 1 selfintro]] 시작점)
- [ ] 4b.2 groupwork 검수 시트 분석
- [ ] 4b.3 eorinwangja 검수 시트 분석
- [ ] 4b.4 studyplan 검수 시트 분석
- [ ] 4b.5 5 시나리오 통합 플테

##### Phase 4c — 시나리오 끝 화면 노출 정책 [폐기 — 5/3]
- [~] 폐기. 점수 UI는 항상 보이는 상태가 기본. score-display는 이미 항상 노출이라 추가 작업 불필요. 점수 게임 변질 방지가 필요하면 점수 업데이트 시점·표현 방식으로 별도 결정.

##### Phase 5 — 역량 카드 시스템 (5/3 신설, boostCard 폐기 정합)
- [x] 5a.1 SPEC §7 신설 (라벨 풀 + leaf 매핑 + 인벤토리 + reward 팝업)
- [x] 5a.2 UI 3건 (XP 위치 / 자원·역량 타이틀)
- [x] 5a.3 yaml 스키마 확장 (`domainPool`/`domainLabel`/`competencyCards`)
- [x] 5a.4 인벤토리 슬라이드 패널 + reward 팝업 코드 통합
- [x] 5a.5 selfintro 27 review 매핑 (16건 카드 / 11건 미보유)
- [x] 5a.6 빌드 검증 (240,876 bytes, JS syntax OK)
- [x] 5a.7 시나리오 끝 chain 재배치 + 카드 reward 단건 컨펌 (5/3 세션278) — cascade·skip 폐기, "획득" 버튼 + travel + 다음 카드 자동 진입. chain: 결과 패널 → 카드 → 레벨업 → 자원 충전. 카드 못 받은 회기 안내 박스 (242,906 bytes)
- [x] 5a.8 카드 휘리릭 + 회전 (5/3 세션278) — travel 0.6s→0.35s, ease-in 가속 곡선, rotate(720deg) 두 바퀴, buffer 0.2s→0.1s. 총 간격 0.8s→0.45s
- [x] 5a.9 발란스 ×4 폭주 1차 정정 (5/3 세션278) — DELTA_POS ×2 폐기, 효과 비대칭 분기. **5a.10에서 root cause 재진단 후 회로 자체 폐기**
- [x] 5a.10 시나리오 단위 누적 + pending 원 마커 (5/3 세션278, SPEC §12) — gameState pending, applyTier1/2/Review 변경, 원 마커 UI 두 트랙, 양↔음 전환 keyframe, absorbPending chain 흡수 (0.6s), startScenario reset, cut6 chain [0]단계 추가. mult 대칭(Pos:2, Neg:2). DELTA_NEG 압축 폐기({'-':-1,'--':-2})
- [x] 5a.11 점수 ±1 단순화 + 시나리오 선택 UI 재배치 (5/3 세션278) — getAxisDelta 부호 함수 단순화 (한 시나리오 max ±3), 큰 [다음 시나리오] 메인 + [학기 처음부터] 좌측, 학기 처음부터 확인 모달. 빌드 257,351 bytes
- [x] 5b selfintro 1차 플테 — 발란스/연출 피드백 통과 (5/3 세션282)

##### Phase 6 — 타이틀+튜토리얼 화면 (5/3 세션278 신설)

페이지 로드 → 시나리오 선택 직진 폐기. 한 화면(타이틀 + 명제 + 메카닉 2~3불릿 + 시작 버튼)을 첫 진입에만 노출. SPEC §11.

- [x] 6.1 SPEC §11 신설 (컨셉·진입 흐름·gameState 확장·화면 구성·카피 자리·코드 자리)
- [x] 6.2 카피 백도 launch — 3안 도착, **1안 추천**:
  - 타이틀: AI 리터러시 — 위임의 경계 / 부제: 이건 AI한테 맡겨도 돼?
  - 명제: 한 학기 동안 다섯 장면에서 무엇을 AI에게 맡기고 무엇을 직접 할지 정해 본다.
  - 불릿: 장면마다 세 번 고른다(큰 방향 → 행동 → 검토) / 선택은 위임 판단력과 도메인 지식 두 축에 쌓인다 / 시간과 에너지는 한 학기 동안만 주어진다
  - 버튼: 1학기를 시작한다
- [x] 6.3 카피 확정 — 캐논 도입 + 게임 쇼 진행자 + 1·2·3 게임 진행자 톤 결합 (5/3 세션278). "[게임 시작]" 버튼. 2번 "세 번의 선택의 순간이 있다"로 세련화
- [x] 6.4 화면 코드 (`showTitleScreen` + CSS `.title-frame`/`.intro-text`/`.host-text`/`.tutorial-list`/`.start-btn-large`/`.tutorial-link`)
- [x] 6.5 진입 흐름 분기 (`initEntry` IIFE, `tutorialSeen` 플래그 + createInitialState/continueGame guard. 진행 중 학기는 구버전 save도 시나리오 선택으로)
- [x] 6.6 시작 화면 "튜토리얼 다시 보기" 링크 추가 (showStartScreen 하단)
- [ ] 6.7 빌드 검증 ✅ (247,447 bytes, +4,541) — 피터공 시각 확인 대기 (튜토리얼 다시 보기 링크로 진입 가능)
- [x] 5c.1 groupwork 카드 매핑 ✅ (5/3 세션282 백도 #1)
- [x] 5c.2 eorinwangja 카드 매핑 ✅ (5/3 세션282 백도 #2)
- [x] 5c.3 career 카드 매핑 ✅ (5/3 세션282 백도 #3)
- [x] 5c.4 studyplan 카드 매핑 ✅ (5/3 세션282 백도 #4)
- [ ] 5d 위 축 표현 결정 (§7.7 — 점수+게이지 vs 카드 vs 메시지)

##### Phase 5e — 옵션 1 매트릭스 + 5 시나리오 정점 격상 + 공통 카드 풀 ✅ (5/3 세션282)

피터공 5/3 진단 둘 풀어진 사이클 — (1) "AI만 고르면 무조건 -" → 묶음 안 정점 자리 부재 (2) "직접 했는데 카드 0장" → 노력 자리 R1 카드 보장 룰 어긋남.

- [x] 5e.1 selfintro yaml leaf.delta 매트릭스 (afterA/afterB/afterC × 9 leaf = 27 점수 쌍, nested 구조)
- [x] 5e.2 코드 — `getLeafDelta(leaf, t1Id)` 헬퍼 + applyTier2 lookup. 단일 점수 fallback (다른 4 시나리오 호환)
- [x] 5e.3 selfintro B3·C1 정점 격상 (++/++) — basePoint 88, R1·R2·R3 = 88·93·100, S 등급
- [x] 5e.4 selfintro 카드 풀 확장 (3종 → 7종, 공통 풀 4종 신설: 자기검증·자기성찰·검수능력·비판적 사고)
- [x] 5e.5 selfintro 27자리 카드 정합 (회피 0장 / 노력 R1 1장 보장 / 정점 R1 3장+ / R3 5장)
- [x] 5e.6 4 시나리오 백도 4개 병렬 launch (shared spec `CARD-EXPANSION-SPEC.md`)
- [x] 5e.7 4 시나리오 yaml 통합 박기 (B3·C1 격상 + domainPool + competencyCards 27자리)
- [x] 5e.8 SPEC §7.2 갱신 — 공통 풀 + 시나리오 특화 + 카드 자리 룰 명시
- [x] 5e.9 빌드 280,112 bytes (이전 268,460 → +11,652)

##### Phase 5f — 역량 득점 원 UI + 리포트 UI (다음 진입)

- [ ] 5f.1 역량 득점 원 UI 갱신 (피터공 아이디어 대기)
- [ ] 5f.2 학기 끝 종합 리포트 UI (D 활용 — 카드 누적 도메인 단단함 표시·4유형 라벨 정합)

---

#### 미결정 큐 (닿을 때 결정)

- [ ] 카드 4안 (final_item) — Phase 5 진입 시
- [ ] career boostCard 4종 재명명 — Phase 3에서 톤 정정 사이클
- [ ] 다음 시나리오 핸드오프 순서 — Phase 4 진입 시 (기본: selfintro)

---

#### 외부 송부 (병렬, v0.5)

- [ ] 5/4 경기도 송부 (v0.5 freeze 상태) — 정예공이 메일로 / 받는이: 김동선 장학사 / 놀공 최서연·이다연·사성진
- [ ] 송부 후 v0.5 폴더 변경 금지 (v06에서만 작업)
