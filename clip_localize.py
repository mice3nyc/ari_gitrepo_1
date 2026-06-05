#!/usr/bin/env python3
"""clip_localize.py — Clipping 이미지 로컬화

웹 클리핑(.md)의 원격 이미지/비디오를 다운로드하여 로컬 참조로 교체한다.

사용:
    python3 _dev/clip_localize.py "Clippings/파일명.md"
    python3 _dev/clip_localize.py "Clippings/파일명.md" --name "short"
    python3 _dev/clip_localize.py "Clippings/파일명.md" --dry-run

이미지 → Assets/incoming/Clippings/{slug}/  (볼트 안, Obsidian 임베드)
비디오 → ~/Desktop/_외근작업/OSDN_VAULT/{slug}/  (볼트 밖, Sync 제외)
"""

import sys
import os
import re
import time
import urllib.request
import urllib.parse
from pathlib import Path

# ── 경로 설정 ──────────────────────────────────────────────
VAULT_ROOT = Path(__file__).resolve().parent.parent  # _dev/ → 볼트 루트
IMG_BASE = VAULT_ROOT / "Assets" / "incoming" / "Clippings"
VID_BASE = Path.home() / "Desktop" / "_외근작업" / "OSDN_VAULT"

VIDEO_EXTS = {".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v", ".ogv"}


def slugify(name):
    """파일명 → 짧은 ASCII 폴더명 (3단어 이내)"""
    stem = Path(name).stem
    for old, new in [
        ("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss"),
        ("Ä", "Ae"), ("Ö", "Oe"), ("Ü", "Ue"),
        ("é", "e"), ("è", "e"), ("ê", "e"), ("à", "a"), ("â", "a"),
    ]:
        stem = stem.replace(old, new)
    stem = re.sub(r"[^\w\s]", " ", stem)
    skip = {"the", "on", "in", "of", "a", "an", "and", "or", "for", "at", "to", "from", "by"}
    words = [w for w in stem.split() if w.lower() not in skip and w.strip()]
    return "-".join(words[:3]) or "clip"


def url_to_filename(url):
    """URL → 로컬 파일명 (percent-decode, 위험문자 제거)"""
    path = urllib.parse.urlparse(url).path
    fname = urllib.parse.unquote(path.split("/")[-1])
    fname = re.sub(r'[<>:"/\\|?*]', "_", fname)
    return fname


def is_video(fname):
    return Path(fname).suffix.lower() in VIDEO_EXTS


def extract_media(content):
    """마크다운에서 원격 이미지/비디오 URL 추출"""
    images = []   # (full_match, url)
    videos = []   # (full_match, url)

    # ![alt](https://...) — 마크다운 이미지
    for m in re.finditer(r"!\[[^\]]*\]\((https?://[^\s\)]+)\)", content):
        url = m.group(1)
        fname = url_to_filename(url)
        if is_video(fname):
            videos.append((m.group(0), url))
        else:
            images.append((m.group(0), url))

    # <video ... src="https://..." ...> — HTML 비디오
    for m in re.finditer(r'<video[^>]*\bsrc="(https?://[^"]+)"[^>]*>', content):
        videos.append((m.group(0), m.group(1)))

    # <img ... src="https://..." ...> — HTML 이미지
    for m in re.finditer(r'<img[^>]*\bsrc="(https?://[^"]+)"[^>]*>', content):
        images.append((m.group(0), m.group(1)))

    return images, videos


def download(url, dest, retries=2):
    """URL 다운로드. 이미 있으면 skip."""
    if dest.exists() and dest.stat().st_size > 0:
        return "skip"

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0"
    }
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                dest.write_bytes(resp.read())
            return "ok"
        except Exception as e:
            if attempt < retries:
                time.sleep(1)
            else:
                return f"fail: {e}"


def fmt(size_bytes):
    if size_bytes < 1024:
        return f"{size_bytes}B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.0f}KB"
    return f"{size_bytes / (1024 * 1024):.1f}MB"


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Clipping 이미지 로컬화")
    parser.add_argument("file", help=".md 파일 경로 (볼트 기준 상대 또는 절대)")
    parser.add_argument("--name", "-n", help="서브폴더명 (생략 시 자동 생성)")
    parser.add_argument("--dry-run", "-d", action="store_true", help="다운로드 없이 계획만 출력")
    args = parser.parse_args()

    # ── 파일 경로 확인 ──
    fp = Path(args.file)
    if not fp.is_absolute():
        fp = VAULT_ROOT / fp
    if not fp.exists():
        print(f"  파일 없음: {fp}")
        sys.exit(1)

    slug = args.name or slugify(fp.name)
    img_dir = IMG_BASE / slug
    vid_dir = VID_BASE / slug

    content = fp.read_text(encoding="utf-8")
    images, videos = extract_media(content)

    # ── 중복 제거 ──
    unique_img = {}  # url → filename
    for _, url in images:
        if url not in unique_img:
            unique_img[url] = url_to_filename(url)

    unique_vid = {}
    for _, url in videos:
        if url not in unique_vid:
            unique_vid[url] = url_to_filename(url)

    # ── 리포트 ──
    print(f"\n  clip_localize — {fp.name}")
    print(f"  {'─' * 44}")
    print(f"  이미지  {len(images)}개 참조 / {len(unique_img)}개 고유")
    print(f"  비디오  {len(videos)}개")
    print(f"  IMG →  {img_dir}")
    if unique_vid:
        print(f"  VID →  {vid_dir}")

    if args.dry_run:
        print(f"  [DRY RUN]\n")
        for fname in unique_img.values():
            print(f"    img  {fname}")
        for fname in unique_vid.values():
            print(f"    vid  {fname}")
        print(f"\n  합계: {len(unique_img)} 이미지 + {len(unique_vid)} 비디오")
        return

    print()

    # ── 폴더 생성 ──
    img_dir.mkdir(parents=True, exist_ok=True)
    if unique_vid:
        vid_dir.mkdir(parents=True, exist_ok=True)

    # ── 이미지 다운로드 ──
    ok = skip = fail = 0
    for i, (url, fname) in enumerate(unique_img.items(), 1):
        dest = img_dir / fname
        label = fname[:55] if len(fname) > 55 else fname
        print(f"  [{i}/{len(unique_img)}] {label}", end="", flush=True)

        result = download(url, dest)
        if result == "ok":
            ok += 1
            print(f" — {fmt(dest.stat().st_size)}")
        elif result == "skip":
            skip += 1
            print(" — 이미 있음")
        else:
            fail += 1
            print(f" — {result}")

    # ── 비디오 다운로드 ──
    vid_ok = 0
    for url, fname in unique_vid.items():
        dest = vid_dir / fname
        print(f"  [vid] {fname}", end="", flush=True)
        result = download(url, dest)
        if result in ("ok", "skip"):
            vid_ok += 1
            print(f" — {fmt(dest.stat().st_size)}")
        else:
            print(f" — {result}")

    # ── 마크다운 교체 ──
    new_content = content

    # 이미지: ![...](url) → ![[filename]]\n[image_url](url)
    for url, fname in unique_img.items():
        if (img_dir / fname).exists():
            replacement = f"![[{fname}]]\n[image_url]({url})"
            pat = re.compile(r"!\[[^\]]*\]\(" + re.escape(url) + r"\)")
            new_content = pat.sub(replacement, new_content)

    # HTML <img>: src 교체 + 원본 URL 보존
    for url, fname in unique_img.items():
        if (img_dir / fname).exists():
            new_content = new_content.replace(f'src="{url}"', f'src="{fname}"')

    # 비디오: src URL → 로컬 절대 경로 + 원본 URL 보존
    for url, fname in unique_vid.items():
        local = vid_dir / fname
        if local.exists():
            old_tag_str = f'src="{url}"'
            new_tag_str = f'src="file://{local}"'
            new_content = new_content.replace(old_tag_str, new_tag_str)
            # 비디오 태그 뒤에 원본 URL 기록
            new_content = new_content.replace(
                f"file://{local}\" controls",
                f"file://{local}\" controls",
            )
            # </video> 뒤에 원본 링크 추가
            vid_tag_end = f'src="file://{local}"'
            if f"[video_url]({url})" not in new_content:
                new_content = new_content.replace(
                    "</video>",
                    f"</video>\n[video_url]({url})",
                    1,
                )

    fp.write_text(new_content, encoding="utf-8")

    # ── 요약 ──
    total_img_size = sum(f.stat().st_size for f in img_dir.iterdir() if f.is_file())
    print(f"\n  {'─' * 44}")
    print(f"  완료")
    print(f"  이미지: {ok} 다운로드 + {skip} 기존 ({fmt(total_img_size)})")
    if fail:
        print(f"  실패: {fail}개")
    if vid_ok:
        total_vid_size = sum(f.stat().st_size for f in vid_dir.iterdir() if f.is_file())
        print(f"  비디오: {vid_ok}개 ({fmt(total_vid_size)}) → OSDN_VAULT/{slug}/")
    print(f"  마크다운 교체 완료: {fp.name}")
    print()


if __name__ == "__main__":
    main()
