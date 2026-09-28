#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Finalize: write the chosen NotoEmoji subset, drop scratch files."""
from pathlib import Path
import os, glob, subprocess, sys, tempfile

ROOT   = Path(__file__).resolve().parents[2]          # FlowersInkV2/
ASSETS = str(ROOT / 'src' / 'assets' / 'fonts')
OUTDIR = os.path.join(ASSETS, '_sliced')
CORPUS = str(ROOT / 'scripts' / 'fonts' / '_corpus.txt')
SRC = os.path.join(ASSETS, 'Noto_Emoji/NotoEmoji-VariableFont_wght.ttf')

txt = open(CORPUS, encoding='utf-8', errors='replace').read()

def rng(a, b): return {chr(c) for c in range(a, b + 1)}

def is_emoji(ch):
    o = ord(ch)
    return (0x1F300 <= o <= 0x1FAFF or 0x2600 <= o <= 0x27BF or
            0x2190 <= o <= 0x21FF or 0x2B00 <= o <= 0x2BFF or
            0x1F000 <= o <= 0x1F2FF or o == 0xFE0F or o == 0x200D)

chars = sorted({ch for ch in txt if is_emoji(ch)}
               | rng(0x1F600, 0x1F64F) | rng(0x2600, 0x27BF))

with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as fh:
    fh.write(''.join(chars)); tf = fh.name
out = os.path.join(OUTDIR, 'notoemoji-00.woff2')
r = subprocess.run([sys.executable, '-m', 'fontTools.subset', SRC, f'--text-file={tf}',
                    '--flavor=woff2', '--layout-features=*', '--name-IDs=*',
                    '--no-hinting', '--desubroutinize', f'--output-file={out}'],
                   capture_output=True, text=True)
os.unlink(tf)
print('notoemoji-00.woff2:', f'{os.path.getsize(out)/1024:.1f} KB' if r.returncode == 0 else 'FAILED')

# scrub scratch artifacts
for pat in ('_test_slice*.woff2', '_emoji_*.woff2'):
    for f in glob.glob(os.path.join(OUTDIR, pat)):
        os.unlink(f)
        print('removed scratch:', os.path.basename(f))

print('\n--- final _sliced contents ---')
tot = 0
for f in sorted(glob.glob(os.path.join(OUTDIR, '*'))):
    sz = os.path.getsize(f); tot += sz
    print(f'  {sz/1024:9.1f} KB  {os.path.basename(f)}')
print(f'  TOTAL {tot/1024:.0f} KB')
