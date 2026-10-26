/**
 * 样式治理的自动哨兵。
 *
 * 这里只放三条最容易失控、且不依赖项目结构的规则，全部以 warning 输出：
 * 它们的作用是「让裸值出现在 review 里」，不是让构建失败。
 * 真正的判断标准在 DESIGN.md，命中不一定错（见 §9 品牌例外）。
 *
 * fi-tokens.css 是 token 的唯一来源，必须允许写十六进制，故整体忽略。
 */
export default {
  ignoreFiles: ['dist/**', 'src/app/common_ui/css/fi-tokens.css'],
  rules: {
    'color-no-hex': [true, { severity: 'warning' }],
    'declaration-block-no-duplicate-properties': [
      true,
      {
        // 允许 a/b 两行同属性不同值：既有 100vh → 100dvh 这类兼容写法
        ignore: ['consecutive-duplicates-with-different-values'],
      },
    ],
    'max-nesting-depth': [4, { severity: 'warning' }],
  },
};
