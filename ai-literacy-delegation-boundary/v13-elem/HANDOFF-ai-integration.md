# AI 리터러시 게임 — 통합/배포 명세 (AI 에이전트용)

> Machine-oriented integration spec. 이 문서는 배포·통합을 수행하는 AI 에이전트가 읽고
> 그대로 실행/검증할 수 있도록 사실과 정확한 값만 담는다. 사람용 가이드는 `HANDOFF-deploy.md`.
> 생성: 2026-06-18, 빌드 `v1.3-mid-r39` / `v1.3-elem-r39`.

## 1. ARTIFACT

- Type: static client bundle. No server, no build step required by recipient.
- Per variant, a self-contained folder:
  ```
  builds/<variant>/
    index.html         # entrypoint, single-file HTML (inlined CSS+JS+data)
    images/            # 135 webp assets, referenced as "images/sNN_cX[_id].webp"
    fonts/             # Galmuri11.woff2, Mulmaru.woff2, referenced as "fonts/<file>"
  ```
- Variants: `mid` (중등, primary), `elem` (초등, content currently identical to mid).
- All asset references are RELATIVE to index.html (`images/...`, `fonts/...`). Deploy folder as-is. Do NOT rewrite paths.

## 2. DEPLOY CONTRACT

1. Upload each `builds/<variant>/` folder to a static host (S3/CloudFront or equivalent), preserving the folder layout.
2. Publish one URL per variant, pointing at that variant's `index.html`.
3. Variant selection is by URL only (no runtime detection). elem URL serves elem build; mid URL serves mid build.
4. On content redeploy: overwrite files AND invalidate CDN cache for `index.html`.

## 3. REQUIRED BACKEND CONFIG (Lambda env) — BLOCKING

The client calls `POST {LOG_BASE}/log` on game start. Requests are rejected (403/400) unless the Lambda whitelists are updated:

```
ALLOWED_GAME_IDS  += ai_literacy_md, ai_literacy_el
ALLOWED_ORIGINS   += <deployed mid origin>, <deployed elem origin>
```

- LOG_BASE (current): `https://w0a7nvx7qd.execute-api.ap-northeast-2.amazonaws.com`
- Reference: `Assets/incoming/AI리터러시/20260617-lambda-api-reference.md` §2, §5.
- Failure mode is non-fatal to gameplay (fire-and-forget); only logging is lost.

## 4. API INTEGRATION (client → /log)

- Endpoint: `POST {LOG_BASE}/log`
- Headers: `Content-Type: application/json`. Origin header sent by browser must be in `ALLOWED_ORIGINS`.
- Fetch options: `credentials:'omit'`, `keepalive:true`. Errors swallowed.
- Trigger: exactly once per play, when leaving tutorial for scenario-select screen.
- Body schema (≤1024 bytes):
  ```json
  {
    "eventType": "game_start",        // constant
    "gameId":    "ai_literacy_md|ai_literacy_el",
    "clientId":  "<uuid>",            // per-browser, persisted in localStorage
    "ts":        "<ISO-8601>"
  }
  ```
- `/result` endpoint of the same Lambda is NOT used by this game.

## 5. VARIANT DIFFERENCES (build-injected CONFIG)

build.py injects these per variant (exact-string replacement of source defaults). Source = mid defaults.

| CONFIG key | mid | elem |
|------------|-----|------|
| `storageKey` | `ai-literacy-delegation-boundary-v13-mid` | `...-v13-elem` |
| `eventLogKey` | `...-v13-mid-events` | `...-v13-elem-events` |
| `sessionIdKey` | `ai-literacy-v13-mid-session-id` | `ai-literacy-v13-elem-session-id` |
| `outboxKey` | `...-v13-mid-outbox` | `...-v13-elem-outbox` |
| `version` | `v1.3-mid-r39` | `v1.3-elem-r39` |
| `gameId` | `ai_literacy_md` | `ai_literacy_el` |
| `debug` | `false` (변종 빌드) | `false` |

`debug:false` hides dev-nav, debug-toggle, debug-panel, version-label. (Source/root build = `debug:true`.)

## 6. BUILD REPRODUCTION

```
cd _dev/ai-literacy-delegation-boundary/v13-mid
python3 build.py --variant=mid     # → builds/mid/  (index.html + images + fonts)
python3 build.py --variant=elem    # → builds/elem/
# optional minify (needs terser; falls back to plaintext if absent):
python3 build.py --variant=mid --release
```

- Source of truth: `src/` (js, styles, shell) + `data/*.yaml`. `index.html` is generated; never hand-edit.
- Self-contained step: build rewrites `../images/`→`images/`, `../fonts/`→`fonts/` and copies parent-root assets into the variant folder.

## 7. INTEGRATION POINTS (source map)

| Concern | File : symbol |
|---------|---------------|
| game_start logging | `src/js/08c-game-start-log.js` : `sendGameStartLog()`, `_gslClientId()` |
| log trigger | `src/js/09-render-scenario.js` : `enterFromTutorial()` → calls `sendGameStartLog()` |
| config (endpoint/gameId/debug) | `src/js/00-config.js` : `CONFIG.logEndpoint/gameId/clientIdKey/debug` |
| variant injection | `build.py` : `VARIANT_CONFIG_REPLACEMENTS`, `build_variant()`, `_copy_assets()` |
| debug hide | `src/js/14-init.js` (production block) + `src/js/12-debug.js` : `_initDevNav()` |
| restart→title | `src/js/10-event-handlers.js` : `resetGame()` → `showTitleScreen()` |

## 8. NON-GOALS / SEPARATE SYSTEMS

- The richer per-play analytics log (`src/js/08b-play-record.js`, outbox queue) is a SEPARATE system from `/log`. It accumulates in localStorage; its server transmission is unbuilt (out of scope here). Do not conflate with `/log`.
- No server-authoritative state. No DB. All gameplay state is client-side localStorage.

## 9. VERIFICATION CHECKLIST (post-deploy)

- [ ] Variant URL loads `index.html`; `images/sNN_c1.webp` and `fonts/Galmuri11.woff2` return 200.
- [ ] `CONFIG.debug === false`; dev-nav / debug-toggle / version-label not visible.
- [ ] Finishing tutorial → scenario-select fires one `POST /log` with `gameId` matching the variant; response 200 after whitelist is set.
- [ ] No uncaught JS exceptions in console on load and through cut-1 of any scenario.
