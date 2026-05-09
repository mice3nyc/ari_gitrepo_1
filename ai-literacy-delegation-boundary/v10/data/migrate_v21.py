#!/usr/bin/env python3
"""v21 CSV → scenarios.yaml 마이그레이션
- v21 content CSV: finals 필드 갱신 (선택지 텍스트 변경 포함)
- v21 costs CSV: stageCosts + resourceCosts 교체
- v21-card-discount-tags.csv: tier1/tier2/review에 discountTags 추가
"""

import csv
import sys
from pathlib import Path
from collections import defaultdict

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
HANDOFF_DIR = VAULT_ROOT / 'Assets/incoming/AI리터러시/codex/ari-handoff-v21'
YAML_PATH = Path(__file__).resolve().parent / 'scenarios.yaml'
BACKUP_PATH = Path(__file__).resolve().parent / 'scenarios.yaml.before-v21-migration'


def read_csv(path):
    with open(path, 'r', encoding='utf-8-sig') as f:
        return list(csv.DictReader(f))


def load_costs(scenario_id):
    path = HANDOFF_DIR / f'v21-costs-{scenario_id}.csv'
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
    path = HANDOFF_DIR / f'v21-content-{scenario_id}.csv'
    rows = read_csv(path)

    finals_updates = {}
    tier1_data = {}   # {id: {label, desc, lesson}}
    tier2_data = {}
    review_data = {}

    for row in rows:
        leaf = row['leaf 좌표'].strip()

        t1_text = row.get('1차 선택', '').strip()
        t2_text = row.get('더 자세히 선택', '').strip()
        r_text = row.get('검토 선택', '').strip()

        if t1_text:
            t1_id = t1_text.split('.')[0].strip()
            t1_label = t1_text.split('.', 1)[1].strip() if '.' in t1_text else t1_text
            t1_desc = row.get('1차 메시지', '').strip()
            t1_lesson = row.get('1차 의도', '').strip()
            tier1_data[t1_id] = {'label': t1_label}
            if t1_desc:
                tier1_data[t1_id]['desc'] = t1_desc
            if t1_lesson:
                tier1_data[t1_id]['lesson'] = t1_lesson
        if t2_text:
            t2_id = t2_text.split('.')[0].strip()
            t2_label = t2_text.split('.', 1)[1].strip() if '.' in t2_text else t2_text
            t2_lesson = row.get('더 자세히 의도', '').strip()
            tier2_data[t2_id] = {'label': t2_label}
            if t2_lesson:
                tier2_data[t2_id]['lesson'] = t2_lesson
        if r_text:
            parts = r_text.split('.', 1)
            r_id = parts[0].strip()
            r_label = parts[1].strip() if len(parts) > 1 else r_text
            r_lesson = row.get('검토 의도', '').strip()
            review_data[r_id] = {'label': r_label}
            if r_lesson:
                review_data[r_id]['desc'] = r_lesson

        update = {}
        score = row.get('최종점수', '').strip()
        if score:
            update['score'] = int(score)
        grade = row.get('최종등급', '').strip()
        if grade:
            update['grade'] = grade

        sf = row.get('결과화면 짧은 피드백', '').strip()
        if sf:
            update['shortFeedback'] = sf
        rf = row.get('성장리포트 상세 피드백', '').strip()
        if rf:
            update['reportFeedback'] = rf

        delegation = row.get('위임', '').strip()
        if delegation:
            update['delegation'] = delegation
        domain = row.get('도메인', '').strip()
        if domain:
            update['knowledge'] = domain

        earned = row.get('획득 역량카드', '').strip()
        if earned:
            update['earnedCards'] = earned

        ha = row.get('인간중심 축', '').strip()
        if ha:
            update['humanCentricAxis'] = ha
        ht = row.get('획득 인간중심역량', '').strip()
        if ht:
            update['humanCentricTag'] = ht

        dc = row.get('획득 도메인카드', '').strip()
        if dc:
            update['domainCards'] = [c.strip() for c in dc.split(',')]

        gc = row.get('획득 성장카드', '').strip()
        if gc:
            update['growthCard'] = gc

        adj_score = row.get('최종보정점수', '').strip()
        if adj_score:
            update['adjustedScore'] = int(adj_score)
        adj_type = row.get('최종보정유형', '').strip()
        if adj_type:
            update['adjustedType'] = adj_type
        adj_reason = row.get('최종보정사유', '').strip()
        if adj_reason:
            update['adjustedReason'] = adj_reason

        cut6 = row.get('CUT6 보정 피드백', '').strip()
        if cut6:
            update['cut6Feedback'] = cut6
        replay = row.get('리플레이 제안', '').strip()
        if replay:
            update['replaySuggestion'] = replay

        ce = row.get('카드획득여부', '').strip()
        if ce:
            update['cardEarned'] = ce == 'Y'

        finals_updates[leaf] = {k: v for k, v in update.items() if v is not None}

    return finals_updates, tier1_data, tier2_data, review_data


def parse_tag_list(s):
    """'검토력|표현력' → ['검토력', '표현력'], '' → []"""
    s = s.strip()
    if not s:
        return []
    return [t.strip() for t in s.split('|') if t.strip()]


def parse_hc_tag(s):
    """'중심잡기' or '성찰하기:비판적 사고' → string or empty"""
    return s.strip() if s else ''


def load_discount_tags():
    path = HANDOFF_DIR / 'v21-card-discount-tags.csv'
    rows = read_csv(path)

    # Per scenario, per choice level
    tier1_tags = {}   # {scid: {A: {...}, B: {...}, C: {...}}}
    tier2_tags = {}
    review_tags = {}

    for row in rows:
        scid = row['시나리오 ID'].strip()
        t1_id = row['1차 ID'].strip()
        t2_id = row['더 자세히 ID'].strip()
        r_id = row['검토 ID'].strip()

        if scid not in tier1_tags:
            tier1_tags[scid] = {}
            tier2_tags[scid] = {}
            review_tags[scid] = {}

        if t1_id not in tier1_tags[scid]:
            tier1_tags[scid][t1_id] = {
                'humanCentric': parse_hc_tag(row.get('1차 인간중심 축태그', '')),
                'domain': parse_tag_list(row.get('1차 도메인 태그', '')),
            }

        if t2_id not in tier2_tags[scid]:
            tier2_tags[scid][t2_id] = {
                'humanCentric': parse_hc_tag(row.get('더 자세히 인간중심 축태그', '')),
                'domain': parse_tag_list(row.get('더 자세히 도메인 태그', '')),
                'strongDomain': parse_tag_list(row.get('더 자세히 강한 도메인 태그', '')),
            }

        if r_id not in review_tags[scid]:
            review_tags[scid][r_id] = {
                'humanCentric': parse_hc_tag(row.get('검토 인간중심 축태그', '')),
                'domain': parse_tag_list(row.get('검토 도메인 태그', '')),
                'strongDomain': parse_tag_list(row.get('검토 강한 도메인 태그', '')),
            }

    return tier1_tags, tier2_tags, review_tags


def migrate():
    print(f'Loading yaml: {YAML_PATH}')

    if USE_RUAMEL:
        with open(YAML_PATH, 'r', encoding='utf-8') as f:
            data = yaml.load(f)
    else:
        with open(YAML_PATH, 'r', encoding='utf-8') as f:
            data = pyyaml.safe_load(f)

    import shutil
    shutil.copy2(YAML_PATH, BACKUP_PATH)
    print(f'Backup: {BACKUP_PATH}')

    # Load discount tags
    tier1_dt, tier2_dt, review_dt = load_discount_tags()
    print(f'Discount tags loaded: {sum(len(v) for v in tier1_dt.values())} tier1, '
          f'{sum(len(v) for v in tier2_dt.values())} tier2, '
          f'{sum(len(v) for v in review_dt.values())} review')

    for sc_id in SCENARIO_IDS:
        print(f'\n--- {sc_id} ---')
        sc = data[sc_id]

        # 1. Costs
        stage_costs, resource_costs = load_costs(sc_id)
        sc['stageCosts'] = stage_costs
        sc['resourceCosts'] = resource_costs
        print(f'  stageCosts updated')

        # 2. Content → finals + labels
        finals_updates, tier1_data, tier2_data, review_data = load_content(sc_id)
        updated = 0
        for leaf, updates in finals_updates.items():
            if leaf in sc['finals']:
                for k, v in updates.items():
                    sc['finals'][leaf][k] = v
                if 'reportFeedback' in updates and 'awareness' in sc['finals'][leaf]:
                    sc['finals'][leaf]['awareness'] = updates['reportFeedback']
                updated += 1
            else:
                print(f'  WARNING: leaf {leaf} not found in finals')
        print(f'  finals updated: {updated}/{len(finals_updates)}')

        # 3. Update tier1 labels/desc/lesson + discount tags
        for t1 in sc.get('tier1', []):
            t1_id = t1['id']
            if t1_id in tier1_data:
                for k, v in tier1_data[t1_id].items():
                    t1[k] = v
            if sc_id in tier1_dt and t1_id in tier1_dt[sc_id]:
                t1['discountTags'] = tier1_dt[sc_id][t1_id]
        print(f'  tier1 updated ({len(tier1_data)} choices)')

        # 4. Update tier2 labels/lesson + discount tags
        for parent_key in sc.get('tier2', {}):
            for t2 in sc['tier2'][parent_key]:
                t2_id = t2['id']
                if t2_id in tier2_data:
                    for k, v in tier2_data[t2_id].items():
                        t2[k] = v
                if sc_id in tier2_dt and t2_id in tier2_dt[sc_id]:
                    t2['discountTags'] = tier2_dt[sc_id][t2_id]
        print(f'  tier2 updated ({len(tier2_data)} choices)')

        # 5. Update review labels/desc + discount tags
        for rv in sc.get('reviews', []):
            r_id = rv['id']
            if r_id in review_data:
                for k, v in review_data[r_id].items():
                    rv[k] = v
            if sc_id in review_dt and r_id in review_dt[sc_id]:
                rv['discountTags'] = review_dt[sc_id][r_id]
        print(f'  review updated ({len(review_data)} choices)')

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
