import {
  EMOJI_IMAGE_PACKS,
  type EmojiImagePack,
  type EmojiPackItem,
} from './emoji-packs.generated';
import { kaomojiList } from './emoji';

/** 图片表情包（再花 / 方长 …，文件由 npm run emoji:manifest 扫描生成） */
export type { EmojiImagePack, EmojiPackItem };

/** 纯文本表情包（颜文字）：点击后直接插入文字，不走 token */
export interface EmojiTextPack {
  key: string;
  label: string;
  type: 'text';
  items: string[];
}

export type EmojiPack = EmojiImagePack | EmojiTextPack;

const KAOMOJI_PACK: EmojiTextPack = {
  key: 'kaomoji',
  label: 'ฅ•ω•ฅ',
  type: 'text',
  items: kaomojiList,
};

/** 弹窗里从左到右的分页顺序 */
export const EMOJI_PACKS: EmojiPack[] = [...EMOJI_IMAGE_PACKS, KAOMOJI_PACK];

/** 包名 → 名字 → 条目，用于 token 反查 */
const IMAGE_INDEX: Map<string, Map<string, EmojiPackItem>> = new Map(
  EMOJI_IMAGE_PACKS.map((pack) => [
    pack.key,
    new Map(pack.items.map((item) => [item.name, item])),
  ]),
);

/**
 * 表情 token 形如 `[方长:饭饭饿饿]`。
 * 包名与名字都不允许出现 `[` `]` `:` 和换行，避免和 Markdown 链接语法打架。
 */
const TOKEN_RE = /\[([^[\]:\n]{1,16}):([^[\]:\n]{1,24})\]/g;

/** 生成插入到输入框的 token */
export function buildEmojiToken(packKey: string, name: string): string {
  return `[${packKey}:${name}]`;
}

/** 是否是清单里真实存在的表情（未知包名/名字一律不当表情处理） */
export function isKnownEmoji(packKey: string, name: string): boolean {
  return IMAGE_INDEX.get(packKey)?.has(name) ?? false;
}

/**
 * 把内容里可识别的表情 token 换成 Markdown 图片语法，交给下游渲染器。
 *
 * 只有能在清单里查到的那一项才会被替换，且替换用的名字和地址都取自清单本身
 * （而不是用户输入串），所以注入的 Markdown 只可能是我们自己的可信数据；
 * 未知 token 原样保留成文字。
 *
 * 两个细节：
 * - 用 URL 片段 `#fl-emoji` 做标记，而不是 title。因为 title 会被浏览器当成
 *   原生悬停提示显示出来 —— 之前写成 title="fl-emoji"，用户悬停看到的就是
 *   这串英文。改用片段后，alt 和 title 都可以放表情名（alt 兼作加载失败的
 *   兜底文案，title 就是悬停提示），标记藏在地址里不露面。
 * - CSS 侧靠 `img[src*="#fl-emoji"]` 命中，片段不参与图片请求，不影响加载。
 */
export function replaceEmojiTokens(content: string): string {
  if (!content) {
    return '';
  }
  return content.replace(TOKEN_RE, (whole, packKey: string, name: string) => {
    const item = IMAGE_INDEX.get(packKey)?.get(name);
    if (!item) {
      return whole;
    }
    return `![${item.name}](${item.url}#fl-emoji "${item.name}")`;
  });
}

/** 内容里是否含可识别的表情 token */
export function hasKnownEmoji(content: string): boolean {
  if (!content) {
    return false;
  }
  for (const match of content.matchAll(TOKEN_RE)) {
    if (isKnownEmoji(match[1], match[2])) {
      return true;
    }
  }
  return false;
}
