#!/usr/bin/env python3
"""
브런치(brunch.co.kr) 발행 글 백업 스크립트
대상: https://brunch.co.kr/@peterlee
각 글을 마크다운(.md)으로 변환하여 저장
"""

import os
import re
import sys
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import unquote
from datetime import datetime
from typing import Optional, Dict, List

# ── 설정 ──────────────────────────────────────────────
AUTHOR_ID = "peterlee"
BASE_URL = f"https://brunch.co.kr/@{AUTHOR_ID}"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "brunch_backup")
MAX_CONSECUTIVE_404 = 5
DELAY_MIN = 1.0
DELAY_MAX = 2.0
MAX_ARTICLES = 50  # 안전 상한 (24개 예상이지만 여유)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}


def sanitize_filename(title: str) -> str:
    """파일명에서 특수문자 제거 (피터공 규칙: [], |, SMP 이모지 금지)"""
    # 파일시스템 안전하지 않은 문자 제거
    sanitized = re.sub(r'[\\/*?:"<>|\[\]&]', '', title)
    # 연속 공백 정리
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    # 파일명이 너무 길면 자르기
    if len(sanitized) > 80:
        sanitized = sanitized[:80].strip()
    return sanitized


def extract_image_url(img_src: str) -> str:
    """daum CDN 썸네일 URL에서 원본 이미지 URL 추출"""
    if not img_src:
        return ""
    # //img1.daumcdn.net/thumb/R1280x0.fwebp/?fname=http://... 형태
    match = re.search(r'fname=(https?://[^\s&]+)', img_src)
    if match:
        return unquote(match.group(1))
    # 이미 원본 URL인 경우
    if img_src.startswith("http"):
        return img_src
    if img_src.startswith("//"):
        return "https:" + img_src
    return img_src


def parse_json_ld(soup: BeautifulSoup) -> dict:
    """JSON-LD에서 BlogPosting 메타데이터 추출"""
    metadata = {}
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if data.get("@type") == "BlogPosting":
                metadata["headline"] = data.get("headline", "")
                metadata["datePublished"] = data.get("datePublished", "")
                metadata["dateModified"] = data.get("dateModified", "")
                metadata["description"] = data.get("description", "")
                metadata["author"] = ""
                author = data.get("author", {})
                if isinstance(author, dict):
                    metadata["author"] = author.get("name", "")
                # 이미지 목록
                images = data.get("image", [])
                metadata["images"] = []
                for img in images:
                    if isinstance(img, dict):
                        url = img.get("url", "")
                        if url:
                            metadata["images"].append(url)
                    elif isinstance(img, str):
                        metadata["images"].append(img)
                break
        except (json.JSONDecodeError, AttributeError):
            continue
    return metadata


def parse_date(date_str: str) -> str:
    """ISO 날짜를 YYYY-MM-DD 형식으로"""
    if not date_str:
        return ""
    try:
        # 2016-05-05T05:04+09:00 형태
        dt = datetime.fromisoformat(date_str.replace("+09:00", "+09:00"))
        return dt.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        pass
    # "May 5. 2016" 형태 시도
    try:
        dt = datetime.strptime(date_str.strip(), "%b %d. %Y")
        return dt.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        pass
    return date_str


def extract_body_markdown(soup: BeautifulSoup) -> str:
    """본문을 마크다운으로 변환"""
    wrap_body = soup.select_one("div.wrap_body")
    if not wrap_body:
        return ""

    lines = []
    # p와 div 모두 wrap_item 클래스를 가질 수 있음 (이미지는 div)
    items = wrap_body.find_all(["p", "div"], class_="wrap_item")

    for item in items:
        # 중첩된 wrap_item 건너뛰기 (div > div.wrap_img_float 같은 경우)
        if item.parent and "wrap_item" in item.parent.get("class", []):
            continue
        classes = item.get("class", [])

        # 이미지 아이템
        if "item_type_img" in classes:
            img = item.find("img")
            if img:
                src = img.get("src", "") or img.get("data-src", "")
                alt = img.get("alt", "")
                url = extract_image_url(src)
                lines.append(f"![{alt}]({url})")
                lines.append("")
            continue

        # 텍스트 아이템
        if "item_type_text" in classes:
            text = item.get_text(strip=True)
            if not text:
                lines.append("")
                continue

            # 볼드 처리
            for b in item.find_all(["b", "strong"]):
                b_text = b.get_text()
                b.replace_with(f"**{b_text}**")

            # 이탤릭 처리
            for em in item.find_all(["em", "i"]):
                em_text = em.get_text()
                em.replace_with(f"*{em_text}*")

            # 링크 처리
            for a in item.find_all("a"):
                a_text = a.get_text()
                a_href = a.get("href", "")
                if a_href:
                    a.replace_with(f"[{a_text}]({a_href})")

            # 최종 텍스트 추출
            text = item.get_text()
            # br 태그를 줄바꿈으로
            text = re.sub(r'\n{3,}', '\n\n', text)
            text = text.strip()

            if text:
                lines.append(text)
                lines.append("")
            continue

        # 기타 아이템 (인용, 구분선 등)
        if "item_type_quote" in classes:
            text = item.get_text(strip=True)
            if text:
                lines.append(f"> {text}")
                lines.append("")
            continue

        if "item_type_division" in classes or "item_type_line" in classes:
            lines.append("---")
            lines.append("")
            continue

        # 알 수 없는 타입은 텍스트로 처리
        text = item.get_text(strip=True)
        if text:
            lines.append(text)
            lines.append("")

    # wrap_body 안의 이미지도 직접 찾기 (p.wrap_item 밖에 있는 경우)
    if not items:
        # fallback: wrap_body의 모든 텍스트
        text = wrap_body.get_text(separator="\n\n", strip=True)
        lines.append(text)

    return "\n".join(lines)


def extract_cover_image(soup: BeautifulSoup) -> str:
    """커버 이미지 URL 추출"""
    # wrap_cover 안의 이미지
    cover = soup.select_one("div.wrap_cover")
    if cover:
        img = cover.find("img")
        if img:
            src = img.get("src", "") or img.get("data-src", "")
            return extract_image_url(src)

    # JSON-LD의 cover 이미지
    metadata = parse_json_ld(soup)
    if metadata.get("images"):
        return metadata["images"][0]

    # og:image
    og_img = soup.find("meta", property="og:image")
    if og_img:
        return og_img.get("content", "")

    return ""


def fetch_article(article_num: int, cookie: str = "") -> Optional[dict]:
    """브런치 글 하나를 가져와서 파싱"""
    url = f"{BASE_URL}/{article_num}"
    headers = dict(HEADERS)
    if cookie:
        headers["Cookie"] = cookie
    try:
        response = requests.get(url, headers=headers, timeout=15)
    except requests.RequestException as e:
        print(f"  [ERROR] 네트워크 오류: {e}")
        return None

    if response.status_code == 404:
        return None
    if response.status_code != 200:
        print(f"  [WARN] HTTP {response.status_code}")
        return None

    soup = BeautifulSoup(response.text, "html.parser")

    # 메타데이터
    metadata = parse_json_ld(soup)

    # 제목
    title = ""
    h1 = soup.select_one("h1.cover_title")
    if h1:
        title = h1.get_text(strip=True)
    if not title:
        title = metadata.get("headline", f"untitled_{article_num}")

    # 서브타이틀
    subtitle = ""
    sub_el = soup.select_one("p.cover_sub_title")
    if sub_el:
        subtitle = sub_el.get_text(strip=True)

    # 날짜
    date_published = parse_date(metadata.get("datePublished", ""))
    if not date_published:
        date_el = soup.select_one("span.date")
        if date_el:
            date_published = parse_date(date_el.get_text(strip=True))

    # 커버 이미지
    cover_image = extract_cover_image(soup)

    # 본문
    body = extract_body_markdown(soup)

    # 키워드 (태그)
    keywords = []
    for kw_link in soup.select("a[href*='/keyword/']"):
        kw_text = kw_link.get_text(strip=True)
        if kw_text and kw_text not in keywords:
            keywords.append(kw_text)

    return {
        "num": article_num,
        "url": url,
        "title": title,
        "subtitle": subtitle,
        "date_published": date_published,
        "date_modified": parse_date(metadata.get("dateModified", "")),
        "author": metadata.get("author", ""),
        "cover_image": cover_image,
        "body": body,
        "keywords": keywords,
    }


def article_to_markdown(article: dict) -> str:
    """파싱된 글을 마크다운 파일 내용으로 변환"""
    lines = []

    # Frontmatter
    lines.append("---")
    lines.append(f"title: \"{article['title']}\"")
    if article["subtitle"]:
        lines.append(f"subtitle: \"{article['subtitle']}\"")
    if article["date_published"]:
        lines.append(f"date: {article['date_published']}")
    if article["date_modified"]:
        lines.append(f"date_modified: {article['date_modified']}")
    if article["author"]:
        lines.append(f"author: \"{article['author']}\"")
    lines.append(f"source: \"{article['url']}\"")
    lines.append(f"brunch_num: {article['num']}")
    if article["keywords"]:
        kw_str = ", ".join(f"\"{k}\"" for k in article["keywords"])
        lines.append(f"keywords: [{kw_str}]")
    lines.append("---")
    lines.append("")

    # 제목
    lines.append(f"# {article['title']}")
    lines.append("")

    # 서브타이틀
    if article["subtitle"]:
        lines.append(f"*{article['subtitle']}*")
        lines.append("")

    # 커버 이미지
    if article["cover_image"]:
        lines.append(f"![cover]({article['cover_image']})")
        lines.append("")

    # 구분선
    lines.append("---")
    lines.append("")

    # 본문
    lines.append(article["body"])
    lines.append("")

    # 키워드
    if article["keywords"]:
        lines.append("---")
        lines.append("")
        lines.append("**Keywords**: " + ", ".join(f"#{k}" for k in article["keywords"]))
        lines.append("")

    # 원본 링크
    lines.append("---")
    lines.append(f"*원본: [{article['url']}]({article['url']})*")

    return "\n".join(lines)


def run(test_mode: bool = False, start_num: int = 1, cookie: str = "",
        only_nums: list = None):
    """메인 실행"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    consecutive_404 = 0
    success_count = 0
    skip_count = 0

    print(f"브런치 백업 시작: {BASE_URL}")
    print(f"저장 위치: {OUTPUT_DIR}")
    if cookie:
        print("쿠키 인증 모드 (서랍 글 접근 가능)")
    if only_nums:
        print(f"지정 번호만: {only_nums}")
    elif test_mode:
        print(f"테스트 모드: #{start_num}번 글만 가져옵니다")
    print()

    nums_to_fetch = only_nums if only_nums else range(start_num, start_num + (1 if test_mode else MAX_ARTICLES))

    for num in nums_to_fetch:
        print(f"[{num}] 가져오는 중... ", end="", flush=True)

        article = fetch_article(num, cookie=cookie)

        if article is None:
            consecutive_404 += 1
            skip_count += 1
            print(f"404 (연속 {consecutive_404}/{MAX_CONSECUTIVE_404})")

            if not only_nums and consecutive_404 >= MAX_CONSECUTIVE_404:
                print(f"\n연속 {MAX_CONSECUTIVE_404}회 404 — 더 이상 글이 없는 것으로 판단하고 종료")
                break
        else:
            consecutive_404 = 0
            success_count += 1

            # 마크다운 생성
            md_content = article_to_markdown(article)

            # 파일 저장
            safe_title = sanitize_filename(article["title"])
            filename = f"brunch_{num:02d}_{safe_title}.md"
            filepath = os.path.join(OUTPUT_DIR, filename)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(md_content)

            body_len = len(article["body"])
            print(f"OK — {article['title']} ({body_len}자)")

            if test_mode:
                print(f"\n테스트 완료. 저장: {filepath}")
                print(f"\n{'='*60}")
                print("파일 내용 미리보기 (앞 30줄):")
                print("="*60)
                preview_lines = md_content.split("\n")[:30]
                print("\n".join(preview_lines))
                print("...")
                return

        # 서버 부담 방지 딜레이
        if not test_mode:
            delay = random.uniform(DELAY_MIN, DELAY_MAX)
            time.sleep(delay)

    print(f"\n완료: {success_count}개 저장, {skip_count}개 스킵")
    print(f"저장 위치: {OUTPUT_DIR}")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="브런치 글 백업")
    parser.add_argument("--test", action="store_true", help="1번 글만 테스트")
    parser.add_argument("--start", type=int, default=1, help="시작 번호 (기본: 1)")
    parser.add_argument("--num", type=int, help="특정 번호만 가져오기")
    parser.add_argument("--nums", type=str, help="여러 번호 (쉼표 구분, 예: 3,5,8)")
    parser.add_argument("--cookie", type=str, default="", help="로그인 쿠키 (서랍 글 접근)")
    args = parser.parse_args()

    if args.nums:
        num_list = [int(n.strip()) for n in args.nums.split(",")]
        run(only_nums=num_list, cookie=args.cookie)
    elif args.num:
        run(test_mode=True, start_num=args.num, cookie=args.cookie)
    elif args.test:
        run(test_mode=True, start_num=args.start, cookie=args.cookie)
    else:
        run(test_mode=False, start_num=args.start, cookie=args.cookie)
