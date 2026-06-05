---
tags:
  - 개발
  - todoy-bar
  - TASKS
created: 2026-06-02
author: 아리공
---
## todoy-bar — 진행 작업 (live)

### v1 (MVP)

- [x] SPEC 작성 (`docs/SPEC.md`)
- [x] PLAN 작성
- [x] 헬퍼 `todoy.sh` (setup/add/add-dialog/activate/done/carryover/render)
- [x] SwiftBar 플러그인 `todoy-bar.5s.sh`
- [x] settings allowlist에 `todoy.sh` 추가
- [x] 헤드리스 검증 (add → activate → done → render → 플러그인 출력)
- [x] 피터공 SwiftBar에 플러그인 표시 확인 (todoy-bar 독립 폴더로 PluginDirectory 지정, 날씨 데모 사라지고 todoy만 표시)
- [x] 인터랙션 정정: 목록 클릭 = ACTIVE / 서브메뉴 = 완료(☑) / 텍스트 체크박스 `☐·☑`
- [x] now-bar 폐기 → `_dev/_archive/now-bar/`로 이동(피터공 "필요없다"), todoy 단일화. now.sh status 적기 중단

### v1.1 — 루틴 연동 (완료)

- [x] 굿모닝 스킬: 2.6단계 신설 — `todoy.sh setup`(어제 미완료 자동 이월·백업) → 피터공 확인 → `add`로 오늘 할 일 반영
- [x] 굿바이 스킬: 4.7단계 신설 — `todoy.sh carryover`로 미완료 확인, 마감 보고에 "내일 이월 N건"
- [x] 이월 로직 검증: 가짜 어제 파일 → setup → 미완료만 이월(완료 제외)·시간/횟수 초기화·carried=true 확인

### 후속 후보

- [ ] 시간/횟수 회고 뷰 (하루 끝에 "뭐에 얼마나" 요약)
- [ ] now-bar ACTIVE 연동 옵션 (원하면 status 자동기록)
- [ ] 항목 순서 바꾸기 / 우선순위
