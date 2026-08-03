import { Injectable } from '@angular/core';

/**
 * 点滴 UI 共享状态：点赞、评论数、评论区展开状态
 * 用于让列表卡片与详情弹窗之间双向同步。
 */
@Injectable({
  providedIn: 'root',
})
export class LifeUiStateService {
  /** 今日已点赞的 id 集合 */
  private likedIds = new Set<number>();
  /** id -> 点赞数（本地乐观/同步缓存） */
  private likeCounts = new Map<number, number>();
  /** 已展开评论区的 id 集合 */
  private commentOpenIds = new Set<number>();
  /** id -> 评论数（提交后本地 +1 同步） */
  private commentCounts = new Map<number, number>();

  /** 列表数据加载时初始化某条的点赞数（若本地无覆盖） */
  initLikeCount(id: number, count: number): void {
    if (!this.likeCounts.has(id)) {
      this.likeCounts.set(id, count);
    }
  }

  isLiked(id: number): boolean {
    return this.likedIds.has(id);
  }

  getLikeCount(id: number): number {
    return this.likeCounts.get(id) ?? 0;
  }

  /** 点赞成功（乐观）：设置已赞 + 点赞数 */
  markLiked(id: number, count: number): void {
    this.likedIds.add(id);
    this.likeCounts.set(id, count);
  }

  /** 点赞失败回滚 */
  revertLike(id: number, count: number): void {
    this.likedIds.delete(id);
    this.likeCounts.set(id, count);
  }

  /** 恢复持久化的已赞集合 */
  restoreLikedIds(ids: number[]): void {
    this.likedIds = new Set(ids);
  }

  getLikedIds(): number[] {
    return [...this.likedIds];
  }

  isCommentOpen(id: number): boolean {
    return this.commentOpenIds.has(id);
  }

  /** 切换评论区展开（不可变 Set 语义） */
  toggleCommentOpen(id: number): boolean {
    const next = new Set(this.commentOpenIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.commentOpenIds = next;
    return next.has(id);
  }

  getCommentCount(id: number): number {
    return this.commentCounts.get(id) ?? 0;
  }

  setCommentCount(id: number, count: number): void {
    this.commentCounts.set(id, count);
  }

  /** 提交评论成功后本地 +1 */
  bumpCommentCount(id: number): void {
    this.commentCounts.set(id, this.getCommentCount(id) + 1);
  }
}
