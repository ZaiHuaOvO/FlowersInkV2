import {
  Component,
  DestroyRef,
} from '@angular/core';
import { animate, group, query, stagger, style, transition, trigger } from '@angular/animations';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { RouterModule } from '@angular/router';
import { TargetComponent } from '../../../components/about/target/target.component';
import { FlCardDirective } from '../../../common_ui/fl_ui/fl-card/fl-card.directive';
import { QuickUp } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';

/* Direction-aware slide-in animation for section switching */
const SectionSwitch = trigger('SectionSwitch', [
  transition(':increment', [
    style({ opacity: 0, transform: 'translateX(28px)' }),
    animate(
      '280ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
  transition(':decrement', [
    style({ opacity: 0, transform: 'translateX(-28px)' }),
    animate(
      '280ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(16px)' }),
    animate(
      '260ms cubic-bezier(0.22, 1, 0.36, 1)',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

/* Staggered hero animation: image from left, text from right */
const HeroEnter = trigger('HeroEnter', [
  transition(':enter', [
    style({}),
    query('.hero-image-col', [
      style({ opacity: 0, transform: 'translateX(-32px)' }),
      animate(
        '300ms 60ms cubic-bezier(0.22, 1, 0.36, 1)',
        style({ opacity: 1, transform: 'translateX(0)' })
      ),
    ], { optional: true }),
    query('.hero-text-col', [
      style({ opacity: 0, transform: 'translateX(32px)' }),
      animate(
        '300ms 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        style({ opacity: 1, transform: 'translateX(0)' })
      ),
    ], { optional: true }),
  ]),
]);

@Component({
  selector: 'flower-me',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    NzTypographyModule,
    NzIconModule,
    NzDividerModule,
    NzPopoverModule,
    RouterModule,
    TargetComponent,
    FlCardDirective,
    NzTagModule,
  ],
  templateUrl: './me.component.html',
  styleUrl: './me.component.css',
  animations: [QuickUp, SectionSwitch, HeroEnter],
  host: { '[@QuickUp]': '' },
})
export class MeComponent {
  activeSection = 0;
  activeHobby = 0;
  isMobile = false;
  email = 'ZyZy1724@gmail.com';
  qq = '446840401';
  wechat = 'zaihua_huahua';

  tabs = [
    { index: 0, label: '是再花！' },
    { index: 1, label: '我的爱好' },
    { index: 2, label: '社交渠道' },
  ];

  constructor(
    private window: WindowService,
    private readonly destroyRef: DestroyRef,
    private msg: NzMessageService,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  goToSection(index: number): void {
    if (index < 0 || index > 2) return;
    this.activeSection = index;
  }

  setHobby(index: number): void {
    this.activeHobby = index;
  }

  copyEmail(): void {
    navigator.clipboard.writeText(this.email).then(() => {
      this.msg.success('已复制邮箱地址，欢迎邮件(^-^)');
    }).catch(() => { });
  }

  copyQQ(): void {
    navigator.clipboard.writeText(this.qq).then(() => {
      this.msg.success('已复制QQ号，加好友请备注来意(^-^)');
    }).catch(() => { });
  }

  copyWechat(): void {
    navigator.clipboard.writeText(this.wechat).then(() => {
      this.msg.success('已复制微信号，加好友请备注来意(^-^)');
    }).catch(() => { });
  }
}
