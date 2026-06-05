#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
5개 out_{주제}.html (ITEM 구분자) → 마스터 CSV 본문 컬럼 채움.
사진 {{PHOTO_URL}}은 CSV 사진 컬럼으로 치환해서 최종 본문에 넣는다.
매칭: norm(주제)+norm(스토리)+norm(타이틀). 주제는 out 파일별 고정.
출력: 사진링크용_본문채움.csv (원본 보존, 새 파일).
사용: python3 merge.py
"""
import csv, re, os

BASE = "/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/통일부/본문 데이터 HTML"
# 버전/모드 변수화 (선문후코):
#  한글: 기본값 그대로 (python3 merge.py)
#  영문: DMZ_VERSION=EN DMZ_OUT_SUFFIX=_en python3 merge.py
#        → out_{주제}_en.html 읽어 사진링크용_본문채움_EN.csv 산출. 매칭키(주제+타이틀)는 한글 그대로.
VERSION = os.environ.get("DMZ_VERSION", "260529")      # 입력 데이터 버전. SPEC §입력과 동기
OUT_SUFFIX = os.environ.get("DMZ_OUT_SUFFIX", "")        # out 파일 접미어(영문='_en')
CSV_IN = os.path.join(BASE, "사진링크용.csv")                       # 마스터(타이틀·사진·순서 source of truth)
CSV_OUT = os.path.join(BASE, f"사진링크용_본문채움_{VERSION}.csv")  # 버전 suffix로 이전본 보존
CLEAN = os.path.join(BASE, "clean")
PHOTO_BASE = "https://res.nolgong.com/dmz-archive/"

# out 파일 base → 주제명 (CSV 주제 컬럼과 매칭). 실제 파일 = out_{base}{OUT_SUFFIX}.html
FILES = {
    f"out_basic{OUT_SUFFIX}.html": "DMZ 기본정보",
    f"out_ecology{OUT_SUFFIX}.html": "생태/환경",
    f"out_heritage{OUT_SUFFIX}.html": "국가유산/문화재",
    f"out_people{OUT_SUFFIX}.html": "DMZ의 사람들",
    f"out_tourism{OUT_SUFFIX}.html": "평화 관광",
}

def norm(s):
    # 공백 + 구분자(/ · ・ | , ) 제거 — 백도가 슬래시 타이틀을 가운뎃점 등으로 변형해도 매칭
    return re.sub(r"[\s/·・|,]", "", (s or "")).strip()

def parse_items(path, subject):
    # 매칭 키 = (주제, 타이틀). 스토리는 백도가 MD에서 읽은 값이 CSV와 달라서 제외.
    txt = open(path, encoding="utf-8").read()
    out = {}
    dup = []
    for m in re.finditer(r"<!--ITEM\|(.*?)\|(.*?)\|(.*?)-->(.*?)<!--/ITEM-->", txt, re.S):
        story, title, typ, html = (g.strip() for g in m.groups())
        k = (norm(subject), norm(title))
        if k in out:
            dup.append((subject, title))
        out[k] = html
    if dup:
        print(f"  ⚠ {os.path.basename(path)} 주제+타이틀 중복 {len(dup)}건: {dup}")
    return out

def main():
    items = {}
    counts = {}
    for fn, subj in FILES.items():
        p = os.path.join(CLEAN, fn)
        if not os.path.exists(p):
            print(f"  ⚠ 없음: {fn}")
            continue
        d = parse_items(p, subj)
        counts[subj] = len(d)
        items.update(d)
    print(f"수집한 ITEM: {sum(counts.values())}건  {counts}")

    with open(CSV_IN, encoding="utf-8") as f:
        rows = list(csv.reader(f))

    filled, missing = 0, []
    for row in rows[2:]:
        if len(row) < 8 or not row[4].strip():
            continue
        key = (norm(row[0]), norm(row[4]))
        html = items.get(key)
        if html is None:
            missing.append((row[0], row[1], row[4]))
            continue
        # 사진 URL 치환
        photos = [x.strip() for x in re.split(r"[,\n]", row[7]) if x.strip()]
        idx = [0]
        def repl(m):
            i = idx[0]; idx[0] += 1
            return PHOTO_BASE + (photos[i] if i < len(photos) else "MISSING.jpg")
        row[6] = re.sub(r"\{\{PHOTO_URL(?:_\d+)?\}\}", repl, html)
        filled += 1

    with open(CSV_OUT, "w", encoding="utf-8", newline="") as f:
        csv.writer(f).writerows(rows)

    print(f"본문 채움: {filled}건 → {CSV_OUT}")
    if missing:
        print(f"⚠ 매칭 실패 {len(missing)}건:")
        for s, st, t in missing:
            print(f"   {s} / {st} / {t}")
    # out에는 있으나 CSV 자리를 못 찾은 ITEM (역방향 점검)
    used = set()
    for row in rows[2:]:
        if len(row) >= 8 and row[4].strip():
            used.add((norm(row[0]), norm(row[4])))
    orphan = [k for k in items if k not in used]
    if orphan:
        print(f"⚠ CSV 자리 없는 ITEM {len(orphan)}건: {orphan}")

if __name__ == "__main__":
    main()
