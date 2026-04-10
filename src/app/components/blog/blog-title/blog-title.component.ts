import { Component, Input, OnInit } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-blog-title',
  templateUrl: './blog-title.component.html',
  styleUrls: ['./blog-title.component.css'],
  standalone: true,
  imports: [NzTypographyModule],
})
export class BlogTitleComponent implements OnInit {
  @Input() title: string = '';
  constructor() {}

  ngOnInit() {}
}
