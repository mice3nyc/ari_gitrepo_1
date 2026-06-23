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
DATA_DIR = ROOT / "data"

# 변종 빌드 (SPEC-variant §3c·§6) — 자기완결 폴더 산출용
IMAGES_DIR = ROOT / "images"   # v13-elem 자체 초등 이미지 (125개, 중등과 분리) — 피터공 6/21
FONTS_DIR = ROOT.parent / "fonts"     # Galmuri11·Mulmaru
BUILDS_DIR = ROOT / "builds"

CSS_PLACEHOLDER = "/* __CSS_INJECT__ */"
JS_PLACEHOLDER = "// __JS_INJECT__"
DATA_PLACEHOLDER = "// __SCENARIOS_INJECT__"

EXPECTED_SCENARIO_KEYS = ["bookreport", "animaltalk", "jobcard", "classmascot", "historycheck"]

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
        "gameId:'ai_literacy_md'":   # 동현공 참여 로깅 게임 ID — 초등
            "gameId:'ai_literacy_el'",
        # 6/23 — version·scenarios 치환 제거: v13-elem 소스가 이미 elem화됨
        #   (version:'v1.3-elem-r39', scenarios:[bookreport...]). mid→elem 치환 키가 소스에 없어 빌드 실패하던 것 해소.
        "debug:true": "debug:false",
    },
}


def load_yaml(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


# §3a 데이터-분리 — 변종 데이터 오버레이 (data/{variant}/). 오버레이 없으면 NO-OP → 중등 동작 불변.
def deep_merge(base, override):
    """dict는 키 단위 재귀 병합, list·스칼라는 통째 교체 (SPEC-variant §1)."""
    if isinstance(base, dict) and isinstance(override, dict):
        merged = dict(base)
        for k, v in override.items():
            merged[k] = deep_merge(base[k], v) if k in base else v
        return merged
    return override


def _load_variant_yaml(base_path, variant, name, merge=False):
    """base 로드 후 data/{variant}/{name} 있으면 적용.
    merge=True → deep_merge(키 병합, UI 공유). merge=False → 파일 단위 교체(변종 고유 콘텐츠)."""
    data = load_yaml(base_path) if base_path.exists() else {}
    if variant:
        ov = DATA_DIR / variant / name
        if ov.exists():
            ovd = load_yaml(ov)
            data = deep_merge(data, ovd) if merge else ovd
    return data


def read_parts(directory, suffix):
    paths = sorted(directory.glob(f"*{suffix}"))
    if not paths:
        sys.exit(f"source 파일 없음: {directory}/*{suffix}")
    return "".join(path.read_text(encoding="utf-8") for path in paths), paths


def build_data_injection(variant=None):
    # 변종 오버레이: scenarios/cuts/micro/aiflags = 파일 교체(변종 고유), texts = 키 병합(UI 공유)
    scenarios = _load_variant_yaml(SCENARIOS_YAML, variant, "scenarios.yaml")
    cuts = _load_variant_yaml(CUTS_YAML, variant, "cuts.yaml")
    texts = _load_variant_yaml(TEXTS_YAML, variant, "texts.yaml", merge=True)
    override_dir = (DATA_DIR / variant) if variant else None
    scenarios_overridden = bool(override_dir and (override_dir / "scenarios.yaml").exists())

    keys = list(scenarios.keys())
    if not scenarios_overridden:
        # 오버레이 없는 베이스(중등·루트) — 키 순서 고정 검증 유지(회귀 안전장치)
        if keys != EXPECTED_SCENARIO_KEYS:
            sys.exit(f"scenarios.yaml 키 순서 불일치: expected {EXPECTED_SCENARIO_KEYS}, got {keys}")
    elif not keys:
        sys.exit(f"변종 scenarios 비어 있음 [{variant}]")

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
    micro = _load_variant_yaml(MICRO_OFFSETS_YAML, variant, "micro_offsets.yaml")
    for scid, sc in scenarios.items():
        t2ids = sorted(o["id"] for arr in (sc.get("tier2") or {}).values() for o in arr)
        moids = sorted((micro.get(scid) or {}).keys())
        if t2ids != moids:
            sys.exit(f"micro_offsets.yaml 불일치 [{scid}]: tier2 {t2ids} vs offsets {moids}")
        bad = [k for k, v in (micro.get(scid) or {}).items() if v not in (-1, 0, 1)]
        if bad:
            sys.exit(f"micro_offsets.yaml 값 오류 [{scid}]: {bad} (허용: -1/0/1)")

    # SPEC-report §4e-1 — 항로 AI 표시. tier1+tier2 id 전수 일치 검증
    aiflags = _load_variant_yaml(AI_FLAGS_YAML, variant, "ai_flags.yaml")
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


def assemble_html(variant=None, dev=False):
    """공유 src + data를 합쳐 단일 HTML 문자열을 만든다. variant 지정 시 CONFIG 값 분리.
    dev=True면 변종 빌드라도 debug:true 유지(초등 개발 라이브 테스트용)."""
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

    inject, scenarios, cut_default, texts = build_data_injection(variant)
    js = js.replace(DATA_PLACEHOLDER, inject)

    # §3c — 변종 CONFIG 값 주입 (정확 문자열 교체)
    if variant:
        for old, new in VARIANT_CONFIG_REPLACEMENTS.get(variant, {}).items():
            if dev and old == "debug:true":
                continue  # --dev: 디버그 유지 (개발 빌드)
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


def build_variant(variant, release=False, dev=False):
    """§3a·§6 — 변종 자기완결 폴더 builds/{variant}/ 산출.
    dev=True면 디버그 켠 빌드를 builds/{variant}-dev/에 따로 산출(배포 빌드 오염 방지)."""
    html, stats = assemble_html(variant, dev=dev)
    # 자기완결: ../images → images, ../fonts → fonts (에셋을 같은 폴더에 복사하므로)
    html = html.replace("../images/", "images/").replace("../fonts/", "fonts/")
    if release:
        html = _minify_js_in_html(html)
    dest = BUILDS_DIR / (variant + "-dev" if dev else variant)
    dest.mkdir(parents=True, exist_ok=True)
    out_html = dest / "index.html"
    out_html.write_text(html, encoding="utf-8")
    n_img, n_font = _copy_assets(dest)
    size = out_html.stat().st_size
    tag = ' +release' if release else (' +dev(debug ON)' if dev else '')
    print(f"built variant [{variant}]{tag}: {out_html} ({size:,} bytes)")
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
    dev = "--dev" in args
    variant = None
    for a in args:
        if a.startswith("--variant="):
            variant = a.split("=", 1)[1].strip()
    if variant:
        if variant not in VARIANT_CONFIG_REPLACEMENTS:
            sys.exit(f"알 수 없는 변종: {variant} (mid|elem)")
        build_variant(variant, release=release, dev=dev)
    else:
        build_root()


if __name__ == "__main__":
    main()
