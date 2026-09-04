#!/usr/bin/env python3
"""작업 큐 분류 — SPEC-vault_write.md §11

활성의 Q-UID 없는 섹션을 둘로 가른다.
  A. 살아 있는 프로젝트가 쓰는 6건 → Q-UID 부여
  B. 나머지 → 아카이브 파일로 원문 그대로 이동

기본은 미리보기. --run 을 줘야 실제로 쓴다.
"""
import io, re, sys, os, shutil

VAULT = "/Users/p.air15/Neo-Obsi-Sync"
QUEUE = os.path.join(VAULT, "_init/작업 큐.md")
ARCH  = os.path.join(VAULT, "_init/작업 큐_archive_260823_구형식.md")
RUN = "--run" in sys.argv

# 살려 둘 6건 — 헤딩 시작 문자열로 식별한다 (행 번호는 다른 창이 고치면 밀린다)
KEEP = [
    ("myWriter — 글쓰기 앱",                 "P44"),
    ("인생게임 2026 (game-of-life-2026)",     "P41"),
    ("Come Out & Play 서울 메일 아카이브",     "P31"),
    ("AI리터러시 KT 중/초등 배포",             "P1"),
    ("CBT 게임 프로토타입",                   "P14"),
    ("커넥천 파빌리언 활용",                   "P54"),
]

src = io.open(QUEUE, encoding="utf-8").read()
lines = src.split("\n")

h3 = [i for i, l in enumerate(lines) if l.startswith("### ")]
act = [i for i in h3 if lines[i].startswith("### 활성")]
if len(act) != 1:
    sys.exit(f"### 활성 헤딩이 {len(act)}개 — 1개여야 한다")
a = act[0]
after = [i for i in h3 if i > a]
b = after[0] if after else len(lines)

# --- 활성 섹션 목록 (시작행, 끝행, 헤딩) ---------------------------
heads = [i for i in range(a + 1, b) if lines[i].startswith("##### ")]
secs = []
for n, i in enumerate(heads):
    end = heads[n + 1] if n + 1 < len(heads) else b
    secs.append((i, end, lines[i][len("##### "):]))

qs = [int(m.group(1)) for m in re.finditer(r"^##### Q(\d+)", src, re.M)]
dup = {q for q in qs if qs.count(q) > 1}
if dup:
    sys.exit(f"백필 전에 이미 중복 Q가 있다: {sorted(dup)}")
mx = max(qs)
print(f"활성 {a+1}~{b}행 · 섹션 {len(secs)}개 · 기존 Q {len(qs)}개(최대 Q{mx}) · 중복 0\n")

noq = [(s, e, t) for (s, e, t) in secs if not re.match(r"^Q\d+", t)]

# --- 6건 식별: 정확히 1개씩 잡히는지 ------------------------------
keep_map = {}
for prefix, pid in KEEP:
    hit = [(s, e, t) for (s, e, t) in noq if t.startswith(prefix)]
    if len(hit) != 1:
        sys.exit(f"[중단] '{prefix}' 매치 {len(hit)}개 — 1개여야 한다")
    keep_map[hit[0][0]] = (pid, hit[0][2])

nxt = mx + 1
assign = []
for s_, e_, t_ in noq:
    if s_ in keep_map:
        assign.append((s_, nxt, keep_map[s_][0], t_))
        nxt += 1
archive = [(s_, e_, t_) for (s_, e_, t_) in noq if s_ not in keep_map]

print(f"── A. UID 부여 {len(assign)}건 ──")
for s_, q, pid, t in assign:
    print(f"  {s_+1:>5}  Q{q:<5} [{pid:<4}] {t[:62]}")
print(f"\n── B. 아카이브 {len(archive)}건 ──")
for s_, e_, t in archive:
    print(f"  {s_+1:>5}  ({e_-s_:>3}행) {t[:70]}")

if not RUN:
    print(f"\n[미리보기] 실제로 쓰려면 --run")
    sys.exit(0)

# --- 적용 ---------------------------------------------------------
shutil.copy2(QUEUE, QUEUE + ".bak_triage")
for s_, q, pid, t in assign:
    lines[s_] = f"##### Q{q} — {t}"

arch_body = []
drop = set()
for s_, e_, t in archive:
    arch_body.append("\n".join(lines[s_:e_]).rstrip())
    drop.update(range(s_, e_))
kept = [l for i, l in enumerate(lines) if i not in drop]

header = (
    "---\ncreated: 2026-08-23\nauthor: 아리공\ntags:\n  - 시스템\n  - 아카이브\n---\n\n"
    "## 작업 큐 아카이브 — 260823 구형식\n\n"
    "> 2026-08-11 `Q{n}` 체계 도입 이전 형식의 섹션들. 활성에 남아 있었으나 "
    "현재 Q섹션과 중복이거나 대응하는 열린 프로젝트가 없어 여기로 내렸다.\n"
    "> **원문 그대로다 — 언제든 열어보면 된다.** 되살리려면 해당 섹션을 "
    "[[작업 큐]] 활성으로 옮기고 `##### Q{새번호} — ` 를 붙인다.\n"
    "> 근거: `_dev/scripts/SPEC-vault_write.md` §11 · [[요청.26.0823.0858-스킬동시성]]\n\n"
    f"섹션 {len(archive)}개\n\n---\n\n"
)
arch_text = header + "\n\n".join(arch_body) + "\n"

out = "\n".join(kept)

# --- 검증 ---------------------------------------------------------
# ① 원문 복원: 남은 것 + 아카이브 본문 = 원문 (헤딩 6건 변경분만 다름)
orig_lines = src.split("\n")
recon = list(orig_lines)
for s_, q, pid, t in assign:
    recon[s_] = f"##### Q{q} — {t}"
recon_kept = [l for i, l in enumerate(recon) if i not in drop]
assert recon_kept == kept, "남은 본문이 원문과 다르다"
moved = "\n\n".join("\n".join(recon[s_:e_]).rstrip() for s_, e_, t in archive)
assert moved == "\n\n".join(arch_body), "아카이브 본문이 원문과 다르다"
# ② 개수
qs2 = [int(m.group(1)) for m in re.finditer(r"^##### Q(\d+)", out, re.M)]
d2 = {q for q in qs2 if qs2.count(q) > 1}
assert not d2, f"중복 Q 발생: {sorted(d2)}"
assert len(arch_body) == len(archive) == 34, f"아카이브 {len(archive)}건 (34 기대)"
# ③ 줄 손실
assert len(kept) + sum(e_ - s_ for s_, e_, t in archive) == len(orig_lines), "줄 손실"
out.encode("utf-8"); arch_text.encode("utf-8")

io.open(ARCH, "w", encoding="utf-8").write(arch_text)
io.open(QUEUE, "w", encoding="utf-8").write(out)
print(f"\n적용 완료")
print(f"  작업 큐   {len(src):>9,}자 → {len(out):>9,}자  (백업 {QUEUE}.bak_triage)")
print(f"  아카이브  {len(arch_text):>9,}자 · 섹션 {len(archive)}개")
print(f"  검증: 원문 복원 일치 · Q 중복 0 · 줄 손실 0 · 활성 Q {len([1 for s_,e_,t in secs if re.match(r'^Q',t)])+len(assign)}개")
