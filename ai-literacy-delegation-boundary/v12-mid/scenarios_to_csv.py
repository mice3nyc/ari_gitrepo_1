#!/usr/bin/env python3
"""
scenarios.yaml → 3 CSV 변환 (덱스 Google Sheets 편집용)

출력:
  data/scenario_meta.csv     (5행 — 시나리오 메타)
  data/scenario_choices.csv  (75행 — tier1/tier2/review 선택지)
  data/scenario_leaves.csv   (135행 — leaf별 결과/비용/카드/리포트)

사용:
  python3 scenarios_to_csv.py                     # 기본 경로
  python3 scenarios_to_csv.py -o ~/Downloads/     # 지정 폴더로 출력

round-trip:
  scenarios_to_csv.py → Google Sheets 편집 → csv_to_scenarios.py → build.py
"""

import yaml
import csv
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SCENARIOS_YAML = ROOT / "data" / "scenarios.yaml"
DEFAULT_OUT = ROOT / "data"

SEP = ";"


def _list_to_str(lst):
    if not lst:
        return ""
    return SEP.join(str(x) for x in lst)


def _val(v, default=""):
    if v is None:
        return default
    if isinstance(v, bool):
        return "true" if v else "false"
    return str(v)


def _dict_to_str(d):
    """Simple dict → key:value pairs string for CSV cell."""
    if not d or not isinstance(d, dict):
        return ""
    return SEP.join(f"{k}:{v}" for k, v in d.items())


def write_meta(scenarios, out_dir):
    path = out_dir / "scenario_meta.csv"
    headers = [
        "scenario_id", "category", "categoryName", "title", "version",
        "learningMessage", "aiSuitability", "timeBudgetSec",
        "domainPool", "domainLabel", "situation_text", "situation_image",
        "cuts", "semesterClosing_text", "semesterClosing_image",
    ]
    rows = []
    for sid, sc in scenarios.items():
        cuts = sc.get("cuts", {})
        sem = sc.get("semesterClosing", {})
        rows.append([
            sid,
            _val(sc.get("category")),
            _val(sc.get("categoryName")),
            _val(sc.get("title")),
            _val(sc.get("version")),
            _val(sc.get("learningMessage")),
            _val(sc.get("aiSuitability")),
            _val(sc.get("timeBudgetSec")),
            _list_to_str(sc.get("domainPool", [])),
            _val(sc.get("domainLabel")) if "domainLabel" in sc else "",
            _val(sc.get("situation", {}).get("text")),
            _val(sc.get("situation", {}).get("image")),
            _dict_to_str(cuts),
            _val(sem.get("text")) if sem else "",
            _val(sem.get("image")) if sem else "",
        ])

    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(headers)
        w.writerows(rows)
    print(f"  scenario_meta.csv: {len(rows)}행")
    return len(rows)


def write_choices(scenarios, out_dir):
    path = out_dir / "scenario_choices.csv"
    headers = [
        "scenario_id", "type", "id", "parent",
        "label", "desc", "lesson",
        "basePoint", "varPoint", "points", "boostType",
        "delegation", "knowledge",
        "delta_afterA_del", "delta_afterA_know",
        "delta_afterB_del", "delta_afterB_know",
        "delta_afterC_del", "delta_afterC_know",
        "stageCost_time", "stageCost_energy",
        "result_text", "result_summary", "result_lesson",
        "result_deltaR2", "result_deltaR3",
        "result_basePoint", "result_hiddenIssues",
        "matchGroups",
        "discountTags_humanCentric", "discountTags_domain", "discountTags_strongDomain",
    ]
    rows = []
    for sid, sc in scenarios.items():
        stage = sc.get("stageCosts", {})

        for t1 in sc.get("tier1", []):
            t1_id = t1["id"]
            sc_cost = stage.get("tier1", {}).get(t1_id, {})
            dt = t1.get("discountTags", {})
            rows.append([
                sid, "tier1", t1_id, "",
                _val(t1.get("label")), _val(t1.get("desc")), _val(t1.get("lesson")),
                _val(t1.get("basePoint")), _val(t1.get("varPoint")), "", "",
                _val(t1.get("delegation")), _val(t1.get("knowledge")),
                "", "", "", "", "", "",
                _val(sc_cost.get("time")), _val(sc_cost.get("energy")),
                "", "", "", "", "",
                "", "",
                "",
                _val(dt.get("humanCentric")),
                _list_to_str(dt.get("domain", [])),
                _list_to_str(dt.get("strongDomain", [])),
            ])

        for parent_id in ["A", "B", "C"]:
            for t2 in sc.get("tier2", {}).get(parent_id, []):
                t2_id = t2["id"]
                delta = t2.get("delta", {}) or {}
                sc_cost = stage.get("tier2", {}).get(t2_id, {})
                result = sc.get("results", {}).get(t2_id, {})
                mg = sc.get("matchGroups", {}).get(t2_id, [])
                dt = t2.get("discountTags", {})
                direct_del = _val(t2.get("delegation")) if "delegation" in t2 else ""
                direct_know = _val(t2.get("knowledge")) if "knowledge" in t2 else ""
                rows.append([
                    sid, "tier2", t2_id, parent_id,
                    _val(t2.get("label")), "", _val(t2.get("lesson")),
                    _val(t2.get("basePoint")), _val(t2.get("varPoint")), "", "",
                    direct_del, direct_know,
                    _val(delta.get("afterA", {}).get("delegation")),
                    _val(delta.get("afterA", {}).get("knowledge")),
                    _val(delta.get("afterB", {}).get("delegation")),
                    _val(delta.get("afterB", {}).get("knowledge")),
                    _val(delta.get("afterC", {}).get("delegation")),
                    _val(delta.get("afterC", {}).get("knowledge")),
                    _val(sc_cost.get("time")), _val(sc_cost.get("energy")),
                    _val(result.get("text")), _val(result.get("summary")),
                    _val(result.get("lesson")),
                    _val(result.get("deltaR2")), _val(result.get("deltaR3")),
                    _val(result.get("basePoint")) if "basePoint" in result else "",
                    _list_to_str(result.get("hiddenIssues", [])),
                    _list_to_str(mg),
                    _val(dt.get("humanCentric")),
                    _list_to_str(dt.get("domain", [])),
                    _list_to_str(dt.get("strongDomain", [])),
                ])

        for rv in sc.get("reviews", []):
            rv_id = rv["id"]
            sc_cost = stage.get("review", {}).get(rv_id, {})
            dt = rv.get("discountTags", {})
            rows.append([
                sid, "review", rv_id, "",
                _val(rv.get("label")), _val(rv.get("desc")), _val(rv.get("lesson")),
                "", "", _val(rv.get("points")), _val(rv.get("boostType")),
                "", "",
                "", "", "", "", "", "",
                _val(sc_cost.get("time")), _val(sc_cost.get("energy")),
                "", "", "", "", "",
                "", "",
                "",
                _val(dt.get("humanCentric")),
                _list_to_str(dt.get("domain", [])),
                _list_to_str(dt.get("strongDomain", [])),
            ])

    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(headers)
        w.writerows(rows)
    print(f"  scenario_choices.csv: {len(rows)}행")
    return len(rows)


def write_leaves(scenarios, out_dir):
    path = out_dir / "scenario_leaves.csv"
    headers = [
        "scenario_id", "leaf", "tier1", "tier2", "review",
        "reviewSupplement", "reviewLabel",
        "resourceCost_time", "resourceCost_energy",
        "expReward", "competencyCards",
        "axisDelta_requireCard", "axisDelta_bonusPoint", "axisDelta_note",
        "finals_score", "finals_grade", "finals_item",
        "finals_delegation", "finals_knowledge",
        "finals_awareness", "finals_cut6Feedback", "finals_replaySuggestion",
        "finals_cardEarned",
        "finals_humanCentricAxis", "finals_humanCentricTag",
        "finals_domainCards", "finals_growthCard", "finals_replayCardStatus",
        "finals_expReward",
        "finals_shortFeedback", "finals_reportFeedback", "finals_earnedCards",
        "finals_adjustedScore", "finals_adjustedType", "finals_adjustedReason",
        "finals_reportPathSummary",
        "finals_cartoonCaption1", "finals_cartoonCaption2",
        "finals_cartoonCaption3", "finals_cartoonCaption4", "finals_cartoonCaption5",
        "finals_reportReflection", "finals_reportCardSummary",
        "finals_reportStrengthTags", "finals_reportGrowthTags",
    ]
    rows = []
    for sid, sc in scenarios.items():
        ad_map = {}
        for ad in sc.get("axisDelta", []):
            ad_map[ad["leafId"]] = ad

        tier2_ids = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"]
        review_ids = ["R1", "R2", "R3"]

        for t2_id in tier2_ids:
            t1_id = t2_id[0]
            for rv_id in review_ids:
                leaf = f"{t2_id}{rv_id}"

                rs = sc.get("reviewSupplements", {}).get(leaf, "")
                rl = sc.get("reviewLabels", {}).get(leaf, "")
                rc = sc.get("resourceCosts", {}).get(leaf, {})
                er = sc.get("expRewards", {}).get(leaf, "")
                cc = sc.get("competencyCards", {}).get(leaf, [])
                ad = ad_map.get(leaf, {})
                fn = sc.get("finals", {}).get(leaf, {})

                rows.append([
                    sid, leaf, t1_id, t2_id, rv_id,
                    _val(rs), _val(rl),
                    _val(rc.get("time")), _val(rc.get("energy")),
                    _val(er), _list_to_str(cc if isinstance(cc, list) else []),
                    _val(ad.get("requireCard")), _val(ad.get("bonusPoint")),
                    _val(ad.get("note")),
                    _val(fn.get("score")), _val(fn.get("grade")), _val(fn.get("item")),
                    _val(fn.get("delegation")), _val(fn.get("knowledge")),
                    _val(fn.get("awareness")), _val(fn.get("cut6Feedback")),
                    _val(fn.get("replaySuggestion")),
                    _val(fn.get("cardEarned")),
                    _val(fn.get("humanCentricAxis")), _val(fn.get("humanCentricTag")),
                    _list_to_str(fn.get("domainCards", [])),
                    _val(fn.get("growthCard")), _val(fn.get("replayCardStatus")),
                    _val(fn.get("expReward")),
                    _val(fn.get("shortFeedback")), _val(fn.get("reportFeedback")),
                    _val(fn.get("earnedCards")),
                    _val(fn.get("adjustedScore")), _val(fn.get("adjustedType")),
                    _val(fn.get("adjustedReason")),
                    _val(fn.get("reportPathSummary")),
                    _val(fn.get("cartoonCaption1")), _val(fn.get("cartoonCaption2")),
                    _val(fn.get("cartoonCaption3")), _val(fn.get("cartoonCaption4")),
                    _val(fn.get("cartoonCaption5")),
                    _val(fn.get("reportReflection")), _val(fn.get("reportCardSummary")),
                    _list_to_str(fn.get("reportStrengthTags", [])),
                    _val(fn.get("reportGrowthTags")),
                ])

    with open(path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(headers)
        w.writerows(rows)
    print(f"  scenario_leaves.csv: {len(rows)}행")
    return len(rows)


def main():
    parser = argparse.ArgumentParser(description="scenarios.yaml → 3 CSV")
    parser.add_argument("-o", "--output", default=str(DEFAULT_OUT),
                        help="출력 폴더 (기본: data/)")
    args = parser.parse_args()

    out_dir = Path(args.output)
    if not out_dir.is_dir():
        out_dir.mkdir(parents=True, exist_ok=True)

    if not SCENARIOS_YAML.exists():
        print(f"오류: {SCENARIOS_YAML} 없음", file=sys.stderr)
        sys.exit(1)

    with open(SCENARIOS_YAML, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    print(f"[scenarios_to_csv] {len(data)}개 시나리오 변환:")
    n1 = write_meta(data, out_dir)
    n2 = write_choices(data, out_dir)
    n3 = write_leaves(data, out_dir)
    print(f"  합계: {n1 + n2 + n3}행 ({n1} + {n2} + {n3})")


if __name__ == "__main__":
    main()
