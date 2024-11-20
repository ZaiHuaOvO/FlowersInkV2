import { Component } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/target/target.component';
import { NzCommentModule } from 'ng-zorro-antd/comment';
import { NzListModule } from 'ng-zorro-antd/list';
import { AboutService } from '../about.service';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { CommonModule, DatePipe } from '@angular/common';
import { EditMessageComponent } from '../../../components/edit-message/edit-message.component';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';

@Component({
  selector: 'flower-message',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzTypographyModule,
    NzIconModule,
    TargetComponent,
    NzCommentModule,
    NzListModule,
    NzAvatarModule,
    EditMessageComponent,
    NzDividerModule,
    NzSpinModule,
    DatePipe,
    NzPaginationModule,
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css',
})
export class MessageComponent {
  data: any[] = [];
  loading = true;
  page = 1;
  count = 0;
  constructor(private about: AboutService) {
    this.getMessage();
  }

  getMessage(): void {
    this.loading = true;
    this.about
      .getMessageList({
        isApproved: true,
        pageSize: 30,
        page: this.page,
      })
      .subscribe((res: any) => {
        this.data = res['data'].data;
        this.count = res['data'].count;
        setTimeout(() => {
          this.loading = false;
        }, 500);
      });
  }

  navigateToUrl(url: string): void {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://${url}`;
    }
    window.open(url, '_blank');
  }

  imageUrl(url: string): string {
    let imageUrl: string = '';
    if (url == '') {
      imageUrl = 'https://api.flowersink.com/uploads/猫娘.jpg';
    } else {
      imageUrl = url;
    }
    return imageUrl; // 设置为有效的图片地址
  }
}
