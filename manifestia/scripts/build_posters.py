#!/usr/bin/env python3
"""build:data — merged manifesto_dataset.json → 1단계 프로토타입 posters.json (SPEC §2)

- record(작가) 89개를 manifesto(포스터) 단위로 펼침 → 120 포스터
- legacy_game_number 없는 신규 14개에 임시 코드(9xxxx) 부여 (정식 4자리 코드는 게이트 B/DEV-014)
- value_marks(4유형×4가치), collectible_words(4슬롯), 다국어 필드 보존
"""
import json, os

SRC = '/Users/p.air15/Neo-Obsi-Sync/current_projects/Städel Manifestia/data/merged/manifesto_dataset.json'
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'posters.json')
CH = ['HEALER', 'TANKER', 'ILLUSIONIST', 'PROFESSOR']


def build():
    d = json.load(open(SRC, encoding='utf-8'))
    posters = []
    tmp = 0
    for r in d['records']:
        a = r.get('artist', {})
        for m in r.get('manifestos', []):
            pno = m.get('legacy_game_number')
            if not pno:                      # 신규(번호 없음) → 임시 코드
                tmp += 1
                pno = '9%04d' % tmp
            posters.append({
                'poster_no': pno,
                'artist_ko': a.get('name_ko'),
                'affinity': m.get('character_affinity', []) or [],
                'value_marks': m.get('value_marks', {}),
                'words': [
                    {'slot': w.get('slot'), 'word_ko': w.get('word_ko'), 'type': w.get('type')}
                    for w in (m.get('collectible_words') or [])
                ],
                'text_ko': m.get('text_ko'),
            })
    out = {'schema': 'manifestia-prototype-1', 'baseline': 'korean',
           'count': len(posters), 'temp_coded': tmp, 'posters': posters}
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return posters, tmp


def verify(posters):
    from collections import Counter
    star4 = Counter()
    bad = 0
    seen = Counter()
    for p in posters:
        if not p['poster_no'] or len(p['words']) != 4:
            bad += 1
        seen[p['poster_no']] += 1
        for c in CH:
            if sum(1 for v in p['value_marks'].get(c, {}).values() if v) == 4:
                star4[c] += 1
    dup = [k for k, v in seen.items() if v > 1]
    print('포스터:', len(posters), '| 결함:', bad, '| 코드 중복:', len(dup))
    print('4★ per 캐릭터:', dict(star4))


if __name__ == '__main__':
    posters, tmp = build()
    print('임시 코드 부여:', tmp, '개')
    verify(posters)
