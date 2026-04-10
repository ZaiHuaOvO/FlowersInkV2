# FlowersInk NG-ZORRO 剥离计划

更新时间：2026-04-10

## 命名规范
- 自定义组件统一使用 `fl-` 前缀（示例：`fl-button`、`fl-tag`）。
- 手写布局属性统一使用 `fl-*`（示例：`fl-flex`、`fl-vertical`、`fl-gap`）。

## 已完成

### 阶段 1（完成）
- 布局属性从 `data-fi-*` 统一迁移到 `fl-*`。
- `nz-divider` 替换为 `fl-divider`。
- `nz-tag` 替换为 `fl-tag`。
- 清理替换后的未使用导入。

### 阶段 2（已完成第一批）
- 新增并接入以下组件：
  - `fl-avatar`
  - `fl-alert`
  - `fl-skeleton`
  - `fl-ribbon`
- 已替换：
  - `nz-avatar` -> `fl-avatar`
  - `nz-alert` -> `fl-alert`
  - `nz-skeleton` -> `fl-skeleton`
  - `nz-ribbon` -> `fl-ribbon`
- 已移除对应模块引用：
  - `NzAvatarModule`
  - `NzAlertModule`
  - `NzSkeletonModule`
  - `NzBadgeModule`（仅作为 `nz-ribbon` 依赖时）
- `npm run build` 通过。

## 当前剩余高频 ng-zorro 使用（按 TS import 频率）
- `ng-zorro-antd/typography`
- `ng-zorro-antd/icon`
- `ng-zorro-antd/spin`
- `ng-zorro-antd/input`
- `ng-zorro-antd/image`
- `ng-zorro-antd/pagination`
- `ng-zorro-antd/message`
- `ng-zorro-antd/modal`
- `ng-zorro-antd/affix`
- `ng-zorro-antd/menu`
- `ng-zorro-antd/popover`
- `ng-zorro-antd/select`
- `ng-zorro-antd/collapse`

## 后续阶段划分

### 阶段 3（筛选与导航控件）
目标：先做交互风险低、复用收益高的控件层。  
组件组：
- `input`、`select`、`pagination`、`menu`、`affix`、`back-top`
- 对应：`fl-input`、`fl-select`、`fl-pagination`、`fl-menu`、`fl-affix`、`fl-back-top`

验收：
- 博客列表筛选/分页可用。
- 桌面与移动端导航行为一致。

### 阶段 4（内容容器组件）
组件组：
- `card`、`collapse`、`timeline`、`comment`、`list`、`page-header`、`anchor`、`layout`
- 对应：`fl-card`、`fl-collapse`、`fl-timeline`、`fl-comment`、`fl-list`、`fl-page-header`、`fl-anchor`、`fl-layout`

### 阶段 5（浮层与反馈组件）
组件组：
- `modal`、`drawer`、`popover`、`tooltip`、`popconfirm`、`dropdown`、`message`
- 对应：`fl-modal`、`fl-drawer`、`fl-popover`、`fl-tooltip`、`fl-popconfirm`、`fl-dropdown`、`fl-message`

### 阶段 6（基础能力收口）
组件组：
- `icon`、`typography`、`spin`、`image`
- 对应：`fl-icon`、`fl-typography`、`fl-spin`、`fl-image`

最终验收：
- 所有页面功能、样式、文案对齐。
- `package.json` 不再依赖 `ng-zorro-antd`。

