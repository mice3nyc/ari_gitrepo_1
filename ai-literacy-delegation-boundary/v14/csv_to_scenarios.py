#!/usr/bin/env python3
"""
3 CSV → scenarios.yaml 역변환

입력:
  data/scenario_meta.csv
  data/scenario_choices.csv
  data/scenario_leaves.csv

출력: data/scenarios.yaml

사용:
  python3 csv_to_scenarios.py                          # 기본 경로
  python3 csv_to_scenarios.py -i ~/Downloads/          # CSV 폴더 지정
  python3 csv_to_scenarios.py --verify                 # 기존 YAML과 비교

round-trip:
  scenarios_to_csv.py → Google Sheets 편집 → csv_to_scenarios.py → build.py
"""

import csv
import sys
import argparse
from pathlib import Path
from collections import OrderedDict

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요: pip install pyyaml")

ROOT = Path(__file__).parent
DEFAULT_CSV_DIR = ROOT / "data"
SCENARIOS_YAML = ROOT / "data" / "scenarios.yaml"

SEP = ";"


class _Dumper(yaml.Dumper):
    pass


def _str_representer(dumper, data):
    if "\n" in data:
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="|")
    if any(c in data for c in [":", "#", "{", "}", "[", "]", ",", "&", "*", "?", "|", "-", "<", ">", "=", "!", "%", "@", "`"]):
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="'")
    if data in ("true", "false", "yes", "no", "on", "off", "null", "~"):
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="'")
    if data.startswith(("'", '"')) or data.startswith(" ") or data.endswith(" "):
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="'")
    try:
        float(data)
        return dumper.represent_scalar("tag:yaml.org,2002:str", data, style="'")
    except ValueError:
        pass
    return dumper.represent_scalar("tag:yaml.org,2002:str", data)


def _dict_representer(dumper, data):
    return dumper.represent_mapping("tag:yaml.org,2002:map", data.items())


_Dumper.add_representer(str, _str_representer)
_Dumper.add_representer(OrderedDict, _dict_representer)


def _str_to_list(s):
    if not s or not s.strip():
        return []
    return [x.strip() for x in s.split(SEP) if x.strip()]


def _str_to_dict(s):
    """key:value pairs string → dict."""
    if not s or not s.strip():
        return {}
    result = OrderedDict()
    for pair in s.split(SEP):
        pair = pair.strip()
        if ":" in pair:
            k, v = pair.split(":", 1)
            result[k.strip()] = v.strip()
    return result


def _int_or(s, default=0):
    if not s or not s.strip():
        return default
    try:
        return int(s)
    except ValueError:
        try:
            return int(float(s))
        except ValueError:
            return default


def _bool_val(s):
    if not s:
        return False
    return s.strip().lower() in ("true", "1", "yes")


def _s(s):
    return s.strip() if s else ""


def read_csv(path):
    with open(path, encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def build_discount_tags(row, prefix="", include_strong_domain=True):
    p = prefix
    hc = _s(row.get(f"{p}discountTags_humanCentric", ""))
    dom = _str_to_list(row.get(f"{p}discountTags_domain", ""))
    sdom = _str_to_list(row.get(f"{p}discountTags_strongDomain", ""))
    dt = OrderedDict()
    dt["humanCentric"] = hc
    dt["domain"] = dom
    if include_strong_domain:
        dt["strongDomain"] = sdom
    elif sdom:
        dt["strongDomain"] = sdom
    return dt


def rebuild(csv_dir):
    meta_rows = read_csv(csv_dir / "scenario_meta.csv")
    choice_rows = read_csv(csv_dir / "scenario_choices.csv")
    leaf_rows = read_csv(csv_dir / "scenario_leaves.csv")

    scenarios = OrderedDict()

    for m in meta_rows:
        sid = _s(m["scenario_id"])
        sc = OrderedDict()
        sc["id"] = sid
        sc["category"] = _int_or(m["category"])
        sc["categoryName"] = _s(m["categoryName"])
        sc["title"] = _s(m["title"])
        sc["version"] = _s(m["version"])
        sc["learningMessage"] = _s(m["learningMessage"])
        sc["aiSuitability"] = _s(m["aiSuitability"])
        sc["timeBudgetSec"] = _int_or(m["timeBudgetSec"])
        sc["domainPool"] = _str_to_list(m["domainPool"])
        dl = _s(m.get("domainLabel", ""))
        if dl:
            sc["domainLabel"] = dl
        sc["situation"] = OrderedDict([
            ("text", _s(m["situation_text"])),
            ("image", _s(m["situation_image"])),
        ])
        sc["tier1"] = []
        sc["tier2"] = OrderedDict([("A", []), ("B", []), ("C", [])])
        sc["results"] = OrderedDict()
        sc["reviews"] = []
        sc["reviewSupplements"] = OrderedDict()
        sc["matchGroups"] = OrderedDict()
        sc["finals"] = OrderedDict()
        sc["axisDelta"] = []
        sc["resourceCosts"] = OrderedDict()
        sc["expRewards"] = OrderedDict()
        sc["competencyCards"] = OrderedDict()
        sc["reviewLabels"] = OrderedDict()
        sc["stageCosts"] = OrderedDict([
            ("tier1", OrderedDict()),
            ("tier2", OrderedDict()),
            ("review", OrderedDict()),
        ])
        sc["reportData"] = OrderedDict()

        cuts_str = _s(m.get("cuts", ""))
        if cuts_str:
            sc["cuts"] = _str_to_dict(cuts_str)

        sem_text = _s(m.get("semesterClosing_text", ""))
        if sem_text:
            sc["semesterClosing"] = OrderedDict([
                ("text", sem_text),
                ("image", _s(m.get("semesterClosing_image", ""))),
            ])

        scenarios[sid] = sc

    for row in choice_rows:
        sid = _s(row["scenario_id"])
        sc = scenarios[sid]
        ctype = _s(row["type"])
        cid = _s(row["id"])

        if ctype == "tier1":
            t1 = OrderedDict()
            t1["id"] = cid
            t1["label"] = _s(row["label"])
            t1["desc"] = _s(row["desc"])
            t1["lesson"] = _s(row["lesson"])
            t1["delegation"] = _s(row["delegation"])
            t1["knowledge"] = _s(row["knowledge"])
            t1["basePoint"] = _int_or(row["basePoint"])
            t1["varPoint"] = _int_or(row["varPoint"])
            t1["discountTags"] = build_discount_tags(row, include_strong_domain=False)
            sc["tier1"].append(t1)

            sc["stageCosts"]["tier1"][cid] = OrderedDict([
                ("time", _int_or(row["stageCost_time"])),
                ("energy", _int_or(row["stageCost_energy"])),
            ])

        elif ctype == "tier2":
            parent = _s(row["parent"])
            t2 = OrderedDict()
            t2["id"] = cid
            t2["label"] = _s(row["label"])

            has_delta = any(
                _s(row.get(f"delta_{ak}_{dk}", ""))
                for ak in ["afterA", "afterB", "afterC"]
                for dk in ["del", "know"]
            )
            has_direct = bool(_s(row.get("delegation", "")) or _s(row.get("knowledge", "")))

            if has_delta:
                delta = OrderedDict()
                for after_key in ["afterA", "afterB", "afterC"]:
                    d = _s(row.get(f"delta_{after_key}_del", ""))
                    k = _s(row.get(f"delta_{after_key}_know", ""))
                    if d or k:
                        delta[after_key] = OrderedDict([
                            ("delegation", d),
                            ("knowledge", k),
                        ])
                t2["delta"] = delta
            elif has_direct:
                t2["delegation"] = _s(row["delegation"])
                t2["knowledge"] = _s(row["knowledge"])

            t2["lesson"] = _s(row["lesson"])
            t2["basePoint"] = _int_or(row["basePoint"])
            t2["varPoint"] = _int_or(row["varPoint"])
            t2["discountTags"] = build_discount_tags(row)
            sc["tier2"][parent].append(t2)

            result = OrderedDict()
            rt = _s(row.get("result_text", ""))
            if rt:
                result["text"] = rt
                rbp = _s(row.get("result_basePoint", ""))
                if rbp:
                    result["basePoint"] = _int_or(rbp)
                result["deltaR2"] = _int_or(row.get("result_deltaR2"))
                result["deltaR3"] = _int_or(row.get("result_deltaR3"))
                result["summary"] = _s(row.get("result_summary", ""))
                result["lesson"] = _s(row.get("result_lesson", ""))
                rhi = _str_to_list(row.get("result_hiddenIssues", ""))
                if rhi:
                    result["hiddenIssues"] = rhi
            sc["results"][cid] = result

            mg = _str_to_list(row.get("matchGroups", ""))
            sc["matchGroups"][cid] = mg

            sc["stageCosts"]["tier2"][cid] = OrderedDict([
                ("time", _int_or(row["stageCost_time"])),
                ("energy", _int_or(row["stageCost_energy"])),
            ])

        elif ctype == "review":
            rv = OrderedDict()
            rv["id"] = cid
            rv["label"] = _s(row["label"])
            rv["desc"] = _s(row["desc"])
            rv["boostType"] = _s(row.get("boostType", ""))
            rv["lesson"] = _s(row["lesson"])
            rv["points"] = _int_or(row.get("points"))
            rv["discountTags"] = build_discount_tags(row)
            sc["reviews"].append(rv)

            sc["stageCosts"]["review"][cid] = OrderedDict([
                ("time", _int_or(row["stageCost_time"])),
                ("energy", _int_or(row["stageCost_energy"])),
            ])

    for row in leaf_rows:
        sid = _s(row["scenario_id"])
        sc = scenarios[sid]
        leaf = _s(row["leaf"])

        sc["reviewSupplements"][leaf] = _s(row.get("reviewSupplement", ""))
        sc["reviewLabels"][leaf] = _s(row.get("reviewLabel", ""))

        sc["resourceCosts"][leaf] = OrderedDict([
            ("time", _int_or(row.get("resourceCost_time"))),
            ("energy", _int_or(row.get("resourceCost_energy"))),
        ])

        sc["expRewards"][leaf] = _int_or(row.get("expReward"))

        cc = _str_to_list(row.get("competencyCards", ""))
        sc["competencyCards"][leaf] = cc

        req_card = _s(row.get("axisDelta_requireCard", ""))
        if req_card:
            sc["axisDelta"].append(OrderedDict([
                ("leafId", leaf),
                ("requireCard", req_card),
                ("bonusPoint", _int_or(row.get("axisDelta_bonusPoint"))),
                ("note", _s(row.get("axisDelta_note", ""))),
            ]))

        fn = OrderedDict()
        fn["score"] = _int_or(row.get("finals_score"))
        fn["grade"] = _s(row.get("finals_grade", ""))
        item_val = _s(row.get("finals_item", ""))
        fn["item"] = item_val if item_val else None
        fn["delegation"] = _s(row.get("finals_delegation", ""))
        fn["knowledge"] = _s(row.get("finals_knowledge", ""))
        fn["awareness"] = _s(row.get("finals_awareness", ""))
        fn["cut6Feedback"] = _s(row.get("finals_cut6Feedback", ""))
        fn["replaySuggestion"] = _s(row.get("finals_replaySuggestion", ""))
        fn["cardEarned"] = _bool_val(row.get("finals_cardEarned", ""))
        fn["humanCentricAxis"] = _s(row.get("finals_humanCentricAxis", ""))
        fn["humanCentricTag"] = _s(row.get("finals_humanCentricTag", ""))
        fn["domainCards"] = _str_to_list(row.get("finals_domainCards", ""))
        fn["growthCard"] = _s(row.get("finals_growthCard", ""))
        fn["replayCardStatus"] = _s(row.get("finals_replayCardStatus", ""))
        fn["expReward"] = _int_or(row.get("finals_expReward"))
        fn["reportPathSummary"] = _s(row.get("finals_reportPathSummary", ""))
        fn["cartoonCaption1"] = _s(row.get("finals_cartoonCaption1", ""))
        fn["cartoonCaption2"] = _s(row.get("finals_cartoonCaption2", ""))
        fn["cartoonCaption3"] = _s(row.get("finals_cartoonCaption3", ""))
        fn["cartoonCaption4"] = _s(row.get("finals_cartoonCaption4", ""))
        fn["cartoonCaption5"] = _s(row.get("finals_cartoonCaption5", ""))
        fn["reportReflection"] = _s(row.get("finals_reportReflection", ""))
        fn["reportCardSummary"] = _s(row.get("finals_reportCardSummary", ""))
        fn["reportStrengthTags"] = _str_to_list(row.get("finals_reportStrengthTags", ""))
        fn["reportGrowthTags"] = _s(row.get("finals_reportGrowthTags", ""))
        fn["adjustedScore"] = _int_or(row.get("finals_adjustedScore"))
        fn["adjustedType"] = _s(row.get("finals_adjustedType", ""))
        fn["adjustedReason"] = _s(row.get("finals_adjustedReason", ""))
        fn["shortFeedback"] = _s(row.get("finals_shortFeedback", ""))
        fn["reportFeedback"] = _s(row.get("finals_reportFeedback", ""))
        ec = _s(row.get("finals_earnedCards", ""))
        if ec:
            fn["earnedCards"] = ec
        sc["finals"][leaf] = fn

        rd = OrderedDict()
        rd["pathSummary"] = fn["reportPathSummary"]
        rd["caption1"] = fn["cartoonCaption1"]
        rd["caption2"] = fn["cartoonCaption2"]
        rd["caption3"] = fn["cartoonCaption3"]
        rd["caption4"] = fn["cartoonCaption4"]
        rd["caption5"] = fn["cartoonCaption5"]
        rd["reflection"] = fn["reportReflection"]
        rd["cardSummary"] = fn["reportCardSummary"]
        strength = fn.get("reportStrengthTags", [])
        rd["strengthTags"] = SEP.join(strength) if strength else ""
        rd["growthTags"] = fn["reportGrowthTags"]
        sc["reportData"][leaf] = rd

    return scenarios


def to_yaml(scenarios):
    return yaml.dump(
        scenarios,
        Dumper=_Dumper,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
        width=120,
    )


def _normalize(obj):
    """Convert OrderedDicts to dicts recursively for comparison."""
    if isinstance(obj, (dict, OrderedDict)):
        return {k: _normalize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_normalize(v) for v in obj]
    return obj


def deep_compare(a, b, path=""):
    diffs = []
    a = _normalize(a)
    b = _normalize(b)
    return _deep_cmp(a, b, path, diffs)


def _deep_cmp(a, b, path, diffs):
    if type(a) != type(b):
        if isinstance(a, (int, float)) and isinstance(b, (int, float)):
            if a != b:
                diffs.append(f"{path}: {a!r} != {b!r}")
        else:
            diffs.append(f"{path}: type {type(a).__name__} != {type(b).__name__}")
        return diffs

    if isinstance(a, dict):
        all_keys = set(list(a.keys()) + list(b.keys()))
        for k in sorted(all_keys):
            if k not in a:
                diffs.append(f"{path}.{k}: missing in rebuilt")
            elif k not in b:
                diffs.append(f"{path}.{k}: extra in rebuilt")
            else:
                _deep_cmp(a[k], b[k], f"{path}.{k}", diffs)
    elif isinstance(a, list):
        if len(a) != len(b):
            diffs.append(f"{path}: list len {len(a)} != {len(b)}")
        for i in range(min(len(a), len(b))):
            _deep_cmp(a[i], b[i], f"{path}[{i}]", diffs)
    else:
        if a != b:
            diffs.append(f"{path}: {a!r} != {b!r}")
    return diffs


def main():
    parser = argparse.ArgumentParser(description="3 CSV → scenarios.yaml")
    parser.add_argument("-i", "--input", default=str(DEFAULT_CSV_DIR),
                        help="CSV 폴더 (기본: data/)")
    parser.add_argument("-o", "--output", default=str(SCENARIOS_YAML),
                        help="출력 YAML (기본: data/scenarios.yaml)")
    parser.add_argument("--verify", action="store_true",
                        help="기존 YAML과 데이터 비교 (파일 덮어쓰지 않음)")
    args = parser.parse_args()

    csv_dir = Path(args.input)
    if not csv_dir.is_dir():
        print(f"오류: {csv_dir} 폴더 없음", file=sys.stderr)
        sys.exit(1)

    for name in ["scenario_meta.csv", "scenario_choices.csv", "scenario_leaves.csv"]:
        if not (csv_dir / name).exists():
            print(f"오류: {csv_dir / name} 없음", file=sys.stderr)
            sys.exit(1)

    scenarios = rebuild(csv_dir)
    print(f"[csv_to_scenarios] {len(scenarios)}개 시나리오 복원")

    if args.verify:
        if not SCENARIOS_YAML.exists():
            print("오류: 비교할 원본 YAML 없음", file=sys.stderr)
            sys.exit(1)
        with open(SCENARIOS_YAML, encoding="utf-8") as f:
            original = yaml.safe_load(f)
        diffs = deep_compare(dict(scenarios), original)
        if diffs:
            print(f"차이 {len(diffs)}건:")
            for d in diffs[:30]:
                print(f"  {d}")
            if len(diffs) > 30:
                print(f"  ... +{len(diffs) - 30}건")
            sys.exit(1)
        else:
            print("round-trip 검증 통과 — 원본과 동일")
    else:
        out_path = Path(args.output)
        out_path.write_text(to_yaml(scenarios), encoding="utf-8")
        print(f"  → {out_path}")


if __name__ == "__main__":
    main()
