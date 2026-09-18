import type { CommentTargetType } from '../../services/comment.service';
import { COMMENT_META } from '../../services/comment.service';
import type { CommentService } from '../../services/comment.service';
import type { LifeService } from '../../pages/life/life.service';
import type { CommentSource } from './comment.model';

/**
 * 把「评论区公共组件」和具体接口接起来的适配器工厂。
 *
 * 注意：每个评论目标要生成**一个稳定实例**（页面字段里存着），
 * 不要在模板的 getter 里现建 —— fl-comment-board 是按引用变化来判断
 * 要不要重新拉取的，每轮变更检测都换新对象会变成无限请求。
 */

/** 文章 / 游戏 / 装备的评论区数据源 */
export function articleCommentSource(
  commentService: CommentService,
  type: CommentTargetType,
  targetId?: number | string,
): CommentSource {
  const meta = COMMENT_META[type];
  return {
    list: () => commentService.getComments(type, targetId),
    create: (payload) => commentService.createComment(type, targetId, payload),
    captchaScene: meta.captchaScene,
    limiterKey: meta.limiterKey,
  };
}

/** 点滴的评论区数据源 */
export function lifeCommentSource(lifeService: LifeService, lifeId: number): CommentSource {
  return {
    list: () => lifeService.getLifeComments(lifeId),
    create: (payload) => lifeService.createLifeComment(lifeId, payload),
    captchaScene: 'life-comment',
    limiterKey: 'life-comment',
  };
}

/**
 * 点滴列表里每条点滴各有一个评论区，而 fl-comment-board 是按 source 的**引用**
 * 判断要不要重新拉取的。所以按 lifeId 做一层记忆化，保证同一条点滴每次拿到的
 * 都是同一个对象 —— 否则每轮变更检测都会触发一次请求。
 */
export function memoizeLifeCommentSources(
  lifeService: LifeService,
): (lifeId: number) => CommentSource {
  const cache = new Map<number, CommentSource>();
  return (lifeId: number): CommentSource => {
    let source = cache.get(lifeId);
    if (!source) {
      source = lifeCommentSource(lifeService, lifeId);
      cache.set(lifeId, source);
    }
    return source;
  };
}
