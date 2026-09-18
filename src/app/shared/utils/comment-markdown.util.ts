import { replaceEmojiTokens } from '../../ts/emoji-packs';

/** 围栏代码块：这两段内部不做换行改写，否则会把代码格式搞坏 */
const FENCED_CODE_RE = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;

/**
 * 把段内的单换行转成 Markdown 硬换行（行尾两个空格）。
 *
 * 为什么需要：评论原本用 `white-space: pre-wrap` 显示，用户敲的每个换行都看得见；
 * 换成 Markdown 渲染后，段落内的单换行默认会被合并成空格，属于功能倒退。
 *
 * 为什么不用 marked 的 `breaks: true` 全局选项：那个选项是应用级的，会连带改掉
 * 博客正文的渲染结果。评论这点需求不值得冒改正文的风险，所以在内容层处理。
 *
 * 空行（段落分隔）不动，交给 Markdown 自己分段。
 */
function hardenLineBreaks(markdown: string): string {
  return markdown
    .split(FENCED_CODE_RE)
    .map((segment, index) =>
      // split 带捕获组时，奇数下标是代码块本身
      index % 2 === 1 ? segment : segment.replace(/[ \t]*\n(?!\n)/g, '  \n'),
    )
    .join('');
}

/**
 * 评论文本 → 交给 Markdown 渲染器的字符串。
 *
 * 两步：先把 `[包名:名字]` 表情 token 换成图片语法，再把单换行变成硬换行。
 * 顺序不能反：token 替换产生的是单行 Markdown，先硬化换行不会影响它，
 * 反而能保证 token 所在行的断行也正确。
 */
export function toCommentMarkdown(raw: string | null | undefined): string {
  if (!raw) {
    return '';
  }
  return hardenLineBreaks(replaceEmojiTokens(raw));
}
