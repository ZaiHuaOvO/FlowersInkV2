#!/usr/bin/env node
/**
 * 只重新生成 `sitemap.xml` 与 `rss.xml`，供服务器定时任务调用。
 *
 * 为什么单独做这一件事：这两个文件原本只在主站**构建**时生成，而文章是通过 ERP
 * 直接写进接口的、不需要重新部署主站，于是新文章会立刻出现在站点上，却要等到
 * 下次部署才进 sitemap 与 RSS。这个脚本让它们在服务器上定时重跑。
 *
 * 依赖只有 Node 内置模块 + 全局 fetch，**不需要 node_modules**；
 * 生成逻辑与构建时共用 scripts/seo-files.mjs，两边不会走偏。
 *
 * 用法：
 *   node generate-seo-files.mjs --out /www/wwwroot/FlowersInkV2/browser
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRssXml, buildSitemapXml, SITE_ORIGIN } from './seo-files.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_ORIGIN = process.env.FLOWERSINK_API_ORIGIN ?? 'https://api.flowersink.com';

/** 与构建时 scripts/generate-static-seo.mjs 请求的参数保持一致 */
const BLOG_QUERY = 'includeCommentUsers=false&includeContent=true&limit=999';

/** 接口拿到的文章数少于这个值就认为不对劲，宁可不写也不要覆盖成残缺内容 */
const MIN_EXPECTED_BLOGS = 10;

function parseOutDir(argv) {
  const index = argv.indexOf('--out');
  if (index !== -1 && argv[index + 1]) {
    return path.resolve(argv[index + 1]);
  }
  // 服务器上的默认布局：脚本在 <项目>/scripts/，产物在 <项目>/browser/
  return path.resolve(__dirname, '..', 'browser');
}

/** 先写临时文件再改名，避免进程中途挂掉留下半截文件 */
async function writeAtomic(filePath, content) {
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, content, 'utf8');
  await fs.rename(tmp, filePath);
}

async function main() {
  const outDir = parseOutDir(process.argv.slice(2));
  const startedAt = Date.now();

  const url = `${API_ORIGIN}/blog?${BLOG_QUERY}`;
  // CDN 的 Referer 白名单会拦掉不带 Referer 的请求，本方脚本必须自报来源
  const response = await fetch(url, { headers: { Referer: SITE_ORIGIN } });
  if (!response.ok) {
    throw new Error(`拉取文章列表失败：HTTP ${response.status} ${url}`);
  }

  const payload = await response.json();
  const blogs = payload?.data?.data;

  if (!Array.isArray(blogs)) {
    throw new Error('文章列表返回结构不符合预期，未写入任何文件');
  }
  if (blogs.length < MIN_EXPECTED_BLOGS) {
    throw new Error(
      `只拿到 ${blogs.length} 篇文章（低于 ${MIN_EXPECTED_BLOGS} 篇），疑似接口异常，未写入任何文件`,
    );
  }

  await fs.mkdir(outDir, { recursive: true });
  await writeAtomic(path.join(outDir, 'rss.xml'), buildRssXml(blogs));
  await writeAtomic(path.join(outDir, 'sitemap.xml'), buildSitemapXml(blogs));

  console.log(
    `[generate-seo-files] 已更新 ${outDir} 下的 rss.xml 与 sitemap.xml，` +
      `共 ${blogs.length} 篇文章，耗时 ${Date.now() - startedAt}ms`,
  );
}

main().catch((error) => {
  console.error(`[generate-seo-files] ${error.message}`);
  process.exitCode = 1;
});
