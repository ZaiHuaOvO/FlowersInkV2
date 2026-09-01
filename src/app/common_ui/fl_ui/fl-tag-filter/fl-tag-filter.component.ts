import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TagFilterItem {
  tag: string;
  count: number;
}

@Component({
  selector: 'fl-tag-filter',
  standalone: true,
  templateUrl: './fl-tag-filter.component.html',
  styleUrl: './fl-tag-filter.component.css',
})
export class FlTagFilterComponent {
  /** 各标签及其数量（不含「全部」） */
  @Input() items: TagFilterItem[] = [];
  /** 当前选中标签，空串表示全部 */
  @Input() selected = '';
  @Output() select = new EventEmitter<string>();

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
}
