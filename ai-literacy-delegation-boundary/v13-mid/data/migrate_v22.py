#!/usr/bin/env python3
"""v22 논리정합 일괄 정비 — 6/10 세션457.

Part A: 가설표 v2 16행 (카드·등급·태그 구조 정비, SPEC §16 위반 34건 해소)
Part B: 텍스트-경로 정합(R9) 확실 건 수정 (백도 5종 보고서 기반)

근거: data/exports/검토_260610/정합위반_가설표_v2_16행.csv + 텍스트정합_*.md 5종
백업: scenarios.yaml.before-v22-migration
"""

import shutil
import sys
from pathlib import Path

from ruamel.yaml import YAML

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 4096

HERE = Path(__file__).resolve().parent
YAML_PATH = HERE / "scenarios.yaml"
BACKUP_PATH = HERE / "scenarios.yaml.before-v22-migration"

CHANGES = []  # (위치, 필드, before, after)


def setf(obj, key, val, loc):
    before = obj.get(key)
    if before == val:
        print(f"  (스킵: 이미 적용) {loc}.{key}")
        return
    obj[key] = val
    CHANGES.append((loc, key, repr(before), repr(val)))


def leaf(data, sid, lid):
    return data[sid]["finals"][lid]


def review(data, sid, rid):
    for r in data[sid]["reviews"]:
        if r["id"] == rid:
            return r
    raise KeyError(f"{sid} review {rid}")


def tier2(data, sid, cid):
    for c in data[sid]["tier2"][cid[0]]:
        if c["id"] == cid:
            return c
    raise KeyError(f"{sid} tier2 {cid}")


def append_domain(dt, label, loc):
    doms = list(dt.get("domain") or [])
    if label in doms:
        print(f"  (스킵: 이미 있음) {loc} domain {label}")
        return
    CHANGES.append((loc, "discountTags.domain", repr(doms), repr(doms + [label])))
    dt["domain"] = doms + [label]


def part_a(data):
    print("── Part A: 구조 정비 (가설표 16행)")

    # 1. 모둠 B2R2 — D 규약: 역량카드 비움
    l = leaf(data, "groupwork", "B2R2")
    setf(l, "humanCentricAxis", "", "groupwork.B2R2")
    setf(l, "humanCentricTag", "", "groupwork.B2R2")
    setf(l, "domainCards", [], "groupwork.B2R2")

    # 2·6. 게이트 켬 — C+깊은 검토 = 카드
    setf(leaf(data, "groupwork", "B2R3"), "cardEarned", True, "groupwork.B2R3")
    setf(leaf(data, "groupwork", "C2R3"), "cardEarned", True, "groupwork.C2R3")

    # 3. 시험2주전 A1R3 — 검토력 추가 (단조성)
    setf(leaf(data, "studyplan", "A1R3"), "domainCards", ["학습력", "검토력"], "studyplan.A1R3")

    # 4. 자기소개 B2R1 — 등급 C 상향 (형제 시나리오 정렬)
    l = leaf(data, "selfintro", "B2R1")
    setf(l, "grade", "C", "selfintro.B2R1")
    setf(l, "score", 62, "selfintro.B2R1")

    # 5. 어린왕자 C1R3 — 등급 C 상향 + 카드 유지 (피터공: 검토를 잘 했으면 C)
    l = leaf(data, "eorinwangja", "C1R3")
    setf(l, "grade", "C", "eorinwangja.C1R3")
    setf(l, "score", 60, "eorinwangja.C1R3")

    # 7. C+검토 생략 카드 제거 4곳 (지급선: C는 검토가 가른다)
    l = leaf(data, "selfintro", "A3R1")
    setf(l, "domainCards", [], "selfintro.A3R1")
    setf(l, "cardEarned", False, "selfintro.A3R1")
    l = leaf(data, "selfintro", "C3R1")
    setf(l, "humanCentricAxis", "", "selfintro.C3R1")
    setf(l, "humanCentricTag", "", "selfintro.C3R1")
    setf(l, "domainCards", [], "selfintro.C3R1")
    setf(l, "cardEarned", False, "selfintro.C3R1")
    l = leaf(data, "eorinwangja", "B2R1")
    setf(l, "domainCards", [], "eorinwangja.B2R1")
    setf(l, "cardEarned", False, "eorinwangja.B2R1")
    l = leaf(data, "studyplan", "B3R1")
    setf(l, "humanCentricAxis", "", "studyplan.B3R1")
    setf(l, "humanCentricTag", "", "studyplan.B3R1")
    setf(l, "domainCards", [], "studyplan.B3R1")
    setf(l, "cardEarned", False, "studyplan.B3R1")

    # 8. 검토 선택지 태그 분석력 보강 (시나리오 간 일관화)
    for sid, rid in [("selfintro", "R2"), ("selfintro", "R3"),
                     ("groupwork", "R2"), ("groupwork", "R3"),
                     ("career", "R3"), ("studyplan", "R3")]:
        append_domain(review(data, sid, rid)["discountTags"], "분석력", f"{sid}.reviews.{rid}")

    # 9. 자기소개 B3 — 자기이해 추가 (내 메모 = 자기 재료)
    append_domain(tier2(data, "selfintro", "B3")["discountTags"], "자기이해", "selfintro.tier2.B3")

    # 10. 모둠 C1R3 — 소통력 → 검토력
    setf(leaf(data, "groupwork", "C1R3"), "domainCards", ["협업력", "검토력"], "groupwork.C1R3")

    # 11. 어린왕자 A2 — 표현력 추가 (독후감 쓰기 행동)
    append_domain(tier2(data, "eorinwangja", "A2")["discountTags"], "표현력", "eorinwangja.tier2.A2")

    # 12. 어린왕자 A3R1 — 탐색력 → 분석력
    setf(leaf(data, "eorinwangja", "A3R1"), "domainCards", ["문해력", "분석력"], "eorinwangja.A3R1")

    # 13. 진로 A3 — 선택지 태그 성찰하기 → 융합하기 (창의적 변환 행동)
    dt = tier2(data, "career", "A3")["discountTags"]
    setf(dt, "humanCentric", "융합하기", "career.tier2.A3")

    # 14·15. 시험2주전 A2·A3 계열 카드 차별화 (문제해결적 사고 복붙 해소)
    for lid in ("A2R1", "A2R2", "A2R3"):
        l = leaf(data, "studyplan", lid)
        setf(l, "humanCentricAxis", "중심잡기", f"studyplan.{lid}")
        setf(l, "humanCentricTag", "주체성", f"studyplan.{lid}")
    for lid in ("A3R1", "A3R2", "A3R3"):
        l = leaf(data, "studyplan", lid)
        setf(l, "humanCentricAxis", "성찰하기", f"studyplan.{lid}")
        setf(l, "humanCentricTag", "성찰적 사고", f"studyplan.{lid}")

    # 16. 자기소개 B1R3 — '빈자리 발견' → 회복력 (24장 모델 정합)
    setf(leaf(data, "selfintro", "B1R3"), "growthCard", "회복력", "selfintro.B1R3")


def part_b(data):
    print("── Part B: 텍스트-경로 정합 (R9 확실 건)")

    # ── career: A1은 AI 미사용 경로 ──
    txt = "가능성은 내가 좋아하는 것에서 나왔고, 마지막 선택도 내 관심과 기준에 남겨 두었다."
    for lid in ("A1R1", "A1R2", "A1R3"):
        setf(leaf(data, "career", lid), "reportReflection", txt, f"career.{lid}")
    # caption5 R2 공통 문구 "AI가 한 부분..." — A·C계열 6곳 (B계열은 유지)
    txt = "낯선 이름과 이상해 보이는 정보만 골라 확인했다."
    for lid in ("A1R2", "A2R2", "A3R2", "C1R2", "C2R2", "C3R2"):
        setf(leaf(data, "career", lid), "cartoonCaption5", txt, f"career.{lid}")
    # A3R1 — A등급인데 D등급 톤
    setf(leaf(data, "career", "A3R1"), "cut6Feedback",
         "좋은 방향의 선택이 많았고, 한두 지점을 더 확인하면 더 단단해질 수 있어요.",
         "career.A3R1")

    # ── studyplan: A계열·C계열은 AI 미사용 경로 ──
    rs = data["studyplan"]["reviewSupplements"]

    def set_rs(sid_rs, key, val):
        before = sid_rs.get(key)
        CHANGES.append((f"studyplan.reviewSupplements.{key}", "text", repr(before), repr(val)))
        sid_rs[key] = val

    set_rs(rs, "A1R3", "오답을 직접 모아 보며 실제로 이해가 부족한 부분을 확인하고, 공부 순서를 내가 고른 계획이 된다.")
    set_rs(rs, "A2R3", "범위표로 잡은 윤곽을 실제 문제 풀이로 확인하며, 이해 여부를 점검하는 공부 계획이 된다.")
    set_rs(rs, "A3R3", "자신감과 실제 풀이의 차이를 보고, 내 일정과 약점에 맞게 시간을 다시 조정한 공부 계획이 된다.")
    set_rs(rs, "C2R3", "공부할 양은 더 줄어들지만, 남이 만든 요약과 예상에 기대면서 실제 범위 확인이 약해지는 공부가 된다.")
    set_rs(rs, "C3R3", "부담을 줄인 최소 계획을 만들고, 오늘 바로 시작할 공부 항목 하나를 남긴 시험 준비가 된다.")
    # B3R1 — R1(검토 생략)인데 검토 수행 전제 서술
    setf(leaf(data, "studyplan", "B3R1"), "reportReflection",
         "AI가 만든 요약과 예상문제는 출발일 뿐, 실제 풀이로 확인해야 내 공부가 된다.",
         "studyplan.B3R1")
    # item 이름의 AI — C2(작년 자료·요약)·C3(미루기)는 AI 무관
    setf(leaf(data, "studyplan", "C2R3"), "item", "요약 의존 심화 카드", "studyplan.C2R3")
    setf(leaf(data, "studyplan", "C3R3"), "item", "최소 계획 카드", "studyplan.C3R3")

    # ── selfintro ──
    setf(leaf(data, "selfintro", "C1R1"), "reportReflection",
         "AI에게 통째로 맡긴 글은 빨리 생겼지만, 그 안에 내 이야기가 남지 않았다.", "selfintro.C1R1")
    txt = "검토로 글을 다듬었지만, 출발이 AI였던 만큼 내 경험이 글의 중심에 얇게 남았다."
    for lid in ("C1R2", "C1R3"):
        setf(leaf(data, "selfintro", lid), "reportReflection", txt, f"selfintro.{lid}")
    # C2R3 — R3(깊은 검토)인데 "확인 과정이 비어 있다" + 이미 한 행동을 권유
    setf(leaf(data, "selfintro", "C2R3"), "cut6Feedback",
         "꼼꼼히 확인한 점이 좋았어요. 다음에는 출발부터 내 이야기에서 시작하면 더 단단해질 수 있어요.",
         "selfintro.C2R3")
    setf(leaf(data, "selfintro", "C2R3"), "replaySuggestion",
         "다시 해본다면 시작부터 내 경험을 먼저 꺼내 보세요.", "selfintro.C2R3")
    # B3R2 — R2 주체는 플레이어 (AI가 고치는 단계 아님)
    l = leaf(data, "selfintro", "B3R2")
    setf(l, "awareness",
         "AI 초안에서 내 말투가 아닌 표현을 골라 고쳤어요. 글은 단단해졌지만, 더 깊게 보면 내 이야기의 중심이 더 선명해질 수 있어요.",
         "selfintro.B3R2")
    setf(l, "shortFeedback", "AI 초안에서 내 말투가 아닌 표현을 골라 고쳤어요.", "selfintro.B3R2")
    setf(l, "reportFeedback",
         "AI 초안에서 내 말투가 아닌 표현을 골라 고쳤어요. 글은 단단해졌지만, 더 깊게 보면 내 이야기의 중심이 더 선명해질 수 있어요.",
         "selfintro.B3R2")
    # C3R3·B3R3 — AI 초안이 먼저인 경로인데 "내 이야기를 먼저 세우고"
    txt = "AI 초안에서 출발했지만, 마지막에는 책임질 수 있는 내 말만 남겼다."
    for lid in ("C3R3", "B3R3"):
        setf(leaf(data, "selfintro", lid), "reportReflection", txt, f"selfintro.{lid}")

    # ── groupwork: A1은 AI 미사용 경로 ──
    txt = "모둠의 질문을 먼저 세웠기에, 발표 흐름과 설명 가능성까지 붙들 수 있었다."
    for lid in ("A1R1", "A1R2", "A1R3"):
        setf(leaf(data, "groupwork", lid), "reportReflection", txt, f"groupwork.{lid}")
    # B2R3 — B2엔 '내 자료'가 없음 (B3 전용 서술)
    setf(leaf(data, "groupwork", "B2R3"), "reportReflection",
         "AI가 만든 문구라도 모둠 흐름과 내 설명에 맞는지 끝까지 확인할 때 내 발표가 된다.",
         "groupwork.B2R3")

    # ── eorinwangja: B1·B2 검토 보충이 서로 다른 경로 행동 서술, B3 경로 정의 혼동 ──
    rs = data["eorinwangja"]["reviewSupplements"]
    set_rs2 = lambda key, val: (CHANGES.append((f"eorinwangja.reviewSupplements.{key}", "text",
                                                repr(rs.get(key)), repr(val))), rs.__setitem__(key, val))
    set_rs2("B1R1", "요약으로 잡은 줄거리에 장면 하나만 직접 본 채 그대로 냈다. 읽은 조각 밖은 빌린 말로 남았다.")
    set_rs2("B2R1", "유명한 문장과 그 앞뒤 장면만 본 채 그대로 냈다. 읽은 조각 밖의 책은 자기에게 통과하지 않았다.")
    set_rs2("B3R1", "책을 읽으며 AI와 주고받은 질문으로 생각은 쌓였지만, 정리한 글을 확인 없이 그대로 냈다.")
    # results.B3 — 라벨(책 읽으며 AI와 대화)과 다른 행동(외부 단서) 서술
    rb3 = data["eorinwangja"]["results"]["B3"]
    setf(rb3, "text",
         "책을 읽어 가며 궁금한 점을 AI에게 묻고, 그 답을 내 생각과 견주어 정리한 독후감 초안이 만들어졌다. 책과의 만남 위에 AI와의 대화가 쌓인 상태이다.",
         "eorinwangja.results.B3")
    setf(rb3, "summary", "책을 읽으며 AI와 대화해 정리한 독후감", "eorinwangja.results.B3")
    txt = "읽다가 궁금한 점을 AI에게 물으며 내 생각을 정리했다."
    for lid in ("B3R1", "B3R2", "B3R3"):
        setf(leaf(data, "eorinwangja", lid), "cartoonCaption3", txt, f"eorinwangja.{lid}")


def main():
    if not BACKUP_PATH.exists():
        shutil.copy2(YAML_PATH, BACKUP_PATH)
        print(f"백업: {BACKUP_PATH.name}")
    else:
        print(f"백업 이미 존재: {BACKUP_PATH.name} (유지)")

    with open(YAML_PATH, encoding="utf-8") as f:
        data = yaml.load(f)

    part_a(data)
    part_b(data)

    with open(YAML_PATH, "w", encoding="utf-8") as f:
        yaml.dump(data, f)

    print(f"\n변경 {len(CHANGES)}건:")
    for loc, key, before, after in CHANGES:
        b = before if len(before) < 40 else before[:37] + "..."
        a = after if len(after) < 40 else after[:37] + "..."
        print(f"  {loc}.{key}: {b} → {a}")


if __name__ == "__main__":
    main()
