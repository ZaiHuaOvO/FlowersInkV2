export const COMMENT_EMOJI_SYMBOL_MAP: Record<string, string> = {
  like: '\u2661',
  dislike: '\u2639\uFE0E',
  worship: '\u2726',
  angry: '\u26A1\uFE0E',
  melon: '\u25D4',
  nospeak: '\u25C7',
};

export function getCommentEmojiSymbol(key: string): string {
  return COMMENT_EMOJI_SYMBOL_MAP[key] ?? '\u25C7';
}
