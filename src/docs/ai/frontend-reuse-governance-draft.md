# FLOWERSINK 前端复用治理草案（v0.2）

## 文档信息

- 版本：`v0.2`
- 状态：`Partial Implemented`
- 适用范围：`FLOWERSINK 前端（flower-ink-erp / FlowersInkV2）`
- 维护原则：仅记录长期有效规范，不记录一次性需求

## v0.2 变更记录

- `fi-tokens.css`（主站 & ERP）已补齐功能色、语义文本/背景/边框色、字号阶梯、行高、字重、控件高度 token
- `fi-base.css`（主站 & ERP）已新增排版语义类 `.fi-text-title-1` / `.fi-text-body` / `.fi-text-caption` / `.fi-text-strong` / `.fi-text-link`
- ERP `styles.css` 已拆分为 `fi-tokens.css` / `fi-base.css` / `fi-overrides.css` 三层
- AGENTS.md 已增加复用治理规则和审查清单
- 实际目录路径为 `app/common_ui/css/`（非草案初始建议的 `styles/`）
- `--fi-*` 命名前缀已确认作为永久命名约定

---

## 1. 文档目标

这份文档用于建立前端“可复用、可维护、可扩展”的统一规范，解决以下问题：

- 相同/相似样式在多个页面重复定义
- 颜色、字体、间距等基础视觉参数分散，改版成本高
- 按钮、标签、输入框等组件风格不一致
- AI 或人工开发时缺少统一约束，导致代码持续膨胀

最终目标：

- 通过少量 Design Token（如颜色变量）可联动全站视觉
- 通过统一基础样式层减少重复 CSS
- 通过共享组件和规范化目录提升复用率
- 为 AI 开发提供“先复用后新增”的执行规则

---

## 2. 设计系统分层（必须遵守）

采用 4 层结构，禁止跨层混用职责：

1. Token 层（全局变量）
   - 只定义设计变量：颜色、字体、字号、间距、圆角、阴影、层级、断点、动效时长
   - 不写具体组件样式
2. Base 层（基础样式）
   - `reset` / `normalize`
   - `typography`（标题、正文、辅助文字）
   - 常用 `utility`（布局、文本截断、间距辅助类）
   - 不包含业务语义类名（例如 `.user-order-card`）
3. Component 层（通用组件样式）
   - 按钮、标签、输入框、卡片、弹窗、表格等跨页面复用样式
   - 使用统一命名与状态体系（default / hover / active / disabled）
4. Feature 层（页面特有样式）
   - 仅放页面独有视觉差异
   - 若样式在第二个页面复用，必须回提到 Component 或 Base 层

---

## 3. 目录建议（实际落地路径）

说明：以下是落地后的实际路径，与初始草案的 `styles/` 路径不同，两个项目均使用 `app/common_ui/css/`。

```txt
src/
  app/
    common_ui/
      css/                        ← 设计 Token + 基础样式 + 组件覆盖
        fi-tokens.css             → 所有 CSS 变量（颜色、字号、间距等）
        fi-base.css               → reset、排版、语义类
        fi-card.css               → 卡片样式
        fi-tag.css                → 标签样式
        fi-alert.css              → 提示框样式
        fi-form.css               → 表单控件样式
        fi-timeline.css           → 时间线样式
        fi-overrides.css          → ERP 特有 ng-zorro 覆盖
        markdown-zaihua.css       → Markdown 文章渲染（主站）
        markdown-qklhk.css        → Markdown 文章渲染（ERP）
      fl_ui/                      ← Angular standalone 指令/组件
        fl-button/                → 按钮组件
        fl-input/                 → 输入框指令
        fl-card/                  → 卡片指令
        fl-tag/                   → 标签指令
        fl-alert/                 → 提示框指令
        README.md                 → 组件文档 + token 速查
```

**关键差异备忘：**
- 主站 = `Angular 20 standalone`，`fl_ui` 组件已可用
- ERP = `Angular 18 NgModule`，`fl_ui` 按需独立实现，不直接复制主站代码

迁移原则：

- 保持现有页面可运行，不做一次性全量搬迁
- 新需求优先用新层级，旧页面逐步迁移
- 每次迁移都应可独立回滚

---

## 4. Token 规范（核心）

### 4.1 颜色 Token（支持一键换肤基础）

实际命名前缀为 `--fi-*`（非草案初始建议的 `--color-*`），已落地。

至少定义以下语义色，不直接在业务页面写十六进制：

- 品牌色：`--fi-primary`、`--fi-primary-hover`、`--fi-primary-active`
- 功能色：`--fi-success`、`--fi-warning`、`--fi-danger`、`--fi-info`（各配 `--*-bg` 背景色）
- 文本色：`--fi-text-heading`、`--fi-text-body`、`--fi-text-caption`、`--fi-text-inverse`、`--fi-text-muted`
- 背景色：`--fi-bg-page`、`--fi-bg-container`、`--fi-bg-elevated`
- 边框色：`--fi-border`、`--fi-border-strong`
- 状态层：`--fi-primary-outline`

规则：

- 页面中禁止直接使用裸色值（例如 `#4096ff`），必须引用 token
- 粗体文字禁止单独硬编码颜色，统一走语义（强调文本 `--color-text-1` 或品牌强调色）

### 4.2 字体与字号 Token

实际命名前缀 `--fi-font-*`，已落地。

- 字体族：`--fi-font-base`、`--fi-font-mono`
- 字号阶梯：`--fi-font-size-xs`（12px）、`--fi-font-size-sm`（13px）、`--fi-font-size-md`（14px）、`--fi-font-size-lg`（16px）、`--fi-font-size-xl`（18px）、`--fi-font-size-2xl`（24px）
- 行高：`--fi-line-height-tight`（1.25）、`--fi-line-height-normal`（1.5）、`--fi-line-height-relaxed`（1.75）
- 字重：`--fi-font-weight-regular`（400）、`--fi-font-weight-medium`（500）、`--fi-font-weight-semibold`（600）、`--fi-font-weight-bold`（700）

规则：

- 标题、正文、说明文字必须映射到预设等级
- 禁止在页面内零散写随机字号值（如 `13px/15px/17px`），优先使用字号 token
- 粗体文字统一为语义类（如 `.text-strong`），避免每页各写一套

### 4.3 间距与尺寸 Token

实际命名前缀 `--fi-space-*` / `--fi-radius-*` / `--fi-shadow-*` / `--fi-control-height-*`，已落地。

- 间距：`--fi-space-1` ~ `--fi-space-8`（4/8/12/16/20/24/32/40）
- 圆角：`--fi-radius-xs`（8px）、`--fi-radius-sm`（10px）、`--fi-radius-md`（14px）、`--fi-radius-lg`（18px）、`--fi-radius-pill`（999px）
- 阴影：`--fi-shadow`、`--fi-shadow-soft`、`--fi-shadow-hover`
- 控件高度：`--fi-control-height-sm`（28px）、`--fi-control-height-md`（36px）、`--fi-control-height-lg`（44px）

---

## 5. 基础排版与文本规范（v0.2 已落地）

实际命名前缀 `.fi-text-*`，定义在 `fi-base.css`。

建立统一文字语义类：

- `.fi-text-title-1`（页面级标题：24px bold）
- `.fi-text-title-2`（区块级标题：18px semibold）
- `.fi-text-body`（正文：14px regular）
- `.fi-text-caption`（辅助文字：13px muted）
- `.fi-text-strong`（统一粗体样式：semibold heading 色）
- `.fi-text-link`（统一链接颜色与 hover）

规则：

- 页面中出现强调文本，优先使用 `.text-strong` 或组件属性，不要重新定义局部粗体类
- 标题层级（h1/h2/h3）与视觉层级一致，避免 SEO 和可访问性冲突

---

## 6. 组件统一规范（按钮、标签等）

### 6.1 按钮 Button

统一维度：

- 变体：`solid / outline / ghost`（主站 `fl-button` 已实现）
- 尺寸：`sm / md / lg`（已实现）
- 状态：`default / hover / active / disabled`（通过 token 驱动，已实现）
- 形态：`block / routerLink`（已实现）

规则：

- 业务页面不允许自定义私有按钮颜色方案，应通过 token 或按钮变体扩展
- `disabled` 必须统一透明度、鼠标态、边框与文字色

### 6.2 标签 Tag / Badge

统一维度：

- 类型：`neutral / success / warning / danger / info`
- 风格：`solid / outline / soft`
- 大小：`sm / md`

规则：

- 标签颜色使用功能色 token，不允许页面私有 hex
- 数字角标与状态标签分离，避免样式语义混乱

### 6.3 表单控件（Input / Select / Textarea）

统一：

- 高度、padding、边框、focus ring、placeholder 色
- 错误态/警告态提示样式
- 与按钮高度体系对齐

---

## 7. AI 与人工开发执行守则（关键）

每次开发前必须执行：

1. 在 `styles/tokens` 和 `styles/components` 中搜索是否已有可复用定义
2. 若已有同类样式，必须复用；禁止复制粘贴
3. 若无现成样式，先抽象为可复用模块，再在页面使用
4. 新增样式需标注归属层（token / base / component / feature）
5. 一个样式在第二处出现时，必须回提共享层

提交说明必须包含：

- 复用了哪些既有样式/组件
- 新增了哪些 token 或共享样式
- 为什么不能继续复用（如有）

---

## 8. 渐进式改造路线图（避免大爆炸）

### 阶段 A（1-2 周）：建标准，不大动业务 ✅ v0.2 已完成

- 建立 token 与 base 骨架 ✅
  - 主站 `fi-tokens.css` 补齐功能色、语义色、字号、行高、字重、控件高度
  - ERP `fi-tokens.css` 新增并拆分独立文件
  - 主站 & ERP `fi-base.css` 新增排版语义类
- 统一主色、文本色、字号、按钮基础样式 ✅
- 选 2-3 个高频页面做样板迁移 ✅（首页、博客列表、博客详情）
  - blog-detail：11 处硬编码色值 → `--fi-*` token 替换
  - blog-detail：4 处硬编码间距 → `--fi-space-*` 替换
  - blog-detail：字号/字重 → `--fi-font-size-*` / `--fi-font-weight-*` 替换
  - blog-list：时间线圆点色值 → CSS token 覆盖
- AI 治理规则 → AGENTS.md ✅

验收：

- 可通过调整 3-5 个核心颜色 token 明显改变站点风格
- 新旧页面可共存，功能不受影响

### 阶段 B（2-4 周）：组件归一

- 整理按钮、标签、输入框、卡片、弹窗样式到 component 层
- 清理重复类名和重复声明块

验收：

- 重复样式明显下降（建议目标：Top 重复块下降 40% 以上）
- 新页面默认不再新增页面私有按钮样式

### 阶段 C（持续）：治理自动化

- 增加 lint/stylelint 规则（如禁止裸色值、限制过深选择器）
- 形成 AI 代码审查清单与 PR 模板

验收：

- 新增页面复用率稳定提升
- 样式回归问题减少

---

## 9. 代码审查清单（每次改样式都要过）

- 是否使用 token，而不是硬编码色值/字号？
- 是否复用已有组件样式，而非新建重复类？
- 是否把通用样式错误放进页面私有文件？
- 是否影响现有组件状态（hover/active/disabled）一致性？
- 是否验证桌面端与移动端表现？
- 是否避免修改无关页面和无关样式？

---

## 10. 风险与边界

主要风险：

- 旧页面历史样式耦合高，迁移可能引发视觉回归
- 第三方组件库（如 ng-zorro）覆盖策略不当导致全局副作用
- 一次性改动过大导致排查困难

控制策略：

- 小步提交，按页面分批迁移
- 先引入 token，不强制立即改完所有历史样式
- 每次改造后做关键页面截图对比（可人工）

---

## 11. 第一批建议落地任务（可直接执行）

1. 创建 `styles/tokens` 并落地颜色/字体/间距 token
2. 建立 `styles/base/_typography.scss` 与统一 `.text-strong`
3. 提取按钮与标签通用样式到 `styles/components`
4. 选择两个重复最明显页面，替换为共享样式引用
5. 记录迁移前后差异（重复样式数量、修改文件数量、回归结果）

---

## 12. 文档维护规则

- 本文档只记录长期有效规范，不记录一次性需求
- 每次规范变更需要更新版本号与变更记录
- 若规范与项目现状冲突，以最小破坏、可渐进迁移为优先

建议追加：

- `CHANGELOG` 小节：记录 token 变更、组件规范调整、弃用项
- `Do / Don't` 示例小节：提高团队与 AI 执行一致性
