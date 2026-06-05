#!/usr/bin/env python3
"""
bigthink_clip.py — Big Think 기사를 볼트 Clippings/로 클리핑한다.

배경: Big Think은 서버 측 요청(curl/WebFetch)을 403으로 막는다. 헤드리스 크롬
`--dump-dom`으로만 통과된다. 그래서 이 스크립트는 메인(아리공)이 직접 돌린다.
백도는 Bash 권한 벽에 걸리므로 클리핑은 메인 스크립트로, 편당 한글 요약만 백도로.
(메모리: feedback_web_clipping_blocked_sites)

사용법:
  python3 bigthink_clip.py <기사_URL>                 # 한 편 클리핑
  python3 bigthink_clip.py --collection <컬렉션_URL>   # 컬렉션 전편 클리핑
  python3 bigthink_clip.py --list <컬렉션_URL>         # 컬렉션 기사 목록만 출력

산출물:
  - Clippings/<제목>.md  (frontmatter + 본문 마크다운, 광고/추천 제거)
  - Assets/2026.images/BigThink_<slug>.<ext>  (메인 이미지, 1400px 캡)
클리핑 후 본문 상단 `> [!abstract] 아리공 요약` 콜아웃은 백도로 따로 붙인다.
회원 전용(Big Think+) 영상/기사는 본문이 잠겨 wc=0 → 스텁(설명+썸네일)만.
"""
import re, json, html as H, subprocess, sys, os, unicodedata
from html.parser import HTMLParser
from urllib.request import Request, urlopen

VAULT = "/Users/p.air15/Neo-Obsi-Sync"
CLIPDIR = os.path.join(VAULT, "Clippings")
IMGDIR = os.path.join(VAULT, "Assets/2026.images")
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
IMG_CAP_PX = 1400          # jpg/png 가로 최대 px (큰 원본 자동 축소)
IMG_CAP_BYTES = 1_500_000  # 이 크기 넘는 jpg/png만 sips로 캡

EXCLUDE_CLASS = re.compile(r'related-content|class-card|newsletter|signup|sign-up|share|social|advert|promo|recirc|paywall|membership|bt-block--cta|footer|subscribe', re.I)

def fetch(url):
    out = subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--dump-dom",
                          "--virtual-time-budget=10000", f"--user-agent={UA}", url],
                         capture_output=True, text=True, timeout=90)
    return out.stdout

def meta(h, prop):
    m = re.search(r'<meta[^>]+(?:property|name)="'+re.escape(prop)+r'"[^>]+content="([^"]*)"', h) or \
        re.search(r'<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="'+re.escape(prop)+r'"', h)
    return H.unescape(m.group(1)) if m else None

def jsonld_article(h):
    res = {}
    for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try: d = json.loads(b)
        except Exception: continue
        def walk(o):
            if isinstance(o, dict):
                if o.get('@type') in ('NewsArticle','Article','BlogPosting'):
                    au = o.get('author')
                    if isinstance(au, list): au = ', '.join(a.get('name','') for a in au if isinstance(a,dict))
                    elif isinstance(au, dict): au = au.get('name')
                    res['author'] = au
                    res['date'] = (o.get('datePublished') or '')[:10]
                for v in o.values(): walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(d)
    return res

VOID = {'img','br','hr','input','meta','link','source','area','base','col','embed','param','track','wbr'}

class BodyMD(HTMLParser):
    """본문 컨테이너(article-body + prose)만 마크다운으로 추출.
    함정 3개를 피한다: ① void 요소는 스택에 안 쌓는다(깊이 보호)
    ② EXCLUDE는 본문 진입 후에만(조상 <article> class 'social' 오탐 차단)
    ③ 본문은 article-body+prose 둘 다 가진 내부 div(외부 grid 래퍼 말고)."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.body_depth = None
        self.skip_depth = None
        self.out = []
        self.buf = []
        self.cur_block = None
        self.list_stack = []
        self.in_a = None

    def _classes(self, attrs):
        return dict(attrs).get('class','') or ''

    @property
    def active(self):
        return self.body_depth is not None and self.skip_depth is None

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            if tag == 'br' and self.active and self.cur_block:
                self.buf.append(' ')
            return
        cls = self._classes(attrs)
        self.stack.append((tag, cls))
        depth = len(self.stack) - 1
        if self.body_depth is None and tag in ('div','section','article') and ('article-body' in cls and 'prose' in cls):
            self.body_depth = depth
            return
        if self.body_depth is not None and self.skip_depth is None and EXCLUDE_CLASS.search(cls):
            self.skip_depth = depth
            return
        if not self.active:
            return
        if tag in ('p','h2','h3','h4','blockquote'):
            self._flush(); self.cur_block = tag
        elif tag in ('ul','ol'):
            self._flush(); self.list_stack.append('-' if tag=='ul' else '1.')
        elif tag == 'li':
            self._flush(); self.cur_block = 'li'
        elif tag in ('strong','b'):
            self.buf.append('**')
        elif tag in ('em','i'):
            self.buf.append('_')
        elif tag == 'a':
            self.in_a = dict(attrs).get('href',''); self.buf.append('[')

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        depth = len(self.stack) - 1
        if self.skip_depth is not None and depth == self.skip_depth:
            self.skip_depth = None
            if self.stack: self.stack.pop()
            return
        if self.body_depth is not None and depth == self.body_depth:
            self._flush(); self.body_depth = None
            if self.stack: self.stack.pop()
            return
        if self.active:
            if tag in ('p','h2','h3','h4','blockquote','li'):
                self._flush()
            elif tag in ('ul','ol'):
                if self.list_stack: self.list_stack.pop()
            elif tag in ('strong','b'):
                self.buf.append('**')
            elif tag in ('em','i'):
                self.buf.append('_')
            elif tag == 'a':
                href = self.in_a or ''
                self.buf.append(f']({href})' if href else ']'); self.in_a = None
        if self.stack: self.stack.pop()

    def handle_data(self, data):
        if self.active and self.cur_block:
            self.buf.append(data)

    def _flush(self):
        if not self.cur_block:
            self.buf = []; return
        text = ''.join(self.buf)
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'\*\*\s*\*\*', '', text)
        text = re.sub(r'_\s*_', '', text)
        self.buf = []
        blk = self.cur_block; self.cur_block = None
        if not text: return
        if blk == 'h2': self.out.append('#### ' + text)
        elif blk == 'h3': self.out.append('##### ' + text)
        elif blk == 'h4': self.out.append('###### ' + text)
        elif blk == 'blockquote': self.out.append('> ' + text)
        elif blk == 'li':
            mark = self.list_stack[-1] if self.list_stack else '-'
            self.out.append(f'{mark} {text}')
        else: self.out.append(text)

    def markdown(self):
        lines = []; prev_list = False
        for b in self.out:
            is_list = bool(re.match(r'^(-|\d+\.) ', b))
            if lines and not (is_list and prev_list): lines.append('')
            lines.append(b); prev_list = is_list
        md = '\n'.join(lines)
        md = re.sub(r'(?<!\w)_([^_\n]+)_(?!\w)', r'\1', md)   # italic 정리(볼트 규칙)
        md = re.sub(r'\n{3,}', '\n\n', md).strip()
        return md

def sanitize_filename(t):
    t = unicodedata.normalize('NFC', t)
    t = t.replace('—', ' - ').replace('–', ' - ')
    t = t.replace('/', ' ').replace('\\', ' ').replace(':', ' -')
    t = re.sub(r'[<>|*?"]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def download_img(url, slug):
    if not url: return None, 0
    url = re.sub(r'\?.*$', '', url)
    ext = (os.path.splitext(url)[1] or '.jpg').lower()
    if len(ext) > 5: ext = '.jpg'
    fn = f"BigThink_{slug}{ext}"
    path = os.path.join(IMGDIR, fn)
    try:
        req = Request(url, headers={'User-Agent': UA, 'Referer': 'https://bigthink.com/'})
        data = urlopen(req, timeout=60).read()
        with open(path, 'wb') as f: f.write(data)
        # 큰 정적 이미지는 가로 1400px로 캡(gif는 애니메이션 보존 위해 건드리지 않음)
        if ext != '.gif' and len(data) > IMG_CAP_BYTES:
            subprocess.run(['sips', '-Z', str(IMG_CAP_PX), path],
                           capture_output=True, timeout=60)
        return fn, os.path.getsize(path)
    except Exception:
        return None, 0

def clip(url):
    slug = url.rstrip('/').split('/')[-1]
    h = fetch(url)
    if not h or 'just a moment' in h.lower():
        return {'url': url, 'ok': False, 'err': 'fetch 실패/차단'}
    title = meta(h,'og:title') or slug
    desc = meta(h,'og:description') or ''
    img = meta(h,'og:image')
    ld = jsonld_article(h)
    author = ld.get('author') or meta(h,'author') or ''
    date = ld.get('date') or (meta(h,'article:published_time') or '')[:10]
    p = BodyMD(); p.feed(h)
    body = p.markdown()
    wc = len(re.findall(r'\S+', body))
    imgfn, imgsize = download_img(img, slug)
    fm_title = title.replace('"', '\\"'); fm_desc = desc.replace('"', '\\"')
    front = ['---', f'title: "{fm_title}"', f'source: "{url}"']
    if date: front.append(f'published: {date}')
    if desc: front.append(f'description: "{fm_desc}"')
    if author: front.append(f'author_source: "{author}"')
    front += ['tags:', '  - "clippings"', '---', '']
    parts = ['\n'.join(front)]
    if imgfn: parts.append(f'![[{imgfn}]]')
    parts.append(f'## {title}')
    if desc: parts.append(f'##### {desc}')
    byline = ' · '.join(x for x in [author, date] if x)
    if byline: parts.append(f'<sub>{byline} · Big Think</sub>')
    if wc < 250:   # 회원 전용/영상 스텁
        parts.append('> [!warning] Big Think+ 회원 전용 (본문 잠김)\n'
                     '> 본문/대본이 회원 로그인 뒤에 잠겨 있어 설명과 썸네일만 가져왔다. 전체는 위 source 링크에서 볼 수 있다.')
    else:
        parts.append(body)
    note = unicodedata.normalize('NFC', '\n\n'.join(parts) + '\n')
    fpath = os.path.join(CLIPDIR, sanitize_filename(title) + '.md')
    with open(fpath, 'w', encoding='utf-8') as f: f.write(note)
    return {'url': url, 'ok': True, 'file': os.path.basename(fpath), 'wc': wc,
            'img': imgfn, 'imgKB': round(imgsize/1024), 'author': author,
            'date': date, 'paywall': wc < 250}

def collection_articles(collection_url):
    """컬렉션 페이지에서 (기사 URL, 제목) 목록 추출. nav/topic/class 링크 제외."""
    h = fetch(collection_url)
    nav = ('collections','series','t','people','membership','newsletter','podcasts','videos','my-classes')
    anchors = re.findall(r'<a\b[^>]*href="((?:https://bigthink\.com)?/[a-z0-9-]+/[a-z0-9-]+/)"[^>]*>(.*?)</a>', h, re.S)
    seen = []; urls = set()
    for href, inner in anchors:
        sec = href.replace('https://bigthink.com','').strip('/').split('/')[0]
        if sec in nav: continue
        text = re.sub(r'\s+',' ', re.sub(r'<[^>]+>',' ', inner)).strip()
        if len(text) < 8: continue
        full = href if href.startswith('http') else 'https://bigthink.com'+href
        if full in urls: continue
        urls.add(full); seen.append((full, text))
    return seen

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        print(__doc__); sys.exit(1)
    if args[0] in ('--list','--collection'):
        arts = collection_articles(args[1])
        print(f"기사 {len(arts)}편:")
        for i,(u,t) in enumerate(arts,1): print(f"{i:2}. {t}\n    {u}")
        if args[0] == '--collection':
            print("\n클리핑 시작...")
            for i,(u,_) in enumerate(arts,1):
                r = clip(u)
                flag = 'OK ' if r.get('ok') else 'ERR'
                pw = ' ⚠PAYWALL' if r.get('paywall') else ''
                print(f"[{i:2}/{len(arts)}] {flag} wc={r.get('wc','-'):>5} img={r.get('imgKB','-')}KB{pw}  {r.get('file', r.get('err',''))}")
    else:
        import pprint; pprint.pprint(clip(args[0]))
