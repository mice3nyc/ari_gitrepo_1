#!/usr/bin/env python3
"""ui_texts.csv → texts.yaml 역변환

사용:
  python3 csv_to_yaml.py                              # data/ui_texts.csv → data/texts.yaml
  python3 csv_to_yaml.py -i ~/Downloads/ui_texts.csv   # 지정 CSV → data/texts.yaml

round-trip: yaml_to_csv.py → (편집) → csv_to_yaml.py → build.py
"""
import csv
import sys
from pathlib import Path
from collections import OrderedDict

try:
    import yaml
except ImportError:
    sys.exit("PyYAML 필요: pip install pyyaml")

ROOT = Path(__file__).parent
DEFAULT_CSV = ROOT / 'data' / 'ui_texts.csv'
TEXTS_YAML = ROOT / 'data' / 'texts.yaml'

YAML_HEADER = """\
# AI 리터러시 — 인간 편집 텍스트 모음 (시나리오 콘텐츠 제외 전체)
# ─────────────────────────────────────────────────────────────────
# 코드 변경 없이 이 파일만 수정해도 게임 텍스트 갱신됨.
# 수정 후 `python3 build.py` 실행하면 index.html에 inject 된다.
#
# CSV 변환:
#   python3 yaml_to_csv.py          # texts.yaml → ui_texts.csv
#   python3 csv_to_yaml.py          # ui_texts.csv → texts.yaml (역변환)

"""


class _Dumper(yaml.Dumper):
    pass


def _str_representer(dumper, data):
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    if any(c in data for c in [':', '#', '{', '}', '[', ']', ',', '&', '*', '?', '|', '-', '<', '>', '=', '!', '%', '@', '`']):
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
    if data.startswith(("'", '"')) or data.startswith(' ') or data.endswith(' '):
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)

def _dict_representer(dumper, data):
    return dumper.represent_mapping('tag:yaml.org,2002:map', data.items())

_Dumper.add_representer(str, _str_representer)
_Dumper.add_representer(OrderedDict, _dict_representer)


def _set_nested(root, keys, value):
    for i, key in enumerate(keys[:-1]):
        next_key = keys[i + 1]
        is_next_index = next_key.isdigit()
        if key not in root:
            root[key] = [] if is_next_index else OrderedDict()
        root = root[key]
    last_key = keys[-1]
    if isinstance(root, list):
        idx = int(last_key)
        while len(root) <= idx:
            root.append(None)
        root[idx] = value
    else:
        root[last_key] = value


def main():
    import argparse
    parser = argparse.ArgumentParser(description='CSV → texts.yaml')
    parser.add_argument('-i', '--input', default=str(DEFAULT_CSV))
    args = parser.parse_args()

    csv_path = Path(args.input)
    if not csv_path.exists():
        sys.exit(f"CSV 없음: {csv_path}")

    data = OrderedDict()
    with open(csv_path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            path = row['path'].strip()
            value = row['value']
            if not path:
                continue
            keys = path.split('.')
            _set_nested(data, keys, value)

    yaml_out = YAML_HEADER + yaml.dump(
        data,
        Dumper=_Dumper,
        default_flow_style=False,
        allow_unicode=True,
        sort_keys=False,
        width=120,
    )

    TEXTS_YAML.write_text(yaml_out, encoding='utf-8')
    top_keys = list(data.keys())
    print(f"wrote {len(top_keys)} sections → {TEXTS_YAML}")
    print(f"  sections: {', '.join(top_keys)}")


if __name__ == '__main__':
    main()
