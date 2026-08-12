#!/usr/bin/env python3
# Claude Code universe 맵 생성 — mymind .mindmap (JSON)
#
# v5 (8/1) — 피터공 빨간 코멘트 19건 반영. 전면 재구조화.
#
# ★ 작성 원칙 (v4에서 어긴 것들. 다시 어기지 말 것)
#   1. 섹션 제목은 "분류명"이다. 통상적인 개발 용어를 쓴다.
#      앱은 앱, 유틸리티는 유틸리티, 웹앱은 웹앱, 개발 프로젝트는 개발 프로젝트.
#      "손에 쥐는 앱"·"한 번 눌러 판을 까는 것" 같은 묘사로 바꾸지 않는다.
#      → 제목은 읽히려고 있는 게 아니라 찾으려고 있다.
#   2. 갈래끼리 구별은 "축"으로 한다. 문구를 달리해서 구별한 척하지 않는다.
#      이 맵의 축 = 왼쪽(볼트·설정, 무엇이 쌓이고 무엇이 자동 로드되나)
#                  오른쪽(개발 스콥, 무엇을 만들었나 + 무엇으로 연결하나)
#   3. 갈래마다 새 메타포를 지어내지 않는다.
#   4. 바디는 그 항목이 무엇인지 사실로 적는다. 감상·비유 금지.
#   5. 헤딩/바디는 "**헤딩**\n바디"로 쓰면 split_head_body()가 자동으로 상하로 가른다.
import json, os

nodes = []
def N(nid, depth, parent, text):
    nodes.append({"id": nid, "text": text, "depth": depth, "parentId": parent})

N("n1", 0, None, "**Claude Code universe**\n옵시디언 볼트 + 클로드코드 설정 + 자체 개발물 전체 구조 · 2026-08-01")

# ═══════════ 왼쪽 ═══════════

# ── 1. 옵시디언 볼트 ──
N("v", 1, "n1", "**옵시디언 볼트**\n노트 13,472장. 모든 작업 결과가 .md 파일로 여기 남는다")

N("vf", 2, "v", "**핵심 폴더 구조**")
N("vf1", 3, "vf", "**_init**\nDaily Note · 세션 체크리스트 · 작업 큐")
N("vf2", 3, "vf", "**current_notes**\n분류 안 붙은 진행 중 노트가 대부분 여기 쌓인다")
N("vf3", 3, "vf", "**_클로드코드노트**\n요청 노트 · 세션 로그 · 탐구 리포트")
N("vf4", 3, "vf", "**_Zettelkasten**\nZK 번호 노트 + 제텔 전용 DB")
N("vf5", 3, "vf", "**_dev**\n개발. git repo 하나(mice3nyc/ari_gitrepo_1)를 통째로 쓴다")
N("vf6", 3, "vf", "**_devhaus**\n개발. 프로젝트마다 독립 repo. 신규는 이쪽")
N("vf7", 3, "vf", "**Assets/incoming**\n바깥에서 받은 파일. 처리 후 _Archives_incoming으로")
N("vf8", 3, "vf", "**clip_ 접두어 폴더**\n스크랩북 · 팟캐스트 클리핑")
N("vf9", 3, "vf", "**_작가노트 · _인물노트 · _출판노트 등**\n_ 접두어 = 주제별 분류 폴더")

N("vd", 2, "v", "**Daily Note**\n날짜로 찾는 축. `_init/_myJournal/YYYY-MM-DD.md`")
N("vd1", 3, "vd", "**시작 메모**\n아리공이 아침에 그날의 판을 요약해 둔다")
N("vd2", 3, "vd", "**해야 할 일**\n다섯 개를 넘기지 않는다. 3일 이상 밀리면 표시")
N("vd3", 3, "vd", "**오늘의 요청**\n그날 생긴 요청 노트 링크만")
N("vd4", 3, "vd", "**오늘의 낚시**\n백도가 옛 노트를 찾아 아침마다 한두 장 올린다")
N("vd5", 3, "vd", "**오늘의 링킹**\n피터공이 지정한 것만 들어간다")
N("vd6", 3, "vd", "**아리공에게**\n피터공이 적어 두면 아리공이 읽는 단방향 칸")

N("vr", 2, "v", "**요청 노트**\n일로 찾는 축. 작업 하나가 통째로 사는 파일. `_클로드코드노트/요청/`")
N("vs", 2, "v", "**세션 체크리스트**\n`_init/세션 체크리스트.md`. 열린 프로젝트를 한 줄씩 적어 둔 목록")
N("vs1", 3, "vs", "**왜 있나**\n창을 새로 열면 /recall이 이 파일만 읽고 30초 만에 상태를 복원한다")
N("vs2", 3, "vs", "**누가 갱신하나**\n/memento가 해당 프로젝트 줄만 고쳐 쓴다. 창이 여럿이어도 안 부딪힌다")

N("vi", 2, "v", "**검색 인덱스**\n`vaultair_net.db`. 노트 내용을 미리 색인해 둔 SQLite 파일")
N("vi1", 3, "vi", "**키워드 검색 (FTS)**\n단어가 그대로 든 노트를 찾는다. 한글은 접미 `*` 필수")
N("vi2", 3, "vi", "**벡터 검색**\n단어가 달라도 뜻이 가까운 노트를 찾는다. 검색어를 모를 때 쓴다")
N("vi3", 3, "vi", "**vault_db.py**\n크론이 매일 06:00에 돌려 색인을 최신으로 맞춘다")

# ── 2. 클로드코드 설정 ──
N("c", 1, "n1", "**클로드코드 설정**\n세션이 시작될 때 자동으로 읽히는 것들")

N("cm", 2, "c", "**CLAUDE.md**\n지시문. 네 군데에 나뉘어 있고 아래 것이 위 것을 덮는다")
N("cm1", 3, "cm", "**~/.claude/CLAUDE.md**\n지금 이 창이 볼트 담당인지 외근인지부터 가른다")
N("cm2", 3, "cm", "**볼트 루트**\n폴더 규칙 · 파일명 규칙 · DB 사용법 · 요청 노트 시스템")
N("cm3", 3, "cm", "**_dev/CLAUDE.md**\n3계층 노트(PLAN·TASKS·SPEC) · 선문후코 · 빌드 전 체크")
N("cm4", 3, "cm", "**_Zettelkasten/CLAUDE.md**\nZK 파일명과 내부 구조 규약")

N("cme", 2, "c", "**메모리**\n논의해서 정한 규칙을 파일 하나에 하나씩 적어 둔 것. 239개")
N("cme0", 3, "cme", "**왜 있나**\n같은 지적을 두 번 받지 않기 위해. 세션이 바뀌어도 인덱스가 자동 로드된다")
N("cme1", 3, "cme", "**feedback 184**\n일하는 방식에 대해 정해진 것")
N("cme2", 3, "cme", "**reference 39**\n사람 · 계정 · 경로 · 도구 사용법 같은 사실")
N("cme3", 3, "cme", "**project 8**\n진행 중인 일의 전제")
N("cme4", 3, "cme", "**user 5**\n피터공에 대한 것")
N("cme5", 3, "cme", "**MEMORY.md / MEMORY_dev.md**\n인덱스. 개발 규칙은 따로 빼서 코드 세션에서만 읽는다")

N("cs", 2, "c", "**클로드코드 스킬**\n`/이름`으로 부르면 정해진 절차대로 도는 것")
N("cs1", 3, "cs", "**goodmorning**\n하루 첫 세션. DB 확인 → 작업 큐 → Daily Note 세팅")
N("cs2", 3, "cs", "**recall**\n창을 새로 열 때. 세션 체크리스트만 읽고 30초 만에 복원")
N("cs3", 3, "cs", "**memento**\n컨텍스트가 차기 전에 상태를 파일로 남긴다")
N("cs4", 3, "cs", "**goodbye**\n하루 마지막 세션. 기록 보존 → DB 동기화 → 리마인더 정리")
N("cs5", 3, "cs", "**zettel-exploration**\n검색 결과를 재료로 탐구 노트를 만든다")
N("cs6", 3, "cs", "**csv-to-sheet**\nCSV·엑셀을 구글시트로 올린다")

N("ch", 2, "c", "**훅**\n아리공이 툴을 쓸 때마다 자동 실행되는 스크립트")
N("ch1", 3, "ch", "**hop_logger.sh**\n어느 프로젝트를 오갔는지 기록 → context-hop-bar가 읽는다")
N("ch2", 3, "ch", "**tm-hook.sh**\n창 상태(작업 중·완료·주의)를 TM에 보낸다")
N("ch3", 3, "ch", "**spec_guard.sh**\n_dev 코드가 SPEC보다 새로우면 그 자리에서 경고를 띄운다")

# ── 3. 프로세스 ──
# 원칙: 실제 파일·로그가 확인된 것만 넣는다(8/1 피터공 지시). 개수·경로는 전부 실측.
N("p", 1, "n1", "**프로세스**\n정기적으로 돌고, 기록이 파일로 남는 것")

N("pr", 2, "p", "**정기 회고 · 점검**")
N("pr1", 3, "pr", "**월별 회고**\n`_회고노트/` — 2025년 돌아보기 1~12월 + 동현공 대화 종합 브리핑")
N("pr2", 3, "pr", "**토요차담**\n토요일 PM 면담. 기록 예: `26.0328 토요차담 — W13 점검`")
N("pr3", 3, "pr", "**주간 점검 (W번호)**\nW12·W13처럼 주 단위로 그림을 다시 그린다")
N("pr4", 3, "pr", "**시스템 점검 (실록)**\n`_클로드코드노트/실록/` 24건. 무엇이 어긋났는지 그때그때 진단하고 처방까지")

N("pl", 2, "p", "**상시 기록 · 추적**")
N("pl1", 3, "pl", "**세션 로그**\n`_클로드코드노트/클로드코드 세션 로그.md` — 743세션 누적. 주·월 단위로 아카이브 분리")
N("pl2", 3, "pl", "**작업 큐**\n`_init/작업 큐.md` — 진행·완료가 누적된다")
N("pl3", 3, "pl", "**Reminder**\n`_init/Reminder.md` — 날짜 고정 외부 이벤트. 끝나면 Reminder_Archives로")
N("pl4", 3, "pl", "**TM 마일스톤 보드**\n`_init/TM_*.md` 16장 — 프로젝트별 다음 마일스톤·데드라인")
N("pl5", 3, "pl", "**TM 창 로그**\n`_클로드코드노트/TerminalMonitor Log/` 21건 — 날짜별 창 작업 기록")
N("pl6", 3, "pl", "**Context Hop Report**\n하루치 툴콜 이동을 분석한 리포트 6건")
N("pl7", 3, "pl", "**카페 일지**\n`_init/일지_버드커피랩.md`")

# ── 4. 인스턴스 구성 ──
N("i", 1, "n1", "**인스턴스 구성**\n같은 클로드코드지만 맡은 범위가 다르다")
N("i1", 2, "i", "**아리공**\n볼트 담당. 터미널 창 A~F까지 동시에 띄운다")
N("i2", 2, "i", "**백도 (서브에이전트)**\n아리공이 부르는 조사원. 여러 개를 동시에 돌린다")
N("i3", 2, "i", "**코스모공**\n데스크탑 정리 담당. 별도 인스턴스, 세션 사이클도 따로")
N("i4", 2, "i", "**외근 인스턴스**\n볼트 바깥 폴더에서 돈다. 볼트 .md 수정 금지, 결과만 보낸다")
N("i5", 2, "i", "**아리온**\nclaude.ai/code 클라우드. 폰에서 접근")
N("i6", 2, "i", "**클공**\nClaude 웹. 개발이 아니라 대화·상담")

# ── 4. 범례 ──
N("lg", 1, "n1", "**점선 색 범례**")
N("lg1", 2, "lg", "파랑 — 사람이 안 건드려도 자동으로 돈다")
N("lg2", 2, "lg", "하늘 — 사람이 손으로 이어 줘야 한다")
N("lg3", 2, "lg", "마젠타 — 만든 것이 만든 사람을 되먹인다")
N("lg4", 2, "lg", "빨강 — 끊어졌거나 아직 확인 못 했다")

# ═══════════ 오른쪽 ═══════════

# ── 5. INCOMING ──
N("in", 1, "n1", "**INCOMING — 바깥 자료 반입**\n볼트 밖 재료가 노트가 되기까지의 경로")
N("in1", 2, "in", "**유튜브 자막**\nyt-dlp로 자막을 받아 txt로 정리한 뒤 백도가 분석 노트를 쓴다")
N("in2", 2, "in", "**웹 클리핑**\n주 경로는 옵시디언 웹 클리퍼. 봇 차단 사이트만 헤드리스 크롬으로")
N("in3", 2, "in", "**녹취 파일 처리**\nmyScribe 또는 WhisperX_STT로 음성을 텍스트로")
N("in4", 2, "in", "**받은 문서 파일**\n수정본 xlsx·docx를 원본과 셀 단위로 비교해 변경분을 뽑는다")
N("in5", 2, "in", "**brunch 백업**\n브런치에 발행한 글 전편을 md로 내려받는다")
N("in6", 2, "in", "**Assets/incoming 폴더**\n받은 파일이 먼저 놓이는 자리. 처리 후 _Archives_incoming으로")
N("in7", 2, "in", "**반입 후 가공**")
N("in71", 3, "in7", "**이미지 로컬화**\n클리핑 노트의 원격 이미지를 볼트 안으로 내려받는다 (ClipLocalize)")
N("in72", 3, "in7", "**영한 교차 번역**\n원문 한 문단, 번역 한 문단을 번갈아 놓는다")
N("in73", 3, "in7", "**노트 링킹**\n새 노트를 만든 뒤, 벡터 검색으로 이어질 옛 노트를 찾아 링크를 단다")

# ── 6. 외부 연동 ──
N("x", 1, "n1", "**외부 연동**\n볼트 밖 서비스에 접근하는 통로")
N("x1", 2, "x", "**Gmail**\n메일을 읽고 초안을 만든다")
N("x2", 2, "x", "**Google Calendar**\n일정 확인. 놀공 캘린더는 계정이 따로다")
N("x3", 2, "x", "**Google Drive**\n문서·시트를 읽어 온다")
N("x4", 2, "x", "**gws (Google Workspace CLI)**\n구글 문서·시트·슬라이드를 읽는 별도 통로. 읽기 전용으로 걸어 뒀다")
N("x5", 2, "x", "**텔레그램 봇**\n폰으로 주고받는다. 음성(TTS)도 보낸다")
N("x6", 2, "x", "**Chrome 자동화**\n봇 차단 사이트를 열고, 만든 화면을 실제로 렌더해 확인한다")
N("x7", 2, "x", "**옵시디언 앱**\n노트 이름을 바꾸면 링크를 자동으로 따라 고친다 (앱이 켜져 있어야 함)")
N("x8", 2, "x", "**OpenAI 임베딩**\n노트를 1,536개 숫자로 바꿔 벡터 검색이 가능하게 만든다")

# ── 7. 자체 개발 앱 ──
N("a", 1, "n1", "**자체 개발 앱 (데스크탑)**\n피터공이 아리공과 직접 개발해서 쓰는 네이티브 앱")
N("a1", 2, "a", "**mymind**\n마인드맵. 지금 이 맵을 만든 앱")
N("a2", 2, "a", "**myWriter**\n볼트의 지정 폴더 안에서만 원고를 쓰는 에디터")
N("a3", 2, "a", "**myScribe**\n녹음 파일을 넣으면 전사 + 파일명까지 만들어 준다")

# ── 8. 유틸리티 ──
N("u", 1, "n1", "**유틸리티**\n작업 과정을 돕는 작은 도구들")
N("um", 2, "u", "**메뉴바 상주**")
N("um1", 3, "um", "**tm-bar**\n창 A~F가 지금 각각 무슨 작업 중인지 보여준다")
N("um2", 3, "um", "**todoy-bar**\n오늘 할 일. 폰에서 체크해도 볼트 노트로 돌아온다")
N("um3", 3, "um", "**context-hop-bar**\n오늘 작업이 프로젝트 사이를 몇 번 오갔는지 (로컬 서버 + 웹)")
N("ud", 2, "u", "**실행 · 드래그앤드롭**")
N("ud1", 3, "ud", "**아리공4창**\n터미널 4개를 화면에 나눠 깔고 클로드코드까지 띄운다")
N("ud2", 3, "ud", "**인커밍창**\nAssets/incoming과 Downloads를 좌우로 연다")
N("ud3", 3, "ud", "**ClipLocalize**\n클리핑 .md를 끌어다 놓으면 원격 이미지를 내려받는다")
N("ud4", 3, "ud", "**WhisperX_STT**\n음성 파일을 끌어다 놓으면 전사된다")
N("ud5", 3, "ud", "**WAV2M4A**\nwav를 m4a로 변환")
N("ud6", 3, "ud", "**MermaidLab**\n다이어그램 편집용 로컬 서버(8789)를 띄우고 브라우저를 연다")

# ── 9. 웹앱 ──
N("w", 1, "n1", "**웹앱**\n브라우저에서 쓰려고 만든 개인 도구. 초기 제작물이 많다")
N("w1", 2, "w", "**myNoteViewer**\n왼쪽 볼트 노트, 오른쪽 그 노트가 가리키는 구글 문서 (크롬 전용)")
N("w2", 2, "w", "**PIXELMAN**\n사진을 레트로 디더링으로 바꾼다")
N("w3", 2, "w", "**mermaid / mermaid-lab**\n볼트 다이어그램 모음 뷰어와 편집 랩")
N("w4", 2, "w", "**words**\n피터공 에세이 블로그. 한글·영문 (GitHub Pages)")

# ── 10. 개발 프로젝트 ──
N("d", 1, "n1", "**개발 프로젝트**\n놀공 사업으로 외부에 나가는 게임·서비스")
N("d1", 2, "d", "**Manifesto**\n프랑크푸르트 슈테델 KI Festival · 9/4~5")
N("d2", 2, "d", "**MOMAK 2026**\n100명이 서너 시간 함께 하는 멀티플레이어 빅게임")
N("d3", 2, "d", "**인생게임 2026**\n20대~90대 8턴 인생 선택 시뮬레이션")
N("d4", 2, "d", "**Mind2Action**\n에고그램 설문 → 관계 코칭 리포트 자동 생성")
N("d5", 2, "d", "**AI 리터러시**\n위임의 경계 — AI에게 어디까지 맡길 것인가")
N("d6", 2, "d", "**DMZ 다이어리**\n통일부. 교차참조 빈칸 복원 게임")
N("d7", 2, "d", "**자모 퍼즐**\n경기도교육청 하이러닝. 한글 자모 조판 드래그 게임")
N("d8", 2, "d", "**위메이크 성수**\n성수동 방문객 16유형 성격 테스트")
N("d9", 2, "d", "**CBT the Game**\n인지행동치료 덱빌딩 게임")

# ═══════════ 헤딩 / 바디 분리 ═══════════
def split_head_body(src):
    out = []
    for n in src:
        if "\n" in n["text"]:
            head, body = n["text"].split("\n", 1)
            parent = dict(n); parent["text"] = head
            out.append(parent)
            out.append({"id": n["id"] + "_b", "text": body.replace("\n", " ").strip(),
                        "depth": n["depth"] + 1, "parentId": n["id"]})
        else:
            out.append(n)
    return out

nodes = split_head_body(nodes)

# ═══════════ 점선 ═══════════
E = []
def edge(eid, src, tgt, sh, th):
    E.append({"id": eid, "source": src, "target": tgt, "sourceHandle": sh, "targetHandle": th})

# 파랑 — 자동
edge("f1", "ch1", "um3", "r", "l")    # hop_logger.sh → context-hop-bar
edge("f2", "ch2", "um1", "r", "l")    # tm-hook.sh → tm-bar
edge("f3", "x8", "vi2", "l", "r")     # OpenAI 임베딩 → 벡터 검색
edge("f4", "um2", "vd2", "l", "r")    # todoy-bar → Daily Note 해야 할 일
edge("f5", "vi3", "vi1", "b", "t")    # vault_db.py → 키워드 검색 색인
# 하늘 — 사람 손
edge("f6", "in3", "a3", "r", "l")     # 녹취 파일 처리 → myScribe
edge("f7", "in71", "ud3", "r", "l")   # 이미지 로컬화 → ClipLocalize
edge("f8", "in73", "vi2", "l", "r")   # 노트 링킹 → 벡터 검색
edge("f9", "i3", "x1", "b", "t")      # 코스모공 → Gmail (인스턴스 간 소통)
edge("f10", "x7", "v", "t", "b")      # 옵시디언 앱 → 볼트 (앱이 켜져 있어야)
# 마젠타 — 되먹임
edge("f11", "a1", "n1", "l", "r")     # mymind → 이 맵 자신
edge("f12", "vr", "cme", "t", "b")    # 요청 노트 → 메모리 (작업에서 규칙이 나온다)
edge("f13", "ch3", "vf5", "b", "t")   # spec_guard.sh → _dev (자기가 만든 훅이 자기 코드를 막는다)
# 빨강 — 미확인 / 끊김
edge("f14", "x4", "x2", "b", "t")     # gws ↔ Calendar 어느 계정인지 확인 안 됨
edge("f15", "um1", "um2", "b", "t")   # SwiftBar 플러그인 정본 위치가 갈려 있다
# 프로세스 연결
edge("f16", "pr4", "cme", "r", "l")   # 시스템 점검(실록) → 메모리 (점검 결론이 규칙으로 굳는다)
edge("f17", "cs2", "vs", "l", "r")    # recall 스킬 → 세션 체크리스트를 읽는다
edge("f18", "cs3", "pl1", "r", "l")   # memento 스킬 → 세션 로그를 남긴다

colors = {
    "f1": "blue", "f2": "blue", "f3": "blue", "f4": "blue", "f5": "blue",
    "f6": "cyan", "f7": "cyan", "f8": "cyan", "f9": "cyan", "f10": "cyan",
    "f11": "magenta", "f12": "magenta", "f13": "magenta",
    "f14": "red", "f15": "red",
    "f16": "magenta", "f17": "cyan", "f18": "cyan",
    "lg1": "blue", "lg2": "cyan", "lg3": "magenta", "lg4": "red",
}

branch_ids = ["v", "c", "p", "i", "lg", "in", "x", "a", "u", "w", "d"]
group_ids = ["vf", "vd", "vi", "vs", "cm", "cme", "cs", "ch", "pr", "pl", "in7", "um", "ud"]
left_ids = ["v", "c", "p"]  # 인스턴스·범례는 오른쪽 — 좌우 말단 수를 맞춘다(높이는 긴 쪽이 정한다)

doc = {
    "version": 1,
    "name": "Claude Code universe — 전체 구조",
    "nodes": nodes,
    "freeEdges": E,
    "summaries": [],
    "relationIds": [],
    "floatingIds": [],
    "leftIds": left_ids,
    "sizes": {},
    "edgeMids": {},
    "inverted": {b: True for b in branch_ids},
    "colors": colors,
    "fonts": {},
    "dotted": {},
    "borderWidths": {},
    "fontSizes": dict({"n1": "22"},
                      **{b: "15" for b in branch_ids},
                      **{g: "14" for g in group_ids},
                      **{n: "11" for n in ["lg1", "lg2", "lg3", "lg4"]}),
    "updatedAt": "2026-08-01T11:00:00.000Z",
}

# ── 무결성 검사 ──
ids = {n["id"] for n in nodes}
assert len(ids) == len(nodes), "중복 id"
by_id = {n["id"]: n for n in nodes}
for n in nodes:
    if n["parentId"] is None:
        assert n["depth"] == 0, "루트가 둘"
    else:
        assert n["parentId"] in ids, f"고아 {n['id']}"
        assert n["depth"] == by_id[n["parentId"]]["depth"] + 1, f"depth 불일치 {n['id']}"
    assert "\n" not in n["text"], f"분리 안 된 박스 {n['id']}"
    assert ">" not in n["text"], f"코멘트가 남아 있다 {n['id']}"
for e in E:
    assert e["source"] in ids and e["target"] in ids, f"점선 끝이 없다 {e['id']}"
for k in colors:
    assert k in ids or any(e["id"] == k for e in E), f"색만 있고 대상이 없다 {k}"
for b in branch_ids + group_ids + left_ids:
    assert b in ids, f"설정에 있는데 노드가 없다 {b}"
for n in nodes:
    if n["id"].endswith("_b"):
        assert "**" not in n["text"], f"바디에 볼드가 남았다 {n['id']}"

out = os.path.expanduser("~/Documents/mymind_docs/Claude Code universe.mindmap")
with open(out, "w", encoding="utf-8") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)

children = {}
for n in nodes:
    children.setdefault(n["parentId"], []).append(n["id"])
def side(nid):
    while by_id[nid]["parentId"] not in (None, "n1"):
        nid = by_id[nid]["parentId"]
    return "L" if nid in left_ids else "R"
terminals = [n["id"] for n in nodes if n["id"] not in children and n["id"] != "n1"]
L = sum(1 for t in terminals if side(t) == "L")
print(f"저장: {out}")
print(f"노드 {len(nodes)} · 점선 {len(E)} · 말단 좌 {L} / 우 {len(terminals)-L}")
