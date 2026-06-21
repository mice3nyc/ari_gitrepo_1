#!/usr/bin/env python3
"""초등 전체브랜칭.csv(평면 135경로) → data/elem/ 시나리오 데이터 (Phase 1).

원칙:
- CSV에 있는 것은 다 채운다(선택·위임→delegation·비용·점수·등급·카드·결과텍스트·검토선택).
- CSV에 없는 콘텐츠(만화캡션·리포트성찰·중간결과·선택 desc/lesson 등)는 ⟨TODO⟩로 표시.
- 회복력 → 적응성 교체. 위임 컬럼 공백/줄바꿈 정규화.
- 엔진 무변경: 초등은 per-choice pilot 비활성 → 카드는 leaf competencyCards(end 지급).
- 중등(data/scenarios.yaml)은 절대 안 건드림. 출력은 전부 data/elem/.

산출: data/elem/{scenario_meta,scenario_choices,scenario_leaves}.csv + scenarios.yaml
      + micro_offsets.yaml + ai_flags.yaml
"""
import csv, sys, io
from pathlib import Path
from collections import OrderedDict

ROOT = Path(__file__).resolve().parent.parent           # v13-mid/
ELEM_DIR = ROOT / "data" / "elem"
FLAT = Path("/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/AI리터러시/시나리오_초등/초등 전체브랜칭.csv")
TODO = "⟨TODO⟩"

# 한글 시나리오명 → 영문 id (피터공 6/21 승인)
SCEN_ID = {
    "독후감쓰기": "bookreport", "동물발표": "animaltalk", "진로직업카드": "jobcard",
    "캐릭터만들기": "classmascot", "역사검증": "historycheck",
}
SCEN_ORDER = ["독후감쓰기", "동물발표", "진로직업카드", "캐릭터만들기", "역사검증"]

# 시나리오 메타 (아리공 초안 — 상황텍스트는 피터공 6/21)
META = {
    "bookreport": dict(category=1, categoryName="국어", title="독후감 쓰기",
        learningMessage="AI가 써 준 독후감에는 내가 읽지 않은 느낌이 섞일 수 있다.",
        domainLabel="문해", aiSuitability="mid", timeBudgetSec=600,
        situation="월요일까지 독후감을 써야 하는데 책을 아직 다 읽지 못했다. 그래도 읽은 부분 중 기억나는 장면은 있다. 시간이 많지 않아 지금부터 어떻게 써야 내가 읽고 느낀 독후감이라고 말할 수 있을지 정해야 한다."),
    "animaltalk": dict(category=2, categoryName="발표", title="좋아하는 동물 발표",
        learningMessage="AI가 만든 발표문은 내가 설명하지 못하면 내 발표가 아니다.",
        domainLabel="표현", aiSuitability="mid", timeBudgetSec=600,
        situation="우리 반에서 내가 좋아하는 동물을 소개하는 발표를 하기로 했다. 발표할 동물은 고를 수 있지만, 왜 좋아하는지와 친구들이 재미있게 들을 내용은 아직 정리하지 못했다. 발표문을 어떻게 준비할지 정해야 한다."),
    "jobcard": dict(category=3, categoryName="진로", title="진로 직업 소개 카드",
        learningMessage="AI가 골라 준 직업 이유는 내 이유가 아닐 수 있다.",
        domainLabel="탐색", aiSuitability="mid", timeBudgetSec=600,
        situation="진로 시간에 나에게 어울릴 것 같은 직업 소개 카드를 만들기로 했다. 후보는 수의사, 웹툰 작가, 운동선수 세 가지다. 모두 멋져 보이지만, 내가 왜 그 직업을 골랐는지와 실제로 어떤 일을 하는지는 더 확인해야 한다."),
    "classmascot": dict(category=4, categoryName="창작", title="반 캐릭터 만들기",
        learningMessage="잘 그린 그림보다 우리 반다움이 캐릭터를 만든다.",
        domainLabel="창작", aiSuitability="mid", timeBudgetSec=600,
        situation="우리 반 캐릭터 공모전이 열렸다. 뽑힌 캐릭터는 교실문 앞과 반 게시판에 1년 동안 쓰인다. 보기 좋은 그림도 중요하지만, 친구들이 보고 우리 반답다고 느낄 캐릭터를 만들어야 한다."),
    "historycheck": dict(category=5, categoryName="사회", title="역사 수행평가 검증",
        learningMessage="재미있는 이야기일수록 진짜인지 확인해야 한다.",
        domainLabel="검증", aiSuitability="mid", timeBudgetSec=600,
        situation="사회 시간에 조선 시대의 놀라운 실제 사건을 찾아 사례 카드를 만들기로 했다. 자료를 찾다가 태종 때 코끼리가 섬으로 유배를 갔다는 이야기를 보았다. 재미있지만 진짜 있었던 일인지 확인하고 카드에 넣어야 한다."),
}

# 역량카드(humanCentric) 태그 → 축
HC_AXIS = {}
for axis, tags in {
    "중심잡기": ["주체성", "적응성", "호기심"],
    "융합하기": ["창의적 사고", "문제해결적 사고", "직관적 통찰", "통합적 사고", "맥락적 사고"],
    "성찰하기": ["비판적 사고", "윤리적 사고", "성찰적 사고", "사회·관계적 사고"],
}.items():
    for t in tags:
        HC_AXIS[t] = axis

def fix_card(c):
    c = (c or "").strip()
    return "적응성" if c == "회복력" else c   # 회복력 폐지 → 적응성 교체

def norm_deleg(v):
    """위임 공백/줄바꿈 정규화: '전체 위임\n→회복' → '전체 위임 →회복'."""
    return " ".join((v or "").replace("\n", " ").split())

def deleg_signs(v):
    """위임 → (delegation, knowledge) 부호 (근사)."""
    base = norm_deleg(v)
    if base.startswith("내가 직접"): return "+", "+"
    if base.startswith("부분 위임"): return "+", ""
    if base.startswith("전체 위임"): return "-", "-"
    return "", ""

def is_ai(v):
    return "위임" in norm_deleg(v) and not norm_deleg(v).startswith("내가 직접")

def I(s, d=0):
    try: return int(str(s).strip())
    except: return d

def main():
    ELEM_DIR.mkdir(parents=True, exist_ok=True)
    with open(FLAT, encoding="utf-8-sig", newline="") as f:
        rows = [r for r in csv.reader(f)][1:]
    rows = [r for r in rows if r and r[0].strip()]

    # 컬럼 인덱스
    # 0명1경로 2-8[1차]선택위임시에점역능 9-15[2차] 16-22[검토:선택깊이시에점역능] 23최종24등급 25단계합26시합27에합 28결과
    scen = OrderedDict()
    for r in rows:
        scen.setdefault(r[0], []).append(r)

    meta_rows, choice_rows, leaf_rows = [], [], []
    micro = OrderedDict(); aiflags = OrderedDict()

    for kname in SCEN_ORDER:
        sid = SCEN_ID[kname]; data = scen[kname]
        m = META[sid]
        # domainPool = 이 시나리오에서 등장하는 능력카드 전체
        dompool = []
        for r in data:
            for idx in (8, 15, 22):
                c = fix_card(r[idx])
                if c and c not in dompool and c in {"자기이해","표현력","문해력","분석력","검토력","자료판단력","소통력","협업력","학습력","탐색력"}:
                    dompool.append(c)
        meta_rows.append(dict(
            scenario_id=sid, category=m["category"], categoryName=m["categoryName"],
            title=m["title"], version="v1", learningMessage=m["learningMessage"],
            aiSuitability=m["aiSuitability"], timeBudgetSec=m["timeBudgetSec"],
            domainPool=";".join(dompool), domainLabel=m["domainLabel"],
            situation_text=m["situation"], situation_image="", cuts="",
            semesterClosing_text="", semesterClosing_image=""))

        micro[sid] = OrderedDict(); aiflags[sid] = OrderedDict()

        # tier1 노드 (3) — 라벨 dedupe, 등장 순서 A/B/C
        t1_order = []; t1_rows = {}
        for r in data:
            tid = r[1][0]  # 경로 첫 글자
            if tid not in t1_rows:
                t1_rows[tid] = r; t1_order.append(tid)
        for tid in sorted(t1_order):
            r = t1_rows[tid]; dg, kn = deleg_signs(r[3])
            hc = fix_card(r[7]); dom = fix_card(r[8])
            choice_rows.append(dict(
                scenario_id=sid, type="tier1", id=tid, parent="",
                label=r[2].strip(), desc=TODO, lesson=TODO,
                basePoint=I(r[6]), varPoint=0, points="", boostType="",
                delegation=dg, knowledge=kn,
                stageCost_time=I(r[4]), stageCost_energy=I(r[5]),
                discountTags_humanCentric=HC_AXIS.get(hc, ""),
                discountTags_domain=dom, discountTags_strongDomain=""))
            aiflags[sid][tid] = is_ai(r[3])

        # tier2 노드 (9) — (tier1,tier2) dedupe
        t2_order = []; t2_rows = {}
        for r in data:
            t2id = r[1][:2]  # 'A1'
            if t2id not in t2_rows:
                t2_rows[t2id] = r; t2_order.append(t2id)
        for t2id in sorted(t2_order):
            r = t2_rows[t2id]; parent = t2id[0]
            dg, kn = deleg_signs(r[10]); hc = fix_card(r[14]); dom = fix_card(r[15])
            # 중간결과(results) — deltaR2/R3 = R2/R3 최종 − R1 최종 (같은 tier2)
            fin = {}
            for rr in data:
                if rr[1][:2] == t2id:
                    fin[rr[1][2:]] = I(rr[23])
            d2 = fin.get("R2", 0) - fin.get("R1", 0)
            d3 = fin.get("R3", 0) - fin.get("R1", 0)
            choice_rows.append(dict(
                scenario_id=sid, type="tier2", id=t2id, parent=parent,
                label=r[9].strip(), desc="", lesson=TODO,
                basePoint=I(r[13]), varPoint=0, points="", boostType="",
                delegation=dg, knowledge=kn,
                delta_afterA_del="", delta_afterA_know="", delta_afterB_del="",
                delta_afterB_know="", delta_afterC_del="", delta_afterC_know="",
                stageCost_time=I(r[11]), stageCost_energy=I(r[12]),
                result_text=TODO, result_summary=TODO, result_lesson=TODO,
                result_deltaR2=d2, result_deltaR3=d3, result_basePoint="",
                result_hiddenIssues="", matchGroups="",
                discountTags_humanCentric=HC_AXIS.get(hc, ""),
                discountTags_domain=dom, discountTags_strongDomain=dom))
            micro[sid][t2id] = 0
            aiflags[sid][t2id] = is_ai(r[10])

        # review 노드 (3) — 깊이 R1/R2/R3 (라벨은 깊이 일반, 경로별 실제문구는 reviewLabels)
        rv_seen = {}
        for r in data:
            rid = r[1][2:]  # 'R1'
            if rid not in rv_seen: rv_seen[rid] = r
        for rid in ["R1", "R2", "R3"]:
            if rid not in rv_seen: continue
            r = rv_seen[rid]
            depth_label = {"R1": "검토하지 않고 낸다", "R2": "겉을 한번 본다", "R3": "깊이 따져 본다"}[rid]
            dom = fix_card(r[22])
            choice_rows.append(dict(
                scenario_id=sid, type="review", id=rid, parent="",
                label=depth_label, desc=TODO, lesson=TODO,
                basePoint="", varPoint="", points=I(r[20]), boostType="",
                delegation="", knowledge="",
                stageCost_time=I(r[18]), stageCost_energy=I(r[19]),
                discountTags_humanCentric="", discountTags_domain="",
                discountTags_strongDomain=dom))

        # leaves (27)
        for r in data:
            leaf = r[1]  # 'A1R1'
            cards = []
            for idx in (7, 8, 14, 15, 21, 22):
                c = fix_card(r[idx])
                if c and c not in cards: cards.append(c)
            hc_path = [fix_card(r[i]) for i in (7,14,21) if fix_card(r[i])]
            dom_path = [fix_card(r[i]) for i in (8,15,22) if fix_card(r[i])]
            axis = HC_AXIS.get(hc_path[-1], "") if hc_path else ""
            tag = hc_path[-1] if hc_path else ""
            leaf_rows.append(dict(
                scenario_id=sid, leaf=leaf, tier1=leaf[0], tier2=leaf[:2], review=leaf[2:],
                reviewSupplement=TODO, reviewLabel=r[16].strip(),
                resourceCost_time=I(r[26]), resourceCost_energy=I(r[27]),
                expReward=max(1, I(r[23]) // 12),
                competencyCards=";".join(cards),
                axisDelta_requireCard="", axisDelta_bonusPoint="", axisDelta_note="",
                finals_score=I(r[23]), finals_grade=r[24].strip(), finals_item="",
                finals_delegation=norm_deleg(r[10]), finals_knowledge="", finals_awareness=TODO,
                finals_cut6Feedback=r[28].strip(),  # 결과텍스트 = 실데이터
                finals_replaySuggestion=TODO, finals_cardEarned="true" if cards else "false",
                finals_humanCentricAxis=axis, finals_humanCentricTag=tag,
                finals_domainCards=";".join(dom_path), finals_growthCard="",
                finals_replayCardStatus="", finals_expReward=max(1, I(r[23]) // 12),
                finals_shortFeedback=TODO, finals_reportFeedback=TODO, finals_earnedCards="",
                finals_adjustedScore="", finals_adjustedType="", finals_adjustedReason="",
                finals_reportPathSummary=TODO,
                finals_cartoonCaption1=TODO, finals_cartoonCaption2=TODO,
                finals_cartoonCaption3=TODO, finals_cartoonCaption4=TODO,
                finals_cartoonCaption5=TODO,
                finals_reportReflection=TODO, finals_reportCardSummary=TODO,
                finals_reportStrengthTags="", finals_reportGrowthTags=""))

    # CSV 쓰기 (헤더는 중등 템플릿과 동일 순서로)
    def write_csv(name, rows, header):
        with open(ELEM_DIR / name, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=header)
            w.writeheader()
            for row in rows: w.writerow({k: row.get(k, "") for k in header})

    def header_of(tmpl):
        with open(ROOT / "data" / tmpl, encoding="utf-8-sig", newline="") as f:
            return next(csv.reader(f))

    write_csv("scenario_meta.csv", meta_rows, header_of("scenario_meta.csv"))
    write_csv("scenario_choices.csv", choice_rows, header_of("scenario_choices.csv"))
    write_csv("scenario_leaves.csv", leaf_rows, header_of("scenario_leaves.csv"))

    # 변환기로 scenarios.yaml 생성 (data/elem로 출력 — 중등 무관)
    sys.path.insert(0, str(ROOT))
    import csv_to_scenarios as conv
    scenarios = conv.rebuild(ELEM_DIR)
    (ELEM_DIR / "scenarios.yaml").write_text(conv.to_yaml(scenarios), encoding="utf-8")

    # micro_offsets / ai_flags (빌드 일관성 검증 통과용)
    import yaml
    (ELEM_DIR / "micro_offsets.yaml").write_text(
        yaml.dump({k: dict(v) for k, v in micro.items()}, allow_unicode=True, sort_keys=False), encoding="utf-8")
    (ELEM_DIR / "ai_flags.yaml").write_text(
        yaml.dump({k: dict(v) for k, v in aiflags.items()}, allow_unicode=True, sort_keys=False), encoding="utf-8")

    print("OK — data/elem/ 생성:",
          len(meta_rows), "scen,", len(choice_rows), "choices,", len(leaf_rows), "leaves")
    print("scenarios.yaml keys:", list(scenarios.keys()))

if __name__ == "__main__":
    main()
