#!/bin/bash
# Context Hop Bar — 테스트 데이터 생성
# 현실적인 hop 패턴을 시뮬레이션하여 /tmp/context_hop_log.jsonl에 기록
#
# 사용법: ./generate_test_data.sh
# 기존 로그를 덮어씀

LOG_FILE="/tmp/context_hop_log.jsonl"
TODAY=$(date +"%Y-%m-%d")

echo "● 테스트 데이터 생성"
echo "  파일: $LOG_FILE"
echo "  날짜: $TODAY"

# 기존 로그 초기화
> "$LOG_FILE"

# 시뮬레이션: 오늘 09:15부터 시작, 약 2시간 분량 (30개 hop)
# 패턴: 굿모닝(DN→시스템) → 메일 → 휴룹 → 글쓰기 deep work → 개발 → DN 복귀

write_hop() {
    local time="$1"
    local tool="$2"
    local path="$3"
    local project="$4"
    echo "{\"ts\":\"${TODAY}T${time}\",\"tool\":\"${tool}\",\"path\":\"${path}\",\"project\":\"${project}\"}" >> "$LOG_FILE"
}

# === 굿모닝 루틴 (09:15~09:30) ===
write_hop "09:15:00" "Read"  "_init/_myJournal/${TODAY}.md" "DN"
write_hop "09:15:22" "Edit"  "_init/_myJournal/${TODAY}.md" "DN"
write_hop "09:16:05" "Read"  "_init/작업 큐.md" "시스템"
write_hop "09:16:45" "Read"  "_init/세션 체크리스트.md" "시스템"
write_hop "09:17:30" "Read"  "_init/Reminder.md" "시스템"

# === 메일 확인 (09:18~09:22) ===
write_hop "09:18:10" "Bash"  "" "메일"
write_hop "09:19:00" "Bash"  "" "메일"
write_hop "09:20:15" "Edit"  "_init/_myJournal/${TODAY}.md" "DN"

# === 휴룹 (09:22~09:28) ===
write_hop "09:22:00" "Read"  "_init/휴룹 큐.md" "휴룹"
write_hop "09:23:30" "Read"  "_Zettelkasten/ZK042 - 측정의 역설.md" "ZK"
write_hop "09:25:00" "Read"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 아우라의 역설.md" "글쓰기"
write_hop "09:26:15" "Edit"  "_init/휴룹 큐.md" "휴룹"
write_hop "09:28:00" "Edit"  "_init/_myJournal/${TODAY}.md" "DN"

# === 글쓰기 deep work (09:30~09:55, 25분 집중) ===
write_hop "09:30:00" "Read"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 소화의 기준.md" "글쓰기"
write_hop "09:32:00" "Edit"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 소화의 기준.md" "글쓰기"
write_hop "09:38:00" "Read"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 소화의 기준.md" "글쓰기"
write_hop "09:42:00" "Edit"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 소화의 기준.md" "글쓰기"
write_hop "09:48:00" "Read"  "_디지털책장/기술의 충격/3장.md" "기타"
write_hop "09:50:00" "Edit"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 소화의 기준.md" "글쓰기"
write_hop "09:55:00" "Edit"  "_작가노트/쓸+글 = 쓰고 싶은 것들/◇ 소화의 기준.md" "글쓰기"

# === 텔레그램 인터럽트 (09:56) ===
write_hop "09:56:00" "Bash"  "" "텔레그램"
write_hop "09:57:30" "Edit"  "_init/_myJournal/${TODAY}.md" "DN"

# === 개발 작업 (09:58~10:15) ===
write_hop "09:58:00" "Read"  "_dev/context-hop-bar/PLAN.md" "개발"
write_hop "10:00:00" "Bash"  "_dev/context-hop-bar/" "개발"
write_hop "10:05:00" "Edit"  "_dev/context-hop-bar/index.html" "개발"
write_hop "10:08:00" "Read"  "_dev/context-hop-bar/index.html" "개발"
write_hop "10:12:00" "Edit"  "_dev/context-hop-bar/index.html" "개발"
write_hop "10:15:00" "Bash"  "_dev/context-hop-bar/" "개발"

# === 클리핑 정리 (10:16~10:20) ===
write_hop "10:16:00" "Read"  "clip_스크랩북/Economist_AI_and_jobs.md" "클리핑"
write_hop "10:18:00" "Bash"  "clip_스크랩북/" "클리핑"

# === DN 복귀 (10:20) ===
write_hop "10:20:00" "Edit"  "_init/_myJournal/${TODAY}.md" "DN"

echo "  완료: $(wc -l < "$LOG_FILE" | tr -d ' ')개 hop 이벤트 생성"
echo ""
echo "  확인: cat $LOG_FILE | head -5"
