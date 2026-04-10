
import { Component, Input, OnInit } from '@angular/core';
import { FlTagComponent } from '../../../fl-ui/fl-tag/fl-tag.component';
import { FlDividerComponent } from '../../../fl-ui/fl-divider/fl-divider.component';
import { FlAvatarComponent } from '../../../fl-ui/fl-avatar/fl-avatar.component';
import { RouterModule } from '@angular/router';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-me-card',
  templateUrl: './me-card.component.html',
  styleUrls: ['./me-card.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    FlAvatarComponent,
    NzTypographyModule,
    FlDividerComponent,
    NzIconModule,
    FlTagComponent
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
