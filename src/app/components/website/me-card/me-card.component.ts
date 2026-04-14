
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { RssComponent } from '../svg/rss/rss.component';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlTagDirective } from '../../../common_ui/fl_ui/fl-tag/fl-tag.directive';

@Component({
  selector: 'flower-me-card',
  templateUrl: './me-card.component.html',
  styleUrls: ['./me-card.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    NzFlexModule,
    NzAvatarModule,
    NzTypographyModule,
    NzDividerModule,
    NzIconModule,
    NzTagModule,
    FlButtonComponent,
    FlTagDirective,
  ],
})
export class MeCardComponent implements OnInit {
  @Input() info = {
    article: 0,
    essay: 0,
    question: 0,
    day: 0,
    lastUpdateTime: '',
  };
  @Input() numLoading = true;
  constructor() {}

  ngOnInit() {}
}
