#!/usr/bin/env python3
"""CSV → YAML → 빌드 한 번에.

사용:
  python3 update.py                    # CSV 복원 + 빌드
  python3 update.py --verify           # CSV 복원 검증만 (빌드 안 함)
  python3 update.py -i ~/Downloads/    # 덱스가 보낸 CSV 폴더 지정
  python3 update.py --skip-texts       # 시나리오 CSV만 복원
  python3 update.py --skip-scenarios   # 텍스트 CSV만 복원
"""
import subprocess
import sys
import argparse
from pathlib import Path

ROOT = Path(__file__).parent


def run(cmd, desc):
    print(f"\n{'─'*50}")
    print(f"  {desc}")
    print(f"{'─'*50}")
    result = subprocess.run(cmd, cwd=str(ROOT))
    if result.returncode != 0:
        print(f"\n✗ 실패: {desc}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="CSV → YAML → 빌드 통합")
    parser.add_argument("-i", "--input", default=None,
                        help="CSV 폴더 (기본: data/)")
    parser.add_argument("--verify", action="store_true",
                        help="round-trip 검증만 (빌드 안 함)")
    parser.add_argument("--skip-texts", action="store_true",
                        help="텍스트 CSV 복원 건너뛰기")
    parser.add_argument("--skip-scenarios", action="store_true",
                        help="시나리오 CSV 복원 건너뛰기")
    args = parser.parse_args()

    csv_dir = args.input or str(ROOT / "data")

    if not args.skip_texts:
        texts_csv = Path(csv_dir) / "ui_texts.csv"
        if texts_csv.exists():
            cmd = [sys.executable, "csv_to_texts.py", "-i", str(texts_csv)]
            if args.verify:
                cmd.append("--verify")
            run(cmd, "텍스트 CSV → texts.yaml")
        else:
            print(f"  (ui_texts.csv 없음 — 텍스트 건너뜀)")

    if not args.skip_scenarios:
        meta_csv = Path(csv_dir) / "scenario_meta.csv"
        if meta_csv.exists():
            cmd = [sys.executable, "csv_to_scenarios.py", "-i", csv_dir]
            if args.verify:
                cmd.append("--verify")
            run(cmd, "시나리오 3 CSV → scenarios.yaml")
        else:
            print(f"  (scenario_meta.csv 없음 — 시나리오 건너뜀)")

    if not args.verify:
        run([sys.executable, "build.py"], "빌드 → index.html")

    print(f"\n{'═'*50}")
    print(f"  {'검증 완료' if args.verify else '업데이트 완료'}")
    print(f"{'═'*50}")


if __name__ == "__main__":
    main()
