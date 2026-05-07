#!/usr/bin/env python3
"""v15 밸런스 데이터 → scenarios.yaml 마이그레이션

입력:
  02-final-integrated-data-v15.csv     — 점수/등급/카드/피드백
  03-resource-costs-135-v15.csv        — 단계별 비용 (tier1/tier2/review)
  05-report-cartoon-text-135.csv       — 리포트 텍스트

변경:
  1. finals: 최종점수/최종등급/카드/피드백 교체
  2. stageCosts 신설: tier1/tier2/review 명시 비용
  3. resourceCosts: leaf 총비용 교체
  4. reportData: 카툰 캡션/경로요약/성찰/카드요약/태그 교체
"""
import csv
import shutil
import sys
from pathlib import Path
from ruamel.yaml import YAML

DATA_DIR = Path(__file__).parent
V15_DIR = Path("/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/AI리터러시/codex/ari-final-delivery-v15-balance")

INTEGRATED_CSV = V15_DIR / "02-final-integrated-data-v15.csv"
COSTS_CSV = V15_DIR / "03-resource-costs-135-v15.csv"
REPORT_CSV = V15_DIR / "05-report-cartoon-text-135.csv"

YAML_PATH = DATA_DIR / "scenarios.yaml"
BACKUP_PATH = DATA_DIR / "scenarios.yaml.before-v15-migration"

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 200


def read_csv(path):
    rows = {}
    total = 0
    with open(path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row['시나리오 ID'].strip()
            if sid not in rows:
                rows[sid] = []
            rows[sid].append(row)
            total += 1
    return rows, total


def main():
    for p in [INTEGRATED_CSV, COSTS_CSV, REPORT_CSV, YAML_PATH]:
        if not p.exists():
            sys.exit(f"Not found: {p}")

    shutil.copy2(YAML_PATH, BACKUP_PATH)
    print(f"Backup: {BACKUP_PATH}")

    with open(YAML_PATH, encoding='utf-8') as f:
        data = yaml.load(f)

    integrated, n1 = read_csv(INTEGRATED_CSV)
    costs, n2 = read_csv(COSTS_CSV)
    reports, n3 = read_csv(REPORT_CSV)
    print(f"CSV: integrated={n1}, costs={n2}, reports={n3}")

    stats = {'finals': 0, 'stage': 0, 'resource': 0, 'report': 0, 'supplements': 0}

    # === 1. Finals (from integrated CSV) ===
    for sid, rows in integrated.items():
        if sid not in data:
            print(f"  WARN: '{sid}' not in yaml — skipping")
            continue
        sc = data[sid]
        updated_tier2 = set()

        for row in rows:
            leaf = row['leaf 좌표'].strip()
            r_idx = leaf.rfind('R')
            tier2_id = leaf[:r_idx] if r_idx > 0 else leaf

            if 'finals' not in sc:
                sc['finals'] = {}
            if leaf not in sc['finals']:
                sc['finals'][leaf] = {}
            f = sc['finals'][leaf]

            final_score = row.get('최종점수', '').strip()
            if final_score:
                f['score'] = int(final_score)
            final_grade = row.get('최종등급', '').strip()
            if final_grade:
                f['grade'] = final_grade

            item = row.get('[검수참고] finals.item', '').strip()
            if item:
                f['item'] = item
            awareness = row.get('[검수참고] finals.awareness', '').strip()
            if awareness:
                f['awareness'] = awareness

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

            # 최종보정점수/유형/사유
            adj_score = row.get('최종보정점수', '').strip()
            if adj_score:
                f['adjustedScore'] = int(adj_score)
            adj_type = row.get('최종보정유형', '').strip()
            if adj_type:
                f['adjustedType'] = adj_type
            adj_reason = row.get('최종보정사유', '').strip()
            if adj_reason:
                f['adjustedReason'] = adj_reason

            stats['finals'] += 1

            # reviewSupplements
            narrative = row.get('검토 학생 나레티브', '').strip()
            if narrative:
                if 'reviewSupplements' not in sc:
                    sc['reviewSupplements'] = {}
                sc['reviewSupplements'][leaf] = narrative
                stats['supplements'] += 1

            # results (per tier2, once)
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

        print(f"  {sid}: finals {len(rows)} leaves")

    # === 2. Stage costs + resource costs (from costs CSV) ===
    for sid, rows in costs.items():
        if sid not in data:
            continue
        sc = data[sid]

        # Build stageCosts structure
        stage = {'tier1': {}, 'tier2': {}, 'review': {}}
        for row in rows:
            leaf = row['leaf 좌표'].strip()
            t1_id = row['1차 ID'].strip()
            t2_id = row['더 자세히 ID'].strip()
            rv_id = row['검토 ID'].strip()

            stage['tier1'][t1_id] = {
                'time': int(row['1차 시간비용']),
                'energy': int(row['1차 에너지비용'])
            }
            stage['tier2'][t2_id] = {
                'time': int(row['더 자세히 시간비용']),
                'energy': int(row['더 자세히 에너지비용'])
            }
            stage['review'][rv_id] = {
                'time': int(row['검토 시간비용']),
                'energy': int(row['검토 에너지비용'])
            }

            # Update resourceCosts (leaf totals)
            if 'resourceCosts' not in sc:
                sc['resourceCosts'] = {}
            sc['resourceCosts'][leaf] = {
                'time': int(row['resourceCosts.time']),
                'energy': int(row['resourceCosts.energy'])
            }
            stats['resource'] += 1

        sc['stageCosts'] = stage
        stats['stage'] += 1
        print(f"  {sid}: stageCosts tier1={len(stage['tier1'])} tier2={len(stage['tier2'])} review={len(stage['review'])}")

    # === 3. Report data (from report CSV) ===
    for sid, rows in reports.items():
        if sid not in data:
            continue
        sc = data[sid]

        if 'reportData' not in sc:
            sc['reportData'] = {}

        for row in rows:
            leaf = row['leaf 좌표'].strip()
            sc['reportData'][leaf] = {
                'pathSummary': row.get('reportPathSummary', '').strip(),
                'caption1': row.get('cartoonCaption1', '').strip(),
                'caption2': row.get('cartoonCaption2', '').strip(),
                'caption3': row.get('cartoonCaption3', '').strip(),
                'caption4': row.get('cartoonCaption4', '').strip(),
                'caption5': row.get('cartoonCaption5', '').strip(),
                'reflection': row.get('reportReflection', '').strip(),
                'cardSummary': row.get('reportCardSummary', '').strip(),
                'strengthTags': row.get('reportStrengthTags', '').strip(),
                'growthTags': row.get('reportGrowthTags', '').strip(),
            }
            stats['report'] += 1

        print(f"  {sid}: reportData {len([r for r in reports[sid]])} leaves")

    # Write
    with open(YAML_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(data, f)

    size = YAML_PATH.stat().st_size
    print(f"\nOutput: {YAML_PATH} ({size:,} bytes)")
    print(f"Stats: {stats}")

    # Verify
    print("\n--- Verification ---")
    verify(data, integrated, costs)


def verify(data, integrated, costs):
    mismatches = []

    # Score/grade check
    for sid, rows in integrated.items():
        if sid not in data:
            continue
        sc = data[sid]
        for row in rows:
            leaf = row['leaf 좌표'].strip()
            csv_score = int(row.get('최종점수', '0').strip() or '0')
            csv_grade = row.get('최종등급', '').strip()
            yaml_score = sc.get('finals', {}).get(leaf, {}).get('score')
            yaml_grade = sc.get('finals', {}).get(leaf, {}).get('grade')
            if yaml_score != csv_score:
                mismatches.append(f"{sid}/{leaf}: score {yaml_score} != {csv_score}")
            if yaml_grade != csv_grade:
                mismatches.append(f"{sid}/{leaf}: grade {yaml_grade} != {csv_grade}")

    # stageCosts existence check
    for sid in data:
        if 'stageCosts' not in data[sid]:
            mismatches.append(f"{sid}: missing stageCosts")

    # resourceCosts total check
    for sid, rows in costs.items():
        if sid not in data:
            continue
        sc = data[sid]
        for row in rows:
            leaf = row['leaf 좌표'].strip()
            csv_t = int(row['resourceCosts.time'])
            csv_e = int(row['resourceCosts.energy'])
            yaml_rc = sc.get('resourceCosts', {}).get(leaf, {})
            if yaml_rc.get('time') != csv_t:
                mismatches.append(f"{sid}/{leaf}: resourceCosts.time {yaml_rc.get('time')} != {csv_t}")
            if yaml_rc.get('energy') != csv_e:
                mismatches.append(f"{sid}/{leaf}: resourceCosts.energy {yaml_rc.get('energy')} != {csv_e}")

    if mismatches:
        print(f"MISMATCHES ({len(mismatches)}):")
        for m in mismatches[:20]:
            print(f"  {m}")
    else:
        print("All 135 leaves: score/grade/costs match ✅")
        print("All 5 scenarios: stageCosts present ✅")


if __name__ == '__main__':
    main()
