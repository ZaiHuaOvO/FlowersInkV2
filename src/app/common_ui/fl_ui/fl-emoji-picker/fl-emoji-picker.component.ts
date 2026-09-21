import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { EMOJI_PACKS, buildEmojiToken, findEmojiItem, type EmojiPack } from '../../../ts/emoji-packs';

/** 记住上次用过的分页，下次打开直接停在那里 */
const PACK_STORAGE_KEY = 'fl_emoji_active_pack';
/** 最近使用过的表情（只记图片包，颜文字是纯文本不入历史） */
const HISTORY_STORAGE_KEY = 'fl_emoji_history';
/** 历史最多记这么多条（一行 10 个 × 6 行）；满了再选新的，就从最旧的开始丢 */
const HISTORY_MAX = 60;
/** 历史分页的固定 key；它不在 EMOJI_PACKS 里，是单独渲染的一页 */
const HISTORY_KEY = 'history';

interface HistoryEntry {
  packKey: string;
  name: string;
}

/** 还原后的历史项：带上图片地址，可直接渲染 */
interface HistoryItem extends HistoryEntry {
  url: string;
}

function readSavedPackKey(): string | null {
  try {
    return localStorage.getItem(PACK_STORAGE_KEY);
  } catch {
    // 隐私模式 / 存储被禁用：记不住就算了，回落到第一个分页
    return null;
  }
}

function savePackKey(key: string): void {
  try {
    localStorage.setItem(PACK_STORAGE_KEY, key);
  } catch {
    /* 同上，静默失败 */
  }
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // 逐项校验形状：缓存是外部数据，可能被改坏或来自旧版本
    return parsed
      .filter(
        (e): e is HistoryEntry =>
          !!e &&
          typeof (e as HistoryEntry).packKey === 'string' &&
          typeof (e as HistoryEntry).name === 'string',
      )
      .map((e) => ({ packKey: e.packKey, name: e.name }));
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* 静默失败 */
  }
}

/** 初始分页：缓存里记的是「包」，要映射到它所属的分页；没有或已失效就用第一个 */
function resolveInitialTabKey(): string {
  const fallback = EMOJI_PACKS[0] ? packTabKey(EMOJI_PACKS[0]) : '';
  const saved = readSavedPackKey();
  if (!saved) {
    return fallback;
  }
  const pack = EMOJI_PACKS.find((p) => p.key === saved);
  return pack ? packTabKey(pack) : fallback;
}

/** 一个分页：由一到多个包组成，页内按包在配置里的先后顺序排列 */
interface EmojiTab {
  key: string;
  /** 分页顶部显示的名字，取该页第一个包的 label */
  label: string;
  packs: EmojiPack[];
}

/** 包属于哪个分页：图片包读配置里的 tab，颜文字包自成一页 */
function packTabKey(pack: EmojiPack): string {
  return pack.type === 'image' ? pack.tab : pack.key;
}

/**
 * 按 tab 归组。配置里 tab 写同一个值的多个包并到同一页，
 * 页内保持 packs 的先后顺序，两者之间在模板里插一条分割线；
 * 分页顺序取各 tab 首次出现的顺序。
 */
function buildTabs(packs: readonly EmojiPack[]): EmojiTab[] {
  const tabs: EmojiTab[] = [];
  for (const pack of packs) {
    const key = packTabKey(pack);
    const existing = tabs.find((t) => t.key === key);
    if (existing) {
      existing.packs.push(pack);
    } else {
      tabs.push({ key, label: pack.label, packs: [pack] });
    }
  }
  return tabs;
}

/**
 * 表情选择器。
 *
 * 分页来自 EMOJI_PACKS（再花 / 方长 / 颜文字），要加新表情包只需把图片目录丢进
 * src/assets、在 scripts/emoji.config.json 里加一项、重跑 npm run emoji:manifest，
 * 本组件不需要改。
 *
 * 输出约定：
 * - 图片包 → 发 token `[包名:名字]`，由渲染器换成行内图片
 * - 文字包 → 直接发原文本
 *
 * 名字提示是**手写**的，没用 nz-tooltip：ng-zorro 的延迟取值是
 * `this.mouseEnterDelay || 0.15`，传 0 会被当成假值退回默认的 150ms，
 * 做不到「0 延迟」；而且它还有 overlay 淡入动画。这里直接用 CSS 显示/隐藏，
 * 移入移出都是当帧生效。
 */
@Component({
  selector: 'fl-emoji-picker',
  standalone: true,
  imports: [NzIconModule, NzPopoverModule],
  templateUrl: './fl-emoji-picker.component.html',
  styleUrl: './fl-emoji-picker.component.css',
})
export class FlEmojiPickerComponent {
  @Output() emojiSelected = new EventEmitter<string>();

  /**
   * 弹出方向。默认 topLeft：评论框在页面下方，弹窗自然向上展开（箭头落在底边），
   * 用 *Left 变体让弹窗左边缘与表情按钮对齐、箭头靠左，而不是默认的居中定位。
   */
  @Input() placement: 'top' | 'bottom' | 'topLeft' | 'bottomLeft' = 'topLeft';

  visible = false;

  /** 分页列表：由 EMOJI_PACKS 按 tab 归组得到（同一 tab 的多个包并成一页） */
  readonly tabs = buildTabs(EMOJI_PACKS);

  /** 历史分页的 key，模板里用它判断当前是否停在历史页 */
  readonly historyKey = HISTORY_KEY;

  activeTabKey: string = resolveInitialTabKey();

  /** 最近使用过的表情（只记图片包）。顺序为「从新到旧」 */
  private history: HistoryEntry[] = readHistory();

  /** 历史页要渲染的项：已还原成清单条目，失效的（被改名/删除）自动剔除 */
  historyItems: HistoryItem[] = [];

  /** 当前悬停的表情名；空串表示不显示提示 */
  hoveredName = '';
  /** 提示相对 .fe-popover 的位置（格子顶边中点） */
  hoveredLeft = 0;
  hoveredTop = 0;

  constructor() {
    this.rebuildHistoryItems();
  }

  /** 当前分页下的所有包（可能不止一个，模板里按顺序渲染并在包之间插分割线） */
  get activePacks(): EmojiPack[] {
    return this.tabs.find((tab) => tab.key === this.activeTabKey)?.packs ?? [];
  }

  selectImage(packKey: string, name: string): void {
    // 用过的分页记下来，下次打开停在这里。历史页里点选时传的是**来源包**，
    // 所以记住的始终是真实分页，不会出现「记住 history 但这个页是空的」
    savePackKey(packKey);
    this.recordHistory(packKey, name);
    this.closeAfterSelect();
    this.emojiSelected.emit(buildEmojiToken(packKey, name));
  }

  selectText(text: string): void {
    // 颜文字不入历史（需求只要求记再花 / 方长），但同样选完即关
    this.closeAfterSelect();
    this.emojiSelected.emit(text);
  }

  /** 选中之后收起弹窗，并把名字提示清掉 */
  private closeAfterSelect(): void {
    this.visible = false;
    this.hoveredName = '';
  }

  /**
   * 记录一次使用。同一条已在列表里就先摘掉再插到最前 —— 即「移动置顶」，
   * 所以重复使用某个表情只会把它提到开头，不会出现重复项。
   */
  private recordHistory(packKey: string, name: string): void {
    const rest = this.history.filter(
      (e) => !(e.packKey === packKey && e.name === name),
    );
    this.history = [{ packKey, name }, ...rest].slice(0, HISTORY_MAX);
    writeHistory(this.history);
    this.rebuildHistoryItems();
  }

  /** 把缓存的「包名 + 名字」还原成可渲染的条目，查不到的丢掉 */
  private rebuildHistoryItems(): void {
    this.historyItems = this.history.reduce<HistoryItem[]>((acc, e) => {
      const item = findEmojiItem(e.packKey, e.name);
      if (item) {
        acc.push({ packKey: e.packKey, name: item.name, url: item.url });
      }
      return acc;
    }, []);
  }

  /** 切分页时把提示清掉，否则会残留上一个包的名字 */
  selectTab(key: string): void {
    this.activeTabKey = key;
    this.clearName();
  }

  /** 悬停到某个表情：记录名字与位置。位置在移入那一刻算，够准且省一次监听 */
  showName(event: MouseEvent, name: string): void {
    const cell = event.currentTarget as HTMLElement;
    const popover = cell.closest('.fe-popover') as HTMLElement | null;
    if (!popover) {
      return;
    }
    const cellRect = cell.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    this.hoveredName = name;
    this.hoveredLeft = cellRect.left - popRect.left + cellRect.width / 2;
    this.hoveredTop = cellRect.top - popRect.top;
  }

  /** 离开整个表情区才清空：在格子之间移动时只换名字，不闪 */
  clearName(): void {
    this.hoveredName = '';
  }
}
