# v0.5 발란스 CSV (읽기 전용 export)

`index.html`의 CONFIG / SCENARIO\_\* / DELEGATION\_DELTA 5개 객체를 그대로 추출한 스냅샷이다. 코드 수정 없이 발란스만 한눈에 본다.

## 파일

- `scenarios.csv` — 시나리오 5종 마스터 (id, title, leaf 27개씩, tier1×3, tier2 9개, review×3)
- `choices.csv` — leaf 단위 비용표 (135행). raw / mult(×0.6 round) / 위·도 ±3 적용 시의 표시값
- `config.csv` — CONFIG 글로벌 변수 (resourceMaxStart, multiplier, rpRewardByGrade, expThresholds, meterMaxByLevel, pointThresholds 등)
- `simulation.csv` — 시나리오별 max/avg/min + 학기 합산 verdict

## 갱신

```
node extract_balance.js
```

코드(index.html)가 바뀌면 다시 돌려서 4종 CSV 일괄 갱신.

## 주의

- `mult_*` 컬럼이 **실제 게임에서 표시되는 비용 (할인 0)**. raw\*0.6 후 round.
- `discount_*` 컬럼은 위/도 ±3일 때의 표시값(박스 검증용). 0으로 floor.
- 실제 게임 자원 천장은 레벨별로 늘어남 (config.csv `meterMaxByLevel`). simulation.csv의 verdict는 L1 시작값(100) 기준이므로 실제 학기 진행 (레벨업 + RP 회수)에서는 결과가 다를 수 있다.
