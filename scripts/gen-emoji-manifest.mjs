#!/usr/bin/env node
/**
 * 生成表情包清单（emoji pack manifest）。
 *
 * 为什么要生成而不是运行时扫目录：Angular 打包后无法在浏览器里列目录，
 * 所以可选表情必须是构建期的静态数据。
 *
 * 输入：scripts/emoji.config.json
 * 输出：见配置里的 targets（主站一份相对地址，ERP 一份绝对地址镜像）
 *
 * 新增表情包 tab：丢一个图片目录进 src/assets，在 emoji.config.json 的 packs
 * 里加一项，重跑 `npm run emoji:manifest`。不需要改任何组件代码。
 *
 * 支持 png / gif / webp / jpg 等任意 <img> 能显示的格式，按扩展名过滤。
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(projectRoot, 'scripts', 'emoji.config.json');

/** 每个路径段单独编码：中文目录名/文件名进 URL 必须编码，但不能把分隔符也编掉 */
function encodePathSegment(segment) {
  return encodeURIComponent(segment);
}

function buildPack(config) {
  const absDir = join(projectRoot, config.dir);
  if (!existsSync(absDir) || !statSync(absDir).isDirectory()) {
    throw new Error(`表情包目录不存在: ${config.dir}`);
  }

  const exts = config.ext.map((e) => e.toLowerCase());
  const names = readdirSync(absDir)
    .filter((f) => exts.includes(extname(f).toLowerCase()))
    .map((f) => basename(f, extname(f)));

  // 按配置的 order 排序；未列出的排在最后（保持稳定，便于发现漏配）
  const order = Array.isArray(config.order) ? config.order : null;
  let sorted;
  if (order) {
    const rank = new Map(order.map((n, i) => [n, i]));
    const known = names.filter((n) => rank.has(n)).sort((a, b) => rank.get(a) - rank.get(b));
    const unknown = names.filter((n) => !rank.has(n)).sort((a, b) => a.localeCompare(b, 'zh'));
    if (unknown.length) {
      console.warn(`  ⚠ ${config.key}: 以下文件不在 order 里，已排到末尾 —— ${unknown.join('、')}`);
    }
    const missing = order.filter((n) => !names.includes(n));
    if (missing.length) {
      console.warn(`  ⚠ ${config.key}: order 里的这些名字找不到对应文件，已忽略 —— ${missing.join('、')}`);
    }
    sorted = [...known, ...unknown];
  } else {
    sorted = [...names].sort((a, b) => a.localeCompare(b, 'zh'));
  }

  return { pack: config, names: sorted };
}

function renderTs(built, baseUrl, sourceNote) {
  const packs = built.map(({ pack, names }) => {
    const items = names.map((name) => {
      const file = `${name}${pack.ext[0]}`;
      const url = `${baseUrl}/${encodePathSegment(pack.key)}/${encodePathSegment(file)}`;
      return `      { name: ${JSON.stringify(name)}, url: ${JSON.stringify(url)} },`;
    });
    return [
      '  {',
      `    key: ${JSON.stringify(pack.key)},`,
      `    label: ${JSON.stringify(pack.label ?? pack.key)},`,
      `    tab: ${JSON.stringify(pack.tab ?? pack.key)},`,
      `    type: 'image',`,
      `    items: [`,
      ...items,
      '    ],',
      '  },',
    ].join('\n');
  });

  return `/* eslint-disable */
// ⚠️ 此文件由 FlowersInkV2/scripts/gen-emoji-manifest.mjs 自动生成，请勿手动编辑。
// 重新生成：cd FlowersInkV2 && npm run emoji:manifest
// 图片来源：${sourceNote}

export interface EmojiPackItem {
  /** 显示名；也是 token 里用的名字，形如 [包名:显示名] */
  name: string;
  /** 已 URL 编码的图片地址 */
  url: string;
}

export interface EmojiImagePack {
  key: string;
  label: string;
  /** 弹窗顶部的分页名；多个包共用同一个 tab 就会并到同一页，页内按包顺序排列 */
  tab: string;
  type: 'image';
  items: EmojiPackItem[];
}

export const EMOJI_IMAGE_PACKS: EmojiImagePack[] = [
${packs.join('\n')}
];
`;
}

function main() {
  if (!existsSync(configPath)) {
    throw new Error(`找不到配置: ${configPath}`);
  }
  const config = JSON.parse(readFileSync(configPath, 'utf8'));

  console.log('扫描表情包目录…');
  const built = config.packs.map((p) => {
    const b = buildPack(p);
    console.log(`  ${p.key}: ${b.names.length} 个（${p.dir}）`);
    return b;
  });

  const sourceNote = config.packs.map((p) => p.dir.replace(/^src\//, '')).join('、');
  const summary = built.map((b) => `${b.pack.key} ${b.names.length}`).join(' / ');

  for (const target of config.targets) {
    const outPath = join(projectRoot, target.out);
    const content = renderTs(built, target.baseUrl, sourceNote);
    mkdirSync(dirname(outPath), { recursive: true });

    // 内容没变就不写，避免无意义的文件时间戳变动
    let prev = null;
    try {
      prev = readFileSync(outPath, 'utf8');
    } catch {
      /* 首次生成 */
    }
    if (prev === content) {
      console.log(`  = ${target.out} 无变化`);
    } else {
      writeFileSync(outPath, content, 'utf8');
      console.log(`  ✓ ${target.out}`);
    }
  }

  console.log(`\n完成：${summary}。`);
}

main();
