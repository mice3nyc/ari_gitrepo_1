## TASKS — v0.6

**최종 업데이트**: 2026-05-01 세션267
**PLAN**: [[PLAN|PLAN.md]] / **SPEC**: [[SPEC|SPEC.md]]

> 매 작업 완료 시 즉시 체크. 에이전트 위임 시 이 노트만 보고 자급자족 가능해야 함.

---

#### 현재 단계: Phase 2 — SPEC 본문 + 스키마 확장

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

##### Phase 3 — career 첫 마이그레이션
- [ ] 3.1 career 시나리오 tier1/tier2/review 모든 leaf에 delta 필드 부여
- [ ] 3.2 career raw 비용 재조정 (multiplier 0.6 폐지 가정)
- [ ] 3.3 시나리오 끝 종합 화면(위/도 점수 노출) UI 추가
- [ ] 3.4 피터공 플테 → 발란스 피드백 인입
- [ ] 3.5 검수 노트([[26.0501 v0.5 시나리오 검수 결과]]) 사이클 1 갱신

##### Phase 4 — 나머지 4 시나리오 + 학기 끝 4유형 화면
- [ ] 4.1 selfintro / groupwork / eorinwangja / studyplan 순서로 마이그레이션
- [ ] 4.2 학기 끝 누적 위·도 → 4유형 라벨 화면 (pp/pn/np/nn)
- [ ] 4.3 5 시나리오 통합 플테

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
