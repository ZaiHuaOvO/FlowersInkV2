import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

/**
 * 筛选条图标的图形原语。几何由 API 统一下发
 * （`flower-ink-api/src/blog/tag-filter-icons.ts`），后台的图标选择器读的是同一份 ——
 * 所以「后台选出来的样子 = 主站的样子」是天然成立的。
 *
 * 字段全可选而不是可辨识联合：模板里要直接读 `s.d` / `s.cx`，
 * 联合类型会让模板报「该属性不存在于这个分支」。
 */
export interface TagFilterIconShape {
  t: 'path' | 'circle' | 'rect';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
}

export interface TagFilterIcon {
  /** 标签 `filterIcon` 字段存的就是它 */
  key: string;
  /** 后台下拉里显示的中文名 */
  label: string;
  shapes: TagFilterIconShape[];
}

export interface TagFilterItem {
  tag: string;
  count: number;
  /** 该标签在筛选条上的图标 key；空则用默认「标签」图形 */
  icon?: string;
}

/** 标签没配图标时的兜底图形 key，与 API 的 tag-filter-icons.ts 保持一致 */
const DEFAULT_ICON_KEY = 'tag';

/**
 * 目录取不到时的兜底图形（就是默认的「标签」）。
 *
 * 正常情况下用不上：图标目录是接口下发的静态常量，几乎不会拿不到。
 * 留着是为了让「接口没通」降级成「所有标签都显示默认图形」，
 * 而不是「筛选条上一排空白」—— 后者看起来像页面坏了。
 */
const FALLBACK_SHAPES: TagFilterIconShape[] = [
  {
    t: 'path',
    d: 'M20.6 13.4 11 3.8a2 2 0 0 0-1.4-.6H4a1 1 0 0 0-1 1v5.6a2 2 0 0 0 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.8z',
  },
  { t: 'circle', cx: 7.5, cy: 7.5, r: 1.5 },
];

@Component({
  selector: 'fl-tag-filter',
  standalone: true,
  templateUrl: './fl-tag-filter.component.html',
  styleUrl: './fl-tag-filter.component.css',
  host: {
    '[class.tag-filter--chips]': "layout === 'chips'",
  },
})
export class FlTagFilterComponent implements AfterViewChecked {
  /** 各标签及其数量（不含「全部」） */
  @Input() items: TagFilterItem[] = [];
  /** 可选图标目录（来自 API）；空则全部回落到默认「标签」图形 */
  @Input() tagIcons: TagFilterIcon[] = [];
  /** 当前选中标签，空串表示全部 */
  @Input() selected = '';
  /** list = 侧栏竖排（默认）；chips = 移动端横向滚动条 */
  @Input() layout: 'list' | 'chips' = 'list';
  @Output() select = new EventEmitter<string>();

  /** chips 形态下已把哪个选中项滚进可视区，避免每轮变更检测重复滚动 */
  private scrolledSelection: string | null = null;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  /**
   * chips 是横向滚动的：深链或前进后退切到的标签可能在可视区外，
   * 只有选中状态本身不会告诉用户「当前筛的是哪个」。这里把它滚回中间。
   */
  ngAfterViewChecked(): void {
    if (this.layout !== 'chips' || this.selected === this.scrolledSelection) {
      return;
    }
    const active = this.host.nativeElement.querySelector<HTMLElement>(
      '.tag-filter-button.active',
    );
    // 数据还没到时没有选中按钮，等下一次检测，不能提前记为已滚
    if (!active) {
      return;
    }
    this.scrolledSelection = this.selected;
    active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  get totalCount(): number {
    return this.items.reduce((sum, item) => sum + item.count, 0);
  }

  renderItems(): TagFilterItem[] {
    return [{ tag: '全部', count: this.totalCount }, ...this.items];
  }

  isActive(tag: string): boolean {
    return tag === '全部' ? this.selected === '' : this.selected === tag;
  }

  onSelect(tag: string): void {
    this.select.emit(tag === '全部' ? '' : tag);
  }

  /** 某个标签要画的图形；没配、配了目录里没有的 key、目录没拿到，都回落到默认「标签」 */
  shapesFor(tagItem: TagFilterItem): TagFilterIconShape[] {
    const found =
      this.tagIcons.find((icon) => icon.key === tagItem.icon) ??
      this.tagIcons.find((icon) => icon.key === DEFAULT_ICON_KEY);
    return found?.shapes ?? FALLBACK_SHAPES;
  }
}
