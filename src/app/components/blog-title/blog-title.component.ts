import { Component, Input, OnInit } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-blog-title',
  templateUrl: './blog-title.component.html',
  styleUrls: ['./blog-title.component.css'],
  standalone: true,
  imports: [NzFlexModule, NzTypographyModule, NzDividerModule],
})
export class BlogTitleComponent implements OnInit {
  @Input() title: string = '';
  constructor() {}

  ngOnInit() {}
}
