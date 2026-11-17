import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { GameCardComponent } from '../../../components/world/game-card/game-card.component';
import { GameCompactCardComponent } from '../../../components/world/game-compact-card/game-compact-card.component';
import { WindowService } from '../../../services/window.service';
import { WorldService } from '../world.service';
import { QuickUp } from '../../../common_ui/animations/animation';
import { CommentService } from '../../../services/comment.service';
import { articleCommentSource } from '../../../shared/comment/comment-source.factory';
import type { CommentSource } from '../../../shared/comment/comment.model';
import { FlCommentBoardComponent } from '../../../common_ui/fl_ui/fl-comment-board/fl-comment-board.component';
import { FlErrorStateComponent } from '../../../common_ui/fl_ui/fl-error-state/fl-error-state.component';
import { GameDetailDialogComponent } from './game-detail-dialog/game-detail-dialog.component';
import { formatHours, playStatusText as resolvePlayStatusText } from './game-display.util';
import { GameRevealDirective } from './game-reveal.directive';
import { GameTimelineRevealService } from './game-timeline-reveal.service';
import {
  buildGameView,
  chunkTimelineRows,
  EMPTY_GAME_VIEW,
  type GameRecord,
  type GameView,
  type TimelineRow,
} from './game-view.model';

@Component({
  selector: 'flower-game',
  standalone: true,
  imports: [
    DecimalPipe,
    NzFlexModule,
    NzTypographyModule,
    BlogTitleComponent,
    NzSpinModule,
    NzModalModule,
    GameCardComponent,
    GameCompactCardComponent,
    GameRevealDirective,
    FlCommentBoardComponent,
    FlErrorStateComponent,
  ],
  providers: [GameTimelineRevealService],
  templateUrl: './game.component.html',
  styleUrl: './game.component.css',
  animations: [QuickUp],
})
export class GameComponent {
  data: GameRecord[] = [];
  view: GameView = EMPTY_GAME_VIEW;
  timelineRows: TimelineRow[] = [];
  columns = 2;
  loading = true;
  loadError = false;
  totalGames = 0;
  totalPlayingTime = 0;
  readonly revealedIds = signal<ReadonlySet<number>>(new Set<number>());
  readonly coverSources = signal<ReadonlyMap<number, string>>(
    new Map<number, string>(),
  );

  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly commentService = inject(CommentService);
  private readonly revealService = inject(GameTimelineRevealService);

  /** 游戏评论是模块级线程，没有 targetId，所以可以在声明时一次性定下来 */
  readonly commentSource: CommentSource = articleCommentSource(
    this.commentService,
    'game',
  );

  /** 详情弹窗实例引用（用于关闭后同步路由） */
  private detailModalRef: NzModalRef | null = null;
  /** 当前弹窗展示的游戏 id */
  private activeDetailId: number | null = null;
  /** 防止路由订阅与点击事件竞态导致重复打开 */
  private detailOpening = false;
  /** 打开详情弹窗前列表的滚动位置，关闭后恢复 */
  private savedListScrollY = 0;
  /** 仅当从列表点击打开弹窗时，关闭后才恢复滚动位置（URL 直达不恢复） */
  private restoreScrollOnClose = false;
  /** 关闭弹窗后把焦点还给触发的卡片 */
  private lastTriggerElement: HTMLElement | null = null;

  constructor(
    private readonly world: WorldService,
    private readonly modal: NzModalService,
    private readonly windowService: WindowService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {
    this.columns = this.getColumns(
      this.windowService.getWindowWidth() || 1440,
    );

    this.windowService.bindWindowWidth(this.destroyRef, (width) => {
      const nextColumns = this.getColumns(width);
      if (nextColumns === this.columns) {
        return;
      }
      this.columns = nextColumns;
      this.rebuildRows();
    });

    this.revealService.revealed$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ id, src }) => {
        this.revealedIds.update((current) => {
          if (current.has(id)) {
            return current;
          }
          const next = new Set(current);
          next.add(id);
          return next;
        });

        if (src) {
          this.coverSources.update((current) => {
            if (current.get(id) === src) {
              return current;
            }
            const next = new Map(current);
            next.set(id, src);
            return next;
          });
        }
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
    this.loadError = false;
    this.loading = true;
    this.revealService.reset();
    this.revealedIds.set(new Set<number>());
    this.coverSources.set(new Map<number, string>());
    this.data = [];
    this.view = EMPTY_GAME_VIEW;
    this.timelineRows = [];

    this.world.getGameList().subscribe({
      next: (res: any) => {
        const payload = res?.['data'] ?? {};
        this.data = Array.isArray(payload.games) ? payload.games : [];
        this.view = buildGameView(this.data);
        this.rebuildRows();
        this.totalGames = payload.totalGames ?? this.data.length;
        this.totalPlayingTime = payload.totalPlayingTime ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loadError = true;
        this.loading = false;
      },
    });
  }

  statusText(game: GameRecord): string {
    return resolvePlayStatusText(game?.playStatus);
  }

  playingMeta(game: GameRecord): string {
    const parts: string[] = [];
    const platform = String(game?.platform ?? '').trim();
    if (platform) {
      parts.push(platform);
    }

    if (game?.time !== null && game?.time !== undefined) {
      const hours = formatHours(game.time);
      if (hours) {
        parts.push(`${hours} 小时`);
      }
    }

    return parts.join(' · ');
  }

  compactAria(game: GameRecord, statusOverride?: string): string {
    const status = statusOverride ?? this.statusText(game);
    const platform = String(game?.platform ?? '').trim();
    return `《${game?.name ?? ''}》，${status}${platform ? `，${platform}` : ''}`;
  }

  // ---- 详情弹窗 ----

  /** 点击卡片：直接打开详情弹窗，并同步路由为 /game/:id */
  openDetailDialog(game: GameRecord, event?: MouseEvent): void {
    event?.stopPropagation();
    event?.preventDefault();
    this.lastTriggerElement =
      (event?.currentTarget as HTMLElement | null) ?? null;
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

  private showDetailModal(game: GameRecord): void {
    this.detailModalRef = this.modal.create({
      nzContent: GameDetailDialogComponent,
      nzData: game,
      nzFooter: null,
      nzWidth: 'min(960px, 92vw)',
      nzClosable: false,
      nzMaskClosable: true,
      nzKeyboard: true,
      nzWrapClassName: 'game-detail-modal-wrap',
      // 关闭自动聚焦：弹窗内容自己会把焦点放到关闭按钮上，避免
      // 默认 nzAutofocus 把焦点移到内容中部、触发滚动。
      nzAutofocus: null,
    });
    // 打开后重置内部滚动位置到顶部（确保看到封面和标题）
    this.detailModalRef.afterOpen.subscribe(() => this.resetDetailScroll());
    // 关闭弹窗时同步 URL 回 /game，并恢复列表滚动位置（无闪烁）
    this.detailModalRef.afterClose.subscribe(() => {
      this.detailOpening = false;
      this.detailModalRef = null;
      this.activeDetailId = null;
      const restoreY = this.restoreScrollOnClose ? this.savedListScrollY : null;
      this.restoreScrollOnClose = false;
      const trigger = this.lastTriggerElement;
      this.lastTriggerElement = null;
      // 等弹窗彻底关闭、CDK 解锁文档后再同步 URL 与滚动位置。
      // 不用 router.navigate：全局 scrollPositionRestoration:'top' 会在导航完成后
      // 异步把滚动重置到顶部，导致"先到顶再回原位"的闪烁。
      // history.replaceState 只同步地址栏，不触发路由导航，滚动不会被打扰。
      this.waitForModalTeardown(() => {
        if (
          isPlatformBrowser(this.platformId) &&
          window.location.pathname !== '/game'
        ) {
          window.history.replaceState({}, '', '/game');
        }
        if (restoreY !== null) {
          window.scrollTo({ top: restoreY, behavior: 'instant' });
        }
        trigger?.focus?.({ preventScroll: true });
      });
    });
  }

  /** 打开弹窗后确保内容从顶部开始，避免残留上一次的滚动位置 */
  private resetDetailScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const wrap = document.querySelector(
      '.game-detail-modal-wrap',
    ) as HTMLElement | null;
    if (wrap) {
      wrap.scrollTop = 0;
    }
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

  private getColumns(width: number): number {
    if (width >= 1200) {
      return 6;
    }
    if (width >= 1024) {
      return 5;
    }
    if (width >= 768) {
      return 4;
    }
    return 3;
  }

  isRowStartRevealed(row: TimelineRow): boolean {
    const first = row.items[0];
    return !!first && this.revealedIds().has(first.game.id);
  }

  isRowEndRevealed(row: TimelineRow): boolean {
    const last = row.items[row.items.length - 1];
    return !!last && this.revealedIds().has(last.game.id);
  }

  private rebuildRows(): void {
    this.timelineRows = chunkTimelineRows(this.view.timeline, this.columns);
  }
}
