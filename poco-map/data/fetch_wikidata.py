#!/usr/bin/env python3
"""
POCO Map — Wikidata 데이터 수집 스크립트

대영박물관(British Museum, Q6373) 소장 유물 데이터를
Wikidata SPARQL endpoint에서 추출한다.

BM 자체 SPARQL endpoint (collection.britishmuseum.org/sparql)가
타임아웃으로 접근 불가하여 Wikidata를 대안 소스로 사용.

사용법:
  python3 fetch_wikidata.py              # 샘플 100건
  python3 fetch_wikidata.py --full       # 전체 추출 (batch)
  python3 fetch_wikidata.py --count      # 총 건수 확인만
  python3 fetch_wikidata.py --summary    # 국가별 집계만
"""

import urllib.request
import urllib.parse
import json
import sys
import time
import os

WIKIDATA_ENDPOINT = "https://query.wikidata.org/sparql"
USER_AGENT = "POCO-Map/1.0 (https://github.com/mice3nyc/ari_gitrepo_1; poco-map-project)"
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# --- SPARQL 쿼리 템플릿 ---

# 총 건수 확인
QUERY_COUNT = """
SELECT (COUNT(DISTINCT ?item) AS ?count) WHERE {
  ?item wdt:P195 wd:Q6373 .
}
"""

# 국가별 집계
# P495 (country of origin)를 우선, P495가 없으면 P17 (country) 사용
# P17은 현재 소재국(UK)을 반환할 수 있으므로 UK를 제외
QUERY_COUNTRY_SUMMARY = """
SELECT ?country ?countryLabel (COUNT(DISTINCT ?item) AS ?count) WHERE {
  ?item wdt:P195 wd:Q6373 .
  {
    ?item wdt:P495 ?country .
  } UNION {
    ?item wdt:P17 ?country .
    FILTER NOT EXISTS { ?item wdt:P495 [] }
    FILTER (?country != wd:Q145)
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
GROUP BY ?country ?countryLabel
ORDER BY DESC(?count)
"""

# 유물 상세 데이터 (배치 추출용)
# P495 (country of origin) 우선
# P17 (country) 보조 — UK 제외
# P1071 (location of creation) 보조
QUERY_ITEMS_TEMPLATE = """
SELECT DISTINCT
  ?item ?itemLabel ?itemDescription
  ?originLabel ?originISO
  ?p17Label ?p17ISO
  ?creationLocLabel
  ?inception
  ?materialLabel
  ?image
  ?bmId
WHERE {{
  ?item wdt:P195 wd:Q6373 .
  OPTIONAL {{
    ?item wdt:P495 ?origin .
    OPTIONAL {{ ?origin wdt:P297 ?originISO . }}
  }}
  OPTIONAL {{
    ?item wdt:P17 ?p17 .
    FILTER (?p17 != wd:Q145)
    OPTIONAL {{ ?p17 wdt:P297 ?p17ISO . }}
  }}
  OPTIONAL {{ ?item wdt:P1071 ?creationLoc . }}
  OPTIONAL {{ ?item wdt:P571 ?inception . }}
  OPTIONAL {{ ?item wdt:P186 ?material . }}
  OPTIONAL {{ ?item wdt:P18 ?image . }}
  OPTIONAL {{ ?item wdt:P1711 ?bmId . }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en" . }}
}}
LIMIT {limit}
OFFSET {offset}
"""

# 취득 관련 정보 (별도 쿼리 — P580 시작시간, 기증자 등)
QUERY_ACQUISITION = """
SELECT ?item ?itemLabel ?acqDate ?donorLabel ?methodLabel WHERE {
  ?item wdt:P195 wd:Q6373 .
  OPTIONAL {
    ?item p:P195 ?collStatement .
    ?collStatement pq:P580 ?acqDate .
  }
  OPTIONAL { ?item wdt:P1028 ?donor . }
  OPTIONAL {
    ?item p:P195 ?collStatement2 .
    ?collStatement2 pq:P791 ?method .
  }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
}
LIMIT {limit}
OFFSET {offset}
"""


def sparql_query(query, retries=3):
    """Wikidata SPARQL 쿼리 실행"""
    url = WIKIDATA_ENDPOINT + "?" + urllib.parse.urlencode({
        "query": query,
        "format": "json"
    })
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/json"
    })

    for attempt in range(retries):
        try:
            resp = urllib.request.urlopen(req, timeout=60)
            data = json.loads(resp.read().decode("utf-8"))
            return data["results"]["bindings"]
        except Exception as e:
            print(f"  시도 {attempt + 1}/{retries} 실패: {e}")
            if attempt < retries - 1:
                wait = 5 * (attempt + 1)
                print(f"  {wait}초 대기 후 재시도...")
                time.sleep(wait)
            else:
                raise


def get_count():
    """BM 소장 유물 총 건수"""
    results = sparql_query(QUERY_COUNT)
    count = int(results[0]["count"]["value"])
    print(f"Wikidata에 등록된 BM 소장 유물: {count:,}건")
    return count


def get_country_summary():
    """국가별 집계"""
    print("국가별 집계 쿼리 실행 중...")
    results = sparql_query(QUERY_COUNTRY_SUMMARY)

    summary = []
    for r in results:
        summary.append({
            "wikidata_id": r["country"]["value"].split("/")[-1],
            "country": r["countryLabel"]["value"],
            "count": int(r["count"]["value"])
        })

    print(f"총 {len(summary)}개국, {sum(s['count'] for s in summary):,}건")
    print("\n상위 20개국:")
    for s in summary[:20]:
        print(f"  {s['country']:30s} {s['count']:>6,}건")

    output_path = os.path.join(OUTPUT_DIR, "countries_summary_wikidata.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\n저장: {output_path}")

    return summary


def fetch_items(limit=100, offset=0):
    """유물 데이터 배치 추출"""
    query = QUERY_ITEMS_TEMPLATE.format(limit=limit, offset=offset)
    return sparql_query(query)


# 역사적 국가/왕조 → 현대 국가 매핑
HISTORICAL_COUNTRY_MAP = {
    "Babylonia": "Iraq",
    "Neo-Assyrian Empire": "Iraq",
    "Assyrian Empire": "Iraq",
    "Mesopotamia": "Iraq",
    "Sumer": "Iraq",
    "Akkadian Empire": "Iraq",
    "Ancient Egypt": "Egypt",
    "history of Ptolemaic Egypt": "Egypt",
    "Ptolemaic Kingdom": "Egypt",
    "Ancient Rome": "Italy",
    "Roman Empire": "Italy",
    "Roman Syria": "Syria",
    "Byzantine Empire": "Turkey",
    "Eastern Roman Empire": "Turkey",
    "Ottoman Empire": "Turkey",
    "Ancient Greece": "Greece",
    "Kingdom of Macedon": "Greece",
    "Qing dynasty": "China",
    "Tang dynasty": "China",
    "Yuan dynasty": "China",
    "Ming dynasty": "China",
    "Song dynasty": "China",
    "Han dynasty": "China",
    "Liao dynasty": "China",
    "Gaochang Kingdom (Qu clan)": "China",
    "Safavid Iran": "Iran",
    "Achaemenid Empire": "Iran",
    "Parthian Empire": "Iran",
    "Ilkhanate": "Iran",
    "Sasanian Empire": "Iran",
    "Mughal Empire": "India",
    "Bikaner State": "India",
    "Maratha Empire": "India",
    "Kingdom of England": "United Kingdom",
    "Kingdom of Great Britain": "United Kingdom",
    "United Kingdom of Great Britain and Ireland": "United Kingdom",
    "Benin Empire": "Nigeria",
    "Kingdom of Benin": "Nigeria",
    "Aztec Empire": "Mexico",
    "Inca Empire": "Peru",
    "Khmer Empire": "Cambodia",
}

# 현대 국가 → ISO 코드
COUNTRY_ISO_MAP = {
    "Iraq": "IQ", "Egypt": "EG", "Italy": "IT", "Syria": "SY",
    "Turkey": "TR", "Greece": "GR", "China": "CN", "Iran": "IR",
    "India": "IN", "United Kingdom": "GB", "Nigeria": "NG",
    "Mexico": "MX", "Peru": "PE", "Cambodia": "KH",
    "Tunisia": "TN", "Spain": "ES", "Japan": "JP", "Chile": "CL",
    "Israel": "IL", "Sweden": "SE", "Belgium": "BE", "Austria": "AT",
    "Sri Lanka": "LK", "Nepal": "NP", "New Zealand": "NZ",
    "Germany": "DE", "France": "FR", "Netherlands": "NL",
    "Australia": "AU", "Pakistan": "PK", "Afghanistan": "AF",
    "Sudan": "SD", "Ethiopia": "ET", "Kenya": "KE", "Ghana": "GH",
    "South Africa": "ZA", "Indonesia": "ID", "Thailand": "TH",
    "Myanmar": "MM", "Colombia": "CO", "Brazil": "BR",
    "Argentina": "AR", "Morocco": "MA", "Algeria": "DZ",
    "Libya": "LY", "Lebanon": "LB", "Jordan": "JO", "Yemen": "YE",
    "Russia": "RU", "Poland": "PL", "Denmark": "DK", "Norway": "NO",
    "Portugal": "PT", "Czech Republic": "CZ", "Hungary": "HU",
    "Romania": "RO", "Croatia": "HR", "Cyprus": "CY",
}


def resolve_country(country_name):
    """역사적 국가명을 현대 국가명으로 변환하고 ISO 코드 반환"""
    if not country_name:
        return "", ""

    # 먼저 역사적 매핑 확인
    modern = HISTORICAL_COUNTRY_MAP.get(country_name, country_name)
    iso = COUNTRY_ISO_MAP.get(modern, "")

    return modern, iso


def parse_item(r):
    """SPARQL 결과 한 건을 정규화"""
    def val(key, default=""):
        return r.get(key, {}).get("value", default)

    item_id = val("item").split("/")[-1]

    # P495 (origin) 우선, 없으면 P17 (country, UK 제외), 없으면 P1071 (creation loc)
    raw_country = val("originLabel") or val("p17Label") or val("creationLocLabel")
    origin_iso_raw = val("originISO") or val("p17ISO")

    modern_country, iso_code = resolve_country(raw_country)
    # Wikidata에서 직접 ISO가 왔으면 그걸 우선
    if origin_iso_raw and not iso_code:
        iso_code = origin_iso_raw

    return {
        "wikidata_id": item_id,
        "title": val("itemLabel"),
        "description": val("itemDescription"),
        "origin_country_raw": raw_country,
        "origin_country": modern_country,
        "origin_country_iso": iso_code,
        "date_created": val("inception"),
        "material": val("materialLabel"),
        "image_url": val("image"),
        "bm_id": val("bmId"),
        "bm_url": f"https://www.britishmuseum.org/collection/object/{val('bmId')}" if val("bmId") else "",
        "wikidata_url": f"https://www.wikidata.org/wiki/{item_id}"
    }


def fetch_sample(n=100):
    """샘플 데이터 추출"""
    print(f"\n샘플 {n}건 추출 중...")
    results = fetch_items(limit=n, offset=0)

    items = [parse_item(r) for r in results]

    # 중복 제거 (wikidata_id 기준)
    seen = set()
    unique = []
    for item in items:
        if item["wikidata_id"] not in seen:
            seen.add(item["wikidata_id"])
            unique.append(item)

    print(f"추출: {len(results)}건, 중복 제거 후: {len(unique)}건")

    # 국가별 분포
    countries = {}
    for item in unique:
        c = item["origin_country"] or "unknown"
        countries[c] = countries.get(c, 0) + 1

    print("\n국가별 분포:")
    for c, cnt in sorted(countries.items(), key=lambda x: -x[1])[:15]:
        print(f"  {c:30s} {cnt:>4}건")

    output_path = os.path.join(OUTPUT_DIR, "sample_100.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)
    print(f"\n저장: {output_path}")

    return unique


def fetch_full():
    """전체 데이터 배치 추출"""
    total = get_count()
    batch_size = 500
    all_items = []
    seen = set()

    print(f"\n전체 추출 시작 (예상 {total:,}건, 배치 {batch_size}건)...")

    offset = 0
    while True:
        print(f"  배치 {offset // batch_size + 1}: offset={offset}...")
        try:
            results = fetch_items(limit=batch_size, offset=offset)
        except Exception as e:
            print(f"  배치 실패: {e}. 여기까지 저장.")
            break

        if not results:
            break

        for r in results:
            item = parse_item(r)
            if item["wikidata_id"] not in seen:
                seen.add(item["wikidata_id"])
                all_items.append(item)

        print(f"  누적: {len(all_items)}건")
        offset += batch_size

        # Wikidata 예의바른 접근: 배치 사이 1초 대기
        time.sleep(1)

        # 안전장치: 무한루프 방지
        if offset > total + batch_size:
            break

    output_path = os.path.join(OUTPUT_DIR, "artifacts_wikidata.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    print(f"\n전체 저장: {output_path} ({len(all_items):,}건)")

    return all_items


if __name__ == "__main__":
    args = sys.argv[1:]

    if "--count" in args:
        get_count()
    elif "--summary" in args:
        get_country_summary()
    elif "--full" in args:
        fetch_full()
        get_country_summary()
    else:
        # 기본: 샘플 100건 + 국가 집계
        get_count()
        fetch_sample(100)
        get_country_summary()
