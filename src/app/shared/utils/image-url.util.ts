export interface WebpVariants {
  display: string | null;
  zoom: string | null;
}

/**
 * 从任意已存图片 URL 推导 webp 展示（960px）与缩放（1920px）变体地址。
 * 命名约定与 API upload-variant.utils.ts 保持一致：
 *   compressed-{name}.png / webp-{name}.webp -> webp-{name}.webp + webp-{name}-zoom.webp
 */
export function deriveWebpVariants(url: string): WebpVariants {
  if (!url) {
    return { display: null, zoom: null };
  }
  const cleanUrl = cleanPathname(url);
  if (!cleanUrl.includes('/uploads/')) {
    return { display: null, zoom: null };
  }
  // 提取纯路径（去掉 origin），避免把完整 URL 拼进 pathname 造成双重域名
  const pathOnly = toPathOnly(cleanUrl);
  const filename = pathOnly.substring(pathOnly.lastIndexOf('/') + 1);
  let base = filename
    .replace(/-zoom\.[^.]+$/, '')
    .replace(/^(compressed-|watermarked-|webp-)/, '')
    .replace(/\.[^.]+$/, '');
  if (!base) {
    return { display: null, zoom: null };
  }
  const dir = pathOnly.substring(0, pathOnly.lastIndexOf('/'));
  return {
    display: rebuildWithPath(url, `${dir}/webp-${base}.webp`),
    zoom: rebuildWithPath(url, `${dir}/webp-${base}-zoom.webp`),
  };
}

function cleanPathname(url: string): string {
  return url.split('#')[0].split('?')[0];
}

function toPathOnly(cleanUrl: string): string {
  if (/^https?:\/\//i.test(cleanUrl)) {
    try {
      return new URL(cleanUrl).pathname;
    } catch {
      return cleanUrl;
    }
  }
  return cleanUrl;
}

function rebuildWithPath(url: string, newPathname: string): string {
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      parsed.pathname = newPathname;
      return parsed.toString();
    } catch {
      return newPathname;
    }
  }
  return newPathname;
}
