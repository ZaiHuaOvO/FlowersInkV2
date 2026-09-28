#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Rewrite the @font-face block in fi-tokens.css to use the sliced woff2 files."""
import os, re
from pathlib import Path

ROOT  = Path(__file__).resolve().parents[2]          # FlowersInkV2/
CSS   = str(ROOT / 'src' / 'app' / 'common_ui' / 'css' / 'fi-tokens.css')
SLICE = str(ROOT / 'src' / 'assets' / 'fonts' / '_sliced' / '_notosanssc.css')

src = open(CSS, encoding='utf-8').read()

# locate the end of the original 4 @font-face blocks (they sit before ":root")
idx = src.index(':root {')
rest = src[idx:]

# --- CJK slices: take the generated rules, repoint urls at the served assets path ---
cjk = open(SLICE, encoding='utf-8').read()
cjk = re.sub(r'url\("[^"]*/([^"/]+\.woff2)"\)', r'url("/assets/fonts/_sliced/\1")', cjk)

head = '''@font-face {
  font-family: "InterVar";
  src: url("/assets/fonts/_sliced/inter-00.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "InterVar";
  src: url("/assets/fonts/_sliced/inter-italic-00.woff2") format("woff2");
  font-style: italic;
  font-weight: 100 900;
  font-display: swap;
}

'''

tail = '''
@font-face {
  font-family: "NotoEmojiVar";
  src: url("/assets/fonts/_sliced/notoemoji-00.woff2") format("woff2");
  font-style: normal;
  font-weight: 300 700;
  font-display: swap;
}

'''

new = head + cjk.rstrip() + '\n' + tail + rest
open(CSS, 'w', encoding='utf-8', newline='\n').write(new)

print('rewrote', CSS)
print('  new size:', f'{len(new)/1024:.1f} KB')
print('  @font-face blocks:', new.count('@font-face'))
print('  external /media urls left:', len(re.findall(r'fonts/(Inter|Noto_Sans_SC|Noto_Emoji)/', new)))
