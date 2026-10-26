# 花墨主站 · 设计系统审计（2026-10-26）

- 审计对象：`FlowersInkV2`，分支 `master`，基线提交 `0106f2c`
- 方式：只读静态审查 + 检测器基线；未改业务代码
- 本文记录**证据、结论与例外**。规则本身在 `DESIGN.md`，执行批次在 `design-system-migration-plan.md`。

## 1. 基线数据

> 括号内为 2026-10-26 第二轮治理之后的数值。

| 指标 | 数值 |
|---|---|
| CSS 文件 / 行数 | 65 / 12,344（治理后 12,202；`common_ui` 3,314） |
| 设计 token | 99 个（治理后 109：新增代码块 3、字号 2、层叠 7、角标 3，删除 1），仅 3 个未被引用 |
| `common_ui/css` 之外的硬编码色值 | 90 处（治理后 81） |
| `common_ui/css` 之外的裸字号 | 127 处（治理后 118） |
| `!important` | 209 处（治理后 **97**；共享层已清零） |
| `::ng-deep` | 50 处（blog-detail 26、about 6） |
| 断点 | 480×8、768×33、769×4、1024×5、1200×5 —— 与四档约定一致 |
| 共享语义类使用 | `.fi-text-title-1` 0 处；`.fi-text-body/-caption/-strong/-link` 各 1 处（均在 `/design`） |
| 统一页面容器 | `.fi-page` 2 处；`.fi-screen` + `.fi-page--flush` 覆盖全部一级页面（治理后） |

对比度（token 计算值）：正文 14.79、次要文字 5.12、主色 5.56、标签文字 5.42、反白于主色 5.63 均达标；占位符 3.18、语义色压自身浅底 2.49–4.65（`fi-alert.css` 已用 color-mix 压暗标题解决）。

## 2. 检测器基线

命令：`npx impeccable detect src/`（Impeccable 4.7.0，引擎 0.1.16，项目级安装、未装 hook）。

源码模式（正则，194 文件）首轮 36 条：

| 规则 | 条数 | 归类 | 处理 |
|---|---|---|---|
| `broken-image` | 24 | **误报**：Angular `[src]` 属性绑定，正则看不到 | 规则级忽略（风险：真实缺 src 需人工看） |
| `bounce-easing` | 6 | **已知设计决策**：想法气泡、点赞爆发的「弹出」语义 | 值级忽略 `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `side-tab` | 5 | **已知设计决策**：Markdown 引用块与气泡引线 | 5 个文件按文件忽略 `*` |
| `border-accent-on-rounded` | 1 | **误报**：气泡三角箭头（用 border 画三角） | 该文件忽略 `*` |

忽略配置写在 `.impeccable/config.json`（随仓库提交），每条带 `reason`。

> 引擎明确提示：正则在源码上跑不到 `tiny-text`、`low-contrast`、`line-length` 等需要解析 DOM 的规则，**结果是低估，不是「没有问题」**。完整检测需对运行中的 dev server 或构建产物执行。

## 3. 主要问题（按优先级）

### P1

1. **语义排版层与布局层落地率 ≈ 0**。类与容器都写好了，但页面没用：`.fi-text-*` 只出现在 `/design`；16 个页面各自写 `min-height: calc(100vh - 48px)` 与自有容器（`--life-main-max-width: 700px`、`--chg-main-max-width: 720px`）。
2. **规范入口缺失且现存文档失真**：无 `DESIGN.md` / `PRODUCT.md`；治理草案停在 v0.2 且写「Angular 20」；执行手册通篇围绕已不存在的 `about/me`、`about/website`；README 徽章写 Angular 20。→ 本次已修。
3. **无自动化约束**：仓库原先没有任何 eslint/stylelint，规则只活在文字里，已被违反 90 + 127 次。→ 本次新增 stylelint。
4. **`!important` 209 处的根因是加载顺序**：`angular.json` 把 ng-zorro 放在 `styles.css` 之后。→ 见迁移计划批次 3。
5. **错误态缺失**：`error: () => {}` 静默吞掉失败（如 `about.component.ts:142`），页面表现为空白，与「没有数据」不可区分，无重试入口。
6. **键盘/触屏不可达**：14 处 `(click)` 挂在无 `role`/`tabindex` 的 `div/span` 上（赞赏二维码、游戏截图、点滴图片格、滚动提示、验证码刷新、`/design` 的 `.fi-tab`/`.fi-dot`）；Markdown 代码复制按钮只在 `.hover` 时显示。

### P2

| # | 问题 | 证据 |
|---|---|---|
| 1 | `comment.css` 620 行脱离 token 体系 | 59 处 hex、23 处裸字号 |
| 2 | `.tag-filter-button` 三份逐字相同 | `fl-tag-filter.component.css:13` / `changelog:434` / `heart:658` |
| 3 | about / donate 侧栏整块复制 | `.sidebar-inner/-track/-item/-dot/-label` |
| 4 | `100vh` 19 处、无 `dvh` | 每页 `min-height: calc(100vh - 48px)`；`error` 页 `height: 100vh` |
| 5 | 加载提示无延迟 | 14 处 `<nz-spin>`，0 处 `nzDelay` |
| 6 | 空状态三种写法 | `flower-nodata` / `changelog-empty` / `equipment-empty-text` |
| 7 | 字号越界 | 15px×14、11px×11、20px×7、12.5px |
| 8 | 移动端正文 16px 只在 Markdown 落地 | `markdown-zaihua.css:596` |
| 9 | 表单移动端 40px | `fi-form.css:33`（与 44px 决定不一致） |
| 10 | 共享层内仍写裸色值 | `fi-card.css:48`、`fi-tag.css`、`fl-button.component.css` |
| 11 | token 值重复 | 4 个白色 surface、3 个 `#2f2117`、3 个 `#fff8f3`；`--fi-input-border-color` 与 `--fi-form-border` 同值且无人用 |

### P3

`fl-button` 的 `.fl-button:active::after` 重复定义；`transition: all` 15 处；`target="_blank"` 28 处中 6 处缺 `rel`；30 张图 1 张缺 `alt`；`z-index` 无标尺（14 个不同值）；`overflow-x: hidden` 6 处；页面私有类名裸词重名（`.content` 出现在 7 个文件）；`fi-tabs` / `fi-dots` 仅 `/design` 使用。

## 4. 例外登记（检测器忽略项）

| 规则 | 范围 | 原因 | 配置 |
|---|---|---|---|
| `broken-image` | 全站 | Angular `[src]` 绑定被正则误判 | `ignoreRules` |
| `bounce-easing` | 值 `cubic-bezier(0.34,1.56,0.64,1)` | 仅用于「弹出来」的语义：想法气泡、点赞爆发 | `ignoreValues` |
| `side-tab` | `markdown-zaihua.css`、`markdown-comment.css`、`fl-idea-popover.component.css`、`blog-detail.component.css`、`design.component.css` | 引用块与气泡引线，全站统一表达 | `ignoreValues`（按文件） |
| `border-accent-on-rounded` | `blog-detail.component.css` | 气泡三角箭头，不是卡片描边 | `ignoreValues`（按文件） |

**未预登记的**：`overused-font`（Inter）、`cream-palette`、`ai-color-palette` —— 本轮源码模式下未触发，等真实触发时再登记，避免凭空造例外。

## 5. 运行态检测（2026-10-26，对构建产物 + 本地静态服务）

`npx impeccable detect http://localhost:4202/<route>` 会真正解析 DOM，能跑出正则模式看不到的规则。

| 页面 | 发现 |
|---|---|
| `/design` | 11 条：`side-tab`（引用块/目录指示条，已登记）、`placeholder 3.2:1`、`low-contrast 3.4:1 (#fffaf5 on #a8825e)`、`low-contrast 2.6:1 (#a99c90 on 渐变容器)`、`skipped-heading`（h2 → h4）、`cream-palette`（品牌）、`nested-cards` ×5（设计页示范用的嵌套卡片） |
| `/blog/all` | 2 条：`placeholder 3.2:1`、`cream-palette` |
| `/life` | 16 条：`#ffffff on #c06078` 4.0:1 ×12、`#fffaf5 on #a8825e` 3.4:1、`skipped-heading`（h2 → h4、h4 → h6）、`cream-palette`，另有 `bounce-easing`（已登记的值）、`#7a6756 on #f4e7d8` 4.4:1（建议项） |

**需要处理的真实项**（2026-10-26 已全部完成）：

1. ✅ `.tag-count` 激活态：底色改为压暗方向，反白文字从 3.4:1 提到约 7:1。
2. ✅ 标签底上的次要文字：`.fi-note__text` 改用 `--fi-tag-text`（5.86:1）。
3. ✅ `/life`、`/`、`/design` 的标题跳级：月份/卡片标题 h4 → h3，装饰英文标签 h6 → `<p>`，`blog-card` 标题加 `titleTag`（首页传 h2），评论标题 h3 → h2。
4. ✅ `/` 的 2.8:1：`hero-scroll-text` 的 `opacity: 0.7` 已去掉（5.12:1）。
5. ✅ `/game`、`/book` 的角标白字 2.4~3.5:1：游戏分类角标与书籍状态角标的底色改为 `--fi-badge-gold/-gold-strong/-gray`（白字 ≥4.5:1）。
6. ✅ `/equipment` 退役卡片 2.0:1：改用 `--fi-tag-text` 并去掉叠加透明度。
7. ✅ `/game` 不推荐卡片整体 3.9:1：卡片透明度 0.82 → 0.95（降权由角标与灰度封面表达）。
8. ✅ ng-zorro 次要文字（45% 黑，3.3:1）：`.ant-typography-secondary` 统一到 `--fi-text-muted`（5.12:1）。
9. ✅ `/donate` 缺少静态 SEO 外壳：已补进 `generate-static-seo.mjs`。

**判定为数据驱动 / 品牌项，不改样式**：

- `.fc-badge-identity` 的底色由接口下发（管理员在 ERP 配置），`#c06078` 的 4.0:1 取决于配置值，不是代码问题；建议在 ERP 侧给身份标签限定调色板。
- `cream-palette`（`#fff8f3` 页面底）是品牌底色，见 `DESIGN.md` §9。
- `placeholder 3.2:1` 为已知下限：再压深会与已输入的文字混淆，输入后即消失。
- 热力图月份刻度 9px：与 11px 单元格对齐，放大即错位，属图表刻度而非正文。
- `nested-cards` 只出现在 `/design`——那是展示页刻意把卡片放进卡片里做对照。

## 6. 本次未验证的事项

- 键盘 Tab 只核对了 DOM 的 `role`/`tabindex` 与焦点样式，没有逐项手动遍历。
- 没有屏幕阅读器与真机测试。
- 截图来自无头 Chrome（`scripts/visual-check.mjs`），是本项目可复现的视觉验收方式；预览面板自身的渲染不可靠，不作为证据。
- 剩余 81 处裸色 / 118 处裸字号仍在页面私有样式里，按批次继续收敛（见迁移计划）。
