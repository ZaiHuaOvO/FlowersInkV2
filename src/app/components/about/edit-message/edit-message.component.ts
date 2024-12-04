import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { AboutService } from '../../../pages/about/about.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GeneralService } from '../../../services/general.service';
import { ApiLimiterService } from '../../../services/api-limiter.service';
import { MessageComponent } from '../../../pages/about/message/message.component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { emojiArray } from '../../../ts/emoji';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { EmojiComponent } from '../../website/emoji/emoji.component';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { WindowService } from '../../../services/window.service';

@Component({
  selector: 'flower-edit-message',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFlexModule,
    NzFormModule,
    NzGridModule,
    NzInputModule,
    NzTypographyModule,
    NzSpinModule,
    NzModalModule,
    NzIconModule,
    NzPopoverModule,
    NzPaginationModule,
    EmojiComponent,
    NzSelectModule,
  ],
  templateUrl: './edit-message.component.html',
  styleUrl: './edit-message.component.css',
})
export class EditMessageComponent {
  form = {
    name: null,
    avatar: '',
    url: '',
    content: '',
  };
  loading = false;
  isName: any;
  isContent = '';
  email = 'ZyZy1724@gmail.com';

  @ViewChild('contanctMsg', { static: true })
  contanctMsg!: TemplateRef<any>;

  @ViewChild('contanctContent', { static: true })
  contanctContent!: TemplateRef<any>;

  showToolbar = false; // 控制工具栏显示
  commentText = ''; // 存储评论文本
  isMobile: boolean = false;
  constructor(
    private about: AboutService,
    private msg: NzMessageService,
    private modal: NzModalService,
    private general: GeneralService,
    private limiter: ApiLimiterService,
    private window: WindowService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }
  submit(): void {
    this.loading = true;

    if (this.general.isNotEmpty(this.form.name)) {
      if (this.general.isNotEmpty(this.form.content)) {
        const message = this.limiter.canCallApi();
        if (message) {
          this.msg.info(`留言有一分钟冷却，请等待 ${message}秒后再尝试`); // 提示用户剩余时间
          this.loading = false;
          return;
        } else {
          this.about.addMessage(this.form).subscribe((res: any) => {
            if (res) {
              this.form = {
                name: null,
                avatar: '',
                url: '',
                content: '',
              };
              this.msg.success(this.contanctMsg, {
                nzDuration: 5000,
              });
            }
            this.loading = false;
          });
        }
      } else {
        this.msg.info('请输入留言的内容');
        this.loading = false;
      }
    } else {
      this.msg.info('请输入你的名字');
      this.loading = false;
    }
  }

  msgModal(): void {
    this.modal.create({
      nzTitle: '再花的联系方式',
      nzContent: this.contanctContent,
      nzFooter: null,
      nzMaskClosable: true,
      nzClosable: false,
    });
  }

  // 添加 emoji
  triggerEmoji(emoji: string) {
    this.commentText += emoji;
  }

  onEmojiSelected(emoji: string): void {
    this.form.content += emoji;
    console.log('Selected Emoji:', emoji);
    // 在这里可以调用其他逻辑或函数
  }
}
