import { md5 } from '../utils/md5.util';
import { buildQqAvatarUrl, getQqNumber } from '../utils/qq-avatar.util';
import { normalizeWebsiteUrl } from '../utils/website-url.util';
import {
  ZAIHUA_AVATAR,
  type AvatarState,
  type CommentItem,
  type CommentNode,
} from './comment.model';

/** 站长本人在评论区以「再花」身份出现 */
export function isZaiHua(c: CommentItem): boolean {
  return c.isAdminReply === true;
}

/** 本地乐观展示的待审核评论（尚未通过审核，且不是站长回复） */
export function isPending(c: CommentItem): boolean {
  return c.isApproved === false && !c.isAdminReply;
}

export function displayName(c: CommentItem): string {
  return c.name || '匿名';
}

/** 补全协议头后的网站地址；空串表示没填 */
export function displayWebsite(c: CommentItem): string {
  return normalizeWebsiteUrl(c.website);
}

/** 相对时间；无法解析的日期按「刚刚」处理（预览态会传空串） */
export function relativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) {
    return '刚刚';
  }
  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 60) {
    return '刚刚';
  }
  if (diffSec < 3600) {
    return `${Math.floor(diffSec / 60)} 分钟前`;
  }
  if (diffSec < 86400) {
    return `${Math.floor(diffSec / 3600)} 小时前`;
  }
  if (diffSec < 2592000) {
    return `${Math.floor(diffSec / 86400)} 天前`;
  }
  return `${Math.floor(diffSec / 2592000)} 个月前`;
}

/**
 * 求当前该用的头像来源。结果缓存在 `c._avatar` 上，避免每次变更检测重算。
 * 站长固定用头像 URL，不走邮箱推导。
 */
export function avatarState(c: CommentItem): AvatarState {
  if (c.isAdminReply) {
    return 'avatarUrl';
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

/**
 * 当前该显示的头像地址，null 表示走首字母兜底。
 *
 * `pending` 为 true 时不走 Gravatar —— 待审核评论还没有正式身份，
 * 拿邮箱算出的头像容易让人误以为评论已通过。
 */
export function avatarUrl(c: CommentItem, options?: { pending?: boolean }): string | null {
  if (c.isAdminReply) {
    return ZAIHUA_AVATAR;
  }
  if (options?.pending) {
    return c.avatarUrl || null;
  }

  const state = avatarState(c);
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

/** 头像加载失败时逐级降级：自定义图 → QQ/Gravatar → 首字母 */
export function degradeAvatar(c: CommentItem): void {
  if (c.isAdminReply) {
    return; // 站长头像不会失败
  }
  const state = avatarState(c);
  if (state === 'avatarUrl' && c.email) {
    c._avatar = getQqNumber(c.email) ? 'qq' : 'gravatar';
  } else if (state === 'gravatar' && c.email && getQqNumber(c.email)) {
    c._avatar = 'qq';
  } else {
    c._avatar = 'fallback';
  }
}

export function avatarInitial(c: CommentItem): string {
  return (c.name || '?').charAt(0).toUpperCase();
}

/** 扁平列表 → 树（顶层为 parentId === null） */
export function buildCommentTree(flat: CommentItem[]): CommentNode[] {
  const all: CommentNode[] = flat.map((c) => ({ ...c, children: [], _depth: 0 }));

  const byParent = new Map<number | null, CommentNode[]>();
  for (const c of all) {
    const key = c.parentId;
    const bucket = byParent.get(key);
    if (bucket) {
      bucket.push(c);
    } else {
      byParent.set(key, [c]);
    }
  }

  const attach = (parent: CommentNode, depth: number): void => {
    for (const child of byParent.get(parent.id) ?? []) {
      child._depth = depth;
      parent.children.push(child);
      attach(child, depth + 1);
    }
  };

  const roots = byParent.get(null) ?? [];
  for (const root of roots) {
    root._depth = 0;
    attach(root, 1);
  }
  return roots;
}
