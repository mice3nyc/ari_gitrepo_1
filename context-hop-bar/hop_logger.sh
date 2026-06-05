#!/bin/bash
# Context Hop Bar — Hook Logger
# Claude Code hook에서 호출. tool명과 파일 경로를 받아 프로젝트를 추론하고 JSONL로 기록.
#
# 사용법: hop_logger.sh <tool_name> <file_path>
# 예시:   hop_logger.sh Read "_init/_myJournal/2026-03-28.md"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"
TODAY=$(/bin/date +"%Y-%m-%d")
LOG_FILE="$LOGS_DIR/$TODAY.jsonl"
SYMLINK="$SCRIPT_DIR/context_hop_log.jsonl"
TOOL="${1:-unknown}"
FILE_PATH="${2:-}"

# 타임스탬프 (ISO 8601)
TS=$(/bin/date +"%Y-%m-%dT%H:%M:%S")

# logs 폴더 없으면 생성
[ -d "$LOGS_DIR" ] || mkdir -p "$LOGS_DIR"

# 심볼릭 링크가 오늘 파일을 가리키는지 확인
if [ -L "$SYMLINK" ]; then
    CURRENT_TARGET=$(readlink "$SYMLINK")
    if [ "$CURRENT_TARGET" != "$LOG_FILE" ]; then
        rm "$SYMLINK"
        ln -s "$LOG_FILE" "$SYMLINK"
    fi
elif [ ! -e "$SYMLINK" ]; then
    ln -s "$LOG_FILE" "$SYMLINK"
fi

# 프로젝트 감지 — 파일 경로 패턴 매칭
detect_project() {
    local path="$1"

    # 1. tool 이름 우선 매칭 (경로 유무와 무관)
    case "$TOOL" in
        *gmail*|*Gmail*|*calendar*|*Calendar*)
            echo "메시지"
            return
            ;;
        *telegram*|*Telegram*)
            echo "메시지"
            return
            ;;
        gws*)
            echo "GWS"
            return
            ;;
    esac

    # 2. 경로가 없으면 기타
    if [ -z "$path" ]; then
        echo "기타"
        return
    fi

    # 3. 경로 기반 매칭 (구체적인 것 먼저)
    case "$path" in
        # 프로젝트 (구체적 경로)
        *AI*리터러시*|*찾아서*|*도메인*진입*|*하이러닝*)
            echo "AI리터러시"
            ;;
        *PX*책*|*부트스트래핑*|*toc_*)
            echo "PX책"
            ;;
        *_dev/words/*|*_wordsposting/*|*brunch_backup/*)
            echo "words"
            ;;
        *DMZ*|*통일부*|*dmz*)
            echo "DMZ"
            ;;
        *슈테델*|*Stadel*|*stadel*)
            echo "슈테델"
            ;;
        *SKKU*|*skku*|*성균*)
            echo "SKKU"
            ;;
        *커넥천*|*Connec*)
            echo "커넥천"
            ;;
        *Buddy_inkblot*|*inkblot*|*Inkblot*|*buddy_info*)
            echo "Inkblot"
            ;;
        *gws*|*gws\ *)
            echo "GWS"
            ;;
        *context-hop-bar*|*context_hop*|*now-bar*|*now_bar*)
            echo "ToolDev"
            ;;
        # 모드
        *_dev/*)
            echo "기타"
            ;;
        *_작가노트/쓸+글*|*글감*|*편집회의*|*Posting*|*글스타일*)
            echo "글쓰기"
            ;;
        *yt-dlp*|*.srt*|*subtitle*|*_clean.txt*)
            echo "자막처리"
            ;;
        *유튜브자막*|*녹취*|*WhisperX*|*탐구*|*Brain*Fry*|*Radiolab*|*삼승*|*후니다*|*측정*|*마찰*|*기여도*)
            echo "탐구"
            ;;
        *아리공에게*|*color:rgb*)
            echo "코멘트"
            ;;
        *_init/휴룹*|*Hueloop*|*휴룹*|*코멘트*응답*|*충분한가*)
            echo "휴룹"
            ;;
        *강의*|*교안*|*GBL*|*홍대*수업*|*성대*수업*)
            echo "수업준비"
            ;;
        *_init/_myJournal/*|*_init/작업*|*_init/세션*|*_init/Reminder*|*CLAUDE.md|*memory/*)
            echo "Admin"
            ;;
        *보험*|*서류*|*도만사*|*세무*)
            echo "Admin"
            ;;
        *)
            # 볼트 내 .md 파일이면 → 도구에 따라 휴룹/탐구
            case "$path" in
                *Neo-Obsi-Sync*.md)
                    case "$TOOL" in
                        Write) echo "탐구" ;;
                        *)     echo "휴룹" ;;
                    esac
                    ;;
                *)
                    echo "기타"
                    ;;
            esac
            ;;
    esac
}

PROJECT=$(detect_project "$FILE_PATH")

# Actor 감지 — 아리공(자율/시스템) vs 피터공(사용자 요청)
detect_actor() {
    # 1. 도구 자체가 시스템/자율 작업인 경우
    case "$TOOL" in
        Agent|ToolSearch|TaskCreate|TaskUpdate|TaskGet|TaskList|TaskStop|TaskOutput)
            echo "아리공"
            return
            ;;
    esac

    # 2. 시스템 파일 접근 = 아리공 자율 작업
    case "$FILE_PATH" in
        *세션\ 로그*|*세션\ 체크리스트*|*MEMORY*|*memory/*|*CLAUDE.md)
            echo "아리공"
            return
            ;;
        *클로드코드\ 세션*|*클로드코드노트*)
            echo "아리공"
            return
            ;;
    esac

    # 3. 배경 모드 플래그 파일이 있으면 아리공
    if [ -f /tmp/hop_bg_mode ]; then
        echo "아리공"
        return
    fi

    # 4. 기본값 = 피터공
    echo "피터공"
}

ACTOR=$(detect_actor)

# JSON 특수문자 이스케이프 (최소한)
escape_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    echo "$s"
}

ESCAPED_PATH=$(escape_json "$FILE_PATH")
ESCAPED_TOOL=$(escape_json "$TOOL")
ESCAPED_PROJECT=$(escape_json "$PROJECT")

# JSONL 한 줄 append (actor 필드 추가)
echo "{\"ts\":\"${TS}\",\"tool\":\"${ESCAPED_TOOL}\",\"path\":\"${ESCAPED_PATH}\",\"project\":\"${ESCAPED_PROJECT}\",\"actor\":\"${ACTOR}\"}" >> "$LOG_FILE"
