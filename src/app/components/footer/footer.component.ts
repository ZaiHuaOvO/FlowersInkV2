import { Component, OnInit } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
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
    NzPopoverModule,
  ],
})
export class FooterComponent implements OnInit {
  email = 'ZyZy1724@gmail.com';
  constructor(private msg: NzMessageService) {}

  ngOnInit() {}

  copyEmail(): void {
    navigator.clipboard
      .writeText(this.email)
      .then(() => {
        this.msg.success('已复制邮箱地址，欢迎邮件(๑＞ڡ＜)☆');
      })
      .catch((error) => {});
  }
}
