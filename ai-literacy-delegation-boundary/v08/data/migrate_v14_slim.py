#!/usr/bin/env python3
"""v14-slim → scenarios.yaml + texts.yaml 마이그레이션
v0.8 단계 10 — v14-slim 데이터 재마이그레이션

입력:
  1. v14-slim/01-final-integrated-data.csv (결과 데이터 — v13 기준 + 수정 2건)
  2. v14-slim/03-report-cartoon-text-135.csv (리포트 카툰 텍스트)
  3. v14-slim/02-resourceCosts-yaml-snippet.yaml (자원 비용)
  4. v14-report/03-growth-report-template-text.md (성장 리포트 템플릿 — texts.yaml용, 수동 반영)

대상: scenarios.yaml (finals + resourceCosts + reviewSupplements + results 교체)

변경:
  1. finals: v14-slim CSV → score/grade/item/awareness/cut6Feedback/replaySuggestion/카드 교체
  2. finals: v14-slim 리포트 CSV → 리포트 필드 6종 추가
  3. resourceCosts: v14-slim yaml snippet으로 전면 교체
  4. reviewSupplements: v14-slim CSV 검토 학생 나레티브로 교체
  5. results: v14-slim CSV results 텍스트로 교체
"""
import csv
import sys
import shutil
from pathlib import Path
from ruamel.yaml import YAML

DATA_DIR = Path(__file__).parent
VAULT = DATA_DIR.parent.parent.parent.parent  # Neo-Obsi-Sync
V14_SLIM_DIR = VAULT / "Assets/incoming/AI리터러시/codex/ari-final-delivery-v14-slim"
V14_REPORT_DIR = VAULT / "Assets/incoming/AI리터러시/codex/ari-report-text-v14"

CSV_MAIN = V14_SLIM_DIR / "01-final-integrated-data.csv"
CSV_REPORT = V14_SLIM_DIR / "03-report-cartoon-text-135.csv"
RESOURCE_YAML = V14_SLIM_DIR / "02-resourceCosts-yaml-snippet.yaml"

YAML_PATH = DATA_DIR / "scenarios.yaml"
BACKUP_PATH = DATA_DIR / "scenarios.yaml.before-v14-migration"

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
    for p, label in [(CSV_MAIN, "main CSV"), (CSV_REPORT, "report CSV"),
                     (RESOURCE_YAML, "resourceCosts YAML"), (YAML_PATH, "scenarios.yaml")]:
        if not p.exists():
            sys.exit(f"{label} not found: {p}")

    # 1. Read main CSV
    main_rows, main_total = read_csv(CSV_MAIN)
    print(f"Main CSV: {main_total} rows, {len(main_rows)} scenarios")

    # 2. Read report CSV — index by (scenario, leaf)
    report_by_key = {}
    report_total = 0
    with open(CSV_REPORT, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            sid = row['시나리오 ID'].strip()
            leaf = row['leaf 좌표'].strip()
            report_by_key[(sid, leaf)] = row
            report_total += 1
    print(f"Report CSV: {report_total} rows")

    # 3. Read resourceCosts YAML
    with open(RESOURCE_YAML, encoding='utf-8') as f:
        resource_data = yaml.load(f)
    print(f"ResourceCosts: {len(resource_data)} scenarios")

    # 4. Read scenarios.yaml
    with open(YAML_PATH, encoding='utf-8') as f:
        data = yaml.load(f)

    # Backup
    shutil.copy2(YAML_PATH, BACKUP_PATH)
    print(f"Backup: {BACKUP_PATH}")

    # --- Migrate ---
    stats = {'finals': 0, 'report_fields': 0, 'supplements': 0, 'results': 0, 'resources': 0}

    for sid, rows in main_rows.items():
        if sid not in data:
            print(f"  WARN: '{sid}' not in yaml — skipping")
            continue

        sc = data[sid]
        updated_tier2 = set()

        for row in rows:
            leaf = row['leaf 좌표'].strip()
            r_idx = leaf.rfind('R')
            tier2_id = leaf[:r_idx] if r_idx > 0 else leaf

            # --- finals ---
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

            # delegation/knowledge from CSV 위임/도메인 columns
            deleg = row.get('위임', '').strip()
            if deleg:
                f['delegation'] = deleg
            knowl = row.get('도메인', '').strip()
            if knowl:
                f['knowledge'] = knowl

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

            # --- report fields from report CSV ---
            rkey = (sid, leaf)
            if rkey in report_by_key:
                rr = report_by_key[rkey]
                f['reportPathSummary'] = rr.get('reportPathSummary', '').strip()
                f['cartoonCaption1'] = rr.get('cartoonCaption1', '').strip()
                f['cartoonCaption2'] = rr.get('cartoonCaption2', '').strip()
                f['cartoonCaption3'] = rr.get('cartoonCaption3', '').strip()
                f['cartoonCaption4'] = rr.get('cartoonCaption4', '').strip()
                f['cartoonCaption5'] = rr.get('cartoonCaption5', '').strip()
                f['reportReflection'] = rr.get('reportReflection', '').strip()
                f['reportCardSummary'] = rr.get('reportCardSummary', '').strip()

                strength_str = rr.get('reportStrengthTags', '').strip()
                f['reportStrengthTags'] = [t.strip() for t in strength_str.split(';') if t.strip()] if strength_str else []

                f['reportGrowthTags'] = rr.get('reportGrowthTags', '').strip()
                stats['report_fields'] += 1

            stats['finals'] += 1

            # --- reviewSupplements ---
            narrative = row.get('검토 학생 나레티브', '').strip()
            if narrative:
                if 'reviewSupplements' not in sc:
                    sc['reviewSupplements'] = {}
                sc['reviewSupplements'][leaf] = narrative
                stats['supplements'] += 1

            # --- results (per tier2, once) ---
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

        # --- resourceCosts replacement ---
        if sid in resource_data:
            rc = resource_data[sid].get('resourceCosts', {})
            if rc:
                sc['resourceCosts'] = rc
                stats['resources'] += len(rc)

        print(f"  {sid}: {len(rows)} leaves")

    # Write
    with open(YAML_PATH, 'w', encoding='utf-8') as f:
        yaml.dump(data, f)

    size = YAML_PATH.stat().st_size
    print(f"\nOutput: {YAML_PATH} ({size:,} bytes)")
    print(f"Stats: finals={stats['finals']}, report={stats['report_fields']}, "
          f"supplements={stats['supplements']}, results={stats['results']}, "
          f"resources={stats['resources']}")

    # Verification
    print("\n--- Verification ---")
    verify(data, main_rows, report_by_key, resource_data)


def verify(data, main_rows, report_by_key, resource_data):
    mismatches = []

    for sid, rows in main_rows.items():
        if sid not in data:
            continue
        sc = data[sid]
        for row in rows:
            leaf = row['leaf 좌표'].strip()
            csv_score = int(row.get('최종점수', '0').strip() or '0')
            csv_grade = row.get('최종등급', '').strip()
            yaml_f = sc.get('finals', {}).get(leaf, {})

            if yaml_f.get('score') != csv_score:
                mismatches.append(f"{sid}/{leaf}: score {yaml_f.get('score')} != {csv_score}")
            if yaml_f.get('grade') != csv_grade:
                mismatches.append(f"{sid}/{leaf}: grade {yaml_f.get('grade')} != {csv_grade}")

            # Report fields check
            rkey = (sid, leaf)
            if rkey in report_by_key:
                rr = report_by_key[rkey]
                for field in ['reportPathSummary', 'reportReflection', 'reportCardSummary']:
                    csv_val = rr.get(field, '').strip()
                    yaml_val = yaml_f.get(field, '')
                    if csv_val and yaml_val != csv_val:
                        mismatches.append(f"{sid}/{leaf}: {field} mismatch")

    # ResourceCosts check
    for sid in resource_data:
        if sid not in data:
            continue
        rc_csv = resource_data[sid].get('resourceCosts', {})
        rc_yaml = data[sid].get('resourceCosts', {})
        for leaf_key, costs in rc_csv.items():
            yaml_costs = rc_yaml.get(leaf_key, {})
            if yaml_costs.get('time') != costs.get('time') or yaml_costs.get('energy') != costs.get('energy'):
                mismatches.append(f"{sid}/resourceCosts/{leaf_key}: mismatch")

    if mismatches:
        print(f"MISMATCHES ({len(mismatches)}):")
        for m in mismatches[:20]:
            print(f"  {m}")
    else:
        print(f"All 135 leaves: score/grade/report/resources match ✅")


if __name__ == '__main__':
    main()
