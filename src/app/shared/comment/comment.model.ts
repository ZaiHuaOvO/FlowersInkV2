import type { Observable } from 'rxjs';
import type { CaptchaScene } from '../../services/captcha.service';

/** 头像状态机：从首选来源逐级降级 */
export type AvatarState = 'none' | 'avatarUrl' | 'gravatar' | 'qq' | 'fallback';

/** 一条评论（API 返回的原始形状） */
export interface CommentItem {
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
  /** 头像状态缓存，避免每次变更检测都重算 */
  _avatar?: AvatarState;
}

/** 树形节点（顶层评论 + 递归子回复） */
export interface CommentNode extends CommentItem {
  children: CommentNode[];
  _depth: number;
}

/** 访客身份信息（四个表单字段） */
export interface CommentIdentity {
  name: string;
  email: string;
  website: string;
  avatarUrl: string;
}

export interface CommentFormState extends CommentIdentity {
  content: string;
}

/** 提交评论/回复的 body；验证码字段由调用方按场景附加 */
export interface CommentSubmitPayload {
  content: string;
  name?: string;
  email?: string;
  website?: string;
  avatarUrl?: string;
  parentId?: number;
  /** 验证码场景需要的额外字段（captchaId / captchaAnswer） */
  [key: string]: unknown;
}

/**
 * 评论区数据源适配器。
 *
 * 这是把「公共评论区组件」和「调哪个接口」解耦的关键：文章/游戏/装备走
 * CommentService，点滴走 LifeService，但组件本身不关心数据从哪来。
 * 各页面在构造器里按自己的场景组装一个实现即可。
 */
export interface CommentSource {
  /** 拉取评论列表；返回原始响应（组件兼容 data 与 data.data 两种包法） */
  list(): Observable<unknown>;
  /** 提交评论；回复时 payload 带 parentId */
  create(payload: CommentSubmitPayload): Observable<unknown>;
  /** 验证码场景，透传给 flower-simple-captcha */
  captchaScene: CaptchaScene;
  /** 前端提交限流 key */
  limiterKey: string;
}

/** 「再花」站长的固定头像 */
export const ZAIHUA_AVATAR = 'https://api.flowersink.com/img/粉毛猫猫头.jpeg';

/** 空白评论对象，用于占位（身份卡片等） */
export function emptyComment(): CommentItem {
  return {
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
}
