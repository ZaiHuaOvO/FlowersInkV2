import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist', 'flowers-ink-v2', 'browser');
const indexPath = path.join(distRoot, 'index.html');
const siteOrigin = 'https://flowersink.com';
const apiOrigin = 'https://api.flowersink.com';
const siteName = '花墨';
const siteDescription = '花墨是再花的个人技术博客，记录 Angular、NestJS、前端开发与个人创作。';
const defaultOgImage = 'https://api.flowersink.com/img/logo.png';
const friendLinkLimit = 8;
const useMockData = process.env.FLOWERSINK_STATIC_SEO_MOCK === '1';
const allowOptionalFailure = process.env.FLOWERSINK_STATIC_SEO_OPTIONAL === '1';

marked.setOptions({
  breaks: true,
  gfm: true,
});

async function main() {
  await ensureDistExists();

  const template = await fs.readFile(indexPath, 'utf8');
  const { blogs, links } = await loadSiteData();

  const blogItems = blogs?.data?.data ?? [];
  const friendLinks = (links?.data?.data ?? [])
    .filter((item) => item?.name && item?.url);
  const sitemapXml = buildSitemapXml(blogItems);
  const rssXml = buildRssXml(blogItems);

  await Promise.all([
    writeFileEnsured(path.join(distRoot, 'robots.txt'), buildRobotsTxt()),
    writeFileEnsured(path.join(distRoot, 'sitemap.xml'), sitemapXml),
    writeFileEnsured(path.join(distRoot, 'rss.xml'), rssXml),
    writeFileEnsured(
      path.join(distRoot, 'link', 'index.html'),
      renderLinkPage(template, friendLinks),
    ),
    writeFileEnsured(
      path.join(distRoot, 'welcome', 'index.html'),
      renderWelcomePage(template, blogItems, friendLinks, '/'),
    ),
    writeFileEnsured(
      path.join(distRoot, 'index.html'),
      renderWelcomePage(template, blogItems, friendLinks, '/'),
    ),
    writeFileEnsured(
      path.join(distRoot, 'blog', 'all', 'index.html'),
      renderBlogListPage(template, blogItems, friendLinks, {
        canonicalPath: '/blog/all',
        description: '花墨博客归档，按时间收录再花发布的所有文章与随笔。',
        title: `博客归档 | ${siteName}`,
        heading: '博客归档',
      }),
    ),
    writeFileEnsured(
      path.join(distRoot, 'blog', 'article', 'index.html'),
      renderBlogListPage(
        template,
        blogItems.filter((item) => item?.type === '文章'),
        friendLinks,
        {
          canonicalPath: '/blog/article',
          description: '花墨技术文章列表，聚合 Angular、NestJS、前端开发与工程实践内容。',
          title: `技术文章 | ${siteName}`,
          heading: '技术文章',
        },
      ),
    ),
    writeFileEnsured(
      path.join(distRoot, 'blog', 'essay', 'index.html'),
      renderBlogListPage(
        template,
        blogItems.filter((item) => item?.type === '随笔'),
        friendLinks,
        {
          canonicalPath: '/blog/essay',
          description: '花墨随笔列表，记录再花的日常想法、总结与个人表达。',
          title: `随笔 | ${siteName}`,
          heading: '随笔',
        },
      ),
    ),
  ]);

  for (const blog of blogItems) {
    const filePath = path.join(
      distRoot,
      'blog',
      'blog-detail',
      String(blog.id),
      'index.html',
    );
    await writeFileEnsured(filePath, renderBlogDetailPage(template, blog, friendLinks));
  }
}

async function ensureDistExists() {
  try {
    await fs.access(indexPath);
  } catch {
    throw new Error(`SEO 导出失败，未找到构建产物: ${indexPath}`);
  }
}

async function fetchJson(endpoint, params = {}) {
  const url = new URL(endpoint, apiOrigin);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败: ${url} ${response.status}`);
  }

  return response.json();
}

async function loadSiteData() {
  if (useMockData) {
    return buildMockData();
  }

  try {
    const [blogs, links] = await Promise.all([
      fetchJson('/blog', {
        includeCommentUsers: 'false',
        includeContent: 'true',
        limit: '999',
      }),
      fetchJson('/site/link', {
        isApproved: 'true',
        page: '1',
        pageSize: '100',
      }),
    ]);

    return { blogs, links };
  } catch (error) {
    if (!allowOptionalFailure) {
      throw error;
    }

    console.warn('[seo] 静态 SEO 数据抓取失败，已按可选模式降级。', error);
    return buildMockData();
  }
}

function buildRobotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteOrigin}/sitemap.xml`,
    '',
  ].join('\n');
}

function renderWelcomePage(template, blogs, friendLinks, canonicalPath) {
  const featuredBlogs = blogs.filter((item) => item?.star).slice(0, 8);
  const linksMarkup = renderFriendLinks(friendLinks.slice(0, friendLinkLimit));
  const blogListMarkup = featuredBlogs.length
    ? featuredBlogs.map((blog) => `
      <article class="fi-seo-card">
        <h2><a href="/blog/blog-detail/${blog.id}">${escapeHtml(blog.title)}</a></h2>
        <p>${escapeHtml(normalizeDescription(blog.description || blog.content))}</p>
        <p class="fi-seo-meta">${escapeHtml(blog.type || '')} · ${escapeHtml(blog.tag || '')}</p>
      </article>
    `).join('')
    : '<p>精选文章整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>${siteName}</h1>
        <p>${escapeHtml(siteDescription)}</p>
      </header>
      <section class="fi-seo-section">
        <h2>精选文章</h2>
        ${blogListMarkup}
      </section>
      <section class="fi-seo-section">
        <h2>友情链接</h2>
        ${linksMarkup}
        <p><a href="/link">查看更多友链</a></p>
      </section>
    </main>
  `;

  return injectSeoHtml(template, {
    title: `${siteName} | 再花的个人技术博客`,
    description: siteDescription,
    canonicalPath,
    ogType: 'website',
    body,
  });
}

function renderBlogListPage(template, blogs, friendLinks, options) {
  const blogListMarkup = blogs.length
    ? blogs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((blog) => `
        <article class="fi-seo-card">
          <h2><a href="/blog/blog-detail/${blog.id}">${escapeHtml(blog.title)}</a></h2>
          <p>${escapeHtml(normalizeDescription(blog.description || blog.content))}</p>
          <p class="fi-seo-meta">${formatDate(blog.date)} · ${escapeHtml(blog.type || '')} · ${escapeHtml(blog.tag || '')}</p>
        </article>
      `).join('')
    : '<p>文章整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>${escapeHtml(options.heading)}</h1>
        <p>${escapeHtml(options.description)}</p>
      </header>
      <section class="fi-seo-section">
        ${blogListMarkup}
      </section>
      <aside class="fi-seo-side">
        <section class="fi-seo-section">
          <h2>友情链接</h2>
          ${renderFriendLinks(friendLinks.slice(0, friendLinkLimit))}
        </section>
      </aside>
    </main>
  `;

  return injectSeoHtml(template, {
    title: options.title,
    description: options.description,
    canonicalPath: options.canonicalPath,
    ogType: 'website',
    body,
  });
}

function renderLinkPage(template, friendLinks) {
  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>友情链接</h1>
        <p>这里收录花墨已审核的朋友站点链接。</p>
      </header>
      <section class="fi-seo-section">
        <h2>已审核友链</h2>
        ${renderFriendLinks(friendLinks)}
      </section>
    </main>
  `;

  return injectSeoHtml(template, {
    title: `友情链接 | ${siteName}`,
    description: '花墨友情链接页面，展示已审核的个人博客与独立站点。',
    canonicalPath: '/link',
    ogType: 'website',
    body,
  });
}

function renderBlogDetailPage(template, blog, friendLinks) {
  const title = `${blog.title} | ${siteName}`;
  const description = normalizeDescription(blog.description || blog.content);
  const canonicalPath = `/blog/blog-detail/${blog.id}`;
  const articleHtml = marked.parse(blog.content || '');
  const schema = buildArticleSchema(blog, canonicalPath, description);
  const breadcrumb = buildBreadcrumbSchema(blog, canonicalPath);

  const body = `
    <main class="fi-seo-shell fi-seo-article">
      <nav class="fi-seo-breadcrumb" aria-label="Breadcrumb">
        <a href="/welcome">首页</a>
        <span>/</span>
        <a href="/blog/all">博客归档</a>
        <span>/</span>
        <span>${escapeHtml(blog.title)}</span>
      </nav>
      <article>
        <header class="fi-seo-header">
          <h1>${escapeHtml(blog.title)}</h1>
          <p>${escapeHtml(description)}</p>
          <p class="fi-seo-meta">${escapeHtml(blog.type || '')} · ${escapeHtml(blog.tag || '')} · ${formatDate(blog.date)}</p>
        </header>
        <div class="fi-seo-markdown">
          ${articleHtml}
        </div>
      </article>
      <aside class="fi-seo-side">
        <section class="fi-seo-section">
          <h2>友情链接</h2>
          ${renderFriendLinks(friendLinks.slice(0, friendLinkLimit))}
        </section>
      </aside>
    </main>
  `;

  return injectSeoHtml(template, {
    title,
    description,
    canonicalPath,
    ogType: 'article',
    body,
    extraHead: `
      <meta property="article:published_time" content="${new Date(blog.date).toISOString()}">
      <meta property="article:section" content="${escapeHtmlAttr(blog.type || '博客')}">
      <meta property="article:tag" content="${escapeHtmlAttr(blog.tag || '')}">
      <script type="application/ld+json">${JSON.stringify(schema)}</script>
      <script type="application/ld+json">${JSON.stringify(breadcrumb)}</script>
    `,
  });
}

function injectSeoHtml(template, options) {
  const canonicalUrl = new URL(options.canonicalPath, siteOrigin).toString();
  const bodyContent = options.body;
  let html = cleanupDefaultHeadTags(template);

  const head = `
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeHtmlAttr(options.description)}">
    <meta name="robots" content="index,follow">
    <meta property="og:title" content="${escapeHtmlAttr(options.title)}">
    <meta property="og:description" content="${escapeHtmlAttr(options.description)}">
    <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}">
    <meta property="og:type" content="${escapeHtmlAttr(options.ogType)}">
    <meta property="og:image" content="${escapeHtmlAttr(defaultOgImage)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtmlAttr(options.title)}">
    <meta name="twitter:description" content="${escapeHtmlAttr(options.description)}">
    <meta name="twitter:image" content="${escapeHtmlAttr(defaultOgImage)}">
    <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}">
    <link rel="alternate" type="application/rss+xml" title="${siteName} RSS" href="${siteOrigin}/rss.xml">
    ${options.extraHead ?? ''}
  `;

  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, head)
    .replace(/<app-root>\s*<\/app-root>/i, `<app-root>${bodyContent}</app-root>`);

  html = html.replace(
    '</head>',
    `<style>${buildStaticSeoStyle()}</style></head>`,
  );

  return html;
}

function buildStaticSeoStyle() {
  return `
    app-root{display:block}
    app-root a{color:#8b5a2b;text-decoration:none}
    app-root a:hover{text-decoration:underline}
    .fi-seo-shell{display:flex;flex-direction:column;gap:24px}
    .fi-seo-header h1{margin:0 0 12px;font-size:2rem;line-height:1.2;color:#5b3f20}
    .fi-seo-header p,.fi-seo-meta{margin:0;color:#6f604f;line-height:1.7}
    .fi-seo-section{display:flex;flex-direction:column;gap:12px}
    .fi-seo-section h2{margin:0;font-size:1.25rem;color:#5b3f20}
    .fi-seo-card,.fi-seo-link-item{padding:16px 18px;border:1px solid #e6d6c0;border-radius:16px;background:#fff}
    .fi-seo-card h2{margin:0 0 8px;font-size:1.15rem}
    .fi-seo-card p{margin:0 0 8px;line-height:1.8}
    .fi-seo-link-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
    .fi-seo-link-item h3{margin:0 0 6px;font-size:1rem}
    .fi-seo-link-item p{margin:0;color:#6f604f;line-height:1.7}
    .fi-seo-article{gap:32px}
    .fi-seo-markdown{line-height:1.9}
    .fi-seo-markdown img{max-width:100%;height:auto}
    .fi-seo-markdown pre{overflow:auto;padding:16px;border-radius:12px;background:#f5efe5}
    .fi-seo-breadcrumb{display:flex;gap:8px;flex-wrap:wrap;color:#6f604f}
    .fi-seo-side{display:flex;flex-direction:column;gap:16px}
    @media (min-width: 960px){.fi-seo-article{display:grid;grid-template-columns:minmax(0,1fr) 280px;align-items:start}}
  `;
}

function renderFriendLinks(friendLinks) {
  if (!friendLinks.length) {
    return '<p>友情链接整理中。</p>';
  }

  return `
    <div class="fi-seo-link-list">
      ${friendLinks.map((link) => `
        <article class="fi-seo-link-item">
          <h3><a href="${escapeHtmlAttr(link.url)}" target="_blank" rel="noopener external">${escapeHtml(link.name)}</a></h3>
          <p>${escapeHtml(link.description || '')}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function buildArticleSchema(blog, canonicalPath, description) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description,
    author: {
      '@type': 'Person',
      name: '再花',
    },
    publisher: {
      '@type': 'Person',
      name: '再花',
    },
    datePublished: new Date(blog.date).toISOString(),
    dateModified: new Date(blog.date).toISOString(),
    mainEntityOfPage: `${siteOrigin}${canonicalPath}`,
  };
}

function buildBreadcrumbSchema(blog, canonicalPath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '首页',
        item: `${siteOrigin}/welcome`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '博客归档',
        item: `${siteOrigin}/blog/all`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: `${siteOrigin}${canonicalPath}`,
      },
    ],
  };
}

function buildSitemapXml(blogs) {
  const staticUrls = [
    '/',
    '/welcome',
    '/blog/all',
    '/blog/article',
    '/blog/essay',
    '/link',
    '/rss.xml',
  ];

  const entries = [
    ...staticUrls.map((url) => ({ url, lastmod: null })),
    ...blogs.map((blog) => ({
      url: `/blog/blog-detail/${blog.id}`,
      lastmod: blog.date,
    })),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(({ url, lastmod }) => `  <url>\n    <loc>${escapeXml(siteOrigin + url)}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}\n  </url>`)
    .join('\n')}\n</urlset>\n`;
}

function buildRssXml(blogs) {
  const items = blogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)
    .map((blog) => `  <item>\n    <title>${escapeXml(blog.title)}</title>\n    <link>${escapeXml(`${siteOrigin}/blog/blog-detail/${blog.id}`)}</link>\n    <guid>${escapeXml(`${siteOrigin}/blog/blog-detail/${blog.id}`)}</guid>\n    <description>${escapeXml(normalizeDescription(blog.description || blog.content))}</description>\n    <pubDate>${new Date(blog.date).toUTCString()}</pubDate>\n  </item>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${escapeXml(`${siteName} RSS`)}</title>\n  <link>${escapeXml(siteOrigin)}</link>\n  <description>${escapeXml(siteDescription)}</description>\n  <language>zh-CN</language>\n${items}\n</channel>\n</rss>\n`;
}

function buildMockData() {
  return {
    blogs: {
      data: {
        data: [
          {
            id: 1,
            title: '花墨 SEO 静态页示例',
            description: '用于离线验证构建链路的示例文章。',
            content: '# 花墨 SEO 静态页示例\n\n这是一篇用于本地构建验证的示例文章。',
            type: '文章',
            tag: 'Angular,SEO',
            star: true,
            date: '2026-05-26T00:00:00.000Z',
          },
        ],
      },
    },
    links: {
      data: {
        data: [
          {
            name: 'FlowersInk',
            url: siteOrigin,
            description: 'A personal blog by Zaihua',
          },
        ],
      },
    },
  };
}

function normalizeDescription(value) {
  return String(value ?? '')
    .replace(/[#>*`[\]_~-]/g, ' ')
    .replace(/\!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160) || siteDescription;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

async function writeFileEnsured(targetPath, content) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, 'utf8');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function removeTagAll(input, pattern) {
  return input.replace(pattern, '');
}

function cleanupDefaultHeadTags(input) {
  let html = input;
  html = removeTagAll(html, /<link rel="canonical"[^>]*>/gi);
  html = removeTagAll(html, /<meta property="og:title"[^>]*>/gi);
  html = removeTagAll(html, /<meta property="og:description"[^>]*>/gi);
  html = removeTagAll(html, /<meta property="og:image"[^>]*>/gi);
  html = removeTagAll(html, /<meta property="og:url"[^>]*>/gi);
  html = removeTagAll(html, /<meta property="og:type"[^>]*>/gi);
  html = removeTagAll(html, /<meta name="description"[^>]*>/gi);
  html = removeTagAll(html, /<meta name="keywords"[^>]*>/gi);
  html = removeTagAll(html, /<meta name="robots"[^>]*>/gi);
  return html;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
