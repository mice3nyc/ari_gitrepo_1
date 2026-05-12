#!/usr/bin/env python3
"""texts.yaml → ui_texts.csv 변환

사용:
  python3 yaml_to_csv.py                    # → data/ui_texts.csv
  python3 yaml_to_csv.py -o ~/Downloads/    # 지정 경로로 출력

CSV 구조: path,value
  - path: 점(.) 구분 YAML 경로 (예: cards.검수능력.color)
  - value: 텍스트 값 (multi-line은 CSV 셀 내 줄바꿈)
  - 리스트 항목은 인덱스 번호 사용 (예: title_screen.tutorial.0)
"""
import csv
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요: pip install pyyaml")

ROOT = Path(__file__).parent
TEXTS_YAML = ROOT / 'data' / 'texts.yaml'
DEFAULT_OUT = ROOT / 'data' / 'ui_texts.csv'


def flatten(obj, prefix=''):
    rows = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            path = f"{prefix}.{k}" if prefix else str(k)
            if isinstance(v, (dict, list)):
                rows.extend(flatten(v, path))
            else:
                val = str(v) if v is not None else ''
                if isinstance(v, str) and v.endswith('\n'):
                    val = val.rstrip('\n')
                rows.append((path, val))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            path = f"{prefix}.{i}"
            if isinstance(v, (dict, list)):
                rows.extend(flatten(v, path))
            else:
                val = str(v) if v is not None else ''
                rows.append((path, val))
    return rows


def main():
    import argparse
    parser = argparse.ArgumentParser(description='texts.yaml → CSV')
    parser.add_argument('-o', '--output', default=str(DEFAULT_OUT))
    args = parser.parse_args()

    out_path = Path(args.output)
    if out_path.is_dir():
        out_path = out_path / 'ui_texts.csv'

    with open(TEXTS_YAML, encoding='utf-8') as f:
        data = yaml.safe_load(f)

    rows = flatten(data)

    with open(out_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['path', 'value'])
        for path, value in rows:
            writer.writerow([path, value])

    print(f"wrote {len(rows)} rows → {out_path}")


if __name__ == '__main__':
    main()
