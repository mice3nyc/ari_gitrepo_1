#!/usr/bin/env python3
"""v20 CSV → scenarios.yaml 마이그레이션
- costs CSV: stageCosts + resourceCosts 교체
- content CSV: finals 필드 갱신 (shortFeedback, reportFeedback 추가)
- 1차 선택 비용 강제 time:1 / energy:1
"""

import csv
import copy
import sys
from pathlib import Path

try:
    from ruamel.yaml import YAML
    yaml = YAML()
    yaml.preserve_quotes = True
    yaml.width = 4096
    USE_RUAMEL = True
except ImportError:
    import yaml as pyyaml
    USE_RUAMEL = False

SCENARIO_IDS = ['selfintro', 'groupwork', 'eorinwangja', 'career', 'studyplan']

VAULT_ROOT = Path(__file__).resolve().parent
while VAULT_ROOT.name != 'Neo-Obsi-Sync' and VAULT_ROOT != VAULT_ROOT.parent:
    VAULT_ROOT = VAULT_ROOT.parent
HANDOFF_DIR = VAULT_ROOT / 'Assets/incoming/AI리터러시/codex/ari-handoff-v20'
YAML_PATH = Path(__file__).resolve().parent / 'scenarios.yaml'
BACKUP_PATH = Path(__file__).resolve().parent / 'scenarios.yaml.before-v20-migration'


def read_csv(path):
    with open(path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)


def load_costs(scenario_id):
    path = HANDOFF_DIR / f'v20-draft-costs-{scenario_id}.csv'
    rows = read_csv(path)
    stage_costs = {'tier1': {}, 'tier2': {}, 'review': {}}
    resource_costs = {}

    for row in rows:
        leaf = row['leaf 좌표'].strip()
        t1_id = row['1차 ID'].strip()
        t2_id = row['더 자세히 ID'].strip()
        r_id = row['검토 ID'].strip()

        if t1_id not in stage_costs['tier1']:
            stage_costs['tier1'][t1_id] = {
                'time': int(row['1차 시간비용']),
                'energy': int(row['1차 에너지비용'])
            }

        if t2_id not in stage_costs['tier2']:
            stage_costs['tier2'][t2_id] = {
                'time': int(row['더 자세히 시간비용']),
                'energy': int(row['더 자세히 에너지비용'])
            }

        if r_id not in stage_costs['review']:
            stage_costs['review'][r_id] = {
                'time': int(row['검토 시간비용']),
                'energy': int(row['검토 에너지비용'])
            }

        resource_costs[leaf] = {
            'time': int(row['resourceCosts.time']),
            'energy': int(row['resourceCosts.energy'])
        }

    return stage_costs, resource_costs


def load_content(scenario_id):
    path = HANDOFF_DIR / f'v20-draft-content-{scenario_id}.csv'
    rows = read_csv(path)
    finals_updates = {}

    for row in rows:
        leaf = row['leaf 좌표'].strip()

        update = {
            'score': int(row['최종점수']) if row.get('최종점수') else None,
            'grade': row.get('최종등급', '').strip() or None,
            'shortFeedback': row.get('결과화면 짧은 피드백', '').strip() or None,
            'reportFeedback': row.get('성장리포트 상세 피드백', '').strip() or None,
        }

        delegation = row.get('위임', '').strip()
        if delegation:
            update['delegation'] = delegation
        domain = row.get('도메인', '').strip()
        if domain:
            update['knowledge'] = domain

        earned_cards = row.get('획득 역량카드', '').strip()
        if earned_cards:
            update['earnedCards'] = earned_cards

        human_axis = row.get('인간중심 축', '').strip()
        if human_axis:
            update['humanCentricAxis'] = human_axis
        human_tag = row.get('획득 인간중심역량', '').strip()
        if human_tag:
            update['humanCentricTag'] = human_tag

        domain_cards = row.get('획득 도메인카드', '').strip()
        if domain_cards:
            update['domainCards'] = [c.strip() for c in domain_cards.split(',')]

        growth_card = row.get('획득 성장카드', '').strip()
        if growth_card:
            update['growthCard'] = growth_card

        adjusted_score = row.get('최종보정점수', '').strip()
        if adjusted_score:
            update['adjustedScore'] = int(adjusted_score)
        adjusted_type = row.get('최종보정유형', '').strip()
        if adjusted_type:
            update['adjustedType'] = adjusted_type
        adjusted_reason = row.get('최종보정사유', '').strip()
        if adjusted_reason:
            update['adjustedReason'] = adjusted_reason

        cut6 = row.get('CUT6 보정 피드백', '').strip()
        if cut6:
            update['cut6Feedback'] = cut6

        replay = row.get('리플레이 제안', '').strip()
        if replay:
            update['replaySuggestion'] = replay

        card_earned = row.get('카드획득여부', '').strip()
        if card_earned:
            update['cardEarned'] = card_earned == 'Y'

        finals_updates[leaf] = {k: v for k, v in update.items() if v is not None}

    return finals_updates


def migrate():
    print(f'Loading yaml: {YAML_PATH}')

    if USE_RUAMEL:
        with open(YAML_PATH, 'r', encoding='utf-8') as f:
            data = yaml.load(f)
    else:
        with open(YAML_PATH, 'r', encoding='utf-8') as f:
            data = pyyaml.safe_load(f)

    # Backup
    import shutil
    shutil.copy2(YAML_PATH, BACKUP_PATH)
    print(f'Backup: {BACKUP_PATH}')

    for sc_id in SCENARIO_IDS:
        print(f'\n--- {sc_id} ---')
        sc = data[sc_id]

        # 1. costs
        stage_costs, resource_costs = load_costs(sc_id)
        sc['stageCosts'] = stage_costs
        sc['resourceCosts'] = resource_costs
        print(f'  stageCosts: {len(stage_costs["tier1"])} tier1, {len(stage_costs["tier2"])} tier2, {len(stage_costs["review"])} review')
        print(f'  resourceCosts: {len(resource_costs)} leaves')

        # 2. content → finals
        finals_updates = load_content(sc_id)
        updated = 0
        for leaf, updates in finals_updates.items():
            if leaf in sc['finals']:
                for k, v in updates.items():
                    sc['finals'][leaf][k] = v
                # awareness → reportFeedback migration
                if 'reportFeedback' in updates and 'awareness' in sc['finals'][leaf]:
                    sc['finals'][leaf]['awareness'] = updates['reportFeedback']
                # shortFeedback is new
                updated += 1
            else:
                print(f'  WARNING: leaf {leaf} not found in finals')
        print(f'  finals updated: {updated}/{len(finals_updates)}')

    # Write
    print(f'\nWriting: {YAML_PATH}')
    if USE_RUAMEL:
        with open(YAML_PATH, 'w', encoding='utf-8') as f:
            yaml.dump(data, f)
    else:
        with open(YAML_PATH, 'w', encoding='utf-8') as f:
            pyyaml.dump(data, f, allow_unicode=True, default_flow_style=False, width=4096)

    print('Done.')


if __name__ == '__main__':
    migrate()
