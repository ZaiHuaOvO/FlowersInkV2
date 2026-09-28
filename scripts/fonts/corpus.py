#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the site's text corpus and report CJK character coverage needs."""
import json, re, urllib.request, os, glob
from collections import Counter
from pathlib import Path

API = 'https://api.flowersink.com'
OUT = str(Path(__file__).resolve().parents[2] / 'scripts' / 'fonts' / '_corpus.txt')

def get(path):
    req = urllib.request.Request(API + path, headers={'Accept-Encoding': 'identity'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode('utf-8', 'replace')

texts = []
# blog: all articles with full content
try:
    d = json.loads(get('/blog?page=1&pageSize=1000'))
    rows = d['data']['data']
    print(f'blog rows: {len(rows)}')
    for r in rows:
        for k in ('title', 'description', 'content'):
            if r.get(k): texts.append(str(r[k]))
        for c in (r.get('comment') or []):
            for k in ('content', 'reply'):
                if isinstance(c, dict) and c.get(k): texts.append(str(c[k]))
except Exception as e:
    print('blog fail:', e)

# life / 点滴
for ep in ('/life', '/life?limit=999'):
    try:
        d = json.loads(get(ep))
        data = d.get('data', d)
        print(f'{ep} -> {type(data).__name__}')
        js = json.dumps(data, ensure_ascii=False)
        texts.append(js)
        break
    except Exception as e:
        print(ep, 'fail:', e)

# frontend source strings (UI labels, etc.)
for pat in (r'D:\FLOWERSINK\FlowersInkV2\src\**\*.html',
            r'D:\FLOWERSINK\FlowersInkV2\src\**\*.ts',
            r'D:\FLOWERSINK\FlowersInkV2\src\**\*.css'):
    for f in glob.glob(pat, recursive=True):
        if 'node_modules' in f: continue
        try:
            texts.append(open(f, encoding='utf-8', errors='replace').read())
        except Exception:
            pass

blob = '\n'.join(texts)
open(OUT, 'w', encoding='utf-8').write(blob)
print(f'\ncorpus written: {OUT}  ({len(blob):,} chars)')

cjk = Counter(ch for ch in blob if '\u4e00' <= ch <= '\u9fff')
ascii_p = Counter(ch for ch in blob if 0x20 <= ord(ch) < 0x7f)
other = Counter(ch for ch in blob if ord(ch) > 0x2000 and not ('\u4e00' <= ch <= '\u9fff'))

print(f'\nunique CJK chars on site : {len(cjk):,}')
print(f'unique ASCII chars      : {len(ascii_p):,}')
print(f'unique other (>U+2000)  : {len(other):,}')
print(f'\ntop 40 CJK: {"".join(c for c,_ in cjk.most_common(40))}')

# how much of the text do the top-N chars cover?
tot = sum(cjk.values())
for n in (500, 1000, 2000, 3000, 3500, 5000, 6763):
    cov = sum(c for _, c in cjk.most_common(n))
    print(f'  top {n:>5} CJK chars cover {100*cov/tot:6.2f}% of CJK occurrences on site')
