#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Slice the self-hosted CJK/emoji fonts into frequency-ordered woff2 chunks with
unicode-range, so the browser only downloads the slices a page actually needs.

Usage:
  python _slice_fonts.py test     # build ONE slice, report sizes
  python _slice_fonts.py build    # build everything + emit CSS
"""
from pathlib import Path
import os, sys, json, subprocess, tempfile
from collections import Counter

ROOT   = Path(__file__).resolve().parents[2]          # FlowersInkV2/
ASSETS = str(ROOT / 'src' / 'assets' / 'fonts')
OUTDIR = os.path.join(ASSETS, '_sliced')
CORPUS = str(ROOT / 'scripts' / 'fonts' / '_corpus.txt')

SLICE_SIZE = 500          # chars per woff2
FONTS = {
    'NotoSansSCVar': ('Noto_Sans_SC/NotoSansSC-VariableFont_wght.ttf', 'cjk'),
    'NotoEmojiVar':  ('Noto_Emoji/NotoEmoji-VariableFont_wght.ttf',     'emoji'),
}


def gb2312_chars():
    """All 6763 hanzi in GB2312 (covers essentially all common simplified Chinese)."""
    out = []
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                out.append(bytes([hi, lo]).decode('gb2312'))
            except UnicodeDecodeError:
                pass
    return out


def punctuation():
    """CJK punctuation, fullwidth forms, common symbols/arrows used in prose."""
    return list(
        '　、。〃々〆〇《》「」『』【】〔〕〖〗〘〙〚〛〜〝〞〟'
        '〰〾〿–—‘’‛“”„‟…‧﹏'
        '！＂＃＄％＆＇（）＊＋，－．／０１２３４５６７８９：；＜＝＞？＠［＼］＾＿｀｛｜｝～'
        '，。！？；：、（）【】《》“”‘’—…·×÷±≈≠≤≥→←↑↓↔⇒⇔∑∏√∞∫'
        '°′″℃￥＄€£¢‰※†‡§¶©®™✓✔✗✘★☆♦♠♣♥♪♫'
    )


def corpus_counter():
    txt = open(CORPUS, encoding='utf-8', errors='replace').read()
    # count EVERY char (not just CJK): punctuation like \u3001\u3002\uff0c then ranks by real
    # usage and lands in an early slice instead of one the page must fetch alone
    return Counter(txt)


def build_charset():
    freq = corpus_counter()
    cjk_used = {c for c in freq if '\u4e00' <= c <= '\u9fff'}
    base = set(gb2312_chars()) | cjk_used | set(punctuation())

    # frequency-ordered over everything the site actually uses, then reserve by codepoint
    ordered = [c for c, _ in freq.most_common() if c in base]
    ordered += sorted(base - set(ordered))
    return ordered, cjk_used


def run_subset(src, chars, outpath, flavor='woff2'):
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as fh:
        fh.write(''.join(chars))
        tf = fh.name
    cmd = [sys.executable, '-m', 'fontTools.subset', src,
           f'--text-file={tf}',
           '--flavor=' + flavor,
           '--layout-features=*',
           '--name-IDs=*',
           '--no-hinting',
           '--desubroutinize',
           f'--output-file={outpath}']
    r = subprocess.run(cmd, capture_output=True, text=True)
    os.unlink(tf)
    if r.returncode != 0:
        print('SUBSET FAILED:', r.stderr[-800:])
        return False
    return True


def unicode_range(chars):
    cps = sorted({ord(c) for c in chars})
    out, start, prev = [], cps[0], cps[0]
    for cp in cps[1:]:
        if cp == prev + 1:
            prev = cp
            continue
        out.append((start, prev)); start = prev = cp
    out.append((start, prev))
    return ','.join(f'U+{a:X}' if a == b else f'U+{a:X}-{b:X}' for a, b in out)


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'test'
    ordered, freq = build_charset()
    print(f'total chars in target set: {len(ordered):,}')
    print(f'  (site-used CJK: {len(freq):,})')

    os.makedirs(OUTDIR, exist_ok=True)
    slices = [ordered[i:i + SLICE_SIZE] for i in range(0, len(ordered), SLICE_SIZE)]
    print(f'slices of {SLICE_SIZE}: {len(slices)}')

    src = os.path.join(ASSETS, FONTS['NotoSansSCVar'][0])
    print(f'source: {src}  ({os.path.getsize(src)/1048576:.2f} MB)')

    if mode == 'test':
        for i in (0, 5):
            if i >= len(slices): continue
            outp = os.path.join(OUTDIR, f'_test_slice{i}.woff2')
            ok = run_subset(src, slices[i], outp)
            if ok:
                print(f'  slice {i}: {len(slices[i])} chars -> {os.path.getsize(outp)/1024:.1f} KB')
        est = sum(os.path.getsize(os.path.join(OUTDIR, f'_test_slice{i}.woff2'))
                  for i in (0, 5) if os.path.exists(os.path.join(OUTDIR, f'_test_slice{i}.woff2')))
        print(f'  ~{(est/2 * len(slices))/1024:.0f} KB for all {len(slices)} slices (extrapolated)')
        return

    # ---- full build ----
    css, total = [], 0
    for i, sl in enumerate(slices):
        name = f'notosanssc-{i:02d}.woff2'
        outp = os.path.join(OUTDIR, name)
        if not run_subset(src, sl, outp):
            return
        sz = os.path.getsize(outp); total += sz
        css.append(
            '@font-face {\n'
            '  font-family: "NotoSansSCVar";\n'
            f'  src: url("../fonts/_sliced/{name}") format("woff2");\n'
            '  font-style: normal;\n  font-weight: 100 900;\n  font-display: swap;\n'
            f'  unicode-range: {unicode_range(sl)};\n}}'
        )
        print(f'  {name}  {len(sl):>4} chars  {sz/1024:7.1f} KB')

    print(f'\nNotoSansSC sliced TOTAL: {total/1024:.0f} KB  (was {os.path.getsize(src)/1048576:.2f} MB)')
    open(os.path.join(OUTDIR, '_notosanssc.css'), 'w', encoding='utf-8').write('\n'.join(css) + '\n')
    print('CSS written to', os.path.join(OUTDIR, '_notosanssc.css'))


if __name__ == '__main__':
    main()
