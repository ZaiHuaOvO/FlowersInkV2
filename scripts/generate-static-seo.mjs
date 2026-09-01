import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distRoot = path.join(projectRoot, 'dist', 'flowers-ink-v2', 'browser');
// 模板读取 Angular 构建产物（含 <script> 注入），而非源码模板（源码无 script 标签）
const templatePath = path.join(distRoot, 'index.html');
const siteOrigin = 'https://flowersink.com';
const apiOrigin = 'https://api.flowersink.com';
const siteName = '花墨';
const siteDescription =
  '花墨是再花（前端工程师）的个人博客，记录生活随笔、书影音测评、美食旅行见闻与技术开发实践。';
const siteLanguage = 'zh-CN';
const defaultOgImage = 'https://api.flowersink.com/img/logo.png';
const friendLinkLimit = 8;
const useMockData = process.env.FLOWERSINK_STATIC_SEO_MOCK === '1';
const allowOptionalFailure = process.env.FLOWERSINK_STATIC_SEO_OPTIONAL === '1';
const changelogDataPath = path.join(
  projectRoot,
  'src',
  'app',
  'pages',
  'changelog',
  'changelog-data.json',
);

marked.setOptions({
  breaks: true,
  gfm: true,
});

/** 目录型路径统一补尾斜杠，与 nginx 实际服务地址保持一致 */
function withTrailingSlash(urlPath) {
  if (urlPath === '/' || urlPath.includes('.') || urlPath.endsWith('/')) {
    return urlPath;
  }
  return `${urlPath}/`;
}

/** 提取 markdown 正文第一张图片地址 */
function extractFirstImage(content) {
  const match = String(content ?? '').match(/!\[[^\]]*]\(([^)]+)\)/);
  return match ? match[1] : null;
}

/** 图片地址转绝对地址（相对路径补全到 API 域名） */
function toAbsoluteImageUrl(url) {
  const value = String(url ?? '').trim();
  if (!value) {
    return null;
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  try {
    return new URL(value, apiOrigin).toString();
  } catch {
    return null;
  }
}

async function main() {
  await ensureDistExists();

  const template = await fs.readFile(templatePath, 'utf8');
  const data = await loadSiteData();

  const blogItems = data.blogs?.data?.data ?? [];
  const friendLinks = (data.links?.data?.data ?? []).filter(
    (item) => item?.name && item?.url,
  );
  const books = data.books?.data?.books ?? [];
  const games = data.games?.data?.games ?? [];
  const equipmentCategories = data.equipment?.data?.categories ?? [];
  const lifeItems = data.life?.data?.data ?? [];

  const sitemapXml = buildSitemapXml(blogItems);
  const rssXml = buildRssXml(blogItems);
  const changelogRecords = await loadChangelogRecords();

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
          description:
            '花墨技术文章列表，聚合技术分享、开发实践与教程内容。',
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
    writeFileEnsured(
      path.join(distRoot, 'about', 'index.html'),
      renderAboutPage(template, friendLinks),
    ),
    writeFileEnsured(
      path.join(distRoot, 'book', 'index.html'),
      renderBookPage(template, books, friendLinks),
    ),
    writeFileEnsured(
      path.join(distRoot, 'game', 'index.html'),
      renderGamePage(template, games, friendLinks),
    ),
    writeFileEnsured(
      path.join(distRoot, 'equipment', 'index.html'),
      renderEquipmentPage(template, equipmentCategories, friendLinks),
    ),
    writeFileEnsured(
      path.join(distRoot, 'changelog', 'index.html'),
      renderChangelogPage(template, changelogRecords),
    ),
    writeFileEnsured(
      path.join(distRoot, 'life', 'index.html'),
      renderLifePage(template, lifeItems, friendLinks),
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
    await writeFileEnsured(
      filePath,
      renderBlogDetailPage(template, blog, friendLinks),
    );
  }
}

async function ensureDistExists() {
  try {
    await fs.access(templatePath);
  } catch {
    throw new Error(`SEO 导出失败，未找到构建产物: ${templatePath}`);
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

/** 列表类数据接口失败时降级为空数组，避免阻塞整站构建 */
async function fetchOptional(endpoint, params = {}) {
  try {
    return await fetchJson(endpoint, params);
  } catch (error) {
    console.warn(`[seo] 可选数据抓取失败（降级为空）: ${endpoint}`, error);
    return null;
  }
}

async function loadSiteData() {
  if (useMockData) {
    return buildMockData();
  }

  try {
    const [blogs, links, books, games, equipment, life] = await Promise.all([
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
      fetchOptional('/world/book/list'),
      fetchOptional('/world/game/list'),
      fetchOptional('/equipment/list'),
      fetchOptional('/life', { limit: '100' }),
    ]);

    return { blogs, links, books, games, equipment, life };
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
        <h2><a href="${withTrailingSlash(`/blog/blog-detail/${blog.id}`)}">${escapeHtml(blog.title)}</a></h2>
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
        <p><a href="${withTrailingSlash('/link')}">查看更多友链</a></p>
      </section>
    </main>
  `;

  return injectSeoHtml(template, {
    title: `${siteName} | 再花的博客`,
    description: siteDescription,
    canonicalPath,
    ogType: 'website',
    body,
    extraHead: `
      <script type="application/ld+json">${JSON.stringify(buildWebSiteSchema())}</script>
      <script type="application/ld+json">${JSON.stringify(buildPersonSchema())}</script>
    `,
  });
}

function renderBlogListPage(template, blogs, friendLinks, options) {
  const blogListMarkup = blogs.length
    ? blogs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((blog) => `
        <article class="fi-seo-card">
          <h2><a href="${withTrailingSlash(`/blog/blog-detail/${blog.id}`)}">${escapeHtml(blog.title)}</a></h2>
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
  const ogImage =
    toAbsoluteImageUrl(extractFirstImage(blog.content)) || defaultOgImage;
  const schema = buildArticleSchema(blog, canonicalPath, description, ogImage);
  const breadcrumb = buildBreadcrumbSchema(blog, canonicalPath);

  const body = `
    <main class="fi-seo-shell fi-seo-article">
      <nav class="fi-seo-breadcrumb" aria-label="Breadcrumb">
        <a href="${withTrailingSlash('/welcome')}">首页</a>
        <span>/</span>
        <a href="${withTrailingSlash('/blog/all')}">博客归档</a>
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
    ogImage,
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

function renderAboutPage(template, friendLinks) {
  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>关于再花</h1>
        <p>一个想要变得有趣的灵魂，丐版全栈工程师。</p>
      </header>
      <section class="fi-seo-section">
        <h2>再花</h2>
        <p>这里是再花，一名定居成都的前端工程师。很宅、很爱打游戏、很爱写东西、喜欢和人聊天，也喜欢琢磨电子类的东西。英年早婚，日常含妻量很高，每天都在围着老婆转。</p>
        <p>初中的时候字写得极丑，被语文老师要求每天练字，后来慢慢喜欢上书写的感觉，练字帖练到高中毕业。「花墨」便由此得名——再花挥洒笔墨的地方。</p>
      </section>
      <section class="fi-seo-section">
        <h2>爱好</h2>
        <p><strong>游戏</strong>：每天都会进行的活动，生命的终极意义。<a href="${withTrailingSlash('/game')}">查看再花的游戏库</a></p>
        <p><strong>写作</strong>：希望读者能够得到帮助或快乐。<a href="${withTrailingSlash('/blog/all')}">前往文归档看看再花写了什么博客</a></p>
        <p><strong>摸鱼</strong>：工作只是获取劳动报酬，摸鱼才是在赚钱。<a href="${withTrailingSlash('/life')}">前往查看再花的日常</a></p>
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
    title: `关于再花 | ${siteName}`,
    description:
      '关于再花的自我介绍：丐版全栈工程师，热爱游戏、写作与生活，记录在花墨。',
    canonicalPath: '/about',
    ogType: 'website',
    body,
    extraHead: `
      <script type="application/ld+json">${JSON.stringify(buildPersonSchema())}</script>
    `,
  });
}

function renderBookPage(template, books, friendLinks) {
  const listMarkup = books.length
    ? books.map((book) => {
      const cover = book?.img?.[0]?.url;
      const coverImg = cover
        ? `<img class="fi-seo-thumb fi-seo-thumb-book" loading="lazy" src="${escapeHtmlAttr(cover)}" alt="${escapeHtmlAttr(book.name)}封面" />`
        : '';
      const detailUrl = book?.content && String(book.content).startsWith('http')
        ? book.content
        : null;
      return `
        <article class="fi-seo-card fi-seo-item">
          ${coverImg}
          <div>
            <h2>${detailUrl ? `<a href="${escapeHtmlAttr(detailUrl)}">${escapeHtml(book.name)}</a>` : escapeHtml(book.name)}</h2>
            <p class="fi-seo-meta">${escapeHtml(book.author || '')}${book.readingTime ? ` · ${book.readingTime}h` : ''}${book.finishDate ? ` · ${escapeHtml(book.finishDate)}读完` : ''}</p>
          </div>
        </article>
      `;
    }).join('')
    : '<p>书籍整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>书籍</h1>
        <p>再花的阅读记录，读过的书都会整理在这里。</p>
      </header>
      <section class="fi-seo-section">
        ${listMarkup}
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
    title: `书籍 | ${siteName}`,
    description: '再花的书籍阅读记录与书评汇总。',
    canonicalPath: '/book',
    ogType: 'website',
    body,
  });
}

function renderGamePage(template, games, friendLinks) {
  const listMarkup = games.length
    ? games.map((game) => {
      const cover = game?.imgFirst?.[0]?.url;
      const coverImg = cover
        ? `<img class="fi-seo-thumb fi-seo-thumb-game" loading="lazy" src="${escapeHtmlAttr(cover)}" alt="${escapeHtmlAttr(game.name)}封面" />`
        : '';
      return `
        <article class="fi-seo-card fi-seo-item">
          ${coverImg}
          <div>
            <h2>${escapeHtml(game.name)}</h2>
            <p>${escapeHtml(normalizeDescription(game.description || ''))}</p>
            <p class="fi-seo-meta">${escapeHtml(game.platform || '')}${game.time ? ` · ${game.time}h` : ''}${escapeHtml(game.gameType ? ` · ${game.gameType}` : '')}</p>
          </div>
        </article>
      `;
    }).join('')
    : '<p>游戏整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>游戏</h1>
        <p>再花的游戏库，玩过的游戏都记录在这里。</p>
      </header>
      <section class="fi-seo-section">
        ${listMarkup}
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
    title: `游戏 | ${siteName}`,
    description: '再花的游戏库与游戏记录。',
    canonicalPath: '/game',
    ogType: 'website',
    body,
  });
}

function renderEquipmentPage(template, categories, friendLinks) {
  const listMarkup = categories.length
    ? categories.map((category) => `
        <section class="fi-seo-section">
          <h2>${escapeHtml(category.name)}</h2>
          ${(category.items ?? []).map((item) => `
            <article class="fi-seo-card">
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(normalizeDescription(item.description || ''))}</p>
              <p class="fi-seo-meta">${item.purchaseDate ? `${escapeHtml(item.purchaseDate)}购入` : ''}${item.retired ? ' · 已退役' : ''}</p>
            </article>
          `).join('')}
        </section>
      `).join('')
    : '<p>装备整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>装备图鉴</h1>
        <p>再花的电子设备图鉴，差生文具多。</p>
      </header>
      <section class="fi-seo-section">
        ${listMarkup}
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
    title: `装备 | ${siteName}`,
    description: '再花的电子设备图鉴。',
    canonicalPath: '/equipment',
    ogType: 'website',
    body,
  });
}

async function loadChangelogRecords() {
  try {
    const raw = await fs.readFile(changelogDataPath, 'utf8');
    return JSON.parse(raw)?.records ?? [];
  } catch (error) {
    console.warn('[seo] changelog-data.json 读取失败', error);
    return [];
  }
}

function renderChangelogPage(template, records, friendLinks) {
  const listMarkup = records.length
    ? records.slice(0, 50).map((record) => `
        <article class="fi-seo-card">
          <h3>${escapeHtml(record.desc || '')}</h3>
          <p class="fi-seo-meta">${escapeHtml(record.date || '')} · ${escapeHtml(record.type || '')}${record.important ? ' · 重要' : ''}</p>
        </article>
      `).join('')
    : '<p>更新记录整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>更新记录</h1>
        <p>花墨网站的开发与更新记录。</p>
      </header>
      <section class="fi-seo-section">
        ${listMarkup}
      </section>
    </main>
  `;

  return injectSeoHtml(template, {
    title: `更新记录 | ${siteName}`,
    description: '花墨网站的开发与更新记录。',
    canonicalPath: '/changelog',
    ogType: 'website',
    body,
  });
}

function renderLifePage(template, lifeItems, friendLinks) {
  const listMarkup = lifeItems.length
    ? lifeItems.map((item) => {
      const title = String(item?.title ?? '').trim();
      const excerpt = normalizeDescription(item?.content ?? '');
      const heading = title
        ? `<h3>${escapeHtml(title)}</h3>`
        : '';
      return `
        <article class="fi-seo-card">
          ${heading}
          <p>${escapeHtml(excerpt)}</p>
          <p class="fi-seo-meta">${formatDate(item?.date || item?.createDate)}${item?.source ? ` · 来自：${escapeHtml(item.source)}` : ''}</p>
        </article>
      `;
    }).join('')
    : '<p>点滴整理中。</p>';

  const body = `
    <main class="fi-seo-shell">
      <header class="fi-seo-header">
        <h1>再花的点滴</h1>
        <p>再花的日常碎碎念，记录生活里的点点滴滴。</p>
      </header>
      <section class="fi-seo-section">
        ${listMarkup}
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
    title: `再花的点滴 | ${siteName}`,
    description: '再花的日常碎碎念，生活里的点点滴滴都记录在这里。',
    canonicalPath: '/life',
    ogType: 'website',
    body,
  });
}

function injectSeoHtml(template, options) {
  const canonicalUrl = new URL(
    withTrailingSlash(options.canonicalPath),
    siteOrigin,
  ).toString();
  const ogImage = options.ogImage || defaultOgImage;
  const bodyContent = options.body;
  let html = cleanupDefaultHeadTags(template);

  const head = `
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeHtmlAttr(options.description)}">
    <meta name="robots" content="index,follow">
    <meta property="og:site_name" content="${escapeHtmlAttr(siteName)}">
    <meta property="og:locale" content="${siteLanguage}">
    <meta property="og:title" content="${escapeHtmlAttr(options.title)}">
    <meta property="og:description" content="${escapeHtmlAttr(options.description)}">
    <meta property="og:url" content="${escapeHtmlAttr(canonicalUrl)}">
    <meta property="og:type" content="${escapeHtmlAttr(options.ogType)}">
    <meta property="og:image" content="${escapeHtmlAttr(ogImage)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtmlAttr(options.title)}">
    <meta name="twitter:description" content="${escapeHtmlAttr(options.description)}">
    <meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}">
    <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}">
    <link rel="alternate" type="application/rss+xml" title="${siteName} RSS" href="${siteOrigin}/rss.xml">
    ${options.extraHead ?? ''}
  `;

  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, head)
    .replace(
      /<app-root>[\s\S]*?<\/app-root>/i,
      `<app-root>${bodyContent}</app-root>`,
    );

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
    .fi-seo-card h3{margin:0 0 8px;font-size:1.05rem}
    .fi-seo-card p{margin:0 0 8px;line-height:1.8}
    .fi-seo-item{display:flex;gap:14px;align-items:flex-start}
    .fi-seo-thumb{flex:0 0 auto;object-fit:cover;border-radius:8px}
    .fi-seo-thumb-book{width:64px;height:88px}
    .fi-seo-thumb-game{width:88px;height:64px}
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

function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: `${siteOrigin}/`,
    inLanguage: siteLanguage,
    description: siteDescription,
    publisher: {
      '@type': 'Person',
      name: '再花',
    },
  };
}

function buildPersonSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: '再花',
    url: `${siteOrigin}/about/`,
    jobTitle: '前端工程师',
    knowsAbout: ['前端开发', 'Angular', '随笔写作', '游戏'],
    sameAs: ['https://github.com/ZaiHuaOvO'],
  };
}

function buildArticleSchema(blog, canonicalPath, description, ogImage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description,
    image: ogImage,
    inLanguage: siteLanguage,
    articleSection: blog.type,
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
    mainEntityOfPage: `${siteOrigin}${withTrailingSlash(canonicalPath)}`,
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
        item: `${siteOrigin}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '博客归档',
        item: `${siteOrigin}${withTrailingSlash('/blog/all')}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: blog.title,
        item: `${siteOrigin}${withTrailingSlash(canonicalPath)}`,
      },
    ],
  };
}

function buildSitemapXml(blogs) {
  const staticUrls = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/welcome', changefreq: 'monthly', priority: 0.6 },
    { url: '/blog/all', changefreq: 'weekly', priority: 0.8 },
    { url: '/blog/article', changefreq: 'weekly', priority: 0.8 },
    { url: '/blog/essay', changefreq: 'weekly', priority: 0.8 },
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
    .map(({ url, lastmod, changefreq, priority }) => `  <url>\n    <loc>${escapeXml(siteOrigin + withTrailingSlash(url))}</loc>${lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : ''}${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}${priority !== undefined ? `\n    <priority>${priority}</priority>` : ''}\n  </url>`)
    .join('\n')}\n</urlset>\n`;
}

function buildRssXml(blogs) {
  const items = blogs
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50)
    .map((blog) => {
      const tags = String(blog.tag ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      const categories = tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('');
      const detailUrl = `${siteOrigin}${withTrailingSlash(`/blog/blog-detail/${blog.id}`)}`;
      return `  <item>\n    <title>${escapeXml(blog.title)}</title>\n    <link>${escapeXml(detailUrl)}</link>\n    <guid>${escapeXml(detailUrl)}</guid>\n${categories}    <description>${escapeXml(normalizeDescription(blog.description || blog.content))}</description>\n    <pubDate>${new Date(blog.date).toUTCString()}</pubDate>\n  </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${escapeXml(`${siteName} RSS`)}</title>\n  <link>${escapeXml(`${siteOrigin}/`)}</link>\n  <description>${escapeXml(siteDescription)}</description>\n  <language>zh-CN</language>\n  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n  <image>\n    <url>${escapeXml(defaultOgImage)}</url>\n    <title>${escapeXml(siteName)}</title>\n    <link>${escapeXml(`${siteOrigin}/`)}</link>\n  </image>\n${items}\n</channel>\n</rss>\n`;
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
            tag: '教程',
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
    books: null,
    games: null,
    equipment: null,
    life: null,
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
