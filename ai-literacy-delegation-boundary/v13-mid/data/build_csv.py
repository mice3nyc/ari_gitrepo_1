#!/usr/bin/env python3
"""
v0.7 시나리오 데이터 → CSV 빌드 (합산 모델 + 카드 매칭 + supplements 풍부화)

v0.6 → v0.7 변경:
- 합산 모델: tier1.basePoint + varPoint, tier2.basePoint + varPoint, review.points 단계별 점수 컬럼 신설
- 카드 매칭: matchGroups (4그룹 친화) + axisDelta (직접 매칭 룰) 자리 신설
- supplements 풍부화: reviewSupplements 컬럼 폭 넓게 (검수 비중 높음)
- 폐기/검수참고: results[t2].basePoint, finals[leaf+review].score는 코드 미사용 라벨
- 출력: ~/Downloads/v07_balance_2026-05-04/ 폴더 (펼침 + 압축 + competency_cards.csv)

raw 비용 분배 (v0.6과 동일):
  t1.X        = min(leaf cost) over leaves under X
  t2.X.Y      = min(leaf cost) over leaves under XY  -  t1.X
  review leaf = leafTotal - t1 - t2
"""
import yaml
import csv
import os
import shutil
from datetime import date

YAML_PATH = "/Users/p.air15/Neo-Obsi-Sync/_dev/ai-literacy-delegation-boundary/v07/data/scenarios.yaml"
DEV_OUT = "/Users/p.air15/Neo-Obsi-Sync/_dev/ai-literacy-delegation-boundary/v07/data/exports"
DL_OUT = os.path.expanduser(f"~/Downloads/v07_balance_{date.today().isoformat()}")
CARDS_OUT = "/Users/p.air15/Neo-Obsi-Sync/_dev/ai-literacy-delegation-boundary/v07/data/competency_cards.csv"

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

# v0.7 신설 — 19종 역량 카드 → 4그룹 분류 (입력)
CARD_GROUPS = {
    "자기성찰": ["자기지식", "자기검증", "자기성찰"],
    "표현·소통": ["표현력", "정리력", "발표력", "소통능력", "협업능력"],
    "인식·해석": ["비판적 사고", "검수능력", "문해력", "공감력", "해석능력", "정보분석"],
    "실천·설계": ["진로탐색", "직업이해", "학습설계", "시간관리", "학습전략"],
}


def card_to_group(card_label):
    """카드 라벨 → 그룹 lookup. 다중 그룹은 / 로 합침. 없으면 빈 문자열."""
    groups = []
    for g, cards in CARD_GROUPS.items():
        if card_label in cards:
            groups.append(g)
    return " / ".join(groups)


# ============================================================
# 비용 분배 (v0.7 — 5/4 세션289에 stage floor 박음)
# t2/review는 가장 싼 leaf에서 0이 나오던 자리. floor 시간 2 / 에너지 1.
# 결과: 가장 싼 leaf의 stage 합 = yaml 총비용 + 최대 4t/2e overage.
# ============================================================
STAGE_FLOOR_TIME = 2
STAGE_FLOOR_ENERGY = 1


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
    return (max(STAGE_FLOOR_TIME, (minT if minT != float('inf') else 0) - t1c[0]),
            max(STAGE_FLOOR_ENERGY, (minE if minE != float('inf') else 0) - t1c[1]))


def raw_review_cost(sc, leaf_review):
    """leaf_review like 'A1R1'"""
    if 'resourceCosts' not in sc or leaf_review not in sc['resourceCosts']:
        return (0, 0)
    leafC = sc['resourceCosts'][leaf_review]
    t1c = raw_t1_cost(sc, leaf_review[0])
    t2c = raw_t2_cost(sc, leaf_review[:2])
    return (max(STAGE_FLOOR_TIME, leafC['time'] - t1c[0] - t2c[0]),
            max(STAGE_FLOOR_ENERGY, leafC['energy'] - t1c[1] - t2c[1]))


# ============================================================
# axisDelta lookup (v0.7 — 리스트 형태)
# ============================================================
def axis_lookup(sc, leaf_review):
    """axisDelta 리스트에서 leafId 매칭 항목 찾기. 없으면 None."""
    for entry in sc.get('axisDelta', []) or []:
        if entry.get('leafId') == leaf_review:
            return entry
    return None


def match_groups_for(sc, t2_full):
    """t2 leaf의 친화 그룹 목록 (matchGroups[t2] → " / " 문자열)"""
    g = sc.get('matchGroups', {}).get(t2_full, [])
    return " / ".join(g) if g else ""


# ============================================================
# 펼침 버전 — 한 행 = leaf×review 한 자리 (135행)
# ============================================================
HEADER_FLAT = [
    # 시나리오 메타
    "시나리오 ID", "시나리오 타이틀", "상황", "시나리오 의도", "시나리오 메시지",
    "leaf 좌표",  # A1R1 같은 leaf×review 좌표 — 검수 편의

    # tier1 자리
    "1차 선택", "1차 의도", "1차 메시지",
    "1차 시간비용", "1차 에너지비용",
    "1차 위임판단력 변화", "1차 도메인지식 변화",
    "tier1 베이스", "tier1 변수",  # v0.7 신설 — 합산 모델

    # tier2 자리
    "더 자세히 선택", "더 자세히 의도", "더 자세히 메시지",
    "더 자세히 시간비용", "더 자세히 에너지비용",
    "더 자세히 위임판단력 변화", "더 자세히 도메인지식 변화",
    "tier2 베이스", "tier2 변수",  # v0.7 신설 — 합산 모델

    # review 자리 — supplements는 컬럼 폭 넓게 (학생 화면 메인 텍스트)
    "검토 선택", "검토 의도",
    "검토 학생 narrative (Cut5/Cut6 메인)",  # v0.7 supplements 풍부화
    "검토 시간비용", "검토 에너지비용",
    "검토 위임판단력 변화", "검토 도메인지식 변화",
    "review 점수",  # v0.7 신설 — 합산 모델

    # v0.7 신설 — 합산 + 매칭
    "합산 점수 (t1.base+var + t2.base+var + review)",  # 계산 컬럼
    "매칭 그룹 (matchGroups)",  # v0.7 신설 — 4그룹 친화
    "직접 매칭 카드 (axisDelta.requireCard)",  # v0.7 신설
    "직접 매칭 보너스 (axisDelta.bonusPoint)",
    "직접 매칭 노트 (axisDelta.note)",

    # 획득 카드 (학기 누적 풀)
    "획득 역량카드 목록 (competencyCards)",
    "EXP 보상 (expRewards)",

    # 검수 참고용 — 코드 미사용 라벨
    "[검수참고] results.text", "[검수참고] results.summary", "[검수참고] results.lesson",
    "[검수참고·코드미사용] finals.score", "[검수참고] finals.grade",
    "[검수참고] finals.item", "[검수참고] finals.awareness",
]


def build_flat(data):
    rows = []
    for sc_id in SCENARIOS:
        sc = data[sc_id]
        for t1id in TIER1_IDS:
            t1 = next(t for t in sc['tier1'] if t['id'] == t1id)
            t1cost = raw_t1_cost(sc, t1id)
            t1_base = t1.get('basePoint', '')
            t1_var = t1.get('varPoint', '')
            for t2 in sc['tier2'][t1id]:
                t2_full = t2['id']  # "A1"
                t2cost = raw_t2_cost(sc, t2_full)
                t2_delta = t2.get('delta', {}).get(f'after{t1id}', {})
                t2_base = t2.get('basePoint', '')
                t2_var = t2.get('varPoint', '')
                result = sc.get('results', {}).get(t2_full, {}) or {}
                match_g = match_groups_for(sc, t2_full)

                for r in sc['reviews']:
                    rid = r['id']  # "R1"
                    leaf = f"{t2_full}{rid}"
                    rcost = raw_review_cost(sc, leaf)
                    rsupp = sc.get('reviewSupplements', {}).get(leaf, '')
                    rpoints = r.get('points', '')
                    final = sc.get('finals', {}).get(leaf, {}) or {}
                    axis = axis_lookup(sc, leaf)
                    axis_card = axis['requireCard'] if axis else ''
                    axis_bonus = axis['bonusPoint'] if axis else ''
                    axis_note = axis.get('note', '') if axis else ''

                    cards = sc.get('competencyCards', {}).get(leaf, []) or []
                    cards_str = ", ".join(cards)
                    exp = sc.get('expRewards', {}).get(leaf, '')

                    # 합산 점수 (계산 컬럼) — 숫자만 있을 때 합산
                    try:
                        total = (int(t1_base) + int(t1_var)
                                 + int(t2_base) + int(t2_var)
                                 + int(rpoints))
                        total_str = str(total)
                    except (ValueError, TypeError):
                        total_str = ''

                    rows.append([
                        sc_id,
                        sc.get('title', ''),
                        sc.get('situation', {}).get('text', ''),
                        INTENTS.get(sc_id, ''),
                        sc.get('learningMessage', ''),
                        leaf,

                        f"{t1['id']}. {t1['label']}",
                        t1.get('lesson', ''),
                        t1.get('desc', ''),
                        t1cost[0], t1cost[1],
                        t1.get('delegation', ''),
                        t1.get('knowledge', ''),
                        t1_base, t1_var,

                        f"{t2['id']}. {t2['label']}",
                        t2.get('lesson', ''),
                        result.get('text', ''),
                        t2cost[0], t2cost[1],
                        t2_delta.get('delegation', ''),
                        t2_delta.get('knowledge', ''),
                        t2_base, t2_var,

                        f"{r['id']}. {r['label']}",
                        r.get('lesson', ''),
                        rsupp,
                        rcost[0], rcost[1],
                        final.get('delegation', ''),
                        final.get('knowledge', ''),
                        rpoints,

                        total_str,
                        match_g,
                        axis_card, axis_bonus, axis_note,

                        cards_str,
                        exp,

                        result.get('text', ''),
                        result.get('summary', ''),
                        result.get('lesson', ''),
                        final.get('score', ''),
                        final.get('grade', ''),
                        final.get('item') or '',
                        final.get('awareness', ''),
                    ])
    return rows


# ============================================================
# 압축 버전 — 한 행 = leaf 한 자리, R1/R2/R3 옆으로 (45행)
# ============================================================
HEADER_COMPACT = [
    "시나리오 ID", "시나리오 타이틀", "상황", "시나리오 의도", "시나리오 메시지",
    "tier2 좌표",

    "1차 선택", "1차 의도", "1차 메시지",
    "1차 시간비용", "1차 에너지비용",
    "1차 위임판단력 변화", "1차 도메인지식 변화",
    "tier1 베이스", "tier1 변수",

    "더 자세히 선택", "더 자세히 의도", "더 자세히 메시지",
    "더 자세히 시간비용", "더 자세히 에너지비용",
    "더 자세히 위임판단력 변화", "더 자세히 도메인지식 변화",
    "tier2 베이스", "tier2 변수",

    "매칭 그룹 (matchGroups)",
]
for rid in REVIEW_IDS:
    HEADER_COMPACT += [
        f"{rid} 검토",
        f"{rid} 학생 narrative",
        f"{rid} 시간비용", f"{rid} 에너지비용",
        f"{rid} 위임판단력 변화", f"{rid} 도메인지식 변화",
        f"{rid} review 점수",
        f"{rid} 합산 점수",
        f"{rid} 직접 매칭 카드", f"{rid} 직접 매칭 보너스",
        f"{rid} 획득 카드 목록",
        f"{rid} EXP",
        f"{rid} [검수·코드미사용] finals.score", f"{rid} [검수] finals.grade",
    ]


def build_compact(data):
    rows = []
    for sc_id in SCENARIOS:
        sc = data[sc_id]
        for t1id in TIER1_IDS:
            t1 = next(t for t in sc['tier1'] if t['id'] == t1id)
            t1cost = raw_t1_cost(sc, t1id)
            t1_base = t1.get('basePoint', '')
            t1_var = t1.get('varPoint', '')
            for t2 in sc['tier2'][t1id]:
                t2_full = t2['id']
                t2cost = raw_t2_cost(sc, t2_full)
                t2_delta = t2.get('delta', {}).get(f'after{t1id}', {})
                t2_base = t2.get('basePoint', '')
                t2_var = t2.get('varPoint', '')
                result = sc.get('results', {}).get(t2_full, {}) or {}
                match_g = match_groups_for(sc, t2_full)

                row = [
                    sc_id,
                    sc.get('title', ''),
                    sc.get('situation', {}).get('text', ''),
                    INTENTS.get(sc_id, ''),
                    sc.get('learningMessage', ''),
                    t2_full,

                    f"{t1['id']}. {t1['label']}",
                    t1.get('lesson', ''),
                    t1.get('desc', ''),
                    t1cost[0], t1cost[1],
                    t1.get('delegation', ''),
                    t1.get('knowledge', ''),
                    t1_base, t1_var,

                    f"{t2['id']}. {t2['label']}",
                    t2.get('lesson', ''),
                    result.get('text', ''),
                    t2cost[0], t2cost[1],
                    t2_delta.get('delegation', ''),
                    t2_delta.get('knowledge', ''),
                    t2_base, t2_var,

                    match_g,
                ]
                for r in sc['reviews']:
                    rid = r['id']
                    leaf = f"{t2_full}{rid}"
                    rcost = raw_review_cost(sc, leaf)
                    rsupp = sc.get('reviewSupplements', {}).get(leaf, '')
                    rpoints = r.get('points', '')
                    final = sc.get('finals', {}).get(leaf, {}) or {}
                    axis = axis_lookup(sc, leaf)
                    axis_card = axis['requireCard'] if axis else ''
                    axis_bonus = axis['bonusPoint'] if axis else ''
                    cards = sc.get('competencyCards', {}).get(leaf, []) or []
                    cards_str = ", ".join(cards)
                    exp = sc.get('expRewards', {}).get(leaf, '')

                    try:
                        total = (int(t1_base) + int(t1_var)
                                 + int(t2_base) + int(t2_var)
                                 + int(rpoints))
                        total_str = str(total)
                    except (ValueError, TypeError):
                        total_str = ''

                    row += [
                        f"{r['id']}. {r['label']}",
                        rsupp,
                        rcost[0], rcost[1],
                        final.get('delegation', ''),
                        final.get('knowledge', ''),
                        rpoints,
                        total_str,
                        axis_card, axis_bonus,
                        cards_str,
                        exp,
                        final.get('score', ''),
                        final.get('grade', ''),
                    ]
                rows.append(row)
    return rows


# ============================================================
# competency_cards.csv — 19종 역량 카드 별도 시트 (v0.7 신설)
# 학기 누적 관점으로 carded competencyCards를 재구성
# ============================================================
HEADER_CARDS = [
    "카드 ID", "카드 그룹", "획득 시나리오", "획득 leaf+review",
    "직접 매칭 룰 (있으면)", "직접 매칭 보너스",
]


def build_competency_cards(data):
    """
    각 시나리오의 competencyCards[leaf+review] = [카드라벨, ...]을 펼쳐서
    한 행 = (카드 라벨 × 시나리오 × leaf+review) 자리로 재구성.
    """
    rows = []
    # axisDelta 인덱스: (sc_id, requireCard) → list of (leafId, bonus)
    axis_index = {}
    for sc_id in SCENARIOS:
        sc = data[sc_id]
        for entry in sc.get('axisDelta', []) or []:
            key = (sc_id, entry.get('requireCard', ''))
            axis_index.setdefault(key, []).append(
                (entry.get('leafId', ''), entry.get('bonusPoint', ''))
            )

    for sc_id in SCENARIOS:
        sc = data[sc_id]
        cards_map = sc.get('competencyCards', {}) or {}
        for leaf in sorted(cards_map.keys()):
            card_list = cards_map[leaf] or []
            for card_label in card_list:
                group = card_to_group(card_label)
                # 직접 매칭 룰 lookup — 이 (시나리오, 카드) 쌍에서 매칭되는 leaf와 보너스
                axis_matches = axis_index.get((sc_id, card_label), [])
                axis_match_str = ""
                axis_bonus_str = ""
                # 이 leaf가 직접 매칭 룰에 들어있으면 별도 표시
                for (axis_leaf, axis_bonus) in axis_matches:
                    if axis_leaf == leaf:
                        axis_match_str = f"이 leaf 직접 매칭"
                        axis_bonus_str = str(axis_bonus)
                        break
                else:
                    if axis_matches:
                        # 같은 카드에 대한 다른 leaf 매칭은 참고로 표시
                        axis_match_str = "다른 leaf: " + ", ".join(
                            f"{l}(+{b})" for l, b in axis_matches
                        )

                rows.append([
                    card_label, group, sc_id, leaf,
                    axis_match_str, axis_bonus_str,
                ])
    return rows


# ============================================================
# 카드 누적 요약 — 19종 카드별 학기 누적 통계
# ============================================================
HEADER_CARDS_SUMMARY = [
    "카드 ID", "카드 그룹", "총 획득 가능 자리 수",
    "selfintro 자리 수", "groupwork 자리 수", "eorinwangja 자리 수",
    "career 자리 수", "studyplan 자리 수",
    "직접 매칭 룰 자리 수",
]


def build_cards_summary(data):
    """카드별로 어느 시나리오 몇 자리에서 획득 가능한지 통계"""
    counts = {}  # card → {sc_id: count, axis_count: N}
    for sc_id in SCENARIOS:
        sc = data[sc_id]
        cards_map = sc.get('competencyCards', {}) or {}
        for leaf, card_list in cards_map.items():
            for card_label in (card_list or []):
                d = counts.setdefault(card_label, {s: 0 for s in SCENARIOS})
                d.setdefault('axis', 0)
                d[sc_id] += 1
        for entry in sc.get('axisDelta', []) or []:
            card_label = entry.get('requireCard', '')
            if not card_label:
                continue
            d = counts.setdefault(card_label, {s: 0 for s in SCENARIOS})
            d.setdefault('axis', 0)
            d['axis'] += 1

    # 19종 카드 = CARD_GROUPS의 모든 카드
    all_cards = []
    for g, cards in CARD_GROUPS.items():
        for c in cards:
            all_cards.append((c, g))

    rows = []
    for card_label, group in all_cards:
        d = counts.get(card_label, {})
        sc_counts = [d.get(s, 0) for s in SCENARIOS]
        total = sum(sc_counts)
        axis_n = d.get('axis', 0)
        rows.append([card_label, group, total] + sc_counts + [axis_n])
    return rows


# ============================================================
# main
# ============================================================
def main():
    with open(YAML_PATH) as f:
        data = yaml.safe_load(f)

    flat = build_flat(data)
    compact = build_compact(data)
    cards = build_competency_cards(data)
    cards_summary = build_cards_summary(data)

    os.makedirs(DEV_OUT, exist_ok=True)
    os.makedirs(DL_OUT, exist_ok=True)

    flat_csv = os.path.join(DEV_OUT, "v07_시나리오_펼침_135행.csv")
    compact_csv = os.path.join(DEV_OUT, "v07_시나리오_압축_45행.csv")
    cards_csv_dev = os.path.join(DEV_OUT, "v07_competency_cards.csv")
    cards_summary_csv = os.path.join(DEV_OUT, "v07_competency_cards_summary.csv")

    with open(flat_csv, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_FLAT)
        w.writerows(flat)

    with open(compact_csv, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_COMPACT)
        w.writerows(compact)

    # competency_cards.csv는 data/ 자리에도 신설 (작업 사양 명시)
    with open(CARDS_OUT, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_CARDS)
        w.writerows(cards)

    with open(cards_csv_dev, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_CARDS)
        w.writerows(cards)

    with open(cards_summary_csv, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f)
        w.writerow(HEADER_CARDS_SUMMARY)
        w.writerows(cards_summary)

    # Downloads 복사본
    for src in [flat_csv, compact_csv, cards_csv_dev, cards_summary_csv]:
        shutil.copy(src, os.path.join(DL_OUT, os.path.basename(src)))

    print(f"[펼침]       {flat_csv}  ({len(flat)}행 × {len(HEADER_FLAT)}컬럼)")
    print(f"[압축]       {compact_csv}  ({len(compact)}행 × {len(HEADER_COMPACT)}컬럼)")
    print(f"[카드 시트]  {CARDS_OUT}  ({len(cards)}행 × {len(HEADER_CARDS)}컬럼)")
    print(f"[카드 요약]  {cards_summary_csv}  ({len(cards_summary)}행 × {len(HEADER_CARDS_SUMMARY)}컬럼)")
    print(f"[Downloads 복사] {DL_OUT}")


if __name__ == "__main__":
    main()
