import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { FlInputDirective } from '../../../common_ui/fl_ui/fl-input/fl-input.directive';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';
import { EmojiComponent } from '../../website/emoji/emoji.component';
import { SimpleCaptchaComponent } from '../../website/simple-captcha/simple-captcha.component';
import {
  CommentService,
  CommentTargetType,
  COMMENT_META,
} from '../../../services/comment.service';
import { ApiLimiterService } from '../../../services/api-limiter.service';
import { GeneralService } from '../../../services/general.service';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';
import { md5 } from '../../../shared/utils/md5.util';
import { loadCommenterInfo, saveCommenterInfo } from '../../../shared/utils/commenter-info.util';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FadeSlide } from '../../../common_ui/animations/animation';
import { getQqNumber, buildQqAvatarUrl } from '../../../shared/utils/qq-avatar.util';

type AvatarState = 'none' | 'avatarUrl' | 'gravatar' | 'qq' | 'fallback';

interface CommentFormState {
  name: string;
  email: string;
  website: string;
  avatarUrl: string;
  content: string;
}

interface CommentItem {
  id: number;
  parentId: number | null;
  name: string;
  email: string;
  website: string;
  avatarUrl: string;
  content: string;
  isApproved: boolean;
  isAdminReply: boolean;
  createDate: string;
  _avatar?: AvatarState;
}

interface CommentNode extends CommentItem {
  children: CommentNode[];
  _depth: number;
}

/** 回复框状态 */
interface ReplyFormState {
  content: string;
}

const ZAIHUA_AVATAR = 'https://api.flowersink.com/img/粉毛猫猫头.jpeg';

@Component({
  selector: 'flower-comment-section',
  standalone: true,
  imports: [
    FormsModule,
    NzFlexModule,
    NzTypographyModule,
    NzInputModule,
    NzSpinModule,
    NzDividerModule,
    NzAvatarModule,
    NzTooltipModule,
    NzButtonModule,
    FlInputDirective,
    FlButtonComponent,
    EmojiComponent,
    SimpleCaptchaComponent,
    DatePipe,
    NgTemplateOutlet,
    NzIconModule
  ],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.css',
  animations: [FadeSlide],
})
export class CommentSectionComponent implements OnInit, OnChanges {
  /** Expose Math for template use */
  readonly Math = Math;

  /** 评论目标类型：文章 / 游戏 / 装备 */
  @Input() type: CommentTargetType = 'article';

  /** 目标 id（文章为 blogId；游戏/装备为模块级线程，可省略） */
  @Input() targetId?: number | string;

  /** 验证码场景（由 type 推导） */
  get captchaScene() {
    return COMMENT_META[this.type].captchaScene;
  }

  /** 前端限流 key（由 type 推导） */
  private get limiterKey() {
    return COMMENT_META[this.type].limiterKey;
  }

  /** 原始扁平评论列表 */
  comments: CommentItem[] = [];

  /** 树形评论 */
  commentTree: CommentNode[] = [];

  loading = false;
  submitting = false;

  /** 提交后待审核的静态评论 */
  pendingComment: CommentItem | null = null;

  /** 当前展开回复框的评论ID */
  replyTargetId: number | null = null;
  replySubmitting = false;
  replyForm: ReplyFormState = { content: '' };

  /** 是否处于编辑身份信息模式（卡片态点击"编辑"后置为 true） */
  editing = false;

  /** 用于身份卡片头像展示的轻量对象（复用评论详情的头像状态机） */
  cardComment: CommentItem = {
    id: 0,
    parentId: null,
    name: '',
    email: '',
    website: '',
    avatarUrl: '',
    content: '',
    isApproved: true,
    isAdminReply: false,
    createDate: '',
  };

  form: CommentFormState = {
    name: '',
    email: '',
    website: '',
    avatarUrl: '',
    content: '',
  };

  @ViewChild(SimpleCaptchaComponent)
  captchaComponent?: SimpleCaptchaComponent;

  constructor(
    private readonly commentService: CommentService,
    private readonly msg: NzMessageService,
    private readonly general: GeneralService,
    private readonly limiter: ApiLimiterService,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type'] || changes['targetId']) {
      this.pendingComment = null;
      this.comments = [];
      this.commentTree = [];
      this.fetchComments();
    }
  }

  ngOnInit(): void {
    this.loadCachedInfo();
    this.editing = !this.hasCachedInfo;
  }

  /** 是否已有缓存的身份信息（卡片模式 = hasCachedInfo && !editing） */
  get hasCachedInfo(): boolean {
    return !!(
      this.form.name ||
      this.form.email ||
      this.form.website ||
      this.form.avatarUrl
    );
  }

  /** 卡片展示用 —— 名称 */
  get cardName(): string {
    return this.form.name || '匿名';
  }

  /** 卡片展示用 —— 邮箱文本 */
  get cardEmail(): string {
    return this.form.email || '';
  }

  /** 卡片展示用 —— 网站跳转地址（补全 https:// 前缀），空串表示无网站 */
  get cardWebsiteUrl(): string {
    return this.getDisplayWebsite({ website: this.form.website } as CommentItem);
  }

  /** 卡片展示用 —— 是否填了网站（决定名字是否可点击带虚线下划线） */
  get hasWebsiteLink(): boolean {
    return !!this.cardWebsiteUrl;
  }

  toggleEdit(): void {
    this.editing = !this.editing;
  }

  /** 用表单值同步卡片头像对象（复用评论详情头像状态机） */
  private syncCardComment(): void {
    this.cardComment.name = this.form.name || '';
    this.cardComment.email = this.form.email || '';
    this.cardComment.avatarUrl = this.form.avatarUrl || '';
    this.cardComment._avatar = undefined; // 让头像状态机重新评估
  }

  get commentCount(): number {
    const count = this.comments.length;
    return count + (this.pendingComment ? 1 : 0);
  }

  isZaiHua(c: CommentItem): boolean {
    return c.isAdminReply === true;
  }

  /** Comment is a locally-rendered pending one (not yet approved) */
  isPending(c: CommentItem): boolean {
    return c.isApproved === false && !c.isAdminReply;
  }

  /** Wrap a raw CommentItem into a CommentNode for template use */
  toCommentNode(c: CommentItem, depth: number): CommentNode {
    return { ...c, children: [], _depth: depth };
  }

  // ---- 树形构建 ----

  private buildCommentTree(flat: CommentItem[]): CommentNode[] {
    // 只处理直接回复模块的顶层评论（parentId === null）以及与它们关联的回复
    const allComments: CommentNode[] = flat.map((c) => ({
      ...c,
      children: [],
      _depth: 0,
    }));

    // 按 parentId 分组
    const byParent = new Map<number | null, CommentNode[]>();
    for (const c of allComments) {
      const key = c.parentId;
      if (!byParent.has(key)) {
        byParent.set(key, []);
      }
      byParent.get(key)!.push(c);
    }

    // 递归构建树
    const buildChildren = (parent: CommentNode, depth: number) => {
      const children = byParent.get(parent.id) ?? [];
      for (const child of children) {
        child._depth = depth;
        parent.children.push(child);
        buildChildren(child, depth + 1);
      }
    };

    // 顶层 = parentId === null
    const roots = byParent.get(null) ?? [];
    for (const root of roots) {
      root._depth = 0;
      buildChildren(root, 1);
    }

    return roots;
  }

  // ---- Avatar state machine ----

  getAvatarState(c: CommentItem): AvatarState {
    if (c.isAdminReply) {
      return 'avatarUrl'; // 再花固定使用头像URL
    }
    if (!c._avatar) {
      if (c.avatarUrl) {
        c._avatar = 'avatarUrl';
      } else if (c.email) {
        // QQ 号邮箱（纯数字前缀）优先于普通 Gravatar
        c._avatar = getQqNumber(c.email) ? 'qq' : 'gravatar';
      } else {
        c._avatar = 'fallback';
      }
    }
    return c._avatar;
  }

  getAvatarUrl(c: CommentItem): string | null {
    if (c.isAdminReply) {
      return ZAIHUA_AVATAR;
    }
    // pending comments: only show avatar if a custom URL was explicitly set
    const state = this.getAvatarState(c);
    if (state === 'avatarUrl' && c.avatarUrl) {
      return c.avatarUrl;
    }
    if (state === 'gravatar' && c.email) {
      const hash = md5(c.email.trim().toLowerCase());
      return `https://www.gravatar.com/avatar/${hash}?d=404&s=80`;
    }
    if (state === 'qq' && c.email) {
      const qq = getQqNumber(c.email);
      if (qq) {
        return buildQqAvatarUrl(qq);
      }
    }
    return null;
  }

  /** For pending comments without an explicit avatarUrl, skip gravatar entirely */
  getPendingAvatarUrl(c: CommentItem): string | null {
    if (c.isAdminReply) return ZAIHUA_AVATAR;
    if (c.avatarUrl) return c.avatarUrl;
    return null;
  }

  onAvatarError(c: CommentItem): void {
    if (c.isAdminReply) return; // 再花头像不会失败
    const state = this.getAvatarState(c);
    if (state === 'avatarUrl' && c.email) {
      c._avatar = getQqNumber(c.email) ? 'qq' : 'gravatar';
    } else if (state === 'gravatar' && c.email && getQqNumber(c.email)) {
      c._avatar = 'qq';
    } else {
      c._avatar = 'fallback';
    }
  }

  getAvatarInitial(c: CommentItem): string {
    return (c.name || '?').charAt(0).toUpperCase();
  }

  // ---- Display helpers ----

  getDisplayName(c: CommentItem): string {
    return c.name || '匿名';
  }

  getDisplayWebsite(c: CommentItem): string {
    if (!c.website) return '';
    let url = c.website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }

  /** 相对时间 */
  getRelativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return '刚刚';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} 分钟前`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} 小时前`;
    if (diffSec < 2592000) return `${Math.floor(diffSec / 86400)} 天前`;
    return `${Math.floor(diffSec / 2592000)} 个月前`;
  }

  // ---- 主评论提交 ----

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

    if (!this.captchaComponent?.isReady) {
      this.msg.info('验证码还在赶来的路上，再等等呀 (´ . .̫ . `)');
      return;
    }

    const captchaPayload = this.captchaComponent.buildPayload();
    if (!captchaPayload) {
      this.msg.info('验证码结果还没填哦，悄悄算一下吧 (｀・ω・´)');
      return;
    }

    const cooldownMessage = this.limiter.canCallApi(this.limiterKey);
    if (cooldownMessage) {
      this.msg.info(`刚发过一次啦，${cooldownMessage} 秒后再来试试吧 (＞＜)`);
      return;
    }

    this.submitting = true;

    this.commentService.createComment(this.type, this.targetId, {
      content: this.form.content,
      name: this.form.name || undefined,
      email: this.form.email || undefined,
      website: this.form.website || undefined,
      avatarUrl: this.form.avatarUrl || undefined,
      ...captchaPayload,
    }).subscribe({
      next: () => {
        this.pendingComment = {
          id: Date.now(),
          parentId: null,
          name: this.form.name || '匿名',
          email: this.form.email || '',
          website: this.form.website || '',
          avatarUrl: this.form.avatarUrl || '',
          content: this.form.content,
          isApproved: false,
          isAdminReply: false,
          createDate: new Date().toISOString(),
        };
        this.msg.success('评论提交成功！评论将在审核通过后展示 ✨');
        this.form.content = '';
        this.captchaComponent?.refresh();
        this.limiter.markApiCall(this.limiterKey);
        this.cacheFormInfo();
        this.editing = false;
        this.submitting = false;
      },
      error: (error) => {
        this.captchaComponent?.refresh();
        this.msg.error(
          extractHttpErrorMessage(error, '评论提交失败啦，稍后再试试吧 (╥﹏╥)'),
        );
        this.submitting = false;
      },
    });
  }

  onEmojiSelected(emoji: string): void {
    this.form.content += emoji;
  }

  // ---- 回复功能 ----

  /** 切换回复框 */
  toggleReply(comment: CommentItem): void {
    if (this.replyTargetId === comment.id) {
      this.cancelReply();
    } else {
      this.replyTargetId = comment.id;
      this.replyForm = { content: '' };
    }
  }

  cancelReply(): void {
    this.replyTargetId = null;
    this.replyForm = { content: '' };
  }

  onReplyEmojiSelected(emoji: string): void {
    this.replyForm.content += emoji;
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

    this.replySubmitting = true;

    this.commentService.createComment(this.type, this.targetId, {
      content: this.replyForm.content.trim(),
      name: this.form.name || '匿名',
      email: this.form.email || undefined,
      website: this.form.website || undefined,
      avatarUrl: this.form.avatarUrl || undefined,
      parentId: parentComment.id,
    }).subscribe({
      next: () => {
        // 添加一条待审核的回复
        this.pendingReply = {
          id: Date.now(),
          parentId: parentComment.id,
          name: this.form.name || '匿名',
          email: this.form.email || '',
          website: this.form.website || '',
          avatarUrl: this.form.avatarUrl || '',
          content: this.replyForm.content.trim(),
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

  /** 待审核的回复（静态展示） */
  pendingReply: CommentItem | null = null;

  // ---- Data fetching ----

  private fetchComments(): void {
    if (this.type === 'article' && this.targetId == null) {
      return;
    }
    this.loading = true;
    this.commentService.getComments(this.type, this.targetId).subscribe({
      next: (res: any) => {
        const raw = res?.data;
        this.comments = Array.isArray(raw) ? raw : (raw?.data ?? []);
        this.commentTree = this.buildCommentTree(this.comments);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ---- localStorage caching ----

  private loadCachedInfo(): void {
    const info = loadCommenterInfo();
    this.form.name = info.name ?? '';
    this.form.email = info.email ?? '';
    this.form.website = info.website ?? '';
    this.form.avatarUrl = info.avatarUrl ?? '';
    this.syncCardComment();
  }

  private cacheFormInfo(): void {
    saveCommenterInfo(this.form);
    this.syncCardComment();
  }

  /** 获取某评论的子评论（包括待审核回复） */
  getChildren(node: CommentNode): CommentNode[] {
    const children = [...node.children];
    // 如果有待审核回复指向这个节点，附加显示
    if (this.pendingReply && this.pendingReply.parentId === node.id) {
      children.push({
        ...this.pendingReply,
        children: [],
        _depth: node._depth + 1,
      } as CommentNode);
    }
    return children;
  }
}
