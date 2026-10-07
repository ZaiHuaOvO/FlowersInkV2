/**
 * 设计系统页的元数据 —— 只放「名字 + 用途」，不放值。
 *
 * 值一律由页面在运行时用 getComputedStyle 从 `:root` 读出来，
 * 色块与示例也一律用 `var(--fi-*)` 上色。
 * 这样改 `fi-tokens.css` 时本页会**自动跟着变**，不需要来回同步；
 * 新增 token 也只需要往下面的数组里加一行。
 *
 * 维护约定见 `FlowersInkV2/AGENTS.md` 的「前端复用治理规则」第 9~11 条。
 */

export type TokenKind =
  | 'color'
  | 'shadow'
  | 'length'
  | 'radius'
  | 'fontSize'
  | 'fontWeight'
  | 'motion';

export interface DesignToken {
  /** CSS 变量名，含 `--` 前缀 */
  name: string;
  /** 一句话说明「什么时候用它」 */
  usage: string;
  kind: TokenKind;
}

export interface DesignTokenGroup {
  id: string;
  title: string;
  desc: string;
  tokens: DesignToken[];
}

/* ------------------------------------------------------------------
   分组色板
   ------------------------------------------------------------------ */

export const COLOR_GROUPS: DesignTokenGroup[] = [
  {
    id: 'color-brand',
    title: '品牌色',
    desc: '全站唯一的主色及其三态。除主色外不要再引入第二种品牌色。',
    tokens: [
      { name: '--fi-primary', usage: '主色：链接、标题高亮、选中态、强调', kind: 'color' },
      { name: '--fi-primary-hover', usage: '主色 hover', kind: 'color' },
      { name: '--fi-primary-active', usage: '主色按下', kind: 'color' },
      { name: '--fi-primary-outline', usage: '主色外发光：focus 环、选中底色', kind: 'color' },
    ],
  },
  {
    id: 'color-semantic',
    title: '语义色',
    desc: '每个语义色都成对出现：前景色 + 浅底色。底色用于提示框、标签。',
    tokens: [
      { name: '--fi-success', usage: '成功 · 前景', kind: 'color' },
      { name: '--fi-success-bg', usage: '成功 · 底色', kind: 'color' },
      { name: '--fi-warning', usage: '警告 · 前景', kind: 'color' },
      { name: '--fi-warning-bg', usage: '警告 · 底色', kind: 'color' },
      { name: '--fi-danger', usage: '错误 · 前景', kind: 'color' },
      { name: '--fi-danger-bg', usage: '错误 · 底色', kind: 'color' },
      { name: '--fi-info', usage: '信息 · 前景', kind: 'color' },
      { name: '--fi-info-bg', usage: '信息 · 底色', kind: 'color' },
    ],
  },
  {
    id: 'color-text',
    title: '文字层级',
    desc: '正文与说明文字只从这里取色。语义排版类 `.fi-text-*` 已经在内部引用了它们。',
    tokens: [
      { name: '--fi-text-heading', usage: '标题文字', kind: 'color' },
      { name: '--fi-text-body', usage: '正文字字', kind: 'color' },
      { name: '--fi-text-caption', usage: '次要 / 说明文字', kind: 'color' },
      { name: '--fi-text-inverse', usage: '深色底上的反白文字', kind: 'color' },
      { name: '--fi-text', usage: '默认文字色（等价 body）', kind: 'color' },
      { name: '--fi-text-muted', usage: '弱化文字（等价 caption）', kind: 'color' },
    ],
  },
  {
    id: 'color-surface',
    title: '背景与表面',
    desc: '页面底色 → 卡片 → 悬浮态，三层递进。',
    tokens: [
      { name: '--fi-bg-page', usage: '页面底色', kind: 'color' },
      { name: '--fi-bg-container', usage: '容器底色', kind: 'color' },
      { name: '--fi-bg-elevated', usage: '浮起表面（弹层）', kind: 'color' },
      { name: '--fi-surface', usage: '卡片 / 按钮默认底色', kind: 'color' },
      { name: '--fi-surface-soft', usage: 'hover 底色', kind: 'color' },
      { name: '--fi-card-bg', usage: '卡片默认底色', kind: 'color' },
      { name: '--fi-card-bg-hover', usage: '卡片 hover 底色', kind: 'color' },
    ],
  },
  {
    id: 'color-border',
    title: '边框',
    desc: '两档。`--fi-border` 偏冷、用于中性分隔；`--fi-border-strong` 偏暖、用于强调描边。',
    tokens: [
      { name: '--fi-border', usage: '默认描边 / 分隔线', kind: 'color' },
      { name: '--fi-border-strong', usage: '强调描边（hover、时间轴线）', kind: 'color' },
    ],
  },
];

/* ------------------------------------------------------------------
   标尺
   ------------------------------------------------------------------ */

export const SPACING: DesignToken[] = [
  { name: '--fi-space-1', usage: '图标与文字之间', kind: 'length' },
  { name: '--fi-space-2', usage: '紧凑内边距', kind: 'length' },
  { name: '--fi-space-3', usage: '卡片内边距', kind: 'length' },
  { name: '--fi-space-4', usage: '常用内边距、按钮之间的间距', kind: 'length' },
  { name: '--fi-space-5', usage: '卡片之间的间距', kind: 'length' },
  { name: '--fi-space-6', usage: '分区之间的间距', kind: 'length' },
  { name: '--fi-space-7', usage: '大分区之间的间距', kind: 'length' },
  { name: '--fi-space-8', usage: '页面级留白', kind: 'length' },
  { name: '--fi-space-9', usage: '首屏留白', kind: 'length' },
];

export const RADII: DesignToken[] = [
  { name: '--fi-radius-xs', usage: '小圆角：按钮、输入框相邻元素', kind: 'radius' },
  { name: '--fi-radius-sm', usage: '按钮 / tab 选中态', kind: 'radius' },
  { name: '--fi-radius-md', usage: '卡片默认圆角', kind: 'radius' },
  { name: '--fi-radius-lg', usage: '大块容器 / 弹层', kind: 'radius' },
  { name: '--fi-radius-pill', usage: '胶囊：标签、圆形头像容器', kind: 'radius' },
  // 下面两个是历史遗留的例外，不在 8/10/14/18/999 这套标尺上
  { name: '--fi-input-radius', usage: '输入框圆角（历史例外值）', kind: 'radius' },
  { name: '--fi-tag-radius', usage: '标签圆角（历史例外值）', kind: 'radius' },
];

export const SHADOWS: DesignToken[] = [
  { name: '--fi-shadow-soft', usage: '静态卡片', kind: 'shadow' },
  { name: '--fi-shadow', usage: '默认层级', kind: 'shadow' },
  { name: '--fi-shadow-hover', usage: 'hover 抬升', kind: 'shadow' },
];

export const LAYOUT_TOKENS: DesignToken[] = [
  { name: '--fi-page-max', usage: '标准页面最大宽度（.fi-page）', kind: 'length' },
  { name: '--fi-page-max-narrow', usage: '窄版最大宽度（.fi-page--narrow）', kind: 'length' },
  { name: '--fi-control-height-sm', usage: '小号控件高度', kind: 'length' },
  { name: '--fi-control-height-md', usage: '中号控件高度', kind: 'length' },
  { name: '--fi-control-height-lg', usage: '大号控件高度（移动端触控下限 44px）', kind: 'length' },
];

/* ------------------------------------------------------------------
   排版
   ------------------------------------------------------------------ */

export const FONT_SIZES: DesignToken[] = [
  { name: '--fi-font-size-xs', usage: '角标、极小说明', kind: 'fontSize' },
  { name: '--fi-font-size-sm', usage: '说明文字、元信息', kind: 'fontSize' },
  { name: '--fi-font-size-md', usage: '正文', kind: 'fontSize' },
  { name: '--fi-font-size-lg', usage: '正文强调 / 移动端正文字号', kind: 'fontSize' },
  { name: '--fi-font-size-xl', usage: '小节标题', kind: 'fontSize' },
  { name: '--fi-font-size-2xl', usage: '页面标题', kind: 'fontSize' },
];

export const FONT_WEIGHTS: DesignToken[] = [
  { name: '--fi-font-weight-light', usage: '300 轻', kind: 'fontWeight' },
  { name: '--fi-font-weight-regular', usage: '400 常规', kind: 'fontWeight' },
  { name: '--fi-font-weight-medium', usage: '500 中等：导航、标签', kind: 'fontWeight' },
  { name: '--fi-font-weight-semibold', usage: '600 半粗：卡片标题', kind: 'fontWeight' },
  { name: '--fi-font-weight-bold', usage: '700 粗：页面标题', kind: 'fontWeight' },
];

export const LINE_HEIGHTS: DesignToken[] = [
  { name: '--fi-line-height-tight', usage: '标题行高 1.25', kind: 'length' },
  { name: '--fi-line-height-normal', usage: '常规行高 1.5', kind: 'length' },
  { name: '--fi-line-height-relaxed', usage: '长文行高 1.75', kind: 'length' },
];

export const FONT_FAMILIES: DesignToken[] = [
  { name: '--fi-font-base', usage: '正文：Inter + Noto Sans SC + Noto Emoji（自托管）', kind: 'length' },
  { name: '--fi-font-mono', usage: '等宽：JetBrains Mono → Fira Code → Consolas', kind: 'length' },
];

/* ------------------------------------------------------------------
   动效标尺
   ------------------------------------------------------------------ */

export const MOTION_DURATIONS: DesignToken[] = [
  { name: '--fi-motion-fast', usage: 'hover / focus 等即时反馈', kind: 'motion' },
  { name: '--fi-motion-normal', usage: '卡片、下拉、抽屉、入场', kind: 'motion' },
  { name: '--fi-motion-slow', usage: '较长的过渡与列表错走', kind: 'motion' },
];

export const MOTION_EASES: DesignToken[] = [
  { name: '--fi-ease-standard', usage: '全站统一缓动：起步快、末尾极慢地安定下来', kind: 'motion' },
];

export const MOTION_LIFTS: DesignToken[] = [
  { name: '--fi-motion-lift', usage: '通用 hover 抬升（导航、按钮、子菜单）', kind: 'motion' },
  { name: '--fi-motion-lift-card', usage: '卡片 hover 抬升', kind: 'motion' },
  { name: '--fi-motion-lift-emoji', usage: '表情格子 hover 抬升', kind: 'motion' },
];

/**
 * 页面上实际在用的 Angular 触发器（`common_ui/animations/animation.ts`）。
 *
 * `duration` 一栏写的是「相对 token」的说明而不是具体毫秒 ——
 * 因为 Angular 的 animate() 走 Web Animations API，不接受 CSS 变量，
 * 所以 animation.ts 里复写了一份常量。这一节的作用就是把两边摊开对照。
 */
export interface MotionTrigger {
  name: string;
  trigger: string;
  usage: string;
  duration: string;
}

export const MOTION_TRIGGERS: MotionTrigger[] = [
  { name: 'QuickUp', trigger: 'QuickUp', usage: '页面主体入场：下方 20px 上浮 + 淡入', duration: 'normal' },
  { name: 'QuickDown', trigger: 'QuickDown', usage: '头部下拉入场', duration: 'normal' },
  { name: 'SlowUp', trigger: 'SlowUp', usage: '侧栏 / 分区入场，比 QuickUp 晚半拍', duration: 'normal + normal 延迟' },
  { name: 'SlowDown', trigger: 'SlowDown', usage: '从上方下坠入场，带延迟', duration: 'normal + normal 延迟' },
  { name: 'RefreshUp', trigger: 'RefreshUp', usage: '列表筛选变化后重放（article / heart）', duration: 'normal' },
  { name: 'StaggerList', trigger: 'StaggerList', usage: '列表逐条错走入场，前 12 项生效', duration: 'slow / 每条 +60ms' },
  { name: 'FadeSlide', trigger: 'FadeSlide', usage: '回复框等表单区展开收起', duration: 'normal 进 / fast 出' },
  { name: 'ExpandCollapse', trigger: 'ExpandCollapse', usage: '展开更多评论（高度动画）', duration: 'normal' },
  { name: 'PopoverIn', trigger: 'PopoverIn', usage: '段落想法浮窗进出（含轻微缩放）', duration: 'normal 进 / fast 出' },
  { name: 'BubbleIn', trigger: 'BubbleIn', usage: '「写想法」气泡弹出（回弹曲线）', duration: 'fast' },
];

/**
 * 已实现但当前**没有页面引用**的触发器与 keyframes。
 *
 * 按 2026-10-07 的决策保留备用，不当作死代码删除；
 * 这里列出来就是为了让它们有据可查、可现场预览，而不是躺在源码里当疑似垃圾。
 */
export const MOTION_UNUSED: MotionTrigger[] = [
  { name: 'QuickLeft', trigger: 'QuickLeft', usage: '从左往右快速滑入（备用）', duration: 'normal' },
  { name: 'QuickRight', trigger: 'QuickRight', usage: '从右往左快速滑入（备用）', duration: 'normal' },
  { name: 'SlowLeft', trigger: 'SlowLeft', usage: '从左往右慢滑，带延迟（备用）', duration: 'slow' },
  { name: 'SlowRight', trigger: 'SlowRight', usage: '从右往左慢滑，带延迟（备用）', duration: 'slow' },
  { name: 'SlideEnter', trigger: 'SlideEnter', usage: '方向感知滑动，靠 params.offset 控制方向（备用）', duration: 'normal' },
];

/** 断点是硬编码约定，不是 token —— CSS 的 @media 不接受 var()，所以只能写死在注释里 */
export const BREAKPOINTS = [
  { value: '480px', usage: '小屏手机：网格收单列、间距收紧' },
  { value: '768px', usage: '手机 / 平板分界，与 WindowService.isMobile 对齐（主导断点）' },
  { value: '1024px', usage: '中间过渡：卡片元信息堆叠' },
  { value: '1200px', usage: '宽屏：侧栏收拢、桌面网格' },
];

/* ------------------------------------------------------------------
   语义排版类
   ------------------------------------------------------------------ */

export interface TypeSpec {
  className: string;
  usage: string;
  sample: string;
}

export const TEXT_CLASSES: TypeSpec[] = [
  { className: 'fi-text-title-1', usage: '页面级标题', sample: '花墨 · 页面级标题' },
  { className: 'fi-text-title-2', usage: '分区级标题', sample: '分区级标题' },
  { className: 'fi-text-body', usage: '段落正文', sample: '正文段落。写作时优先用这个类，不要临时写 font-size。' },
  { className: 'fi-text-caption', usage: '次要 / 说明文字', sample: '次要说明文字，例如时间、字数、来源' },
  { className: 'fi-text-strong', usage: '行内强调（继承父级字号）', sample: '这段里有强调的部分' },
  { className: 'fi-text-link', usage: '链接样式的文本', sample: '链接文本样式' },
  { className: 'fi-primary-text', usage: '品牌色强调文字', sample: '品牌色强调' },
];

/* ------------------------------------------------------------------
   展示用的自带示例 Markdown（第 13 节用真实 <markdown> 渲染）
   ------------------------------------------------------------------ */

export const MARKDOWN_SAMPLE = `
## 二级标题

正文段落。花墨的正文排版由 \`markdown-zaihua.css\` 统一负责，作用域挂在 \`#currentAnchor\` 上，
所以本页用同一个 id 即可复现博客详情页的真实观感 —— 而不是手写一份"长得像"的复刻。

### 三级标题

普通段落里可以包含 **加粗**、*斜体*、\`行内代码\` 和 [站内链接](/blog/article)。

> 引用块。左侧的装饰线与文字色都由主题统一给出。

无序列表：

- 第一项
- 第二项，带一点补充 \`inline\`
  - 嵌套的子项

有序列表：

1. 第一步
2. 第二步

代码块：

\`\`\`typescript
interface DesignToken {
  name: string;
  usage: string;
}

export function readToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}
\`\`\`

表格：

| 层级 | 存放位置 | 典型例子 |
| --- | --- | --- |
| Token | \`fi-tokens.css\` | \`--fi-primary\` |
| Base | \`fi-base.css\` | \`.fi-text-title-1\` |
| Component | \`fi-*.css\` + \`fl_ui/*\` | \`fl-button\` |
| Feature | 页面私有 CSS | \`.hero-row\` |

---

最后一段：分割线以上是正文排版的全部元素。
`;
