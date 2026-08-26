#!/usr/bin/env python3
"""세션 기록 자동 백업 — 하네스 JSONL을 볼트로 뜬다.

선문: _dev/scripts/SPEC-session_backup.md
요청: 요청.26.0826.0610-세션기록자동백업

피터공이 memento·goodbye마다 손으로 하던 터미널 캡쳐를 대신한다.
읽는 것(.txt) + 보존하는 것(.jsonl.gz) 두 벌을 만든다.
"""
import argparse
import gzip
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

VAULT = Path("/Users/p.air15/Neo-Obsi-Sync")
OUT_DIR = VAULT / "_클로드코드노트" / "세션기록"
MANIFEST = OUT_DIR / "_manifest.json"
LOCK = OUT_DIR / ".manifest.lock"
PROJECT_DIR = Path.home() / ".claude" / "projects" / "-Users-p-air15-Neo-Obsi-Sync"
TM = VAULT / "_dev" / "tm-bar" / "tm.sh"

# tool_result 절단 한도(문자). 2,000자로 뒀더니 Gmail 스레드 본문이 잘려
# 「새 링크를 보냈다」는 대목이 .txt에서 사라졌다(2026-08-26 검증 4에서 적발).
# 메일·API·명령 출력은 대개 20K 안에 들어오고, 그보다 큰 것은 파일 통째 읽기다.
# 무엇을 자르든 전문은 .jsonl.gz에 그대로 있다.
TRUNC = 20000


# ---------------------------------------------------------------- 매니페스트

class Lock:
    """mkdir 원자 락. vault_write.py와 같은 방식."""

    def __init__(self, path, timeout=10.0):
        self.path, self.timeout = Path(path), timeout

    def __enter__(self):
        deadline = time.time() + self.timeout
        self.path.parent.mkdir(parents=True, exist_ok=True)
        while True:
            try:
                self.path.mkdir()
                return self
            except FileExistsError:
                if time.time() > deadline:
                    print(f"⚠️ 락 대기 시간 초과: {self.path}", file=sys.stderr)
                    sys.exit(2)
                time.sleep(0.1)

    def __exit__(self, *exc):
        try:
            self.path.rmdir()
        except OSError:
            pass


def load_manifest():
    if not MANIFEST.exists():
        return {}
    try:
        return json.loads(MANIFEST.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        print("⚠️ 매니페스트를 읽지 못해 빈 것으로 시작한다", file=sys.stderr)
        return {}


def save_manifest(m):
    MANIFEST.write_text(
        json.dumps(m, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8"
    )


# ------------------------------------------------------------------- 렌더

def _text_of(content):
    """tool_result의 content는 str이거나 블록 리스트다."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        out = []
        for b in content:
            if isinstance(b, dict):
                out.append(b.get("text") or b.get("content") or json.dumps(b, ensure_ascii=False))
            else:
                out.append(str(b))
        return "\n".join(out)
    return "" if content is None else str(content)


def _clip(s, full):
    if full or len(s) <= TRUNC:
        return s
    return s[:TRUNC] + f"\n… (+{len(s) - TRUNC:,}자, 전문은 .jsonl.gz에)"


def _args_brief(inp):
    """tool_use 인자를 한 줄로."""
    if not isinstance(inp, dict):
        return ""
    for key in ("command", "file_path", "pattern", "query", "prompt", "url", "skill"):
        if key in inp and isinstance(inp[key], str):
            v = " ".join(inp[key].split())
            return v[:200] + ("…" if len(v) > 200 else "")
    v = json.dumps(inp, ensure_ascii=False)
    return v[:200] + ("…" if len(v) > 200 else "")


def render(records, full=False):
    lines = []
    for d in records:
        t = d.get("type")

        if t == "user":
            msg = d.get("message") or {}
            c = msg.get("content")
            if isinstance(c, str):
                lines.append(f"\n❯ {c}\n")
            elif isinstance(c, list):
                for b in c:
                    if not isinstance(b, dict):
                        continue
                    if b.get("type") == "tool_result":
                        body = _clip(_text_of(b.get("content")), full)
                        lines.append("  ⎿ " + body.replace("\n", "\n    "))
                    elif b.get("type") == "text":
                        lines.append(f"\n❯ {b.get('text','')}\n")

        elif t == "assistant":
            msg = d.get("message") or {}
            for b in msg.get("content") or []:
                if not isinstance(b, dict):
                    continue
                bt = b.get("type")
                if bt == "text":
                    if b.get("text", "").strip():
                        lines.append(b["text"])
                elif bt == "thinking":
                    body = _clip(b.get("thinking", ""), full)
                    lines.append("[생각] " + body.replace("\n", "\n       "))
                elif bt == "tool_use":
                    lines.append(f"⏺ {b.get('name','?')}({_args_brief(b.get('input'))})")

        elif t == "attachment":
            a = d.get("attachment") or {}
            lines.append(f"[시스템] attachment/{a.get('type','?')}")

        elif t == "system":
            lines.append(f"[시스템] {d.get('subtype','?')}")

    return "\n".join(lines)


def header(session, window, date_s, uuid, src_size, n_msg, n_rec):
    return "\n".join([
        "=" * 72,
        f"  세션 {session} · 창 {window} · {date_s}",
        f"  UUID     {uuid}",
        f"  원본     {src_size:,} bytes ({src_size/1024/1024:.1f}MB)",
        f"  메시지   {n_msg}개 (전체 레코드 {n_rec}개)",
        f"  무손실   같은 이름의 .jsonl.gz",
        "=" * 72,
        "",
    ])


# ------------------------------------------------------------------- 백업

def read_jsonl(path):
    recs, bad = [], 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                recs.append(json.loads(line))
            except json.JSONDecodeError:
                bad += 1
    return recs, bad


def detect_window():
    ts = os.environ.get("TERM_SESSION_ID", "")
    if not ts or not TM.exists():
        return "미상"
    try:
        r = subprocess.run([str(TM), "whoami-term", ts], capture_output=True,
                           text=True, timeout=5)
        return r.stdout.strip() or "미상"
    except (subprocess.SubprocessError, OSError):
        return "미상"


def _disambiguate(base, uuid, manifest):
    """세션 번호는 «재사용»된다 — 같은 이름이 남의 세션을 덮지 않게 한다.

    `session_num.sh`는 그 창의 오늘 엔트리가 «비어 있으면» 번호를 다시 준다
    (2026-08-16 신설, 8/15 창C에 빈 엔트리 넷이 생긴 것이 이유다).
    그래서 memento 없이 /clear → /recall 하면 UUID는 다른데 세션 번호가 같다.
    이름이 같아지면 앞 세션의 전사가 통째로 덮인다.

    평소엔 이름을 건드리지 않고, «실제로 부딪힐 때만» uuid 앞 8자를 붙인다.
    """
    claimed = {v.get("base") for k, v in manifest.items() if k != uuid}
    on_disk = {p.stem for p in OUT_DIR.glob("*.txt")}
    if base not in claimed and base not in on_disk:
        return base
    return f"{base}-{uuid[:8]}"


def backup_one(src, session, window, manifest, full=False, dry=False):
    """반환: (상태, 메시지). 상태 = new | updated | skipped | failed"""
    uuid = src.stem
    try:
        size = src.stat().st_size
    except OSError as e:
        return "failed", f"{uuid[:8]} 읽기 실패: {e}"

    prev = manifest.get(uuid)
    if prev and prev.get("src_size") == size:
        return "skipped", f"세션 {prev.get('session')} 그대로"

    recs, bad = read_jsonl(src)
    if not recs:
        return "failed", f"{uuid[:8]} 레코드 0건"

    # 이름은 «처음 뜬 때»로 못 박고 다시 계산하지 않는다.
    # mtime으로 매번 계산하면 자정을 넘겨 두 번 뜰 때 같은 세션이 두 파일로
    # 갈라지고 앞엣것이 고아로 남는다(2026-08-26 피터공 질문에서 드러남).
    warn = None
    if prev and prev.get("base"):
        base = prev["base"]
        date_s = prev.get("date") or datetime.fromtimestamp(
            src.stat().st_mtime).strftime("%Y-%m-%d")
        # ★BK-030 — 못 박기의 «한쪽 예외». 세션 번호를 모르는 스윕이 먼저 이름을
        # 박으면 나중에 번호가 와도 영영 `미상`으로 남는다(세션 996이 그렇게 났다:
        # 매니페스트엔 session·window가 있는데 파일만 미상). 번호를 파일명에 넣는
        # 것이 이 판의 핵심 이득인데 그 이득만 빠진 채 돌아 증상이 조용하다.
        # 방향은 «미상 → 세션N» 한쪽뿐이다. 번호가 박힌 이름을 다시 계산하면
        # 못 박기 자체가 무의미해진다.
        if session and base.startswith("미상-"):
            try:
                ymd = datetime.strptime(date_s, "%Y-%m-%d").strftime("%y%m%d")
            except ValueError:
                ymd = datetime.fromtimestamp(src.stat().st_mtime).strftime("%y%m%d")
            promoted = _disambiguate(f"세션{session}-창{window}-{ymd}", uuid, manifest)
            moved, clash = [], False
            for ext in (".txt", ".jsonl.gz"):
                old_p, new_p = OUT_DIR / (base + ext), OUT_DIR / (promoted + ext)
                if not old_p.exists():
                    continue
                # 덮어쓰지 않는다 — 이름이 못생긴 편이 남의 전사를 지우는 것보다 낫다.
                if new_p.exists():
                    clash = True
                    break
                moved.append((old_p, new_p))
            if clash:
                warn = f"이름 승격 포기 — {promoted} 가 이미 있다"
            else:
                # ⚠️ dry-run은 «디스크를 안 건드린다»가 유일한 약속이다. 여기서 rename하면
                #    파일만 옮겨지고 매니페스트는 안 바뀌어 그 자리에서 고아가 된다.
                if not dry:
                    for old_p, new_p in moved:
                        old_p.rename(new_p)
                base = promoted
    else:
        stamp = datetime.fromtimestamp(src.stat().st_mtime)
        date_s = stamp.strftime("%Y-%m-%d")
        if session:
            base = f"세션{session}-창{window}-{stamp.strftime('%y%m%d')}"
        else:
            base = f"미상-{stamp.strftime('%y%m%d-%H%M')}-{uuid[:8]}"
        base = _disambiguate(base, uuid, manifest)

    n_msg = sum(1 for r in recs if r.get("type") in ("user", "assistant"))
    body = render(recs, full=full)
    txt = header(session or "미상", window, date_s, uuid, size, n_msg, len(recs)) + body
    if bad:
        txt += f"\n\n[경고] 파싱 실패한 줄 {bad}개 — 전문은 .jsonl.gz"

    txt_p = OUT_DIR / (base + ".txt")
    gz_p = OUT_DIR / (base + ".jsonl.gz")

    if dry:
        return ("updated" if prev else "new"), (
            f"{base} ← {size:,}B (dry-run)" + (f"  ⚠️ {warn}" if warn else "")
        )

    txt_p.write_text(txt, encoding="utf-8")
    with open(src, "rb") as fi, gzip.open(gz_p, "wb", compresslevel=9) as fo:
        shutil.copyfileobj(fi, fo)

    manifest[uuid] = {
        "session": session, "window": window, "date": date_s, "base": base,
        "src_size": size, "records": len(recs), "messages": n_msg,
        "files": [txt_p.name, gz_p.name],
        "backed_up_at": datetime.now().isoformat(timespec="seconds"),
    }
    ratio = gz_p.stat().st_size / size * 100 if size else 0
    return ("updated" if prev else "new"), (
        f"{base} · txt {txt_p.stat().st_size:,}B · gz {gz_p.stat().st_size:,}B ({ratio:.0f}%)"
        + (f"  ⚠️ {warn}" if warn else "")
    )


def main():
    ap = argparse.ArgumentParser(description="세션 JSONL을 볼트로 백업한다")
    ap.add_argument("--session", help="세션 번호 (없으면 미상)")
    ap.add_argument("--window", help="창 이름 (없으면 자동 판정)")
    ap.add_argument("--full", action="store_true", help="툴 결과를 자르지 않는다")
    ap.add_argument("--dry-run", action="store_true", dest="dry")
    ap.add_argument("--no-sweep", action="store_true", help="현재 세션만")
    ap.add_argument("--seed", action="store_true",
                    help="도입 시점: 기존 jsonl을 «뜨지 않고» 매니페스트에만 올려 "
                         "스윕 대상에서 뺀다. 지난 30일은 수동 캡쳐가 이미 있다")
    a = ap.parse_args()

    if not PROJECT_DIR.is_dir():
        print(f"⚠️ 하네스 기록 폴더가 없다: {PROJECT_DIR}", file=sys.stderr)
        return 1

    # dry-run에서도 만든다 — 락이 이 폴더 안에 잡히기 때문이다.
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    window = a.window or detect_window()

    cur_uuid = os.environ.get("CLAUDE_CODE_SESSION_ID", "").strip()
    cur = PROJECT_DIR / f"{cur_uuid}.jsonl" if cur_uuid else None
    if cur is None or not cur.exists():
        cands = sorted(PROJECT_DIR.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)
        cur = cands[-1] if cands else None
        print("⚠️ CLAUDE_CODE_SESSION_ID로 파일을 못 찾아 최신 mtime으로 폴백했다"
              f" → {cur.name if cur else '없음'}", file=sys.stderr)

    with Lock(LOCK):
        manifest = load_manifest()
        results = []

        if a.seed:
            n = 0
            for src in PROJECT_DIR.glob("*.jsonl"):
                if src.stem in manifest or (cur is not None and src == cur):
                    continue
                manifest[src.stem] = {
                    "session": None, "window": "미상",
                    "date": datetime.fromtimestamp(src.stat().st_mtime).strftime("%Y-%m-%d"),
                    "src_size": src.stat().st_size, "seeded": True,
                    "note": "도입 전 세션 — 수동 터미널 캡쳐가 대신한다",
                }
                n += 1
            if not a.dry:
                save_manifest(manifest)
            print(f"seed — 기존 {n}개를 스윕 대상에서 뺐다"
                  + (" (dry-run)" if a.dry else ""))
            return 0

        if cur is not None:
            results.append(("현재", *backup_one(cur, a.session, window, manifest,
                                                a.full, a.dry)))

        if not a.no_sweep:
            for src in sorted(PROJECT_DIR.glob("*.jsonl"), key=lambda p: p.stat().st_mtime):
                if cur is not None and src == cur:
                    continue
                if src.stem in manifest:
                    continue
                results.append(("스윕", *backup_one(src, None, "미상", manifest,
                                                   a.full, a.dry)))

        if not a.dry:
            save_manifest(manifest)

    counts = {}
    for _, status, _ in results:
        counts[status] = counts.get(status, 0) + 1

    for kind, status, msg in results:
        mark = {"new": "＋", "updated": "↻", "skipped": "·", "failed": "⚠️"}[status]
        if status != "skipped":
            print(f"{mark} [{kind}] {msg}")

    parts = [f"{k} {v}" for k, v in sorted(counts.items())]
    print(f"세션기록 백업 — {' · '.join(parts) if parts else '대상 없음'}"
          + (" (dry-run)" if a.dry else ""))
    return 1 if counts.get("failed") else 0


if __name__ == "__main__":
    sys.exit(main())
