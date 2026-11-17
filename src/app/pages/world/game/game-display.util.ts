export type GamePlayStatus = 'till_now' | 'abandoned' | 'completed' | 'playing';
export type GameRecommend = 'recommended' | 'not_recommended' | 'average' | '';

export function normalizeRecommend(
  value: string | null | undefined,
): GameRecommend {
  return value === 'recommended' ||
    value === 'not_recommended' ||
    value === 'average'
    ? value
    : '';
}

export function playStatusText(status: GamePlayStatus | undefined): string {
  switch (status) {
    case 'playing':
      return '正在游玩';
    case 'till_now':
      return '至今仍在游玩';
    case 'abandoned':
      return '已弃坑';
    default:
      return '已通关';
  }
}

export function statusDateLabel(status: GamePlayStatus | undefined): string {
  return status === 'abandoned' ? '弃坑时间' : '通关时间';
}

export function isCurrentStatus(status: GamePlayStatus | undefined): boolean {
  return status === 'playing' || status === 'till_now';
}

export function hasStatusDate(status: GamePlayStatus | undefined): boolean {
  return status === 'completed' || status === 'abandoned';
}

interface DateParts {
  year: string;
  month: string;
  day: string;
}

function dateParts(
  value: string | Date | null | undefined,
): DateParts | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return {
      year: String(value.getFullYear()),
      month: String(value.getMonth() + 1).padStart(2, '0'),
      day: String(value.getDate()).padStart(2, '0'),
    };
  }

  // 日期列返回的是 YYYY-MM-DD，按字符串取，避免 new Date() 在部分时区偏一天。
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match
    ? { year: match[1], month: match[2], day: match[3] }
    : null;
}

/** 2026.11.09 */
export function formatGameDate(
  value: string | Date | null | undefined,
): string {
  const parts = dateParts(value);
  return parts ? `${parts.year}.${parts.month}.${parts.day}` : '';
}

/** 11.09 */
export function formatGameDateShort(
  value: string | Date | null | undefined,
): string {
  const parts = dateParts(value);
  return parts ? `${parts.month}.${parts.day}` : '';
}

/** 2026 年 11 月 09 日 */
export function formatGameDateAria(
  value: string | Date | null | undefined,
): string {
  const parts = dateParts(value);
  return parts
    ? `${parts.year} 年 ${parts.month} 月 ${parts.day} 日`
    : '';
}

export function formatHours(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

interface GameCoverSource {
  imgFirst?: Array<{ url?: string } | string>;
  img?: Array<{ url?: string } | string>;
}

/** 封面优先 imgFirst[0]，缺失时回退到第一张截图 */
export function resolveGameCover(
  game: GameCoverSource | null | undefined,
): string {
  const cover = game?.imgFirst?.[0];
  if (typeof cover === 'string') {
    return cover;
  }
  if (cover?.url) {
    return cover.url;
  }

  const fallback = game?.img?.[0];
  if (typeof fallback === 'string') {
    return fallback;
  }
  return fallback?.url ?? '';
}
