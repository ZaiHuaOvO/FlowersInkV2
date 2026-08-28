export function inferOriginalImageUrl(previewUrl: string): string {
  return previewUrl.includes('compressed-')
    ? previewUrl.replace('compressed-', '')
    : previewUrl;
}

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
  // gif 动画不做 webp 变体，保持原样展示与预览
  if (/\.gif$/i.test(filename)) {
    return { display: null, zoom: null };
  }
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

/**
 * 在 ng-zorro 图片预览操作栏追加"查看原图"按钮，点击新标签页打开原图地址。
 */
export function appendViewOriginalButton(originalUrl: string): void {
  if (!originalUrl) {
    return;
  }
  const delays = [30, 80, 200, 500];
  let idx = 0;
  const attempt = () => {
    const ops = document.querySelector<HTMLElement>(
      '.ant-image-preview-operations',
    );
    if (ops && !ops.querySelector('[data-fi-view-original]')) {
      const li = document.createElement('li');
      li.className = 'ant-image-preview-operations-operation';
      li.setAttribute('data-fi-view-original', '');
      li.title = '查看原图（新标签页打开）';
      li.style.cssText =
        'cursor:pointer;display:flex;align-items:center;gap:4px;user-select:none;';
      li.innerHTML =
        '<span class="ant-image-preview-operations-icon" style="display:inline-flex;">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/><path d="M11 8v6M8 11h6"/></svg>' +
        '</span><span style="font-size:14px;">原图</span>';
      li.addEventListener('click', () => window.open(originalUrl, '_blank'));
      ops.appendChild(li);
      return;
    }
    if (!ops && idx < delays.length) {
      window.setTimeout(attempt, delays[idx++]);
    }
  };
  attempt();
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
