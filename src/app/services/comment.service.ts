import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API } from './api';
import { CaptchaScene } from './captcha.service';
import { HttpService } from './http.service';

export type CommentTargetType = 'article' | 'game' | 'equipment';

export interface CommentTargetMeta {
  captchaScene: CaptchaScene;
  limiterKey: string;
}

/** 各评论目标类型的验证码场景与前端限流 key */
export const COMMENT_META: Record<CommentTargetType, CommentTargetMeta> = {
  article: { captchaScene: 'article-comment', limiterKey: 'article-comment' },
  game: { captchaScene: 'module-comment', limiterKey: 'module-comment' },
  equipment: { captchaScene: 'module-comment', limiterKey: 'module-comment' },
};

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  constructor(private http: HttpService) {}

  /** 获取评论列表（不缓存，提交后即时刷新） */
  getComments(type: CommentTargetType, targetId?: number | string): Observable<object> {
    return this.http.get(this.buildCommentUrl(type, targetId));
  }

  createComment(
    type: CommentTargetType,
    targetId: number | string | undefined,
    data: any,
  ): Observable<object> {
    const url = this.buildCommentUrl(type, targetId);
    return this.http.post<object>(url, data).pipe(
      tap(() => {
        this.http.invalidateGetCache([url]);
      }),
    );
  }

  private buildCommentUrl(
    type: CommentTargetType,
    targetId?: number | string,
  ): string {
    if (type === 'article') {
      return `${API.BLOG}/${targetId}/comments`;
    }
    if (type === 'game') {
      return `${API.MODULE}/game/comments`;
    }
    return `${API.MODULE}/equipment/comments`;
  }
}
