# 花墨主站 · 设计系统治理（v1.0）

- 状态：**Active**
- 适用范围：`FlowersInkV2`（主站）。ERP 后台另有一套 `fi-*` 实现，规则相同但文件独立，不在此文档维护。

## 1. 分层职责

| 层 | 文件 | 允许放 | 禁止放 |
|---|---|---|---|
| Token | `common_ui/css/fi-tokens.css` | 颜色、字号、行高、字重、间距、圆角、阴影、控件高度、动效参数、安全区、字体声明 | 任何具体组件的选择器 |
| Base | `fi-base.css` | reset、全局排版、`.fi-text-*`、utility、焦点环、reduced-motion 兜底、共享 keyframes | 业务语义类名 |
| Component | `fi-card/tag/form/alert/tabs/dots/timeline/layout/overrides.css`、`markdown-zaihua.css`、`markdown-comment.css`、`comment.css`、`fl_ui/*` | 跨页面复用的块、ng-zorro 覆盖 | 只服务一个页面的样式 |
| Feature | 各 `*.component.css` | 页面独有布局与业务表达 | 通用按钮/卡片/标签/排版样式 |

判定顺序：**token → 已有共享类 → 已有组件 → 新组件 → 页面私有**。跳过前四步直接写页面样式，视为违规。

## 2. 复用与回提

1. 写新样式前，先在 `common_ui/css/` 与 `fl_ui/` 里搜同名/近义类，再搜相邻页面。
2. 同一视觉作用出现在**第二处**时，必须回提到 Component 或 Base 层，两个引用点同批改。
3. 回提方式优先级：加 modifier 变体 > 加 token > 新建共享类 > 新建组件。
4. 回提后删除页面里的旧定义；不留「先留着保险」的副本。

## 3. 命名

- `--fi-*`：token。
- `.fi-*`：共享类；组件级状态用 `.fi-xxx--modifier`。
- `fl*`：Angular 指令/组件（`flCard`、`flTag`、`fl-button`）。
- 页面私有类不加前缀，但**不得使用 `.content`、`.menu`、`.item` 这类与别页同名的裸词**——Angular 封装能挡住样式串味，挡不住人读错。见迁移计划中的重命名批次。
- ng-zorro 覆盖一律写在 `fi-overrides.css` 或对应 `fi-*.css`，配合 `nz-xxx.fl-xxx-host` 形态；组件内部 `::ng-deep` 只在覆盖第三方 DOM 时使用，并写清为什么必须（`emulated` 封装够不到宿主与 CDK overlay）。

## 4. 样式加载顺序（重要）

`src/styles.css` 第一行用 `@import url('.../ng-zorro-antd.min.css') layer(vendor);` 把 ng-zorro 的预构建样式放进 **vendor 层**，其余 `common_ui` 与页面样式都是未分层的。

CSS 的层叠规则：**未分层规则永远胜过分层规则**（不看顺序、不看特异性）。所以：

- 我们的覆盖不再依赖 `angular.json` 里谁先谁后，也不会被同一选择器的 ng-zorro 规则顶掉。
- 自本次起，`fi-*.css` 中不再需要为覆盖 ng-zorro 写 `!important`；已有的一批已全部移除，计算样式与移除前**逐项一致**（用 `scripts/visual-check.mjs` 验证）。
- 新写覆盖时**不要**加 `!important`；只有在对抗第三方 **带 `!important` 的规则**或行内样式时才需要，并注明原因。
- 换肤/升级 ng-zorro 时，改动 vendor 层不影响我们的层，回归范围可控。

验证方式：`npm run visual` 前后各跑一次，`node scripts/visual-check.mjs --diff <before> <after>` 应无输出。

## 5. 变更顺序（改公共层时）

1. 改 `fi-tokens.css` / `fl_ui` / `fi-*.css`。
2. 同一次改动里更新 `/design`（值不落页面，组件 import 真实实现）。
3. 新增 token 时同步 `pages/design/design-tokens.data.ts`（只写名字与用途）。
4. 更新 `DESIGN.md` 中受影响的规则条目。
5. 在 `design-system-audit.md` 的例外表登记新例外（如有）。
6. 跑构建；在 375 / 1440 两个宽度看过受影响页面。

漏第 2 步视为未完成。

## 6. 审查清单（每次涉及样式的改动）

- 用了 `--fi-*` 还是裸值？
- 有没有第二份相同作用的实现？
- 通用样式有没有被错放进页面私有文件？
- hover / focus-visible / active / disabled / loading / empty / error 是否补齐？
- 可点元素是否键盘可达、触控 ≥44px？
- 移动端（≤768px）与桌面端都看过了吗？
- 有没有为了过检测器而写的空洞例外？

## 7. 自动化检测

- `npm run lint:css`：stylelint，拦裸色值、重复声明、过深嵌套（见 `stylelint.config.mjs`）。
- `npx impeccable detect src/`：设计反模式的静态检测；`detect http://localhost:4202/<route>` 才会跑对比度、标题层级等需要解析 DOM 的规则。
- `npm run visual`：用本机 Chrome 无头渲染全部路由，产出计算样式快照与截图（`.visual/`，不入库）。
  **默认拦截站点埋点上报**（`POST /site/visit`、`/site/visit/dwell`），本机测试不会计入访问统计；确实要计数时加 `--track`。
  命令：`npm run visual -- --out .visual/before`，改完再 `--out .visual/after`，最后
  `node scripts/visual-check.mjs --diff .visual/before .visual/after`。**视觉类改动必须用它做前后对比**，这是项目里唯一能挡住「看起来变了」的网。
- `--block-api` 会阻断接口，用于验收错误态。

## 8. 回滚边界

每批改动必须能单独 revert：
- token / 公共样式与页面迁移**不要放在同一提交**。
- 加载顺序调整单独一个提交。
- 组件归并（如评论样式、侧栏目录）单独一个提交。

## 9. 文档维护

- 本文只写长期有效的规则；一次性任务进 `design-system-migration-plan.md`。
- 规则与现状冲突时，先改现状或先改规则，**不要让两者并存**。
- 历史迁移记录见 `frontend-reuse-execution-handbook.md`（已归档，仅作参考）。
