/** 一条想法（读者对正文某段文字写下的批注） */
export interface Idea {
  id: number;
  /** 所属区间线索，新建想法的响应里才有（列表里同一条线索下的想法不需要） */
  anchorId?: number;
  content: string;
  name?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  isApproved: boolean;
  createDate: string;
  identityLabel?: string;
  identityColor?: string;
}

/** 一段被划线的文字区间，以及挂在它上面的所有可见想法 */
export interface IdeaAnchor {
  id: number;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  prefix?: string | null;
  suffix?: string | null;
  /** 这段文字上是否存在（别人或自己的）待审核想法，用于画占位虚线 */
  hasPending: boolean;
  /** 这条区间下全部想法数（含待审核），用于虚线上的数字角标 */
  ideaCount?: number;
  /** 其中待审核的想法数，ideaCount - pendingCount 即已通过数 */
  pendingCount?: number;
  ideas: Idea[];
  /**
   * 当前浮窗正对着这一段（新框选或点开的虚线）。
   * 前端临时构造的锚点会带上它，用来把正文里对应的文字高亮出来，
   * 后端返回的数据里不会有这个字段。
   */
  active?: boolean;
  /**
   * 位置不是精确命中的，是正文被编辑后靠前缀/后缀救回来的。
   * 该锚点的 startOffset/endOffset/anchorText 已经是新值，可以回写后端让数据收敛。
   */
  drifted?: boolean;
}

/** 文本轴上的一个连续段：同一个可批注块内、文档序相邻的文本节点 */
export interface IdeaRun {
  el: Element;
  nodes: Text[];
  /** 每个节点在 run 文本内的起始偏移，与 nodes 同序 */
  prefixes: number[];
  /** run 在全局轴上的区间，end 为开区间 */
  start: number;
  end: number;
}

/** 正文文本轴：把所有可批注块的纯文本按顺序拼成一条全局字符串 */
export interface IdeaAxis {
  root: Element;
  runs: IdeaRun[];
  text: string;
  nodeRuns: Map<Text, IdeaRun>;
}

/** 提交想法时随锚点一起送出的定位数据 */
export interface IdeaAnchorPayload {
  startOffset: number;
  endOffset: number;
  anchorText: string;
  prefix: string;
  suffix: string;
}

/** 渲染用：某个 run 内一段要画虚线的区间（已按重叠合并） */
export interface IdeaSegment {
  start: number;
  end: number;
  /** 覆盖这段的所有锚点 id */
  keys: number[];
  /** 这段下只有待审核想法，用更淡的样式 */
  pendingOnly: boolean;
  /** 这段覆盖的全部想法数（含待审核），虚线上的数字角标用它 */
  count: number;
  /** 浮窗正对着这一段，高亮出来 */
  active: boolean;
}

/** 想法浮窗相对被批注文字的位置。默认开在右边，尽量不遮住选中的文字 */
export type IdeaPlacement = 'right' | 'left' | 'above' | 'below';

/** applyIdeaMarks 的结果：新轴 + 被自动救回来的锚点 */
export interface IdeaRenderResult {
  axis: IdeaAxis;
  /** 位置漂移、已用新偏移与新原文修正过的锚点，用于回写后端 */
  drifted: IdeaAnchor[];
}
