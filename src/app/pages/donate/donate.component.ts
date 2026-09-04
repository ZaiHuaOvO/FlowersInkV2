import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { QuickUp } from '../../common_ui/animations/animation';
import { WindowService } from '../../services/window.service';

const AVATAR_SRC = 'https://api.flowersink.com/img/粉毛猫猫头.jpeg';
const QR_ALIPAY_SRC =
  'https://api.flowersink.com/uploads/misc/webp-4fafd01ce00883de323bb08b0455628e-1788506322535-084ae6.webp';
const QR_WECHAT_SRC =
  'https://api.flowersink.com/uploads/misc/webp-7ef2ecec144d766b6cefe5fb6f75bd79-1788506328417-63709f.webp';
const COFFEE_IMG_SRC =
  'https://api.flowersink.com/uploads/misc/webp-8ab473d89ad5ae95ed171aa14239dd8c-1788507465565-92fcbb.webp';

interface NavItem {
  id: string;
  label: string;
}

interface DonationRecord {
  amount: string;
  message: string;
  name: string;
  url?: string;
  usage: string;
  img?: string;
}

@Component({
  selector: 'flower-donate',
  standalone: true,
  imports: [NzImageModule],
  templateUrl: './donate.component.html',
  styleUrl: './donate.component.css',
  animations: [QuickUp],
})
export class DonateComponent implements AfterViewInit, OnDestroy {
  readonly avatarSrc = AVATAR_SRC;
  readonly qrAlipaySrc = QR_ALIPAY_SRC;
  readonly qrWechatSrc = QR_WECHAT_SRC;
  readonly coffeeImgSrc = COFFEE_IMG_SRC;

  navItems: NavItem[] = [
    { id: 'hero', label: '关于赞赏' },
    { id: 'use', label: '赞赏的使用' },
    { id: 'reward', label: '赞赏的回馈' },
    { id: 'method', label: '赞赏方式' },
    { id: 'history', label: '赞赏历史' },
  ];

  history: DonationRecord[] = [
    {
      amount: '10元',
      message: '再花好厉害',
      name: '再花一号',
      url: 'https://flowersink.com',
      usage: '购买了一杯拿铁',
      img: COFFEE_IMG_SRC,
    },
    {
      amount: '1元',
      message: '谢谢再花',
      name: '再花二号',
      usage: '',
    },
  ];

  activeSection = signal<string>('hero');
  isMobile = signal(false);
  private suppressObserver = false;
  private observer: IntersectionObserver | null = null;
  private sectionElements: Map<string, HTMLElement> = new Map();
  private readonly destroyRef = inject(DestroyRef);
  private readonly windowService = inject(WindowService);
  private readonly imageService = inject(NzImageService);

  constructor() {
    this.windowService.bindIsMobile(this.destroyRef, (mobile) => {
      this.isMobile.set(mobile);
    });
  }

  ngAfterViewInit(): void {
    this.setupScrollSpy();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupScrollSpy(): void {
    for (const item of this.navItems) {
      const el = document.getElementById(`donate-section-${item.id}`);
      if (el) this.sectionElements.set(item.id, el);
    }
    if (this.sectionElements.size === 0) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.suppressObserver) return;
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset['sectionId'];
          if (entry.isIntersecting && id) {
            this.activeSection.set(id);
            break;
          }
        }
      },
      { rootMargin: '-15% 0px -45% 0px' },
    );

    this.sectionElements.forEach((el) => this.observer!.observe(el));
  }

  scrollTo(id: string): void {
    this.activeSection.set(id);
    this.suppressObserver = true;
    setTimeout(() => {
      this.suppressObserver = false;
    }, 600);

    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const sectionEl = this.sectionElements.get(id);
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  previewImage(src: string, alt: string): void {
    this.imageService.preview([{ src, alt }]);
  }
}
