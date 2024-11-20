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
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css',
})
export class MessageComponent {
  data: any[] = [];
  loading = true;
  constructor(private about: AboutService) {
    this.getMessage();
  }

  getMessage(): void {
    this.loading = true;
    this.about.getMessageList().subscribe((res: any) => {
      this.data = res['data'].data;
      setTimeout(() => {
        this.loading = false;
      }, 1000);
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
