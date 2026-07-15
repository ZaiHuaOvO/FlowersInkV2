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
import { BlogService } from '../../../pages/blog/blog.service';
import { ApiLimiterService } from '../../../services/api-limiter.service';
import { GeneralService } from '../../../services/general.service';
import { extractHttpErrorMessage } from '../../../shared/utils/http-error-message.util';
import { md5 } from '../../../shared/utils/md5.util';
import { DatePipe, NgTemplateOutlet } from '@angular/common';

type AvatarState = 'none' | 'avatarUrl' | 'gravatar' | 'fallback';

interface CommentFormState {
  name: string;
  email: string;
  website: string;
  avatarUrl: string;
  content: string;
}

interface ArticleComment {
  id: number;
  blogId: number;
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

interface CommentNode extends ArticleComment {
  children: CommentNode[];
  _depth: number;
}

/** 回复框状态 */
interface ReplyFormState {
  name: string;
  email: string;
  website: string;
  avatarUrl: string;
  content: string;
}

const CACHE_KEY = 'article_commenter_info';
const ZAIHUA_AVATAR = 'https://api.flowersink.com/img/粉毛猫猫头.jpeg';

@Component({
  selector: 'flower-article-comments',
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
  ],
  templateUrl: './article-comments.component.html',
  styleUrl: './article-comments.component.css',
})
export class ArticleCommentsComponent implements OnInit, OnChanges {
  /** Expose Math for template use */
  readonly Math = Math;
  @Input() blogId!: number;

  /** 原始扁平评论列表 */
  comments: ArticleComment[] = [];

  /** 树形评论 */
  commentTree: CommentNode[] = [];

  loading = false;
  submitting = false;

  /** 提交后待审核的静态评论 */
  pendingComment: ArticleComment | null = null;

  /** 当前展开回复框的评论ID */
  replyTargetId: number | null = null;
  replySubmitting = false;
  replyForm: ReplyFormState = { name: '', email: '', website: '', avatarUrl: '', content: '' };

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
    private readonly blog: BlogService,
    private readonly msg: NzMessageService,
    private readonly general: GeneralService,
    private readonly limiter: ApiLimiterService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['blogId'] && this.blogId != null && this.blogId > 0) {
      this.pendingComment = null;
      this.comments = [];
      this.commentTree = [];
      this.fetchComments();
    }
  }

  ngOnInit(): void {
    this.loadCachedInfo();
  }

  get commentCount(): number {
    const count = this.comments.filter((c) => !c.isAdminReply).length;
    return count + (this.pendingComment ? 1 : 0);
  }

  isZaiHua(c: ArticleComment): boolean {
    return c.isAdminReply === true;
  }

  /** Comment is a locally-rendered pending one (not yet approved) */
  isPending(c: ArticleComment): boolean {
    return c.isApproved === false && !c.isAdminReply;
  }

  /** Wrap a raw ArticleComment into a CommentNode for template use */
  toCommentNode(c: ArticleComment, depth: number): CommentNode {
    return { ...c, children: [], _depth: depth };
  }

  // ---- 树形构建 ----

  private buildCommentTree(flat: ArticleComment[]): CommentNode[] {
    // 只处理直接回复文章的顶层评论（parentId === null）以及与它们关联的回复
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

  getAvatarState(c: ArticleComment): AvatarState {
    if (c.isAdminReply) {
      return 'avatarUrl'; // 再花固定使用头像URL
    }
    if (!c._avatar) {
      if (c.avatarUrl) {
        c._avatar = 'avatarUrl';
      } else if (c.email) {
        c._avatar = 'gravatar';
      } else {
        c._avatar = 'fallback';
      }
    }
    return c._avatar;
  }

  getAvatarUrl(c: ArticleComment): string | null {
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
    return null;
  }

  /** For pending comments without an explicit avatarUrl, skip gravatar entirely */
  getPendingAvatarUrl(c: ArticleComment): string | null {
    if (c.isAdminReply) return ZAIHUA_AVATAR;
    if (c.avatarUrl) return c.avatarUrl;
    return null;
  }

  onAvatarError(c: ArticleComment): void {
    if (c.isAdminReply) return; // 再花头像不会失败
    const state = this.getAvatarState(c);
    if (state === 'avatarUrl' && c.email) {
      c._avatar = 'gravatar';
    } else {
      c._avatar = 'fallback';
    }
  }

  getAvatarInitial(c: ArticleComment): string {
    return (c.name || '?').charAt(0).toUpperCase();
  }

  // ---- Display helpers ----

  getDisplayName(c: ArticleComment): string {
    return c.name || '匿名';
  }

  getDisplayWebsite(c: ArticleComment): string {
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

    const cooldownMessage = this.limiter.canCallApi('article-comment');
    if (cooldownMessage) {
      this.msg.info(`刚发过一次啦，${cooldownMessage} 秒后再来试试吧 (＞＜)`);
      return;
    }

    this.submitting = true;

    this.blog.createArticleComment(String(this.blogId), {
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
          blogId: this.blogId,
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
        this.limiter.markApiCall('article-comment');
        this.cacheFormInfo();
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
  toggleReply(comment: ArticleComment): void {
    if (this.replyTargetId === comment.id) {
      this.cancelReply();
    } else {
      this.replyTargetId = comment.id;
      // 预填当前用户信息
      this.replyForm = {
        name: this.form.name || '',
        email: this.form.email || '',
        website: this.form.website || '',
        avatarUrl: this.form.avatarUrl || '',
        content: '',
      };
    }
  }

  cancelReply(): void {
    this.replyTargetId = null;
    this.replyForm = { name: '', email: '', website: '', avatarUrl: '', content: '' };
  }

  onReplyEmojiSelected(emoji: string): void {
    this.replyForm.content += emoji;
  }

  submitReply(parentComment: ArticleComment): void {
    if (!this.general.isNotEmpty(this.replyForm.name)) {
      this.msg.info('先留下名字吧 (｡･ω･｡)');
      return;
    }

    if ((this.replyForm.name ?? '').trim() === '再花') {
      this.msg.info('你是再花……那我是谁？');
      return;
    }

    if (!this.general.isNotEmpty(this.replyForm.content)) {
      this.msg.info('回复内容还空着呢 (๑•̀ㅂ•́)و✧');
      return;
    }

    this.replySubmitting = true;

    this.blog.createArticleComment(String(this.blogId), {
      content: this.replyForm.content.trim(),
      name: this.replyForm.name || '匿名',
      email: this.replyForm.email || undefined,
      avatarUrl: this.replyForm.avatarUrl || undefined,
      parentId: parentComment.id,
    }).subscribe({
      next: () => {
        // 添加一条待审核的回复
        this.pendingReply = {
          id: Date.now(),
          blogId: this.blogId,
          parentId: parentComment.id,
          name: this.replyForm.name || '匿名',
          email: this.replyForm.email || '',
          website: '',
          avatarUrl: this.replyForm.avatarUrl || '',
          content: this.replyForm.content.trim(),
          isApproved: false,
          isAdminReply: false,
          createDate: new Date().toISOString(),
        };

        this.msg.success('回复已提交，审核后将展示 ✨');
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
  pendingReply: ArticleComment | null = null;

  // ---- Data fetching ----

  private fetchComments(): void {
    this.loading = true;
    this.blog.getArticleComments(String(this.blogId)).subscribe({
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
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const info = JSON.parse(cached) as Partial<CommentFormState>;
        this.form.name = info.name ?? '';
        this.form.email = info.email ?? '';
        this.form.website = info.website ?? '';
        this.form.avatarUrl = info.avatarUrl ?? '';
      }
    } catch { /* ignore */ }
  }

  private cacheFormInfo(): void {
    try {
      const info: Partial<CommentFormState> = {};
      if (this.form.name) info.name = this.form.name;
      if (this.form.email) info.email = this.form.email;
      if (this.form.website) info.website = this.form.website;
      if (this.form.avatarUrl) info.avatarUrl = this.form.avatarUrl;
      localStorage.setItem(CACHE_KEY, JSON.stringify(info));
    } catch { /* ignore */ }
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
