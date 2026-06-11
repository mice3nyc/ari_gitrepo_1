### 텍스트-경로 정합 — selfintro (자기소개 글)
확실 9건 / 애매 4건 / 전체 27결말 검사

---

| leaf | 검사종류 | 필드 | 인용(짧게) | 왜 모순인가 | 확실/애매 |
|------|----------|------|-----------|-------------|-----------|
| C1R1 | AI 개입 모순 | reportReflection | "내 말에서 시작했더라도 마지막 확인이 부족하면..." | C1은 아무 정보 없이 AI에게 통째 위임한 경로. "내 말에서 시작"한 적 없음. A계열 반성문이 붙어 있음 | 확실 |
| C1R2 | AI 개입 모순 | reportReflection | "내 경험은 들어갔지만, 왜 그것이 나를 보여주는지..." | C1은 경험 투입이 없는 경로. "내 경험이 들어갔지만"은 C2·C3 서술 | 확실 |
| C1R3 | AI 개입 모순 | reportReflection | "내 경험은 들어갔지만, 왜 그것이 나를 보여주는지..." | C1R2와 동일 문제. C1 전 경로에 같은 텍스트 재사용된 것으로 보임 | 확실 |
| C2R2 | AI 개입 모순 | reportCardSummary | "[중심잡기] 주체성 · 자기이해 · 표현력" | humanCentricAxis가 `성찰하기`인데 reportCardSummary는 `[중심잡기]`로 불일치. 같은 필드에서 서로 다른 축 표기 | 확실 |
| C2R3 | AI 개입 모순 | reportCardSummary | "[중심잡기] 주체성 · 자기이해 · 표현력" | C2R2와 동일. humanCentricAxis=성찰하기, reportCardSummary=[중심잡기] | 확실 |
| C2R3 | 검토 서술 모순 | cut6Feedback | "출발은 했지만 중요한 확인 과정이 일부 비어 있어요." | R3는 "처음부터 다시 확인"하는 깊은 검토 경로. "확인 과정이 비어 있다"는 R1·R2 표현 | 확실 |
| C2R3 | 검토 서술 모순 | replaySuggestion | "처음부터 다시 확인해 보세요." | R3에서 이미 처음부터 다시 확인한 경로인데, 그 행동을 다음 목표로 권유 | 확실 |
| B3R2 | 행동 서술 모순 | awareness | "AI가 고친 표현 중 내 말투에 맞는 것만 골랐어요." | R2는 사람(플레이어)이 직접 어색한 표현을 고르고 수정하는 단계. AI가 표현을 고치는 단계가 아님. reviewSupplements B3R2도 "내 메모에서 살아 있던 표현을 되살려" — 사람 주체 | 확실 |
| C3R3 | AI 개입 모순 | reportReflection | "내 이야기를 먼저 세우고, 마지막에 책임질 수 있는 말만 남겼다." | C3는 AI에게 먼저 결과를 맡기고 나중에 다시 쓰는 경로. "내 이야기를 먼저"는 A계열(직접 시작) 서술. C3에서 "먼저" 세운 것은 AI 초안 | 확실 |
| B3R3 | AI 개입 모순 | reportReflection | "내 이야기를 먼저 세우고, 마지막에 책임질 수 있는 말만 남겼다." | B3는 AI 초안을 먼저 받아 내 메모와 섞는 경로. "내 이야기를 먼저 세우고"는 A계열 서술. B3에서 먼저 온 것은 AI 초안 | 확실 |
| C1R1 | 행동 서술 모순 | reportReflection | "내 말에서 시작했더라도" | C2R1, B1R1, C3R1 등 여러 경로에 동일 문구가 붙어 있음. "내 말에서 시작" 서술이 B·C계열에 확산된 패턴 — 각 경로별로 확인 필요 | 애매 |
| B1R1 | AI 개입 모순 | reportReflection | "내 말에서 시작했더라도 마지막 확인이 부족하면..." | B1은 AI 질문에 답한 경로. "내 말에서 시작"이라 보기 어렵지만, 내 답변에서 출발한 측면도 있음 | 애매 |
| A3R2 | 행동 서술 모순 | reportReflection | "내 경험은 들어갔지만, 왜 그것이 나를 보여주는지..." | A3는 경험 중심(A2)이 아니라 "서툴어도 일단 초안을 쓰는" 경로. "내 경험" 서술은 A2 반성문에 맞음 | 애매 |
| C2R2 | 검토 서술 모순 | replaySuggestion | "그대로 진행하기 전에 이상한 부분을 표시하거나..." | R2에서 이미 어색한 표현을 표시·수정했는데, 마치 아직 하지 않은 것처럼 권유. R1용 문구 재사용 가능성 | 애매 |

---

#### 패턴 정리

세 가지 패턴이 반복됩니다.

**패턴 1 — reportReflection 고정 문구 오배치**: "내 말에서 시작했더라도 마지막 확인이 부족하면 소개의 힘이 약해진다."는 A계열 R1 경로용 문구인데, C1R1·B1R1·B2R1·C2R1·C3R1에도 동일하게 붙어 있습니다. C1(AI 통째 위임)에는 출발 전제 자체가 틀립니다.

**패턴 2 — humanCentricAxis/reportCardSummary 불일치**: C2R2·C2R3에서 humanCentricAxis는 `성찰하기`인데 reportCardSummary는 `[중심잡기]`로 표기됩니다. 둘 중 하나가 틀린 값입니다.

**패턴 3 — C2R3에 R1/R2용 cut6Feedback·replaySuggestion 혼입**: "출발은 했지만 중요한 확인 과정이 일부 비어 있어요."와 "처음부터 다시 확인해 보세요."는 R3 경로에서 이미 실행된 행동을 권유합니다. C2R2(R2)에도 같은 replaySuggestion이 있으나 R2는 부분 검토이므로 상대적으로 덜 강한 모순입니다.

---

#### 검사 범위 확인

전수 검사 완료: A1R1·A1R2·A1R3 / A2R1·A2R2·A2R3 / A3R1·A3R2·A3R3 / B1R1·B1R2·B1R3 / B2R1·B2R2·B2R3 / B3R1·B3R2·B3R3 / C1R1·C1R2·C1R3 / C2R1·C2R2·C2R3 / C3R1·C3R2·C3R3 — 27결말

검사 대상 필드: awareness, cartoonCaption1~5, cut6Feedback, shortFeedback, reportFeedback, reportReflection, reportPathSummary, replaySuggestion, reportCardSummary, humanCentricAxis + reviewSupplements 전체
