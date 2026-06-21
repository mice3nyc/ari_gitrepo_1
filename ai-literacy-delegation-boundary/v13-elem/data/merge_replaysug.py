#!/usr/bin/env python3
"""replaySuggestion 135개를 scenarios.yaml finals[leaf]에 주입.

입력 JSON: [{"scenarioId","leaf","replaySuggestion"}, ...] (백도 저작본)
무결성: replaySuggestion 외 모든 필드는 변경 전후 동일해야 함(아니면 abort).

사용: python3 data/merge_replaysug.py data/elem_replaysug_output.json
"""
import json, sys, copy
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent
YAML = ROOT / "data" / "scenarios.yaml"

def main():
    if len(sys.argv) < 2:
        sys.exit("사용: merge_replaysug.py <output.json>")
    inp = json.load(open(sys.argv[1], encoding="utf-8"))
    d = yaml.safe_load(open(YAML, encoding="utf-8"))
    before = copy.deepcopy(d)

    applied = 0; missing = []
    for o in inp:
        sid, leaf, sug = o["scenarioId"], o["leaf"], o["replaySuggestion"]
        try:
            d[sid]["finals"][leaf]["replaySuggestion"] = sug
            applied += 1
        except KeyError:
            missing.append(f"{sid}/{leaf}")

    # 무결성 검증: replaySuggestion 외 모든 것 동일
    diffs = []
    for sid in d:
        for leaf, fin in (d[sid].get("finals") or {}).items():
            b = before[sid]["finals"][leaf]
            for k in fin:
                if k == "replaySuggestion": continue
                if fin.get(k) != b.get(k):
                    diffs.append(f"{sid}/{leaf}/{k}")
    # finals 외 다른 키도 그대로인지(시나리오 레벨)
    for sid in d:
        for k in d[sid]:
            if k == "finals": continue
            if d[sid][k] != before[sid][k]:
                diffs.append(f"{sid}/{k}(scenario-level)")

    if diffs:
        sys.exit(f"ABORT — replaySuggestion 외 변경 감지: {diffs[:10]} (총 {len(diffs)})")
    if missing:
        sys.exit(f"ABORT — 매칭 실패 leaf: {missing}")

    # 빈 replaySuggestion 남았는지
    empties = [f"{sid}/{leaf}" for sid in d for leaf, fin in d[sid]["finals"].items()
               if not str(fin.get("replaySuggestion", "")).strip()]

    yaml.dump(d, open(YAML, "w", encoding="utf-8"),
              allow_unicode=True, sort_keys=False, width=4096, default_flow_style=False)
    print(f"OK — replaySuggestion {applied}개 주입. 무결성 검증 통과(다른 필드 변경 0).")
    print(f"남은 빈 replaySuggestion: {len(empties)}" + (f" {empties[:5]}" if empties else ""))

if __name__ == "__main__":
    main()
