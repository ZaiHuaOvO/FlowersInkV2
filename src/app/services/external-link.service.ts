import { Injectable } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  ExternalLinkConfirmComponent,
  ExternalLinkConfirmData,
} from '../components/website/external-link-confirm/external-link-confirm.component';
import { IDEA_KEY_ATTRIBUTE } from '../shared/idea/idea-anchor.util';

/**
 * 直通、不弹确认的域名：
 * - flowersink.com 及子域：本站
 * - gov.cn 及子域：备案与政府站点
 */
const TRUSTED_SUFFIXES = ['flowersink.com', 'gov.cn'];
const TRUSTED_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/**
 * 全站外链出口。
 *
 * 点击事件用捕获阶段挂在 document 上，因此 markdown 正文、评论、友链卡片、
 * 页脚等任何位置渲染出的外链都会被拦下，不需要逐个组件挂指令。
 */
@Injectable({ providedIn: 'root' })
export class ExternalLinkService {
  private installed = false;
  private modalOpen = false;

  constructor(private readonly modal: NzModalService) {}

  install(): void {
    if (this.installed || typeof document === 'undefined') {
      return;
    }
    this.installed = true;
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('auxclick', this.onAuxClick, true);
  }

  /** 程序化打开外链（window.open 等）也必须走这里 */
  open(url: string): void {
    const target = this.parse(url);
    if (!target || this.isTrusted(target)) {
      this.openInNewTab(url);
      return;
    }
    this.request(target.href);
  }

  /** 这个地址点下去会不会先弹全站外链确认（站外 http(s) 为 true） */
  needsConfirm(raw: string): boolean {
    const url = this.parse(raw);
    return url !== null && !this.isTrusted(url);
  }

  private openInNewTab(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private readonly onClick = (event: MouseEvent): void => {
    if (event.button !== 0) {
      return;
    }
    // 带想法的虚线里的链接交给想法 UI：它会先让用户在「看想法 / 打开链接」之间选，
    // 选「打开链接」时再回到这里走外链确认
    const target = event.target as Element | null;
    if (target?.closest?.(`mark[${IDEA_KEY_ATTRIBUTE}]`)) {
      return;
    }
    this.intercept(event);
  };

  /** 中键点击同样会离开页面，一并拦下 */
  private readonly onAuxClick = (event: MouseEvent): void => {
    if (event.button !== 1) {
      return;
    }
    this.intercept(event);
  };

  private intercept(event: MouseEvent): void {
    if (event.defaultPrevented) {
      return;
    }

    const target = event.target as Element | null;
    const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor || anchor.hasAttribute('download')) {
      return;
    }

    const raw = anchor.getAttribute('href') ?? '';
    if (!raw || raw.startsWith('#')) {
      return;
    }

    const url = this.parse(raw);
    if (!url || this.isTrusted(url)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.request(url.href);
  }

  private request(url: string): void {
    if (this.modalOpen) {
      return;
    }
    this.modalOpen = true;

    const ref = this.modal.create<
      ExternalLinkConfirmComponent,
      ExternalLinkConfirmData
    >({
      nzContent: ExternalLinkConfirmComponent,
      nzData: { url, host: new URL(url).hostname },
      nzFooter: null,
      nzCentered: true,
      nzWidth: 'min(460px, 92vw)',
      nzMaskClosable: true,
      nzKeyboard: true,
      // 自定义底部按钮，交给内容组件等弹窗动画开始后自己聚焦
      nzAutofocus: null,
    });

    ref.afterClose.subscribe(() => {
      this.modalOpen = false;
    });
  }

  private parse(raw: string): URL | null {
    try {
      const url = new URL(raw, document.baseURI);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url : null;
    } catch {
      return null;
    }
  }

  private isTrusted(url: URL): boolean {
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      typeof location !== 'undefined' &&
      host === location.hostname.toLowerCase()
    ) {
      return true;
    }
    if (TRUSTED_HOSTS.includes(host)) {
      return true;
    }
    return TRUSTED_SUFFIXES.some(
      (suffix) => host === suffix || host.endsWith(`.${suffix}`),
    );
  }
}
