# SPEC — 인트로 CRT 모니터 연출 (v1.3-mid-r40)

**작성**: 2026-06-15 · **상태**: 구현 착수 (시안 승인 후 라이브 통합)
**근거**: 시안 `mockups/title-crt-sian.html`(피터공 6/15 승인) → 기존 `rt-` 레트로 타이틀을 모니터 프레임 + 부팅/타이핑 연출로 업그레이드.
**연결**: 요청 노트 [[요청.26.0615.1010-CRT타이틀연출]] / 기존 흐름 09-render-scenario.js §4i v10.

## 목적

진입 화면(타이틀·튜토리얼)을 80년대 CRT 모니터 안에서 부팅되는 8비트 게임처럼. 본편(미니멀 라이트)과 결을 분리해 "AI를 마주하는 화면 앞에 앉는다"는 진입 의식. 시나리오 선택 이후 본편은 무변.

## 화면 흐름 (기존 흐름 대체)

```
showTitleScreen
  → [부팅] 좌측 커서 깜빡 → "경기도 하이러닝 - AI 리터러시: 게임 시작" 좌→우 타이핑 → 준비 줄
  → [타이틀] 스윕(화면 그림) → 제목 2줄 글자별 타이핑+글리치 → 부제·인트로 박스 그려짐/써짐 → 시작 버튼 펄스
  → enterFromTitle (시작하기)
      · tutorialSeen=true → bootFlashTo(showStartScreen)  [재방문은 튜토리얼 생략, 기존 로직 유지]
      · 아니면 → crtShowDeleg
  → [위임 정의] "위임" 대형 + 3줄 글자별 타이핑 → 깜빡 2~3회 → 계속 버튼
  → crtShowMethod (계속)
  → [게임 방법] 번호 배지[1~5] 2회 깜빡 → 그 줄 좌→우 타이핑 (5단계 순차) → kicker → 게임 시작 버튼
  → enterFromTutorial → bootFlashTo(showStartScreen)  [기존 유지]
```

- "튜토리얼 다시 보기"(시작 화면) → showTutorialScreen = 모니터 렌더 후 위임 정의부터(부팅·타이틀 생략).
- 부팅/타이틀/위임/방법은 한 번 렌더한 모니터 DOM 안의 4개 `.crt-layer`를 토글(재렌더 X). enterFromTutorial만 container 재렌더(본게임 진입).

## DOM / 클래스 (신규 `crt-` 접두어, 기존 `rt-`와 분리)

`.crt-overlay`(fixed 풀스크린 다크) > `.crt-monitor`(크림 본체) > `.crt-bezel`(초콜릿 경사) > `.crt-screen`
화면 안: `.crt-glare`/`.crt-flash`/`.crt-sweep` + 4 `.crt-layer`(#crtBoot/#crtTitle/#crtDeleg/#crtMethod).
- 타이틀: `.crt-t1`·`.crt-t2`(대형, 배지 없음)·`.crt-subs`·`.crt-intro>p`·`.crt-btn`.
- 위임: `.crt-dword`(대형 "위임")·`.crt-dlines>.crt-dln`(intro 줄 수만큼)·계속 버튼.
- 방법: `.crt-mhead`·`.crt-mline>(.crt-no + .crt-mtext)` ×5·`.crt-kicker`·게임시작 버튼.

## 데이터 (texts.yaml — single source)

- `title_screen.badge` → 부팅 줄 = badge + ": 게임 시작" (부팅 sub 줄은 JS 하드코딩 플레이버).
- `title_screen.main_title_1/2`, `sub_title_1`, `host_text`, `btn_start` — 기존 키 재사용.
- `tutorial_screen.delegation_word` "위임", `delegation_intro`(3줄), `tutorial`(5줄, 번호와 1:1), `kicker`, `btn_continue`, `btn_more`(계속 → 위임→방법) 신설.
- 위임/방법 본문은 피터공 6/15 신규 문안(아래). 강조는 `.hl--c/.hl--p/.hl--y`(CRT 화면에선 배경칠 제거, 색 텍스트로 오버라이드).

### 신규 문안
delegation_intro: ["위임이란 내가 할 일을 다른 누군가에게 맡기는 것!","내가 할까? <b>AI에게 시킬까?</b>","내 대신 AI에게 시키는 것이 바로 위임이다."]
tutorial(1~5): 상황/선택 / 선택은 다른 시간·에너지·자원 / 직접 하면 비싸지만 능력 / 능력 쌓이면 다음 위임 싸짐 / 제출 전 검토로 점수.

## 폰트

8비트 픽셀 = Galmuri11(OFL). `fonts/Galmuri11.woff2` 추가, `--font-crt:'Galmuri11'` 신설(00-base.css). CRT 화면 전용 — 본편 `--font-pixel`(Mulmaru) 불변.

## 애니메이션 타이밍 (시안 기준)

부팅 초기 커서 깜빡 1.3s → 타이핑 65ms/자. 타이틀 제목 60ms/자 + 글리치 0.22s×3. 위임 3줄 33ms/자 → 깜빡. 방법 번호 2회 깜빡(0.86s) → 28ms/자. 전부 JS 타이머, 값만 바꾸면 조정.

## r41 — 시나리오 선택 완료 배너 (피터공 6/16 세션491)

시나리오 선택 화면(`showStartScreen`, allDone 분기)의 "AI 리터러시 시나리오를 모두 완료했습니다!" 배너를 손글씨(`--font-hand`)·노랑(`--acc-yellow`)·기울임에서 **픽셀 폰트(`--font-pixel`)·연두색 박스(`--acc-mint`)·정렬(기울임 제거)**로. 같은 화면 픽셀 요소(`.rt-badge`·`.rt-line`·`.rt-start`)와 톤 통일. 인라인 스타일(09-render-scenario.js). 문안 불변(texts `start_screen.all_done_banner`).

**r43b (피터공 6/16)**: 줄바꿈 금지 — `display:inline-block`+`white-space:nowrap`(내용폭, 센터 래퍼) + 폰트 20→28px + **글씨 노랑(`--acc-yellow`)** + **초록 그림자(`text-shadow:3px 3px 0 --acc-mint-deep`)**. 타이틀 화면 픽셀 톤(노랑 글씨+컬러 그림자)과 통일.

## r42 — 로컬 테스팅 화면 네비 (피터공 6/16 세션491)

초기 로컬 테스팅처럼 화면을 건너뛰며 확인하는 dev 도구. 좌하단(디버그 토글 위, `bottom:42px`) 4버튼 바 `#dev-nav`([타이틀][튜토리얼][시나리오 선택][리포트]). 각각 `showTitleScreen`/`showTutorialScreen`/`showStartScreen`/`devNavReport` 호출.

- **노출**: `_initDevNav`가 항상 `hidden` 해제 — 로컬·라이브 모두 노출(피터공 6/16 "라이브도 있어야 테스팅"). `_isLocalEnv()` 헬퍼는 보존 — KT 전달 직전 배포본만 숨기려면 가드 복원.
- `devNavReport`: 리포트는 시나리오 기록이 있어야 의미 → `scenarioHistory` 비면 `dbgShowReport('A')`로 샘플 5종 채워 보여줌.
- 인쇄 숨김(11-print.css `.dev-nav`). 셸 `index.shell.html`에 정적 마크업, 게이팅·헬퍼는 12-debug.js, 호출은 14-init.js.

## 입장 게이트 — 이름·수업코드 (피터공 6/29, 요청 [[요청.26.0629.1341-이름수업코드입장]])

KT 하이러닝 배포용. 게임 시작 전 **학생 식별** — 이름·수업코드가 있어야만 진입. **같은 CRT 모니터 안, 타이틀 포함 모든 화면보다 앞선 별도 첫 레이어**(`#crtEntry`). 타이틀을 대체·통합하지 않는 추가 화면(피터공 6/29 정정 — 처음엔 타이틀에 통합했다가 "타이틀보다도 앞 별도 화면"으로 분리).

- **흐름**: `showTitleScreen` → `_crtShowEntry`(입장: 게임 타이틀 2줄 + 이름/수업코드 + 시작하기) → `enterFromEntry`(검증·저장) → `_crtRunBoot`(부팅) → 타이틀 → 튜토리얼. 입장이 부팅보다도 앞.
- **레이어 구성**(`.crt-entrylayer`): 게임 타이틀(`.crt-et1`/`.crt-et2`)+부제 / 입력 2칸 `#crtName`(maxlength 20)·`#crtCode`(`.crt-field` CRT 녹색 톤 `--cg`/`--cg-dim`·`--font-crt`) / 에러 `#crtEntryErr` / 시작 버튼 `#crtEntryBtn`. 마크업 `_crtMarkup()`(09-render-scenario.js).
- **게이트 규칙**:
  - 버튼은 두 칸 모두 비어있지 않을 때만 활성(`_crtEntryCheck()` — `disabled` 토글). 빈 칸이면 회색·클릭 불가.
  - 클릭(`enterFromEntry`) 시: 이름 trim 후 비면 에러. 수업코드는 **공백 전부 제거 후** `CONFIG.classCode`(='하이러닝')와 일치해야 통과. 불일치 시 인라인 에러(`#crtEntryErr`), 화면 유지.
  - Enter 키로도 제출.
- **저장**: 통과 시 `gameState.playerName`(이름, `<>&"` 제거·20자 컷)·`gameState.classCode` 세팅 후 `saveGame()`. 재방문(`tutorialSeen===true`)·새로고침 복원(`continueGame`) 시 이미 저장돼 재입력 불필요 — 재방문 입장 화면에서 두 칸을 저장값으로 프리필(`_crtEntryPrefill`).
- **수업코드 정의**: `CONFIG.classCode='하이러닝'`(00-config.js). 변종(mid/elem) 공통 값. 부팅 뱃지 "경기도 하이러닝 - AI 리터러시"와 정합.
- **검증분**: (자가) 빈칸 게이트·오답 코드 차단·정답 통과·playerName 저장·재방문 프리필 / (피터공) 입력 UX·CRT 톤·라이브 흐름.

## 비범위 (이번 빌드 제외)

본편 화면, 시나리오 데이터, 밸런스. 인트로 연출 + 입장 게이트만. (리포트 이름 표시는 SPEC-report.md.)
