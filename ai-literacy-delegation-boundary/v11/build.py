#!/usr/bin/env python3
"""Build a single-file client bundle from distributed source files.

Source layout:
  - src/index.shell.html        → HTML shell with CSS/JS placeholders
  - src/styles/*.css            → concatenated into the shell <style>
  - src/js/*.js                 → concatenated into the shell <script>
  - data/scenarios.yaml         → injected as SCENARIOS
  - data/cuts.yaml              → injected as CUT_IMAGES
  - data/texts.yaml             → injected as TEXTS

The output remains a standalone `index.html`, so classroom/file sharing
deployment keeps the same ergonomics while development happens in smaller
files.
"""
import json
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요: pip install pyyaml")

ROOT = Path(__file__).parent
SRC = ROOT / "src"
SHELL = SRC / "index.shell.html"
STYLES_DIR = SRC / "styles"
JS_DIR = SRC / "js"
SCENARIOS_YAML = ROOT / "data" / "scenarios.yaml"
CUTS_YAML = ROOT / "data" / "cuts.yaml"
TEXTS_YAML = ROOT / "data" / "texts.yaml"
OUTPUT = ROOT / "index.html"

CSS_PLACEHOLDER = "/* __CSS_INJECT__ */"
JS_PLACEHOLDER = "// __JS_INJECT__"
DATA_PLACEHOLDER = "// __SCENARIOS_INJECT__"

EXPECTED_SCENARIO_KEYS = ["selfintro", "groupwork", "eorinwangja", "career", "studyplan"]


def load_yaml(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


def read_parts(directory, suffix):
    paths = sorted(directory.glob(f"*{suffix}"))
    if not paths:
        sys.exit(f"source 파일 없음: {directory}/*{suffix}")
    return "".join(path.read_text(encoding="utf-8") for path in paths), paths


def build_data_injection():
    scenarios = load_yaml(SCENARIOS_YAML)
    cuts = load_yaml(CUTS_YAML)
    texts = load_yaml(TEXTS_YAML)

    keys = list(scenarios.keys())
    if keys != EXPECTED_SCENARIO_KEYS:
        sys.exit(f"scenarios.yaml 키 순서 불일치: expected {EXPECTED_SCENARIO_KEYS}, got {keys}")

    cut_default = cuts.get("default")
    if not cut_default:
        sys.exit("cuts.yaml: 'default' 키 누락")

    required_text_keys = [
        "humanCentricCards",
        "domainCards",
        "growthCards",
        "cards",
        "narrative",
        "ui_messages",
        "report",
    ]
    missing = [k for k in required_text_keys if k not in (texts or {})]
    if missing:
        print(f"[warn] texts.yaml 누락 키: {missing} — 코드 fallback 사용")

    scenarios_json = json.dumps(scenarios, ensure_ascii=False, indent=2)
    cuts_json = json.dumps(cut_default, ensure_ascii=False, indent=2)
    texts_json = json.dumps(texts or {}, ensure_ascii=False, indent=2)

    inject = (
        "// =====================================================\n"
        "// 4. Scenario Data — 자동 생성 (build.py ← data/*.yaml). 직접 수정 금지\n"
        "// =====================================================\n"
        f"var SCENARIOS = {scenarios_json};\n"
        f"var CUT_IMAGES = {cuts_json};\n"
        f"var TEXTS = {texts_json};"
    )

    return inject, scenarios, cut_default, texts


def main():
    if not SHELL.exists():
        sys.exit(f"HTML shell 없음: {SHELL}")

    shell = SHELL.read_text(encoding="utf-8")
    for placeholder in (CSS_PLACEHOLDER, JS_PLACEHOLDER):
        if placeholder not in shell:
            sys.exit(f"shell에 placeholder({placeholder}) 없음")

    css, css_paths = read_parts(STYLES_DIR, ".css")
    js, js_paths = read_parts(JS_DIR, ".js")

    if DATA_PLACEHOLDER not in js:
        sys.exit(f"JS source에 placeholder({DATA_PLACEHOLDER}) 없음")

    inject, scenarios, cut_default, texts = build_data_injection()
    js = js.replace(DATA_PLACEHOLDER, inject)

    out = shell.replace(CSS_PLACEHOLDER, css).replace(JS_PLACEHOLDER, js)
    OUTPUT.write_text(out, encoding="utf-8")

    size = OUTPUT.stat().st_size
    print(f"built: {OUTPUT} ({size:,} bytes)")
    print(f"  css parts: {len(css_paths)}")
    print(f"  js parts: {len(js_paths)}")
    print(f"  scenarios: {len(scenarios)} keys ({', '.join(scenarios.keys())})")
    print(f"  cuts.default: {len(cut_default)} entries")
    if texts:
        print(
            f"  texts: cards={len((texts.get('cards') or {}))}, "
            f"narrative.types={len(((texts.get('narrative') or {}).get('types') or {}))}, "
            f"ui_messages={len((texts.get('ui_messages') or {}))}, "
            f"report keys={len((texts.get('report') or {}))}"
        )


if __name__ == "__main__":
    main()
