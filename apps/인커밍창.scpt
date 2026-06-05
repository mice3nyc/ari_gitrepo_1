-- 인커밍창.scpt
-- Finder 창 2개를 화면 좌우 풀스크린 반반으로 배치
-- 왼쪽: Assets/incoming/ | 오른쪽: Downloads/
-- 화면 크기를 동적으로 감지하여 어떤 해상도에서든 동작

-- 화면 크기 동적 감지
tell application "Finder"
	set screenBounds to bounds of window of desktop
	set screenWidth to item 3 of screenBounds
	set screenHeight to item 4 of screenBounds
end tell

-- 메뉴바 높이 (macOS 기본)
set menuBarHeight to 38

-- 창 크기 계산
set halfWidth to screenWidth / 2
set windowTop to menuBarHeight

-- 경로 설정
set leftPath to "/Users/p.air15/Neo-Obsi-Sync/Assets/incoming/"
set rightPath to "/Users/p.air15/Downloads/"

tell application "Finder"
	-- 기존 Finder 창 모두 닫기
	close every window

	-- 왼쪽 창: Assets/incoming/
	set leftFolder to POSIX file leftPath as alias
	set leftWindow to make new Finder window
	set target of leftWindow to leftFolder
	set bounds of leftWindow to {0, windowTop, halfWidth, screenHeight}

	-- 오른쪽 창: Downloads/
	set rightFolder to POSIX file rightPath as alias
	set rightWindow to make new Finder window
	set target of rightWindow to rightFolder
	set bounds of rightWindow to {halfWidth, windowTop, screenWidth, screenHeight}

	-- macOS가 bounds를 미세 조정하므로 한 번 더 강제 설정
	delay 0.3
	set bounds of leftWindow to {0, windowTop, halfWidth, screenHeight}
	set bounds of rightWindow to {halfWidth, windowTop, screenWidth, screenHeight}

	-- Finder를 앞으로 가져오기
	activate
end tell
