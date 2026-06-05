# POCO Map — 개발 계획

> "어디에서 왔는가, 그리고 어떻게 여기에 왔는가"
> 대영박물관 유물의 출신과 경로를 시각화하는 2D 인터랙티브 맵

## 프로젝트 개요

- **이름**: POCO Map (Post Colonial Map)
- **컨셉**: 대영박물관 소장 유물을 출신국별로 2D 세계지도에 배치하고, 취득 경로와 dispute 상태를 보여주는 웹앱
- **영감**: MIT 학생 Rui의 "如果文物都回家" — 우리는 "돌아간다면"이 아니라 "어떻게 여기에 왔는가"를 묻는다
- **기술 원칙**: 단일 HTML, 바닐라 JS, 프레임워크 없음
- **디자인**: Minimal Graphical — 북유럽/독일 감성. 상세는 DESIGN.md 참조
- **데이터**: Wikidata SPARQL + BM Collection Online CSV (BM SPARQL 다운). 상세는 DATA.md 참조

---

## Phase 0: 데이터 수집 + 구조화

**목표**: BM 컬렉션 데이터를 추출하여 작업 가능한 JSON으로 변환

### 접근 경로 (2026-03-28 조사 결과)

BM 자체 데이터 접근이 모두 막혀 있어 대안 경로를 병행한다:

1. **Wikidata SPARQL** (1차 소스) — `query.wikidata.org`
   - BM 소장품 중 Wikidata에 등록된 유물 (P195=Q6373)
   - 국가(P17), 출신국(P495), 제작시기(P571), 재료(P186), BM ID(P1711) 등
   - 스크립트: `data/fetch_wikidata.py`
   - 한계: Wikidata에 등록된 건수만 (전체 2M+ 중 일부)

2. **BM Collection Online CSV** (2차 소스, 수동) — `britishmuseum.org/collection`
   - 브라우저에서 검색 → "Download results" CSV (10,000건/회)
   - 지역별로 나눠서 다운로드하면 10,000건 제한 우회 가능
   - 스크립트: `data/fetch_bm_csv.py` (CSV → JSON 변환)
   - CSV 필드: Object type, Museum number, Title, Production place, Acq date, Acq notes 등

3. **BM SPARQL** (대기) — `collection.britishmuseum.org/sparql`
   - ⛔ 2026-03-28 현재 접속 불가 (HTTP 000, 연결 타임아웃)
   - 복구되면 가장 풍부한 데이터 제공 가능

4. **BM 웹사이트 직접 접근** (불가)
   - ⛔ Cloudflare 봇 방지 (403 Forbidden)
   - curl/python requests로 접근 불가

### 체크리스트
- [x] BM SPARQL endpoint 접근 테스트 → ⛔ 타임아웃
- [x] BM 웹사이트 API 접근 테스트 → ⛔ Cloudflare 차단
- [x] 대안 데이터 소스 조사 완료
- [x] Wikidata SPARQL 쿼리 설계 + 스크립트 작성
- [x] BM CSV 변환 스크립트 작성
- [x] Wikidata 샘플 100건 추출 + 데이터 구조 검증 (68건, 역사적 국가→현대 국가 매핑 포함)
- [x] Wikidata 전체 추출 → 582건 확보 (`data/artifacts_wikidata.json`, 300KB)
- [ ] BM Collection Online에서 주요 지역별 CSV 수동 다운로드
- [ ] CSV → JSON 변환 (`python3 data/fetch_bm_csv.py --dir csv_downloads/`)
- [ ] 두 소스 병합 + 중복 제거
- [ ] JSON 변환 + 국가 코드(ISO 3166) 매핑
- [ ] `data/artifacts.json` 최종 저장
- [ ] 국가별 집계 `data/countries_summary.json` 생성

### 인수조건
- [ ] JSON 파일이 유효하고, 최소 4,000건 이상의 유물 포함
- [ ] 각 유물에 출신국 + 취득시기 + 취득방법 필드가 있음
- [ ] 국가별 집계 데이터가 지도에 바로 사용 가능한 형태

---

## Phase 1: 기본 지도 — "어디에서 왔는가"

**목표**: 2D 세계지도에 국가별 유물 수를 시각화

### 체크리스트
- [ ] HTML 기본 구조 + CSS 레이아웃 (DESIGN.md 준수)
- [ ] 세계지도 렌더링 (D3 + GeoJSON 또는 TopoJSON)
- [ ] 국가별 유물 수 → 원(circle) 크기로 표현
- [ ] 호버 시 국가명 + 유물 수 툴팁
- [ ] 국가 클릭 → 사이드 패널에 유물 목록 (이름, 취득시기)
- [ ] 총 유물 수 / 국가 수 상단 표시
- [ ] 반응형 (데스크탑 + 태블릿)

### 인수조건
- [ ] 지도에 최소 50개국 이상의 원이 표시됨
- [ ] 클릭 시 해당 국가 유물 목록이 정확히 로드됨
- [ ] DESIGN.md 스타일 가이드와 시각적 일치
- [ ] 로딩 3초 이내

---

## Phase 2: 취득 경로 — "어떻게 여기에 왔는가"

**목표**: 유물의 취득 방법(구매/기증/발굴/약탈 등)과 시기를 시각화

### 체크리스트
- [ ] 취득 방법 분류 체계 정의 (purchased, donated, excavated, seized, unknown 등)
- [ ] 분류별 색상/아이콘 매핑 (DESIGN.md 반영)
- [ ] 지도 위 필터: 취득 방법별 토글
- [ ] 타임라인 슬라이더: 연도 범위 선택 → 지도 필터링
- [ ] 국가 패널에 취득 방법 비율 차트 (미니 바 차트)
- [ ] "식민 시대"(1800-1960) 하이라이트 프리셋

### 인수조건
- [ ] 취득 방법 필터가 지도에 실시간 반영됨
- [ ] 타임라인 슬라이더가 부드럽게 작동
- [ ] 식민 시대 하이라이트 시 시각적으로 패턴이 명확히 드러남

---

## Phase 3: Dispute 레이어

**목표**: 반환 분쟁이 있는 유물/국가를 별도 레이어로 표시

### 체크리스트
- [ ] Dispute 데이터 수작업 수집 (최초 10건)
  - 소스: Urgent Matter, Center for Art Law, 뉴스 아카이브
  - 필드: 유물명, 요청국, 요청년도, 현재상태, 요약
- [ ] `data/disputes.json` 생성
- [ ] 지도 위 dispute 핀 (별도 마커)
- [ ] 핀 클릭 → dispute 상세 패널 (경위, 현재 상태, 관련 기사 링크)
- [ ] dispute가 있는 국가 테두리 강조
- [ ] dispute 유무 필터 토글

### 인수조건
- [ ] 최소 10건의 dispute가 지도에 표시됨
- [ ] 각 dispute에 요약 + 출처 링크가 있음
- [ ] dispute 필터가 정상 작동

---

## Phase 4: 내러티브 + 비교

**목표**: POCO 관점의 맥락 제공 + 3국(영/불/독) 비교

### 체크리스트
- [ ] 소개 오버레이: 프로젝트 취지 + 사용법
- [ ] "비교" 탭: 영국(BM Act 1963) / 프랑스(Sarr-Savoy) / 독일(Humboldt Forum)
- [ ] 주요 통계 인포그래픽 (유물 수, 출신국 수, dispute 건수)
- [ ] 모바일 대응 기본 레이아웃

### 인수조건
- [ ] 비교 섹션에 3국 정보가 정확하고 출처 명시됨
- [ ] 내러티브가 간결하고 편향 없이 팩트 중심

---

## Phase 5: 다듬기 + 배포

### 체크리스트
- [ ] 성능 최적화 (대량 데이터 렌더링)
- [ ] 접근성 (키보드 내비게이션, 스크린리더)
- [ ] GitHub Pages 배포
- [ ] OG 메타 태그 + 공유 이미지
- [ ] README.md 작성

---

## 작업 규칙

1. **Phase 순서를 지킨다** — 이전 Phase의 인수조건이 모두 충족되어야 다음으로 넘어감
2. **인수조건 검토**: 각 Phase 완료 시 체크리스트를 피터공과 함께 검토
3. **데이터 우선**: Phase 0이 가장 중요. 데이터 없이 UI를 만들지 않는다
4. **1건 먼저**: 대량 작업 전에 샘플 1건으로 파이프라인 검증
5. **코드 원칙**: 단일 HTML, 바닐라 JS, 프레임워크 없음, 외부 라이브러리는 D3 + 폰트만
