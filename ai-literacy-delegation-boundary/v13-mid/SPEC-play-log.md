# SPEC-play-log — 플레이 로그 로컬 수집 + 전송 대기 큐

> 작성 2026-06-17 (세션495). 선문후코 — 코드 작성 전 명세. **구현 완료 2026-06-18 세션498** (`src/js/08b-play-record.js`, CDP 검증 ALL PASS). 구현 메모: ct/ce는 scenarioHistory의 `discounts`(time/energy 실비) 합으로 산출 — §4의 "자원 history에서 산출"을 그 자리로 확정. rep = scenarioRepeatCount−1.
> 요청: [[요청.26.0617.0851-플레이로그수집]] / 검토: [[AI리터러시 플레이 로그 수집 — 설계 검토 26.0617]]
> 목적: 경기도교육청 배포본(v13-mid)에서 익명 플레이 데이터를 로컬에 쌓아 두고, 나중에 서버로 전송할 수 있게 한다. 이 SPEC은 **로컬 처리(레코드 생성 + outbox 큐)까지**. 전송 인프라는 별도 SPEC.

## §0 원칙

- **개인정보 0**: 학교·위치·이름·기기 식별 없음. 아는 것은 "언제 한 게임인지"(타임스탬프)뿐.
- **최대 정보 · 최소 크기**: 선택(입력)과 시나리오별 결과(유용한 파생)는 명시 저장, 매 스텝 누적 스냅샷(재계산 가능)은 버린다.
- **append-only**: 로컬 큐는 쌓고, 전송 성공 시에만 제거. 손실 방지.
- **additive**: 게임 로직·콘텐츠·`storageKey` 불변. 새 localStorage 키 하나 추가로 끝. 버전 분기 없음.

## §1 레코드 스키마 (한 판 = 1 play record)

확정 ABC: A=학기 전체 1레코드 / B=시나리오 종료마다 갱신 / C=선택 원본 포함(압축).

짧은 키 + 고정 순서. 한 레코드 목표 크기 1~2KB.

```
{
  v:   "v1.3-mid-r39",      // CONFIG.version — 버전별 해석 기준
  pid: "p_<rand>",          // 무작위 익명 play id (한 판 묶기, 개인 식별 아님)
  st:  1718600000000,       // started_at (epoch ms)
  en:  1718600930000,       // ended_at (마지막 갱신 시각)
  done: true,               // 5개 완주 여부 (중간 이탈 시 false)
  sc: [                     // 시나리오별 (플레이한 것만, 순서 = 플레이 순서)
    {
      id: "selfintro",      // 시나리오 id
      t1: "B",              // 1차 선택
      t2: "B2",             // 2차 선택
      rv: "R3",             // 검토 선택
      g:  "A",              // 등급
      s:  88,               // 최종 점수
      dl: 2,                // 위임 델타 (이 시나리오)
      dk: 1,                // 도메인지식 델타
      ct: 14,               // 소비 시간 (time cost 합)
      ce: 9,                // 소비 에너지 (energy cost 합)
      cd: [["A",2,1]],      // 할인 내역 [stage,time,energy] (있을 때만, 없으면 생략)
      rep: 0                // 이 시나리오 반복(리플레이) 횟수
    }
    // ...
  ],
  end: {                    // 학기 종합 (done=true일 때 의미)
    total: 412,             // 누적 점수
    lv: 3,                  // 최종 레벨
    type: 3,                // 학습자 유형 6종 → 코드(0~5). 매칭표는 코드 내 상수
    cards: {                // 트랙별 획득 카드 = 내부 키(한글 카드명) 목록.
      h: ["주체성","호기심"],        // 인간중심 = humanCentricCards 태그명
      d: ["검토력","분석력","자료판단력"], // 도메인 = domainCards 키
      g: ["회복력"]                 // 성장 = growthCards 키
    }
  }
}
```

설계 메모 — "코드는 짧게, 해석은 게임 데이터로 매칭"
- **버린 것**: 매 이벤트 `snap`, 매 스텝 누적 점수·자원 현재값, 세션ID 반복. → `v`+선택으로 복원 가능하거나 분석 무가치.
- **남긴 것**: 선택 시퀀스(t1/t2/rv) · 시나리오별 결과 · 재시도(rep) · 카드 코드 목록 · 종합. 모두 코드/숫자라 짧다.
- **코드북 불필요**: 시나리오 id·선택 id·카드 label·유형 코드의 사람 읽는 이름은 모두 게임 데이터(`scenarios.yaml`·`texts.yaml`)가 이미 정답표. 별도 매칭표 관리 없음. 통합 분석 시 그것과 조인.
- 피터공 분석 니즈 매핑: 카드 획득=`end.cards`+`sc[].g`결말 / 재시도=`sc[].rep` / 어느 시나리오 재시도=`sc[].id`+`rep` / 시나리오별 선택 분포=여러 레코드의 `sc[].t1/t2/rv` 집계(자동).
- 시각은 epoch ms 정수.

## §2 저장 구조

- 신규 CONFIG 키: `outboxKey: 'ai-literacy-delegation-boundary-v13-mid-outbox'`
- outbox = play record 배열. localStorage에 JSON.
- `pid`는 새 학기(게임) 시작 시 1회 발급 → `gameState.playId`에 보관(saveGame으로 영속). 창을 닫았다 켜도 같은 판은 같은 pid.

## §3 생성·갱신 흐름 (B = 시나리오마다 갱신)

1. **게임 시작**(새 학기): `gameState.playId` 발급, `st` 기록.
2. **시나리오 종료** (`scenarioEnd`, 09-render-scenario.js:1130~): `scenarioHistory` push 직후 →
   - `makePlayRecord(gameState)`로 현재까지의 레코드 생성.
   - `upsertOutbox(record)`: outbox에서 같은 `pid` 항목을 교체(없으면 추가). `en` 갱신.
   - 효과: 중간에 그만둬도 마지막 시나리오까지의 레코드가 outbox에 남음(done=false).
3. **학기 완료** (`showFinalReport`): `done=true`, `end` 채워 마지막 upsert.

## §4 함수 (신규, 08-event-log.js 또는 신규 08b-play-record.js)

- `makePlayRecord(gs)` → §1 스키마 객체. `scenarioHistory`를 압축, `end`는 done 시만.
  - 학습자 유형: 리포트의 기존 판정 함수 재사용(중복 구현 금지).
  - 시나리오별 ct/ce: 자원 history 또는 시나리오 진입~종료 차이에서 산출 (구현 시 09-render-scenario 정독해 확정).
- `upsertOutbox(rec)` → 같은 pid 교체/추가, localStorage 저장.
- `getOutbox()` / `clearOutbox()` → 조회/비움.
- `dequeueFromOutbox(pid)` → 전송 성공 시 제거 (전송 SPEC에서 사용).
- (보류) `flushOutbox()` → 전송 인터페이스 stub. 본체는 전송 SPEC.

## §5 기존 trackEvent 처리

- `trackEvent`/`eventLogKey`는 **그대로 둔다**(디버그·콘솔 로그용). 전송 레코드는 §4 별도 경로.
- 단, 매 이벤트 무거운 `snap` 반복은 전송과 무관 → outbox는 `snap`을 쓰지 않는다(scenarioHistory에서 직접 압축).

## §6 익명성 안전장치

- `pid` = `'p_'+무작위`(타임스탬프 섞되 개인/기기 비식별). 
- 수집 항목에 입력 텍스트·이름·IP 없음. §1 스키마 외 필드 추가 금지.
- 교육청 제출용 "수집 항목 = 위 스키마 전부" 한 장 설명 문서를 전송 SPEC 단계에서.

## §7 검증 (구현 후)

- 한 판 플레이 → outbox에 레코드 1건, 크기 측정(목표 ≤2KB).
- 시나리오 2개만 하고 중단 → done=false, sc 길이 2.
- 같은 판 이어서 완주 → 같은 pid 1건으로 유지(중복 누적 없음), done=true.
- CDP 헤드리스로 outbox 키 내용 확인.

## §8 범위 밖 (다음 SPEC)

- 서버 전송(Supabase 등 인프라 조사·결정), gzip, 재시도 정책 상세, 관리자 조회, 교육청 설명 문서.

## §9 부록 — 샘플 레코드 (26.0617, 실제 코드 체계)

선택: tier1 `A/B/C` · tier2 `A1~C3` · review `R1~R3`. 카드: 인간중심 태그명·도메인/성장 키(한글). 유형 코드: 0 가려서맡기는·1 넓게맡기는·2 내가먼저해보는·3 끝까지확인하는·4 빠르게끝내는·5 다시도전하는.

```json
// ① 신중 완주 (S/A, 유형3, studyplan 재시도 1)
{"v":"v1.3-mid-r39","pid":"p_l9x2k7","st":1718600000000,"en":1718600942000,"done":true,
 "sc":[
  {"id":"selfintro","t1":"B","t2":"B2","rv":"R3","g":"A","s":88,"dl":2,"dk":1,"ct":14,"ce":9,"rep":0},
  {"id":"groupwork","t1":"C","t2":"C1","rv":"R3","g":"S","s":96,"dl":3,"dk":2,"ct":12,"ce":11,"cd":[["C",2,1]],"rep":0},
  {"id":"eorinwangja","t1":"A","t2":"A3","rv":"R2","g":"B","s":78,"dl":1,"dk":1,"ct":18,"ce":13,"rep":0},
  {"id":"career","t1":"B","t2":"B1","rv":"R3","g":"A","s":85,"dl":2,"dk":2,"ct":15,"ce":12,"rep":0},
  {"id":"studyplan","t1":"C","t2":"C2","rv":"R3","g":"S","s":94,"dl":3,"dk":2,"ct":13,"ce":10,"rep":1}],
 "end":{"total":441,"lv":3,"type":3,"cards":{"h":["주체성","호기심"],"d":["검토력","분석력","자료판단력"],"g":["회복력"]}}}

// ② 빠른 직접 처리, 낮은 등급 (유형4)
{"v":"v1.3-mid-r39","pid":"p_q4m8t1","st":1718700000000,"en":1718700388000,"done":true,
 "sc":[
  {"id":"selfintro","t1":"A","t2":"A1","rv":"R1","g":"C","s":62,"dl":-1,"dk":0,"ct":6,"ce":5,"rep":0},
  {"id":"groupwork","t1":"A","t2":"A1","rv":"R1","g":"D","s":48,"dl":-2,"dk":-1,"ct":5,"ce":4,"rep":0},
  {"id":"eorinwangja","t1":"A","t2":"A2","rv":"R1","g":"C","s":58,"dl":-1,"dk":0,"ct":7,"ce":6,"rep":0},
  {"id":"career","t1":"B","t2":"B1","rv":"R2","g":"C","s":64,"dl":0,"dk":1,"ct":9,"ce":7,"rep":0},
  {"id":"studyplan","t1":"A","t2":"A1","rv":"R1","g":"D","s":50,"dl":-2,"dk":0,"ct":6,"ce":5,"rep":0}],
 "end":{"total":282,"lv":1,"type":4,"cards":{"h":[],"d":["문해력"],"g":[]}}}

// ③ 중간 이탈 (2개 완료 후 진행 중 종료, end 생략)
{"v":"v1.3-mid-r39","pid":"p_z1n6w9","st":1718800000000,"en":1718800210000,"done":false,
 "sc":[
  {"id":"selfintro","t1":"B","t2":"B3","rv":"R2","g":"B","s":76,"dl":1,"dk":1,"ct":16,"ce":10,"rep":0},
  {"id":"groupwork","t1":"C","t2":"C2","rv":"R3","g":"A","s":84,"dl":2,"dk":1,"ct":13,"ce":11,"rep":0}]}
```

크기: 완주 레코드 1줄 압축 ≈ 600~750 bytes, 중간 이탈은 더 작음. gzip 전송 시 절반 이하.
