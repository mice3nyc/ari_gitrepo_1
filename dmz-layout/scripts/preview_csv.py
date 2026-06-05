#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
사진링크용_본문채움.csv 의 본문 컬럼(최종 renderedBodyHtml, 사진 URL 치환됨)을
핑크 헤더(기록 대/소 구분 태그 + 메타데이터) + 흰 박스로 감싸 통합 미리보기 생성.
이게 최종 산출물 그대로의 검수.
출력: clean/preview_all.html (주제별 구분 헤더 + 92 카드)
"""
import csv, os

BASE = "/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/통일부/본문 데이터 HTML"
VERSION = os.environ.get("DMZ_VERSION", "260529")  # merge.py와 동기화 (영문=EN)
CSV_OUT = os.path.join(BASE, f"사진링크용_본문채움_{VERSION}.csv")
CLEAN = os.path.join(BASE, "clean")
PREVIEW_NAME = "preview_all.html" if VERSION == "260529" else f"preview_{VERSION}.html"

HEAD = """<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>미리보기 — DMZ 자료 92건</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet">
<style>
@font-face { font-family:'Paperlogy'; src:url('../../../../../_dev/dmz-layout/assets/fonts/Paperlogy-4Regular.ttf') format('truetype'); font-weight:400; font-display:swap; }
@font-face { font-family:'Paperlogy'; src:url('../../../../../_dev/dmz-layout/assets/fonts/Paperlogy-7Bold.ttf') format('truetype'); font-weight:600; font-display:swap; }
* { margin:0; padding:0; box-sizing:border-box; }
:root { --cat-color:#FF6EC7; --c-cyan:#3FE0DC; --c-navy:#1a2b4a; --c-gray-text:#6E6E6E; --c-white:#FFF; --c-bg:#E7E7E7; }
body { font-family:'Paperlogy',-apple-system,'Apple SD Gothic Neo',sans-serif; background:var(--c-bg); color:var(--c-navy); font-weight:400; padding:1.5rem 1rem 4rem; }
.subject-head { max-width:500px; margin:2.5rem auto 1rem; padding:0.6rem 1rem; background:var(--c-navy); color:var(--c-white); border-radius:8px; font-weight:600; font-size:1.05rem; }
.preview-label { max-width:500px; margin:0 auto 0.4rem; font-size:0.8rem; color:#999; }
.stage { max-width:500px; width:100%; margin:0 auto 2.5rem; }
.detail-topic-card { background:var(--cat-color); border-radius:14px; padding:1.2rem 1rem; display:flex; flex-direction:column; color:var(--c-white); }
.detail-modal-header { padding:0 0.2rem 1rem; }
.modal-tags { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.7rem; }
.modal-tags .tags-left { display:flex; gap:0.4rem; }
.modal-tag { background:var(--c-white); color:var(--cat-color); font-size:0.72rem; font-weight:600; padding:0.25rem 0.7rem; border-radius:999px; }
.modal-close-x { background:transparent; border:none; color:var(--c-white); font-size:1.4rem; line-height:1; }
.detail-modal-hint { font-size:0.85rem; opacity:0.97; line-height:1.6; white-space:pre-line; }
.detail-body-wrap { background:var(--c-white); border-radius:14px; padding:1.4rem 1.2rem; color:var(--c-navy); }
.handwriting { font-family:'Nanum Pen Script',cursive; }
.typewriter { font-family:'Courier New',monospace; }
</style></head><body>
"""

CARD = """<div class="preview-label">[{typ}] {story} / {title}</div>
<div class="stage"><div class="detail-topic-card">
  <div class="detail-modal-header">
    <div class="modal-tags"><div class="tags-left">{tags}</div>
      <button class="modal-close-x">&times;</button></div>
    <div class="detail-modal-hint">{meta}</div>
  </div>
  <div class="detail-body-wrap">
{body}
  </div>
</div></div>
"""

def main():
    with open(CSV_OUT, encoding="utf-8") as f:
        rows = list(csv.reader(f))
    parts, cur_subj, n = [HEAD], None, 0
    for row in rows[2:]:
        if len(row) < 8 or not row[4].strip() or not row[6].strip():
            continue
        subj, story, rec_big, rec_small, title, meta, body, typ = (
            row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[12] if len(row) > 12 else "")
        if subj != cur_subj:
            cur_subj = subj
            parts.append(f'<div class="subject-head">{subj}</div>')
        tags = "".join(f'<span class="modal-tag">{t}</span>' for t in (rec_big, rec_small) if t.strip())
        parts.append(CARD.format(typ=typ.strip(), story=story, title=title, tags=tags, meta=meta, body=body))
        n += 1
    parts.append("</body></html>")
    out = os.path.join(CLEAN, PREVIEW_NAME)
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(parts))
    print(f"{n}건 → {out}")

if __name__ == "__main__":
    main()
