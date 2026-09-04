#!/usr/bin/env python3
"""vault_write.py — 볼트 공유 파일에 «주소를 지정해» 안전하게 쓴다.

사양: _dev/scripts/SPEC-vault_write.md
왜: 창 여럿이 같은 마크다운 파일을 Edit(전체 읽기→전체 쓰기)하면 나중 쓰기가
    앞 쓰기를 통째로 덮는다. 창들이 만지는 «자리»는 서로 다르므로(P/Q UID),
    자리를 지정해 락 아래에서 쓰면 진짜 병렬이 된다.

exit: 0 성공 / 1 주소 없음·중복·인자 오류 / 2 락 실패 / 3 검증 실패
"""
import io, os, re, sys, time, shutil, argparse, unicodedata
from datetime import datetime

VAULT = os.environ.get("VAULT_WRITE_ROOT", "/Users/p.air15/Neo-Obsi-Sync")
LOGDIR = os.path.join(VAULT, "_dev/scripts/logs")

E_ADDR, E_LOCK, E_VERIFY = 1, 2, 3


def die(code, msg):
    sys.stderr.write(f"[vault_write] {msg}\n")
    sys.exit(code)


# ── 별칭 → (파일, 락) ────────────────────────────────────────────
# ⚠️ log의 락은 session_num.sh와 «반드시» 같은 경로여야 한다. 다르면 같은 파일에
#    락 둘이 걸려 상호 배제가 성립하지 않는다 (SPEC §5).
def resolve(alias):
    j = os.path.join
    if alias == "log":
        base = j(VAULT, "_클로드코드노트")
        return j(base, "클로드코드 세션 로그.md"), j(base, ".session_num.lock")
    if alias == "checklist":
        base = j(VAULT, "_init")
        return j(base, "세션 체크리스트.md"), j(base, ".세션 체크리스트.lock")
    if alias == "queue":
        base = j(VAULT, "_init")
        return j(base, "작업 큐.md"), j(base, ".작업 큐.lock")
    if alias == "dn":
        base = j(VAULT, "_init/_myJournal")
        day = os.environ.get("VAULT_WRITE_DAY") or datetime.now().strftime("%Y-%m-%d")
        return j(base, f"{day}.md"), j(base, ".dn.lock")
    die(E_ADDR, f"모르는 별칭: {alias} (log|checklist|queue|dn)")


# ── 락 ──────────────────────────────────────────────────────────
def pid_alive(pid):
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ValueError):
        return False


class Lock:
    def __init__(self, path, tries=20, wait=0.2, stale=60):
        self.path, self.tries, self.wait, self.stale = path, tries, wait, stale
        self.held = False

    def __enter__(self):
        for _ in range(self.tries):
            try:
                os.mkdir(self.path)
                io.open(os.path.join(self.path, "pid"), "w").write(str(os.getpid()))
                self.held = True
                return self
            except FileExistsError:
                if self._reclaimable():
                    shutil.rmtree(self.path, ignore_errors=True)
                    continue
                time.sleep(self.wait)
        die(E_LOCK, f"락 획득 실패 — {self.path}\n"
                    f"           다른 창이 쓰는 중이면 잠시 뒤 다시. 죽은 락이면 이 디렉토리를 지운다.")

    def _reclaimable(self):
        """죽은 락만 회수한다. PID가 살아 있으면 시간이 지나도 안 뺏는다
        (맥북이 쓰기 도중 잠들면 «1분 넘었으니 죽었다»가 틀린 판정이 된다)."""
        pf = os.path.join(self.path, "pid")
        try:
            pid = int(io.open(pf).read().strip())
            if pid_alive(pid):
                return False
            return True
        except (OSError, ValueError):
            pass
        try:  # pid 파일이 없는 옛 형식 — 시간으로만 판정
            return (time.time() - os.path.getmtime(self.path)) > self.stale
        except OSError:
            return False

    def __exit__(self, *a):
        if self.held:
            shutil.rmtree(self.path, ignore_errors=True)


# ── 주소 찾기 ────────────────────────────────────────────────────
def block_end(lines, start):
    """헤딩 블록의 끝. 같은 레벨 이상(=# 개수가 같거나 적은) 헤딩 직전까지."""
    m = re.match(r"^(#+) ", lines[start])
    lvl = len(m.group(1))
    for i in range(start + 1, len(lines)):
        m2 = re.match(r"^(#+) ", lines[i])
        if m2 and len(m2.group(1)) <= lvl:
            return i
    return len(lines)


def find_unique(lines, pred, what):
    hits = [i for i, l in enumerate(lines) if pred(l)]
    if len(hits) == 0:
        die(E_ADDR, f"주소를 못 찾았다: {what} — 엉뚱한 데 쓰지 않고 멈춘다")
    if len(hits) > 1:
        die(E_ADDR, f"주소가 {len(hits)}개다: {what} (행 {[h+1 for h in hits]}) — UID 중복은 이미 사고다")
    return hits[0]


def check_expect(text, expect, where):
    if expect is None:
        return
    if unicodedata.normalize("NFC", expect) not in unicodedata.normalize("NFC", text):
        die(E_ADDR, f"--expect 불일치 — {where}\n"
                    f"           기대: {expect}\n"
                    f"           실제: {text[:120]}")


# ── 쓰기 + 검증 ──────────────────────────────────────────────────
def commit(path, old_lines, new_lines, verify, dry):
    """임시 파일에 쓰고 mv로 교체한다. 부분 쓰기가 디스크에 남지 않게."""
    out = "\n".join(new_lines)
    try:
        out.encode("utf-8")
    except UnicodeError as e:
        die(E_VERIFY, f"UTF-8 인코딩 실패: {e}")

    delta = len(new_lines) - len(old_lines)
    if not (verify["min_delta"] <= delta <= verify["max_delta"]):
        die(E_VERIFY, f"줄 수 변화가 예상 밖이다: {delta:+d}행 "
                      f"(허용 {verify['min_delta']:+d}~{verify['max_delta']:+d}) — 통째 날림 방어")

    if dry:
        print(f"[dry-run] {path}  {len(old_lines)}행 → {len(new_lines)}행 ({delta:+d})")
        for ln in verify.get("preview", []):
            print(f"  {ln}")
        return

    tmp = path + ".tmp_vw"
    io.open(tmp, "w", encoding="utf-8").write(out)
    os.replace(tmp, path)

    # 되읽어 대조 — 자기보고를 안 믿는다
    back = io.open(path, encoding="utf-8").read().split("\n")
    if back != new_lines:
        die(E_VERIFY, "되읽은 내용이 쓴 것과 다르다 — 파일을 확인하라")
    for probe in verify.get("probes", []):
        if not any(probe in l for l in back):
            die(E_VERIFY, f"쓴 뒤 대조 실패: '{probe[:60]}' 가 파일에 없다")


def audit(alias, verb, uid, old):
    """덮어쓴 옛 줄을 남긴다 — 같은 UID를 두 창이 동시에 써도 되찾을 수 있게."""
    try:
        os.makedirs(LOGDIR, exist_ok=True)
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with io.open(os.path.join(LOGDIR, "vault_write.log"), "a", encoding="utf-8") as f:
            f.write(f"{ts}\t{alias}\t{verb}\t{uid}\t{old}\n")
    except OSError:
        pass  # 감사 로그 실패로 본 작업을 막지 않는다


def read(path):
    if not os.path.exists(path):
        die(E_ADDR, f"파일이 없다: {path}")
    return io.open(path, encoding="utf-8").read().split("\n")


# ── 동사 ────────────────────────────────────────────────────────
def v_entry_fill(a):
    path, lock = resolve("log")
    with Lock(lock):
        lines = read(path)
        i = find_unique(lines, lambda l: re.match(rf"^## 세션 {a.n}(\D|$)", l), f"## 세션 {a.n}")
        check_expect(lines[i], a.expect, f"세션 {a.n} 헤딩")
        end = block_end(lines, i)
        body = io.open(a.bodyfile, encoding="utf-8").read().rstrip("\n").split("\n")
        new = lines[:i + 1] + [""] + body + [""] + lines[end:]
        audit("log", "entry-fill", f"세션{a.n}", f"{end-i-1}행 교체")
        commit(path, lines, new, {"min_delta": -(end - i - 1) - 2, "max_delta": len(body) + 2,
                                  "probes": [body[0][:60]] if body and body[0].strip() else [],
                                  "preview": [f"세션 {a.n}: {end-i-1}행 → {len(body)}행"]}, a.dry_run)


def v_entry_append(a):
    """세션 중 실시간으로 한 줄 붙인다. entry-fill(통째 교체)과 가른 이유는
    둘을 한 동사로 두면 실시간 append가 fill에 통째로 지워지기 때문이다."""
    path, lock = resolve("log")
    with Lock(lock):
        lines = read(path)
        i = find_unique(lines, lambda l: re.match(rf"^## 세션 {a.n}(\D|$)", l), f"## 세션 {a.n}")
        check_expect(lines[i], a.expect, f"세션 {a.n} 헤딩")
        end = block_end(lines, i)
        at = end
        while at - 1 > i and not lines[at - 1].strip():
            at -= 1
        new = lines[:at] + [a.text] + lines[at:]
        audit("log", "entry-append", f"세션{a.n}", a.text[:80])
        commit(path, lines, new, {"min_delta": 1, "max_delta": 1, "probes": [a.text[:60]],
                                  "preview": [f"세션 {a.n} ← + {a.text[:60]}"]}, a.dry_run)


def v_line_replace(a):
    path, lock = resolve(a.alias)
    with Lock(lock):
        lines = read(path)
        tag = f"<!-- {a.uid} -->"
        i = find_unique(lines, lambda l: tag in l, tag)
        check_expect(lines[i], a.expect, f"{a.uid} 줄")
        old = lines[i]
        new_line = a.text if tag in a.text else f"{a.text} {tag}"
        new = lines[:i] + [new_line] + lines[i + 1:]
        audit(a.alias, "line-replace", a.uid, old)
        commit(path, lines, new, {"min_delta": 0, "max_delta": 0, "probes": [tag],
                                  "preview": [f"- {old[:70]}", f"+ {new_line[:70]}"]}, a.dry_run)


def v_line_add(a):
    path, lock = resolve(a.alias)
    with Lock(lock):
        lines = read(path)
        nums = [int(m.group(1)) for m in re.finditer(r"<!-- P(\d+) -->", "\n".join(lines))]
        uid = f"P{max(nums) + 1 if nums else 1}"
        h = find_unique(lines, lambda l: l.startswith("### 활성"), "### 활성")
        at = h + 1
        while at < len(lines) and not lines[at].strip():
            at += 1
        new_line = f"{a.text} <!-- {uid} -->"
        new = lines[:at] + [new_line] + lines[at:]
        audit(a.alias, "line-add", uid, "(신규)")
        commit(path, lines, new, {"min_delta": 1, "max_delta": 1, "probes": [f"<!-- {uid} -->"],
                                  "preview": [f"+ {uid}: {a.text[:70]}"]}, a.dry_run)
        if not a.dry_run:
            print(uid)


def v_line_remove(a):
    path, lock = resolve(a.alias)
    with Lock(lock):
        lines = read(path)
        tag = f"<!-- {a.uid} -->"
        i = find_unique(lines, lambda l: tag in l, tag)
        check_expect(lines[i], a.expect, f"{a.uid} 줄")
        old = lines[i]
        new = lines[:i] + lines[i + 1:]
        audit(a.alias, "line-remove", a.uid, old)
        commit(path, lines, new, {"min_delta": -1, "max_delta": -1,
                                  "preview": [f"- {old[:70]}"]}, a.dry_run)


def v_block_replace(a):
    path, lock = resolve(a.alias)
    with Lock(lock):
        lines = read(path)
        i = find_unique(lines, lambda l: re.match(rf"^##### {a.uid} —", l), f"##### {a.uid} —")
        check_expect(lines[i], a.expect, f"{a.uid} 헤딩")
        end = block_end(lines, i)
        body = io.open(a.bodyfile, encoding="utf-8").read().rstrip("\n").split("\n")
        if not re.match(rf"^##### {a.uid} —", body[0]):
            die(E_ADDR, f"본문 첫 줄이 '##### {a.uid} — ' 로 시작해야 한다 (받은 것: {body[0][:60]})")
        new = lines[:i] + body + [""] + lines[end:]
        audit(a.alias, "block-replace", a.uid, f"{end-i}행 교체: {lines[i][:80]}")
        commit(path, lines, new, {"min_delta": -(end - i) + 1, "max_delta": len(body) + 1,
                                  "probes": [body[0][:60]],
                                  "preview": [f"{a.uid}: {end-i}행 → {len(body)}행"]}, a.dry_run)


def v_append_under(a):
    path, lock = resolve(a.alias)
    with Lock(lock):
        lines = read(path)
        i = find_unique(lines, lambda l: l.strip() == a.heading.strip(), a.heading)
        end = block_end(lines, i)
        at = end
        while at - 1 > i and not lines[at - 1].strip():
            at -= 1
        new = lines[:at] + [a.text] + lines[at:]
        audit(a.alias, "append-under", a.heading, a.text[:80])
        commit(path, lines, new, {"min_delta": 1, "max_delta": 1, "probes": [a.text[:60]],
                                  "preview": [f"{a.heading} ← + {a.text[:60]}"]}, a.dry_run)


# ── CLI ─────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(prog="vault_write.py", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--dry-run", action="store_true", help="쓰지 않고 무엇이 바뀔지만 보여준다")
    sub = p.add_subparsers(dest="verb", required=True)

    s = sub.add_parser("entry-fill", help="세션 로그 엔트리 본문을 채운다")
    s.add_argument("n"); s.add_argument("bodyfile"); s.add_argument("--expect")
    s.set_defaults(fn=v_entry_fill)

    s = sub.add_parser("entry-append", help="세션 로그 엔트리 끝에 한 줄 추가 (실시간 기록용)")
    s.add_argument("n"); s.add_argument("text"); s.add_argument("--expect")
    s.set_defaults(fn=v_entry_append)

    s = sub.add_parser("line-replace", help="UID로 줄 하나를 교체")
    s.add_argument("alias"); s.add_argument("uid"); s.add_argument("text")
    s.add_argument("--expect", required=True, help="대상 줄에 이 문자열이 있어야 쓴다")
    s.set_defaults(fn=v_line_replace)

    s = sub.add_parser("line-add", help="새 줄 추가 (UID 자동 발급, 발급된 UID를 출력)")
    s.add_argument("alias"); s.add_argument("text")
    s.set_defaults(fn=v_line_add)

    s = sub.add_parser("line-remove", help="UID로 줄 하나를 제거")
    s.add_argument("alias"); s.add_argument("uid")
    s.add_argument("--expect", required=True)
    s.set_defaults(fn=v_line_remove)

    s = sub.add_parser("block-replace", help="UID로 헤딩 블록을 교체")
    s.add_argument("alias"); s.add_argument("uid"); s.add_argument("bodyfile")
    s.add_argument("--expect", required=True)
    s.set_defaults(fn=v_block_replace)

    s = sub.add_parser("append-under", help="헤딩 섹션 끝에 한 줄 추가")
    s.add_argument("alias"); s.add_argument("heading"); s.add_argument("text")
    s.set_defaults(fn=v_append_under)

    a = p.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
