#!/usr/bin/env python3
"""
v0.6 시나리오 데이터 → CSV 두 버전 빌드
- 펼침: 한 행 = 한 leaf×review 자리 (5 시나리오 × 27 = 135행)
- 압축: 한 행 = 한 leaf, R1/R2/R3 컬럼 옆으로 (5 × 9 = 45행)

비용 분리는 코드(index.html _rawTier1Cost/_rawTier2Cost/_rawReviewCost)와 동일한 raw 기반 incremental:
  t1.X        = min(leaf cost) over leaves under X
  t2.X.Y      = min(leaf cost) over leaves under XY  -  t1.X
  review leaf = leafTotal - t1 - t2
"""
import yaml
import csv
import os
import shutil

YAML_PATH = "/Users/p.air15/Neo-Obsi-Sync/_dev/ai-literacy-delegation-boundary/v06/data/scenarios.yaml"
DEV_OUT = "/Users/p.air15/Neo-Obsi-Sync/_dev/ai-literacy-delegation-boundary/v06/data/exports"
DL_OUT = os.path.expanduser("~/Downloads/AI리터러시_v06_데이터시트")

SCENARIOS = ["selfintro", "groupwork", "eorinwangja", "career", "studyplan"]
TIER1_IDS = ["A", "B", "C"]
REVIEW_IDS = ["R1", "R2", "R3"]

# 시나리오 의도 — 짧게 직접 박음 (yaml에 별도 자리 없음)
INTENTS = {
    "selfintro":   "자기 자리에서 시작해야 할 글에 AI를 어떻게 쓸지 가르는 첫 회기. 자기지식·자기검증 자리.",
    "groupwork":   "팀 작업에서 역할 분담과 AI 활용을 함께 굴리는 회기. 협업·소통·발표 자리.",
    "eorinwangja": "고전 텍스트 해석을 AI 요약과 자기 시선 사이에서 다루는 회기. 문해력·해석·공감 자리.",
    "career":      "자기 미래의 길을 AI 추천과 자기 탐색 사이에서 고르는 회기. 진로탐색·정보분석·직업이해 자리.",
    "studyplan":   "시험 학습을 AI 보조와 자기 페이스 사이에서 짜는 회기. 학습설계·시간관리·학습전략 자리.",
}


def raw_t1_cost(sc, t1):
    if 'resourceCosts' not in sc:
        return (0, 0)
    minT, minE = float('inf'), float('inf')
    for k, c in sc['resourceCosts'].items():
        if k.startswith(t1):
            if c['time'] < minT: minT = c['time']
            if c['energy'] < minE: minE = c['energy']
    return (minT if minT != float('inf') else 0,
            minE if minE != float('inf') else 0)


def raw_t2_cost(sc, t2):
    """t2 like 'A1', 'A2'"""
    if 'resourceCosts' not in sc:
        return (0, 0)
    minT, minE = float('inf'), float('inf')
    for k, c in sc['resourceCosts'].items():
        if k.startswith(t2):
            if c['time'] < minT: minT = c['time']
            if c['energy'] < minE: minE = c['energy']
    t1c = raw_t1_cost(sc, t2[0])
    return (max(0, (minT if minT != float('inf') else 0) - t1c[0]),
            max(0, (minE if minE != float('inf') else 0) - t1c[1]))


def raw_review_cost(sc, leaf_review):
    """leaf_review like 'A1R1'"""
    if 'resourceCosts' not in sc or leaf_review not in sc['resourceCosts']:
        return (0, 0)
    leafC = sc['resourceCosts'][leaf_review]
    t1c = raw_t1_cost(sc, leaf_review[0])
    t2c = raw_t2_cost(sc, leaf_review[:2])
    return (max(0, leafC['time'] - t1c[0] - t2c[0]),
            max(0, leafC['energy'] - t1c[1] - t2c[1]))


def t2_from_t1(sc, t1id, t2id):
    """tier2[X][i] 찾기"""
    for x in sc['tier2'][t1id]:
        if x['id'] == t2id:
            return x
    return None


# ============================================================
# 펼침 버전 — 한 행 = leaf×review 한 자리
# ============================================================
HEADER_FLAT = [
    "시나리오 타이틀", "상황", "시나리오 의도", "시나리오 메시지",
    "선택지", "선택지 의도", "선택지 메시지",
    "선택지 시간비용", "선택지 에너지비용",
    "선택지 획득위임판단력", "선택지 획득도메인지식",
    "획득역량카드목록", "선택지 점수",
    "선택더자세히", "더자세히 의도", "더자세히 메시지",
    "더자세히 시간 비용", "더 자세히 에너지 비용",
    "더자세히 획득위임판단력", "더자세히 획득도메인지식",
    "더 자세히 획득역량카드목록", "더자세히 점수",
    "검토", "검토 의도", "검토 메시지",
    "검토 시간비용", "검토 에너지 비용",
    "검토 획득위임판단력", "검토 획득도메인지식",
    "검토 획득 역량카드목록", "검토 점수",
]


def build_flat(data):
    rows = []
    for sc_id in SCENARIOS:
        sc = data[sc_id]
        for t1id in TIER1_IDS:
            t1 = next(t for t in sc['tier1'] if t['id'] == t1id)
            t1cost = raw_t1_cost(sc, t1id)
            for t2 in sc['tier2'][t1id]:
                t2_full = t2['id']  # "A1"
                t2cost = raw_t2_cost(sc, t2_full)
                t2_delta = t2.get('delta', {}).get(f'after{t1id}', {})
                result = sc.get('results', {}).get(t2_full, {})
                for r in sc['reviews']:
                    rid = r['id']  # "R1"
                    leaf = f"{t2_full}{rid}"
                    rcost = raw_review_cost(sc, leaf)
                    rsupp = sc.get('reviewSupplements', {}).get(leaf, '')
                    final = sc.get('finals', {}).get(leaf, {}) or {}
                    axis = sc.get('axisDelta', {}).get(leaf, {}) or {}

                    # 더자세히 카드 = axisDelta.boostCard (해당 leaf×review에만 — 보너스 카드)
                    t2_card = axis.get('boostCard', '')
                    # 검토 카드 = finals.item (이 leaf×review의 메인 카드)
                    review_card = final.get('item') or ''

                    rows.append([
                        sc.get('title', ''),
                        sc.get('situation', {}).get('text', ''),
                        INTENTS.get(sc_id, ''),
                        sc.get('learningMessage', ''),

                        f"{t1['id']}. {t1['label']}",
                        t1.get('lesson', ''),
                        t1.get('desc', ''),
                        t1cost[0], t1cost[1],
                        t1.get('delegation', ''),
                        t1.get('knowledge', ''),
                        '',  # 1차 단계엔 카드 보상 없음
                        '',  # 1차 단계엔 점수 없음 (results는 t2 단위부터)

                        f"{t2['id']}. {t2['label']}",
                        t2.get('lesson', ''),
                        result.get('text', ''),
                        t2cost[0], t2cost[1],
                        t2_delta.get('delegation', ''),
                        t2_delta.get('knowledge', ''),
                        t2_card,
                        result.get('basePoint', ''),

                        f"{r['id']}. {r['label']}",
                        r.get('lesson', ''),
                        rsupp,
                        rcost[0], rcost[1],
                        final.get('delegation', ''),
                        final.get('knowledge', ''),
                        review_card,
                        final.get('score', ''),
                    ])
    return rows


# ============================================================
# 압축 버전 — 한 행 = leaf 한 자리, R1/R2/R3 옆으로
# ============================================================
HEADER_COMPACT = [
    "시나리오 타이틀", "상황", "시나리오 의도", "시나리오 메시지",
    "선택지", "선택지 의도", "선택지 메시지",
    "선택지 시간비용", "선택지 에너지비용",
    "선택지 획득위임판단력", "선택지 획득도메인지식",
    "선택더자세히", "더자세히 의도", "더자세히 메시지",
    "더자세히 시간 비용", "더 자세히 에너지 비용",
    "더자세히 획득위임판단력", "더자세히 획득도메인지식",
    "더 자세히 획득역량카드목록", "더자세히 점수",
]
for rid in REVIEW_IDS:
    HEADER_COMPACT += [
        f"{rid} 검토", f"{rid} 검토 의도", f"{rid} 검토 메시지",
        f"{rid} 시간비용", f"{rid} 에너지 비용",
        f"{rid} 획득위임판단력", f"{rid} 획득도메인지식",
        f"{rid} 획득 역량카드목록", f"{rid} 점수",
    ]


def build_compact(data):
    rows = []
    for sc_id in SCENARIOS:
        sc = data[sc_id]
        for t1id in TIER1_IDS:
            t1 = next(t for t in sc['tier1'] if t['id'] == t1id)
            t1cost = raw_t1_cost(sc, t1id)
            for t2 in sc['tier2'][t1id]:
                t2_full = t2['id']
                t2cost = raw_t2_cost(sc, t2_full)
                t2_delta = t2.get('delta', {}).get(f'after{t1id}', {})
                result = sc.get('results', {}).get(t2_full, {})
                # 더자세히 카드 = 이 leaf의 axisDelta (R1/R2/R3 어느 하나에라도 있으면 한 자리에서 통합 표시)
                axis_cards = []
                for rid in REVIEW_IDS:
                    leaf = f"{t2_full}{rid}"
                    bc = sc.get('axisDelta', {}).get(leaf, {}).get('boostCard', '')
                    if bc:
                        axis_cards.append(f"{rid}={bc}")
                t2_card_summary = " / ".join(axis_cards)

                row = [
                    sc.get('title', ''),
                    sc.get('situation', {}).get('text', ''),
                    INTENTS.get(sc_id, ''),
                    sc.get('learningMessage', ''),
                    f"{t1['id']}. {t1['label']}",
                    t1.get('lesson', ''),
                    t1.get('desc', ''),
                    t1cost[0], t1cost[1],
                    t1.get('delegation', ''),
                    t1.get('knowledge', ''),
                    f"{t2['id']}. {t2['label']}",
                    t2.get('lesson', ''),
                    result.get('text', ''),
                    t2cost[0], t2cost[1],
                    t2_delta.get('delegation', ''),
                    t2_delta.get('knowledge', ''),
                    t2_card_summary,
                    result.get('basePoint', ''),
                ]
                for r in sc['reviews']:
                    rid = r['id']
                    leaf = f"{t2_full}{rid}"
                    rcost = raw_review_cost(sc, leaf)
                    rsupp = sc.get('reviewSupplements', {}).get(leaf, '')
                    final = sc.get('finals', {}).get(leaf, {}) or {}
                    row += [
                        f"{r['id']}. {r['label']}",
                        r.get('lesson', ''),
                        rsupp,
                        rcost[0], rcost[1],
                        final.get('delegation', ''),
                        final.get('knowledge', ''),
                        final.get('item') or '',
                        final.get('score', ''),
                    ]
                rows.append(row)
    return rows


def main():
    with open(YAML_PATH) as f:
        data = yaml.safe_load(f)

    flat = build_flat(data)
    compact = build_compact(data)

    os.makedirs(DEV_OUT, exist_ok=True)
    os.makedirs(DL_OUT, exist_ok=True)

    flat_csv = os.path.join(DEV_OUT, "v06_시나리오_펼침_135행.csv")
    compact_csv = os.path.join(DEV_OUT, "v06_시나리오_압축_45행.csv")

    with open(flat_csv, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_FLAT)
        w.writerows(flat)

    with open(compact_csv, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_COMPACT)
        w.writerows(compact)

    # Downloads 복사본
    shutil.copy(flat_csv, os.path.join(DL_OUT, os.path.basename(flat_csv)))
    shutil.copy(compact_csv, os.path.join(DL_OUT, os.path.basename(compact_csv)))

    print(f"[펼침]  {flat_csv}  ({len(flat)}행 × {len(HEADER_FLAT)}컬럼)")
    print(f"[압축]  {compact_csv}  ({len(compact)}행 × {len(HEADER_COMPACT)}컬럼)")
    print(f"[Downloads 복사] {DL_OUT}")


if __name__ == "__main__":
    main()
