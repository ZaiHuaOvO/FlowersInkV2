import { CommonModule, DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-blog-card',
  templateUrl: './blog-card.component.html',
  styleUrls: ['./blog-card.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzDividerModule,
    NzTypographyModule,
    DatePipe,
  ],
})
export class BlogCardComponent implements OnInit {
  @Input() blog: any;
  constructor() {}

  ngOnInit() {}
}
