#!/usr/bin/env python3
"""
v13-mid 상황-선택지 재검토 CSV (2026-06-13, 아리공)

목적(피터공 6/13 요청 ①): 게임의 점수 배분이 위임·도메인학습 메시지와 정합한지 +
  할인 효과를 주는 역량이 올바른 선택에 붙어 있는지를, 사람이 한눈에 검토.

기존 build_review_csv.py(검토_260609, 27행×5, ~50컬럼 데이터 덤프)와 달리
  검토 질문에 맞춘 두 장의 타이트한 시트를 만든다.

소스: data/scenarios.yaml (★ 라이브 게임이 읽는 단일 진실. 정규화 CSV는 6/11에 멈춰
  있어 stale — 6/12 yaml 수정분이 빠짐. 그래서 yaml에서 직접 읽는다.)
  + data/micro_offsets.yaml (2차 위임 깊이 보정)

산출(exports/검토_260613/):
  1. 선택지별_점수비용할인.csv  — 비트(선택) 단위 75행. 각 선택의 점수·비용·할인역량.
  2. 경로별_종합.csv            — 경로(leaf) 단위 135행. 최종 점수·등급 vs 위임/검토 프로파일.
  3. 0_읽는법.md               — 두 점수의 차이·할인 메커닉·위임종류 매핑 안내.

점수 두 종류(읽는법에 상술):
  - 단계 점수(tier1/tier2 base+var, review points): 플레이 중 라이브 그래프 값.
  - finals.score / grade: leaf별로 따로 authored된 최종 verdict("등급=trade-off의 거울").
    둘은 의도적으로 다르다(예: A1R1 단계합 70 ↔ finals 86 / C1R1 단계합 28 ↔ finals 18).
"""
import csv
import os
import yaml

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)  # v13-mid
OUT = os.path.join(BASE, "exports", "검토_260613")
os.makedirs(OUT, exist_ok=True)

SCENARIOS = ["selfintro", "groupwork", "eorinwangja", "career", "studyplan"]
SCEN_KR = {
    "selfintro": "자기소개글",
    "groupwork": "모둠발표자료",
    "eorinwangja": "어린왕자독후감",
    "career": "AI시대진로",
    "studyplan": "시험2주전공부",
}
# tier1 갈래 → 위임종류 (11-report.js §4g CMY 컬러코딩과 동일)
DELEG = {"A": "내가 직접", "B": "부분 위임", "C": "전체 위임"}
# 검토 깊이
REVIEW_DEPTH = {"R1": "R1 무검토(○)", "R2": "R2 표면검토(◐)", "R3": "R3 깊은검토(●)"}
MICRO_KR = {-1: "→직접쪽", 0: "유지", 1: "→위임쪽"}


def load_yaml(name):
    with open(os.path.join(BASE, name), encoding="utf-8") as f:
        return yaml.safe_load(f)


def fmt_discount_card(dt):
    """domain 할인 카드 문자열: 강한매칭(strongDomain)은 ★ 표시."""
    if not dt:
        return ""
    strong = set(dt.get("strongDomain") or [])
    out = []
    for d in (dt.get("domain") or []):
        out.append(("★" + d) if d in strong else d)
    return " / ".join(out)


def fmt_hc(dt):
    return (dt or {}).get("humanCentric", "") or ""


def t1_points(sc, t1id):
    for c in sc.get("tier1", []):
        if c["id"] == t1id:
            return c.get("basePoint", 0), c.get("varPoint", 0)
    return 0, 0


def t2_points(sc, t2id):
    for c in (sc.get("tier2", {}) or {}).get(t2id[0], []):
        if c["id"] == t2id:
            return c.get("basePoint", 0), c.get("varPoint", 0)
    return 0, 0


def review_points(sc, rid):
    for c in sc.get("reviews", []):
        if c["id"] == rid:
            return c.get("points", 0)
    return 0


def stage_cost(sc, kind, key):
    """stageCosts에서 raw 비용. tier1은 엔진이 0으로 면제(주: 표기상 0)."""
    sccst = sc.get("stageCosts", {}) or {}
    d = (sccst.get(kind, {}) or {}).get(key)
    if not d:
        return 0, 0
    return d.get("time", 0), d.get("energy", 0)


# ============================================================
# 시트 1 — 선택지별 점수·비용·할인 (비트 단위, 75행)
# ============================================================
def build_choice_sheet():
    micro = load_yaml("micro_offsets.yaml")
    cols = [
        "시나리오", "비트", "ID", "위임종류", "선택 라벨",
        "기본점수", "변동점수", "점수합(단계)",
        "시간비용", "에너지비용",
        "할인_인간중심축", "할인_도메인카드(★강함)",
        "위임변화", "지식변화",
    ]
    rows = []
    for sid in SCENARIOS:
        sc = SC[sid]
        kr = SCEN_KR[sid]
        # 1차
        for c in sc.get("tier1", []):
            bp, vp = c.get("basePoint", 0), c.get("varPoint", 0)
            rows.append({
                "시나리오": kr, "비트": "1차 선택", "ID": c["id"],
                "위임종류": DELEG.get(c["id"], c["id"]),
                "선택 라벨": c.get("label", ""),
                "기본점수": bp, "변동점수": vp, "점수합(단계)": bp + vp,
                "시간비용": "0(면제)", "에너지비용": "0(면제)",
                "할인_인간중심축": fmt_hc(c.get("discountTags")),
                "할인_도메인카드(★강함)": fmt_discount_card(c.get("discountTags")),
                "위임변화": c.get("delegation", ""), "지식변화": c.get("knowledge", ""),
            })
        # 2차
        for parent in ["A", "B", "C"]:
            for c in (sc.get("tier2", {}) or {}).get(parent, []):
                bp, vp = c.get("basePoint", 0), c.get("varPoint", 0)
                t, e = stage_cost(sc, "tier2", c["id"])
                off = (micro.get(sid, {}) or {}).get(c["id"], 0)
                deleg = DELEG.get(parent, parent)
                if off:
                    deleg += f"({MICRO_KR.get(off, off)})"
                # delta는 tier1 경로 의존(afterA/B/C) — 부호만 압축 표기
                dl = c.get("delta", {}) or {}
                dlg = "/".join(dl.get("after" + p, {}).get("delegation", "·") for p in ["A", "B", "C"])
                knl = "/".join(dl.get("after" + p, {}).get("knowledge", "·") for p in ["A", "B", "C"])
                rows.append({
                    "시나리오": kr, "비트": "2차 더깊은선택", "ID": c["id"],
                    "위임종류": deleg,
                    "선택 라벨": c.get("label", ""),
                    "기본점수": bp, "변동점수": vp, "점수합(단계)": bp + vp,
                    "시간비용": t, "에너지비용": e,
                    "할인_인간중심축": fmt_hc(c.get("discountTags")),
                    "할인_도메인카드(★강함)": fmt_discount_card(c.get("discountTags")),
                    "위임변화": dlg + " (A/B/C경로별)", "지식변화": knl + " (A/B/C경로별)",
                })
        # 검토
        for c in sc.get("reviews", []):
            t, e = stage_cost(sc, "review", c["id"])
            rows.append({
                "시나리오": kr, "비트": "검토", "ID": c["id"],
                "위임종류": REVIEW_DEPTH.get(c["id"], c["id"]),
                "선택 라벨": c.get("label", ""),
                "기본점수": "", "변동점수": "", "점수합(단계)": c.get("points", 0),
                "시간비용": t, "에너지비용": e,
                "할인_인간중심축": fmt_hc(c.get("discountTags")),
                "할인_도메인카드(★강함)": fmt_discount_card(c.get("discountTags")),
                "위임변화": "", "지식변화": "(검토 지식변화는 경로별 finals)",
            })
    path = os.path.join(OUT, "선택지별_점수비용할인.csv")
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    return path, len(rows)


# ============================================================
# 시트 2 — 경로별 종합 (leaf 단위, 135행)
# ============================================================
def build_path_sheet():
    micro = load_yaml("micro_offsets.yaml")
    cols = [
        "시나리오", "경로", "1차 위임종류", "2차 위임종류(보정)", "검토 깊이",
        "최종점수(verdict)", "등급",
        "단계합(참고)", "시간비용합", "에너지비용합",
        "1차점수", "2차점수", "검토점수",
        "최종 위임변화", "최종 지식변화",
    ]
    rows = []
    for sid in SCENARIOS:
        sc = SC[sid]
        kr = SCEN_KR[sid]
        finals = sc.get("finals", {}) or {}
        for leaf in sorted(finals.keys()):
            t1id = leaf[0]
            t2id = leaf[:2]
            rid = leaf[2:]
            t1b, t1v = t1_points(sc, t1id)
            t2b, t2v = t2_points(sc, t2id)
            rp = review_points(sc, rid)
            t1pts = t1b + t1v
            t2pts = t2b + t2v
            stage_sum = t1pts + t2pts + rp
            # 비용합 (tier1 면제 → tier2 + review)
            t2t, t2e = stage_cost(sc, "tier2", t2id)
            rt, re = stage_cost(sc, "review", rid)
            off = (micro.get(sid, {}) or {}).get(t2id, 0)
            deleg2 = DELEG.get(t1id, t1id)
            if off:
                deleg2 += f"({MICRO_KR.get(off, off)})"
            fin = finals.get(leaf, {})
            rows.append({
                "시나리오": kr, "경로": leaf,
                "1차 위임종류": DELEG.get(t1id, t1id),
                "2차 위임종류(보정)": deleg2,
                "검토 깊이": REVIEW_DEPTH.get(rid, rid),
                "최종점수(verdict)": fin.get("score", ""),
                "등급": fin.get("grade", ""),
                "단계합(참고)": stage_sum,
                "시간비용합": t2t + rt, "에너지비용합": t2e + re,
                "1차점수": t1pts, "2차점수": t2pts, "검토점수": rp,
                "최종 위임변화": fin.get("delegation", ""),
                "최종 지식변화": fin.get("knowledge", ""),
            })
    path = os.path.join(OUT, "경로별_종합.csv")
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    return path, len(rows)


if __name__ == "__main__":
    _all = load_yaml("scenarios.yaml")
    SC = {sid: _all[sid] for sid in SCENARIOS}
    p1, n1 = build_choice_sheet()
    p2, n2 = build_path_sheet()
    print(f"[시트1] {os.path.basename(p1)} — {n1}행 (선택 단위)")
    print(f"[시트2] {os.path.basename(p2)} — {n2}행 (경로 단위)")
    print(f"\n출력 폴더: {OUT}")
