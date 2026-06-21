#!/usr/bin/env python3
"""
v13-mid 콘텐츠 검토용 CSV 빌드 (2026-06-09, 아리공)

목적: 교사 피드백 반영 전, 현재 게임 콘텐츠를 사람이 검토할 수 있게 CSV로 도출.
  (1) 역량카드: 새 모델(인간중심 3축×12태그 + 도메인 10 + 성장 2) + 레거시 19종 대조
  (2) 시나리오: 시나리오별 1파일, 경로(leaf) 펼침 27행
        상황 - 1차선택 - 깊은선택(2차) - 검토 - 최종결과 - 점수

소스(현재 v13 정규화 데이터):
  scenario_meta.csv   : 상황
  scenario_choices.csv: 1차/2차 선택지 (type=tier1|tier2, id, parent)
  scenario_leaves.csv : 검토선택 + finals_* (최종결과·점수)
  texts.yaml          : 카드 모델 (humanCentricCards/domainCards/growthCards/cards)

stale한 build_csv.py(v07 경로·옛 yaml)는 사용하지 않는다.
"""
import csv
import os
import yaml

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "exports", "검토_260609")
os.makedirs(OUT, exist_ok=True)

SCENARIOS = ["selfintro", "groupwork", "eorinwangja", "career", "studyplan"]
SCEN_KR = {
    "selfintro": "자기소개글",
    "groupwork": "모둠발표자료",
    "eorinwangja": "어린왕자독후감",
    "career": "AI시대진로",
    "studyplan": "시험2주전공부",
}


def read_csv(name):
    with open(os.path.join(BASE, name), encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


# ============================================================
# (1) 역량카드 CSV — 새 모델 + 레거시 19종
# ============================================================
def build_cards():
    with open(os.path.join(BASE, "texts.yaml"), encoding="utf-8") as f:
        t = yaml.safe_load(f)

    rows = []
    # 새 모델 1a. 인간중심 3축 × 태그
    for axis, ad in (t.get("humanCentricCards") or {}).items():
        rows.append({
            "모델": "새(라이브)", "분류": "인간중심", "축/그룹": axis, "레벨": "축",
            "카드명": axis, "짧은설명": ad.get("short", ""),
            "상세정의": "", "상세설명": "", "색상": ad.get("color", ""),
        })
        for tag, td in (ad.get("tags") or {}).items():
            rows.append({
                "모델": "새(라이브)", "분류": "인간중심", "축/그룹": axis, "레벨": "태그",
                "카드명": tag, "짧은설명": td.get("short", ""),
                "상세정의": "", "상세설명": "", "색상": td.get("color", ""),
            })
    # 새 모델 1b. 도메인 10종
    for name, d in (t.get("domainCards") or {}).items():
        rows.append({
            "모델": "새(라이브)", "분류": "도메인", "축/그룹": "도메인", "레벨": "카드",
            "카드명": name, "짧은설명": d.get("short", ""),
            "상세정의": "", "상세설명": "", "색상": d.get("color", ""),
        })
    # 새 모델 1c. 성장 2종
    for name, d in (t.get("growthCards") or {}).items():
        rows.append({
            "모델": "새(라이브)", "분류": "성장", "축/그룹": "성장", "레벨": "카드",
            "카드명": name, "짧은설명": d.get("short", ""),
            "상세정의": "", "상세설명": "", "색상": d.get("color", ""),
        })
    # 레거시 19종 (deprecated)
    for name, d in (t.get("cards") or {}).items():
        rows.append({
            "모델": "레거시(deprecated)", "분류": "19종", "축/그룹": "", "레벨": "카드",
            "카드명": name, "짧은설명": d.get("short", ""),
            "상세정의": d.get("full_definition", ""),
            "상세설명": (d.get("description", "") or "").strip(),
            "색상": d.get("color", ""),
        })

    cols = ["모델", "분류", "축/그룹", "레벨", "카드명", "짧은설명", "상세정의", "상세설명", "색상"]
    path = os.path.join(OUT, "역량카드_새모델+레거시.csv")
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)
    return path, len(rows)


# ============================================================
# (2) 시나리오 펼침 CSV — 시나리오별 27행
# ============================================================
def build_scenarios():
    meta = {r["scenario_id"]: r for r in read_csv("scenario_meta.csv")}
    choices = read_csv("scenario_choices.csv")
    leaves = read_csv("scenario_leaves.csv")

    # 선택지 인덱스: (scenario_id, type, id) -> row
    cidx = {(c["scenario_id"], c["type"], c["id"]): c for c in choices}

    # 표시 위치 태그: 〈컷1~6〉 플레이 화면 / 〈카드획득〉 컷6 팝업+인벤토리+리포트 /
    #   〈리포트〉 종료 후 리포트 화면 / 〈내부〉 점수·스탯·자원 계산(화면 텍스트 아님) /
    #   〈미사용〉 코드가 안 읽는 죽은 데이터. (전수 grep으로 확정, 2026-06-09)
    cols = [
        "경로", "1차", "2차", "검토",
        # ── 플레이 화면 (학생이 봄, 컷 순서) ──
        "〈컷1〉분류", "〈컷1〉제목", "〈컷1〉상황텍스트",
        "〈컷2〉1차 라벨", "〈컷2〉1차 설명",
        "〈컷3〉깊은선택 라벨",
        "〈컷4〉2차 결과물", "〈컷4〉결과 요약",
        "〈컷5〉검토 라벨", "〈컷5〉검토 학생narrative",
        "〈컷6〉등급", "〈컷6〉점수", "〈컷6〉짧은피드백", "〈컷6〉Cut6피드백", "〈컷6〉다시하기제안(C·D)",
        # ── 카드 획득 (컷6 보상 팝업 + 인벤토리/리포트) ──
        "〈카드획득〉인간중심축", "〈카드획득〉인간중심태그", "〈카드획득〉도메인카드",
        "〈카드획득〉성장카드", "〈카드획득〉카드명(아이템)",
        # ── 리포트 화면 (종료 후) ──
        "〈리포트〉학습메시지", "〈리포트〉리포트피드백",
        "〈리포트〉만화컷1", "〈리포트〉만화컷2", "〈리포트〉만화컷3", "〈리포트〉만화컷4", "〈리포트〉만화컷5",
        # ── 내부 (점수·스탯·자원, 화면 텍스트 아님) ──
        "〈내부〉1차 위임변화", "〈내부〉1차 지식변화", "〈내부〉1차 기본점수", "〈내부〉1차 변수점수",
        "〈내부〉2차 시간비용", "〈내부〉2차 에너지비용",
        "〈내부〉경로 시간비용", "〈내부〉경로 에너지비용", "〈내부〉EXP",
        "〈내부〉매칭 요구카드", "〈내부〉매칭 보너스",
        # ── 미사용 (코드가 안 읽음, 죽은 데이터) ──
        "〈미사용〉1차 메시지", "〈미사용〉깊은선택 메시지", "〈미사용〉결과 교훈",
        "〈미사용〉획득역량카드(레거시)", "〈미사용〉획득카드정리",
        "〈미사용〉보정점수", "〈미사용〉보정유형", "〈미사용〉보정사유", "〈미사용〉매칭 노트",
    ]

    counts = {}
    for sid in SCENARIOS:
        m = meta.get(sid, {})
        rows = []
        for lf in leaves:
            if lf["scenario_id"] != sid:
                continue
            t1 = cidx.get((sid, "tier1", lf["tier1"]), {})
            t2 = cidx.get((sid, "tier2", lf["tier2"]), {})
            rows.append({
                "경로": lf["leaf"], "1차": lf["tier1"], "2차": lf["tier2"], "검토": lf["review"],
                # 플레이 화면
                "〈컷1〉분류": m.get("categoryName", ""),
                "〈컷1〉제목": m.get("title", ""),
                "〈컷1〉상황텍스트": m.get("situation_text", ""),
                "〈컷2〉1차 라벨": t1.get("label", ""),
                "〈컷2〉1차 설명": t1.get("desc", ""),
                "〈컷3〉깊은선택 라벨": t2.get("label", ""),
                "〈컷4〉2차 결과물": t2.get("result_text", ""),
                "〈컷4〉결과 요약": t2.get("result_summary", ""),
                "〈컷5〉검토 라벨": lf.get("reviewLabel", ""),
                "〈컷5〉검토 학생narrative": lf.get("reviewSupplement", ""),
                "〈컷6〉등급": lf.get("finals_grade", ""),
                "〈컷6〉점수": lf.get("finals_score", ""),
                "〈컷6〉짧은피드백": lf.get("finals_shortFeedback", ""),
                "〈컷6〉Cut6피드백": lf.get("finals_cut6Feedback", ""),
                "〈컷6〉다시하기제안(C·D)": lf.get("finals_replaySuggestion", ""),
                # 카드 획득
                "〈카드획득〉인간중심축": lf.get("finals_humanCentricAxis", ""),
                "〈카드획득〉인간중심태그": lf.get("finals_humanCentricTag", ""),
                "〈카드획득〉도메인카드": lf.get("finals_domainCards", ""),
                "〈카드획득〉성장카드": lf.get("finals_growthCard", ""),
                "〈카드획득〉카드명(아이템)": lf.get("finals_item", ""),
                # 리포트
                "〈리포트〉학습메시지": m.get("learningMessage", ""),
                "〈리포트〉리포트피드백": lf.get("finals_reportFeedback", ""),
                "〈리포트〉만화컷1": lf.get("finals_cartoonCaption1", ""),
                "〈리포트〉만화컷2": lf.get("finals_cartoonCaption2", ""),
                "〈리포트〉만화컷3": lf.get("finals_cartoonCaption3", ""),
                "〈리포트〉만화컷4": lf.get("finals_cartoonCaption4", ""),
                "〈리포트〉만화컷5": lf.get("finals_cartoonCaption5", ""),
                # 내부 (점수·스탯·자원)
                "〈내부〉1차 위임변화": t1.get("delegation", ""),
                "〈내부〉1차 지식변화": t1.get("knowledge", ""),
                "〈내부〉1차 기본점수": t1.get("basePoint", ""),
                "〈내부〉1차 변수점수": t1.get("varPoint", ""),
                "〈내부〉2차 시간비용": t2.get("stageCost_time", ""),
                "〈내부〉2차 에너지비용": t2.get("stageCost_energy", ""),
                "〈내부〉경로 시간비용": lf.get("resourceCost_time", ""),
                "〈내부〉경로 에너지비용": lf.get("resourceCost_energy", ""),
                "〈내부〉EXP": lf.get("expReward", ""),
                "〈내부〉매칭 요구카드": lf.get("axisDelta_requireCard", ""),
                "〈내부〉매칭 보너스": lf.get("axisDelta_bonusPoint", ""),
                # 미사용 (죽은 데이터)
                "〈미사용〉1차 메시지": t1.get("lesson", ""),
                "〈미사용〉깊은선택 메시지": t2.get("lesson", ""),
                "〈미사용〉결과 교훈": t2.get("result_lesson", ""),
                "〈미사용〉획득역량카드(레거시)": lf.get("competencyCards", ""),
                "〈미사용〉획득카드정리": lf.get("finals_earnedCards", ""),
                "〈미사용〉보정점수": lf.get("finals_adjustedScore", ""),
                "〈미사용〉보정유형": lf.get("finals_adjustedType", ""),
                "〈미사용〉보정사유": lf.get("finals_adjustedReason", ""),
                "〈미사용〉매칭 노트": lf.get("axisDelta_note", ""),
            })
        # leaf 좌표 정렬 (A1R1, A1R2, ... C3R3)
        rows.sort(key=lambda r: r["경로"])
        fname = f"시나리오_{SCEN_KR[sid]}_{sid}_27행.csv"
        path = os.path.join(OUT, fname)
        with open(path, "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerows(rows)
        counts[sid] = (fname, len(rows))
    return counts


if __name__ == "__main__":
    cpath, cn = build_cards()
    print(f"[카드] {os.path.basename(cpath)} — {cn}행")
    sc = build_scenarios()
    for sid, (fname, n) in sc.items():
        print(f"[시나리오] {fname} — {n}행")
    print(f"\n출력 폴더: {OUT}")
