#!/usr/bin/env python3
"""todoy 옵시디언 미러 노트 <-> data/YYYY-MM-DD.json 양방향 동기 (3-way merge).

- 미러 노트: <vault>/_init/todoy — 오늘 할 일.md 의 "### YYYY-MM-DD" 섹션
- 각 체크박스 줄 끝에 안 보이는 id: `- [ ] 텍스트 <!-- t:iXXXX -->`
- 3-way base: data/.sync-base-YYYY-MM-DD.json (지난 sync 스냅샷 {id:{text,done}})
- 규칙: 추가·삭제·완료토글을 base 대비로 판정해 병합. done 충돌 시 노트(폰) 우선.
        json 고유 필드(active/switches/seconds/active_since/carried)는 병합 중 보존.

사용: sync.py            (오늘 날짜 동기)
      sync.py --dry      (변경 미리보기, 파일 안 씀)
종료코드: 변경 있으면 0 + "changed" 출력, 없으면 0 + "nochange".
"""
import json
import os
import random
import re
import sys
from datetime import date

DIR = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(DIR, "data")
VAULT = os.path.abspath(os.path.join(DIR, "..", ".."))
NOTE = os.path.join(VAULT, "_init", "todoy — 오늘 할 일.md")

TODAY = date.today().isoformat()
JSON_FILE = os.path.join(DATA, "%s.json" % TODAY)
BASE_FILE = os.path.join(DATA, ".sync-base-%s.json" % TODAY)

DRY = "--dry" in sys.argv

# 체크박스 줄: "- [ ] 텍스트 <!-- t:i123 -->"  (id 선택)
CHECK_RE = re.compile(r"^\s*-\s*\[([ xX])\]\s*(.*?)\s*(?:<!--\s*t:(\S+?)\s*-->)?\s*$")
DATE_HEADER = "### %s" % TODAY


def load(path, default):
    if not os.path.exists(path):
        return default
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (ValueError, OSError):
        return default


def new_id(existing):
    while True:
        nid = "i%d" % random.randint(100000, 9999999)
        if nid not in existing:
            return nid


def parse_note(lines):
    """오늘 날짜 섹션의 체크박스 항목 목록과 섹션 라인 범위 반환.
    반환: (items, start_idx, end_idx)  — items=[{text,done,id}], 순서 보존.
    섹션 없으면 start_idx=end_idx=None."""
    start = None
    for i, ln in enumerate(lines):
        if ln.strip() == DATE_HEADER or ln.strip().startswith(DATE_HEADER + " "):
            start = i
            break
    if start is None:
        return [], None, None
    # 섹션 끝 = 다음 '### ' 헤더 또는 EOF
    end = len(lines)
    for i in range(start + 1, len(lines)):
        if lines[i].startswith("### "):
            end = i
            break
    items = []
    for ln in lines[start + 1:end]:
        m = CHECK_RE.match(ln)
        if not m:
            continue
        mark, text, tid = m.group(1), m.group(2).strip(), m.group(3)
        if not text:
            continue
        items.append({"text": text, "done": mark.lower() == "x", "id": tid})
    return items, start, end


def render_lines(result):
    """result(json 항목) -> 체크박스 라인 리스트 (미완료 먼저, 완료 뒤)."""
    out = []
    pending = [r for r in result if not r.get("done")]
    completed = [r for r in result if r.get("done")]
    for r in pending + completed:
        box = "x" if r.get("done") else " "
        out.append("- [%s] %s <!-- t:%s -->" % (box, r["text"], r["id"]))
    return out


def main():
    jitems_all = load(JSON_FILE, [])
    # dropped(오늘 안 하기로 뺀 것)는 이 병합에 «참여시키지 않는다».
    # 존재 판정이 "base 대비 한쪽에서 사라지면 삭제"라, 노트에 안 쓰기만 하면
    # 다음 sync가 「노트에서 사라짐」으로 읽어 json에서 지운다. 그래서 아예 분리해
    # 병합 밖에 두고 결과 끝에 원본 그대로 되붙인다. base 스냅샷에도 넣지 않는다.
    # SPEC §빼기 「조용히 증발하는 자리 둘」 참조.
    dropped_items = [j for j in jitems_all if j.get("dropped")]
    dropped_ids = {j["id"] for j in dropped_items}
    jitems = [j for j in jitems_all if not j.get("dropped")]
    base_list = load(BASE_FILE, None)
    first_run = base_list is None
    base = {b["id"]: b for b in (base_list or [])}
    jmap = {j["id"]: j for j in jitems}

    if not os.path.exists(NOTE):
        print("no note: %s" % NOTE)
        return 1
    with open(NOTE, encoding="utf-8") as f:
        raw = f.read()
    lines = raw.split("\n")
    note_items, sec_start, sec_end = parse_note(lines)

    all_ids = set(jmap) | {n["id"] for n in note_items if n["id"]} | set(base)
    result = []
    used = set()

    # 1) 노트 항목 순서대로
    for n in note_items:
        nid = n["id"]
        if nid and nid in dropped_ids:
            # 뺀 항목이 노트에 남아 있으면 노트에서만 지운다(json은 위에서 보존).
            continue
        if nid and nid in jmap:
            j = jmap[nid]
            b = base.get(nid, {"text": j["text"], "done": j["done"]})
            note_done_changed = n["done"] != b["done"]
            json_done_changed = j["done"] != b["done"]
            if note_done_changed:
                done = n["done"]
            elif json_done_changed:
                done = j["done"]
            else:
                done = n["done"]
            newj = dict(j)
            newj["text"] = n["text"]  # 텍스트는 노트 우선
            newj["done"] = done
            if done and newj.get("active"):
                # 완료로 넘어가면 active 정산 없이 해제 (v1: 시간 정산은 done 명령이 담당)
                newj["active"] = False
                newj["active_since"] = None
            result.append(newj)
            used.add(nid)
        elif nid and nid in base and nid not in jmap:
            # base엔 있었으나 json에서 사라짐 = 다른 곳에서 삭제됨 -> 노트에서도 제거
            continue
        else:
            # id 없음 -> 먼저 텍스트로 미사용 json 매칭(부트스트랩: 첫 sync에 같은 텍스트끼리 id 연결)
            match = None
            for j in jitems:
                if j["id"] not in used and j["text"] == n["text"]:
                    match = j
                    break
            if match:
                newj = dict(match)
                newj["done"] = n["done"]  # 텍스트 동일 -> done은 노트 우선
                if newj["done"] and newj.get("active"):
                    newj["active"] = False
                    newj["active_since"] = None
                result.append(newj)
                used.add(match["id"])
            else:
                # 진짜 신규(폰에서 추가) 또는 미아 id
                gid = new_id(all_ids)
                all_ids.add(gid)
                result.append({
                    "id": gid, "text": n["text"], "done": n["done"],
                    "active": False, "switches": 0, "seconds": 0,
                    "active_since": None, "carried": False,
                })
                used.add(gid)

    # 2) json에 있으나 노트에 없던 항목
    for j in jitems:
        if j["id"] in used:
            continue
        if j["id"] in base:
            # base에 있었고 노트에서 사라짐 = 노트에서 삭제 -> 제거
            continue
        else:
            # base에 없음 = 메뉴바에서 새로 추가 -> 유지(노트에 반영)
            result.append(dict(j))

    # ---- 변경 여부 판정 ----
    # 노트에는 병합 결과만, json에는 «병합 결과 + 뺀 항목»을 쓴다.
    merged = result
    result = merged + dropped_items
    json_changed = result != jitems_all
    new_note_lines = render_lines(merged)
    if sec_start is None:
        # 섹션 없으면 파일 끝에 생성
        old_block = []
        rebuilt = lines + ["", DATE_HEADER, ""] + new_note_lines
    else:
        old_block = [ln for ln in lines[sec_start + 1:sec_end]
                     if CHECK_RE.match(ln) and CHECK_RE.match(ln).group(2).strip()]
        # 섹션 안의 비-체크박스 라인(빈 줄 등)은 헤더 바로 뒤 한 줄만 유지
        rebuilt = lines[:sec_start + 1] + [""] + new_note_lines + [""] + lines[sec_end:]
    note_changed = old_block != new_note_lines or sec_start is None

    if DRY:
        print("DRY first_run=%s json_changed=%s note_changed=%s" %
              (first_run, json_changed, note_changed))
        print("--- merged json ---")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        print("--- note block ---")
        print("\n".join(new_note_lines))
        return 0

    # ---- 쓰기 ----
    if json_changed:
        tmp = JSON_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        os.replace(tmp, JSON_FILE)
    if note_changed:
        out = "\n".join(rebuilt)
        tmp = NOTE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(out)
        os.replace(tmp, NOTE)
    # base 스냅샷 갱신
    snap = [{"id": r["id"], "text": r["text"], "done": r.get("done", False)} for r in merged]
    with open(BASE_FILE, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False)

    print("changed" if (json_changed or note_changed) else "nochange")
    return 0


if __name__ == "__main__":
    sys.exit(main())
