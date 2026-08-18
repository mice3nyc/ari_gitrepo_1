#!/usr/bin/env python3
"""AI 리터러시 동현공 전달 패키지 — 폴더 구성 + UTF-8 플래그 zip.

macOS `zip`은 비ASCII 경로에 UTF-8 플래그(0x800)를 안 달아 윈도우에서 한글이 깨진다.
파이썬 zipfile은 비ASCII 이름에 자동으로 플래그를 단다 (8/8 사고 재발 방지).
"""
import shutil, zipfile, sys
from pathlib import Path

ROOT = Path("/Users/p.air15/Neo-Obsi-Sync/_dev/ai-literacy-delegation-boundary")
OUT = Path.home() / "Downloads" / "AI리터러시_동현공전달_260818_r42"

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True)

shutil.copytree(ROOT / "v13-mid" / "builds" / "mid", OUT / "mid")
shutil.copytree(ROOT / "v13-elem" / "builds" / "elem", OUT / "elem")
shutil.copy2(ROOT / "v13-mid" / "HANDOFF-deploy.md", OUT / "HANDOFF-deploy.md")
shutil.copy2(ROOT / "v13-mid" / "수집항목-설명.md", OUT / "수집항목-설명.md")

# .DS_Store 등 잡파일 제거
removed = 0
for junk in list(OUT.rglob(".DS_Store")) + list(OUT.rglob("._*")):
    junk.unlink()
    removed += 1

zip_path = OUT.with_suffix(".zip")
if zip_path.exists():
    zip_path.unlink()

files = sorted(p for p in OUT.rglob("*") if p.is_file())
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in files:
        z.write(p, arcname=str(Path(OUT.name) / p.relative_to(OUT)))

# 검증 — 비ASCII 경로 전부에 UTF-8 플래그가 붙었는가
with zipfile.ZipFile(zip_path) as z:
    infos = z.infolist()
    nonascii = [i for i in infos if any(ord(c) > 127 for c in i.filename)]
    unflagged = [i.filename for i in nonascii if not (i.flag_bits & 0x800)]
    bad = z.testzip()

print(f"폴더: {OUT}")
print(f"zip : {zip_path} ({zip_path.stat().st_size:,} bytes)")
print(f"엔트리 {len(infos)}개 · 비ASCII 경로 {len(nonascii)}개 · UTF-8 플래그 누락 {len(unflagged)}개")
print(f"잡파일 제거 {removed}개 · CRC 검사 {'OK' if bad is None else '손상: ' + bad}")
if unflagged or bad is not None:
    print("FAIL")
    sys.exit(1)
print("PASS")
