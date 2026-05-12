#!/usr/bin/env python3
"""
ui_texts.csv → texts.yaml 역변환 (Google Sheets 편집본 복원)

동작:
1. ui_texts.csv에서 flat key-value 읽기
2. 기존 texts.yaml을 읽어 비텍스트 필드(color, bg 등) 보존
3. CSV의 텍스트 값을 YAML 구조에 덮어씌워 저장
4. --verify: round-trip 검증 (원본 ↔ 복원본 텍스트 값 비교)

ruamel.yaml 사용 시 주석 보존 시도 → 없으면 PyYAML fallback
"""

import csv
import sys
import copy
import argparse
from pathlib import Path

# ruamel.yaml 사용 시도 (주석 보존)
try:
    from ruamel.yaml import YAML
    _USE_RUAMEL = True
except ImportError:
    import yaml as _pyyaml
    _USE_RUAMEL = False

# 제외 키 (CSV에 없는 필드 — YAML에서 보존)
SKIP_KEYS = {"color", "bg", "tags", "full_definition", "description"}


# ─────────────────────────────────────────────
# YAML 읽기/쓰기 헬퍼
# ─────────────────────────────────────────────

def load_yaml(path: Path):
    """YAML 파일 읽기. ruamel이면 CommentedMap 반환 (주석 포함)."""
    if _USE_RUAMEL:
        ry = YAML()
        ry.preserve_quotes = True
        with open(path, encoding="utf-8") as f:
            return ry.load(f)
    else:
        with open(path, encoding="utf-8") as f:
            return _pyyaml.safe_load(f)


def dump_yaml(data, path: Path):
    """YAML 파일 쓰기."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if _USE_RUAMEL:
        ry = YAML()
        ry.preserve_quotes = True
        ry.default_flow_style = False
        ry.width = 120
        with open(path, "w", encoding="utf-8") as f:
            ry.dump(data, f)
    else:
        with open(path, "w", encoding="utf-8") as f:
            _pyyaml.dump(
                data, f,
                allow_unicode=True,
                default_flow_style=False,
                sort_keys=False,
                width=120,
            )


# ─────────────────────────────────────────────
# flat key → 중첩 경로 분해 + 값 세팅
# ─────────────────────────────────────────────

def _coerce_key(segment: str, parent):
    """
    dict 자식이면 str 키, list 자식이면 int 인덱스로 변환.
    parent가 None이면 segment가 숫자이면 int, 아니면 str.
    """
    if isinstance(parent, list):
        try:
            return int(segment)
        except ValueError:
            return segment
    # 순수 숫자 segment이면 리스트로 처리할 예정 → int 반환
    try:
        return int(segment)
    except ValueError:
        return segment


def set_nested(root, key_path: str, value: str):
    """
    'a.b.0.c' 형태의 점 경로로 root에 값을 세팅.
    중간 경로가 없으면 생성 (숫자 → list, 문자열 → dict).
    SKIP_KEYS 경로는 건드리지 않음.
    """
    parts = key_path.split(".")
    node = root

    for i, part in enumerate(parts[:-1]):
        # 제외 키 경로면 스킵
        if part in SKIP_KEYS:
            return

        next_part = parts[i + 1]
        try:
            next_idx = int(next_part)
            next_is_list = True
        except ValueError:
            next_is_list = False

        # dict인 경우
        if isinstance(node, dict):
            if part not in node:
                node[part] = [] if next_is_list else {}
            node = node[part]

        # list인 경우
        elif isinstance(node, list):
            idx = int(part)
            while len(node) <= idx:
                node.append([] if next_is_list else {})
            node = node[idx]
        else:
            # 스칼라 자리에 들어오면 (구조 불일치) 스킵
            return

    # 마지막 키에 값 세팅
    last = parts[-1]
    if last in SKIP_KEYS:
        return

    if isinstance(node, dict):
        node[last] = value
    elif isinstance(node, list):
        idx = int(last)
        while len(node) <= idx:
            node.append("")
        node[idx] = value


# ─────────────────────────────────────────────
# CSV → flat dict
# ─────────────────────────────────────────────

def load_csv(csv_path: Path) -> dict:
    """CSV에서 {full_key: value} flat dict 반환."""
    mapping = {}
    with open(csv_path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = row.get("key", "").strip()
            value = row.get("value", "")
            if key:
                mapping[key] = value
    return mapping


# ─────────────────────────────────────────────
# YAML 기존 구조에 CSV 값 덮어씌우기
# ─────────────────────────────────────────────

def apply_csv_to_yaml(base_data, csv_mapping: dict):
    """
    base_data: 기존 YAML 데이터 (비텍스트 필드 포함 원본)
    csv_mapping: {full_key: value}
    → base_data를 deep copy 후 CSV 값으로 텍스트 필드만 교체
    """
    result = copy.deepcopy(base_data)
    for full_key, value in csv_mapping.items():
        set_nested(result, full_key, value)
    return result


# ─────────────────────────────────────────────
# round-trip 검증
# ─────────────────────────────────────────────

def flatten_for_verify(obj, prefix="", rows=None):
    """texts_to_csv.py의 flatten과 동일 로직 (검증용)."""
    if rows is None:
        rows = {}
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in SKIP_KEYS:
                continue
            new_key = f"{prefix}.{k}" if prefix else k
            flatten_for_verify(v, new_key, rows)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            new_key = f"{prefix}.{i}" if prefix else str(i)
            flatten_for_verify(v, new_key, rows)
    else:
        rows[prefix] = "" if obj is None else str(obj)
    return rows


def verify_roundtrip(original_data, restored_data):
    """원본과 복원본의 텍스트 값을 비교. 차이 목록 반환."""
    orig_flat = {}
    for section_key, section_val in original_data.items():
        if section_key in SKIP_KEYS:
            continue
        partial = flatten_for_verify(section_val, prefix="")
        for k, v in partial.items():
            full_key = f"{section_key}.{k}" if k else section_key
            orig_flat[full_key] = v

    rest_flat = {}
    for section_key, section_val in restored_data.items():
        if section_key in SKIP_KEYS:
            continue
        partial = flatten_for_verify(section_val, prefix="")
        for k, v in partial.items():
            full_key = f"{section_key}.{k}" if k else section_key
            rest_flat[full_key] = v

    diffs = []
    all_keys = set(orig_flat) | set(rest_flat)
    for key in sorted(all_keys):
        o = orig_flat.get(key, "<없음>")
        r = rest_flat.get(key, "<없음>")
        if o != r:
            diffs.append((key, o, r))
    return diffs


# ─────────────────────────────────────────────
# main
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="ui_texts.csv → texts.yaml 역변환 (Google Sheets 편집본 복원)"
    )
    parser.add_argument(
        "--input", "-i",
        default="data/ui_texts.csv",
        help="입력 CSV 경로 (기본: data/ui_texts.csv)",
    )
    parser.add_argument(
        "--base", "-b",
        default="data/texts.yaml",
        help="기존 YAML 경로 — 비텍스트 필드 보존용 (기본: data/texts.yaml)",
    )
    parser.add_argument(
        "--output", "-o",
        default="data/texts_restored.yaml",
        help="출력 YAML 경로 (기본: data/texts_restored.yaml)",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="--output을 지정하지 않고 기존 texts.yaml에 덮어쓸 때 사용",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="round-trip 검증: 원본 텍스트 값 ↔ 복원본 텍스트 값 비교",
    )
    args = parser.parse_args()

    base_dir = Path(__file__).parent

    def resolve(p):
        p = Path(p)
        return p if p.is_absolute() else base_dir / p

    csv_path = resolve(args.input)
    base_yaml_path = resolve(args.base)
    out_path = resolve(args.base if args.overwrite else args.output)

    # 경로 존재 확인
    for p in [csv_path, base_yaml_path]:
        if not p.exists():
            print(f"오류: {p} 파일이 없습니다.", file=sys.stderr)
            sys.exit(1)

    # 1. 기존 YAML 읽기
    base_data = load_yaml(base_yaml_path)
    print(f"[csv_to_texts] 기존 YAML 읽기: {base_yaml_path}")

    # 2. CSV 읽기
    csv_mapping = load_csv(csv_path)
    print(f"[csv_to_texts] CSV 항목 수: {len(csv_mapping)}")

    # 3. 값 교체
    restored = apply_csv_to_yaml(base_data, csv_mapping)

    # 4. 저장
    dump_yaml(restored, out_path)
    print(f"[csv_to_texts] 복원 YAML 저장: {out_path}")
    print(f"  ruamel.yaml {'사용 (주석 보존)' if _USE_RUAMEL else '없음 — PyYAML fallback (주석 소실)'}")

    # 5. round-trip 검증 (--verify)
    if args.verify:
        print("\n[round-trip 검증 시작]")
        # 복원본을 다시 읽어 비교 (덤프 후 실제 파일 상태로 검증)
        restored_check = load_yaml(out_path)
        diffs = verify_roundtrip(base_data, restored_check)
        if not diffs:
            print("  ✓ 차이 없음 — round-trip 통과")
        else:
            print(f"  ✗ {len(diffs)}개 불일치 발견:")
            for key, orig, rest in diffs[:30]:
                print(f"    키: {key}")
                print(f"      원본:  {orig[:80]!r}")
                print(f"      복원:  {rest[:80]!r}")
            if len(diffs) > 30:
                print(f"    ... 외 {len(diffs) - 30}개")
            sys.exit(1)


if __name__ == "__main__":
    main()
