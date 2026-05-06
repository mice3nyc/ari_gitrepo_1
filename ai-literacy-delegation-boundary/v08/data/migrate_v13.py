#!/usr/bin/env python3
"""v13 CSV → scenarios.yaml 마이그레이션

v13 변경: eorinwangja C1 텍스트 수정 + groupwork B3R1 등급/점수/카드 수정.
"""
import csv
import sys
from pathlib import Path
from ruamel.yaml import YAML

DATA_DIR = Path(__file__).parent
CSV_PATH = DATA_DIR / "03-ai-literacy-v13-final-integrated-data.csv"
YAML_PATH = DATA_DIR / "scenarios.yaml"
BACKUP_PATH = DATA_DIR / "scenarios.yaml.before-v13-migration"

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 200

def main():
    if not CSV_PATH.exists():
        sys.exit(f"CSV not found: {CSV_PATH}")
    if not YAML_PATH.exists():
        sys.exit(f"YAML not found: {YAML_PATH}")

    # Read CSV — group by scenario
    rows_by_scenario = {}
    total_rows = 0
    with open(CSV_PATH, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row['시나리오 ID'].strip()
            if sid not in rows_by_scenario:
                rows_by_scenario[sid] = []
            rows_by_scenario[sid].append(row)
            total_rows += 1

    print(f"CSV: {total_rows} rows, {len(rows_by_scenario)} scenarios")

    # Read YAML
    with open(YAML_PATH, encoding='utf-8') as f:
        data = yaml.load(f)

    # Backup
    import shutil
    shutil.copy2(YAML_PATH, BACKUP_PATH)
    print(f"Backup: {BACKUP_PATH}")

    # Migrate
    stats = {'finals': 0, 'supplements': 0, 'results': 0}

    for sid, rows in rows_by_scenario.items():
        if sid not in data:
            print(f"  WARN: '{sid}' not in yaml — skipping")
            continue

        sc = data[sid]
        updated_tier2 = set()

        for row in rows:
            leaf = row['leaf 좌표'].strip()
            tier2_id = ''.join(c for c in leaf if not c.startswith('R') or not c[1:].isdigit())
            # A1R1 → tier2_id = A1. Parse: everything before the last R+digit(s)
            r_idx = leaf.rfind('R')
            tier2_id = leaf[:r_idx] if r_idx > 0 else leaf

            # --- 1. finals ---
            if 'finals' not in sc:
                sc['finals'] = {}
            if leaf not in sc['finals']:
                sc['finals'][leaf] = {}

            f = sc['finals'][leaf]

            # Overwrite score/grade with v11 최종점수/최종등급
            final_score = row.get('최종점수', '').strip()
            if final_score:
                f['score'] = int(final_score)
            final_grade = row.get('최종등급', '').strip()
            if final_grade:
                f['grade'] = final_grade

            # Update existing text fields from CSV
            item = row.get('[검수참고] finals.item', '').strip()
            if item:
                f['item'] = item
            awareness = row.get('[검수참고] finals.awareness', '').strip()
            if awareness:
                f['awareness'] = awareness

            # New v0.8 fields
            f['cut6Feedback'] = row.get('CUT6 보정 피드백', '').strip()
            f['replaySuggestion'] = row.get('리플레이 제안', '').strip()
            f['cardEarned'] = row.get('카드획득여부', '').strip() == 'Y'
            f['humanCentricAxis'] = row.get('인간중심 축', '').strip()
            f['humanCentricTag'] = row.get('획득 인간중심역량', '').strip()

            domain_str = row.get('획득 도메인카드', '').strip()
            f['domainCards'] = [c.strip() for c in domain_str.split(',') if c.strip()] if domain_str else []

            f['growthCard'] = row.get('획득 성장카드', '').strip()
            f['replayCardStatus'] = row.get('리플레이 카드상태', '').strip()

            exp_str = row.get('EXP 보상', '0').strip()
            f['expReward'] = int(exp_str) if exp_str else 0

            stats['finals'] += 1

            # --- 2. reviewSupplements ---
            narrative = row.get('검토 학생 나레티브', '').strip()
            if narrative:
                if 'reviewSupplements' not in sc:
                    sc['reviewSupplements'] = {}
                sc['reviewSupplements'][leaf] = narrative
                stats['supplements'] += 1

            # --- 3. results (per tier2, once) ---
            if tier2_id not in updated_tier2:
                updated_tier2.add(tier2_id)
                if 'results' in sc and tier2_id in sc['results']:
                    r = sc['results'][tier2_id]
                    text = row.get('[검수참고] results.text', '').strip()
                    if text:
                        r['text'] = text
                    summary = row.get('[검수참고] results.summary', '').strip()
                    if summary:
                        r['summary'] = summary
                    lesson = row.get('[검수참고] results.lesson', '').strip()
                    if lesson:
                        r['lesson'] = lesson
                    stats['results'] += 1

        print(f"  {sid}: {len(rows)} leaves")

    # Write
    with open(YAML_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(data, f)

    size = YAML_PATH.stat().st_size
    print(f"\nOutput: {YAML_PATH} ({size:,} bytes)")
    print(f"Stats: finals={stats['finals']}, supplements={stats['supplements']}, results={stats['results']}")

    # Verification
    print("\n--- Verification ---")
    verify(data, rows_by_scenario)


def verify(data, rows_by_scenario):
    mismatches = []
    for sid, rows in rows_by_scenario.items():
        if sid not in data:
            continue
        sc = data[sid]
        for row in rows:
            leaf = row['leaf 좌표'].strip()
            f = sc.get('finals', {}).get(leaf, {})

            csv_score = int(row.get('최종점수', '0').strip() or '0')
            csv_grade = row.get('최종등급', '').strip()
            csv_feedback = row.get('CUT6 보정 피드백', '').strip()
            csv_replay = row.get('리플레이 제안', '').strip()

            if f.get('score') != csv_score:
                mismatches.append(f"{sid}/{leaf}: score {f.get('score')} != {csv_score}")
            if f.get('grade') != csv_grade:
                mismatches.append(f"{sid}/{leaf}: grade {f.get('grade')} != {csv_grade}")
            if f.get('cut6Feedback') != csv_feedback:
                mismatches.append(f"{sid}/{leaf}: cut6Feedback mismatch")
            if f.get('replaySuggestion') != csv_replay:
                mismatches.append(f"{sid}/{leaf}: replaySuggestion mismatch")

    if mismatches:
        print(f"MISMATCHES ({len(mismatches)}):")
        for m in mismatches[:10]:
            print(f"  ... and {len(mismatches)-10} more" if False else f"  {m}")
    else:
        print(f"All 135 leaves: score/grade/cut6Feedback/replaySuggestion match ✅")


if __name__ == '__main__':
    main()
