#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
out_{주제}.html (ITEM 구분자) + 사진링크용.csv → 미리보기 HTML.
각 자료를 핑크 헤더(기록 대/소 구분 태그 + 메타데이터) + 흰 박스(renderedBodyHtml)로 감싸 세로 나열.
사용: python3 preview.py out_heritage.html [out_xxx.html ...]
출력: 같은 폴더에 preview_{stem}.html
"""
import csv, re, sys, os

BASE = "/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/통일부/본문 데이터 HTML"
CSV = os.path.join(BASE, "사진링크용.csv")
CLEAN = os.path.join(BASE, "clean")
PHOTO_BASE = "https://res.nolgong.com/dmz-archive/"

def norm(s):
    # 공백 + 구분자(/ · ・ | , ) 제거 — 백도가 슬래시 타이틀을 가운뎃점 등으로 변형해도 매칭
    return re.sub(r"[\s/·・|,]", "", (s or "")).strip()

# CSV 로드: 타이틀(normalize) → {기록대, 기록소, 메타, 사진들}
def load_csv():
    rows = {}
    with open(CSV, encoding="utf-8") as f:
        r = csv.reader(f)
        all_rows = list(r)
    # 헤더 2줄 (라인1 주석, 라인2 컬럼명). 컬럼: 주제0 스토리1 기록대2 기록소3 타이틀4 메타5 본문6 사진7 정답8 출처9 순서10 비고11 타입12
    for row in all_rows[2:]:
        if len(row) < 8 or not row[4].strip():
            continue
        title = norm(row[4])
        photos = [p.strip() for p in re.split(r"[,\n]", row[7]) if p.strip()]
        rows[title] = {
            "rec_big": row[2].strip(), "rec_small": row[3].strip(),
            "meta": row[5].strip(), "photos": photos, "subject": row[0].strip(),
        }
    return rows

def parse_items(path):
    txt = open(path, encoding="utf-8").read()
    items = []
    for m in re.finditer(r"<!--ITEM\|(.*?)\|(.*?)\|(.*?)-->(.*?)<!--/ITEM-->", txt, re.S):
        items.append({"story": m.group(1).strip(), "title": m.group(2).strip(),
                      "type": m.group(3).strip(), "html": m.group(4).strip()})
    return items

HEAD = """<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>미리보기 — {title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet">
<style>
@font-face {{ font-family:'Paperlogy'; src:url('../../../../../_dev/dmz-layout/assets/fonts/Paperlogy-4Regular.ttf') format('truetype'); font-weight:400; font-display:swap; }}
@font-face {{ font-family:'Paperlogy'; src:url('../../../../../_dev/dmz-layout/assets/fonts/Paperlogy-7Bold.ttf') format('truetype'); font-weight:600; font-display:swap; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
:root {{ --cat-color:#FF6EC7; --c-cyan:#3FE0DC; --c-navy:#1a2b4a; --c-gray-text:#6E6E6E; --c-white:#FFF; --c-bg:#E7E7E7; }}
body {{ font-family:'Paperlogy',-apple-system,'Apple SD Gothic Neo',sans-serif; background:var(--c-bg); color:var(--c-navy); font-weight:400; padding:1.5rem 1rem 4rem; }}
.preview-label {{ max-width:500px; margin:0 auto 0.4rem; font-size:0.8rem; color:#999; }}
.stage {{ max-width:500px; width:100%; margin:0 auto 2.5rem; }}
.detail-topic-card {{ background:var(--cat-color); border-radius:14px; padding:1.2rem 1rem; display:flex; flex-direction:column; color:var(--c-white); }}
.detail-modal-header {{ padding:0 0.2rem 1rem; }}
.modal-tags {{ display:flex; align-items:center; justify-content:space-between; margin-bottom:0.7rem; }}
.modal-tags .tags-left {{ display:flex; gap:0.4rem; }}
.modal-tag {{ background:var(--c-white); color:var(--cat-color); font-size:0.72rem; font-weight:600; padding:0.25rem 0.7rem; border-radius:999px; }}
.modal-close-x {{ background:transparent; border:none; color:var(--c-white); font-size:1.4rem; line-height:1; }}
.detail-modal-hint {{ font-size:0.85rem; opacity:0.97; line-height:1.6; white-space:pre-line; }}
.detail-body-wrap {{ background:var(--c-white); border-radius:14px; padding:1.4rem 1.2rem; color:var(--c-navy); }}
.handwriting {{ font-family:'Nanum Pen Script',cursive; }}
.typewriter {{ font-family:'Courier New',monospace; }}
</style></head><body>
"""

CARD = """<div class="preview-label">[{type}] {story} / {title}{warn}</div>
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

def build(path):
    csv_rows = load_csv()
    items = parse_items(path)
    cards = []
    miss = []
    for it in items:
        meta = csv_rows.get(norm(it["title"]))
        warn = ""
        if not meta:
            warn = "  ⚠ CSV 매칭 실패"
            miss.append(it["title"])
            tags, metatext, photos = "", "(메타 없음)", []
        else:
            tag_parts = [meta["rec_big"], meta["rec_small"]]
            tags = "".join(f'<span class="modal-tag">{t}</span>' for t in tag_parts if t)
            metatext = meta["meta"]
            photos = meta["photos"]
        body = it["html"]
        # {{PHOTO_URL}} 치환 (등장 순서대로 photos 매핑)
        idx = [0]
        def repl(m):
            i = idx[0]; idx[0] += 1
            return PHOTO_BASE + photos[i] if i < len(photos) else PHOTO_BASE + "MISSING.jpg"
        body = re.sub(r"\{\{PHOTO_URL(?:_\d+)?\}\}", repl, body)
        cards.append(CARD.format(type=it["type"], story=it["story"], title=it["title"],
                                 warn=warn, tags=tags, meta=metatext, body=body))
    stem = os.path.splitext(os.path.basename(path))[0]
    out = os.path.join(CLEAN, f"preview_{stem}.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(HEAD.format(title=stem) + "\n".join(cards) + "\n</body></html>")
    print(f"{path}: {len(items)}건 → {out}  (매칭실패 {len(miss)}건: {miss})")

if __name__ == "__main__":
    args = sys.argv[1:] or ["out_heritage.html"]
    for a in args:
        p = a if os.path.isabs(a) else os.path.join(CLEAN, a)
        build(p)
