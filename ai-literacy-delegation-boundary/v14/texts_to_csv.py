#!/usr/bin/env python3
"""
texts.yaml → CSV 변환 (피터공 Google Sheets 편집용)

출력: data/ui_texts.csv
컬럼: section, key, value

- 중첩 키는 점(.)으로 연결: title_screen.heading
- 리스트는 인덱스로: title_screen.tutorial.0
- color, bg, tags, full_definition, description 키는 제외 (개발자 YAML 직접 관리)
"""

import yaml
import csv
import argparse
import sys
from pathlib import Path

# 제외할 키 이름 (값이 무엇이든 이 키는 CSV에서 스킵)
SKIP_KEYS = {"color", "bg", "tags", "full_definition", "description"}


def flatten(obj, prefix="", rows=None):
    """중첩 dict/list를 flat key-value 쌍으로 변환."""
    if rows is None:
        rows = []

    if isinstance(obj, dict):
        for k, v in obj.items():
            # 제외 키 스킵
            if k in SKIP_KEYS:
                continue
            new_key = f"{prefix}.{k}" if prefix else k
            flatten(v, new_key, rows)

    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            new_key = f"{prefix}.{i}" if prefix else str(i)
            flatten(v, new_key, rows)

    else:
        # 리프 값 — None은 빈 문자열로
        value = "" if obj is None else str(obj)
        rows.append((prefix, value))

    return rows


def yaml_to_csv(yaml_path: Path, csv_path: Path):
    """texts.yaml을 읽어서 ui_texts.csv로 변환."""
    with open(yaml_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if not isinstance(data, dict):
        print(f"오류: {yaml_path}가 dict 형태가 아닙니다.", file=sys.stderr)
        sys.exit(1)

    rows = []
    for section_key, section_val in data.items():
        # 섹션 최상위도 제외 키면 스킵 (거의 없지만 안전 처리)
        if section_key in SKIP_KEYS:
            continue

        flat = flatten(section_val, prefix="")
        for key_suffix, value in flat:
            # section 컬럼: 최상위 섹션 이름
            # key 컬럼: 섹션 내 경로 (비어있으면 섹션 자체가 스칼라)
            full_key = f"{section_key}.{key_suffix}" if key_suffix else section_key
            rows.append((section_key, full_key, value))

    csv_path.parent.mkdir(parents=True, exist_ok=True)
    with open(csv_path, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["section", "key", "value"])
        writer.writerows(rows)

    print(f"[texts_to_csv] {len(rows)}개 항목 → {csv_path}")
    return rows


def main():
    parser = argparse.ArgumentParser(
        description="texts.yaml → ui_texts.csv 변환 (Google Sheets 편집용)"
    )
    parser.add_argument(
        "--input", "-i",
        default="data/texts.yaml",
        help="입력 YAML 경로 (기본: data/texts.yaml)",
    )
    parser.add_argument(
        "--output", "-o",
        default="data/ui_texts.csv",
        help="출력 CSV 경로 (기본: data/ui_texts.csv)",
    )
    args = parser.parse_args()

    # 스크립트 위치 기준으로 상대 경로 해석
    base = Path(__file__).parent
    yaml_path = Path(args.input) if Path(args.input).is_absolute() else base / args.input
    csv_path = Path(args.output) if Path(args.output).is_absolute() else base / args.output

    if not yaml_path.exists():
        print(f"오류: {yaml_path} 파일이 없습니다.", file=sys.stderr)
        sys.exit(1)

    yaml_to_csv(yaml_path, csv_path)


if __name__ == "__main__":
    main()
