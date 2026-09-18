# FlowersInk UI (`fl_ui`)

统一维护站内可复用 UI 组件（Angular Standalone）。

## 组件索引

| 组件 | 说明 | 路径 | 文档跳转 |
|---|---|---|---|
| `fl-button` | 通用按钮（CTA、提交、路由跳转） | `src/app/common_ui/fl_ui/fl-button/fl-button.component.ts` | [前往](#fl-button) |
| `fl-input` | 通用输入样式指令（输入框、文本域） | `src/app/common_ui/fl_ui/fl-input/fl-input.directive.ts` | [前往](#fl-input) |
| `fl-card` | 通用卡片样式指令（静态/悬浮） | `src/app/common_ui/fl_ui/fl-card/fl-card.directive.ts` | [前往](#fl-card) |
| `fl-tag` | 通用标签样式指令（soft/outline/solid） | `src/app/common_ui/fl_ui/fl-tag/fl-tag.directive.ts` | [前往](#fl-tag) |
| `fl-alert` | 通用提示框样式指令（soft/outline/solid） | `src/app/common_ui/fl_ui/fl-alert/fl-alert.directive.ts` | [前往](#fl-alert) |
| `fl-comment-board` | 公共评论区（评论 + 回复 + 表情 + Markdown 预览） | `src/app/common_ui/fl_ui/fl-comment-board/fl-comment-board.component.ts` | [前往](#fl-comment-board) |
| `fl-comment-editor` | 评论输入框（评论 / 预览 双 tab + 表情选择） | `src/app/common_ui/fl_ui/fl-comment-editor/fl-comment-editor.component.ts` | [前往](#fl-comment-editor) |
| `fl-comment-content` | 评论内容渲染（Markdown + 表情 token） | `src/app/common_ui/fl_ui/fl-comment-content/fl-comment-content.component.ts` | [前往](#fl-comment-content) |
| `fl-comment-card` | 单条评论卡片 | `src/app/common_ui/fl_ui/fl-comment-card/fl-comment-card.component.ts` | [前往](#fl-comment-card) |
| `fl-emoji-picker` | 表情选择器（再花 / 方长 / 颜文字三个分页） | `src/app/common_ui/fl_ui/fl-emoji-picker/fl-emoji-picker.component.ts` | [前往](#fl-emoji-picker) |

## 目录

- [`fl-button`](#fl-button)
- [`fl-input`](#fl-input)
- [`fl-card`](#fl-card)
- [`fl-tag`](#fl-tag)
- [`fl-alert`](#fl-alert)
- [`fl-comment-board`](#fl-comment-board)
- [`fl-comment-editor`](#fl-comment-editor)
- [`fl-comment-content`](#fl-comment-content)
- [`fl-comment-card`](#fl-comment-card)
- [`fl-emoji-picker`](#fl-emoji-picker)

## `fl-button`

### 路径

- `src/app/common_ui/fl_ui/fl-button/fl-button.component.ts`
- `src/app/common_ui/fl_ui/fl-button/fl-button.component.html`
- `src/app/common_ui/fl_ui/fl-button/fl-button.component.css`

### 用法

```ts
import { FlButtonComponent } from '../../common_ui/fl_ui/fl-button/fl-button.component';

@Component({
  standalone: true,
  imports: [FlButtonComponent],
})
export class ExampleComponent {}
```

### 示例

```html
<fl-button>默认按钮</fl-button>
<fl-button variant="solid">主要按钮</fl-button>
<fl-button variant="ghost">轻量按钮</fl-button>
<fl-button [routerLink]="['/about/me']">了解再花</fl-button>
<fl-button type="submit">发布</fl-button>
<fl-button [block]="true">铺满容器</fl-button>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `variant` | 视觉变体 | `'outline' \| 'solid' \| 'ghost'` | `'outline'` |
| `size` | 尺寸 | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `type` | 原生按钮类型 | `'button' \| 'submit' \| 'reset'` | `'button'` |
| `disabled` | 禁用状态 | `boolean` | `false` |
| `block` | 是否铺满容器 | `boolean` | `false` |
| `routerLink` | Angular 路由跳转 | `string \| readonly string[] \| any[] \| null` | `null` |

### 主题变量

变量来源：`src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-primary` | 主题主色 |
| `--fi-primary-hover` | hover 主色 |
| `--fi-primary-active` | active 主色 |
| `--fi-primary-outline` | focus 外发光 |
| `--fi-surface` | 按钮背景 |
| `--fi-surface-soft` | hover 背景 |
| `--fi-border` | 边框色 |
| `--fi-radius-sm` | 圆角 |

## `fl-input`

### 路径

- `src/app/common_ui/fl_ui/fl-input/fl-input.directive.ts`

### 用法

```ts
import { FlInputDirective } from '../../common_ui/fl_ui/fl-input/fl-input.directive';

@Component({
  standalone: true,
  imports: [FlInputDirective],
})
export class ExampleComponent {}
```

### 示例

```html
<input nz-input flInput placeholder="搜索文章" />
<textarea nz-input flInput placeholder="留言内容"></textarea>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `flInput` | 启用输入控件主题样式 | `'' \| boolean` | `''` |

### 主题变量

变量来源：`src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-input-radius` | 输入框圆角 |
| `--fi-input-border-color` | 输入框边框色 |
| `--fi-primary` | focus 主色 |
| `--fi-primary-outline` | focus 阴影色 |

## `fl-card`

### 路径

- `src/app/common_ui/fl_ui/fl-card/fl-card.directive.ts`

### 用法

```ts
import { FlCardDirective } from '../../common_ui/fl_ui/fl-card/fl-card.directive';

@Component({
  standalone: true,
  imports: [FlCardDirective],
})
export class ExampleComponent {}
```

### 示例

```html
<div flCard>静态卡片</div>
<div flCard flCardHover>可悬浮卡片</div>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `flCardHover` | 启用 hover 交互 | `boolean` | `false` |

### 主题变量

变量来源：`src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-surface` | 卡片背景 |
| `--fi-border` | 卡片边框 |
| `--fi-radius-md` | 卡片圆角 |
| `--fi-shadow-soft` | 默认阴影 |
| `--fi-shadow-hover` | hover 阴影 |
| `--fi-surface-soft` | hover 背景 |

## `fl-tag`

### 路径

- `src/app/common_ui/fl_ui/fl-tag/fl-tag.directive.ts`

### 用法

```ts
import { FlTagDirective } from '../../common_ui/fl_ui/fl-tag/fl-tag.directive';

@Component({
  standalone: true,
  imports: [FlTagDirective],
})
export class ExampleComponent {}
```

### 示例

```html
<nz-tag flTag>默认标签</nz-tag>
<nz-tag flTag flTagVariant="outline">描边标签</nz-tag>
<nz-tag flTag flTagVariant="solid">实色标签</nz-tag>
<nz-tag flTag flTagInteractive (click)="onSelect()">可交互标签</nz-tag>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `flTag` | 启用 Tag 主题样式 | `'' \| boolean` | `''` |
| `flTagVariant` | 标签视觉变体 | `'soft' \| 'outline' \| 'solid'` | `'soft'` |
| `flTagInteractive` | 启用 hover/pointer 交互 | `boolean` | `false` |

### 主题变量

变量来源：`src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-tag-radius` | Tag 圆角 |
| `--fi-tag-bg` | 默认背景 |
| `--fi-tag-border` | 默认边框 |
| `--fi-tag-text` | 默认文字色 |
| `--fi-tag-bg-hover` | hover 背景 |
| `--fi-tag-border-hover` | hover 边框 |
| `--fi-tag-text-hover` | hover 文字色 |

## `fl-alert`

### 路径

- `src/app/common_ui/fl_ui/fl-alert/fl-alert.directive.ts`

### 用法

```ts
import { FlAlertDirective } from '../../common_ui/fl_ui/fl-alert/fl-alert.directive';

@Component({
  standalone: true,
  imports: [FlAlertDirective],
})
export class ExampleComponent {}
```

### 示例

```html
<nz-alert flAlert nzType="info" [nzMessage]="title" [nzDescription]="content"></nz-alert>
<nz-alert flAlert flAlertVariant="outline" nzType="success" [nzDescription]="content"></nz-alert>
<nz-alert flAlert flAlertVariant="solid" nzType="warning" [nzDescription]="content"></nz-alert>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `flAlert` | 启用 Alert 主题样式 | `'' \| boolean` | `''` |
| `flAlertVariant` | 提示框视觉变体 | `'soft' \| 'outline' \| 'solid'` | `'soft'` |

### 主题变量

变量来源：`src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-alert-bg` | 默认背景 |
| `--fi-alert-border` | 默认边框 |
| `--fi-alert-text` | 默认文字色 |
| `--fi-alert-icon` | 图标色 |
| `--fi-alert-mark-bg` | `mark` 背景色 |
| `--fi-alert-mark-text` | `mark` 文字色 |
| `--fi-alert-bg-strong` | `solid` 背景 |
| `--fi-alert-border-strong` | `solid` 边框 |
| `--fi-alert-text-strong` | `solid` 文字色 |

## `fl-comment-board`

公共评论区。文章 / 游戏 / 装备 / 点滴共用同一个组件，差异只有「数据从哪来」和几个展示开关。

### 路径

- `src/app/common_ui/fl_ui/fl-comment-board/fl-comment-board.component.{ts,html,css}`

### 用法

数据源通过 `CommentSource` 适配器注入，用工厂函数组装：

```ts
import { articleCommentSource, lifeCommentSource, memoizeLifeCommentSources } from '../../../shared/comment/comment-source.factory';

// 文章 / 游戏 / 装备（模块级线程可省 targetId）
readonly commentSource = articleCommentSource(this.commentService, 'article', this.blogId);

// 点滴列表：每条点滴各一个评论区，必须用记忆化版本，否则引用变化会反复拉取
readonly sourceFor = memoizeLifeCommentSources(this.lifeService);
```

```html
<fl-comment-board [source]="commentSource" title="评论"></fl-comment-board>

<!-- 点滴：无标题、点评论数才展开、只显示 3 条 -->
<fl-comment-board [source]="sourceFor(item.id)" [title]="null" [collapsible]="true"
  [previewLimit]="3" [open]="isCommentOpen(item)"></fl-comment-board>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `source` | 数据源适配器，**必须是稳定引用** | `CommentSource` | 必填 |
| `title` | 标题；`null` 不渲染标题行 | `string \| null` | `'评论'` |
| `collapsible` | 点击评论数才展开表单 | `boolean` | `false` |
| `open` | `collapsible` 下的受控展开态 | `boolean` | `false` |
| `previewLimit` | >0 时只显示前 N 条，其余收进「展开全部评论」 | `number` | `0` |
| `showAll` | 强制全部展示，不出现展开按钮 | `boolean` | `false` |
| `countChange` | 评论总数变化（含本地待审核） | `EventEmitter<number>` | — |

### 图片来源限制

访客内容里的**图片**只允许来自本站（`flowersink.com` 任意子域名 + 站内相对路径），其它域名、`data:` URI、协议相对地址都会被拒。外链**文章链接**不受影响。

- 规则实现在 `shared/comment/content-image-policy.util.ts`，与 API 的 `common/content-image-policy.ts` 是同一套（改一边记得同步另一边）
- 前端这份只为**即时反馈**；真正的闸门在 API（`PublicInteractionSecurityService.assertContentImagesAllowed`，挂在文章/点滴/模块评论与留言四个访客入口上）。绕过前端直接发请求一样会被 400 拒掉
- 为什么不放在展示时过滤：浏览器只要把 `<img src="外链">` 插进 DOM 就会立刻请求，事后删元素或 `display:none` 都来不及，追踪像素已经打出、访客 IP 已经泄露。所以必须在**入库前**拦
- 站长在 ERP 里的回复**不受此限制**（站长可信）

## `fl-comment-editor`

评论输入框：评论 / 预览双 tab，内置表情选择器。验证码与提交按钮由使用方投影。

### 路径

- `src/app/common_ui/fl_ui/fl-comment-editor/fl-comment-editor.component.{ts,html,css}`

### 用法

```html
<fl-comment-editor [content]="form.content" (contentChange)="form.content = $event"
  [identity]="form" [disabled]="submitting" [rows]="4" [maxlength]="500">
  <div fcEditorActions nz-flex nzAlign="center" nzGap="middle">
    <flower-simple-captcha [scene]="source.captchaScene" [inline]="true"></flower-simple-captcha>
    <fl-button (click)="submit()">发布评论</fl-button>
  </div>
</fl-comment-editor>
```

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `content` / `contentChange` | 内容双向绑定 | `string` | `''` |
| `identity` | 预览时套用的身份（名字/邮箱/网址/头像） | `CommentIdentity \| null` | `null` |
| `previewRole` | 预览身份；ERP 回复传 `'admin'` 显示猫猫头徽章 | `'visitor' \| 'admin'` | `'visitor'` |
| `maxlength` / `rows` / `placeholder` | 透传给 textarea | — | `500` / `4` / — |
| `disabled` | 禁用输入与表情 | `boolean` | `false` |
| `showCounter` | 是否显示字数计数 | `boolean` | `true` |
| `pickerPlacement` | 表情面板弹出方向 | `'top' \| 'bottom' \| 'topLeft' \| 'bottomLeft'` | `'topLeft'` |

公开方法：`insert(text: string)` —— 在**光标处**插入文本（表情 token / 颜文字），并把光标移到插入内容之后。

## `fl-comment-content`

评论内容渲染器：先把 `[包名:名字]` 表情 token 换成行内图片，再交给 Markdown 渲染。列表、预览、ERP 回复弹窗都用它。

### 路径

- `src/app/common_ui/fl_ui/fl-comment-content/fl-comment-content.component.{ts,html,css}`

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `content` | 原始内容（可含表情 token） | `string \| null` | `''` |

样式在全局 `common_ui/css/markdown-comment.css`：`<markdown>` 以 innerHTML 注入内容，拿不到组件作用域属性，所以主题只能走全局。内容里的表情包靠 URL 片段标记识别：

- token `[方长:饭饭饿饿]` → `![饭饭饿饿](<url>#fl-emoji "饭饭饿饿")`
- CSS 用 `img[src*="#fl-emoji"]` 命中，固定 28px + `vertical-align: bottom`
- **行高与表情尺寸是一套的**：`.fl-comment-content` 的 `line-height` 固定为 28px（= 表情高度），配合 `vertical-align: bottom` 让表情正好占满行盒。这样**有没有表情每行高度都一样**，不会出现「有表情的行高、纯文字的行矮」的跳变。**改表情尺寸时必须同步改 line-height**
- 标记放在**地址片段**而不是 `title`：`title` 会被浏览器当原生悬停提示显示出来（会看到 "fl-emoji" 这串英文）；放进片段后 alt 和 title 都能放表情名，片段不参与图片请求也不影响加载
- **视觉重心微调**：站内表情的角色都是「上疏下密」（上方是耳朵和留白、下方是身体），alpha 加权重心低于几何中心（实测再花 58.0%、方长 55.5%），28px 下偏低约 2px，所以统一 `transform: translateY(-2px)` 往上提。`transform` 不参与布局，行高仍是恒定的 28px。可用 `--fc-emoji-lift` 覆盖（例如某套图取景不同，可在页面级单独调）
- 因此**不会**影响用户自己贴的图

可用 `--fc-content-font-size` 覆盖字号（留言页用 16px）。

## `fl-comment-card`

单条评论卡片。刻意不递归：子回复由 `fl-comment-board` 自己循环，卡片只负责一张脸，这样预览能直接复用同一个卡片。

### 路径

- `src/app/common_ui/fl_ui/fl-comment-card/fl-comment-card.component.{ts,html,css}`

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `comment` | 评论对象 | `CommentItem` | 必填 |
| `preview` | 预览态：隐藏待审核徽章与回复入口 | `boolean` | `false` |
| `showReplyButton` | 是否显示「回复」入口 | `boolean` | `false` |
| `replyActive` | 回复框已展开（按钮文案切到「取消回复」） | `boolean` | `false` |
| `avatarSize` | 头像尺寸（px） | `number` | `40` |
| `replyToggle` | 点击回复/取消 | `EventEmitter<void>` | — |

内联回复框通过 `<ng-content select="[flCardExtras]">` 投影。

## `fl-emoji-picker`

表情选择器，分页由 `EMOJI_PACKS` 驱动：**再花 / 方长 / ฅ•ω•ฅ**。

### 路径

- `src/app/common_ui/fl_ui/fl-emoji-picker/fl-emoji-picker.component.{ts,html,css}`

### API

| 参数 | 说明 | 类型 | 默认值 |
|---|---|---|---|
| `emojiSelected` | 选中的表情：图片包发 token `[包名:名字]`，颜文字发原文 | `EventEmitter<string>` | — |
| `placement` | 弹出方向 | `'top' \| 'bottom' \| 'topLeft' \| 'bottomLeft'` | `'topLeft'` |

### 交互细节

- **名字提示是手写的**，没用 `nz-tooltip`。ng-zorro 的延迟取值是 `this.mouseEnterDelay || 0.15`，传 `0` 会被当成假值退回默认 150ms，做不到 0 延迟；而且它还有 overlay 淡入动画。手写版移入移出当帧生效（实测 6ms）。提示元素挂在 `.fe-flow` **外面**，否则会被滚动容器的 `overflow` 裁掉。
- **hover 上移**：移入 0.18s 抬 4px，移出 0.08s 快速归位（基础态写快、hover 态写慢）。表情区顶部留了 4px 内边距，否则第一行上移后会被裁掉。
- **记住上次用过的分页**：存 `localStorage.fl_emoji_active_pack`，下次打开停在那里；没存过或分页已不存在时回落到第一个（再花）。只在**点选表情**时写入，切分页浏览不算。
- 弹窗宽度 574px = 10 列 × 54px + 9 × 2px 间距 + 16px 内边距；窄屏由 `max-width: calc(100vw - 24px)` 兜底自动换列。

### 新增表情包

不需要改本组件：

1. 把图片目录放进 `src/assets`（支持 png / gif / webp 等 `<img>` 能显示的格式）
2. 在 `FlowersInkV2/scripts/emoji.config.json` 的 `packs` 里加一项（`order` 可控展示顺序）
3. 在 `FlowersInkV2` 下跑 `npm run emoji:manifest`

该脚本会同时生成主站与 ERP 两份清单（ERP 那份是主站绝对地址，因为图片不在 ERP 包里）。

## Form State Spec

Path: `src/styles.css`

Use this spec for all future form controls (`input` / `textarea` / `nz-input-group` / `nz-select`) to keep state behavior consistent.

### States

| State | Rule |
|---|---|
| Default | `--fi-form-bg`, `--fi-form-border`, `--fi-form-text` |
| Hover | `--fi-form-bg-hover`, `--fi-form-border-hover` |
| Focus | `--fi-form-border-focus`, `--fi-form-focus-ring` |
| Disabled | `--fi-form-bg-disabled`, `--fi-form-disabled-border`, `--fi-form-disabled-text` |
| Placeholder | `--fi-form-placeholder` |

### Tokens

| CSS Variable | Purpose |
|---|---|
| `--fi-form-bg` | default background |
| `--fi-form-bg-hover` | hover background |
| `--fi-form-bg-disabled` | disabled background |
| `--fi-form-text` | text color |
| `--fi-form-placeholder` | placeholder color |
| `--fi-form-border` | default border |
| `--fi-form-border-hover` | hover border |
| `--fi-form-border-focus` | focus border |
| `--fi-form-disabled-border` | disabled border |
| `--fi-form-disabled-text` | disabled text |
| `--fi-form-focus-ring` | focus ring |

## Motion Spec

Path: `src/styles.css`

Use the same motion tokens for cards/buttons/dropdowns/drawers to keep interaction rhythm consistent.

| CSS Variable | Purpose |
|---|---|
| `--fi-motion-fast` | hover/focus quick feedback |
| `--fi-motion-normal` | card/dropdown/drawer transition |
| `--fi-motion-slow` | long transitions |
| `--fi-ease-standard` | unified easing curve |
| `--fi-motion-lift` | hover translate offset (set to `0px` for no lift) |

## Typography Spec

Path: `src/app/common_ui/css/fi-base.css`

Use these semantic classes instead of ad-hoc font-size / font-weight / color combos.

| Class | Usage |
|---|---|
| `.fi-text-title-1` | Page-level heading |
| `.fi-text-title-2` | Section-level heading |
| `.fi-text-body` | Paragraph / body text |
| `.fi-text-caption` | Secondary / helper text |
| `.fi-text-strong` | Emphasized inline text (inherit parent size) |
| `.fi-text-link` | Hyperlink-style text |

## Color / Functional Tokens

Path: `src/app/common_ui/css/fi-tokens.css`

| Token | Purpose |
|---|---|
| `--fi-primary` / `--fi-primary-hover` / `--fi-primary-active` | Brand primary |
| `--fi-success` / `--fi-success-bg` | Success semantic |
| `--fi-warning` / `--fi-warning-bg` | Warning semantic |
| `--fi-danger` / `--fi-danger-bg` | Danger / error semantic |
| `--fi-info` / `--fi-info-bg` | Info semantic |
| `--fi-text-heading` / `--fi-text-body` / `--fi-text-caption` | Text hierarchy |
| `--fi-bg-page` / `--fi-bg-container` / `--fi-bg-elevated` | Background hierarchy |
| `--fi-border` / `--fi-border-strong` | Border hierarchy |
| `--fi-control-height-sm` / `--fi-control-height-md` / `--fi-control-height-lg` | Form control sizing |

## Font Size / Weight Spec

| Token | Value |
|---|---|
| `--fi-font-size-xs` | 12px |
| `--fi-font-size-sm` | 13px |
| `--fi-font-size-md` | 14px |
| `--fi-font-size-lg` | 16px |
| `--fi-font-size-xl` | 18px |
| `--fi-font-size-2xl` | 24px |
| `--fi-font-weight-regular` | 400 |
| `--fi-font-weight-medium` | 500 |
| `--fi-font-weight-semibold` | 600 |
| `--fi-font-weight-bold` | 700 |

## Spacing Scale

| Token | Value |
|---|---|
| `--fi-space-1` | 4px |
| `--fi-space-2` | 8px |
| `--fi-space-3` | 12px |
| `--fi-space-4` | 16px |
| `--fi-space-5` | 20px |
| `--fi-space-6` | 24px |
| `--fi-space-7` | 32px |
| `--fi-space-8` | 40px |
