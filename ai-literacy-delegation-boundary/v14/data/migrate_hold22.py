#!/usr/bin/env python3
"""텍스트-경로 정합 보류 22건 정비 — 6/11 세션463.

v22에서 보류한 애매 22건(공통 문구 돌려쓰기 회색지대 + 데이터 오류 의심
+ 등급-톤 모순)을 전수 수정. 피터공 결정(6/11): "어긋나게 읽힐 수 있으면
전부 경로 맞춤 수정".

근거: data/exports/검토_260610/텍스트정합_*.md 5종의 애매 행
백업: scenarios.yaml.before-hold22
산출: exports/검토_260611/정비결과_보류22_대조표.csv
"""

import csv
import shutil
from pathlib import Path

from ruamel.yaml import YAML
from ruamel.yaml.scalarstring import SingleQuotedScalarString as SQ

yaml = YAML()
yaml.preserve_quotes = True
yaml.width = 4096

HERE = Path(__file__).resolve().parent
YAML_PATH = HERE / "scenarios.yaml"
BACKUP_PATH = HERE / "scenarios.yaml.before-hold22"
OUT_DIR = HERE / "exports" / "검토_260611"

TITLES = {
    "selfintro": "자기소개 글",
    "groupwork": "모둠 발표 자료",
    "eorinwangja": "어린왕자 독후감",
    "career": "AI 시대에 내 진로는?",
    "studyplan": "시험 2주 전 — 공부를 어떻게",
}

CHANGES = []  # (구분, 시나리오id, 위치, before, after)


def setf(data, sid, lid, key, val, kind="텍스트(보류)"):
    obj = data[sid]["finals"][lid]
    before = obj.get(key)
    if before == val:
        print(f"  (스킵: 이미 적용) {sid}.{lid}.{key}")
        return
    obj[key] = val
    CHANGES.append((kind, sid, f"{lid}.{key}", str(before), str(val)))


# ---------------------------------------------------------------- selfintro
def fix_selfintro(d):
    # "내 말에서 시작했더라도..." A계열 R1 문구가 B·C계열에 확산된 패턴
    # 6/11 피터공 검토 반영: 조건문 충고투 → 실제 한 일의 과거 서술
    setf(d, "selfintro", "B1R1", "reportReflection",
         "AI 질문에 답하며 이야기는 모았지만, 확인 없이 올려서 이 글이 정말 나다운지 모른 채 끝났다.")
    setf(d, "selfintro", "C2R1", "reportReflection",
         "글은 AI가 썼고 나는 정보 몇 가지만 줬다. 확인도 없이 냈으니 내 소개라고 말하기 어렵다.")
    setf(d, "selfintro", "C3R1", "reportReflection",
         "AI 글을 내 글로 다시 쓴 건 좋았지만, 확인 없이 내서 다시 쓴 의미가 절반만 남았다.")
    setf(d, "selfintro", "B2R1", "reportReflection",
         "순서는 AI에게 받았어도 채운 이야기는 내 것이었다. 그런데 마지막 확인을 건너뛰어 그 장점이 드러나지 못했다.")
    # A3(서툴어도 직접 초안)인데 A2(경험 중심)용 반성문
    setf(d, "selfintro", "A3R2", "reportReflection",
         "서툴러도 직접 쓴 초안이 글의 중심을 잡았다. 표현은 다듬었지만, 이 글이 나를 잘 보여주는지까지는 확인하지 못했다.")
    # R2에서 이미 표시·수정했는데 R1용 권유 재사용
    setf(d, "selfintro", "C2R2", "replaySuggestion",
         "다시 해본다면 어색한 표현을 고치는 데서 한 발 더 나아가, 내용이 정말 내 이야기인지까지 확인해 보세요.")


# ---------------------------------------------------------------- groupwork
def fix_groupwork(d):
    # A2(역할 나누기)인데 C·B계열용 "발표 모양 빨리" 서술
    setf(d, "groupwork", "A2R1", "reportReflection",
         "역할은 빠르게 나눴지만, 각자 맡은 내용이 하나의 발표로 이어지는지 확인하는 과정이 부족했다.")
    # A1(질문 먼저)인데 슬라이드 생성 맥락 없이 "어색한 슬라이드"
    setf(d, "groupwork", "A1R2", "awareness",
         "모둠 질문에 맞춰 모은 자료에서 빠진 출처와 어색한 부분을 고치며 질문이 더 잘 보였어요. 발표 흐름 전체는 한 번 더 맞출 수 있어요.")
    setf(d, "groupwork", "A1R2", "shortFeedback",
         "모둠 질문에 맞춰 모은 자료의 빠진 출처와 어색한 부분을 고치며 질문이 더 잘 보였어요.")


# -------------------------------------------------------------- eorinwangja
def fix_eorinwangja(d):
    # B등급(82)인데 D등급용 질책 톤 cut6Feedback
    setf(d, "eorinwangja", "A3R1", "cut6Feedback",
         "이해되지 않는 부분을 붙들고 직접 쓴 과정이 글에 힘을 줬어요. 내기 전에 한 번만 더 확인했다면 더 단단해졌을 거예요.",
         kind="등급-톤")
    setf(d, "eorinwangja", "B1R3", "cut6Feedback",
         "요약으로 길을 잡고 중요한 장면을 직접 확인한 균형이 좋았어요. 직접 읽는 부분을 조금 더 늘리면 다음 글이 더 단단해질 거예요.",
         kind="등급-톤")
    # reportCardSummary가 실제 domainCards와 불일치 (A2 계열 공통 문구 돌려쓰기)
    setf(d, "eorinwangja", "A2R2", "reportCardSummary",
         SQ("[중심잡기] 주체성 · 문해력 · 검토력"), kind="카드 표기")
    setf(d, "eorinwangja", "A2R1", "reportCardSummary",
         SQ("[중심잡기] 주체성 · 문해력"), kind="카드 표기(같은 결)")
    setf(d, "eorinwangja", "A2R3", "reportCardSummary",
         SQ("[중심잡기] 주체성 · 문해력 · 표현력 · 검토력"), kind="카드 표기(같은 결)")
    # C1R1 reportReflection은 경로와 정합 → 유지 (대조표에 판단 기록만)
    cur = d["eorinwangja"]["finals"]["C1R1"]["reportReflection"]
    CHANGES.append(("유지 판단", "eorinwangja", "C1R1.reportReflection", str(cur),
                    "(수정 안 함 — C1 경로와 정합. C2·C3와 문구가 다른 것은 경로 특이성 반영)"))


# ------------------------------------------------------------------- career
def fix_career(d):
    # A계열(추천 안 받음)에 B/C계열용 "추천" 어휘
    setf(d, "career", "A2R1", "reportReflection",
         "걱정을 직접 적으며 출발한 것은 좋았지만, 그 걱정이 실제와 맞는지 확인하는 과정이 부족했다.")
    setf(d, "career", "A3R1", "reportReflection",
         "관심을 작은 실험으로 옮긴 출발이 좋았다. 실험에서 본 것을 한 번 더 확인했다면 방향이 더 분명해졌을 것이다.")
    setf(d, "career", "A2R2", "reportReflection",
         "내 걱정을 적고 낯선 정보를 확인하면서, 막연한 불안이 알아볼 수 있는 질문으로 바뀌었다.")
    setf(d, "career", "A2R3", "reportReflection",
         "걱정을 적는 데서 출발해 내 관심과 실제 활동으로 잇는 데까지 갔다. 불안이 판단의 재료가 되었다.")
    setf(d, "career", "A3R2", "reportReflection",
         "작은 실험이 진로 생각을 머리 밖으로 꺼냈고, 확인을 거치며 다음에 해볼 것이 보였다.")
    setf(d, "career", "A3R3", "reportReflection",
         "작은 실험과 깊은 확인이 이어지면서, 진로가 고르는 것이 아니라 만들어 가는 것이 되었다.")


# ---------------------------------------------------------------- studyplan
def fix_studyplan(d):
    # A1·A2(AI 안 쓰는 경로)에 "AI 자료" 공통 반영문
    setf(d, "studyplan", "A1R1", "reportReflection",
         "직접 문제를 풀어 약점을 찾은 출발이 좋았다. 다만 계획을 점검 없이 시작해, 중간에 방향을 확인할 자리가 없었다.")
    setf(d, "studyplan", "A1R2", "reportReflection",
         "직접 푼 문제에서 약점을 찾고 일정도 한 번 손봤다. 내 실력에서 출발한 계획이라 공부가 흔들리지 않았다.")
    setf(d, "studyplan", "A1R3", "reportReflection",
         "문제 풀이로 약점을 찾고, 오답과 남은 시간을 기준으로 우선순위까지 다시 잡았다. 처음부터 끝까지 내 실력에서 출발한 계획이었다.")
    setf(d, "studyplan", "A2R3", "reportReflection",
         "범위표로 아는 것과 모르는 것을 나누고, 오답 기준으로 우선순위를 다시 잡았다. 막연하던 계획이 내 약점에 맞는 계획이 되었다.")
    # A3(자신감 비교)에 "계획이나 요약" 서술
    setf(d, "studyplan", "A3R1", "reportReflection",
         "자신감과 실제 풀이를 비교해 약점은 보였지만, 그것을 계획으로 옮겨 확인하는 과정이 부족했다.")
    # B2(약점 말하고 순서 받음) — "약점에 맞는지 확인 못 함"의 대상을 정확히
    setf(d, "studyplan", "B2R1", "reportReflection",
         "내 약점을 말하고 공부 순서를 받았지만, 그 순서가 실제 내 오답과 맞는지 확인하지 못했다.")
    # C3(미루기·쉬운 일)에는 따를 "계획·자료"가 없음
    setf(d, "studyplan", "C3R1", "cartoonCaption5",
         "공부를 시작한 기분만 남긴 채, 확인 없이 그대로 가기로 했다.")
    setf(d, "studyplan", "C3R2", "awareness",
         "쉬운 일부터 하다 보니 무언가 빠졌다는 느낌은 들었지만, 피하고 있던 약점 확인은 아직 그대로 남았어요.")
    # matchGroups C1R3 note에 C2(작년 자료) 설명이 들어가 있음 — 내부 메모
    for g in d["studyplan"]["matchGroups"]:
        if isinstance(g, dict) and g.get("leafId") == "C1R3":
            before = g.get("note")
            after = "친구나 학원 계획표를 그대로 따르는 대신 내 오답과 남은 시간으로 다시 배치하는 자리 — 학습설계 카드와 강한 매칭"
            if before != after:
                g["note"] = after
                CHANGES.append(("내부 메모", "studyplan", "matchGroups.C1R3.note", str(before), after))


def main():
    if not BACKUP_PATH.exists():
        shutil.copy2(YAML_PATH, BACKUP_PATH)
        print(f"백업: {BACKUP_PATH.name}")
    with open(YAML_PATH) as f:
        d = yaml.load(f)
    fix_selfintro(d)
    fix_groupwork(d)
    fix_eorinwangja(d)
    fix_career(d)
    fix_studyplan(d)
    with open(YAML_PATH, "w") as f:
        yaml.dump(d, f)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / "정비결과_보류22_대조표.csv"
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["번호", "구분", "시나리오", "위치", "수정 전", "수정 후", "피터공 판단"])
        for i, (kind, sid, loc, before, after) in enumerate(CHANGES, 1):
            w.writerow([i, kind, TITLES[sid], loc, before, after, ""])
    print(f"변경 {len(CHANGES)}건 → {out}")


if __name__ == "__main__":
    main()
