# FlowersInk UI (`fl_ui`)

统一维护站内可复用 UI 组件（Angular Standalone），服务于深棕/浅棕/白色主题。

## 组件索引

| 组件 | 说明 | 路径 | 文档跳转 |
|---|---|---|---|
| `fl-button` | 通用按钮（CTA、提交、路由跳转） | `src/app/common_ui/fl_ui/fl-button/fl-button.component.ts` | [前往](#fl-button) |
| `fl-input` | 通用输入样式指令（输入框、文本域） | `src/app/common_ui/fl_ui/fl-input/fl-input.directive.ts` | [前往](#fl-input) |
| `fl-card` | 通用卡片样式指令（静态/悬浮） | `src/app/common_ui/fl_ui/fl-card/fl-card.directive.ts` | [前往](#fl-card) |

## 目录

- [`fl-button`](#fl-button)
- [`fl-input`](#fl-input)
- [`fl-card`](#fl-card)

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
| `disabled` | 禁用态 | `boolean` | `false` |
| `block` | 是否铺满容器 | `boolean` | `false` |
| `routerLink` | Angular 路由跳转 | `string \| readonly string[] \| any[] \| null` | `null` |

### 主题变量

变量来源: `src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-primary` | 主棕色 |
| `--fi-primary-hover` | Hover 主色 |
| `--fi-primary-active` | Active 主色 |
| `--fi-primary-outline` | Focus 描边色 |
| `--fi-surface` | 按钮底色 |
| `--fi-surface-soft` | Hover 背景色 |
| `--fi-border` | 边框色 |
| `--fi-radius-sm` | 按钮圆角 |
| `--fi-font-base` | 字体栈 |
| `--fi-space-3` | 横向间距 |

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

变量来源: `src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-input-radius` | 输入框圆角（默认 `5px`） |
| `--fi-input-border-color` | 输入框边框色 |
| `--fi-primary` | 焦点主色 |
| `--fi-primary-outline` | 焦点阴影色 |

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

变量来源: `src/styles.css`

| CSS 变量 | 说明 |
|---|---|
| `--fi-surface` | 卡片背景 |
| `--fi-border` | 卡片边框色 |
| `--fi-radius-md` | 卡片圆角 |
| `--fi-shadow-soft` | 默认阴影 |
| `--fi-shadow-hover` | Hover 阴影 |
| `--fi-surface-soft` | Hover 背景 |
