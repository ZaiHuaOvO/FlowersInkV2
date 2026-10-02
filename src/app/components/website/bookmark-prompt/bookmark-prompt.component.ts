import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

/** 浏览多久后弹出「加入书签」轻提示（毫秒） */
const PROMPT_DELAY_MS = 60 * 1000;
/** 「不再提醒 / 已引导过」的本地缓存键 */
const DISMISSED_KEY = 'fi_bookmark_prompt_dismissed';

@Component({
  selector: 'flower-bookmark-prompt',
  standalone: true,
  templateUrl: './bookmark-prompt.component.html',
  styleUrl: './bookmark-prompt.component.css',
  animations: [
    trigger('promptAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate(
          '240ms cubic-bezier(0.22, 1, 0.36, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }),
        ),
      ]),
      transition(':leave', [
        animate(
          '180ms ease-in',
          style({ opacity: 0, transform: 'translateY(8px)' }),
        ),
      ]),
    ]),
  ],
})
export class BookmarkPromptComponent implements OnInit {
  visible = false;
  showSteps = false;
  steps = '';

  private dismissed = false;

  ngOnInit(): void {
    if (this.isDismissed()) return;
    setTimeout(() => {
      if (!this.dismissed) {
        this.visible = true;
      }
    }, PROMPT_DELAY_MS);
  }

  private isDismissed(): boolean {
    try {
      return localStorage.getItem(DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }

  private rememberDismissed(): void {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // 存储不可用时忽略，只是下次还会提醒而已
    }
  }

  onBookmarkClick(): void {
    // 用户点了「加入书签」即视为已引导，下次不再弹
    this.dismissed = true;
    this.rememberDismissed();
    this.steps = this.detectSteps();
    this.showSteps = true;
  }

  onDismissForever(): void {
    this.dismissed = true;
    this.rememberDismissed();
    this.hide();
  }

  onClose(): void {
    this.dismissed = true;
    this.hide();
  }

  onGotIt(): void {
    this.dismissed = true;
    this.hide();
  }

  private hide(): void {
    this.visible = false;
    this.showSteps = false;
  }

  private detectSteps(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/i.test(ua)) {
      return '点网址左侧「三条横线」→「共享」→「查看更多」→「添加到主屏幕」';
    }
    if (/Android/i.test(ua)) {
      return '点浏览器右上角「⋮」→「添加到主屏幕」或「添加书签」';
    }
    return /Macintosh|Mac OS X/i.test(ua)
      ? '按 ⌘+D 即可把花墨加入书签'
      : '按 Ctrl+D 即可把花墨加入书签';
  }
}
