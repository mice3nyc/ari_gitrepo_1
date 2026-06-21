#!/usr/bin/env python3
"""초등 v13-elem 전체 데이터 CSV 익스포트 (한 행 = 한 leaf, 135행).

전체 텍스트 + 시간/에너지 비용 + 점수 + 역량카드 등 모든 leaf 단위 데이터를
사람이 한 시트에서 검토할 수 있는 평면 CSV로 내보낸다.

사용:
  python3 data/export_full_csv.py                 # data/elem_full_data.csv + Downloads 사본
  python3 data/export_full_csv.py --out PATH       # 출력 경로 지정

원본: data/scenarios.yaml (사실상 소스 오브 트루스)
"""
import csv, sys, shutil
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요")

ROOT = Path(__file__).resolve().parent.parent
YAML = ROOT / "data" / "scenarios.yaml"
DEFAULT_OUT = ROOT / "data" / "elem_full_data.csv"
DOWNLOADS = Path.home() / "Downloads" / "AI리터러시_초등_전체데이터.csv"

def j(v):
    """리스트는 ; 로 join, None은 빈칸."""
    if v is None: return ""
    if isinstance(v, list): return ";".join(str(x) for x in v if x is not None and str(x) != "")
    return str(v)

def find_label(arr, cid, key="label"):
    for o in (arr or []):
        if o.get("id") == cid: return o.get(key, "")
    return ""

COLUMNS = [
    # --- 시나리오 메타 ---
    "scenarioId", "scenario_title", "category", "categoryName",
    "learningMessage", "domainLabel", "aiSuitability", "timeBudgetSec", "situation",
    # --- 경로 ---
    "leaf", "tier1_id", "tier1_label", "tier2_id", "tier2_label",
    "review_id", "review_label",
    # --- 시간/에너지 비용 ---
    "tier1_time", "tier1_energy", "tier2_time", "tier2_energy",
    "review_time", "review_energy", "total_time", "total_energy",
    # --- 점수 / 보상 ---
    "tier1_points", "tier2_points", "review_points", "finalScore", "grade", "expReward",
    # --- 역량/능력 카드 ---
    "competencyCards", "humanCentricAxis", "humanCentricTag", "domainCards", "growthCard",
    # --- 선택 단계 텍스트 ---
    "tier1_desc", "tier1_lesson", "tier2_desc", "tier2_lesson",
    "review_desc", "review_lesson", "result_text", "result_summary",
    # --- 결과/리포트/만화 텍스트 ---
    "awareness", "shortFeedback", "cut6Feedback", "reviewSupplement",
    "reportReflection", "reportPathSummary", "reportFeedback", "replaySuggestion",
    "cartoonCaption1", "cartoonCaption2", "cartoonCaption3", "cartoonCaption4", "cartoonCaption5",
]

def main():
    out = DEFAULT_OUT
    if "--out" in sys.argv:
        out = Path(sys.argv[sys.argv.index("--out") + 1])
    d = yaml.safe_load(open(YAML, encoding="utf-8"))
    rows = []
    for sid, sc in d.items():
        finals = sc.get("finals", {}) or {}
        tier1 = sc.get("tier1", []) or []
        tier2 = sc.get("tier2", {}) or {}
        reviews = sc.get("reviews", []) or []
        results = sc.get("results", {}) or {}
        stageCosts = sc.get("stageCosts", {}) or {}
        resCosts = sc.get("resourceCosts", {}) or {}
        expR = sc.get("expRewards", {}) or {}
        compC = sc.get("competencyCards", {}) or {}
        revLabels = sc.get("reviewLabels", {}) or {}
        revSupp = sc.get("reviewSupplements", {}) or {}
        sit = (sc.get("situation") or {}).get("text", "") if isinstance(sc.get("situation"), dict) else sc.get("situation", "")
        for leaf in sorted(finals):
            fin = finals[leaf]
            t1, t2id, rv = leaf[0], leaf[:2], leaf[2:]
            t1obj = next((o for o in tier1 if o.get("id") == t1), {})
            t2obj = next((o for o in (tier2.get(t1) or []) if o.get("id") == t2id), {})
            rvobj = next((o for o in reviews if o.get("id") == rv), {})
            res = results.get(t2id, {}) or {}
            sc1 = stageCosts.get("tier1", {}).get(t1, {}) or {}
            sc2 = stageCosts.get("tier2", {}).get(t2id, {}) or {}
            sc3 = stageCosts.get("review", {}).get(rv, {}) or {}
            total = resCosts.get(leaf, {}) or {}
            row = {
                "scenarioId": sid, "scenario_title": sc.get("title", ""),
                "category": sc.get("category", ""), "categoryName": sc.get("categoryName", ""),
                "learningMessage": sc.get("learningMessage", ""), "domainLabel": sc.get("domainLabel", ""),
                "aiSuitability": sc.get("aiSuitability", ""), "timeBudgetSec": sc.get("timeBudgetSec", ""),
                "situation": sit,
                "leaf": leaf, "tier1_id": t1, "tier1_label": t1obj.get("label", ""),
                "tier2_id": t2id, "tier2_label": t2obj.get("label", ""),
                "review_id": rv, "review_label": revLabels.get(leaf, "") or rvobj.get("label", ""),
                "tier1_time": sc1.get("time", ""), "tier1_energy": sc1.get("energy", ""),
                "tier2_time": sc2.get("time", ""), "tier2_energy": sc2.get("energy", ""),
                "review_time": sc3.get("time", ""), "review_energy": sc3.get("energy", ""),
                "total_time": total.get("time", ""), "total_energy": total.get("energy", ""),
                "tier1_points": t1obj.get("basePoint", ""), "tier2_points": t2obj.get("basePoint", ""),
                "review_points": rvobj.get("points", ""), "finalScore": fin.get("score", ""),
                "grade": fin.get("grade", ""), "expReward": expR.get(leaf, fin.get("expReward", "")),
                "competencyCards": j(compC.get(leaf)), "humanCentricAxis": fin.get("humanCentricAxis", ""),
                "humanCentricTag": fin.get("humanCentricTag", ""), "domainCards": j(fin.get("domainCards")),
                "growthCard": fin.get("growthCard", ""),
                "tier1_desc": t1obj.get("desc", ""), "tier1_lesson": t1obj.get("lesson", ""),
                "tier2_desc": t2obj.get("desc", ""), "tier2_lesson": t2obj.get("lesson", ""),
                "review_desc": rvobj.get("desc", ""), "review_lesson": rvobj.get("lesson", ""),
                "result_text": res.get("text", ""), "result_summary": res.get("summary", ""),
                "awareness": fin.get("awareness", ""), "shortFeedback": fin.get("shortFeedback", ""),
                "cut6Feedback": fin.get("cut6Feedback", ""), "reviewSupplement": revSupp.get(leaf, ""),
                "reportReflection": fin.get("reportReflection", ""), "reportPathSummary": fin.get("reportPathSummary", ""),
                "reportFeedback": fin.get("reportFeedback", ""), "replaySuggestion": fin.get("replaySuggestion", ""),
                "cartoonCaption1": fin.get("cartoonCaption1", ""), "cartoonCaption2": fin.get("cartoonCaption2", ""),
                "cartoonCaption3": fin.get("cartoonCaption3", ""), "cartoonCaption4": fin.get("cartoonCaption4", ""),
                "cartoonCaption5": fin.get("cartoonCaption5", ""),
            }
            rows.append(row)
    with open(out, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        for r in rows: w.writerow({k: j(r.get(k, "")) if isinstance(r.get(k), list) else r.get(k, "") for k in COLUMNS})
    print(f"OK — {len(rows)}행 → {out}")
    DOWNLOADS.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(out, DOWNLOADS)
    print(f"Downloads 사본 → {DOWNLOADS}")

if __name__ == "__main__":
    main()
