import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API } from '../../services/api';
import { HttpService } from '../../services/http.service';
import type {
  Idea,
  IdeaAnchor,
  IdeaAnchorPayload,
} from '../../shared/idea/idea.model';

/** 想法与评论共用同一套访客身份字段，方便复用头像与身份标签 */
export interface IdeaSubmitPayload extends IdeaAnchorPayload {
  content: string;
  name?: string;
  email?: string;
  website?: string;
  avatarUrl?: string;
  captchaId?: string;
  captchaAnswer?: string;
}

export interface IdeaListData {
  anchors: IdeaAnchor[];
}

export interface IdeaCreateData {
  success: boolean;
  /** 命中评论白名单被直接放行；用于弹「再花觉得你是好人」提示 */
  autoApproved?: boolean;
  msg: string;
  idea: Idea;
}

/** 想法接口不走 getCached：审核状态随时会变，必须每次拿最新的 */
@Injectable({
  providedIn: 'root',
})
export class IdeaService {
  /** 与后端/评论一致的 30 秒发布间隔 */
  readonly limiterKey = 'article-idea';
  readonly limiterWindowMs = 30000;
  readonly captchaScene = 'article-idea' as const;

  constructor(private readonly http: HttpService) {}

  listIdeas(articleId: number | string): Observable<{ data: IdeaListData }> {
    return this.http.get<{ data: IdeaListData }>(
      `${API.BLOG}/${articleId}/ideas`,
    );
  }

  createIdea(
    articleId: number | string,
    payload: IdeaSubmitPayload,
  ): Observable<{ data: IdeaCreateData }> {
    return this.http.post<{ data: IdeaCreateData }>(
      `${API.BLOG}/${articleId}/ideas`,
      payload,
    );
  }

  /**
   * 正文被编辑后，锚点会漂移。前端重新定位成功后回写新位置，让数据自己收敛。
   * 后端只接受与原文差异不大的对齐，见 API 侧 realignIdeaAnchor。
   */
  realignAnchor(
    anchorId: number,
    payload: IdeaAnchorPayload,
  ): Observable<object> {
    return this.http.post<object>(
      `${API.BLOG}/idea-anchors/${anchorId}/realign`,
      payload,
    );
  }
}
