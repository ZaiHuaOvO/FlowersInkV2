import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { FadeSlide, ExpandCollapse } from '../../../common_ui/animations/animation';
import { ApiLimiterService } from '../../../services/api-limiter.service';
import { GeneralService } from '../../../services/general.service';
import { loadCommenterInfo, saveCommenterInfo } from '../../../shared/utils/commenter-info.util';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';
import { findForeignImageUrl } from '../../../shared/comment/content-image-policy.util';
import {
  avatarInitial,
  avatarUrl,
  buildCommentTree,
  degradeAvatar,
  displayName,
  displayWebsite,
  isPending,
  isZaiHua,
} from '../../../shared/comment/comment-display.util';
import {
  emptyComment,
  type CommentFormState,
  type CommentItem,
  type CommentNode,
  type CommentSource,
} from '../../../shared/comment/comment.model';
import { FlButtonComponent } from '../fl-button/fl-button.component';
import { FlCommentCardComponent } from '../fl-comment-card/fl-comment-card.component';
import { FlCommentEditorComponent } from '../fl-comment-editor/fl-comment-editor.component';
import { FlInputDirective } from '../fl-input/fl-input.directive';
import { SimpleCaptchaComponent } from '../../../components/website/simple-captcha/simple-captcha.component';

/**
 * 公共评论区。
 *
 * 文章 / 游戏 / 装备 / 点滴 共用这一个组件，差异只有三处：
 *   1. 数据从哪来 —— 由 `source` 适配器决定（CommentService 还是 LifeService）
 *   2. 要不要标题 —— `title`
 *   3. 点滴的「点评论数才展开 + 只显示前几条 + 展开全部」—— `collapsible` / `open` / `previewLimit`
 *
 * 所以页面侧不再需要各自的评论区实现，只要组装一个 CommentSource。
 */
@Component({
  selector: 'fl-comment-board',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    NzFlexModule,
    NzIconModule,
    NzSpinModule,
    NzTooltipModule,
    FlButtonComponent,
    FlCommentCardComponent,
    FlCommentEditorComponent,
    FlInputDirective,
    SimpleCaptchaComponent,
  ],
  templateUrl: './fl-comment-board.component.html',
  styleUrl: './fl-comment-board.component.css',
  animations: [FadeSlide, ExpandCollapse],
})
export class FlCommentBoardComponent implements OnInit, OnChanges {
  /** 数据源适配器。必须是稳定引用（每个目标一个实例），换引用即重新拉取。 */
  @Input({ required: true }) source!: CommentSource;

  /** 标题；传 null 则不渲染标题行（点滴用） */
  @Input() title: string | null = '评论';

  /** 是否「点击评论数才展开表单」（点滴用） */
  @Input() collapsible = false;

  /** collapsible 时的受控展开态，由父组件点击评论数驱动 */
  @Input() open = false;

  /** 大于 0 时只显示前 N 条顶层评论，其余折叠在「展开全部评论」后 */
  @Input() previewLimit = 0;

  /** 强制全部展示（点滴详情弹窗用），此时不出现「展开全部评论」 */
  @Input() showAll = false;

  /** 评论总数（含本地待审核），供父组件显示角标 */
  @Output() countChange = new EventEmitter<number>();

  // ---- 数据 ----
  comments: CommentItem[] = [];
  commentTree: CommentNode[] = [];
  loading = false;
  submitting = false;

  /** 提交后本地乐观展示的待审核评论 */
  pendingComment: CommentItem | null = null;
  /** pendingComment 的节点包装（缓存，避免每次变更检测新建对象触发重渲染） */
  pendingNode: CommentNode | null = null;
  /** 待审核的回复 */
  pendingReply: CommentItem | null = null;

  // ---- 回复 ----
  replyTargetId: number | null = null;
  replySubmitting = false;
  replyForm: { content: string } = { content: '' };

  // ---- 身份 ----
  form: CommentFormState = {
    name: '',
    email: '',
    website: '',
    avatarUrl: '',
    content: '',
  };
  editing = false;
  cardComment: CommentItem = emptyComment();

  // ---- 展开态 ----
  expanded = false;

  @ViewChild(SimpleCaptchaComponent) captchaComponent?: SimpleCaptchaComponent;

  constructor(
    private readonly msg: NzMessageService,
    private readonly general: GeneralService,
    private readonly limiter: ApiLimiterService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['source'] && this.source) {
      this.resetAndFetch();
    }
  }

  ngOnInit(): void {
    this.loadCachedInfo();
    this.editing = !this.hasCachedInfo;
    if (this.source) {
      this.resetAndFetch();
    }
  }

  private resetAndFetch(): void {
    this.pendingComment = null;
    this.pendingNode = null;
    this.pendingReply = null;
    this.comments = [];
    this.commentTree = [];
    this.expanded = false;
    this.replyTargetId = null;
    this.fetchComments();
  }

  // ---- 身份 ----

  get hasCachedInfo(): boolean {
    return !!(this.form.name || this.form.email || this.form.website || this.form.avatarUrl);
  }

  get cardName(): string {
    return this.form.name || '匿名';
  }

  get cardEmail(): string {
    return this.form.email || '';
  }

  get cardWebsiteUrl(): string {
    return displayWebsite({ ...emptyComment(), website: this.form.website });
  }

  get hasWebsiteLink(): boolean {
    return !!this.cardWebsiteUrl;
  }

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  private syncCardComment(): void {
    this.cardComment.name = this.form.name || '';
    this.cardComment.email = this.form.email || '';
    this.cardComment.avatarUrl = this.form.avatarUrl || '';
    this.cardComment._avatar = undefined;
  }

  // ---- 展示 ----

  /** 评论总数（已加载的 + 本地待审核的） */
  get commentCount(): number {
    return this.commentTree.length + (this.pendingComment ? 1 : 0);
  }

  get hasComments(): boolean {
    return this.commentTree.length > 0 || !!this.pendingComment;
  }

  /** 无评论时（点滴场景）默认整块隐藏，点了评论数才出现 */
  get shouldShowPanel(): boolean {
    return !this.collapsible || this.hasComments || this.open;
  }

  /**
   * 表单是否可见。
   * 点滴场景由父组件点击评论数控制 `open`，所以这里完全跟着 `open` 走；
   * 其他场景表单常驻。
   */
  get showForm(): boolean {
    return this.collapsible ? this.open : true;
  }

  get hasMore(): boolean {
    return (
      this.previewLimit > 0 &&
      !this.showAll &&
      !this.expanded &&
      this.commentTree.length > this.previewLimit
    );
  }

  get visibleTree(): CommentNode[] {
    if (this.showAll || this.expanded || this.previewLimit <= 0) {
      return this.commentTree;
    }
    return this.commentTree.slice(0, this.previewLimit);
  }

  get extraTree(): CommentNode[] {
    if (this.showAll || this.previewLimit <= 0) {
      return [];
    }
    return this.commentTree.slice(this.previewLimit);
  }

  toggleExpanded(): void {
    this.expanded = true;
  }

  /** 头像尺寸随层级缩小，最深到 24px */
  avatarSizeFor(node: CommentNode): number {
    return Math.max(24, 40 - node._depth * 8);
  }

  readonly isZaiHua = isZaiHua;
  readonly isPending = isPending;
  readonly displayName = displayName;
  readonly displayWebsite = displayWebsite;
  readonly avatarUrl = avatarUrl;
  readonly avatarInitial = avatarInitial;
  readonly degradeAvatar = degradeAvatar;

  /** 某评论的子回复（含本地待审核的那条） */
  getChildren(node: CommentNode): CommentNode[] {
    const children = [...node.children];
    if (this.pendingReply && this.pendingReply.parentId === node.id) {
      children.push({ ...this.pendingReply, children: [], _depth: node._depth + 1 });
    }
    return children;
  }

  // ---- 提交 ----

  submit(): void {
    if (!this.general.isNotEmpty(this.form.name)) {
      this.msg.info('先留下名字吧，不然我会认不出你哦 (｡･ω･｡)');
      return;
    }

    if ((this.form.name ?? '').trim() === '再花') {
      this.msg.info('你是再花……那我是谁？');
      return;
    }

    if ((this.form.email ?? '').trim().toLowerCase() === 'zyzy1724@gmail.com') {
      this.msg.info('这个邮箱似曾相识……你该不会是再花吧 (｀・ω・´)');
      return;
    }

    if ((this.form.website ?? '').toLowerCase().includes('flowersink.com')) {
      this.msg.info('网址不可以是本站地址哦 (´-ω-`)');
      return;
    }

    if (!this.general.isNotEmpty(this.form.content)) {
      this.msg.info('评论内容还空着呢，写点什么吧 (๑•̀ㅂ•́)و✧');
      return;
    }

    // 外链图片挡在验证码之前：一是即时反馈不用等网络，二是验证码是一次性的，
    // 先验就会被消耗掉。API 侧还会再拦一次，这里只是让用户早点知道。
    if (findForeignImageUrl(this.form.content)) {
      this.msg.info(
        '评论里的图片只能来自本站哦，请先把图片上传到本站再引用 (´-ω-`)',
      );
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

    const cooldown = this.limiter.canCallApi(this.source.limiterKey);
    if (cooldown) {
      this.msg.info(`刚发过一次啦，${cooldown} 秒后再来试试吧 (＞＜)`);
      return;
    }

    this.submitting = true;
    const content = this.form.content;

    this.source
      .create({
        content,
        name: this.form.name || undefined,
        email: this.form.email || undefined,
        website: this.form.website || undefined,
        avatarUrl: this.form.avatarUrl || undefined,
        ...captchaPayload,
      })
      .subscribe({
        next: () => {
          this.pendingComment = {
            id: Date.now(),
            parentId: null,
            name: this.form.name || '匿名',
            email: this.form.email || '',
            website: this.form.website || '',
            avatarUrl: this.form.avatarUrl || '',
            content,
            isApproved: false,
            isAdminReply: false,
            createDate: new Date().toISOString(),
          };
          this.pendingNode = { ...this.pendingComment, children: [], _depth: 0 };
          this.msg.success('评论提交成功！评论将在审核通过后展示 ✨');
          this.form.content = '';
          this.captchaComponent?.refresh();
          this.limiter.markApiCall(this.source.limiterKey);
          this.cacheFormInfo();
          this.editing = false;
          this.submitting = false;
          this.emitCount();
        },
        error: (error) => {
          this.captchaComponent?.refresh();
          this.msg.error(extractHttpErrorMessage(error, '评论提交失败啦，稍后再试试吧 (╥﹏╥)'));
          this.submitting = false;
        },
      });
  }

  // ---- 回复 ----

  toggleReply(comment: CommentItem): void {
    if (this.replyTargetId === comment.id) {
      this.cancelReply();
      return;
    }
    this.replyTargetId = comment.id;
    this.replyForm = { content: '' };
  }

  cancelReply(): void {
    this.replyTargetId = null;
    this.replyForm = { content: '' };
  }

  submitReply(parentComment: CommentItem): void {
    if (!this.general.isNotEmpty(this.form.name)) {
      this.msg.info('先留下名字吧 (｡･ω･｡)');
      return;
    }

    if ((this.form.name ?? '').trim() === '再花') {
      this.msg.info('你是再花……那我是谁？');
      return;
    }

    if (!this.general.isNotEmpty(this.replyForm.content)) {
      this.msg.info('回复内容还空着呢 (๑•̀ㅂ•́)و✧');
      return;
    }

    if (findForeignImageUrl(this.replyForm.content)) {
      this.msg.info(
        '回复里的图片只能来自本站哦，请先把图片上传到本站再引用 (´-ω-`)',
      );
      return;
    }

    this.replySubmitting = true;
    const content = this.replyForm.content.trim();

    this.source
      .create({
        content,
        name: this.form.name || '匿名',
        email: this.form.email || undefined,
        website: this.form.website || undefined,
        avatarUrl: this.form.avatarUrl || undefined,
        parentId: parentComment.id,
      })
      .subscribe({
        next: () => {
          this.pendingReply = {
            id: Date.now(),
            parentId: parentComment.id,
            name: this.form.name || '匿名',
            email: this.form.email || '',
            website: this.form.website || '',
            avatarUrl: this.form.avatarUrl || '',
            content,
            isApproved: false,
            isAdminReply: false,
            createDate: new Date().toISOString(),
          };
          this.msg.success('回复已提交，审核后将展示 ✨');
          this.cacheFormInfo();
          this.cancelReply();
          this.replySubmitting = false;
        },
        error: () => {
          this.replySubmitting = false;
          this.msg.error('回复失败，稍后再试试吧 (╥﹏╥)');
        },
      });
  }

  // ---- 拉取 ----

  private fetchComments(): void {
    this.loading = true;
    this.source.list().subscribe({
      next: (res: any) => {
        const raw = res?.data;
        this.comments = Array.isArray(raw) ? raw : (raw?.data ?? []);
        this.commentTree = buildCommentTree(this.comments);
        this.loading = false;
        this.emitCount();
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private emitCount(): void {
    this.countChange.emit(this.commentCount);
  }

  // ---- 身份缓存 ----

  private loadCachedInfo(): void {
    const info = loadCommenterInfo();
    this.form.name = info.name ?? '';
    this.form.email = info.email ?? '';
    this.form.website = info.website ?? '';
    this.form.avatarUrl = info.avatarUrl ?? '';
    this.syncCardComment();
  }

  private cacheFormInfo(): void {
    saveCommenterInfo({
      name: this.form.name,
      email: this.form.email,
      website: this.form.website,
      avatarUrl: this.form.avatarUrl,
    });
  }
}
