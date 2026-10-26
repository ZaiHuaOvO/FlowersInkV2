# 花墨主站 · 设计系统迁移计划

> 规则见 `DESIGN.md`，证据见 `design-system-audit.md`，流程见 `design-system-governance.md`。
> 每个批次独立可回滚；一批做完再开下一批。

## 批次状态

| 批次 | 内容 | 风险 | 状态 |
|---|---|---|---|
| 0 | 建立规范入口与文档体系 | 极低 | ✅ 完成 |
| 1 | Token / Base 层收敛（不改页面外观） | 低 | ✅ 完成 |
| 2 | 公共组件与状态补齐 | 低 | ✅ 完成 |
| 3 | 样式加载顺序调整 + 清理冗余 `!important` | 中高 | ✅ 完成（改用 `@layer vendor`，非反转顺序） |
| 4 | 重复样式归并 + 可点元素语义化 | 中 | ✅ 完成 |
| 5 | 代表页面迁移（`/link` → `/about` → `/blog` 列表） | 中高 | ✅ 完成（并扩展到全部一级页面外壳） |
| 6 | 状态、动效与清理项收尾 | 低 | ✅ 完成 |
| 7 | 自动化与终检 | 低 | ✅ 完成 |

---

## 0. 规范入口与文档

- 新增根 `DESIGN.md`、`PRODUCT.md`。
- `frontend-reuse-governance-draft.md` → `design-system-governance.md`（v1.0，Active）。
- 新增 `design-system-audit.md`、`design-system-migration-plan.md`。
- `frontend-reuse-execution-handbook.md` 改为归档说明。
- `AGENTS.md` 瘦身：设计细则改为指向 `DESIGN.md`，保留跨项目与工程约束。

验收：只读 `AGENTS.md` + `DESIGN.md` 即可定位 token、组件、例外与验证命令。

## 1. Token / Base 收敛

- token 互为引用（`--fi-bg` / `--fi-surface` / 文本三档）避免同值漂移。
- 移除无人引用且与 `--fi-form-border` 重复的 `--fi-input-border-color`。
- 补两档缺失字号（`--fi-font-size-2xs` 11px、`--fi-font-size-3xl` 20px）供越界值归位。
- `fi-card.css` / `fi-tag.css` / `fl-button` 中的裸色值换成 token。
- 新增共享类 `.fi-screen`（`min-height: 100dvh` + `100vh` 兜底），替换各页重复的 `calc(100vh - 48px)` 写法。
- `/design` 同步：新增 token 进 `design-tokens.data.ts`。

验收：改 `--fi-primary` / `--fi-bg-page` / `--fi-radius-md` 能联动全站；`/design` 自动跟随；外观零变化。

## 2. 公共组件与状态

- `fi-form.css` 移动端控件 40px → 44px（2026-10-02 已拍板）。
- `fl-button` 删除重复的 `:active::after` 块。
- `fl-tag` outline/solid 的裸色值换 token。

验收：按钮/输入框在 375 宽度下热区 ≥44px；视觉无回退。

## 3. 样式加载顺序

原计划把 ng-zorro 提到 `styles.css` 之前。实施时发现：`styles.css` 内部用 14 条 `@import` 引入 `common_ui`，而 ng-zorro 的预构建 CSS 体量远大于我们，反转顺序会让 **ng-zorro 的同权重规则全部让位**，直接改变 tag/input/alert/spin 的既有外观——属于「品牌方向变更」级别，且无法在本次逐页验证。

**本次决策**：保持顺序不变，把该问题记录为受控技术债（`design-system-governance.md` §4），并以「新增覆盖必须写明 `!important` 的原因」约束继续增长。清理只做**证明无冲突**的冗余项。

验收：`!important` 总数不增加；新增覆盖均有注释说明。

## 4. 组件归并与可点元素

- `.tag-filter-button`：changelog / heart 改为复用共享定义。
- about / donate 侧栏：提取为共享类（`.fi-side-toc` 系列）。
- 14 处 `div/span (click)`：可交互的改 `<button>`，纯展示的补 `role` + `tabindex` + 键盘处理。
- Markdown 代码复制按钮：`pre:focus-within` 时也显示。

验收：Tab 可遍历上述交互；三份重复块不再存在。

## 5. 代表页面迁移

顺序：`/link`（已用 `.fi-page`）→ `/about` → `/blog` 列表。

- 页面根节点接 `.fi-page`，删除页面内重复的容器宽度与 `min-height` 写法。
- 页面标题接 `.fi-text-title-1`，说明文字接 `.fi-text-caption`。
- 不改变视觉尺寸：只替换来源，不换值。

验收：375 / 1440 两档截图与迁移前一致；页面 CSS 行数下降。

## 6. 状态与动效收尾

- 页面级错误态（about / blog-detail / heart / link）：失败时给出文案与重试。
- `nz-spin` 补 `nzDelay="600"`，避免启动闪烁。
- 空状态统一 `flower-nodata`。
- P3 清理：`transition: all`、`rel`、缺 `alt`、`z-index` 归入 token 标尺。

验收：断网时有明确错误态；首屏加载不闪。

## 7. 自动化与终检

- 新增 `stylelint` + `npm run lint:css`（裸色值、重复声明、嵌套深度）。
- `npx impeccable detect src/` 输出归零（例外已登记）。
- `npm run build` 通过；`npm run test` 结果记录。
- 浏览器：375 / 768 / 1440 三个宽度检查首页、博客列表、博客详情、关于、友链、`/design`。

验收：构建通过、检测无未归因告警、关键页无视觉回归。

---

## 本次实施记录（2026-10-26）

### 新增

- 根目录 `DESIGN.md`、`PRODUCT.md`。
- `src/docs/ai/design-system-governance.md`（由 draft 改名升级）、`design-system-audit.md`、`design-system-migration-plan.md`（本文）。
- `common_ui/css/fi-tag-filter.css`、`common_ui/css/fi-side-toc.css`。
- `stylelint.config.mjs` + `npm run lint:css`。
- `.impeccable/config.json`（检测器忽略项，每条带原因）。

### 改名 / 归档

- `frontend-reuse-governance-draft.md` → `design-system-governance.md`（v1.0 / Active）。
- `frontend-reuse-execution-handbook.md` 重写为归档说明 + 仍然有效的决策卡。

### Token

- 新增 `--fi-code-bg` / `--fi-code-bg-top` / `--fi-code-fg`，正文与评论的代码块共用。
- 新增 `--fi-font-size-2xs`（11px）；字号阶梯顺延：`2xl` 24px → 20px，新增 `3xl` = 24px。
- 删除无人引用、且与 `--fi-form-border` 同值的 `--fi-input-border-color`。
- `--fi-bg` / `--fi-bg-soft`、四个 surface、`--fi-text` 系列改为互相引用，避免同值漂移。

### 组件

- `.tag-filter-*` 三份逐字相同的实现合并为全局 `fi-tag-filter.css`。
- about / donate 的 `.sidebar-*` 合并为全局 `fi-side-toc.css`，类名改为 `.fi-side-toc-*`。
- `fl-button` 删除重复的 `:active::after` 块；裸色值换 token。
- `fi-tabs` / `fi-dots` 支持 `<button>` 语义（补 `border:0`、`background:transparent`）。

### 交互与状态

- 9 处页面级 `nz-spin` 加 `[nzDelay]="600"`，避免启动闪烁。
- 14 处 `(click)` 挂在 `div/span` 上的元素改为 `role="button"` + `tabindex="0"` + Enter/Space 处理：
  赞赏二维码 ×2、游戏截图、点滴图片（列表与弹窗）、点滴瀑布流条目、首页滚动提示、验证码刷新、设计页 tab 与圆点（后两者直接改 `<button>`）。
- Markdown 代码复制按钮：`focus-within` 与无 hover 设备下可见。
- 表单控件移动端高度 40px → 44px（`--fi-control-height-lg`）。

### 清理

- `target="_blank"` 补 `rel="noopener"` 6 处；`game-card` 补 `alt`。
- `styles.css` 滚动条与底色改为 token / `color-mix`。

### 验证

| 项 | 结果 |
|---|---|
| `npm run build` | 通过，17s，Initial total 1.71 MB（gzip 337 kB），预算 1.8/2.2 MB |
| `npm run lint:css` | 0 error，**165 warning**（`color-no-hex` 等），作为待偿还清单 |
| `npx impeccable detect src/` | 0（例外已登记） |
| 运行态抽查 | `/about` 桌面：侧栏目录 7 项、圆点 14px、活动项主色；375 宽无横向溢出、侧栏按预期隐藏 |
| | `/changelog`：`.tag-filter-button` 为 BUTTON，底色 `#fff8f3`、主色文字、圆角 12、计数 11px —— 与原页面值一致 |
| | `/life`：筛选条同源生效；图片格 `role=button tabindex=0`；标签文案 14px（原 16px，随共享层统一） |
| | `/blog/all`：`.fi-screen` 生效，`min-height = 视口 − 48px`；移动端搜索框 44px |
| | `/design`：tab / 圆点为 BUTTON；新增「代码块」色组渲染；新 token 解析正确 |

### 本次未做（需确认后继续）

- 无遗留功能项。剩余的 81 处裸色 / 118 处裸字号集中在页面私有样式，按 `.visual` 快照逐页收敛，见下。

---

## 第二轮实施记录（2026-10-26 下午）

### 基础设施

- 新增 `scripts/visual-check.mjs`（`npm run visual`）：本机 Chrome 无头 + CDP，输出计算样式快照与桌面/移动端截图，支持 `--diff`、`--only`、`--block-api`、`--viewport-only`。**这是本项目唯一的视觉回归网**（仓库内没有 spec）。
- `@layer vendor`：ng-zorro 预构建样式进入 vendor 层，覆盖不再依赖加载顺序；`common_ui` 中 100 处 `!important` 全部移除，计算样式与移除前**零差异**。

### 组件与状态

- 新增 `flower-error-state`（文案 + 重新加载），接入首页、写作列表、写作详情、关于、点滴、友链、游戏、书籍、装备 9 处；`/life` 里那份从未接线的 `.state-card` 死代码被它取代。
- 评论标题 `h3 → h2`；博客卡片标题支持 `titleTag`（首页传 h2）；月份/条目标题 `h4 → h3`；装饰英文标签 `h6 → <p>`。

### 布局收口

- 新增 `.fi-screen`（`100dvh − 48px`，带 `100vh` 兜底）与 `.fi-page--flush`（满宽外壳 + 移动端外边距）；
  写作列表、写作详情、友链、游戏、书籍、装备、更新记录 7 个页面的重复外壳（4 行 CSS + 移动端覆盖）全部换成这两个类，逐页 diff **零差异**。

### 语义 token

- 新增 `--fi-z-*`（7 个层叠档，数值与线上现状一致，替换 11 处魔数后零差异）。
- 新增 `--fi-badge-gold / -gold-strong / -gray`：游戏分类角标、书籍状态角标原本是散落的 `#c4a06d / #c79664 / #8a8a8a`，白字只有 2.4~3.5:1。

### 视觉问题修复

- 角标 3.4:1 → 约 7:1；`.fi-note` 文字 5.86:1；首页滚动提示 2.8 → 5.12:1；ng-zorro 次要文字 3.3 → 5.12:1；退役装备 2.0 → 5.86:1；不推荐游戏卡片 3.9 → ≥4.5:1；`/donate` 补静态 SEO 外壳。

### 验证

| 项 | 结果 |
|---|---|
| `npm run build` | 通过，1.72 MB / gzip 338 kB |
| `npm run lint:css` | 0 error / 165 warning |
| `detect src/` | 0 |
| `detect <url>`（9 个路由） | 仅剩：奶油底（品牌）、占位符 3.2:1（例外）、设计页嵌套卡片示例、热力图 9px 刻度（例外）、接口下发的身份标签配色 |
| `visual-check --diff` | 每一批改动前后比对：除预期项外**零差异**；7 个页面外壳迁移与 `!important` 移除均为零差异 |
| 截图人工验收 | 12 个路由 × 桌面/移动端首屏逐张查看；错误态用 `--block-api` 实测
