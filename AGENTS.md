# FlowersInkV2 AGENTS

## 项目定位

`FlowersInkV2` 是 FLOWERSINK 的公开主站，负责：

- 首页精选与公开内容展示
- 博客列表、分类页、详情页、Markdown 渲染
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
| 检查 | `npm run test` |

## 应用结构

- Angular 20 standalone 架构
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

## 前端复用治理规则

每次开发涉及样式时，必须遵守以下规则（来源于 `src/docs/ai/frontend-reuse-governance-draft.md`）：

1. **先复用后新增**：在 `src/app/common_ui/css/` 和 `fl_ui/` 中搜索是否已有可复用 token/组件/样式，禁止复制粘贴。
2. **禁止裸色值**：页面 CSS 中禁止直接使用十六进制色值（如 `#4096ff`），必须引用 `--fi-*` token。
3. **禁止裸字号**：页面 CSS 中禁止写随机字号值（如 `13px/15px/17px`），优先使用 `--fi-font-size-*` token。
4. **布局尺寸例外**：固定布局尺寸（如 `min-height: 420px`、`grid-template-columns` 中的具体值、`calc(100vh - 48px)`）不属于治理范围，维持原样。
5. **排版语义类优先**：强调文本使用 `.fi-text-strong`、链接文本使用 `.fi-text-link`，不要重新定义局部粗体/链接类。
6. **回提原则**：一个样式在第二个页面复用出现时，必须回提到共享层（`fi-base.css` 或 `fi-tokens.css`）。
7. **ng-zorro 兼容**：`nzColor` 等组件属性不支持 CSS 变量，改用 `:host ::ng-deep` 覆盖对应 DOM 元素的 `color`/`border-color`。
8. **提交说明必须包含**：复用了哪些既有 token/样式、新增了哪些 token、为什么不能继续复用（如有）。

## 治理代码审查清单

每次合并涉及样式变更时，审查以下事项：

- 是否使用 `--fi-*` token，而不是硬编码色值/字号？
- 是否复用已有组件样式（`fl-button`、`fl-tag`、`fi-text-*` 等），而非新建重复类？
- 是否把通用样式错误放进页面私有文件？
- 是否影响现有组件状态（hover/active/disabled）一致性？
- 是否验证桌面端与移动端表现？

## 当前状态

- 主站已移除 SSR/prerender/hydration 配置链。
- 路径错误已修正：
  - `/site/visit`
  - `/world/game`
  - `/world/game/list`
- `world/food` 无入口页面已删除。
- 详细接口矩阵见 [../docs/AI_PROJECT_CONTEXT.md](/d:/FLOWERSINK/docs/AI_PROJECT_CONTEXT.md)。
