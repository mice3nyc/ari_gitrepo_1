#!/usr/bin/env python3
"""v0.5 빌드: data/*.yaml + index.html.template → index.html

사용:
  python3 build.py

의존성: PyYAML (`pip install pyyaml`)
"""
import json
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요: pip install pyyaml")

ROOT = Path(__file__).parent
TEMPLATE = ROOT / 'index.html.template'
SCENARIOS_YAML = ROOT / 'data' / 'scenarios.yaml'
CUTS_YAML = ROOT / 'data' / 'cuts.yaml'
OUTPUT = ROOT / 'index.html'
PLACEHOLDER = '// __SCENARIOS_INJECT__'

EXPECTED_SCENARIO_KEYS = ['selfintro', 'groupwork', 'eorinwangja', 'career', 'studyplan']


def load_yaml(path):
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)


def main():
    scenarios = load_yaml(SCENARIOS_YAML)
    cuts = load_yaml(CUTS_YAML)

    keys = list(scenarios.keys())
    if keys != EXPECTED_SCENARIO_KEYS:
        sys.exit(f"scenarios.yaml 키 순서 불일치: expected {EXPECTED_SCENARIO_KEYS}, got {keys}")

    cut_default = cuts.get('default')
    if not cut_default:
        sys.exit("cuts.yaml: 'default' 키 누락")

    template = TEMPLATE.read_text(encoding='utf-8')
    if PLACEHOLDER not in template:
        sys.exit(f"template에 placeholder({PLACEHOLDER}) 없음")

    scenarios_json = json.dumps(scenarios, ensure_ascii=False, indent=2)
    cuts_json = json.dumps(cut_default, ensure_ascii=False, indent=2)

    inject = (
        '// =====================================================\n'
        '// 4. Scenario Data — 자동 생성 (build.py ← data/*.yaml). 직접 수정 금지\n'
        '// =====================================================\n'
        f'var SCENARIOS = {scenarios_json};\n'
        f'var CUT_IMAGES = {cuts_json};'
    )

    out = template.replace(PLACEHOLDER, inject)
    OUTPUT.write_text(out, encoding='utf-8')

    size = OUTPUT.stat().st_size
    print(f"built: {OUTPUT} ({size:,} bytes)")
    print(f"  scenarios: {len(scenarios)} keys ({', '.join(keys)})")
    print(f"  cuts.default: {len(cut_default)} entries")


if __name__ == '__main__':
    main()
