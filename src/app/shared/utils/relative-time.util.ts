/**
 * 相对时间：评论、订阅页等「多久以前」的统一说法。
 *
 * 无法解析的日期按「刚刚」处理（预览态会传空串）。
 */
export function relativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) {
    return '刚刚';
  }
  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 60) {
    return '刚刚';
  }
  if (diffSec < 3600) {
    return `${Math.floor(diffSec / 60)} 分钟前`;
  }
  if (diffSec < 86400) {
    return `${Math.floor(diffSec / 3600)} 小时前`;
  }
  if (diffSec < 2592000) {
    return `${Math.floor(diffSec / 86400)} 天前`;
  }
  return `${Math.floor(diffSec / 2592000)} 个月前`;
}
