import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { AboutService } from '../../pages/about/about.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { GeneralService } from '../../services/general.service';
import { ApiLimiterService } from '../../services/api-limiter.service';
import { MessageComponent } from '../../pages/about/message/message.component';

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
  ],
  templateUrl: './edit-message.component.html',
  styleUrl: './edit-message.component.css',
})
export class EditMessageComponent {
  form = {
    name: null,
    avatar: '',
    url: '',
    content: null,
  };
  loading = false;
  isName: any;
  isContent = '';

  constructor(
    private about: AboutService,
    private msg: NzMessageService,
    private general: GeneralService,
    private limiter: ApiLimiterService,
    private messageList: MessageComponent
  ) {}
  submit(): void {
    this.loading = true;

    if (this.general.isNotEmpty(this.form.name)) {
      if (this.general.isNotEmpty(this.form.content)) {
        const message = this.limiter.canCallApi();
        if (message) {
          this.msg.info(`留言有一分钟冷却，请等待${message}再尝试`); // 提示用户剩余时间
          this.loading = false;
          return;
        } else {
          this.about.addMessage(this.form).subscribe((res: any) => {
            if (res) {
              this.form = {
                name: null,
                avatar: '',
                url: '',
                content: null,
              };
              this.msg.success(res['msg'] + '请耐心等待再花审核');
              this.messageList.getMessage();
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
}