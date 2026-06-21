#!/usr/bin/env python3
"""
v13-mid 전체 시나리오·전체 브랜칭 가로 펼침 검토표 (2026-06-16, 아리공)

피터공 요청(6/16): "시나리오 | 선택1 | 시간비용 | 에너지비용 | 점수 | 역량카드 | 능력카드 ||
  선택2 | ... || 검토 | ... | 이렇게 모든 시나리오 모든 브랜칭이 담긴 검토용 문서."

→ 한 행 = 하나의 완전 경로(leaf, 27경로 × 5시나리오 = 135행).
  1차 / 2차(더깊은선택) / 검토 세 비트를 가로로 펼친다.
  각 비트마다: 선택 라벨 · 시간비용 · 에너지비용 · 점수 · 역량카드(인간중심) · 능력카드(도메인).

소스 (★ 현행 라이브가 읽는 단일 진실):
  - data/scenarios.yaml        : 점수(basePoint/varPoint/points) · 비용(stageCosts) · delta · discountTags
  - data/micro_offsets.yaml    : 2차 위임 깊이 보정(표기용)
  - 카드 도출 규칙 = src/js/15-card-per-choice.js 를 그대로 포팅
      (카드는 finals에 저장된 데이터가 아니라 선택에서 런타임 규칙으로 도출됨 — 6/11 card-per-choice 개편)

카드 규칙(15-card-per-choice.js §pilotCardsForChoice):
  - 1차 : delegation 부호>0 → 인간중심(역량) 카드. 축=discountTags.humanCentric → axisTagMap[scid][축]=태그
  - 2차 : 경로 delta(afterX) knowledge 부호>0 → strongDomain[0] 도메인(능력) 카드.
          delta.delegation=='++' → 인간중심 카드 추가(같은 시나리오 내 같은 축 이미 있으면 제외)
  - 검토: discountTags.strongDomain[0] 있으면(R2/R3) → 도메인(능력) 카드. R1은 비어서 없음
  - 중복 차단: 같은 시나리오 안에서 같은 축(hc)/같은 라벨(domain) 재지급 금지 → 경로 내 누적 시뮬레이션

비용 표기: 1차는 엔진이 면제(0). 2차·검토는 stageCosts 그대로.
점수: 1차=base+var, 2차=base+var, 검토=points. 최종점수(verdict)는 finals.score(별도 authored, 참고용).
"""
import csv
import os
import yaml

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "exports", "검토_260616")
os.makedirs(OUT, exist_ok=True)

SCENARIOS = ["selfintro", "groupwork", "eorinwangja", "career", "studyplan"]
SCEN_KR = {
    "selfintro": "자기소개글",
    "groupwork": "모둠발표자료",
    "eorinwangja": "어린왕자독후감",
    "career": "AI시대진로",
    "studyplan": "시험2주전공부",
}
DELEG = {"A": "내가 직접", "B": "부분 위임", "C": "전체 위임"}
REVIEW_DEPTH = {"R1": "R1 무검토", "R2": "R2 표면검토", "R3": "R3 깊은검토"}
MICRO_KR = {-1: "→직접쪽", 0: "", 1: "→위임쪽"}

# src/js/15-card-per-choice.js 의 axisTagMap 그대로
AXIS_TAG_MAP = {
    "selfintro": {"중심잡기": "주체성", "융합하기": "통합적 사고", "성찰하기": "성찰적 사고"},
    "groupwork": {"중심잡기": "적응성", "융합하기": "통합적 사고", "성찰하기": "사회·관계적 사고"},
    "eorinwangja": {"중심잡기": "호기심", "융합하기": "맥락적 사고", "성찰하기": "윤리적 사고"},
    "career": {"중심잡기": "호기심", "융합하기": "창의적 사고", "성찰하기": "비판적 사고"},
    "studyplan": {"중심잡기": "주체성", "융합하기": "문제해결적 사고", "성찰하기": "성찰적 사고"},
}


def load_yaml(name):
    with open(os.path.join(BASE, name), encoding="utf-8") as f:
        return yaml.safe_load(f)


def axis_delta(sign):  # 00-config.js getAxisDelta
    if not sign or sign == "0":
        return 0
    if sign in ("+", "++"):
        return 1
    if sign in ("-", "--"):
        return -1
    return 0


def leaf_delta(t2, t1id):  # 03-engine.js getLeafDelta
    d = (t2.get("delta") or {}).get("after" + t1id)
    if d:
        return d
    return {"delegation": t2.get("delegation", "0"), "knowledge": t2.get("knowledge", "0")}


def find(seq, _id):
    for x in seq:
        if x.get("id") == _id:
            return x
    return None


def stage_cost(sc, kind, key):
    d = ((sc.get("stageCosts", {}) or {}).get(kind, {}) or {}).get(key)
    if not d:
        return 0, 0
    return d.get("time", 0), d.get("energy", 0)


def derive_path_cards(sc, scid, t1id, t2id, rid):
    """경로 내 1차→2차→검토 순으로 카드 누적 + 같은-시나리오 중복 차단.
    반환: {'tier1':(hc[],dom[]), 'tier2':(hc[],dom[]), 'review':(hc[],dom[])}"""
    amap = AXIS_TAG_MAP.get(scid, {})
    owned_axis = set()   # 이번 시나리오에서 받은 인간중심 축
    owned_dom = set()    # 이번 시나리오에서 받은 도메인 라벨
    res = {}

    def hc_tag(axis):
        return amap.get(axis) if axis else None

    # --- 1차 ---
    hc, dom = [], []
    t1 = find(sc.get("tier1", []), t1id)
    if t1 and axis_delta(t1.get("delegation")) > 0:
        axis = (t1.get("discountTags") or {}).get("humanCentric")
        tag = hc_tag(axis)
        if axis and tag and axis not in owned_axis:
            hc.append(tag)
            owned_axis.add(axis)
    res["tier1"] = (hc, dom)

    # --- 2차 ---
    hc, dom = [], []
    t2 = find((sc.get("tier2", {}) or {}).get(t1id, []), t2id)
    if t2:
        d = leaf_delta(t2, t1id)
        if axis_delta(d.get("knowledge")) > 0:
            sd = ((t2.get("discountTags") or {}).get("strongDomain") or [None])[0]
            if sd and sd not in owned_dom:
                dom.append(sd)
                owned_dom.add(sd)
        if d.get("delegation") == "++":
            axis = (t2.get("discountTags") or {}).get("humanCentric")
            tag = hc_tag(axis)
            if axis and tag and axis not in owned_axis:
                hc.append(tag)
                owned_axis.add(axis)
    res["tier2"] = (hc, dom)

    # --- 검토 ---
    hc, dom = [], []
    rv = find(sc.get("reviews", []), rid)
    sd2 = None
    if rv:
        sd2 = ((rv.get("discountTags") or {}).get("strongDomain") or [None])[0]
    if sd2 and sd2 not in owned_dom:
        dom.append(sd2)
        owned_dom.add(sd2)
    res["review"] = (hc, dom)
    return res


def t1_points(t1):
    return (t1.get("basePoint", 0) + t1.get("varPoint", 0)) if t1 else 0


def t2_points(t2):
    return (t2.get("basePoint", 0) + t2.get("varPoint", 0)) if t2 else 0


def joincards(lst):
    return " / ".join(lst) if lst else ""


def build():
    micro = load_yaml("micro_offsets.yaml")
    cols = [
        "시나리오", "경로",
        # 1차
        "1차 선택", "1차 위임", "1차 시간비용", "1차 에너지비용", "1차 점수", "1차 역량카드", "1차 능력카드",
        # 2차
        "2차 선택", "2차 위임(보정)", "2차 시간비용", "2차 에너지비용", "2차 점수", "2차 역량카드", "2차 능력카드",
        # 검토
        "검토 선택", "검토 깊이", "검토 시간비용", "검토 에너지비용", "검토 점수", "검토 역량카드", "검토 능력카드",
        # 종합(참고)
        "최종점수(verdict)", "등급",
        "단계점수합", "시간비용합", "에너지비용합",
    ]
    rows = []
    for scid in SCENARIOS:
        sc = SC[scid]
        kr = SCEN_KR[scid]
        finals = sc.get("finals", {}) or {}
        for leaf in sorted(finals.keys()):
            t1id, t2id, rid = leaf[0], leaf[:2], leaf[2:]
            t1 = find(sc.get("tier1", []), t1id)
            t2 = find((sc.get("tier2", {}) or {}).get(t1id, []), t2id)
            rv = find(sc.get("reviews", []), rid)

            t2t, t2e = stage_cost(sc, "tier2", t2id)
            rt, re = stage_cost(sc, "review", rid)
            t1p, t2p = t1_points(t1), t2_points(t2)
            rp = rv.get("points", 0) if rv else 0

            cards = derive_path_cards(sc, scid, t1id, t2id, rid)

            # 2차 위임 보정 표기
            off = (micro.get(scid, {}) or {}).get(t2id, 0)
            deleg2 = DELEG.get(t1id, t1id)
            if off and MICRO_KR.get(off):
                deleg2 += MICRO_KR[off]

            fin = finals.get(leaf, {})
            rows.append({
                "시나리오": kr, "경로": leaf,
                "1차 선택": t1.get("label", "") if t1 else "",
                "1차 위임": DELEG.get(t1id, t1id),
                "1차 시간비용": "0(면제)", "1차 에너지비용": "0(면제)",
                "1차 점수": t1p,
                "1차 역량카드": joincards(cards["tier1"][0]),
                "1차 능력카드": joincards(cards["tier1"][1]),
                "2차 선택": t2.get("label", "") if t2 else "",
                "2차 위임(보정)": deleg2,
                "2차 시간비용": t2t, "2차 에너지비용": t2e,
                "2차 점수": t2p,
                "2차 역량카드": joincards(cards["tier2"][0]),
                "2차 능력카드": joincards(cards["tier2"][1]),
                "검토 선택": rv.get("label", "") if rv else "",
                "검토 깊이": REVIEW_DEPTH.get(rid, rid),
                "검토 시간비용": rt, "검토 에너지비용": re,
                "검토 점수": rp,
                "검토 역량카드": joincards(cards["review"][0]),
                "검토 능력카드": joincards(cards["review"][1]),
                "최종점수(verdict)": fin.get("score", ""),
                "등급": fin.get("grade", ""),
                "단계점수합": t1p + t2p + rp,
                "시간비용합": t2t + rt,
                "에너지비용합": t2e + re,
            })
    path = os.path.join(OUT, "전체브랜칭_가로펼침_135행.csv")
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    return path, len(rows)


if __name__ == "__main__":
    _all = load_yaml("scenarios.yaml")
    SC = {sid: _all[sid] for sid in SCENARIOS}
    p, n = build()
    print(f"[완료] {os.path.relpath(p, BASE)} — {n}행")
    # 카드 분포 요약 (검증용)
    import collections
    with open(p, encoding="utf-8-sig") as f:
        rd = list(csv.DictReader(f))
    print(f"행수: {len(rd)} (= 5시나리오 × 27경로 = 135 기대)")
    grades = collections.Counter(r["등급"] for r in rd)
    print("등급 분포:", dict(grades))
    # 경로별 총 카드 수 (역량+능력)
    def cardcount(r):
        c = 0
        for k in ["1차 역량카드", "1차 능력카드", "2차 역량카드", "2차 능력카드", "검토 역량카드", "검토 능력카드"]:
            if r[k].strip():
                c += len([x for x in r[k].split("/") if x.strip()])
        return c
    by_grade = collections.defaultdict(list)
    for r in rd:
        by_grade[r["등급"]].append(cardcount(r))
    for g in sorted(by_grade):
        v = by_grade[g]
        print(f"  등급 {g}: 경로 {len(v)}개, 평균 카드 {sum(v)/len(v):.1f}장")
