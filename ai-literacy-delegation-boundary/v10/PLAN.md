## PLAN — v1.0

**v0.9 베이스**에서 분기. Neo-Brutalism 디자인 최종.
**스타일 가이드**: [[AI 리터러시 게임 — 스타일 가이드]]

### 핵심 목표

v0.9까지의 기능 완성 위에 Neo-Brutalism 디자인 시스템을 전면 적용한다.
기능 변경 없음 — 시각·인터랙션·레이아웃만 최종 품질로.

### Phase 구조

6단계로 끊어서 진행. 각 Phase 끝에 브라우저 검증 + 커밋.

#### Phase 1 — CSS 토큰 + 전역 리셋
- `:root` CSS custom properties 선언 (컬러, geometry, font)
- `body` 배경: #f5f5f5 → #d0d0d0
- 나눔손글씨 펜 font-face import
- 전역 border-radius: 0 리셋 (원형 도트 제외)
- 전역 border: 옅은 회색 → 3px solid black
- 전역 box-shadow: 블러 있는 것 → 4px 4px 0 #000

> 이 Phase만으로 전체 톤이 Neo-Brutalism으로 전환된다.

#### Phase 2 — 버튼 체계 통일
- .btn 공통 클래스 + 변형 (yellow/ghost/correct/wrong)
- v0.9의 dark 버튼(#111 bg, #fff text) → yellow bg, black text
- 모든 버튼에 누름 피드백 (translate 2px + shadow 축소)
- 대상: start-btn, advance-btn, next-btn, action-main, lvup-confirm, rp-confirm, replay-btn, recovery-card-btn

#### Phase 3 — 카드·패널·모달 컴포넌트
- choice-card: 3px border + 4px shadow + hover 리프트
- panel: border/shadow 교체
- modal-card, coupon-box: 블러 shadow → 단색 offset shadow
- inv-tab, inv-card: radius 0 + shadow 교체
- card-reward-card: radius 0 + shadow 교체
- report 섹션들: border/shadow + 내부 배경 bg-soft

#### Phase 4 — 색상 재매핑
- 긍정 계열: #1a8c1a → mint 토큰
- 부정 계열: #c44 → pink 토큰
- bipolar-fill, pending-dot, cost-box, card-chip 등
- 보조 배경: #f8f8f8, #fafafa → bg-soft
- 인라인 스타일의 색상도 포함 (JS 내부 HTML 생성)

#### Phase 4.5 — 이미지 프레임 효과 (SPEC §7.3)
- AI 생성 이미지의 불균일한 테두리/크기 문제 해결
- 정사각형 컨테이너에 맞춰 object-fit:cover (스트레칭 허용)
- 5px 흰색 inner border + 2px 검정 inner border (::after pseudo-element)
- 적용 대상: 시나리오 패널 이미지 + 리포트 카툰 이미지

#### Phase 5 — 인라인 하이라이트 + 손글씨 적용
- .hl 클래스 4종 (yellow/cyan/mint/pink)
- texts.yaml 키워드에 하이라이트 마크업 적용
- 피드백 한마디에 손글씨 폰트 적용

#### Phase 6 — 모션 통일 + 체크리스트 검증
- transition 타이밍: all 0.2s → transform 0.05s, box-shadow 0.05s
- 모든 인터랙션에 누름 피드백 점검
- 스타일 가이드 §9 체크리스트 전항목 검증
- 빌드 + 브라우저 5시나리오 검증

### v0.9에서 가져온 것 (변경 없음)

- 자원 100/100, 자동 회복 없음, RP 직접 배분
- 고정 할인 + 카드 할인 쿠폰 (바닥값 폐지, 0까지 내려감)
- 피드백 2레이어, 용어, 선택지 인라인 전개
- XP score 기반, 이미지 webp

### v0.9 미결 이월

- 인간중심 카드 → 시간 할인 분리 여부 (피터공 보류)
- 5시나리오 완주 검증 (Phase 6에서 함께)

### 데이터 소스

v0.9와 동일 — `data/scenarios.yaml`, `data/cuts.yaml`, `data/texts.yaml`
