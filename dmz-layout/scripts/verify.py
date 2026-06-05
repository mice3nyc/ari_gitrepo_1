#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
사진링크용_본문채움.csv 검증:
1. 행 순서 = 원본 사진링크용.csv와 동일한지 (타이틀 시퀀스)
2. (주제,타이틀) 중복 → 같은 본문 오매칭 위험
3. 빈 본문 (92개 다 찼는지)
4. 사진 수 정합 (사진 컬럼 파일수 == 본문 내 <img> 수)
5. 본문 첫 제목 추출 → 타이틀과 대조 (느슨, 엉뚱한 본문 탐지)
"""
import csv, re, os

BASE = "/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/통일부/본문 데이터 HTML"
VERSION = os.environ.get("DMZ_VERSION", "260529")  # merge.py와 동기화 (영문=EN)
ORIG = os.path.join(BASE, "사진링크용.csv")
FILLED = os.path.join(BASE, f"사진링크용_본문채움_{VERSION}.csv")

def norm(s):
    return re.sub(r"[\s/·・|,]", "", (s or "")).strip()

def load(path):
    with open(path, encoding="utf-8") as f:
        return list(csv.reader(f))

orig = load(ORIG)
filled = load(FILLED)

def titles(rows):
    return [(r[0].strip(), r[4].strip()) for r in rows[2:] if len(r) > 4 and r[4].strip()]

# 1. 행 순서
to, tf = titles(orig), titles(filled)
print(f"[1] 행 순서: 원본 {len(to)}행 / 채움 {len(tf)}행 — {'동일 ✅' if to == tf else '⚠ 다름!'}")
if to != tf:
    for i, (a, b) in enumerate(zip(to, tf)):
        if a != b:
            print(f"    행{i}: 원본 {a} ≠ 채움 {b}")

# 2~5
dup = {}
empty, photo_mismatch, title_mismatch = [], [], []
for r in filled[2:]:
    if len(r) < 13 or not r[4].strip():
        continue
    subj, story, title, meta, body, photo = r[0], r[1], r[4], r[5], r[6], r[7]
    key = (norm(subj), norm(title))
    dup.setdefault(key, []).append(title)
    if not body.strip():
        empty.append((subj, story, title))
        continue
    # 사진 수 정합
    photos = [x.strip() for x in re.split(r"[,\n]", photo) if x.strip()]
    imgs = len(re.findall(r"<img", body))
    if photos and imgs != len(photos):
        photo_mismatch.append((title, len(photos), imgs))
    # 본문 첫 제목 추출 (큰 글씨 div / **볼드** 등 첫 텍스트)
    m = re.search(r'font-size:1\.[4-9]rem[^>]*>([^<]+)<', body) or re.search(r'>([^<]{2,40})<', body)
    head = m.group(1).strip() if m else ""
    if head and norm(head) != norm(title) and norm(title) not in norm(body)[:200]:
        title_mismatch.append((title, head))

print(f"\n[2] (주제,타이틀) 중복: ", end="")
dups = {k: v for k, v in dup.items() if len(v) > 1}
print(f"⚠ {len(dups)}건 {[v for v in dups.values()]}" if dups else "없음 ✅")

print(f"\n[3] 빈 본문: {'⚠ ' + str(empty) if empty else '없음 (92건 다 채워짐) ✅'}")

print(f"\n[4] 사진 수 정합 (사진컬럼 파일수 vs 본문 img수): ", end="")
print(f"⚠ {len(photo_mismatch)}건" if photo_mismatch else "전건 일치 ✅")
for t, p, i in photo_mismatch:
    print(f"    {t}: 사진컬럼 {p}개 / 본문 img {i}개")

print(f"\n[5] 본문 제목 vs 타이틀 불일치 (느슨, 참고용 — 메시지/대화류는 정상일 수 있음): {len(title_mismatch)}건")
for t, h in title_mismatch:
    print(f"    타이틀 '{t}' ↔ 본문 첫 제목 '{h}'")
