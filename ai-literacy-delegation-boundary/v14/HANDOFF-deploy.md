# AI 리터러시 게임 — 배포 인수인계 (동현공용)

작성: 2026-06-18 (놀공 / 아리공)
대상: AWS 배포 담당 (동현공)

---

## 0. 한눈에

- 받는 것: **정적 파일 폴더 두 개** (`builds/mid/`, `builds/elem/`). 각 폴더가 그 자체로 완결 — 통째로 올리면 작동.
- 할 일: ① 각 폴더를 AWS(S3/CloudFront 등)에 올리고 `index.html`을 가리키는 **URL 두 개** 발급 → KT 전달. ② **Lambda 환경변수 2개 갱신**(3절 — 안 하면 참여 로깅이 막힘).
- 빌드는 동현공이 돌릴 필요 없음. 소스가 아니라 **완성된 정적 묶음**을 받는다.

---

## 1. 전달물 구조

```
builds/mid/        ← 중등용 (1차 KT 배포 대상)
  index.html       ← 진입점. 이 파일을 가리키는 URL을 발급
  images/          ← 135개 (게임 컷 이미지)
  fonts/           ← Galmuri11.woff2, Mulmaru.woff2
builds/elem/       ← 초등용 (현재 내용은 중등과 동일, 초등 고유 콘텐츠는 추후 교체분 재전달)
  index.html  images/  fonts/
```

- 두 폴더는 **상대경로**(`images/`, `fonts/`)만 쓴다. 폴더 구조 그대로 올리면 됨. 경로 재작성 불필요.
- 두 빌드는 **저장 키가 분리**돼 있어 같은 브라우저에서 둘 다 열어도 진행상황이 안 엉킨다.

## 2. 배포 절차

1. `builds/mid/` 폴더의 내용을 S3 버킷(또는 정적 호스팅) 경로에 업로드.
2. 그 경로의 `index.html`을 가리키는 공개 URL 발급 → KT에 **중등 URL**로 전달.
3. `builds/elem/`도 동일하게 별도 경로/URL로 → **초등 URL**. (1차는 중등만 써도 됨)
4. 콘텐츠가 갱신되어 재배포할 때는 폴더를 덮어쓰되, **CloudFront 캐시 무효화**(invalidation)로 `index.html`이 새로 받아지게 할 것.

> 변종별 URL이 곧 변종이다 — 런타임에 초등/중등을 판별하지 않는다. 초등 URL로 들어오면 초등 빌드가, 중등 URL로 들어오면 중등 빌드가 그대로 시작된다.

## 3. ★ Lambda 환경변수 갱신 (필수 — 이게 없으면 참여 로깅 403/400)

게임은 시작 시 참여 로깅 API(`POST {BASE}/log`)를 호출한다. 그 Lambda가 우리 요청을 받으려면 **두 화이트리스트에 등록**돼야 한다. (레퍼런스 문서 §5)

| 환경변수 | 추가할 값 |
|----------|-----------|
| `ALLOWED_GAME_IDS` | `ai_literacy_md`, `ai_literacy_el` (둘 다) |
| `ALLOWED_ORIGINS` | 위 2절에서 발급한 **배포 도메인(들)** (예: `https://<중등URL 도메인>`, `https://<초등URL 도메인>`) |

- 이 둘이 등록 안 되면 모든 `/log` 요청이 `403 forbidden` 또는 `400 invalid payload`로 거부된다 (게임 진행 자체엔 지장 없음 — 로깅만 안 됨).
- 현재 호출 대상 Base URL: `https://w0a7nvx7qd.execute-api.ap-northeast-2.amazonaws.com` (게임 코드에 설정값으로 박혀 있음. 변경 시 알려주면 빌드 갱신).

## 4. 참여 로깅 동작 (무엇을 보내나)

- **시점**: 플레이어가 튜토리얼을 마치고 "시나리오 선택" 화면으로 넘어가는 버튼을 누를 때. **한 판에 1회**.
- **방식**: `POST /log`, fire-and-forget (`keepalive`, 실패 무시). 게임 흐름을 절대 막지 않음.
- **본문**:
  ```json
  { "eventType": "game_start", "gameId": "ai_literacy_md", "clientId": "<브라우저별 UUID>", "ts": "<ISO 시각>" }
  ```
  - `gameId`: 중등 `ai_literacy_md` / 초등 `ai_literacy_el` (빌드별 고정)
  - `clientId`: 브라우저마다 1회 발급해 `localStorage`에 보관하는 익명 UUID (개인정보 아님)
- **개인정보 없음**: 이름·위치·학교·입력 텍스트 전송 안 함.
- **`/result` 엔드포인트는 쓰지 않는다** (그건 다른 게임용 결과페이지 생성 API).

## 5. 참고

- 디버그 UI(개발 네비·패널·버전 라벨)는 배포 빌드에서 **숨김 처리**돼 있다 (학교 라이브 보호).
- 게임 상태는 전부 클라이언트(`localStorage`)에 있다. 별도 백엔드/DB 없음. Lambda는 참여 로깅만.
- 기술 상세(빌드 재현·통합 지점·변종 키)는 짝 문서 `HANDOFF-ai-integration.md` 참조.
- 문의: 놀공 (아리공/피터공). 빌드 버전: 중등 `v1.3-mid-r39`, 초등 `v1.3-elem-r39`.
