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
import shutil
import subprocess
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
MICRO_OFFSETS_YAML = ROOT / "data" / "micro_offsets.yaml"
AI_FLAGS_YAML = ROOT / "data" / "ai_flags.yaml"
OUTPUT = ROOT / "index.html"

# 변종 빌드 (SPEC-variant §3c·§6) — 자기완결 폴더 산출용
IMAGES_DIR = ROOT.parent / "images"   # 부모 루트 공유 에셋 (135개)
FONTS_DIR = ROOT.parent / "fonts"     # Galmuri11·Mulmaru
BUILDS_DIR = ROOT / "builds"

CSS_PLACEHOLDER = "/* __CSS_INJECT__ */"
JS_PLACEHOLDER = "// __JS_INJECT__"
DATA_PLACEHOLDER = "// __SCENARIOS_INJECT__"

EXPECTED_SCENARIO_KEYS = ["selfintro", "groupwork", "eorinwangja", "career", "studyplan"]

# §3c — 변종별 CONFIG 값 주입. mid는 현재 소스 그대로(회귀 동일), elem은 키 분리.
# 전체 문자열 교체(정확 매칭)로 'mid'(resultTextsByType 등) 오염 없이 안전.
# 배포(변종) 빌드는 디버그 OFF — 학교 라이브에서 디버그 UI 숨김 (피터공 6/18)
_DEBUG_OFF = {"debug:true": "debug:false"}
VARIANT_CONFIG_REPLACEMENTS = {
    "mid": dict(_DEBUG_OFF),  # 키는 소스(mid) 그대로, 디버그만 OFF
    "elem": {
        "storageKey:'ai-literacy-delegation-boundary-v13-mid'":
            "storageKey:'ai-literacy-delegation-boundary-v13-elem'",
        "eventLogKey:'ai-literacy-delegation-boundary-v13-mid-events'":
            "eventLogKey:'ai-literacy-delegation-boundary-v13-elem-events'",
        "sessionIdKey:'ai-literacy-v13-mid-session-id'":
            "sessionIdKey:'ai-literacy-v13-elem-session-id'",
        "outboxKey:'ai-literacy-delegation-boundary-v13-mid-outbox'":
            "outboxKey:'ai-literacy-delegation-boundary-v13-elem-outbox'",
        "version:'v1.3-mid-r39'":
            "version:'v1.3-elem-r39'",
        "gameId:'ai_literacy_md'":   # 동현공 참여 로깅 게임 ID — 초등
            "gameId:'ai_literacy_el'",
        "debug:true": "debug:false",
    },
}


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

    # SPEC-report §4d-2 — 마이크로 항로 2차 깊이 보정값. tier2 id 전수 일치 검증
    micro = load_yaml(MICRO_OFFSETS_YAML) if MICRO_OFFSETS_YAML.exists() else {}
    for scid, sc in scenarios.items():
        t2ids = sorted(o["id"] for arr in (sc.get("tier2") or {}).values() for o in arr)
        moids = sorted((micro.get(scid) or {}).keys())
        if t2ids != moids:
            sys.exit(f"micro_offsets.yaml 불일치 [{scid}]: tier2 {t2ids} vs offsets {moids}")
        bad = [k for k, v in (micro.get(scid) or {}).items() if v not in (-1, 0, 1)]
        if bad:
            sys.exit(f"micro_offsets.yaml 값 오류 [{scid}]: {bad} (허용: -1/0/1)")

    # SPEC-report §4e-1 — 항로 AI 표시. tier1+tier2 id 전수 일치 검증
    aiflags = load_yaml(AI_FLAGS_YAML) if AI_FLAGS_YAML.exists() else {}
    for scid, sc in scenarios.items():
        ids = sorted(t["id"] for t in (sc.get("tier1") or []))
        ids += sorted(o["id"] for arr in (sc.get("tier2") or {}).values() for o in arr)
        afids = sorted((aiflags.get(scid) or {}).keys())
        if sorted(ids) != afids:
            sys.exit(f"ai_flags.yaml 불일치 [{scid}]: choices {sorted(ids)} vs flags {afids}")
        bad = [k for k, v in (aiflags.get(scid) or {}).items() if not isinstance(v, bool)]
        if bad:
            sys.exit(f"ai_flags.yaml 값 오류 [{scid}]: {bad} (허용: true/false)")

    scenarios_json = json.dumps(scenarios, ensure_ascii=False, indent=2)
    cuts_json = json.dumps(cut_default, ensure_ascii=False, indent=2)
    texts_json = json.dumps(texts or {}, ensure_ascii=False, indent=2)
    micro_json = json.dumps(micro or {}, ensure_ascii=False, indent=2)
    aiflags_json = json.dumps(aiflags or {}, ensure_ascii=False, indent=2)

    inject = (
        "// =====================================================\n"
        "// 4. Scenario Data — 자동 생성 (build.py ← data/*.yaml). 직접 수정 금지\n"
        "// =====================================================\n"
        f"var SCENARIOS = {scenarios_json};\n"
        f"var CUT_IMAGES = {cuts_json};\n"
        f"var TEXTS = {texts_json};\n"
        f"var MICRO_OFFSETS = {micro_json};\n"
        f"var AI_FLAGS = {aiflags_json};"
    )

    return inject, scenarios, cut_default, texts


def assemble_html(variant=None):
    """공유 src + data를 합쳐 단일 HTML 문자열을 만든다. variant 지정 시 CONFIG 값 분리."""
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

    # §3c — 변종 CONFIG 값 주입 (정확 문자열 교체)
    if variant:
        for old, new in VARIANT_CONFIG_REPLACEMENTS.get(variant, {}).items():
            if old not in js:
                sys.exit(f"변종 CONFIG 주입 실패: 소스에 '{old}' 없음 (00-config.js 변경됨?)")
            js = js.replace(old, new)

    out = shell.replace(CSS_PLACEHOLDER, css).replace(JS_PLACEHOLDER, js)
    stats = {"css": len(css_paths), "js": len(js_paths), "scenarios": scenarios,
             "cut_default": cut_default, "texts": texts}
    return out, stats


def _minify_js_in_html(html):
    """--release: 번들 JS를 terser로 1단계 minify. 없으면 평문 유지(경고)."""
    # <script>...</script> 마지막 큰 블록만 대상 — shell 구조상 단일 인라인 스크립트
    import re
    m = re.search(r"(<script>)(.*?)(</script>)", html, re.S)
    if not m:
        print("  [release] <script> 블록 못 찾음 — minify 생략")
        return html
    code = m.group(2)
    try:
        p = subprocess.run(["npx", "--yes", "terser", "--compress", "--mangle"],
                           input=code, capture_output=True, text=True, timeout=180)
        if p.returncode != 0 or not p.stdout.strip():
            print(f"  [release] terser 실패 — 평문 유지 ({(p.stderr or '').strip()[:80]})")
            return html
        return html[:m.start(2)] + p.stdout + html[m.end(2):]
    except Exception as e:
        print(f"  [release] terser 미설치/오류 — 평문 유지 ({e}). 설치: npm i -g terser")
        return html


def _copy_assets(dest_dir):
    """§6b — 자기완결: 이미지·폰트를 빌드 폴더로 복사."""
    for src in (IMAGES_DIR, FONTS_DIR):
        if not src.exists():
            sys.exit(f"에셋 폴더 없음: {src}")
        dst = dest_dir / src.name
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    n_img = len(list((dest_dir / "images").glob("*")))
    n_font = len(list((dest_dir / "fonts").glob("*")))
    return n_img, n_font


def build_variant(variant, release=False):
    """§3a·§6 — 변종 자기완결 폴더 builds/{variant}/ 산출."""
    html, stats = assemble_html(variant)
    # 자기완결: ../images → images, ../fonts → fonts (에셋을 같은 폴더에 복사하므로)
    html = html.replace("../images/", "images/").replace("../fonts/", "fonts/")
    if release:
        html = _minify_js_in_html(html)
    dest = BUILDS_DIR / variant
    dest.mkdir(parents=True, exist_ok=True)
    out_html = dest / "index.html"
    out_html.write_text(html, encoding="utf-8")
    n_img, n_font = _copy_assets(dest)
    size = out_html.stat().st_size
    print(f"built variant [{variant}]{' +release' if release else ''}: {out_html} ({size:,} bytes)")
    print(f"  자기완결: images {n_img}개 + fonts {n_font}개 복사 → {dest}/ 통째 배포 단위")
    print(f"  js parts: {stats['js']} / scenarios: {len(stats['scenarios'])}")


def build_root():
    """기존 동작 — 루트 index.html (개발·로컬 플레이테스트용, 부모 ../images 참조)."""
    html, stats = assemble_html(None)
    OUTPUT.write_text(html, encoding="utf-8")
    size = OUTPUT.stat().st_size
    print(f"built: {OUTPUT} ({size:,} bytes)")
    print(f"  css parts: {stats['css']}")
    print(f"  js parts: {stats['js']}")
    print(f"  scenarios: {len(stats['scenarios'])} keys ({', '.join(stats['scenarios'].keys())})")
    print(f"  cuts.default: {len(stats['cut_default'])} entries")
    texts = stats["texts"]
    if texts:
        print(
            f"  texts: cards={len((texts.get('cards') or {}))}, "
            f"narrative.types={len(((texts.get('narrative') or {}).get('types') or {}))}, "
            f"ui_messages={len((texts.get('ui_messages') or {}))}, "
            f"report keys={len((texts.get('report') or {}))}"
        )


def main():
    args = sys.argv[1:]
    release = "--release" in args
    variant = None
    for a in args:
        if a.startswith("--variant="):
            variant = a.split("=", 1)[1].strip()
    if variant:
        if variant not in VARIANT_CONFIG_REPLACEMENTS:
            sys.exit(f"알 수 없는 변종: {variant} (mid|elem)")
        build_variant(variant, release=release)
    else:
        build_root()


if __name__ == "__main__":
    main()
