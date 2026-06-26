# FLOWERSINK 前端复用治理执行手册（v1.0）

> 基于 `frontend-reuse-governance-draft.md` 的阶段 A 扩展，聚焦"重复盘点样板迁移"阶段的操作规程

## 文档信息

- 版本：`v1.0`
- 状态：`Active`
- 适用范围：`FlowersInkV2（主站）— 优先 about 模块，后续扩展全站`
- 策略原则：
  1. **统一标准先行，不先搬代码** — 先定共享层的归属规则，再动手提取
  2. **以"复用提取"为主，不做视觉改版** — 提取时不改变外观，只改变来源
  3. **每次只改一个小范围，保证可回滚** — 按页面分批，每批独立提交

---

## 一、前置策略说明

### 1.1 为什么先定策略

本次治理的约束条件：
- 项目在产运行，不能停服
- 旧页面历史样式耦合高，硬搬可能引发视觉回归
- 两个项目（主站/ERP）技术栈略有不同，直接"大重构"不可行

因此核心策略是：**不改变视觉，只重组来源**。提取共享样式后，页面的渲染结果必须与之前完全一致。

### 1.2 治理范围界定

| 范围 | 说明 |
|---|---|
| 本次阶段 | 只处理 `FlowersInkV2` 主站 |
| 样板页面 | `about/me`、`about/website` |
| 后续批次 | 按周规划 2-3 个页面/批 |
| 排除 | ERP 后台、业务逻辑、接口、模板结构 |

### 1.3 验收指标

1. `about/me` + `about/website` 页面私有 CSS 行数下降 **30%+**
2. 重复声明块数下降（同名 block、同属性组合在多个文件中出现）
3. 新增页面时直接复用共享样式，不再复制旧 class
4. 改 3-5 个核心 token（如 `--fi-primary`、`--fi-bg`）可联动页面视觉

---

## 二、第一步：重复盘点（现况证据）

### 2.1 盘点方法

对每个目标页面做以下三项统计：

#### 2.1.1 重复 class 名（同名不同文件）

扫描所有 CSS 文件，找出相同 class 名在不同文件中定义的现象（即使内容不完全相同）。

**已知重复（about 模块）：**

| class 名 | 出现文件 | 差异 |
|---|---|---|
| `.fi-primary-text` | `me.component.css` 第136行 / `website.component.css` 第5行 | **完全一致**：`color: #8b5a2b; font-weight: bold` |
| `.page-title` | `me.component.css` 第18行 / `website.component.css` 第27行 | **高度相似**：`font-size: 24px; font-weight: 600; color: #8b5a2b;` |
| `.tab-bar` | `me.component.css` 第32行 / `website.component.css` 第41行 | **完全一致**：flex 居中布局 |
| `.tab` | `me.component.css` 第42行 / `website.component.css` 第51行 | **完全一致** |
| `.tab--active` | `me.component.css` 第54行 / `website.component.css` 第63行 | **完全一致** |
| `.nav-arrows` | `me.component.css` 第64行 / `website.component.css` 第73行 | **完全一致** |
| `.nav-arrow` | `me.component.css` 第74行 / `website.component.css` 第83行 | **完全一致** |
| `.update-note` | `me.component.css` 第140行 / `website.component.css` 第236行 | **结构相同**，padding 值略有差异 |
| `.dots` / `.dot` / `.dot--active` | `website.component.css` 第256行起 | 仅 `website` 中使用，`me` 中对应为 `.mobile-dots` |
| `.slide-in` / `@keyframes` | `me.component.css` 第873行 / `website.component.css` 第518行 | **完全一致** |

#### 2.1.2 重复声明块（同样的属性组合）

**模式一："flex 居中布局"**
```css
display: flex;
justify-content: center;
align-items: center;
```
出现在 `.tab-bar`（me 第32行 + website 第41行）

**模式二："flex 容器 + gap + border-radius + transition"**
出现在 `.contact-card`、`.social-card`、`.mobile-contact-card`、`.mobile-social-card`、`hobby-menu-item`
这些 card 的 border/radius/shadow/transition 组合基本一致，只是 padding 和 gap 值不同。

**模式三："page-title" 组合**
```css
text-align: center;
font-size: 24px;
font-weight: 600;
color: #8b5a2b;
```
在 me 第18行、website 第27行各出现一次。移动版 `.mobile-page-title` 也有类似组合但字号变小。

**模式四：「mobile 样式双轨制」**
所有桌面样式都对应一套 `.mobile-*` 前缀的移动版复制。这些移动版样式与桌面版结构相同，仅数值微调。

#### 2.1.3 重复 token 字面量（同色值、同间距、同字号）

| 字面量 | 出现次数 | 分布 |
|---|---|---|
| `#8b5a2b` | 10+ 次 | `.page-title`、`.tab--active`、`.fi-primary-text`、`.fi-emphasis`、`.mobile-page-title`、`.mobile-tab--active`、SVG `fill` 等 |
| `#c0b0a0` | 4 次 | `.tab`、`.mobile-tab`（me + website） |
| `#c0ad96` | 2 次 | `.contact-desc`、`.mobile-contact-desc` |
| `#d4b896` | 2 次 | `.simple-timeline::before`、`.mobile-timeline::before` |
| `#b42318` | 2 次 | `.thanks-highlight`、`.mobile-thanks-highlight` |
| `font-size: 15px` | 10+ 次 | `.hero-subtitle`、`.hero-desc`、`.hobby-menu-item`、`.hobby-pane p`、`strong`、`.section-inner p`、`.simple-timeline-date` 等 |
| `font-weight: 600` | 10+ 次 | `.page-title`、`.game-section-title`、`.contact-value`、`.mobile-contact-value`、`.social-name`、`.mobile-social-name` 等 |
| `line-height: 1.7` | 6 次 | `.hero-desc`、`.hobby-pane p`、`.mobile-hero-text p`、`.mobile-hobby-text`、`.section-inner p`、`.mobile-section p` |

### 2.2 产出表：来源文件 → 重复内容 → 建议归属层

以 `about/me` + `about/website` 为样本：

| 来源文件 | 重复内容 | 建议归属层 |
|---|---|---|
| `me/website` CSS | `.fi-primary-text { color: #8b5a2b; font-weight: bold }` | **Token** → 改为 `color: var(--fi-primary); font-weight: var(--fi-font-weight-bold)` 后保留在共享层 |
| `me/website` CSS | `.page-title` 定义 | **Base** → 用 `.fi-text-title-1` 替代 |
| `me/website` CSS | `.tab-bar` / `.tab` / `.tab--active` | **Component** → `fi-tabs` 共享组件 |
| `me/website` CSS | `.nav-arrows` / `.nav-arrow` | **Feature**（页面独有交互，仅在 about 用） |
| `me/website` CSS | `.update-note` | **Feature**（独有，不提取） |
| `me/website` CSS | `.dots` / `.dot` / `.dot--active` | **Component** → 提取为 `fi-dots` |
| `me/website` CSS | `.slide-in` / `@keyframes slideInRight/Left` | **Base** → `fi-base.css` 动画工具 |
| `me/website` CSS | `.tab--active { background: #8b5a2b }` | 改为 `var(--fi-primary)` |
| `me/website` CSS | `.contact-card` / `.social-card` | **Component** → 复用 `fl-card` + `flCardHover` |
| `me/website` CSS | `.contact-desc { color: #c0ad96 }` | 改为 `var(--fi-text-muted)`（视觉差异可接受） |
| me.website CSS | `.simple-timeline-dot { background: #8b5a2b }` | 改为 `var(--fi-primary)` |
| me.website CSS | `.simple-timeline::before { background: #d4b896 }` | 改为 `var(--fi-border-strong)` |
| me.website CSS | `.thanks-highlight { color: #b42318 }` | 改为 `var(--fi-danger)` 或保留（唯一用途） |
| me.website CSS | 全部 `font-size: 15px` | 改为 `var(--fi-font-size-lg)` 或基于语义判断 |
| me.website CSS | 全部 `font-weight: 600` | 改为 `var(--fi-font-weight-semibold)` |
| me.website CSS | `.mobile-*` 与桌面版的**结构重复** | 改为用 `@media` 条件覆盖非前缀类，消除双轨制 |

---

## 三、第二步：共享归属规则

### 3.1 四层归属定义

| 层 | 内容 | 存放文件 | 典型例子 |
|---|---|---|---|
| **Token** | 颜色、字号、间距、圆角、阴影、动效 | `css/fi-tokens.css` | `--fi-primary`、`--fi-font-size-md`、`--fi-space-4` |
| **Base** | 排版语义类、通用工具类、动画 keyframes | `css/fi-base.css` | `.fi-text-title-1`、`.fi-text-strong`、`.u-flex-center`、`@keyframes slideInRight` |
| **Component** | 跨页面复用的 UI 块 | `css/fi-*.css` + `fl_ui/*` | `.fi-tab-bar`、`.fi-card-hover`、`fl-button`、`fi-dots` |
| **Feature** | 页面独有样式 | 页面 `.component.css` | `.hero-row`（仅在 me 用）、`.simple-timeline`（仅在 website 用） |

### 3.2 关键规则

**规则一：同样式出现第 2 次，必须上提到共享层。**

- 当你在页面 A 写了一个样式，在页面 B 又要写同样的样式时，不准复制粘贴
- 必须提取到 Component 层或 Base 层，然后两个页面都引用共享版本
- 如果提取后 A/B 有细微差异，通过 CSS 变量或 modifier class 解决

**规则二：私有 CSS 只允许放业务差异。**

- `.page-title` 必须用共享的 `.fi-text-title-1`，而不是各页面自己写一套
- 唯一允许的例外是页面独有的布局结构（如 `.hero-row` 只有 `me` 用，`.simple-timeline` 只有 `website` 用）

**规则三：不写裸 token 值。**

- 颜色用 `--fi-primary`，不用 `#8b5a2b`
- 字号用 `--fi-font-size-lg`，不用 `15px`
- 字重用 `--fi-font-weight-semibold`，不用 `600`
- 间距用 `--fi-space-4`，不用 `16px`

**规则四：移动端用媒体查询覆盖，不用独立前缀。**

- ❌ 禁止设计模式：桌面用 `.tab`，移动用 `.mobile-tab`
- ✅ 正确模式：一律用 `.tab`，在 `@media (max-width: 768px)` 内调整 `.tab` 的值

### 3.3 共享文件映射表

| 共享名 | 归属层 | 提取来源 | 目标文件 |
|---|---|---|---|
| `.fi-primary-text` | Token（改为引用变量） | `me` + `website` CSS | 删除，改用 `color: var(--fi-primary)` + `.fi-text-strong` |
| `.fi-text-title-1` | Base（已有） | 直接使用 | 已有 `fi-base.css` |
| `.fi-tab-bar` / `.fi-tab` / `.fi-tab--active` | Component | `me` + `website` | 新建 `css/fi-tabs.css` |
| `.fi-dots` / `.fi-dot` / `.fi-dot--active` | Component | `website` CSS | 新建 `css/fi-dots.css` |
| `@keyframes slideInRight/Left` | Base | `me` + `website` | `fi-base.css` |
| `.fi-contact-card` | Component | `me` CSS | `css/fi-card.css`（已有扩展） |
| `.simple-timeline` | Feature | `website` CSS | 留在 `website.component.css` |

---

## 四、第三步：样板迁移（about 模块）

### 4.1 迁移范围

| 文件 | 操作类型 | 行数变化预期 |
|---|---|---|
| `about/me/me.component.css` | 缩减（提取 + 清理） | 902 行 → ~600 行 |
| `about/website/website.component.css` | 缩减（提取 + 清理） | 547 行 → ~350 行 |
| `about/message/message.component.css` | 微调（token 替换） | 82 行 → ~70 行 |
| `css/fi-tabs.css` | **新增** | ~50 行 |
| `css/fi-dots.css` | **新增** | ~40 行 |
| `css/fi-base.css` | 追加（keyframes + utility） | 已有文件扩充 |
| `css/fi-tokens.css` | 无需改动 | 已有 |

### 4.2 具体提取清单

#### 4.2.1 提取到 `css/fi-tabs.css`（新建）

从 `me` 和 `website` 中提取的通用 tab 样式：

```css
.fi-tab-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0;
  padding: var(--fi-space-2) 0 var(--fi-space-3);
  user-select: none;
  flex-shrink: 0;
}

.fi-tab {
  padding: 4px var(--fi-space-4);
  color: var(--fi-text-muted);
  font-family: var(--fi-font-base);
  font-size: var(--fi-font-size-lg);
  font-weight: var(--fi-font-weight-medium);
  transition: all var(--fi-motion-fast) var(--fi-ease-standard);
  cursor: pointer;
  user-select: none;
  line-height: 1.4;
}

.fi-tab--active {
  background: var(--fi-primary);
  color: #fff;
  border-radius: var(--fi-radius-sm);
}
```

#### 4.2.2 提取到 `css/fi-dots.css`（新建）

```css
.fi-dots {
  display: flex;
  justify-content: center;
  gap: var(--fi-space-2);
  flex-shrink: 0;
  padding-top: var(--fi-space-3);
}

.fi-dot {
  width: 8px;
  height: 8px;
  border: none;
  border-radius: 50%;
  background: var(--fi-border);
  cursor: pointer;
  padding: 0;
  transition: all var(--fi-motion-normal) var(--fi-ease-standard);
}

.fi-dot:hover {
  background: var(--fi-primary-outline);
}

.fi-dot--active {
  width: 28px;
  border-radius: 4px;
  background: var(--fi-primary);
  cursor: default;
}
```

#### 4.2.3 追加到 `css/fi-base.css`（已有）

追加通用工具类和动画：

```css
/*
 * Utility: flex center
 */
.u-flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/*
 * Section slide animation (used by about pages)
 */
@keyframes fi-slide-in-right {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes fi-slide-in-left {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

#### 4.2.4 全局替换 `#8b5a2b` → `var(--fi-primary)`

所有出现在 CSS 中的 `#8b5a2b` 替换为 `var(--fi-primary)`，包括：
- `.fi-primary-text` → 直接删除 class，改用内联 token
- `.tab--active` background
- `.page-title` color
- `.fi-emphasis` → 改用 `.fi-text-strong` + `var(--fi-primary)`
- `.mobile-*` 中同样

特殊处理：
- `.thanks-highlight { color: #b42318 }` → 保留（这是单独强调色，不是 primary）
- SVG 内 `fill="#8B4513"` → 暂不改动（SVG 图标内部颜色）

#### 4.2.5 字体语义替换

| 旧写法 | 替换为 |
|---|---|
| `font-size: 24px; font-weight: 600` | `.fi-text-title-1` class |
| `font-size: 18px; font-weight: 600` | `.fi-text-title-2` class |
| `font-size: 15px` | `var(--fi-font-size-lg)` |
| `font-size: 14px` | `var(--fi-font-size-md)` |
| `font-size: 12px` | `var(--fi-font-size-xs)` |
| `font-weight: 600` | `var(--fi-font-weight-semibold)` 或 `.fi-text-strong` |
| `font-weight: 700` | `var(--fi-font-weight-bold)` |
| `font-weight: 500` | `var(--fi-font-weight-medium)` |

#### 4.2.6 间距替换

| 旧写法 | 替换为 |
|---|---|
| `padding: 48px ...` | `padding: var(--fi-space-7) ...`（48 ≈ 32+16，保留具体值） |
| `padding: 12px 0 0` | `padding: var(--fi-space-3) 0 0` |
| `padding: 8px 0 12px` | `padding: var(--fi-space-2) 0 var(--fi-space-3)` |
| `padding: 0 52px 8px 0` | 保留具体值（52px 无对应 token） |
| `gap: 12px` | `gap: var(--fi-space-3)` |
| `gap: 8px` | `gap: var(--fi-space-2)` |
| `margin-top: 24px` | `margin-top: var(--fi-space-6)` |
| `margin-top: 16px` | `margin-top: var(--fi-space-4)` |
| `padding: 16px` | `padding: var(--fi-space-4)` |
| `padding: 14px` | `padding: var(--fi-space-3) + 2px` 或保留（无严格对应 token） |

### 4.3 移动端样式治理：消除双轨制

**当前问题：**
`me.component.css` 和 `website.component.css` 都采用了"桌面 + 独立 mobile 前缀"的设计模式。例如：
- `.tab-bar`（桌面）+ `.mobile-tab-bar`（移动）
- `.page-title` + `.mobile-page-title`
- `.dots` + `.mobile-dots`

这导致 CSS 体量翻倍，且修改时需要同时修改两处。

**改造方案：**
移除所有 `.mobile-*` 前缀，统一用 `@media (max-width: 768px)` 覆盖原始 class。

迁移步骤：
1. 将桌面版 class 的 `@media` 覆盖加到同文件中
2. 将 `.mobile-*` 的移动版值改写为对应桌面 class 的媒体查询
3. 删除 `.mobile-*` 定义
4. HTML 模板中 `.mobile-*` → 改为对应的非前缀 class

**示例：**

```css
/* 原：桌面版 */
.page-title {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #8b5a2b;
  padding: 12px 0 0;
  margin: 0;
}

/* 原：移动版（独立前缀） */
.mobile-page-title {
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #8b5a2b;
  padding: 8px 0;
  margin: 0;
}

/* 改造后：统一 class + 媒体查询 */
.page-title {                          /* 桌面默认值 */
  text-align: center;
  font-size: var(--fi-font-size-2xl);
  font-weight: var(--fi-font-weight-semibold);
  color: var(--fi-primary);
  padding: var(--fi-space-3) 0 0;
  margin: 0;
}

@media (max-width: 768px) {
  .page-title {                        /* 移动覆盖 */
    font-size: var(--fi-font-size-xl);
    padding: var(--fi-space-2) 0;
  }
}
```

### 4.4 回归验证清单

每次修改后逐一检查：

- [ ] 桌面端页面截图对比（改前 vs 改后）
- [ ] 移动端（≤768px）页面截图对比
- [ ] 所有 tab 切换正常
- [ ] 导航箭头 hover/active 状态正常
- [ ] 轮播/滑动动画正常
- [ ] 联系方式卡片 hover 阴影正常
- [ ] 社交链接 hover 色值一致
- [ ] 时间线圆点颜色与 primary 一致
- [ ] 不改变业务逻辑和接口调用
- [ ] `ng test` 通过（如有）

---

## 五、第四步：扩展到全站

### 5.1 批次规划

| 批次 | 范围 | 目标页面 | 预计时间 |
|---|---|---|---|
| 样板 | about 模块 | `me`、`website`、`message` | 本周 |
| 批次 1 | 博客模块 | `blog`（列表） | 下周 |
| 批次 2 | 博客详情 | `blog-detail` | 第 3 周 |
| 批次 3 | 展示模块 | `life`（点滴时间轴） | 第 4 周 |
| 批次 4 | 其他模块 | `world/book`、`world/game` | 第 5-6 周 |
| 批次 5 | 尾部页面 | `link`（友链）、`welcome`（首页） | 第 7-8 周 |

### 5.2 每批次产出标准

每个批次做完后必须产出：

```
- 新增共享样式文件/行数：____
- 删除的私有重复定义数：____
- 页面私有 CSS 减少行数：____
- 回退方案：git revert 对应 commit
- 截图对比结果：通过 / 需修复
```

### 5.3 stylelint 规则（复用体系稳定后启用）

当全站共享样式体系建立后，在项目中加入 stylelint 规则：

```json
{
  "rules": {
    "color-no-hex": true,
    "font-weight-notation": "numeric",
    "unit-allowed-list": ["px", "%", "em", "rem", "vh", "vw", "deg"],
    "declaration-block-no-duplicate-properties": true,
    "max-nesting-depth": 3
  }
}
```

- `color-no-hex`：防止在 CSS 中直接写十六进制色值（需要先建立允许的 token 白名单）
- `max-nesting-depth`：防止选择器链过深

---

## 六、即插即用决策卡

以下是与本次治理相关的常见场景决策速查：

| 场景 | 判断 | 操作 |
|---|---|---|
| 我要在新的页面写一个标题 | 用 `fi-text-title-1` 还是自己写 font-size？ | 用 `.fi-text-title-1`，禁止自写 |
| 我要给一段文字加粗 | 用 `.fi-text-strong` 还是 `font-weight: 700`？ | 用 `.fi-text-strong` |
| 两个页面都有 tab 栏 | 各写一套还是提取共享？ | 提取到 `fi-tabs.css` |
| 我的页面有个只有自己用的特殊卡片 | 放到共享层还是留在页面 CSS？ | 留在页面 `.component.css` |
| 移动端样式怎么写 | 用 `.mobile-*` 前缀还是媒体查询？ | 用 `@media` 统一 class |
| 第三方组件覆盖（ng-zorro） | 写在哪里？ | `css/fi-overrides.css` 或对应 `fi-*.css` |
| 这个色值 token 里没有 | 写 hex 还是加 token？ | 先判断它是否通用 → 加 token / 用已有近似 token |
| 我改了共享样式 | 怎么确认没影响其他页面？ | 回归涉及的所有引用页面 |

---

## 七、附录：文件修改路线图

### 7.1 第一阶段改动顺序（about 模块样板）

```
Step 1: 新增 css/fi-tabs.css
Step 2: 新增 css/fi-dots.css
Step 3: 追加 fi-base.css（keyframes + utility）
Step 4: 清理 website.component.css（移动端双轨合一 + token 替换）
Step 5: 清理 me.component.css（移动端双轨合一 + token 替换）
Step 6: 调整 message.component.css（token 替换）
Step 7: 更新 HTML 模板（class 名变更）
Step 8: 全量回归验证
```

### 7.2 命名约定（避免混淆）

| 前缀 | 归属 | 例子 |
|---|---|---|
| `--fi-` | Token (CSS 变量) | `--fi-primary` |
| `.fi-` | 共享 CSS class（Base/Component 层） | `.fi-tab-bar`、`.fi-text-strong` |
| `.u-` | 工具类（Utility） | `.u-flex-center` |
| `fl*` | Angular 指令/组件 | `fl-button`、`flCardHover` |
| （无前缀） | 页面私有 Feature | `.hero-row`、`.hobby-layout` |
