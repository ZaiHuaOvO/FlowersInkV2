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

## 目录

- [`fl-button`](#fl-button)
- [`fl-input`](#fl-input)
- [`fl-card`](#fl-card)
- [`fl-tag`](#fl-tag)
- [`fl-alert`](#fl-alert)

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
