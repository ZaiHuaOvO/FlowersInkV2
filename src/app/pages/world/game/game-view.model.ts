import {
  formatGameDate,
  formatGameDateAria,
  formatGameDateShort,
  hasStatusDate,
  isCurrentStatus,
  normalizeRecommend,
  playStatusText,
  type GamePlayStatus,
  type GameRecommend,
} from './game-display.util';

export interface GameImage {
  url?: string;
  [key: string]: unknown;
}

export interface GameRecord {
  id: number;
  name: string;
  tag?: string;
  description?: string;
  platform?: string;
  gameType?: 'online' | 'single';
  playStatus?: GamePlayStatus;
  time?: number | null;
  imgFirst?: GameImage[];
  img?: GameImage[];
  statusDate?: string | Date | null;
  content?: string;
  recommend?: GameRecommend | null;
}

export type TimelineKind = 'completed' | 'abandoned' | 'playing';

export interface TimelineEvent {
  game: GameRecord;
  kind: TimelineKind;
  dateLabel: string;
  datetime: string;
  fullDate: string;
  year: string;
  shortDate: string;
  isYearStart: boolean;
  isSameDay: boolean;
  ariaLabel: string;
}

export interface TimelineRow {
  items: TimelineEvent[];
  reverse: boolean;
  isFirst: boolean;
  isLast: boolean;
  startsWithPlaying: boolean;
  endsWithPlaying: boolean;
}

export interface GameView {
  timeline: TimelineEvent[];
  undated: GameRecord[];
  timelineTotal: number;
  completedCount: number;
  abandonedCount: number;
  playingCount: number;
  yearRange: string;
}

export const EMPTY_GAME_VIEW: GameView = {
  timeline: [],
  undated: [],
  timelineTotal: 0,
  completedCount: 0,
  abandonedCount: 0,
  playingCount: 0,
  yearRange: '',
};

function dateValue(value: string | Date | null | undefined): number {
  if (!value) {
    return 0;
  }
  const time =
    value instanceof Date
      ? value.getTime()
      : new Date(String(value)).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeGame(game: GameRecord): GameRecord {
  return {
    ...game,
    playStatus: game.playStatus ?? 'completed',
    recommend: normalizeRecommend(game.recommend),
  };
}

function sortByDateDesc(a: GameRecord, b: GameRecord): number {
  const dateDiff = dateValue(b.statusDate) - dateValue(a.statusDate);
  return dateDiff !== 0 ? dateDiff : (b.id ?? 0) - (a.id ?? 0);
}

export function buildGameView(games: GameRecord[]): GameView {
  const normalized = (games ?? []).map(normalizeGame);

  const playing = normalized
    .filter((game) => isCurrentStatus(game.playStatus))
    .sort((a, b) => {
      const rank = (status: GamePlayStatus | undefined): number =>
        status === 'playing' ? 0 : 1;
      const statusDiff = rank(a.playStatus) - rank(b.playStatus);
      return statusDiff !== 0 ? statusDiff : (b.id ?? 0) - (a.id ?? 0);
    });

  const dated = normalized
    .filter((game) => hasStatusDate(game.playStatus) && !!game.statusDate)
    .sort(sortByDateDesc);

  const undated = normalized
    .filter(
      (game) => !isCurrentStatus(game.playStatus) && !game.statusDate,
    )
    .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));

  let lastYear = '';
  let lastDate = '';

  const datedEvents = dated.map<TimelineEvent>((game) => {
    const fullDate = formatGameDate(game.statusDate);
    const year = fullDate.slice(0, 4);
    const isYearStart = year !== lastYear;
    const isSameDay = fullDate !== '' && fullDate === lastDate;
    const kind: TimelineKind =
      game.playStatus === 'abandoned' ? 'abandoned' : 'completed';

    const event: TimelineEvent = {
      game,
      kind,
      dateLabel: isYearStart ? fullDate : formatGameDateShort(game.statusDate),
      datetime: fullDate.replaceAll('.', '-'),
      fullDate,
      year,
      shortDate: formatGameDateShort(game.statusDate),
      isYearStart,
      isSameDay,
      ariaLabel: `《${game.name}》，${formatGameDateAria(game.statusDate)}${
        kind === 'abandoned' ? '弃坑' : '通关'
      }`,
    };

    lastYear = year;
    lastDate = fullDate;
    return event;
  });

  const playingEvents = playing.map<TimelineEvent>((game) => {
    const statusText = playStatusText(game.playStatus);
    return {
      game,
      kind: 'playing',
      dateLabel: statusText,
      datetime: '',
      fullDate: '',
      year: '',
      shortDate: '',
      isYearStart: false,
      isSameDay: false,
      ariaLabel: `《${game.name}》，${statusText}`,
    };
  });

  const timeline = [...playingEvents, ...datedEvents];

  const completedCount = datedEvents.filter(
    (event) => event.kind === 'completed',
  ).length;
  const abandonedCount = datedEvents.filter(
    (event) => event.kind === 'abandoned',
  ).length;
  const playingCount = playingEvents.length;

  const firstYear = datedEvents.length
    ? datedEvents[0].fullDate.slice(0, 4)
    : '';
  const lastYearOfTimeline = datedEvents.length
    ? datedEvents[datedEvents.length - 1].fullDate.slice(0, 4)
    : '';
  const yearRange =
    firstYear && lastYearOfTimeline
      ? firstYear === lastYearOfTimeline
        ? firstYear
        : `${lastYearOfTimeline}—${firstYear}`
      : '';

  return {
    timeline,
    undated,
    timelineTotal: timeline.length,
    completedCount,
    abandonedCount,
    playingCount,
    yearRange,
  };
}

export function chunkTimelineRows(
  events: TimelineEvent[],
  columns: number,
): TimelineRow[] {
  const size = Math.max(1, Math.floor(columns) || 1);
  const rows: TimelineEvent[][] = [];

  for (let index = 0; index < events.length; index += size) {
    rows.push(events.slice(index, index + size));
  }

  return rows.map((items, index) => ({
    items,
    reverse: index % 2 === 1,
    isFirst: index === 0,
    isLast: index === rows.length - 1,
    startsWithPlaying: items[0]?.kind === 'playing',
    endsWithPlaying: items[items.length - 1]?.kind === 'playing',
  }));
}
