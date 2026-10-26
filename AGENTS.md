# FlowersInkV2 AGENTS

## 项目定位

`FlowersInkV2` 是 FLOWERSINK 的公开主站，负责：

- 首页精选与公开内容展示
- 博客列表（写作）、归档页、详情页、Markdown 渲染
- 点滴时间轴
- 书籍、游戏、友链、关于页
- 留言、友链、博客表情评论等公开交互
- 路由预取、图片懒加载、缓存、SEO 基础信息

当前项目按纯客户端模式构建，不保留 SSR、server 入口或 prerender 配置。

## 目录与入口

- `src/main.ts`
  - 浏览器入口，`bootstrapApplication(AppComponent, appConfig)`
- `src/app/app.config.ts`
  - 提供 router、Ng Zorro i18n、icons、`HttpClient(withFetch())` 等全局 provider
- `src/app/app.routes.ts`
  - 根路由，全部采用 lazy route
- `src/app/pages`
  - standalone 页面与路由入口
- `src/app/components`
  - 公共展示组件，按 `about/blog/life/link/website/world` 分组
- `src/app/services`
  - `api.ts`、`http.service.ts`、`route-prefetch.service.ts`、`window.service.ts`
- `src/app/shared`
  - HTTP 缓存常量、Markdown runtime loader、工具函数
- `src/app/common_ui`
  - `fl_ui` 指令、公共动画、CSS token

## 启动/构建/检查命令

| 类别 | 命令 |
| --- | --- |
| 开发启动 | `npm run start` |
| 测试环境启动 | `npm run st` |
| 生产配置启动 | `npm run sp` |
| 构建 | `npm run build` / `npm run build:test` / `npm run build:prod` / `npm run build:fast` / `npm run build:full` / `npm run watch` |
| 检查 | `npm run test` / `npm run lint:css` / `npm run visual` |

## 应用结构

- Angular 21 standalone 架构
- 主路由分组：
  - `/welcome`
  - `/blog`
  - `/life`
  - `/about`
  - `/world`
  - `/link`
  - `**`
- `world` 当前只保留：
  - `/world/book`
  - `/world/game`
- 无入口的 `world/food` 页面已删除

## 路由预取与缓存

- `RoutePrefetchService`
  - 负责路由 chunk 空闲预取
  - `AppComponent.ngAfterViewInit()` 会启动 `startIdlePreload()`
  - `HeaderComponent` 会在 hover 或交互时触发预取
- `HttpService`
  - 统一封装 `GET/POST/PUT/PATCH/DELETE`
  - `getCached()` 内置 GET 缓存与 `shareReplay`
  - `invalidateGetCache()` 负责提交后失效
- HTTP 缓存 TTL：
  - `SHORT: 15s`
  - `LIST: 30s`
  - `DETAIL: 60s`
  - `LONG: 300s`

## 浏览器边界

- 虽然项目已不做 SSR，仍然要保留浏览器态保护，避免未来静态构建或测试环境踩坑。
- 访问以下对象前仍应做保护：
  - `window`
  - `document`
  - `navigator`
  - `localStorage`
  - `performance`
  - `requestAnimationFrame`
- 当前统一依赖：
  - `WindowService`
  - `isPlatformBrowser(...)`
  - `typeof window === 'undefined'`

## Markdown 与运行时脚本

- 博客相关路由通过 `MarkdownModule.forRoot()` 使用 Markdown。
- `blog-detail` 与 `question` 页面通过 `ensureMarkdownRuntimeLoaded()` 动态加载：
  - Prism
  - Prism 语言包
  - ClipboardJS
- 运行时脚本来源：
  - `assets/vendor/prism/*`
  - `assets/vendor/clipboard/*`
- `clipboard`、`mermaid` 依赖当前保留，不要随意删除。

## 组件分层与视觉约定

- `pages/*` 负责取数、组合和页面级状态
- `components/*` 负责可复用展示单元
- `common_ui/fl_ui` 是现有视觉体系优先级最高的公共 UI 层
- 新的按钮、输入框、标签、卡片优先复用：
  - `fl-button`
  - `fl-input`
  - `fl-card`
  - `fl-tag`
  - `fl-alert`

## 图片与内容展示约定

- 图片优先保持：
  - `loading="lazy"`
  - `decoding="async"`
  - `NzImageService.preview(...)`
- 世界、点滴等图片对象结构优先保持：
  - `url`
  - `img_url`
- 没有显式原图时，允许通过去掉 `compressed-` 推导原图

## 接口约定

- `API.INFO` 已修正为 `POST /site/visit`
- `API.GAME` 与 `API.GAME_LIST` 已修正为：
  - `/world/game`
  - `/world/game/list`
- 欢迎页遗留的 `getBlogDetail()` 已删除，博客详情统一走 `pages/blog/blog.service.ts`

## 依赖与文档工具

- `tree` 依赖需要保留，用于生成项目结构树，辅助 README 与文档维护。
- 不要把它当成无用依赖删除。

## 不要做什么

- 不要重新引入 `main.server.ts`、`app.config.server.ts`、`server.ts` 或 `serve:ssr:*` 脚本。
- 不要绕过 `HttpService.getCached()` 平行写一套 GET 缓存。
- 不要绕过 `RoutePrefetchService` 自己散落实现 chunk 预热。
- 不要把现有上传对象数组压平成字符串 URL。
- 不要忽略 `fl_ui` 和现有主站视觉系统。

## 设计系统

写任何 UI 代码前先读：

- 根目录 `DESIGN.md` —— 设计规则单一入口（颜色、排版、间距、组件、动效、响应式、无障碍、品牌例外）。
- 根目录 `PRODUCT.md` —— 稳定的产品背景，不含视觉规则。

分层职责、复用与回提流程、审查清单、变更顺序见 `src/docs/ai/design-system-governance.md`。
审计证据与检测器例外见 `src/docs/ai/design-system-audit.md`，迁移批次见 `design-system-migration-plan.md`。

以下四条是硬约束：

1. **先复用后新增**：搜 `common_ui/css/` → `fl_ui/` → 相邻页面，禁止复制粘贴同类样式。
2. **禁止裸值**：页面 CSS 不写十六进制色值、不新造字号，用 `--fi-*` token 或 `.fi-text-*` 语义类。
3. **第二处复用必须回提**到 `fi-*.css` 或 `fl_ui/`，两个引用点同批改。
4. **改公共层必须同步展示页**：改 `fi-tokens.css` 或任一 `fl_ui` 组件后，在同一次改动里更新 `/design`；新增 token 同时加进 `pages/design/design-tokens.data.ts`（只写名字与用途）。

品牌例外（Inter 字体、奶油底、棕金主色、引用块侧条、气泡回弹）见 `DESIGN.md` §9，**不要为了通过检测器而改**。

### 样式设计页（`/design`）

- 路由：`app.routes.ts` 里的懒加载 `design` 路由；入口是站内页脚底部的「设计规范」。
- 它是公开页，但**对搜索引擎 `noindex`、不写进 sitemap**（工具页，不与内容页抢权重）。
- **新增路由必须同步 `scripts/generate-static-seo.mjs`**：该脚本为每个已知路由生成静态 SEO 外壳。漏加的话线上该页会回落到根目录那份外壳（顶着首页的 canonical 与 meta），肉眼看不出来但抓取与分享都会错。
- 该页颜色/间距一律 `var(--fi-*)`，组件一律 import 真实实现，页面私有 CSS 只允许写展示脚手架。


## 当前状态

- 主站已移除 SSR/prerender/hydration 配置链。
- 路径错误已修正：
  - `/site/visit`
  - `/world/game`
  - `/world/game/list`
- `world/food` 无入口页面已删除。
- 详细接口矩阵见 [../docs/AI_PROJECT_CONTEXT.md](/d:/FLOWERSINK/docs/AI_PROJECT_CONTEXT.md)。
