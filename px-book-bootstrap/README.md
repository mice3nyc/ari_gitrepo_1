# PX Book Bootstrap

**USER에서 PLAYER로** 목차를 라운드 기반으로 개선하는 플레이테스팅 프레임워크.

> 이 프레임워크는 책의 내용을 실천한다.
> Ch.25 "플레이테스팅과 Iteration"이 말하는 것을 목차 자체에 적용한다.
> prototype(목차) → playtest(시나리오) → feedback(수집) → iterate(반영) → reflect(자기검사)

---

## 디렉토리 구조

```
px-book-bootstrap/
├── README.md              ← 지금 읽고 있는 파일
├── prototype/             ← 목차 버전들 (v0 = seed, v1, v2, ...)
├── playtest/              ← 가상 독자 시나리오 (테스트 지시문)
├── feedback/              ← 라운드별 피드백 수집
├── iterate/               ← 피드백→변경 전환 프로토콜
├── rules/                 ← 프레임워크 규칙 + 자기 검사 템플릿
└── rounds/                ← 라운드별 결과물 아카이브
    └── round_01/
        ├── changes.md
        ├── diff.md
        └── reflect.md
```

## Round 1 시작법

1. `prototype/toc_v0.md`를 읽는다
2. `playtest/` 안의 시나리오 3개를 순서대로 실행한다
3. `feedback/feedback_template.md`를 복사하여 `feedback/round_01_feedback.md` 작성
4. `iterate/iteration_protocol.md`에 따라 `toc_v1.md` 생성
5. `rules/round_reflect_template.md`를 복사하여 `rounds/round_01/reflect.md` 작성

## 핵심 원칙

- **원본 보존**: toc_v0는 절대 수정하지 않는다
- **한 사이클 완주**: playtest → feedback → iterate → reflect를 반드시 끝까지
- **자기 개선**: 모든 md 파일에 Self-Improvement 섹션이 있다. 매 라운드가 목차뿐 아니라 프레임워크 자체를 개선한다

## 누가 돌리는가

이 프레임워크는 주체를 가리지 않는다:
- 피터공이 혼자 돌려도 된다
- AI(아리공, 클공, 승준님의 AI)가 돌려도 된다
- 함께 돌려도 된다
- 시나리오마다 다른 주체가 맡아도 된다

지시문이 충분히 명확하면 누구든 돌릴 수 있다. 그것이 이 프레임워크의 설계 목표다.

---

## Self-Improvement

이 README는 라운드를 거치며 다음이 개선되어야 한다:
- "시작법"이 실제로 따라할 수 있을 만큼 명확한지 검증
- 디렉토리 구조가 변경되면 반영
- 새로운 사용 패턴이 발견되면 문서화
