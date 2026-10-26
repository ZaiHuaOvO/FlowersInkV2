# 前端复用迁移执行手册（已归档）

> **状态：Archived（2026-10-26）**
>
> 本文描述的是一次**已经完成**的迁移（about 模块拆分 → 合并、`fi-tabs` / `fi-dots` 提取、移动端双轨制收敛）。
> 它引用的 `about/me`、`about/website`、`about/message` 三个文件/页面**在当前代码里已不存在**，按本文操作会改到不存在的路径。
>
> 现行的规则与流程请看：
> - `DESIGN.md` —— 设计规则
> - `src/docs/ai/design-system-governance.md` —— 分层、复用、回提、审查
> - `src/docs/ai/design-system-audit.md` —— 证据与例外
> - `src/docs/ai/design-system-migration-plan.md` —— 后续批次
>
> 旧版全文见 git 历史（本文件重写前的最后一次提交）。

## 仍然有效的决策卡

以下判断在本次迁移之外依然成立，故保留：

| 场景 | 结论 |
|---|---|
| 新页面要写标题 | 用 `.fi-text-title-1` / `.fi-text-title-2`，不要自写 `font-size` |
| 要给文字加粗 | 用 `.fi-text-strong`，不要写 `font-weight: 700` |
| 两个页面都有同类块 | 提取到 `fi-*.css` 或 `fl_ui/`，禁止复制 |
| 只有本页用的特殊布局 | 留在页面 `.component.css` |
| 移动端样式怎么写 | 用 `@media (max-width: 768px)` 覆盖同一个类，不新增 `.mobile-*` 前缀 |
| 第三方组件覆盖写哪 | `fi-overrides.css` 或对应 `fi-*.css`，并注明为何需要 `!important` |
| token 里没有这个值 | 先判断是否通用：通用则加 token，否则用最接近的现有 token |
| 改了共享样式 | 回归所有引用页面，并在 `/design` 同步 |

## 历史验收指标（已完成，留作参照）

- about 模块页面私有 CSS 行数下降 30%+：已完成（拆分的页面后来合并回单页）。
- 重复 class：`.tab-bar` / `.tab` / `.dots` 等已提取为 `fi-tabs.css` / `fi-dots.css`。
- 移动端 `.mobile-*` 双轨制：about 模块已消除；全站新代码不再新增。
