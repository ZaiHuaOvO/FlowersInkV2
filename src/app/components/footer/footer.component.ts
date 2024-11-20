import { Component, OnInit } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: true,
  imports: [
    NzFlexModule,
    NzDividerModule,
    NzIconModule,
    NzAvatarModule,
    NzTypographyModule,
  ],
})
export class FooterComponent implements OnInit {
  email = 'ZyZy1724@gmail.com';
  constructor() {}

  ngOnInit() {}
}
