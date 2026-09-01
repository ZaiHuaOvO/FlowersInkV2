import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID } from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { WindowService } from '../../../services/window.service';
import { WorldService } from '../world.service';
import { GameCardComponent } from '../../../components/world/game-card/game-card.component';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { QuickUp } from '../../../common_ui/animations/animation';
import { CommentSectionComponent } from '../../../components/website/comment-section/comment-section.component';
import { GameDetailDialogComponent } from './game-detail-dialog/game-detail-dialog.component';

type PlayStatus = 'till_now' | 'abandoned' | 'completed' | 'playing';

@Component({
  selector: 'flower-game',
  standalone: true,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzIconModule,
    NzTypographyModule,
    BlogTitleComponent,
    NzSpinModule,
    NzModalModule,
    NzAffixModule,
    NzImageModule,
    NzMenuModule,
    NzTagModule,
    NzDividerModule,
    RouterModule,
    GameCardComponent,
    NzGridModule,
    CommentSectionComponent,
  ],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  animations: [QuickUp],
})
export class GameComponent {
  data: any[] = [];
  loading = true;
  isMobile: boolean = false;
  totalGames = 0;
  totalPlayingTime = 0;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  /** 详情弹窗实例引用（用于关闭后同步路由） */
  private detailModalRef: any = null;
  /** 当前弹窗展示的游戏 id */
  private activeDetailId: number | null = null;
  /** 防止路由订阅与点击事件竞态导致重复打开 */
  private detailOpening = false;
  /** 打开详情弹窗前列表的滚动位置，关闭后恢复 */
  private savedListScrollY = 0;
  /** 仅当从列表点击打开弹窗时，关闭后才恢复滚动位置（URL 直达不恢复） */
  private restoreScrollOnClose = false;

  constructor(
    private world: WorldService,
    private modal: NzModalService,
    private window: WindowService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.window.bindIsMobile(this.destroyRef, (isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit(): void {
    this.getGame();

    // 路由绑定：/game/:id 直达时打开详情弹窗；浏览器返回 /game 时关闭弹窗。
    // 卡片点击走 openDetailDialog 直接打开，不依赖此处 emit（同 id 不会重复 emit）。
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const id = params.get('id');
        if (id && Number(id) > 0) {
          this.openDetailById(Number(id));
        } else {
          this.detailModalRef?.close();
          this.detailModalRef = null;
          this.detailOpening = false;
          this.activeDetailId = null;
        }
      });
  }

  getGame(): void {
    this.world.getGameList().subscribe((res: any) => {
      this.data = this.sortGamesByFinishDate(res['data'].games ?? []);
      this.totalGames = res['data'].totalGames;
      this.totalPlayingTime = res['data'].totalPlayingTime;
      this.loading = false;
    });
  }

  // ---- 详情弹窗 ----

  /** 点击卡片：直接打开详情弹窗，并同步路由为 /game/:id */
  openDetailDialog(game: any, event?: MouseEvent): void {
    event?.stopPropagation();
    this.savedListScrollY = window.scrollY || window.pageYOffset || 0;
    this.restoreScrollOnClose = true;
    // 必须直接打开弹窗，不能只靠路由 paramMap：关闭弹窗时仅 history.replaceState
    // 同步地址栏，Router 内部状态仍停留在 /game/:id，再次点击同一条时参数未变
    // （shallowEqual 过滤）paramMap 不会重新 emit，弹窗将无法弹出。
    // openDetailById 内部 guard 保证 paramMap 的重复 emit 不会重复打开。
    this.openDetailById(Number(game?.id));
    this.router.navigate(['/game', game?.id], { replaceUrl: true });
  }

  /** 打开详情弹窗（卡片点击与路由 paramMap 均会触发，内部 guard 防重复） */
  openDetailById(id: number): void {
    // 已打开同一条弹窗则跳过（路由订阅可能重复 emit）
    if (this.detailModalRef && this.activeDetailId === id) {
      return;
    }
    if (this.detailOpening) {
      return;
    }
    this.detailOpening = true;
    this.activeDetailId = id;

    // 优先从已加载列表数据中取；未加载则走详情接口
    const found = this.data.find((item) => Number(item?.id) === id);

    if (found) {
      this.showDetailModal(found);
    } else {
      this.world.getGameDetail(id).subscribe({
        next: (res: any) => {
          const game = res?.data ?? res;
          this.showDetailModal(game);
        },
        error: () => {
          // 详情拉取失败（如不存在），回退到 /game
          this.detailOpening = false;
          this.activeDetailId = null;
          this.router.navigate(['/game'], { replaceUrl: true });
        },
      });
    }
  }

  private showDetailModal(game: any): void {
    this.detailModalRef = this.modal.create({
      nzContent: GameDetailDialogComponent,
      nzData: game,
      nzFooter: null,
      nzWidth: 'min(720px, 92vw)',
      nzClosable: false,
      nzMaskClosable: true,
      nzWrapClassName: 'game-detail-modal-wrap',
      // 顶部对齐（初次加载显示在页面顶部），卡片完整高度由 wrap 滚动浏览
      nzStyle: { top: 0 },
      // 关闭自动聚焦：默认 nzAutofocus='auto' 会把焦点移到卡片中部按钮上，
      // 触发 wrap 自动滚动到中部，导致"顶部→中部→顶部"闪烁
      nzAutofocus: null,
    });
    // 打开后重置滚动位置到顶部（确保看到卡片开头）
    this.detailModalRef.afterOpen.subscribe(() => this.resetDetailScroll());
    // 关闭弹窗时同步 URL 回 /game，并恢复列表滚动位置（无闪烁）
    this.detailModalRef.afterClose.subscribe(() => {
      this.detailOpening = false;
      this.detailModalRef = null;
      this.activeDetailId = null;
      const restoreY = this.restoreScrollOnClose ? this.savedListScrollY : 0;
      this.restoreScrollOnClose = false;
      // 等弹窗彻底关闭、CDK 解锁文档后再同步 URL 与滚动位置。
      // 不用 router.navigate：全局 scrollPositionRestoration:'top' 会在导航完成后
      // 异步把滚动重置到顶部，导致"先到顶再回原位"的闪烁。
      // history.replaceState 只同步地址栏，不触发路由导航，滚动不会被打扰。
      this.waitForModalTeardown(() => {
        if (isPlatformBrowser(this.platformId) && window.location.pathname !== '/game') {
          window.history.replaceState({}, '', '/game');
        }
        window.scrollTo({ top: restoreY, behavior: 'instant' });
      });
    });
  }

  /** 打开弹窗后确保定位在顶部：
   *  已禁用 modal 自动聚焦（nzAutofocus: null），此处仅兜底归零 wrap 滚动，
   *  避免残留的滚动位置 */
  private resetDetailScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    const wrap = document.querySelector('.game-detail-modal-wrap') as HTMLElement | null;
    if (!wrap) {
      return;
    }
    wrap.scrollTop = 0;
  }

  /**
   * 等待详情弹窗彻底关闭：modal DOM 已移除，且 CDK 已解除 html 滚动锁。
   * 期间页面滚动保持不变，随后由调用方执行导航 + 同步恢复滚动（无中间渲染帧）。
   */
  private waitForModalTeardown(callback: () => void): void {
    if (!isPlatformBrowser(this.platformId)) {
      callback();
      return;
    }
    const html = document.documentElement;
    const modalGone = !document.querySelector('.game-detail-modal-wrap');
    const htmlUnlocked =
      !html.classList.contains('cdk-global-scrollblock') &&
      !html.getAttribute('style');
    if (modalGone && htmlUnlocked) {
      callback();
      return;
    }
    setTimeout(() => this.waitForModalTeardown(callback), 16);
  }

  private sortGamesByFinishDate(games: any[]): any[] {
    return [...games].sort((a, b) => {
      const statusPriorityDiff = this.getStatusPriority(a?.playStatus) - this.getStatusPriority(b?.playStatus);
      if (statusPriorityDiff !== 0) {
        return statusPriorityDiff;
      }

      const dateDiff = this.getDateValue(b?.statusDate ?? b?.finishDate) - this.getDateValue(a?.statusDate ?? a?.finishDate);
      if (dateDiff !== 0) {
        return dateDiff;
      }

      return (b?.id ?? 0) - (a?.id ?? 0);
    });
  }

  private getDateValue(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  private getStatusPriority(status: PlayStatus | undefined): number {
    if (status === 'playing') {
      return 0;
    }
    if (status === 'till_now') {
      return 1;
    }
    if (status === 'abandoned' || status === 'completed') {
      return 2;
    }
    return 3;
  }
}
