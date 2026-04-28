import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import {
  CaptchaPayload,
  CaptchaScene,
  CaptchaService,
} from '../../../services/captcha.service';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { FlInputDirective } from '../../../common_ui/fl_ui/fl-input/fl-input.directive';

@Component({
  selector: 'flower-simple-captcha',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFlexModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzTypographyModule,
    FlButtonComponent,
    FlInputDirective,
  ],
  templateUrl: './simple-captcha.component.html',
  styleUrl: './simple-captcha.component.css',
})
export class SimpleCaptchaComponent implements OnChanges {
  @Input({ required: true }) scene: CaptchaScene = 'message';
  @Input() disabled = false;

  answer = '';
  captchaId = '';
  question = '';
  loading = false;
  loadErrorMessage = '';

  constructor(private readonly captchaService: CaptchaService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scene']) {
      this.refresh();
    }
  }

  get isReady(): boolean {
    return !this.loading && !!this.captchaId && !!this.question;
  }

  buildPayload(): { captchaAnswer: string; captchaId: string } | null {
    const captchaId = this.captchaId.trim();
    const captchaAnswer = this.answer.trim();

    if (!captchaId || !captchaAnswer) {
      return null;
    }

    return {
      captchaId,
      captchaAnswer,
    };
  }

  clearAnswer(): void {
    this.answer = '';
  }

  refresh(): void {
    this.loading = true;
    this.loadErrorMessage = '';
    this.answer = '';
    this.captchaId = '';
    this.question = '';

    this.captchaService.getCaptcha(this.scene).subscribe({
      next: (res: any) => {
        const payload: CaptchaPayload | undefined = res?.data ?? res;
        this.captchaId = payload?.captchaId ?? '';
        this.question = payload?.question ?? '';
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadErrorMessage = 'Failed to load captcha, please retry';
      },
    });
  }
}
