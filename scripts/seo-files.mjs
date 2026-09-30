/**
 * 站点级 SEO 文件的生成逻辑：`sitemap.xml` 与 `rss.xml`。
 *
 * 刻意**不依赖任何 npm 包**，两个调用方共用这一份实现：
 *   1. 构建时 —— `generate-static-seo.mjs` 生成整套静态页时一并产出；
 *   2. 服务器定时 —— `generate-seo-files.mjs` 用裸 Node 每小时重跑，
 *      因为服务器上只有主站的部署产物、没有仓库的 node_modules。
 *
 * 改这里的输出格式会同时影响构建与线上定时任务，两边都会跟着变，这是有意的。
 */

export const SITE_ORIGIN = 'https://flowersink.com';
export const SITE_NAME = '花墨';
export const SITE_LANGUAGE = 'zh-CN';
export const SITE_IMAGE = 'https://api.flowersink.com/img/logo.png';

/** 站点描述：给 meta / 结构化数据等 SEO 场景用，偏长、带关键词 */
export const SITE_DESCRIPTION =
  '花墨是再花（前端工程师）的个人博客，记录生活随笔、书影音测评、美食旅行见闻与技术开发实践。';

/** RSS 频道描述：订阅列表里显示的简介，刻意比站点描述短、更像一句话 */
export const RSS_DESCRIPTION = '再花的个人博客：生活随笔、书影音与折腾记录。';

/** RSS 最多收录多少篇（保持订阅体积可控） */
export const RSS_ITEM_LIMIT = 50;

/** 目录型路径统一补尾斜杠，与 nginx 实际服务地址保持一致 */
export function withTrailingSlash(urlPath) {
  if (urlPath === '/' || urlPath.includes('.') || urlPath.endsWith('/')) {
    return urlPath;
  }
  return `${urlPath}/`;
}

export function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 把 markdown 正文压成一行纯文本摘要，供 RSS 的 description 使用 */
export function normalizeDescription(value) {
  return (
    String(value ?? '')
      .replace(/[#>*`[\]_~-]/g, ' ')
      .replace(/\!\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160) || SITE_DESCRIPTION
  );
}

export function buildRssXml(blogs) {
  const items = blogs
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, RSS_ITEM_LIMIT)
    .map((blog) => {
      const tags = String(blog.tag ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const categories = tags
        .map((tag) => `<category>${escapeXml(tag)}</category>`)
        .join('');
      const detailUrl = `${SITE_ORIGIN}${withTrailingSlash(`/blog/blog-detail/${blog.id}`)}`;
      return `  <item>\n    <title>${escapeXml(blog.title)}</title>\n    <link>${escapeXml(detailUrl)}</link>\n    <guid>${escapeXml(detailUrl)}</guid>\n${categories}    <description>${escapeXml(normalizeDescription(blog.description || blog.content))}</description>\n    <pubDate>${new Date(blog.date).toUTCString()}</pubDate>\n  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${escapeXml(SITE_NAME)}</title>\n  <link>${escapeXml(`${SITE_ORIGIN}/`)}</link>\n  <description>${escapeXml(RSS_DESCRIPTION)}</description>\n  <language>${SITE_LANGUAGE}</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n  <image>\n    <url>${escapeXml(SITE_IMAGE)}</url>\n    <title>${escapeXml(SITE_NAME)}</title>\n    <link>${escapeXml(`${SITE_ORIGIN}/`)}</link>\n  </image>\n${items}\n</channel>\n</rss>\n`;
}

export function buildSitemapXml(blogs) {
  const staticUrls = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/welcome', changefreq: 'monthly', priority: 0.6 },
    { url: '/blog/all', changefreq: 'weekly', priority: 0.8 },
    { url: '/blog/article', changefreq: 'weekly', priority: 0.8 },
    { url: '/link', changefreq: 'weekly', priority: 0.5 },
    { url: '/about', changefreq: 'monthly', priority: 0.5 },
    { url: '/book', changefreq: 'monthly', priority: 0.5 },
    { url: '/game', changefreq: 'monthly', priority: 0.5 },
    { url: '/equipment', changefreq: 'monthly', priority: 0.5 },
    { url: '/changelog', changefreq: 'monthly', priority: 0.3 },
    { url: '/life', changefreq: 'weekly', priority: 0.6 },
    { url: '/rss.xml', changefreq: 'daily', priority: 0.4 },
  ];

  const entries = [
    ...staticUrls.map(({ url, changefreq, priority }) => ({
      url,
      changefreq,
      priority,
      lastmod: null,
    })),
    ...blogs.map((blog) => ({
      url: `/blog/blog-detail/${blog.id}`,
      changefreq: 'weekly',
      priority: blog.star ? 0.9 : 0.7,
      lastmod: blog.date,
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(
      ({ url, lastmod, changefreq, priority }) =>
        `  <url>\n    <loc>${escapeXml(SITE_ORIGIN + withTrailingSlash(url))}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority !== undefined ? `\n    <priority>${priority}</priority>` : ''}\n  </url>`,
    )
    .join('\n')}\n</urlset>\n`;
}
