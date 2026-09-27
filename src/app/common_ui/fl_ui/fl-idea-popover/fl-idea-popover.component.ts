import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SimpleCaptchaComponent } from '../../../components/website/simple-captcha/simple-captcha.component';
import { IdeaService } from '../../../pages/blog/idea.service';
import { ApiLimiterService } from '../../../services/api-limiter.service';
import { GeneralService } from '../../../services/general.service';
import {
  avatarInitial,
  avatarUrl,
  displayName,
  displayWebsite,
  relativeTime,
} from '../../../shared/comment/comment-display.util';
import type { CommentItem } from '../../../shared/comment/comment.model';
import type {
  Idea,
  IdeaAnchorPayload,
  IdeaPlacement,
} from '../../../shared/idea/idea.model';
import {
  loadCommenterInfo,
  saveCommenterInfo,
} from '../../../shared/utils/commenter-info.util';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';
import { normalizeWebsiteUrl } from '../../../shared/utils/website-url.util';
import { FlButtonComponent } from '../fl-button/fl-button.component';
import { FlCommentEditorComponent } from '../fl-comment-editor/fl-comment-editor.component';
import { FlInputDirective } from '../fl-input/fl-input.directive';

/**
 * 段落想法浮窗。
 *
 * 一个浮窗，两种入口：
 *  - 框选文字点「写想法」→ 直接展开写想法表单（`composing = true`）
 *  - 点击已有虚线看别人写了什么 → 默认只列想法，底部留一个「写想法」入口
 *
 * 列表与表单刻意复用评论区的全局 `fc-*` 样式和 `fl-comment-editor`：
 * 想法和评论本来就是同一件事的两种粒度，长得不一样反而奇怪。
 *
 * 浮窗自己负责提交（含验证码、限流、身份缓存、草稿），
 * 父组件只关心两件事：新建成功后把想法并进去（`created`）、请求关闭（`closed`）。
 *
 * 拖拽也只在本组件内完成：给宿主的 left/top 加一个内部偏移，
 * 父组件按锚点算出来的位置不受影响，滚动跟随照旧。
 */
@Component({
  selector: 'fl-idea-popover',
  standalone: true,
  imports: [
    FormsModule,
    NzFlexModule,
    NzInputModule,
    FlButtonComponent,
    FlCommentEditorComponent,
    FlInputDirective,
    SimpleCaptchaComponent,
  ],
  templateUrl: './fl-idea-popover.component.html',
  styleUrl: './fl-idea-popover.component.css',
})
export class FlIdeaPopoverComponent implements OnChanges, OnInit {
  @Input({ required: true }) articleId!: number | string;
  /** 要批注的区间；新选区和已有虚线用同一种结构 */
  @Input({ required: true }) anchor!: IdeaAnchorPayload;
  @Input() ideas: Idea[] = [];
  /** 这段上存在（别人的）待审核想法，想法列表为空时也要说清楚为什么 */
  @Input() hasPending = false;
  /** 是否一进来就展开写想法表单（框选入口为 true，点虚线看想法为 false） */
  @Input() composing = false;

  /** 相对 .idea-layer 的定位，父组件算好后传进来 */
  @Input() left = 0;
  @Input() top = 0;
  /** 浮窗挂在选中文字的哪一侧（默认右侧，尽量不遮挡文字） */
  @Input() placement: IdeaPlacement = 'right';

  // 拖拽偏移叠在父组件算出的位置上，这样滚动跟随与手工拖动互不干扰
  private dragX = 0;
  private dragY = 0;
  private dragging = false;
  private dragOrigin = { x: 0, y: 0, baseX: 0, baseY: 0, rect: null as DOMRect | null };

  @HostBinding('style.left.px') get hostLeft(): number {
    return this.left + this.dragX;
  }

  @HostBinding('style.top.px') get hostTop(): number {
    return this.top + this.dragY;
  }

  // CSS 里按 data-placement 决定 translate，四个方向各一条规则
  @HostBinding('attr.data-placement') get placementAttr(): IdeaPlacement {
    return this.placement;
  }

  @HostBinding('class.fi-idea-popover--dragging') get isDragging(): boolean {
    return this.dragging;
  }

  @Output() created = new EventEmitter<Idea>();
  @Output() closed = new EventEmitter<void>();

  @ViewChild(SimpleCaptchaComponent) captchaComponent?: SimpleCaptchaComponent;

  readonly captchaScene = 'article-idea';
  readonly maxContentLength = 100;
  readonly relativeTime = relativeTime;

  /** 写想法表单是否展开 */
  showForm = false;

  form = {
    content: '',
    name: '',
    email: '',
    website: '',
    avatarUrl: '',
  };
  submitting = false;
  errorMessage = '';
  /** 身份区折叠：有缓存且没点过「编辑」时收起输入框 */
  editingIdentity = false;
  hasCachedInfo = false;

  private readonly failedAvatarIds = new Set<number>();
  private cardAvatarFailed = false;
  private draftKey = '';

  constructor(
    private readonly hostRef: ElementRef<HTMLElement>,
    private readonly ideaService: IdeaService,
    private readonly limiter: ApiLimiterService,
    private readonly general: GeneralService,
    private readonly msg: NzMessageService,
  ) {
    const cached = loadCommenterInfo();
    this.form.name = cached.name ?? '';
    this.form.email = cached.email ?? '';
    this.form.website = cached.website ?? '';
    this.form.avatarUrl = cached.avatarUrl ?? '';
    this.hasCachedInfo = this.general.isNotEmpty(cached.name);
    this.editingIdentity = !this.hasCachedInfo;
  }

  ngOnInit(): void {
    this.draftKey = `fi_idea_draft:${this.articleId}`;
    this.form.content = this.readDraft();
  }

  /**
   * 组件实例会被复用（父组件只换输入、不重建视图），
   * 所以「进来要不要展开表单」得跟着 anchor / composing 的每次变化重置。
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['anchor'] || changes['composing']) {
      this.showForm = this.composing;
      this.errorMessage = '';
    }
    // 换了一段就要回到锚点位置，不能把上一段的拖拽偏移带过来
    if (changes['anchor'] && !changes['anchor'].firstChange) {
      this.dragX = 0;
      this.dragY = 0;
    }
  }

  // ---- 草稿：只存正文，关掉浮窗再打开还在 ----

  private readDraft(): string {
    if (!this.draftKey) return '';
    try {
      return localStorage.getItem(this.draftKey) ?? '';
    } catch {
      return '';
    }
  }

  /** 编辑器每次改动都落一次本地缓存；清空则直接删掉，不留空草稿 */
  onContentChange(value: string): void {
    this.form.content = value;
    try {
      if (value) {
        localStorage.setItem(this.draftKey, value);
      } else {
        localStorage.removeItem(this.draftKey);
      }
    } catch {
      // 存储不可用时忽略，只是没有草稿而已
    }
  }

  private clearDraft(): void {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {
      // ignore
    }
  }

  // ---- 拖拽：只在标题栏按下时才生效 ----

  startDrag(event: PointerEvent): void {
    // 只响应左键；关闭按钮不当作拖拽把手
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.fi-idea-close')) return;

    this.dragging = true;
    this.dragOrigin = {
      x: event.clientX,
      y: event.clientY,
      baseX: this.dragX,
      baseY: this.dragY,
      rect: this.hostRef.nativeElement.getBoundingClientRect(),
    };
    // 捕获必须落在监听 pointermove 的那个元素上（标题栏），
    // 否则指针移出标题栏后事件就收不到了。pointerId 无效时浏览器会抛，
    // 捕获失败不影响拖拽本身（只是移出标题栏后不再跟随），所以吞掉异常。
    try {
      (event.currentTarget as HTMLElement | null)?.setPointerCapture?.(
        event.pointerId,
      );
    } catch {
      // ignore
    }
    event.preventDefault();
  }

  onDragMove(event: PointerEvent): void {
    const origin = this.dragOrigin;
    if (!this.dragging || !origin.rect) return;

    let nextX = origin.baseX + (event.clientX - origin.x);
    let nextY = origin.baseY + (event.clientY - origin.y);

    // 别让用户把浮窗拖出视口再也找不回来
    const margin = 8;
    const rect = origin.rect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (rect.left + nextX < margin) nextX += margin - (rect.left + nextX);
    if (rect.right + nextX > vw - margin) {
      nextX -= rect.right + nextX - (vw - margin);
    }
    if (rect.top + nextY < margin) nextY += margin - (rect.top + nextY);
    if (rect.bottom + nextY > vh - margin) {
      nextY -= rect.bottom + nextY - (vh - margin);
    }

    this.dragX = nextX;
    this.dragY = nextY;
  }

  endDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    try {
      (event.currentTarget as HTMLElement | null)?.releasePointerCapture?.(
        event.pointerId,
      );
    } catch {
      // ignore
    }
  }

  // ---- 展示辅助：统一借评论区的展示函数，保证和评论区长一样 ----

  /** 待审核的想法只有自定义头像可认，其余情况让人先看到首字母 */
  private asCommentItem(idea: Idea): CommentItem {
    return {
      id: idea.id,
      parentId: null,
      name: idea.name ?? '',
      email: '',
      website: idea.website ?? '',
      avatarUrl: idea.avatarUrl ?? '',
      content: idea.content,
      isApproved: idea.isApproved,
      isAdminReply: false,
      createDate: idea.createDate,
      identityLabel: idea.identityLabel,
      identityColor: idea.identityColor,
    };
  }

  nameOf(idea: Idea): string {
    return displayName(this.asCommentItem(idea));
  }

  websiteOf(idea: Idea): string {
    return displayWebsite(this.asCommentItem(idea));
  }

  avatarOf(idea: Idea): string | null {
    if (this.failedAvatarIds.has(idea.id)) {
      return null;
    }
    return avatarUrl(this.asCommentItem(idea), { pending: !idea.isApproved });
  }

  onAvatarError(idea: Idea): void {
    this.failedAvatarIds.add(idea.id);
  }

  initialOf(idea: Idea): string {
    return avatarInitial(this.asCommentItem(idea));
  }

  /** 身份卡片：把当前填的身份拼成一条伪评论，头像走同一套解析 */
  get cardComment(): CommentItem {
    return {
      id: 0,
      parentId: null,
      name: this.form.name,
      email: this.form.email,
      website: this.form.website,
      avatarUrl: this.form.avatarUrl,
      content: '',
      isApproved: true,
      isAdminReply: false,
      createDate: '',
    };
  }

  get cardName(): string {
    return this.form.name || '匿名';
  }

  get cardWebsite(): string {
    return normalizeWebsiteUrl(this.form.website);
  }

  get cardAvatar(): string | null {
    if (this.cardAvatarFailed) {
      return null;
    }
    return avatarUrl(this.cardComment);
  }

  onCardAvatarError(): void {
    this.cardAvatarFailed = true;
  }

  /** 失焦时补全协议头，和评论区一致 */
  normalizeWebsiteField(): void {
    this.form.website = normalizeWebsiteUrl(this.form.website);
  }

  get emptyHint(): string {
    return this.hasPending
      ? '暂无想法（这里有一条想法正在审核中）'
      : '暂无想法';
  }

  // ---- 提交 ----

  close(): void {
    this.closed.emit();
  }

  submit(): void {
    const content = (this.form.content ?? '').trim();

    if (!this.general.isNotEmpty(content)) {
      this.msg.info('想法还空着呢，写点什么吧 (๑•̀ㅂ•́)و✧');
      return;
    }
    if (content.length > this.maxContentLength) {
      this.msg.info(`想法最多 ${this.maxContentLength} 字哦`);
      return;
    }

    // 与评论区一致：不允许冒用站长身份
    if ((this.form.name ?? '').trim() === '再花') {
      this.msg.info('你是再花……那我是谁？');
      return;
    }
    if ((this.form.email ?? '').trim().toLowerCase() === 'zyzy1724@gmail.com') {
      this.msg.info('这个邮箱似曾相识……你该不会是再花吧 (｀・ω・´)');
      return;
    }

    this.form.website = normalizeWebsiteUrl(this.form.website);
    if ((this.form.website ?? '').toLowerCase().includes('flowersink.com')) {
      this.msg.info('网址不可以是本站地址哦 (´-ω-`)');
      return;
    }

    if (!this.captchaComponent?.isReady) {
      this.msg.info('验证码还在赶来的路上，再等等呀 (´ . .̫ . `)');
      return;
    }

    const captchaPayload = this.captchaComponent.buildPayload();
    if (!captchaPayload) {
      this.msg.info('验证码结果还没填哦，悄悄算一下吧 (｀・ω・´)');
      return;
    }

    const cooldown = this.limiter.canCallApi(
      this.ideaService.limiterKey,
      this.ideaService.limiterWindowMs,
    );
    if (cooldown) {
      this.msg.info(`刚发过一次啦，${cooldown} 秒后再来试试吧 (＞＜)`);
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    this.ideaService
      .createIdea(this.articleId, {
        ...this.anchor,
        content,
        name: this.form.name || undefined,
        email: this.form.email || undefined,
        website: this.form.website || undefined,
        avatarUrl: this.form.avatarUrl || undefined,
        ...captchaPayload,
      })
      .subscribe({
        next: (res) => {
          this.msg.success('想法已提交，审核通过后就会显示 ✨');
          this.limiter.markApiCall(this.ideaService.limiterKey);
          saveCommenterInfo({
            name: this.form.name,
            email: this.form.email,
            website: this.form.website,
            avatarUrl: this.form.avatarUrl,
          });
          this.captchaComponent?.refresh();
          this.submitting = false;
          this.hasCachedInfo = this.general.isNotEmpty(this.form.name);
          this.editingIdentity = false;
          // 提交成功即清空正文并顺手清掉草稿
          this.onContentChange('');

          const idea = res?.data?.idea;
          if (idea) {
            this.created.emit(idea);
          }
        },
        error: (error) => {
          this.captchaComponent?.refresh();
          this.errorMessage = extractHttpErrorMessage(
            error,
            '想法提交失败啦，稍后再试试吧 (╥﹏╥)',
          );
          this.msg.error(this.errorMessage);
          this.submitting = false;
        },
      });
  }
}
