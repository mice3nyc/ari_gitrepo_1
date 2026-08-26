# session_backup.py 픽스처 — 이름 규칙(BK-020 못 박기 · BK-030 미상 승격)만 잰다.
#
# ★진짜 볼트를 안 건드린다. `OUT_DIR`을 임시 폴더로 갈아끼우고 가짜 jsonl을 만든다.
#   이 검사가 없으면 「미상으로 남았다」는 다음 memento에서 파일 이름을 «눈으로 볼 때»만
#   드러난다 — 매니페스트엔 session·window가 멀쩡히 들어 있어서 조회로는 안 갈린다.
#
# 실행: python3 _dev/scripts/session_backup_selftest.py
import importlib.util, json, sys, tempfile, shutil
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "sb", "/Users/p.air15/Neo-Obsi-Sync/_dev/scripts/session_backup.py")
sb = importlib.util.module_from_spec(spec); spec.loader.exec_module(sb)

tmp = Path(tempfile.mkdtemp(prefix="bk030-"))
sb.OUT_DIR = tmp / "out"; sb.OUT_DIR.mkdir(parents=True)
src_dir = tmp / "src"; src_dir.mkdir()

def mk(uuid, n=3):
    p = src_dir / f"{uuid}.jsonl"
    rows = [{"type": "user", "message": {"role": "user", "content": f"hello {i}"}} for i in range(n)]
    p.write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
    return p

ok = fail = 0
def check(name, cond, detail=""):
    global ok, fail
    if cond: ok += 1; print(f"  PASS  {name}" + (f" — {detail}" if detail else ""))
    else: fail += 1; print(f"  FAIL  {name} — {detail}")

print("BK-030 — 미상 승격\n")

# ① 세션 번호 없이 먼저 뜬다 → 미상
m = {}
src = mk("aaaaaaaa-1111-2222-3333-444444444444")
st, msg = sb.backup_one(src, None, "미상", m)
base1 = m[src.stem]["base"]
check("① 번호 없이 뜨면 미상", base1.startswith("미상-"), base1)
check("① 파일 둘이 디스크에 있다", (sb.OUT_DIR / (base1 + ".txt")).exists() and (sb.OUT_DIR / (base1 + ".jsonl.gz")).exists())

# ② 같은 파일이 커진 뒤 세션 번호와 함께 다시 뜬다 → 승격 + rename
src.write_text(src.read_text(encoding="utf-8") + json.dumps({"type": "assistant", "message": {"role": "assistant", "content": "hi"}}) + "\n", encoding="utf-8")
st, msg = sb.backup_one(src, "996", "B", m)
base2 = m[src.stem]["base"]
check("② 이름이 승격됐다", base2.startswith("세션996-창B-"), base2)
check("② 새 이름 파일 둘이 있다", (sb.OUT_DIR / (base2 + ".txt")).exists() and (sb.OUT_DIR / (base2 + ".jsonl.gz")).exists())
check("② ★옛 미상 파일이 고아로 안 남았다", not (sb.OUT_DIR / (base1 + ".txt")).exists() and not (sb.OUT_DIR / (base1 + ".jsonl.gz")).exists())
check("② 날짜는 못 박힌 것을 쓴다", base2.endswith(m[src.stem]["date"].replace("-", "")[2:]), f"{base2} vs {m[src.stem]['date']}")

# ③ 번호가 이미 박힌 이름은 다시 계산하지 않는다 (한쪽 방향)
src.write_text(src.read_text(encoding="utf-8") + json.dumps({"type": "user", "message": {"role": "user", "content": "more"}}) + "\n", encoding="utf-8")
st, msg = sb.backup_one(src, "999", "C", m)
check("③ 번호 박힌 이름은 안 바뀐다", m[src.stem]["base"] == base2, m[src.stem]["base"])

# ④ 승격 대상 이름이 이미 있으면 포기하고 옛 이름 유지 (남의 전사를 안 지운다)
m2 = {}
srcB = mk("bbbbbbbb-1111-2222-3333-444444444444")
sb.backup_one(srcB, None, "미상", m2)
baseB = m2[srcB.stem]["base"]
victim_base = f"세션700-창B-{m2[srcB.stem]['date'].replace('-','')[2:]}"
(sb.OUT_DIR / (victim_base + ".txt")).write_text("남의 전사 — 지우면 안 된다", encoding="utf-8")
(sb.OUT_DIR / (victim_base + ".jsonl.gz")).write_bytes(b"x")
srcB.write_text(srcB.read_text(encoding="utf-8") + json.dumps({"type": "user", "message": {"role": "user", "content": "grow"}}) + "\n", encoding="utf-8")
st, msg = sb.backup_one(srcB, "700", "B", m2)
# `_disambiguate`가 먼저 걸러 `-{uuid8}`을 붙인다 — 승격은 성공하되 남의 이름을 안 뺏는다.
check("④ 이름이 겹치면 uuid를 붙여 승격한다", m2[srcB.stem]["base"] == victim_base + "-" + srcB.stem[:8], m2[srcB.stem]["base"])
check("④ ★남의 파일이 그대로다", (sb.OUT_DIR / (victim_base + ".txt")).read_text(encoding="utf-8") == "남의 전사 — 지우면 안 된다")

# ④-2 둘째 그물 — 붙여도 겹치면(같은 uuid8 이름이 이미 디스크에) 승격 자체를 포기한다
m4 = {}
srcD = mk("dddddddd-1111-2222-3333-444444444444")
sb.backup_one(srcD, None, "미상", m4)
baseD = m4[srcD.stem]["base"]
d_date = m4[srcD.stem]["date"].replace("-", "")[2:]
for nm in (f"세션701-창B-{d_date}", f"세션701-창B-{d_date}-{srcD.stem[:8]}"):
    (sb.OUT_DIR / (nm + ".txt")).write_text("남의 것", encoding="utf-8")
    (sb.OUT_DIR / (nm + ".jsonl.gz")).write_bytes(b"x")
srcD.write_text(srcD.read_text(encoding="utf-8") + json.dumps({"type": "user", "message": {"role": "user", "content": "grow"}}) + "\n", encoding="utf-8")
st, msg = sb.backup_one(srcD, "701", "B", m4)
check("④-2 붙여도 겹치면 승격을 포기한다", m4[srcD.stem]["base"] == baseD, m4[srcD.stem]["base"])
check("④-2 경고를 낸다", "승격 포기" in msg, msg)
check("④-2 ★남의 파일 둘 다 그대로다",
      (sb.OUT_DIR / (f"세션701-창B-{d_date}.txt")).read_text(encoding="utf-8") == "남의 것"
      and (sb.OUT_DIR / (f"세션701-창B-{d_date}-{srcD.stem[:8]}.txt")).read_text(encoding="utf-8") == "남의 것")

# ⑤ dry-run은 디스크를 안 건드린다
m3 = {}
srcC = mk("cccccccc-1111-2222-3333-444444444444")
sb.backup_one(srcC, None, "미상", m3)
baseC = m3[srcC.stem]["base"]
srcC.write_text(srcC.read_text(encoding="utf-8") + json.dumps({"type": "user", "message": {"role": "user", "content": "grow"}}) + "\n", encoding="utf-8")
before = sorted(p.name for p in sb.OUT_DIR.glob("*"))
st, msg = sb.backup_one(srcC, "888", "D", m3, dry=True)
after = sorted(p.name for p in sb.OUT_DIR.glob("*"))
check("⑤ dry-run이 파일을 안 옮긴다", before == after, f"{len(before)}→{len(after)}")
check("⑤ dry-run이 승격될 이름을 보여준다", "세션888-창D-" in msg, msg)
check("⑤ dry-run이 매니페스트를 안 고친다", m3[srcC.stem]["base"] == baseC, m3[srcC.stem]["base"])

# ⑥ ★내용이 그대로여도 이름은 승격된다 (skip 분기의 구멍)
#    스윕이 익명으로 뜬 뒤, 그 창이 한 글자도 더 안 쓴 채 memento를 돌리는 경우.
#    조기 반환이 승격 앞에 있으면 번호를 알고도 미상으로 남는다.
m5 = {}
srcE = mk("eeeeeeee-1111-2222-3333-444444444444")
sb.backup_one(srcE, None, "미상", m5)
baseE = m5[srcE.stem]["base"]
size_before = srcE.stat().st_size
st, msg = sb.backup_one(srcE, "777", "E", m5)   # 파일을 «안 키우고» 번호만 준다
baseE2 = m5[srcE.stem]["base"]
check("⑥ 크기가 같아도 이름이 승격된다", baseE2.startswith("세션777-창E-"), f"{baseE} → {baseE2}")
check("⑥ 상태가 renamed다", st == "renamed", f"{st} · {msg}")
check("⑥ 디스크 파일도 따라 옮겨졌다",
      (sb.OUT_DIR / (baseE2 + ".txt")).exists() and not (sb.OUT_DIR / (baseE + ".txt")).exists())
check("⑥ 매니페스트 files도 갱신됐다", m5[srcE.stem]["files"] == [baseE2 + ".txt", baseE2 + ".jsonl.gz"], str(m5[srcE.stem]["files"]))
check("⑥ 원본을 다시 안 읽었다(크기 불변)", srcE.stat().st_size == size_before)

# ⑦ 이미 번호가 박힌 것은 skip 분기에서도 안 건드린다
st, msg = sb.backup_one(srcE, "778", "F", m5)
check("⑦ 번호 박힌 이름은 skip 분기에서도 그대로", m5[srcE.stem]["base"] == baseE2 and st == "skipped", f"{st} · {m5[srcE.stem]['base']}")

# ⑧ skip 분기의 dry-run도 디스크를 안 건드린다
m6 = {}
srcF = mk("ffffffff-1111-2222-3333-444444444444")
sb.backup_one(srcF, None, "미상", m6)
baseF = m6[srcF.stem]["base"]
before6 = sorted(p.name for p in sb.OUT_DIR.glob("*"))
st, msg = sb.backup_one(srcF, "779", "F", m6, dry=True)
check("⑧ skip 분기 dry-run이 파일을 안 옮긴다", before6 == sorted(p.name for p in sb.OUT_DIR.glob("*")))
check("⑧ skip 분기 dry-run이 매니페스트를 안 고친다", m6[srcF.stem]["base"] == baseF, m6[srcF.stem]["base"])

shutil.rmtree(tmp)
print(f"\n  {ok} PASS / {fail} FAIL")
sys.exit(1 if fail else 0)
