#!/usr/bin/env python3
"""data/topics/*.yaml + archivist_types.yaml → JS 출력 (stdout)

빌드 단계에서 호출:
  python3 scripts/build_stories_json.py > /tmp/dmz_inject.js
  → const STORIES = {...}; const ARCHIVIST_TYPES = {...};
"""
import json
import sys
from pathlib import Path
from ruamel.yaml import YAML

ROOT = Path(__file__).resolve().parent.parent
TOPICS_DIR = ROOT / "data" / "topics"

TOPIC_FILES = {
    "cat01": "01-DMZ 기본정보.yaml",
    "cat02": "02-생태환경.yaml",
    "cat03": "03-국가유산-문화재.yaml",
    "cat04": "04-DMZ의 사람들.yaml",
    "cat06": "06-평화 관광.yaml",
}

yaml = YAML(typ="safe")


def main():
    stories = {}
    for cat_id, fname in TOPIC_FILES.items():
        path = TOPICS_DIR / fname
        if not path.exists():
            sys.stderr.write(f"ERROR: {path} 없음\n")
            sys.exit(1)
        with open(path) as f:
            d = yaml.load(f)
        if d is None:
            stories[cat_id] = []
        else:
            stories[cat_id] = d.get("stories") or []

    # Phase 1 파일럿: data/sources/ 마크다운 face 스토리를 yaml 위에 덮어쓰기
    # (Phase 2에서 yaml 폐기 시 이 블록도 제거)
    md_root = ROOT / "data" / "sources"
    if md_root.exists():
        import subprocess
        result = subprocess.run(
            ["python3", str(ROOT / "scripts" / "md_to_json.py"), "--root", str(md_root)],
            capture_output=True, text=True, check=False,
        )
        if result.returncode != 0:
            sys.stderr.write("md_to_json.py 실패:\n" + result.stderr)
            sys.exit(1)
        md_stories = json.loads(result.stdout) if result.stdout.strip() else {}
        override_count = 0
        for cat_id, md_list in md_stories.items():
            existing = {s["id"]: i for i, s in enumerate(stories.get(cat_id, []))}
            for md_story in md_list:
                sid = md_story["id"]
                if sid in existing:
                    stories[cat_id][existing[sid]] = md_story
                    override_count += 1
                else:
                    stories.setdefault(cat_id, []).append(md_story)
                    override_count += 1
        sys.stderr.write(f"마크다운 스토리 {override_count}건 덮어쓰기\n")

    archivist_path = TOPICS_DIR / "archivist_types.yaml"
    with open(archivist_path) as f:
        archivist = yaml.load(f) or {}

    print("// ===== STORY DATA (from data/topics/*.yaml + data/sources/) =====")
    print("const STORIES = " + json.dumps(stories, ensure_ascii=False, indent=2) + ";")
    print()
    print("// ===== ARCHIVIST TYPES (from data/topics/archivist_types.yaml) =====")
    print("const ARCHIVIST_TYPES = " + json.dumps(archivist, ensure_ascii=False, indent=2) + ";")

    # stderr 로그
    counts = {k: len(v) for k, v in stories.items()}
    sys.stderr.write(f"stories: {counts}, archivist: {len(archivist)} types\n")


if __name__ == "__main__":
    main()
