#!/usr/bin/env python3
"""
POCO Map — BM Collection Online CSV 변환 스크립트

BM Collection Online에서 수동 다운로드한 CSV 파일을
POCO Map용 JSON으로 변환한다.

BM 웹사이트(britishmuseum.org/collection)는 Cloudflare 봇 방지가 걸려 있어
프로그래밍 방식 접근이 불가하다. 대신:

1. 브라우저에서 BM Collection Online 검색
2. 10,000건 이내 결과에서 "Download results" 클릭 → CSV 파일 저장
3. 이 스크립트로 CSV → JSON 변환

검색 URL 패턴:
  https://www.britishmuseum.org/collection/search?place=Egypt&view=list&sort=object_name__asc&page=1
  https://www.britishmuseum.org/collection/search?place=Greece&view=list
  https://www.britishmuseum.org/collection/search?place=Nigeria&view=list

주요 지역별로 CSV를 나눠서 다운로드하면 10,000건 제한을 우회할 수 있다.

사용법:
  python3 fetch_bm_csv.py csv파일1.csv csv파일2.csv ...
  python3 fetch_bm_csv.py --dir ./csv_downloads/
"""

import csv
import json
import sys
import os
import glob

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# BM CSV에서 POCO Map 필드로의 매핑
# BM CSV 필드: Object type, Museum number, Title, Description,
#   Producer name, Production date, Production place,
#   Find spot, Materials, Acq name, Acq date, Acq notes, ...

# ISO 3166 국가 코드 매핑 (주요 국가)
COUNTRY_ISO = {
    "Egypt": "EG", "Greece": "GR", "Iraq": "IQ", "Iran": "IR",
    "Turkey": "TR", "Italy": "IT", "China": "CN", "India": "IN",
    "Nigeria": "NG", "Ethiopia": "ET", "Sudan": "SD", "Mexico": "MX",
    "Peru": "PE", "Colombia": "CO", "Japan": "JP", "Korea": "KR",
    "Indonesia": "ID", "Thailand": "TH", "Myanmar": "MM", "Cambodia": "KH",
    "Sri Lanka": "LK", "Pakistan": "PK", "Afghanistan": "AF",
    "Syria": "SY", "Lebanon": "LB", "Israel": "IL", "Palestine": "PS",
    "Jordan": "JO", "Yemen": "YE", "Libya": "LY", "Tunisia": "TN",
    "Morocco": "MA", "Algeria": "DZ", "Ghana": "GH", "Benin": "BJ",
    "Cameroon": "CM", "Democratic Republic of the Congo": "CD",
    "Kenya": "KE", "Tanzania": "TZ", "Uganda": "UG", "Zimbabwe": "ZW",
    "South Africa": "ZA", "Australia": "AU", "New Zealand": "NZ",
    "Papua New Guinea": "PG", "Fiji": "FJ",
    "United Kingdom": "GB", "England": "GB", "Scotland": "GB", "Wales": "GB",
    "France": "FR", "Germany": "DE", "Spain": "ES", "Portugal": "PT",
    "Netherlands": "NL", "Belgium": "BE", "Denmark": "DK",
    "Sweden": "SE", "Norway": "NO", "Russia": "RU",
    "United States": "US", "Canada": "CA", "Brazil": "BR",
    "Argentina": "AR", "Chile": "CL",
}

# 대륙 매핑
REGION_MAP = {
    "EG": "Africa", "GR": "Europe", "IQ": "Asia", "IR": "Asia",
    "TR": "Asia", "IT": "Europe", "CN": "Asia", "IN": "Asia",
    "NG": "Africa", "ET": "Africa", "SD": "Africa", "MX": "Americas",
    "PE": "Americas", "CO": "Americas", "JP": "Asia", "KR": "Asia",
    "ID": "Asia", "TH": "Asia", "MM": "Asia", "KH": "Asia",
    "LK": "Asia", "PK": "Asia", "AF": "Asia",
    "SY": "Asia", "LB": "Asia", "IL": "Asia", "PS": "Asia",
    "JO": "Asia", "YE": "Asia", "LY": "Africa", "TN": "Africa",
    "MA": "Africa", "DZ": "Africa", "GH": "Africa", "BJ": "Africa",
    "CM": "Africa", "CD": "Africa",
    "KE": "Africa", "TZ": "Africa", "UG": "Africa", "ZW": "Africa",
    "ZA": "Africa", "AU": "Oceania", "NZ": "Oceania",
    "PG": "Oceania", "FJ": "Oceania",
    "GB": "Europe", "FR": "Europe", "DE": "Europe", "ES": "Europe",
    "PT": "Europe", "NL": "Europe", "BE": "Europe", "DK": "Europe",
    "SE": "Europe", "NO": "Europe", "RU": "Europe",
    "US": "Americas", "CA": "Americas", "BR": "Americas",
    "AR": "Americas", "CL": "Americas",
}

# 취득 방법 키워드 → 분류
ACQ_KEYWORDS = {
    "purchased": "purchased",
    "bought": "purchased",
    "purchase": "purchased",
    "donated": "donated",
    "gift": "donated",
    "given": "donated",
    "bequest": "donated",
    "bequeathed": "donated",
    "presented": "donated",
    "excavated": "excavated",
    "excavation": "excavated",
    "found": "excavated",
    "seized": "seized",
    "captured": "seized",
    "confiscated": "seized",
    "looted": "seized",
    "transferred": "transferred",
    "exchange": "transferred",
}


def classify_acquisition(acq_name, acq_notes):
    """취득 방법 분류"""
    text = f"{acq_name} {acq_notes}".lower()
    for keyword, method in ACQ_KEYWORDS.items():
        if keyword in text:
            return method
    return "unknown"


def extract_country(production_place, find_spot):
    """생산지/발견지에서 국가명 추출"""
    for text in [production_place, find_spot]:
        if not text:
            continue
        # 쉼표로 분리된 마지막 부분이 보통 국가명
        parts = [p.strip() for p in text.split(",")]
        for part in reversed(parts):
            if part in COUNTRY_ISO:
                return part
        # 첫 부분도 확인
        for part in parts:
            if part in COUNTRY_ISO:
                return part
    return ""


def parse_csv(filepath):
    """BM CSV 파일을 POCO Map 형식으로 변환"""
    items = []

    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 필드명은 BM CSV에 따라 조정 필요
            production_place = row.get("Production place", "")
            find_spot = row.get("Find spot", "")
            acq_name = row.get("Acq name (acq)", row.get("Acq name", ""))
            acq_date = row.get("Acq date", "")
            acq_notes = row.get("Acq notes (acq)", row.get("Acq notes", ""))

            country = extract_country(production_place, find_spot)
            iso = COUNTRY_ISO.get(country, "")
            region = REGION_MAP.get(iso, "")
            method = classify_acquisition(acq_name, acq_notes)

            items.append({
                "id": row.get("Museum number", ""),
                "title": row.get("Title", row.get("Description", "")[:100]),
                "object_type": row.get("Object type", ""),
                "origin_country": country,
                "origin_country_iso": iso,
                "origin_region": region,
                "production_place": production_place,
                "find_spot": find_spot,
                "date_created": row.get("Production date", ""),
                "date_acquired": acq_date,
                "acquisition_method": method,
                "acquisition_name": acq_name,
                "acquisition_notes": acq_notes,
                "materials": row.get("Materials", ""),
                "description": row.get("Description", ""),
            })

    return items


def main():
    args = sys.argv[1:]

    if not args:
        print(__doc__)
        return

    csv_files = []

    if "--dir" in args:
        dir_idx = args.index("--dir")
        if dir_idx + 1 < len(args):
            directory = args[dir_idx + 1]
            csv_files = glob.glob(os.path.join(directory, "*.csv"))
        else:
            print("--dir 뒤에 경로를 지정하세요.")
            return
    else:
        csv_files = [f for f in args if f.endswith(".csv")]

    if not csv_files:
        print("CSV 파일을 찾을 수 없습니다.")
        return

    all_items = []
    for filepath in csv_files:
        print(f"처리 중: {filepath}")
        items = parse_csv(filepath)
        print(f"  {len(items)}건 추출")
        all_items.extend(items)

    # 중복 제거 (Museum number 기준)
    seen = set()
    unique = []
    for item in all_items:
        if item["id"] and item["id"] not in seen:
            seen.add(item["id"])
            unique.append(item)
        elif not item["id"]:
            unique.append(item)

    print(f"\n총 {len(all_items)}건, 중복 제거 후: {len(unique)}건")

    # 국가별 분포
    countries = {}
    for item in unique:
        c = item["origin_country"] or "unknown"
        countries[c] = countries.get(c, 0) + 1

    print("\n국가별 분포:")
    for c, cnt in sorted(countries.items(), key=lambda x: -x[1])[:20]:
        print(f"  {c:30s} {cnt:>6}건")

    # 취득 방법 분포
    methods = {}
    for item in unique:
        m = item["acquisition_method"]
        methods[m] = methods.get(m, 0) + 1

    print("\n취득 방법 분포:")
    for m, cnt in sorted(methods.items(), key=lambda x: -x[1]):
        print(f"  {m:20s} {cnt:>6}건")

    # JSON 저장
    output_path = os.path.join(OUTPUT_DIR, "artifacts_bm.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print(f"\n저장: {output_path}")

    # 국가별 집계 JSON
    summary = {}
    for item in unique:
        iso = item["origin_country_iso"] or "XX"
        if iso not in summary:
            summary[iso] = {
                "name": item["origin_country"] or "Unknown",
                "region": item["origin_region"] or "Unknown",
                "total_artifacts": 0,
                "by_method": {},
            }
        summary[iso]["total_artifacts"] += 1
        m = item["acquisition_method"]
        summary[iso]["by_method"][m] = summary[iso]["by_method"].get(m, 0) + 1

    summary_path = os.path.join(OUTPUT_DIR, "countries_summary_bm.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"저장: {summary_path}")


if __name__ == "__main__":
    main()
