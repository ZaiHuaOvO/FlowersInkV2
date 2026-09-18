/**
 * 评论 / 留言内容的「图片来源」策略 —— 主站侧镜像。
 *
 * 与 flower-ink-api/src/common/content-image-policy.ts 是同一套规则。
 * 前端这份的作用只是**即时反馈**（提交前就提示，不用等一次网络往返）；
 * 真正的闸门在 API，绕过前端直接发请求一样会被拒。
 *
 * 规则要点（完整理由见 API 那份的顶部注释）：
 *   放行 本站任意子域名 + 站内相对路径
 *   拦下 其它域名、data:/blob: 等无 host 的协议、协议相对地址
 *   只检查**图片位置**的地址，外链文章链接不受影响
 */

const ALLOWED_ROOT_DOMAIN = 'flowersink.com';

/** Markdown 内联图片：![alt](url "title")，url 也允许写成 <url> */
const MD_INLINE_IMAGE_RE = /!\[[^\]]*\]\(\s*<?([^)\s>]+)/g;

/** 裸 HTML 里会触发请求的 src / poster */
const HTML_SRC_ATTR_RE =
  /<(?:img|source|video|audio|track|embed|input)\b[^>]*?\b(?:src|poster)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

/** srcset 一个属性里能塞多个地址 */
const HTML_SRCSET_ATTR_RE = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;

/** 引用式定义：[ref]: url */
const REF_DEFINITION_RE = /^[ \t]{0,3}\[([^\]]+)\]:\s*<?([^\s>]+)/gm;

/**
 * 引用式图片：![alt][ref] / ![alt][] / ![alt]
 * `(?!\()` 排除内联图片 `![alt](url)`。
 */
const MD_IMAGE_REFERENCE_RE = /!\[([^\]]*)\](?!\()(?:\[([^\]]*)\])?/g;

/** 没有协议头、也不是 `//host` 的，一律当作站内相对路径 */
function isRelativeUrl(url: string): boolean {
  return !/^[a-z][a-z0-9+.-]*:/i.test(url) && !url.startsWith('//');
}

/** 该地址是否允许作为评论图片 */
export function isAllowedImageSource(rawUrl: string): boolean {
  const url = String(rawUrl ?? '').trim();
  if (!url) {
    return true;
  }
  if (isRelativeUrl(url)) {
    return true;
  }

  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // 解析不了的（含 //evil.com 这种协议相对地址）直接拒绝
    return false;
  }

  if (!host) {
    // data: / blob: 之类没有 host
    return false;
  }

  return (
    host === ALLOWED_ROOT_DOMAIN || host.endsWith(`.${ALLOWED_ROOT_DOMAIN}`)
  );
}

/**
 * 返回第一个不合规的图片地址；全部合规时返回 null。
 *
 * 覆盖四种绕过写法：Markdown 内联图片、裸 HTML 的 src/poster、srcset、
 * 以及引用式图片（`![x][1]` + `[1]: url`）。
 * 引用式定义只在真的被图片引用到时才检查，避免误伤外链文章引用。
 */
export function findForeignImageUrl(content: string | null | undefined): string | null {
  const text = String(content ?? '');
  if (!text) {
    return null;
  }

  for (const match of text.matchAll(MD_INLINE_IMAGE_RE)) {
    if (!isAllowedImageSource(match[1])) {
      return match[1];
    }
  }

  for (const match of text.matchAll(HTML_SRC_ATTR_RE)) {
    const url = match[1] ?? match[2] ?? match[3] ?? '';
    if (!isAllowedImageSource(url)) {
      return url;
    }
  }

  for (const match of text.matchAll(HTML_SRCSET_ATTR_RE)) {
    const raw = match[1] ?? match[2] ?? '';
    for (const candidate of raw.split(',')) {
      const url = candidate.trim().split(/\s+/)[0] ?? '';
      if (!isAllowedImageSource(url)) {
        return url;
      }
    }
  }

  const definitions = new Map<string, string>();
  for (const match of text.matchAll(REF_DEFINITION_RE)) {
    definitions.set(match[1].trim().toLowerCase(), match[2]);
  }
  if (definitions.size) {
    for (const match of text.matchAll(MD_IMAGE_REFERENCE_RE)) {
      const label = (match[2] || match[1] || '').trim().toLowerCase();
      if (!label) {
        continue;
      }
      const url = definitions.get(label);
      if (url && !isAllowedImageSource(url)) {
        return url;
      }
    }
  }

  return null;
}
