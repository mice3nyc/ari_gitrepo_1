# POCO Map — 데이터 소스 + 구조

## 데이터 소스 현황 (2026-03-28 조사)

### 접근 불가 경로

| 경로 | 상태 | 상세 |
|------|------|------|
| BM SPARQL (`collection.britishmuseum.org/sparql`) | ⛔ 다운 | HTTP 000 — 연결 자체가 안 됨. 타임아웃. |
| BM 웹사이트 (`britishmuseum.org/collection`) | ⛔ 차단 | Cloudflare 봇 방지. curl/python 403 Forbidden. |
| BM 내부 API (`britishmuseum.org/api/_search`) | ⛔ 차단 | 동일 Cloudflare 차단. |
| BM 구 검색 (`search.britishmuseum.org`) | ⛔ 차단 | 403 Forbidden. |

### 사용 가능 경로

#### 1차: Wikidata SPARQL (프로그래밍 접근 가능)

- **Endpoint**: `https://query.wikidata.org/sparql`
- **BM 컬렉션 식별**: P195 (collection) = Q6373 (British Museum)
- **주요 속성**:
  - P17: 국가 (country)
  - P495: 출신국 (country of origin)
  - P297: ISO 국가 코드
  - P571: 제작 시기 (inception)
  - P186: 재료 (material)
  - P18: 이미지
  - P1711: BM 시스템 ID
  - P580: 시작일 (취득일에 활용 가능)
  - P1028: 기증자 (donated by)
- **스크립트**: `data/fetch_wikidata.py`
- **한계**: Wikidata에 등록된 BM 유물만 (전체 200만+ 중 일부). 취득 방법(acquisition method) 정보가 제한적.
- **장점**: 완전 자동화, JSON 직접 반환, 국가/좌표 매핑 내장, 무료, 안정적

#### 2차: BM Collection Online CSV (수동 다운로드)

- **URL**: `https://www.britishmuseum.org/collection`
- **방법**: 브라우저에서 검색 → "Download results" → CSV 파일
- **제한**: 검색 결과 10,000건 이내만 다운로드 가능
- **우회**: 지역/시기/카테고리별로 쿼리를 쪼개면 다수 CSV 확보 가능
- **CSV 필드**: Object type, Museum number, Title, Description, Producer name, Production date, Production place, Find spot, Materials, Acq name, Acq date, Acq notes, ...
- **스크립트**: `data/fetch_bm_csv.py` (CSV → JSON 변환 + 국가/취득방법 분류)
- **장점**: 공식 데이터, 풍부한 필드 (Production place, Acq date, Acq notes 포함)
- **검색 URL 패턴**:
  ```
  https://www.britishmuseum.org/collection/search?place=Egypt&view=list&sort=object_name__asc&page=1
  https://www.britishmuseum.org/collection/search?place=Greece&view=list
  https://www.britishmuseum.org/collection/search?place=Nigeria&view=list
  ```

#### 참고: 기타 조사한 소스

| 소스 | 평가 |
|------|------|
| BM GitHub (`github.com/BritishMuseum`) | 20개 repo. 컬렉션 데이터 없음. 3D 모델, 트위터, R 분석용. |
| BM DH GitHub (`github.com/BritishMuseumDH`) | apiResearch repo에 설문 CSV만. 컬렉션 데이터 없음. |
| VanGo 프로젝트 (`github.com/zuzannna/VanGo`) | BM SPARQL로 회화 데이터 추출 → 추천 엔진. 스크래퍼 코드 미포함. |
| Datahub (`old.datahub.io/dataset/british-museum-collection`) | 메타데이터 페이지만. 실제 데이터 링크는 BM SPARQL로 연결 (다운). |
| Kaggle | BM 전용 데이터셋 없음. |
| Rui Zhu ("如果文物都回家") (`siruizhu.github.io/cultural--relics/`) | 중국 국내 문화재 분석. BM 데이터 아님. 우리 프로젝트와 접근 다름. |
| V&A Museum API (`api.vam.ac.uk/v2`) | 작동 확인됨. BM 아닌 V&A 데이터. 비교 참고용으로 활용 가능. |

---

## 1차 데이터: British Museum Collection

### 추출 대상 필드 (최종 구조)

```json
{
  "id": "BM-2024-0001",
  "wikidata_id": "Q212163",
  "title": "Rosetta Stone",
  "origin_country": "Egypt",
  "origin_country_iso": "EG",
  "origin_region": "Africa",
  "production_place": "Egypt",
  "date_created": "-196",
  "date_acquired": "1802",
  "acquisition_method": "seized",
  "acquisition_notes": "",
  "object_type": "sculpture",
  "material": "granodiorite",
  "description": "...",
  "bm_url": "https://www.britishmuseum.org/collection/object/...",
  "wikidata_url": "https://www.wikidata.org/wiki/Q212163",
  "image_url": "",
  "source": "wikidata"
}
```

### 국가 집계 구조

```json
{
  "EG": {
    "name": "Egypt",
    "name_ko": "이집트",
    "region": "Africa",
    "total_artifacts": 120000,
    "by_method": {
      "seized": 45000,
      "excavated": 35000,
      "purchased": 20000,
      "donated": 10000,
      "unknown": 10000
    },
    "has_dispute": true,
    "lat": 26.8206,
    "lng": 30.8025
  }
}
```

### 취득 방법 분류 체계

| 코드 | 설명 | 키워드 |
|------|------|--------|
| `purchased` | 구매 | purchased, bought, purchase |
| `donated` | 기증 | donated, gift, given, bequest, presented |
| `excavated` | 발굴 | excavated, excavation, found |
| `seized` | 약탈/몰수 | seized, captured, confiscated, looted |
| `transferred` | 이관 | transferred, exchange |
| `unknown` | 불명 | (위 키워드 없음) |

---

## 2차 데이터: Dispute 정보

### 수작업 수집 소스
- **Urgent Matter** (urgentmatter.org) — 유물 반환 요청 데이터베이스
- **Center for Art Law** — 법적 분쟁 사례
- **뉴스 아카이브** (Guardian, BBC, NYT) — 반환 요청 기사
- **Wikipedia**: "British Museum repatriation" 관련 문서

### Dispute 데이터 구조

```json
{
  "id": "D001",
  "artifact": "Parthenon Marbles",
  "requesting_country": "Greece",
  "requesting_country_iso": "GR",
  "year_requested": 1983,
  "current_status": "ongoing",
  "summary": "Greece has formally requested return since 1983...",
  "sources": ["https://..."],
  "bm_position": "Legal impossibility under BM Act 1963"
}
```

### 초기 Dispute 목록 (Phase 3용, 10건)
1. Parthenon Marbles (Greece)
2. Rosetta Stone (Egypt)
3. Benin Bronzes (Nigeria)
4. Hoa Hakananai'a (Easter Island/Chile)
5. Ethiopian Tabots (Ethiopia)
6. Maqdala Treasures (Ethiopia)
7. Gweagal Shield (Australia)
8. Kohinoor Diamond (India — Crown Jewels이지만 BM 맥락)
9. Chinese artifacts (multiple disputes)
10. Iraqi/Mesopotamian artifacts (Iraq)

---

## 지도 데이터

### GeoJSON
- Natural Earth 110m 사용 (경량)
- URL: `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json`
- ISO 3166 코드로 매칭

---

## 데이터 파이프라인

```
[자동] Wikidata SPARQL ──→ fetch_wikidata.py ──→ artifacts_wikidata.json
                                                → countries_summary_wikidata.json

[수동] BM CSV 다운로드 ──→ fetch_bm_csv.py ───→ artifacts_bm.json
                                                → countries_summary_bm.json

병합 + 중복 제거 ─────────────────────────────→ artifacts.json (최종)
                                                → countries_summary.json (최종)

[수동] Dispute 조사 ──────────────────────────→ disputes.json

세 파일 → index.html에서 fetch → D3 렌더링
```

### 실행 순서

```bash
# 1. Wikidata에서 자동 수집
cd _dev/poco-map
python3 data/fetch_wikidata.py              # 샘플 100건 + 국가 집계
python3 data/fetch_wikidata.py --full       # 전체 추출

# 2. BM 웹사이트에서 수동 CSV 다운로드 (브라우저)
#    data/csv_downloads/ 폴더에 저장

# 3. CSV → JSON 변환
python3 data/fetch_bm_csv.py --dir data/csv_downloads/

# 4. 두 소스 병합 (TODO: merge 스크립트)
```
