#!/usr/bin/env python3
"""정합성 린터 — SPEC §16 구현.

data/scenarios.yaml의 결말 135개를 채택 규칙(R1·R2·R3a/b/c·R4·R5·R8)으로
전수 검사하고 위반 리포트를 출력한다.

  python3 scripts/check_consistency.py            # 검사 + 리포트 생성
  python3 scripts/check_consistency.py --quiet     # 콘솔 요약만

출력: data/exports/consistency_report.md / .csv
예외: data/consistency_exceptions.yaml (rule·scenario·leaf·reason)
종료 코드: 위반 0(예외 제외)=0, 위반 있음=1
"""

import argparse
import csv
import sys
from pathlib import Path

import yaml

BASE = Path(__file__).resolve().parent.parent
DATA = BASE / "data"
EXPORTS = DATA / "exports"

# ── 카드 모델 (SPEC §16.1, 정본: 검토_260609/역량카드_새모델+레거시.csv) ──

AXES = ["중심잡기", "융합하기", "성찰하기"]
TAG2AXIS = {
    "주체성": "중심잡기", "적응성": "중심잡기", "호기심": "중심잡기",
    "창의적 사고": "융합하기", "문제해결적 사고": "융합하기",
    "직관적 통찰": "융합하기", "통합적 사고": "융합하기", "맥락적 사고": "융합하기",
    "비판적 사고": "성찰하기", "윤리적 사고": "성찰하기",
    "성찰적 사고": "성찰하기", "사회·관계적 사고": "성찰하기",
}
DOMAIN10 = {
    "자기이해", "표현력", "문해력", "분석력", "검토력",
    "자료판단력", "소통력", "협업력", "학습력", "탐색력",
}
GROWTH = {"", "회복력", "도전력"}

GRADE_RANK = {"D": 0, "C": 1, "B": 2, "A": 3, "S": 4}
PLUS = {"+", "++"}
MINUS = {"-", "--"}


def path_tag_pool(scenario, leaf_id):
    """leaf의 세 선택지(tier1·tier2·review) discountTags 합집합."""
    t1_id, t2_id, r_id = leaf_id[0], leaf_id[:2], leaf_id[2:]
    parts = []
    for c in scenario["tier1"]:
        if c["id"] == t1_id:
            parts.append(c.get("discountTags") or {})
    for c in scenario["tier2"].get(t1_id, []):
        if c["id"] == t2_id:
            parts.append(c.get("discountTags") or {})
    for r in scenario["reviews"]:
        if r["id"] == r_id:
            parts.append(r.get("discountTags") or {})
    hc = {p.get("humanCentric") for p in parts if p.get("humanCentric")}
    dom = set()
    for p in parts:
        dom.update(p.get("domain") or [])
        dom.update(p.get("strongDomain") or [])
    return hc, dom


def card_count(leaf):
    """실지급 역량카드 수. cardEarned 게이트가 꺼져 있으면 0 (03-engine.js:89).
    성장카드 제외."""
    if not leaf.get("cardEarned"):
        return 0
    return (1 if leaf.get("humanCentricTag") else 0) + len(leaf.get("domainCards") or [])


def card_signature(leaf):
    return (
        leaf.get("humanCentricAxis") or "",
        leaf.get("humanCentricTag") or "",
        tuple(leaf.get("domainCards") or []),
        leaf.get("growthCard") or "",
    )


def check(data):
    """규칙 전수 검사. violations = [(rule, scenario_id, leaf_key, message)]"""
    v = []

    for sid, s in data.items():
        finals = s["finals"]

        # R8 — 1차 부호 (§15.1): A +, B 0, C −
        want = {"A": "+", "B": "0", "C": "-"}
        for c in s["tier1"]:
            if str(c.get("delegation")) != want[c["id"]]:
                v.append(("R8", sid, f"tier1.{c['id']}",
                          f"delegation={c.get('delegation')} (규칙: {want[c['id']]})"))

        branches = sorted({lid[:2] for lid in finals})
        for br in branches:
            trio = [(f"{br}R{i}", finals.get(f"{br}R{i}")) for i in (1, 2, 3)]
            if any(leaf is None for _, leaf in trio):
                continue

            # R1 — 검토 단조성: 등급·점수·카드 수 비하락
            for (id_a, a), (id_b, b) in zip(trio, trio[1:]):
                if GRADE_RANK[b["grade"]] < GRADE_RANK[a["grade"]]:
                    v.append(("R1", sid, id_b,
                              f"등급 하락 {id_a} {a['grade']} → {id_b} {b['grade']}"))
                if b["score"] < a["score"]:
                    v.append(("R1", sid, id_b,
                              f"점수 하락 {id_a} {a['score']} → {id_b} {b['score']}"))
                if card_count(b) < card_count(a):
                    v.append(("R1", sid, id_b,
                              f"카드 수 하락 {id_a} {card_count(a)}장 → {id_b} {card_count(b)}장"))

            # R5 — 검토 무차별 금지: 세 leaf의 (score, knowledge, 카드)가 전부 동일
            keys = {(leaf["score"], leaf.get("knowledge"), card_signature(leaf))
                    for _, leaf in trio}
            if len(keys) == 1:
                v.append(("R5", sid, f"{br}R1~R3",
                          "세 검토의 점수·knowledge·카드가 전부 동일 (차등 실패)"))

        for lid, leaf in finals.items():
            grade = leaf["grade"]
            deleg, knowl = str(leaf.get("delegation")), str(leaf.get("knowledge"))

            # R2 — 델타-등급 정합
            if deleg in PLUS and knowl in PLUS and grade == "D":
                v.append(("R2", sid, lid, f"델타 양수쌍({deleg},{knowl})인데 등급 D"))
            if deleg in MINUS and knowl in MINUS and grade in ("A", "S"):
                v.append(("R2", sid, lid, f"델타 음수쌍({deleg},{knowl})인데 등급 {grade}"))

            tag = leaf.get("humanCentricTag") or ""
            axis = leaf.get("humanCentricAxis") or ""
            doms = leaf.get("domainCards") or []
            growth = leaf.get("growthCard") or ""

            # R3a — D 결말 = 역량카드 0 + 회복력
            # cardEarned는 성장카드 포함 지급 게이트(03-engine.js:89)라 D도 true가 정상
            if grade == "D":
                if tag or doms:
                    v.append(("R3a", sid, lid,
                              f"D인데 역량카드 있음 (tag={tag or '없음'}, domain={doms or '없음'})"))
                if growth != "회복력":
                    v.append(("R3a", sid, lid, f"D인데 growthCard={growth or '빈값'} (규칙: 회복력)"))

            # R3b — 카드 지급선: B 이상 = 카드 1+ / C는 검토가 가른다 (R1 0, R2·R3 1+)
            else:
                granted = bool(leaf.get("cardEarned")) and bool(tag or doms)
                if grade == "C" and lid.endswith("R1"):
                    if granted:
                        v.append(("R3b", sid, lid,
                                  "C+검토 생략인데 역량카드 지급 (지급선: C는 검토가 가른다)"))
                elif not granted:
                    v.append(("R3b", sid, lid, f"등급 {grade}인데 역량카드 없음"))

            # R3c — 카드는 경로 행동 태그 풀 안에서만 (D-1)
            hc_pool, dom_pool = path_tag_pool(s, lid)
            if axis and axis not in hc_pool:
                v.append(("R3c", sid, lid,
                          f"축 '{axis}'가 경로 태그 풀 {sorted(hc_pool) or '∅'} 밖"))
            for d in doms:
                if d not in dom_pool:
                    v.append(("R3c", sid, lid,
                              f"도메인 '{d}'가 경로 태그 풀 {sorted(dom_pool) or '∅'} 밖"))

            # R4 — 카드 라벨 정합 (24장 모델)
            if axis and axis not in AXES:
                v.append(("R4", sid, lid, f"미정의 축 '{axis}'"))
            if tag:
                if tag not in TAG2AXIS:
                    v.append(("R4", sid, lid, f"미정의 태그 '{tag}'"))
                elif axis and TAG2AXIS[tag] != axis:
                    v.append(("R4", sid, lid,
                              f"태그 '{tag}'는 {TAG2AXIS[tag]} 소속인데 축이 '{axis}'"))
            for d in doms:
                if d not in DOMAIN10:
                    v.append(("R4", sid, lid, f"미정의 도메인 카드 '{d}'"))
            if growth not in GROWTH:
                v.append(("R4", sid, lid, f"미정의 성장 카드 '{growth}'"))

    return v


def load_exceptions():
    path = DATA / "consistency_exceptions.yaml"
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiet", action="store_true", help="콘솔 요약만 (리포트 파일 생략)")
    args = ap.parse_args()

    with open(DATA / "scenarios.yaml", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    violations = check(data)
    exceptions = load_exceptions()
    exc_keys = {(e["rule"], e["scenario"], e["leaf"]): e.get("reason", "") for e in exceptions}

    active, excused = [], []
    for rule, sid, leaf, msg in violations:
        reason = exc_keys.get((rule, sid, leaf))
        if reason is not None:
            excused.append((rule, sid, leaf, msg, reason))
        else:
            active.append((rule, sid, leaf, msg))

    # 콘솔 요약
    rules = ["R1", "R2", "R3a", "R3b", "R3c", "R4", "R5", "R8"]
    print(f"정합성 검사 — 시나리오 {len(data)}개, 결말 {sum(len(s['finals']) for s in data.values())}개")
    for r in rules:
        n = sum(1 for x in active if x[0] == r)
        e = sum(1 for x in excused if x[0] == r)
        mark = "  OK " if n == 0 else f"  {n:3d}건"
        print(f"  {r:4s}{mark}" + (f" (+예외 {e})" if e else ""))
    print(f"  계: 위반 {len(active)}건, 의도 예외 {len(excused)}건")

    if not args.quiet:
        EXPORTS.mkdir(exist_ok=True)
        md = EXPORTS / "consistency_report.md"
        with open(md, "w", encoding="utf-8") as f:
            f.write("### 정합성 검사 리포트 (SPEC §16)\n\n")
            f.write(f"위반 {len(active)}건 / 의도 예외 {len(excused)}건\n\n")
            for r in rules:
                rows = [x for x in active if x[0] == r]
                if not rows:
                    continue
                f.write(f"#### {r} — {len(rows)}건\n\n")
                for _, sid, leaf, msg in rows:
                    f.write(f"- `{sid}` `{leaf}` — {msg}\n")
                f.write("\n")
            if excused:
                f.write("#### 의도 예외 (allowlist)\n\n")
                for r, sid, leaf, msg, reason in excused:
                    f.write(f"- `{r}` `{sid}` `{leaf}` — {msg} → 예외: {reason}\n")
        with open(EXPORTS / "consistency_report.csv", "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f)
            w.writerow(["규칙", "시나리오", "leaf", "내용", "분류(수정/예외)", "메모"])
            for rule, sid, leaf, msg in active:
                w.writerow([rule, sid, leaf, msg, "", ""])
        print(f"  리포트: {md.relative_to(BASE)} / .csv")

    sys.exit(1 if active else 0)


if __name__ == "__main__":
    main()
