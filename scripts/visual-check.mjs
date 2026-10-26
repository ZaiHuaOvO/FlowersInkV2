#!/usr/bin/env node
/**
 * 视觉回归工具：用本机 Chrome 无头模式，对一组路由同时取
 *   1) 计算样式快照（JSON，可比对）
 *   2) 整页截图（PNG，可肉眼查看）
 *
 * 为什么需要它：项目没有任何 *.spec.ts，样式改动的风险全是「看起来变了」。
 * 静态检测（stylelint / impeccable）看不到层叠结果，预览面板又拿不到真实布局，
 * 所以用真实 Chrome 渲染一遍，把结果落盘再 diff。
 *
 * 用法：
 *   node scripts/visual-check.mjs --base http://localhost:4202 --out .visual/before
 *   node scripts/visual-check.mjs --base http://localhost:4202 --out .visual/after
 *   node scripts/visual-check.mjs --diff .visual/before .visual/after
 *
 * 只依赖 Node 22 内置的 WebSocket 与 fetch，不引入 puppeteer。
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA ?? '', 'Google/Chrome/Application/chrome.exe'),
];

const ROUTES = [
  ['welcome', '/'],
  ['blog-list', '/blog/all'],
  ['blog-detail', '/blog/blog-detail/0'],
  ['life', '/life'],
  ['about', '/about'],
  ['link', '/link'],
  ['game', '/game'],
  ['book', '/book'],
  ['equipment', '/equipment'],
  ['changelog', '/changelog'],
  ['design', '/design'],
  ['donate', '/donate'],
];

/** 取每个页面上「有代表性」的元素计算样式；不存在就跳过，不算差异 */
const PROBES = [
  ['body', 'body'],
  ['header', 'header, .app-header'],
  ['menu-link', '.menu .menu-link'],
  ['button', 'fl-button .fl-button, .fl-button'],
  ['ant-btn', '.ant-btn'],
  ['input', 'input.ant-input'],
  ['tag', 'nz-tag.fl-tag, .ant-tag'],
  ['card', '[flcard], .fl-card-surface, .ant-card'],
  ['alert', '.ant-alert'],
  ['title-1', '.fi-text-title-1'],
  ['title-2', '.fi-text-title-2'],
  ['caption', '.fi-text-caption'],
  ['page', '.fi-page'],
  ['screen', '.fi-screen'],
  ['timeline-date', '.fi-simple-timeline-date'],
  ['tag-filter', '.tag-filter-button'],
  ['tag-count', '.tag-count'],
  ['side-toc', '.fi-side-toc-label'],
  ['blog-title', '.blog_title'],
  ['me-name', '.name'],
  ['me-secondary', '.fi-secondary-text'],
  ['footer', 'footer, .footer_box'],
  ['backtop', '.back-top, flower-back-top'],
  ['markdown', '#currentAnchor'],
  ['code-block', '#currentAnchor pre'],
  ['comment', '.fc-card'],
  ['spin-text', '.ant-spin-text'],
];

const PROPS = [
  'display',
  'position',
  'color',
  'backgroundColor',
  'backgroundImage',
  'borderTopColor',
  'borderTopWidth',
  'borderRadius',
  'boxShadow',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'paddingTop',
  'paddingLeft',
  'marginTop',
  'marginBottom',
  'gap',
  'minHeight',
  'maxWidth',
  'width',
  'zIndex',
  'opacity',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, dsf: 1, mobile: false },
  { name: 'mobile', width: 390, height: 844, dsf: 2, mobile: true },
];

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

function findChrome() {
  const hit = CHROME_CANDIDATES.find((p) => p && existsSync(p));
  if (!hit) {
    throw new Error('找不到 Chrome，请用 CHROME_PATH 指定可执行文件路径');
  }
  return process.env.CHROME_PATH || hit;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        return;
      }
      if (msg.method && this.listeners.has(msg.method)) {
        this.listeners.get(msg.method)(msg.params);
      }
    });
  }

  on(method, fn) {
    this.listeners.set(method, fn);
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }
}

async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', reject, { once: true });
  });
  return new Cdp(ws);
}

async function launchChrome(port) {
  const profile = path.join(os.tmpdir(), `fi-visual-${Date.now()}`);
  const proc = spawn(
    findChrome(),
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--force-device-scale-factor=1',
      `--user-data-dir=${profile}`,
      `--remote-debugging-port=${port}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return proc;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  proc.kill();
  throw new Error('Chrome 调试端口未就绪');
}

async function newTab(port, url) {
  const res = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {
    method: 'PUT',
  });
  const tab = await res.json();
  return tab.webSocketDebuggerUrl;
}

const SNAPSHOT_JS = `
(function (probes, props) {
  const out = {};
  for (const [name, sel] of probes) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    const rec = {};
    for (const p of props) rec[p] = cs[p];
    out[name] = rec;
  }
  return JSON.stringify(out);
})`;

/** 等页面网络空闲：连续 700ms 没有在途请求，或超时 */
async function waitForNetworkIdle(cdp, timeoutMs) {
  let inflight = 0;
  let lastActivity = Date.now();
  const bump = (delta) => () => {
    inflight = Math.max(0, inflight + delta);
    lastActivity = Date.now();
  };
  cdp.on('Network.requestWillBeSent', bump(1));
  cdp.on('Network.loadingFinished', bump(-1));
  cdp.on('Network.loadingFailed', bump(-1));
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(150);
    if (inflight === 0 && Date.now() - lastActivity > 700) return;
  }
}

async function capture(cdp, base, route, viewport, outDir, fullPage) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.dsf,
    mobile: viewport.mobile,
  });
  if (viewport.mobile) {
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
  }
  await cdp.send('Page.navigate', { url: base + route });
  // SPA：等网络真正空闲（数据拉完），再留一点渲染时间。
  // 固定 sleep 会偶发抓到「加载中」，这是之前多次抓到半成品页面的原因。
  await waitForNetworkIdle(cdp, 12000);
  await sleep(600);

  const snap = await cdp.send('Runtime.evaluate', {
    expression: `${SNAPSHOT_JS}(${JSON.stringify(PROBES)}, ${JSON.stringify(PROPS)})`,
    returnByValue: true,
  });

  const metrics = await cdp.send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize ?? metrics.contentSize;
  const shot = fullPage
    ? await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: {
          x: 0,
          y: 0,
          width: Math.ceil(size.width),
          height: Math.min(Math.ceil(size.height), 8000),
          scale: 1,
        },
      })
    : await cdp.send('Page.captureScreenshot', { format: 'png' });

  return {
    styles: snap.result?.value ? JSON.parse(snap.result.value) : {},
    png: Buffer.from(shot.data, 'base64'),
  };
}

async function record() {
  const base = arg('base', 'http://localhost:4202');
  const out = arg('out', '.visual/run');
  const port = Number(arg('port', '9223'));
  const fullPage = !process.argv.includes('--viewport-only');
  const only = arg('only');
  const routes = only
    ? ROUTES.filter(([name]) => only.split(',').includes(name))
    : ROUTES;
  await mkdir(out, { recursive: true });

  const chrome = await launchChrome(port);
  const results = { base, at: new Date().toISOString(), pages: {} };
  try {
    for (const vp of VIEWPORTS) {
      const wsUrl = await newTab(port, 'about:blank');
      const cdp = await connect(wsUrl);
      await cdp.send('Page.enable');
      await cdp.send('Runtime.enable');
      await cdp.send('Network.enable');
      if (process.argv.includes('--block-api')) {
        await cdp.send('Network.setBlockedURLs', { urls: ['*api.flowersink.com*'] });
        process.stdout.write('  (已阻断 api.flowersink.com，用于验收错误态)\n');
      }
      for (const [name, route] of routes) {
        process.stdout.write(`  ${vp.name.padEnd(7)} ${name}\n`);
        const { styles, png } = await capture(cdp, base, route, vp, out, fullPage);
        results.pages[`${vp.name}/${name}`] = { route, styles };
        await writeFile(path.join(out, `${vp.name}-${name}.png`), png);
        await sleep(150);
      }      cdp.ws.close();
    }
  } finally {
    chrome.kill();
  }

  await writeFile(path.join(out, 'styles.json'), JSON.stringify(results, null, 2));
  console.log(`\n快照与截图已写入 ${path.resolve(out)}`);
}

function diff() {
  const a = arg('diff');
  const b = process.argv[process.argv.indexOf('--diff') + 2];
  if (!a || !b) throw new Error('用法：--diff <beforeDir> <afterDir>');
  return (async () => {
    const before = JSON.parse(await readFile(path.join(a, 'styles.json'), 'utf8'));
    const after = JSON.parse(await readFile(path.join(b, 'styles.json'), 'utf8'));
    const rows = [];
    for (const page of new Set([...Object.keys(before.pages), ...Object.keys(after.pages)])) {
      const pb = before.pages[page];
      const pa = after.pages[page];
      if (!pb || !pa) {
        rows.push(`${page}: 页面只在${pb ? '改前' : '改后'}存在`);
        continue;
      }
      for (const el of new Set([...Object.keys(pb.styles), ...Object.keys(pa.styles)])) {
        const eb = pb.styles[el] ?? {};
        const ea = pa.styles[el] ?? {};
        for (const prop of new Set([...Object.keys(eb), ...Object.keys(ea)])) {
          if (eb[prop] !== ea[prop]) {
            rows.push(`${page} · ${el} · ${prop}: ${eb[prop] ?? '—'} → ${ea[prop] ?? '—'}`);
          }
        }
      }
    }
    console.log(rows.length ? rows.join('\n') : '无计算样式差异');
    console.log(`\n共 ${rows.length} 处差异`);
    process.exitCode = rows.length ? 1 : 0;
  })();
}

if (process.argv.includes('--diff')) {
  await diff();
} else {
  await record();
}
