## TASKS — v0.6

**최종 업데이트**: 2026-05-03 세션275
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

##### Phase 5 — 카드 메시지 메카닉 (final_item)
- [ ] 5.1 카드 4안 결정 ([[26.0501 v0.5 카드 인벤토리]] 참조)
- [ ] 5.2 어린왕자 컬렉션 패턴 시나리오별 확장 검토
- [ ] 5.3 final_item ↔ axisDelta 매핑

---

#### 미결정 큐 (닿을 때 결정)

- [ ] 카드 4안 (final_item) — Phase 5 진입 시
- [ ] career boostCard 4종 재명명 — Phase 3에서 톤 정정 사이클
- [ ] 다음 시나리오 핸드오프 순서 — Phase 4 진입 시 (기본: selfintro)

---

#### 외부 송부 (병렬, v0.5)

- [ ] 5/4 경기도 송부 (v0.5 freeze 상태) — 정예공이 메일로 / 받는이: 김동선 장학사 / 놀공 최서연·이다연·사성진
- [ ] 송부 후 v0.5 폴더 변경 금지 (v06에서만 작업)
