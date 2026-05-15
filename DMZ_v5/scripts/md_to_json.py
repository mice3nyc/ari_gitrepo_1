#!/usr/bin/env python3
"""DMZ v5 — Markdown → JSON 파서 v0.1 (Phase 1 파일럿)

data/sources/cat*/s*/ 구조의 마크다운 자료를 읽어 기존 yaml templateData 호환 JSON으로 출력한다.

사용:
  python3 scripts/md_to_json.py                  # JSON to stdout
  python3 scripts/md_to_json.py --validate       # 검증만, JSON 출력 없음
  python3 scripts/md_to_json.py --story s0202    # 단일 스토리만

Phase 1 범위: s0202만 처리. 나머지 35 스토리는 기존 yaml 경로 유지(빌드 스크립트에서 합침).

스키마: SPEC-data-v2.md §1~§10 참조.
"""
import argparse
import json
import re
import sys
from pathlib import Path

import frontmatter
import markdown

CATEGORY_TO_SLOT = {
    "개인서사자료": "A",
    "공식기록자료": "B",
    "시각매체자료": "C",
    "구술증언자료": "D",
}

ALLOWED_SUBTYPES = {
    "A": {"diary", "letter", "blog", "homework", "twitter"},
    "B": {"newspaper", "scholar", "report", "poster"},
    "C": {"photo"},
    "D": {"oral", "kakao", "text", "qna"},
}

# 표시 텍스트 본문화 패턴 (SPEC v2 §17, 5/15 피터공 결정)
# 본문 통째 markdown → HTML. frontmatter 표시 메타 폐기.
TEXT_SUBTYPES = {"diary", "newspaper", "scholar", "blog", "poster", "report", "homework", "letter", "twitter"}

H1_RE = re.compile(r"^#\s+(.+)$", re.MULTILINE)


def md_block_to_html(body: str) -> str:
    """본문 통째 markdown → HTML. 빈칸 마커 {{X}}는 그대로 보존."""
    return markdown.markdown(body.strip(), extensions=["extra"])


def extract_h1(body: str) -> str:
    """본문 첫 H1 추출 (title 폴백용)."""
    m = H1_RE.search(body.strip())
    return m.group(1).strip() if m else ""


def md_inline(text: str) -> str:
    """단일 문단 마크다운을 인라인 HTML로 변환 (외곽 <p> 제거)."""
    html = markdown.markdown(text.strip(), extensions=["extra"])
    if html.startswith("<p>") and html.endswith("</p>"):
        html = html[3:-4]
    return html


def split_paragraphs(body: str) -> list:
    """\\n\\n으로 단락 분리. 각 단락은 인라인 HTML로 변환."""
    chunks = [c.strip() for c in re.split(r"\n\s*\n", body.strip()) if c.strip()]
    return [md_inline(c) for c in chunks]


# ---- 사진/이미지 파서 ----
IMG_RE = re.compile(r'!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)')


def parse_photos(body: str) -> tuple:
    """본문에서 모든 ![](){} 추출. (photos[], 잔여 본문) 반환.

    photos[i] = {src, alt, caption, credit}
    caption은 직후 단락(이미지 다음에 따라오는 텍스트 단락 1개).
    credit은 이미지 title 속성.
    """
    photos = []
    # 본문을 블록으로 분리하여 이미지 + 캡션 단락 짝짓기
    blocks = [b.strip() for b in re.split(r"\n\s*\n", body.strip()) if b.strip()]
    remaining_blocks = []
    pending_image = None
    for blk in blocks:
        m = IMG_RE.match(blk)
        if m and len(blk) == len(m.group(0)):
            # 단독 이미지 블록 — 다음 단락이 캡션
            if pending_image:
                # 이전 이미지의 캡션 없음 — alt를 caption으로 폴백
                photos.append({
                    "src": pending_image["src"],
                    "alt": pending_image["alt"],
                    "caption": pending_image["alt"],
                    "credit": pending_image["credit"],
                })
            pending_image = {
                "alt": m.group(1),
                "src": m.group(2),
                "credit": m.group(3) or "",
            }
        else:
            if pending_image:
                # 이 블록이 직전 이미지의 캡션
                photos.append({
                    "src": pending_image["src"],
                    "alt": pending_image["alt"],
                    "caption": md_inline(blk),
                    "credit": pending_image["credit"],
                })
                pending_image = None
            else:
                remaining_blocks.append(blk)
    if pending_image:
        photos.append({
            "src": pending_image["src"],
            "alt": pending_image["alt"],
            "caption": pending_image["alt"],
            "credit": pending_image["credit"],
        })
    return photos, "\n\n".join(remaining_blocks)


# ---- 블록쿼트 파서 (oral, kakao) ----
BLOCKQUOTE_LINE_RE = re.compile(r"^>\s?(.*)$", re.MULTILINE)


def parse_blockquotes(body: str) -> list:
    """본문에서 연속된 `> ...` 블록을 하나씩 추출. 각 블록은 단일 인용."""
    quotes = []
    current = []
    for line in body.split("\n"):
        m = BLOCKQUOTE_LINE_RE.match(line)
        if m:
            current.append(m.group(1))
        else:
            if current and any(c.strip() for c in current):
                joined = " ".join(c.strip() for c in current if c.strip())
                quotes.append(md_inline(joined))
            current = []
    if current and any(c.strip() for c in current):
        joined = " ".join(c.strip() for c in current if c.strip())
        quotes.append(md_inline(joined))
    return quotes


KAKAO_LINE_RE = re.compile(
    r"^\*\*([^*]+)\*\*\s*(?:\[(left|right)\])?\s*:\s*(.+)$"
)


def parse_kakao(body: str) -> list:
    """블록쿼트 패턴 `> **이름** [left|right]: 메시지` → messages[]."""
    messages = []
    for line in body.split("\n"):
        m = BLOCKQUOTE_LINE_RE.match(line)
        if not m:
            continue
        inner = m.group(1).strip()
        if not inner:
            continue
        km = KAKAO_LINE_RE.match(inner)
        if km:
            messages.append({
                "name": km.group(1).strip(),
                "align": km.group(2) or "left",
                "text": md_inline(km.group(3).strip()),
            })
    return messages


# ---- 서브타입별 templateData 빌드 ----

def build_template_data(subtype: str, fm_meta: dict, body: str, errors: list, ctx: str):
    """frontmatter meta + body → templateData (기존 yaml 스키마 호환)."""
    m = fm_meta or {}

    # SPEC v2 §17 — 텍스트 subtype 9종 본문화 패턴
    if subtype in TEXT_SUBTYPES:
        return {"html": md_block_to_html(body)}

    if subtype == "diary":
        meta_str = " · ".join(filter(None, [m.get("date"), m.get("credit")]))
        return {"meta": meta_str, "paragraphs": split_paragraphs(body)}

    if subtype == "letter":
        meta_str = " · ".join(filter(None, [m.get("date"), m.get("credit")]))
        out = {"heading": m.get("heading", ""), "meta": meta_str, "paragraphs": split_paragraphs(body)}
        if m.get("sign"):
            out["sign"] = m["sign"]
        if m.get("soundNote"):
            out["soundNote"] = m["soundNote"]
        return out

    if subtype == "scholar":
        if not m.get("source"):
            errors.append(f"{ctx} scholar 필수 필드 누락: meta.source (피터공 결정 #7)")
        return {
            "heading": m.get("heading", m.get("author", "")),
            "meta": " · ".join(filter(None, [m.get("author"), m.get("source"), m.get("credit")])),
            "paragraphs": split_paragraphs(body),
        }

    if subtype == "newspaper":
        return {
            "paperName": m.get("paperName", ""),
            "date": m.get("date", ""),
            "headline": m.get("headline", ""),
            "paragraphs": split_paragraphs(body),
        }

    if subtype == "photo":
        photos, _ = parse_photos(body)
        return {"photos": photos}

    if subtype == "oral":
        meta_parts = []
        if m.get("speaker"):
            meta_parts.append(f"구술자: {m['speaker']}")
        if m.get("date"):
            meta_parts.append(f"채록 일시: {m['date']}")
        meta_str = " · ".join(meta_parts)
        if m.get("credit"):
            meta_str = meta_str + ("<br>" if meta_str else "") + f"출처: {m['credit']}"
        out = {"meta": meta_str, "quotes": parse_blockquotes(body)}
        if m.get("soundNote"):
            out["soundNote"] = m["soundNote"]
        return out

    if subtype == "kakao":
        return {"messages": parse_kakao(body)}

    if subtype == "blog":
        return {
            "title": m.get("title", ""),
            "meta": " · ".join(filter(None, [m.get("author"), m.get("date"), m.get("credit")])),
            "paragraphs": split_paragraphs(body),
        }

    if subtype == "homework":
        meta_parts = list(filter(None, [m.get("author"), m.get("school"), m.get("grade")]))
        return {
            "title": m.get("title", ""),
            "meta": " · ".join(meta_parts),
            "paragraphs": split_paragraphs(body),
        }

    if subtype == "twitter":
        out = {"handle": m.get("handle", ""), "date": m.get("date", ""), "paragraphs": split_paragraphs(body)}
        if m.get("bio"):
            out["bio"] = m["bio"]
        return out

    if subtype == "poster":
        return {
            "title": m.get("title", ""),
            "meta": " · ".join(filter(None, [m.get("issuer"), m.get("date"), m.get("credit")])),
            "paragraphs": split_paragraphs(body),
        }

    if subtype == "report":
        if not m.get("issuer"):
            errors.append(f"{ctx} report 필수 필드 누락: meta.issuer (피터공 결정 #7)")
        return {
            "header": m.get("issuer", ""),
            "paragraphs": split_paragraphs(body),
        }

    if subtype == "text":
        # 본문이 `> [sent] 메시지` / `> [received] 메시지` 또는 `> 메시지` 패턴.
        messages = []
        for line in body.split("\n"):
            mm = BLOCKQUOTE_LINE_RE.match(line)
            if not mm or not mm.group(1).strip():
                continue
            inner = mm.group(1).strip()
            sent = inner.startswith("[sent]")
            if sent or inner.startswith("[received]"):
                inner = inner.split("]", 1)[1].strip()
            messages.append({"text": md_inline(inner), "sent": sent})
        return {"messages": messages}

    if subtype == "qna":
        # 본문 패턴: `**Q.**` 단락 + `**A.**` 단락
        parts = re.split(r"\n\s*\n", body.strip())
        question, answer = [], []
        mode = None
        for p in parts:
            if p.startswith("**Q."):
                mode = "q"
                p = p.replace("**Q.**", "", 1).strip()
                if p:
                    question.append(md_inline(p))
            elif p.startswith("**A."):
                mode = "a"
                p = p.replace("**A.**", "", 1).strip()
                if p:
                    answer.append(md_inline(p))
            else:
                if mode == "q":
                    question.append(md_inline(p))
                elif mode == "a":
                    answer.append(md_inline(p))
        return {"question": question, "answer": answer}

    errors.append(f"{ctx} 알 수 없는 subtype: {subtype}")
    return {"paragraphs": split_paragraphs(body)}


# ---- 슬롯 자료 파일 → source dict ----

def parse_source_md(path: Path, errors: list) -> dict:
    fm = frontmatter.load(str(path))
    ctx = f"{path}"

    slot = fm.get("slot")
    category = fm.get("category")
    subtype = fm.get("subtype")
    title = fm.get("title")

    if slot not in {"A", "B", "C", "D"}:
        errors.append(f"{ctx} slot 잘못됨: {slot}")
    if category not in CATEGORY_TO_SLOT:
        errors.append(f"{ctx} category 잘못됨: {category}")
    elif CATEGORY_TO_SLOT[category] != slot:
        errors.append(f"{ctx} slot/category 불일치: slot={slot} category={category}")
    if slot in ALLOWED_SUBTYPES and subtype not in ALLOWED_SUBTYPES[slot]:
        errors.append(f"{ctx} subtype {subtype}이 slot {slot}에 허용 안 됨")

    template_data = build_template_data(subtype, fm.get("meta"), fm.content, errors, ctx)

    # SPEC v2 §17 — 텍스트 subtype은 title을 본문 첫 H1에서 폴백 추출
    if subtype in TEXT_SUBTYPES and not title:
        title = extract_h1(fm.content)

    return {
        "id": slot,
        "type": subtype,
        "icon": fm.get("icon", ""),
        "title": title or "",
        "sub": fm.get("sub", ""),
        "styleClass": f"source-{subtype}",
        "templateData": template_data,
    }


# ---- _meta.md → story dict ----

def parse_story_folder(folder: Path, errors: list) -> dict:
    meta_path = folder / "_meta.md"
    if not meta_path.exists():
        errors.append(f"{folder} _meta.md 없음")
        return None
    meta_fm = frontmatter.load(str(meta_path))

    sources = []
    for slot in ["A", "B", "C", "D"]:
        slot_files = list(folder.glob(f"{slot}-*.md"))
        if len(slot_files) != 1:
            errors.append(f"{folder} 슬롯 {slot} 파일 개수 이상: {len(slot_files)}")
            continue
        sources.append(parse_source_md(slot_files[0], errors))

    # blanks `from` → `source` 변환
    blanks_raw = meta_fm.get("blanks") or {}
    blanks = {}
    for key, val in blanks_raw.items():
        out = {"answer": val.get("answer", ""), "hint": val.get("hint", "")}
        if val.get("from"):
            out["source"] = val["from"]
        else:
            errors.append(f"{folder} blanks.{key}.from 누락")
        if val.get("altAnswers"):
            out["altAnswers"] = val["altAnswers"]
        blanks[key] = out

    return {
        "id": meta_fm.get("id"),
        "title": meta_fm.get("title"),
        "era": meta_fm.get("era"),
        "location": meta_fm.get("location"),
        "sources": sources,
        "blanks": blanks,
        "choices": meta_fm.get("choices") or [],
    }


# ---- 메인 ----

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--validate", action="store_true")
    ap.add_argument("--story", help="단일 스토리 id만 처리 (예: s0202)")
    ap.add_argument("--root", default="data/sources", help="자료 루트 폴더")
    args = ap.parse_args()

    root = Path(args.root)
    errors = []
    stories_by_cat = {}

    for topic_dir in sorted(root.glob("cat*-*")):
        cat_id = topic_dir.name.split("-", 1)[0]  # "cat02"
        for story_dir in sorted(topic_dir.glob("s*-*")):
            story_id = story_dir.name.split("-", 1)[0]  # "s0202"
            if args.story and story_id != args.story:
                continue
            story = parse_story_folder(story_dir, errors)
            if story:
                stories_by_cat.setdefault(cat_id, []).append(story)

    if errors:
        for e in errors:
            print(f"ERROR: {e}", file=sys.stderr)
        if args.validate:
            sys.exit(1)
        sys.exit(2)

    if args.validate:
        print(f"OK — {sum(len(v) for v in stories_by_cat.values())} 스토리 검증 통과", file=sys.stderr)
        return

    print(json.dumps(stories_by_cat, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
