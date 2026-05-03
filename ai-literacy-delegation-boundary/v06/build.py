#!/usr/bin/env python3
"""v0.6 빌드: data/*.yaml + index.html.template → index.html

사용:
  python3 build.py

의존성: PyYAML (`pip install pyyaml`)

inject 흐름:
  - data/scenarios.yaml → window.SCENARIOS
  - data/cuts.yaml      → window.CUT_IMAGES
  - data/texts.yaml     → window.TEXTS  (5/3 — 인간 편집 텍스트 분리)

texts.yaml 수정만으로 게임 내 카드 의미·narrative·UI 메시지 갱신 가능.
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
TEXTS_YAML = ROOT / 'data' / 'texts.yaml'
OUTPUT = ROOT / 'index.html'
PLACEHOLDER = '// __SCENARIOS_INJECT__'

EXPECTED_SCENARIO_KEYS = ['selfintro', 'groupwork', 'eorinwangja', 'career', 'studyplan']


def load_yaml(path):
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f)


def main():
    scenarios = load_yaml(SCENARIOS_YAML)
    cuts = load_yaml(CUTS_YAML)
    texts = load_yaml(TEXTS_YAML)

    keys = list(scenarios.keys())
    if keys != EXPECTED_SCENARIO_KEYS:
        sys.exit(f"scenarios.yaml 키 순서 불일치: expected {EXPECTED_SCENARIO_KEYS}, got {keys}")

    cut_default = cuts.get('default')
    if not cut_default:
        sys.exit("cuts.yaml: 'default' 키 누락")

    # texts.yaml 최소 구조 검증 — 누락 시 코드의 fallback에 의존하므로 경고만
    required_text_keys = ['cards', 'narrative', 'ui_messages', 'report']
    missing = [k for k in required_text_keys if k not in (texts or {})]
    if missing:
        print(f"[warn] texts.yaml 누락 키: {missing} — 코드 fallback 사용")

    template = TEMPLATE.read_text(encoding='utf-8')
    if PLACEHOLDER not in template:
        sys.exit(f"template에 placeholder({PLACEHOLDER}) 없음")

    scenarios_json = json.dumps(scenarios, ensure_ascii=False, indent=2)
    cuts_json = json.dumps(cut_default, ensure_ascii=False, indent=2)
    texts_json = json.dumps(texts or {}, ensure_ascii=False, indent=2)

    inject = (
        '// =====================================================\n'
        '// 4. Scenario Data — 자동 생성 (build.py ← data/*.yaml). 직접 수정 금지\n'
        '// =====================================================\n'
        f'var SCENARIOS = {scenarios_json};\n'
        f'var CUT_IMAGES = {cuts_json};\n'
        f'var TEXTS = {texts_json};'
    )

    out = template.replace(PLACEHOLDER, inject)
    OUTPUT.write_text(out, encoding='utf-8')

    size = OUTPUT.stat().st_size
    print(f"built: {OUTPUT} ({size:,} bytes)")
    print(f"  scenarios: {len(scenarios)} keys ({', '.join(keys)})")
    print(f"  cuts.default: {len(cut_default)} entries")
    if texts:
        print(f"  texts: cards={len((texts.get('cards') or {}))}, "
              f"narrative.types={len(((texts.get('narrative') or {}).get('types') or {}))}, "
              f"ui_messages={len((texts.get('ui_messages') or {}))}, "
              f"report keys={len((texts.get('report') or {}))}")


if __name__ == '__main__':
    main()
