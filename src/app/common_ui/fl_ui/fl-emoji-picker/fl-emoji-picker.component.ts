import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { EMOJI_PACKS, buildEmojiToken, type EmojiPack } from '../../../ts/emoji-packs';

/** 记住上次用过的分页，下次打开直接停在那里 */
const PACK_STORAGE_KEY = 'fl_emoji_active_pack';

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

/** 初始分页：缓存里有、且这个分页仍然存在，就用它；否则用第一个（再花） */
function resolveInitialPackKey(): string {
  const fallback = EMOJI_PACKS[0]?.key ?? '';
  const saved = readSavedPackKey();
  return saved && EMOJI_PACKS.some((pack) => pack.key === saved) ? saved : fallback;
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

  readonly packs = EMOJI_PACKS;
  activeKey: string = resolveInitialPackKey();

  /** 当前悬停的表情名；空串表示不显示提示 */
  hoveredName = '';
  /** 提示相对 .fe-popover 的位置（格子顶边中点） */
  hoveredLeft = 0;
  hoveredTop = 0;

  get activePack(): EmojiPack | undefined {
    return this.packs.find((pack) => pack.key === this.activeKey);
  }

  selectImage(packKey: string, name: string): void {
    // 用过的分页记下来，下次打开停在这里
    savePackKey(packKey);
    this.emojiSelected.emit(buildEmojiToken(packKey, name));
  }

  selectText(text: string): void {
    this.emojiSelected.emit(text);
  }

  /** 切分页时把提示清掉，否则会残留上一个包的名字 */
  selectTab(key: string): void {
    this.activeKey = key;
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
