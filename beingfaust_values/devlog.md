# Being Faust Values — devlog

## 2026-04-07

- **변경**: `index.html` L676 — 기본 방코드 `VisCo` → `2026emerging`
- **사유**: 오늘 홍대 워크숍용. 피터공 지시 (대소문자 무관, 양쪽 toUpperCase 처리)
- **커밋**: `5193853` (origin/main 푸시 완료)

## 2026-04-07 — Priority 드래그 UX v2 (TASK 5)

- **변경**: Screen 4 Priority 드래그&드롭 로직 전면 재작업 (양쪽 파일 동일 적용)
  - `index.html`
    - CSS `.pri-item` / `.pri-item.dragging` (L476~496 부근): `transition` 부드러운 곡선(0.22s cubic-bezier)으로 교체 + `will-change: transform`, dragging 상태에서는 `transition: none !important` (떨림 해결 핵심)
    - JS `initDrag()` (L1206~1318 부근): touchstart/move/end 기반 swap → 슬롯 양보 패턴으로 전면 재작성. 마우스 이벤트도 등록 (데스크톱 테스트용). `list.dataset.dragBound` 플래그로 리스너 중복 방지
  - `index-grid.html`
    - CSS `.pri-item` / `.pri-item.dragging` (L422~442 부근): 동일 변경
    - JS `initDrag()` (L857~969 부근): 동일 재작성
- **사유**: 피터공 보고 — (1) 드래그 중 블럭이 부르르 떨림, (2) 손가락이 형제 중간점을 넘을 때 즉시 DOM swap → 형제들/dragged가 동시에 점프하는 어색함. 두 증상 모두 `transition: 0.15s`가 드래그 중에도 적용되어서 생긴 lag + 즉시 DOM insertBefore로 인한 것
- **동작**:
  - 드래그 중: `transform: translateY(dy)`로 손가락만 따라감 (DOM 이동 없음, transition 없어서 떨림 없음)
  - 형제: `targetIndex`가 바뀐 순간에만 `translateY(±itemHeight)`로 자리 양보 (형제는 transition 살아있어서 부드럽게 이동)
  - Drop 시점: `state.priority.splice`로 배열 재정렬 → `renderPriList()` 호출하여 DOM 재생성 (rank/화살표 자동 갱신)
- **영향 범위**: Screen 4만. `moveItem()` 화살표 버튼은 건드리지 않음 — 별도 경로 유지
- **DEV-GUIDE**: v0.5로 버전 업, DO NOT TOUCH 표에서 `initDrag` 항목 복원
- **미검증**: 실브라우저 테스트는 피터공 워크숍 후 진행. 코드 레벨 정합성만 확인
- **커밋**: (작성 예정, push 없음)
