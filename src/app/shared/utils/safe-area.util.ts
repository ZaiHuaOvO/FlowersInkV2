/**
 * 读取 CSS 变量 --fi-safe-top（安全区顶部内边距，刘海屏非零）的数值，供 JS 侧锚点滚动偏移使用。
 * CSS 侧用 scroll-margin-top 时直接写 calc(… + var(--fi-safe-top)) 即可；
 * 只有 ViewportScroller.setOffset / window.scrollTo 这类 JS 滚动才需要这个 helper。
 */
export function getSafeTopInset(): number {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return 0;
  }
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--fi-safe-top')
    .trim();
  return parseFloat(raw) || 0;
}
