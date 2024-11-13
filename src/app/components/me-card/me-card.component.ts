import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-me-card',
  templateUrl: './me-card.component.html',
  styleUrls: ['./me-card.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzAvatarModule,
    NzTypographyModule,
    NzDividerModule,
    NzIconModule,
  ],
})
export class MeCardComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
