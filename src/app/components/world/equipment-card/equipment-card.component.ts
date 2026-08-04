import { Component, Input } from '@angular/core';
import { DatePipe, NgStyle } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

@Component({
  selector: 'flower-equipment-card',
  standalone: true,
  imports: [
    DatePipe,
    NgStyle,
    NzCardModule,
    NzFlexModule,
    NzTagModule,
    NzTypographyModule,
    FlTagDirective,
  ],
  templateUrl: './equipment-card.component.html',
  styleUrl: './equipment-card.component.css',
})
export class EquipmentCardComponent {
  @Input() item: any;

  /** 服役天数：退役 = 退役时间 - 购买时间；服役中 = 现在 - 购买时间 */
  get serviceDays(): number {
    if (!this.item?.purchaseDate) {
      return 0;
    }
    const purchaseTs = new Date(this.item.purchaseDate).getTime();
    if (Number.isNaN(purchaseTs)) {
      return 0;
    }
    const endTs = this.item.retired && this.item.retireDate
      ? new Date(this.item.retireDate).getTime()
      : Date.now();
    if (Number.isNaN(endTs)) {
      return 0;
    }
    return Math.max(0, Math.floor((endTs - purchaseTs) / 86400000));
  }
}
