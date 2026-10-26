# 花墨主站 · 设计规范（DESIGN.md）

> 这是**唯一**的设计规则入口。动任何视觉相关代码之前先读这一份，再读要改的那个文件。
> 这里写「怎么用、什么时候用、什么不要做」；**具体的值一律以 CSS 里的 token 为准**，本文不复制数值，避免第二份会过期的数据表。
>
> 可视化版本：站内 `/design`。产品背景：`PRODUCT.md`。详细治理与流程：`src/docs/ai/design-system-governance.md`。
> 审计证据与例外登记：`src/docs/ai/design-system-audit.md`。

---

## 0. 可执行的硬规则

1. **颜色只用 `--fi-*` token**。页面 CSS 不写十六进制、不写 `rgb()`。确实需要一个临时色（第三方库限制、数据可视化）时，写进离它最近的共享层并说明原因。
2. **字号与字重只用 token 或语义类**。不要在页面里新造 `15px`、`11px` 这类值。
3. **间距、圆角、阴影优先 token**。布局结构尺寸（栅格、媒体查询、`calc()` 里的结构值）不受此限。
4. **先找再写**：`common_ui/css/` → `fl_ui/` → 页面现有实现。同一个视觉作用写第二遍就是错的。
5. **第二处复用必须回提**到 `fi-*.css` 或 `fl_ui/`，两个页面一起改引用。
6. **改公共 token / 组件 / 动画时，同一次改动里同步 `/design`**。新增 token 要同时加进 `pages/design/design-tokens.data.ts`（只加名字与用途）。
7. **`/design` 不许出现静态值**：颜色/间距/圆角一律 `var(--fi-*)`，组件一律 import 真实实现，页面私有 CSS 只写展示脚手架。
8. **状态要齐**：hover / focus-visible / active / disabled / loading / empty / error。缺状态比缺样式更严重。
9. **键盘与触屏同等对待**：可点元素必须是 `<button>`/`<a>`，或带 `role` + `tabindex` + Enter/Space 处理；移动端主操作触控目标 ≥ 44px。
10. **尊重 `prefers-reduced-motion`**：新增位移/循环动画不得绕过 `fi-base.css` 的兜底；Angular 触发器的减少动态在 `app.config.ts` 里处理。

---

## 1. 设计系统在哪里（四层）

| 层 | 位置 | 放什么 | 改它的代价 |
|---|---|---|---|
| Token | `src/app/common_ui/css/fi-tokens.css` | 颜色、字号、行高、字重、间距、圆角、阴影、控件高度、动效时长/曲线/抬升、安全区 | 改一处影响全站，必须在浏览器里逐页看 |
| Base | `fi-base.css` | reset、全局排版、`.fi-text-*` 语义类、utility、焦点环、reduced-motion 兜底、图片淡入 | 影响全站排版，风险中等 |
| Component | `fi-card/tag/form/alert/tabs/dots/timeline/layout/overrides/markdown-*.css`、`comment.css`、`fl_ui/*` | 跨页面复用的块与 ng-zorro 覆盖 | 影响使用它的每一页 |
| Feature | 各页面/组件自己的 `.component.css` | 只放页面独有的布局与业务表达 | 只影响自己 |

命名约定：`--fi-*` 是 token，`.fi-*` 是共享类，`fl*` 是 Angular 指令/组件，无前缀的是页面私有。

**样式引入顺序**：`src/styles.css` 第一行以 `@import ... layer(vendor)` 引入 ng-zorro 的预构建样式，其余全部是未分层样式。**未分层规则永远胜过分层规则**，所以覆盖不依赖加载顺序，也**不再需要用 `!important` 去压 ng-zorro**（细节见治理文档 §4）。

---

## 2. 颜色

- **品牌色只有一个**：`--fi-primary` 及其 hover / active / outline 三态。不要再引入第二种品牌色。
- **语义色成对使用**：`--fi-success/-warning/-danger/-info` 是**大色块/图标**色，各自的 `-bg` 是浅底。语义色**不能直接当正文色**（warning 压在自身浅底上只有 2.49:1）；提示框的正文由 `fi-alert.css` 用 `color-mix` 压暗后给出。
- **文字只从文字层取**：`--fi-text-heading` / `--fi-text-body` / `--fi-text-caption`（等价 `--fi-text-muted`）/ `--fi-text-inverse`。
- **表面三层**：页面底（`--fi-bg-page`）→ 容器/卡片（`--fi-surface` / `--fi-card-bg`）→ 浮层（`--fi-bg-elevated`）。三者当前同色，靠边框与阴影区分层级，**不要靠再加一层更深的背景**。
- **状态不能只靠颜色**：成功/失败/待审必须同时有文字或图标。
- 对比度底线：正文 ≥ 4.5:1，大字号 ≥ 3:1。占位符当前 3.18:1，是已知的、可接受的下限，不要再降低。

---

## 3. 排版

- 字号阶梯只有六档（`xs/sm/md/lg/xl/2xl`）。桌面正文用 `md`，长文正文用 `lg`。
- 语义类优先：标题 `.fi-text-title-1/-2`，正文 `.fi-text-body`，说明 `.fi-text-caption`，强调 `.fi-text-strong`，链接 `.fi-text-link`，品牌色强调 `.fi-primary-text`。**不要为强调另写 font-weight/color**。
- 长文（Markdown 正文）自成一套，由 `markdown-zaihua.css` 统一负责：正文 16px / 行高 1.8，标题层级小于页面标题，作用域挂在 `#currentAnchor`。改它等于改所有文章，必须抽查代码块、表格、图片、引用四种元素。
- 中英文混排依赖自托管可变字体：Inter（西文）、Noto Sans SC（按用字切 14 片）、Noto Emoji。**不要加 Google Fonts 外链**。
- 移动端：正文阅读字号 16px（长文），元信息（时间、字数、来源）维持 `sm`=13px。

---

## 4. 间距、版式与表面

- 间距九档（4→52px）。卡片内部常用 `space-3/4`，卡片之间 `space-4/5`，分区之间 `space-6/7`，页面级 `space-7/8`。
- 页面容器：标准 `.fi-page`（`--fi-page-max`）/ 窄版 `.fi-page--narrow`（`--fi-page-max-narrow`）/ 双栏 `.fi-page-sidebar-layout`（侧栏 `clamp(304px, 24vw, 316px)`）/ 铺满外壳 `.fi-page--flush`（不限宽，只给外边距）。页面主列写 `min(var(--fi-page-max), 100%)`，**不要写 `min(70vw, …)`**——平板段会两侧空一大片。
- 视口高度：页面最外层同时挂 `.fi-screen`（`min-height: 100dvh − 48px`，带 `100vh` 兜底），不要每页自己写 `calc(100vh - 48px)`。
- 层叠：跨组件的那几层用 `--fi-z-float/--fi-z-sticky/--fi-z-scrim/--fi-z-popover/--fi-z-popover-raised/--fi-z-toast`；页面内部的 1~5 留在组件里。
- 圆角五档 + 两个历史例外（`--fi-input-radius`、`--fi-tag-radius`）。`--fi-radius-pill` 只给标签与圆形头像容器。
- 阴影三档：静态卡片 `soft`、默认层级 `shadow`、hover 抬升 `shadow-hover`。**不要同时叠边框 + 强阴影 + 抬升**，三者选一到二。
- 不是每段内容都要包卡片：内容分组用间距和标题，卡片只用于可点击的独立单元。

---

## 5. 组件与状态

| 组件 | 用法 | 状态 |
|---|---|---|
| `fl-button` | `variant` outline/solid/ghost × `size` sm/md/lg × `disabled` × `block`；可直接 `routerLink` | hover 抬升 `--fi-motion-lift`、active 归位、focus-visible 外环、disabled 0.58 透明 |
| `fl-input` / `nz-input` | 输入框、文本域、select 的统一样式 | hover / focus 环 / disabled / 错误态由 `fi-form.css` 给 |
| `fl-card` / `flCardHover` | 静态卡片 / 可悬浮卡片 | hover：抬升 2px + 阴影升级 + 底色变化 |
| `fl-tag` | soft（默认）/ outline / solid；`flTagInteractive` 才可交互 | hover 变色；只有可交互时才抬升 |
| `fl-alert` | soft / outline / solid × 4 语义 | 标题用压暗语义色，正文统一 `--fi-text-body` |
| `fl-comment-*` | 评论区（内容 / 卡片 / 编辑器 / 看板） | 样式集中在 `comment.css`，三处渲染共用一套 |
| 时间轴 / 切换条 / 圆点 | `.fi-simple-timeline` / `.fi-tab-bar` / `.fi-dots` | 圆点跟随主色；切换条需可键盘操作 |

- 触控目标：主操作按钮与输入框移动端 ≥ 44px；图标小按钮视觉可小，热区必须放大。
- 焦点环：全局 `:focus-visible` 给 `a/button/summary/[role=button]/[tabindex]` 与 ng-zorro 控件；自定义组件若 `outline: 0`，必须补 `box-shadow` 环。
- 加载：全站统一 `nz-spin` + 「死机」动图；页面级加载加 `[nzDelay]="600"`，避免一闪而过。
- 空状态：整页/整块用 `flower-nodata`；列表或侧栏内用 `.fi-empty-note`。
- 错误必须可区分于「没有数据」，并给重试入口——统一用 `flower-error-state`（`message` + `retry`），不要每页自己写。

---

## 6. 动效

- 三档时长（fast/normal/slow）+ 一条缓动 `--fi-ease-standard`。Angular 触发器在 `common_ui/animations/animation.ts` 里另存同一组常量（Web Animations API 不认 CSS 变量），`/design` 动效章节是两边的对照表。
- 入场：页面主体 20px 上浮 + 淡入；侧栏晚半拍。**不再加路由转场**（懒加载 + 页面自入场已是这套架构的正解）。
- 不做：滚动揭示（会推迟已加载内容的可见时间）、无限环境动画（现有 4 个已足够）、纯装饰弹跳。
- 回弹曲线（`cubic-bezier(0.34,1.56,0.64,1)`）**只用于「弹出来」的语义**：想法气泡、点赞爆发。其他地方用 `--fi-ease-standard`。
- 循环/位移动画必须被 `fi-base.css` 的 `prefers-reduced-motion` 覆盖；Angular 侧的减少动态由 `app.config.ts` 关闭。

---

## 7. 响应式

- 四档断点，**只能硬编码**（`@media` 不接受 `var()`）：480 小屏手机 / 768 手机平板分界（与 `WindowService.isMobile` 对齐）/ 1024 过渡 / 1200 宽屏。
- 移动端用 `@media` 覆盖同一个类，**不要**再造一套 `.mobile-*` 前缀类（历史遗留的 `.mobile-nav-*`、`.mobile-tag-*` 属允许例外，新增不要跟随）。
- 安全区：`--fi-safe-top/right/bottom/left` 来自 `env(safe-area-inset-*)`，`index.html` 已开 `viewport-fit=cover`；固定定位的头部、回顶、底部提示必须计入安全区。
- 必测宽度：375 / 768 / 1024 / 1440。

---

## 8. 可访问性

- 所有可点元素可键盘到达、可 Enter/Space 触发、有可读名称（图标按钮补 `aria-label`）。
- 图片必须有 `alt`（纯装饰用 `alt=""`）；图片默认 `loading="lazy" decoding="async"`。
- 语义结构：页面唯一 `h1`，标题层级不跳级；导航用 `<nav>`，主内容用 `<main>`。
- 不用颜色单独传达状态；不把静态内容做成「看起来可点」。
- 触屏上不能只有 hover 才能发现的功能（代码块复制按钮、友链评价气泡都属此类，需提供触屏路径）。

---

## 9. 品牌例外（通用检测器会报，但**不要改**）

| 例外 | 原因 | 处理 |
|---|---|---|
| Inter 字体 | 有意选定并自托管（14 片中文按用字切分），换掉会重新引入外链与阻塞 | `overused-font` 忽略 |
| 奶油底 `#fff8f3` | 品牌底色，不是模板化米色 | `cream-palette` 忽略 |
| 棕金主色 `#8b5a2b` | 唯一品牌色 | `ai-color-palette` 忽略 |
| 引用块左侧粗描边 | Markdown 引用的经典表达（VitePress / Typora 取向），全站仅此一处语义 | `side-tab` 忽略 |
| 想法气泡回弹、点赞爆发 | 有明确的「弹出」语义，不是装饰 | `bounce-easing` 局部忽略 |
| Markdown 图片默认 70% 宽 | 文章排版决定，正文可显式覆盖 | 不处理 |
| 入场轻微上浮 20px | 2026-10-02 已拍板 | 不处理 |
| 表单占位符 3.2:1 | 再压深会与输入内容分不清；输入后即消失 | 保持 |
| 热力图月份刻度 9px | 对齐 11px 单元格，放大即错位；属图表刻度 | 保持 |
| 身份标签底色（`#c06078` 等） | 由 ERP 接口下发，管理员配色 | 主站不改色；在 ERP 侧限调色板 |

新增例外必须同时写进 `src/docs/ai/design-system-audit.md` 的例外表，并注明忽略方式。

---

## 10. 新增/修改 UI 的流程

1. 读本文 → 打开 `/design` 对应章节，确认有没有现成件。
2. 搜 `common_ui/css/`、`fl_ui/`、相邻页面。
3. 用现有 token / 语义类 / 组件写第一版。
4. 确实表达不了，才新增 token 或组件；同时补 `/design` 与 `design-tokens.data.ts`。
5. 状态补齐（hover/focus/active/disabled/loading/empty/error）。
6. 跑 `npm run build`、`npm run lint:css`，在 375 与 1440 宽度各看一遍。
7. 交付说明写清：复用了什么、新增了什么、为什么不能复用、验证了什么。

---

## 11. 文档地图

| 文档 | 职责 |
|---|---|
| `DESIGN.md`（本文） | 设计规则单一入口，开发者与 AI 必读 |
| `PRODUCT.md` | 稳定的产品事实，不含视觉规则 |
| `AGENTS.md` | Agent 行为约束、命令、跨项目约定 |
| `src/docs/ai/design-system-governance.md` | 分层职责、复用与回提流程、审查清单、变更顺序 |
| `src/docs/ai/design-system-audit.md` | 本次体检证据、检测器基线、例外登记 |
| `src/docs/ai/design-system-migration-plan.md` | 分阶段迁移批次与验收状态 |
| `/design` 页面 | 规则的可运行展示；改公共层必须同步 |
