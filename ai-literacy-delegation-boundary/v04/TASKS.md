## TASKS — AI 리터러시: 위임의 경계 v0.4

**최종 업데이트**: 2026-04-28 (Air, 세션248) — Phase 5 + Phase 6 완료. 점수 산정(C안 격상) + 힌트 토글(B안 둘 다)
**PLAN**: [[v04/PLAN|PLAN.md]]
**SPEC**: [[v04/SPEC|SPEC.md]]

> 체크리스트. 완료 즉시 [x] 처리. "나중에" 없다.

---

#### Phase 0 — 기획 확정 ✅

- [x] DECISIONS.md 작성 (대화 통째 보존)
- [x] SPEC.md 작성 (v0.3 → v0.4 변경 영역 + 자원/경험치/레벨업/힌트 토글 + 27 leaf 시트 초안)
- [x] PLAN.md 작성 (7단계 구현 순서)
- [x] TASKS.md 작성 (이 파일)

---

#### Phase 1 — 디테일 확정 (피터공 검토) ✅ 8/8 완료, 4/28 19:35

- [x] 27 leaf 시트 (SPEC §11.2) — MVP 기준값, v0.5에서 레벨별 곱셈 도입 검토
  - [x] A 분기 (직접) 9개 leaf
  - [x] B 분기 (AI) 9개 leaf
  - [x] C 분기 (무시) 9개 leaf
- [x] 레벨업 임계 + 미터 증가량 (§11.4) — 확정
- [x] 경험치 등급 곱셈 (§3.2) — 확정
- [x] 검수 레벨 보너스 곡선 (§3.4) — **수정안: L1=0, L2=0, L3=+2, L4=+3, L5=+4**
- [x] 자원 부족 페널티 정책 (§2.4) — **A안(단순화) 확정**
- [x] 힌트 토글 표시 정책 (§4) — **A안(영향만 숨김, 자원 보임) 확정**
- [x] 도메인 역량 명칭 (§3.5 신설) — **A안 단일 "문해력" 확정** (코드 변수 `knowledge` 유지)
- [x] 자원 게이지 도형/배치 (§5.1) — 시간/에너지=상단 가로, 위임판단/문해력=우측 세로
- [x] SPEC.md 정정 일괄 완료 (12 섹션)

---

#### Phase 2 — v04/index.html 골격 ✅ 5/5 완료, 4/28 세션247

- [x] `v03/index.html` → `v04/index.html` 복사 (정정: 루트 X, v03/이 v0.3 어린왕자 base)
- [x] localStorage key 변경 (`v03` → `v04`) — storageKey/eventLogKey/sessionIdKey + 다운로드 로그 파일명 모두 v04
- [x] CONFIG 업데이트 (SPEC §12 모든 신규 키) — scenarios/resourceMaxStart/recoverBase/gradeBonus/expThresholds/meterMaxByLevel/levelDetectBonus/hintEnabledDefault 8개 키 추가
- [x] GitHub Actions / Pages 경로 확인 — `.github/workflows/`에는 claude.yml(리뷰 봇)만, Pages는 main branch root 자동 서빙. `/ai-literacy-delegation-boundary/v04/index.html` push 시 자동 노출
- [x] v0.3 동작과 동일 동작 검증 (자원 시스템 추가 전) — diff 결과 CONFIG 신규 키만 추가, 함수 로직 미변경. v04 신규 키들은 아직 미참조 → 동작 v0.3과 동일

---

#### Phase 3 — 자원 시스템 도입 ✅ 8/8 완료, 2026-04-28 세션247

- [x] gameState.resources (time + energy) 추가
- [x] 자원 게이지 UI 컴포넌트 (헤더 상단 가로 바 — resource-bar)
- [x] 27 leaf 비용 시트 데이터 import
  - [x] scenarios/eorinwangja.json에 resourceCosts 필드 추가
  - [x] 데이터 무결성 검증 (27개 leaf 모두, expRewards 포함 54필드)
- [x] 선택 시 자원 소비 로직 (onReview 진입 직전 consumeResources)
- [x] 자원 변동 애니메이션 (v0.3 ±pop 재사용 — animateResource)
- [x] 시나리오 종료 시 회복 공식 구현 (recoverResources — goCut6에서 호출)
- [x] 자원 부족 처리 — A안 음수 허용 + calcResourcePenalty 함수 추가 (통합은 Phase 5)
- [x] resource_consumed / resource_recovered 이벤트 로그

---

#### Phase 4 — 경험치 + 레벨업 ✅ 9/9 완료, 2026-04-28 세션247

- [x] gameState.exp (current + level + thresholds) 추가 — createInitialState에 Phase 3에서 이미 포함
- [x] 경험치 바 + 레벨 표시 UI — .exp-display / .exp-bar / .exp-level / .exp-num (좌측 패널 상단, 자원 위)
- [x] 시나리오 종료 시 경험치 획득 공식 (calculateExpGain) — gradeMultiplier {S:1.5,A:1.3,B:1.0,C:0.7,D:0.5}
- [x] 레벨업 트리거 검출 — checkLevelUp(prevExp,newExp), 다중 레벨업 지원
- [x] 레벨업 시 미터 max 증가 (CONFIG.meterMaxByLevel) — applyLevelUpMeterIncrease(newLevel)
- [x] 레벨업 시 미터 꽉 찬 상태 갱신 (D-06) — recoverResources(grade, didLevelUp=true) 기존 분기 활용
- [x] 레벨업 알림 UI (강조) — 좌측 패널 노란빛 0.8s + numPulse + 컷6 LV UP 배너
- [x] gameState.scenarioRepeatCount 추가 (D-07) — createInitialState에 이미 포함, goCut6에서 +1
- [x] exp_gained / level_up 이벤트 로그
- [x] 5단계 검증 — 코드 로직 검토 완료 (브라우저 플레이 테스트는 Phase 7)

---

#### Phase 5 — 점수 산정 + 검수 레벨 보너스 ✅ 4/4 완료, 4/28 세션248 — 백도 Sonnet 위임

- [x] detectIssues() 레벨 보너스 통합 (SPEC §3.4) — C안 격상 메커닉. CONFIG.levelStep+levelExtraBonus
- [x] calculateFinalScore() 자원 페널티 통합 (Phase 1.4) — base+detected+cardBonus-resourcePenalty
- [x] v0.3 학맞통 카드 결합 로직 호환 검증 — getCardBonus(leaf) 그대로 calculateFinalScore 내 호출
- [x] 같은 leaf + 같은 등급에서 레벨 ↑ → 점수 ↑ 검증 — 손계산 5케이스 확인 (보고서 참조)

---

#### Phase 6 — 힌트 토글 + UI 마무리 ✅ 4/4 완료, 4/28 세션248 — 메인 직접

- [x] **B안 채택** (피터공 결정): 시작 화면 + 디버그 패널 둘 다. 내부 플테 편의용. 완성판은 A안(디버그만)이 옳다고 명시
- [x] 토글 버튼 — HINT_PREF_KEY localStorage 영구 저장 + getHintPref/setHintPref/toggleHint 함수 (line 708-728)
  - [x] 시작 화면 체크박스 "힌트 표시 (선택지 영향 미리 보기)" + vtag 'v0.4 — 자원 + 레벨업' 갱신
  - [x] 디버그 패널 Hint 섹션 (현재 상태에 따라 토글 라벨)
- [x] 컷 3 위임 태그 조건부 — `gameState.hintEnabled && c.delegation` (OFF 시 공백, placeholder 없이)
- [x] 컷 5 점수 미리보기 — hint ON 시 `detectIssues(result, r, level)` 결과 "점수 +N" 회색 태그 (SPEC §5.3)
- [x] 컷 6 사후 공개 — "이번 회기 영향" 한 줄(위임/지식/시간/에너지) + "누적" 한 줄 분리
- [x] 디버그 패널 v0.4 항목 — Hint 섹션 + Level/Resources 강제 점프(Phase 5에서 신설)
- [x] hint_toggled 이벤트 로그 (inGame/startScreen 컨텍스트 분기)
- [x] CSS .hint-toggle-* + .review-hint-tag 신규
- [x] 시뮬 검증 (Python 트레이스): 컷 5 미리보기 L1=0/3/6, L3=3/6/6, L5=16/16/16 (R1/R2/R3)

---

#### Phase 7 — 통합 테스트 + 배포

- [ ] 27 leaf 모든 경로 동작 확인 (분기별)
- [ ] 5등급 회복 공식 검증 (S~D 모두)
- [ ] 5단계 레벨업 검증 (L1→L5)
- [ ] localStorage 저장 + 이어하기
- [ ] 이벤트 로그 신규 타입 정상
- [ ] DebugPanel 모든 버튼 동작
- [ ] git commit (`v04 자원 시스템 도입`)
- [ ] git push
- [ ] GitHub Pages 배포 확인 (`/ai-literacy-delegation-boundary/v04/`)
- [ ] 피터공 플레이 테스트
- [ ] 동현공 플레이 테스트 (자원 부활 후 재검토)
- [ ] 피드백 수집 → v0.5 PLAN으로 이전

---

#### 차단 / 미해결

- (현재 없음)

---

#### 완료 통계

- Phase 0: 4/4 ✅
- Phase 1: 8/8 ✅
- Phase 2: 5/5 ✅
- Phase 3: 8/8 ✅
- Phase 4: 9/9 ✅
- Phase 5: 4/4 ✅
- Phase 6: 4/4 ✅
- Phase 7: 0/11

**전체: 42/62** — Phase 7 착수 가능 (통합 테스트 + 배포)
