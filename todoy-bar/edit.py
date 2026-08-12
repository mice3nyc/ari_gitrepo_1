#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""todoy-bar 편집 — 순수 로직 모듈 (load/build_saved/save + selftest).

창 UI는 edit_server.py(로컬 웹)가 담당. 이 파일은 그쪽에서 import해 재사용한다.
(1차 Tkinter GUI는 Apple Tk 8.5.9 렌더 버그로 폐기 — docs/SPEC.md "편집창" 참조.)
데이터: data/YYYY-MM-DD.json (todoy.sh와 동일 스키마).
"""
import json
import os
import random
import subprocess
import sys
import time
from datetime import date

DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(DIR, "data")
FILE = os.path.join(DATA_DIR, date.today().isoformat() + ".json")

DEFAULT_ITEM = {
    "done": False, "active": False, "switches": 0,
    "seconds": 0, "active_since": None, "carried": False,
}


def new_id():
    return "i%d%d" % (random.randint(0, 32767), random.randint(0, 32767))


def load():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(FILE):
        return []
    with open(FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def settle_done(item, now):
    """미완료→완료 전환 시 active면 시간 정산."""
    if not item.get("done") and item.get("active"):
        item["seconds"] = item.get("seconds", 0) + (now - (item.get("active_since") or now))
        item["active"] = False
        item["active_since"] = None


def build_saved(original, rows, new_texts):
    """rows = [(id, text, done_bool)], new_texts = [str]. original = 로드된 원본(필드 보존용)."""
    now = int(time.time())
    by_id = {it["id"]: it for it in original}
    out = []
    for iid, text, done in rows:
        text = text.strip()
        if not text:
            continue  # 빈 텍스트 줄은 삭제로 간주
        base = dict(by_id.get(iid, {}))
        if not base:
            base = {"id": iid, "text": text, **DEFAULT_ITEM}
        base["text"] = text
        if done and not base.get("done"):
            settle_done(base, now)
        base["done"] = done
        # 스키마 필드 보정
        for k, v in DEFAULT_ITEM.items():
            base.setdefault(k, v)
        out.append(base)
    for text in new_texts:
        text = text.strip()
        if not text:
            continue
        out.append({"id": new_id(), "text": text, **DEFAULT_ITEM})
    return out


def save(items):
    tmp = FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    os.replace(tmp, FILE)
    # SwiftBar 즉시 갱신 시도 (실패해도 5초 자동갱신이 커버)
    try:
        subprocess.run(
            ["/usr/bin/open", "-g", "swiftbar://refreshplugin?name=todoy-bar.5s.sh"],
            timeout=3, check=False,
        )
    except Exception:
        pass


def selftest():
    original = load()
    # 라운드트립: 로드한 걸 그대로 rows로 만들어 build → 개수 보존 확인
    rows = [(it["id"], it["text"], it.get("done", False)) for it in original]
    rebuilt = build_saved(original, rows, [])
    assert len(rebuilt) == len(original), "라운드트립 개수 불일치"
    # done 정산: active 항목을 done 처리 → active 해제 + seconds 정산
    sample = {"id": "iX", "text": "t", "done": False, "active": True,
              "switches": 1, "seconds": 10, "active_since": int(time.time()) - 5, "carried": False}
    r2 = build_saved([sample], [("iX", "t", True)], [])
    assert r2[0]["done"] is True and r2[0]["active"] is False and r2[0]["active_since"] is None
    assert r2[0]["seconds"] >= 15, "정산된 seconds 부족: %s" % r2[0]["seconds"]
    # 신규 추가 + 빈 텍스트 삭제
    r3 = build_saved([], [], ["새 할 일", "   "])
    assert len(r3) == 1 and r3[0]["text"] == "새 할 일"
    print("selftest OK — items=%d, roundtrip=%d" % (len(original), len(rebuilt)))


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        selftest()
    else:
        print("이 파일은 로직 모듈입니다. 창은 edit_server.py로 여세요. (--selftest 가능)")
