#!/usr/bin/env python3
"""
DMZ v4 환경 세팅 스크립트
1단계: photos 영문화 카피
2단계: HTML 카피
3단계: HTML src 패치
4단계: photos_manifest.csv 작성
"""

import shutil
import unicodedata
import re
import csv
from pathlib import Path

# ─── 경로 설정 ────────────────────────────────────────────────
BASE_IN  = Path("/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/통일부")
BASE_OUT = Path("/Users/p.air15/Neo-Obsi-Sync/_dev/DMZ_v4/shared")

SRC_PHOTOS = BASE_IN / "photos"
SRC_HTML   = BASE_IN / "dmz_game_jygong.html"

DST_PHOTOS = BASE_OUT / "photos"
DST_HTML   = BASE_OUT / "index_base.html"
DST_CSV    = BASE_OUT / "photos_manifest.csv"


def nfd(s):
    return unicodedata.normalize("NFD", s)

def nfc(s):
    return unicodedata.normalize("NFC", s)


# ─── 1단계 매핑 테이블 ─────────────────────────────────────────
# (원본파일명, 새파일명, category, source_caption, source_org, license, used_by_story)
MAPPING = [
    # cat01
    ("cat01", "1-2_MDL_표식물_1993_USAF.jpg",                   "1-2.jpg",   "MDL 표식물",             "USAF",         "PD",      "s0102"),
    ("cat01", "1-3_DMZ_위성사진_NASA.jpg",                       "1-3.jpg",   "DMZ 위성사진",            "NASA",         "PD",      "s0103"),
    ("cat01", "1-4_NNSC건물_JSA_2025_DVIDS9365309.jpg",          "1-4.jpg",   "NNSC건물 JSA",           "DVIDS",        "PD",      "s0104"),
    ("cat01", "1-5_JSA_ConferenceRow_2025_DVIDS8830815.jpg",      "1-5.jpg",   "JSA Conference Row",     "DVIDS",        "PD",      "s0105"),
    ("cat01", "1-6_벤하이강_히엔르엉다리_CCBYSA3.jpg",            "1-6.jpg",   "벤하이강 히엔르엉다리",   "Wikimedia",    "CCBYSA3", "s0106"),
    # cat02
    ("cat02", "2-1_철원항공사진_1956_CCBY.jpg",                   "2-1.jpg",   "철원 항공사진 1956",      "CCBY",         "CCBY",    "s0201"),
    ("cat02", "2-2_DMZ현재풍경_국립수목원.png",                   "2-2.png",   "DMZ 현재풍경",            "국립수목원",   "저작권",  "s0202"),
    ("cat02", "2-3_두루미_문화재청.jpg",                          "2-3.jpg",   "두루미",                  "문화재청",     "KOGL",    "s0203"),
    ("cat02", "2-4_재두루미_문화재청.jpg",                        "2-4.jpg",   "재두루미",                "문화재청",     "KOGL",    "s0204"),
    ("cat02", "2-5_금강초롱꽃_국립백두대간수목원.jpeg",            "2-5.jpeg",  "금강초롱꽃",              "국립백두대간수목원", "저작권", "s0205"),
    ("cat02", "2-6_수원청개구리_CCBY4.jpg",                       "2-6.jpg",   "수원청개구리",            "CCBY4",        "CCBY4",   "s0204"),
    ("cat02", "2-6_용늪_문화재청.jpg",                            "2-9.jpg",   "용늪",                    "문화재청",     "KOGL",    ""),
    ("cat02", "2-7_연천임진강생물권_UNESCO.png",                  "2-7.png",   "연천임진강 생물권",       "UNESCO",       "UNESCO",  "s0207"),
    ("cat02", "2-8_강원생태평화생물권_UNESCO.png",                "2-8.png",   "강원생태평화 생물권",     "UNESCO",       "UNESCO",  "s0208"),
    # cat03
    ("cat03", "3-1_만월대_CCBYSA4.jpg",                          "3-1.jpg",   "만월대",                  "Wikimedia",    "CCBYSA4", "s0301"),
    ("cat03", "3-2_경순왕릉_CCBYSA3.jpg",                        "3-2.jpg",   "경순왕릉",                "Wikimedia",    "CCBYSA3", "s0302"),
    ("cat03", "3-3_동의보감_PD.jpg",                             "3-3.jpg",   "동의보감",                "PD",           "PD",      "s0303"),
    ("cat03", "3-4_호로고루_CCBYSA4.jpg",                        "3-4.jpg",   "호로고루",                "Wikimedia",    "CCBYSA4", "s0304"),
    ("cat03", "3-5_전곡리주먹도끼_CCBYSA4.jpg",                  "3-5.jpg",   "전곡리 주먹도끼",         "Wikimedia",    "CCBYSA4", "s0305"),
    ("cat03", "3-6_철원민통선_철원성터_CCBYSA2.jpg",              "3-6.jpg",   "철원민통선 철원성터",     "Wikimedia",    "CCBYSA2", "s0306"),
    # cat04
    ("cat04", "4-1_대성동전경_CCBY4.jpg",                        "4-1.jpg",   "대성동 전경",             "CCBY4",        "CCBY4",   ""),
    ("cat04", "4-2_기정동_CCBY4.jpg",                            "4-2.jpg",   "기정동",                  "CCBY4",        "CCBY4",   ""),
    ("cat04", "4-3_철원폐건물_CCBY4.jpg",                        "4-3.jpg",   "철원 폐건물",             "CCBY4",        "CCBY4",   ""),
    ("cat04", "4-4_대성동졸업식_PD.jpg",                         "4-4.jpg",   "대성동 졸업식",           "PD",           "PD",      ""),
    ("cat04", "4-5_민통선_CCBY2.jpg",                            "4-5.jpg",   "민통선",                  "CCBY2",        "CCBY2",   ""),
    ("cat04", "4-6_대성동깃대_PD.jpg",                           "4-6.jpg",   "대성동 깃대",             "PD",           "PD",      ""),
    ("cat04", "4-7_대성동초등학교표지판_PD.jpg",                  "4-7.jpg",   "대성동초등학교 표지판",   "PD",           "PD",      ""),
    ("cat04", "4-8_대성동자유의마을전경_CCBY4.jpg",               "4-8.jpg",   "대성동 자유의마을 전경",  "CCBY4",        "CCBY4",   ""),
    # cat05
    ("cat05", "5-1_DMZ경고판_PD.jpg",                            "5-1.jpg",   "DMZ 경고판",              "PD",           "PD",      ""),
    ("cat05", "5-2_참수리357_CCBYSA3.jpg",                       "5-2.jpg",   "참수리 357",              "Wikimedia",    "CCBYSA3", ""),
    ("cat05", "5-3_JSA경비_PD.jpg",                              "5-3.jpg",   "JSA 경비",                "PD",           "PD",      ""),
    ("cat05", "5-4_소떼방북_PD.jpg",                             "5-4.jpg",   "소떼 방북",               "PD",           "PD",      ""),
    ("cat05", "5-5_남북정상회담_KOGL.jpg",                       "5-5.jpg",   "남북정상회담",            "KOGL",         "KOGL",    ""),
    ("cat05", "5-6_개성공단_CCBYSA3.jpg",                        "5-6.jpg",   "개성공단",                "Wikimedia",    "CCBYSA3", ""),
    # cat06
    ("cat06", "06_감호_구선봉_해금강_금강산전망대_한국일보.jpg",   "6-1.jpg",  "감호 구선봉 해금강 금강산전망대", "한국일보",  "저작권",  ""),
    ("cat06", "06_도라전망대_2018_문화일보.jpg",                  "6-2.jpg",   "도라전망대 2018",         "문화일보",     "저작권",  ""),
    ("cat06", "06_월정리역_전경_한국일보.jpg",                    "6-3.jpg",   "월정리역 전경",           "한국일보",     "저작권",  ""),
    ("cat06", "06_월정리역_철마는달리고싶다_한국일보.jpg",         "6-4.jpg",   "월정리역 철마는달리고싶다", "한국일보",   "저작권",  ""),
    ("cat06", "06_월정리역_효녀동상_한국관광공사.jpg",             "6-5.jpg",   "월정리역 효녀동상",       "한국관광공사", "저작권",  ""),
    ("cat06", "06_임진각_자유의다리_파주시.jpg",                  "6-6.jpg",   "임진각 자유의다리",       "파주시",       "저작권",  ""),
    ("cat06", "06_제3땅굴_TNT시추작업_1985_PublicDomain.jpg",     "6-7.jpg",   "제3땅굴 TNT시추작업 1985", "PD",          "PD",      ""),
    ("cat06", "06_제3땅굴_관광시설_파주시관광포털.jpg",            "6-8.jpg",   "제3땅굴 관광시설",        "파주시관광포털", "저작권", ""),
    ("cat06", "06_제3땅굴_도보이용로_파주시관광포털.jpg",          "6-9.jpg",   "제3땅굴 도보이용로",      "파주시관광포털", "저작권", ""),
    ("cat06", "06_제3땅굴_미공병단방문_2023_PublicDomain.jpg",     "6-10.jpg",  "제3땅굴 미공병단방문 2023", "PD",         "PD",      ""),
    ("cat06", "06_판문점_T1T2T3_판문각_2023_PublicDomain.jpg",     "6-11.jpg",  "판문점 T1T2T3 판문각 2023", "PD",         "PD",      ""),
    # resized
    ("resized", "01_signing_1953.jpg",  "01_signing_1953.jpg",  "정전협정 서명 1953",       "NARA",  "PD",  "s0101"),
    ("resized", "02_mdl_marker.jpg",    "02_mdl_marker.jpg",    "MDL 마커",                 "USAF",  "PD",  "s0101"),
]

# ─── 1단계: 카피 ───────────────────────────────────────────────
print("=== 1단계: photos 영문화 카피 ===")
copy_count = 0
copy_errors = []

for entry in MAPPING:
    cat, old_name, new_name = entry[0], entry[1], entry[2]
    src_dir = SRC_PHOTOS / cat
    dst_dir = DST_PHOTOS / cat
    dst_dir.mkdir(parents=True, exist_ok=True)

    # NFD 정규화로 macOS 파일 찾기
    old_name_nfd = nfd(old_name)
    old_name_nfc = nfc(old_name)

    src_path = None
    for candidate in [old_name_nfd, old_name_nfc, old_name]:
        p = src_dir / candidate
        if p.exists():
            src_path = p
            break

    # 못 찾으면 디렉토리 순회해서 NFD 비교
    if src_path is None:
        for f in src_dir.iterdir():
            if nfd(f.name) == old_name_nfd or nfc(f.name) == old_name_nfc:
                src_path = f
                break

    if src_path is None:
        copy_errors.append(f"NOT FOUND: {cat}/{old_name}")
        print(f"  ERROR: {cat}/{old_name} 찾을 수 없음")
        continue

    dst_path = dst_dir / new_name
    shutil.copy2(str(src_path), str(dst_path))
    copy_count += 1
    print(f"  OK: {cat}/{old_name} → {new_name}")

print(f"\n카피 완료: {copy_count}개 / 오류: {len(copy_errors)}개")

# ─── 2단계: HTML 카피 ──────────────────────────────────────────
print("\n=== 2단계: HTML 카피 ===")
shutil.copy2(str(SRC_HTML), str(DST_HTML))
print(f"  OK: {SRC_HTML.name} → index_base.html ({DST_HTML.stat().st_size:,} bytes)")

# ─── 3단계: src 패치 ───────────────────────────────────────────
print("\n=== 3단계: index_base.html src 패치 ===")

# 원본 → 새 파일명 매핑 (cat04~06은 HTML에 없으므로 cat01~03만 포함)
SRC_PATCH = [
    ("photos/cat01/1-2_MDL_표식물_1993_USAF.jpg",                "photos/cat01/1-2.jpg"),
    ("photos/cat01/1-3_DMZ_위성사진_NASA.jpg",                    "photos/cat01/1-3.jpg"),
    ("photos/cat01/1-4_NNSC건물_JSA_2025_DVIDS9365309.jpg",       "photos/cat01/1-4.jpg"),
    ("photos/cat01/1-5_JSA_ConferenceRow_2025_DVIDS8830815.jpg",  "photos/cat01/1-5.jpg"),
    ("photos/cat01/1-6_벤하이강_히엔르엉다리_CCBYSA3.jpg",        "photos/cat01/1-6.jpg"),
    ("photos/cat02/2-1_철원항공사진_1956_CCBY.jpg",               "photos/cat02/2-1.jpg"),
    ("photos/cat02/2-2_DMZ현재풍경_국립수목원.png",               "photos/cat02/2-2.png"),
    ("photos/cat02/2-3_두루미_문화재청.jpg",                      "photos/cat02/2-3.jpg"),
    ("photos/cat02/2-4_재두루미_문화재청.jpg",                    "photos/cat02/2-4.jpg"),
    ("photos/cat02/2-5_금강초롱꽃_국립백두대간수목원.jpeg",        "photos/cat02/2-5.jpeg"),
    ("photos/cat02/2-6_수원청개구리_CCBY4.jpg",                   "photos/cat02/2-6.jpg"),
    ("photos/cat02/2-7_연천임진강생물권_UNESCO.png",              "photos/cat02/2-7.png"),
    ("photos/cat02/2-8_강원생태평화생물권_UNESCO.png",            "photos/cat02/2-8.png"),
    ("photos/cat02/2-6_용늪_문화재청.jpg",                        "photos/cat02/2-9.jpg"),
    ("photos/cat03/3-1_만월대_CCBYSA4.jpg",                      "photos/cat03/3-1.jpg"),
    ("photos/cat03/3-2_경순왕릉_CCBYSA3.jpg",                    "photos/cat03/3-2.jpg"),
    ("photos/cat03/3-3_동의보감_PD.jpg",                         "photos/cat03/3-3.jpg"),
    ("photos/cat03/3-4_호로고루_CCBYSA4.jpg",                    "photos/cat03/3-4.jpg"),
    ("photos/cat03/3-5_전곡리주먹도끼_CCBYSA4.jpg",              "photos/cat03/3-5.jpg"),
    ("photos/cat03/3-6_철원민통선_철원성터_CCBYSA2.jpg",          "photos/cat03/3-6.jpg"),
]

html_text = DST_HTML.read_text(encoding="utf-8")
html_nfd  = nfd(html_text)
html_nfc  = nfc(html_text)

patch_count = 0
not_found_in_html = []

for old_src, new_src in SRC_PATCH:
    old_nfd = nfd(old_src)
    old_nfc = nfc(old_src)

    # NFC 먼저 시도
    if old_nfc in html_text:
        count_before = html_text.count(old_nfc)
        html_text = html_text.replace(old_nfc, new_src)
        patch_count += count_before
        print(f"  PATCH(NFC x{count_before}): {old_src} → {new_src}")
    elif old_nfd in html_text:
        count_before = html_text.count(old_nfd)
        html_text = html_text.replace(old_nfd, new_src)
        patch_count += count_before
        print(f"  PATCH(NFD x{count_before}): {old_src} → {new_src}")
    else:
        not_found_in_html.append(old_src)
        print(f"  SKIP(not in HTML): {old_src}")

DST_HTML.write_text(html_text, encoding="utf-8")
print(f"\nsrc 패치 완료: {patch_count}곳 / HTML 미포함: {len(not_found_in_html)}개")
if not_found_in_html:
    for x in not_found_in_html:
        print(f"  미포함: {x}")

# ─── 4단계: CSV 작성 ───────────────────────────────────────────
print("\n=== 4단계: photos_manifest.csv 작성 ===")

COLUMNS = ["new_filename","old_filename","category","number","source_caption",
           "source_organization","license","extension","used_by_story"]

rows = []
for entry in MAPPING:
    cat, old_name, new_name, caption, org, lic, story = entry
    ext = new_name.rsplit(".", 1)[-1]
    # number: 파일명에서 숫자 부분 추출
    num_match = re.match(r'^(\d+[-–]\d+|\d+)', new_name)
    number = num_match.group(1) if num_match else ""
    rows.append({
        "new_filename": new_name,
        "old_filename": old_name,
        "category": cat,
        "number": number,
        "source_caption": caption,
        "source_organization": org,
        "license": lic,
        "extension": ext,
        "used_by_story": story,
    })

with open(DST_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=COLUMNS)
    writer.writeheader()
    writer.writerows(rows)

print(f"  CSV 작성 완료: {len(rows)}행")

# ─── 5단계: 검증 ───────────────────────────────────────────────
print("\n=== 5단계: 검증 ===")

# (1) 파일 수 검증
cat_counts = {}
for cat_dir in sorted((DST_PHOTOS).iterdir()):
    if cat_dir.is_dir():
        files = [f for f in cat_dir.iterdir() if f.is_file()]
        cat_counts[cat_dir.name] = len(files)
        print(f"  {cat_dir.name}: {len(files)}개")

total_files = sum(cat_counts.values())
expected = {"cat01":5,"cat02":9,"cat03":6,"cat04":8,"cat05":6,"cat06":11,"resized":2}
print(f"\n  총 파일 수: {total_files} (예상 47)")
for cat, exp in expected.items():
    got = cat_counts.get(cat, 0)
    status = "OK" if got == exp else f"ERROR(got {got}, expected {exp})"
    print(f"  {cat}: {status}")

# (2) HTML 파일 크기
html_size = DST_HTML.stat().st_size
print(f"\n  index_base.html 크기: {html_size:,} bytes (원본 161,363)")

# grep 방식으로 photos/ 카운트
photos_ref_count = html_text.count("photos/")
print(f"  'photos/' 참조 횟수: {photos_ref_count}")

# (3) 한글 src 잔여 검사
import re as re2
korean_pattern = re2.compile(r'src=["\'][^"\']*[가-힯][^"\']*["\']')
korean_srcs = korean_pattern.findall(html_text)
print(f"\n  한글 src 잔여: {len(korean_srcs)}개")
if korean_srcs:
    for ks in korean_srcs:
        print(f"    {ks}")

# (4) CSV 행 수
with open(DST_CSV, "r", encoding="utf-8") as f:
    csv_rows = list(csv.DictReader(f))
print(f"\n  CSV 행 수: {len(csv_rows)} (예상 47)")

# (5) orphan 검사 (새 파일명이 실제로 존재하는지)
orphan_count = 0
for entry in MAPPING:
    cat, old_name, new_name = entry[0], entry[1], entry[2]
    dst = DST_PHOTOS / cat / new_name
    if not dst.exists():
        print(f"  ORPHAN: {cat}/{new_name} 존재하지 않음")
        orphan_count += 1
print(f"  orphan 수: {orphan_count} (예상 0)")

print("\n=== 완료 ===")
