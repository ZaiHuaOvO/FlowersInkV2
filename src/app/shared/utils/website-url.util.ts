/**
 * 规范化用户填写的网站地址。
 *
 * 用户常带着中文输入法的全角冒号、漏写一条斜杠，或干脆不写协议头。朴素的
 * 「不以 http(s):// 开头就补 https://」会把它们拼成
 * `https://https：//xxx.com` 这类死链，所以这里先剥掉开头的协议与斜杠变体，
 * 再统一补一个协议头。
 *
 * 幂等：对已规范化的值再调用一次结果不变。空值返回空串。
 *
 * 与 API common/website-url.util.ts、ERP common_ui/comment/website-url.util.ts
 * 是同一份实现的镜像，改动时需同步。
 */
export function normalizeWebsiteUrl(raw: unknown): string {
  let value = String(raw ?? '').trim();
  if (!value) {
    return '';
  }

  // 中文输入法打出的全角冒号与斜杠
  value = value.replace(/：/g, ':').replace(/／/g, '/').replace(/＼/g, '\\');

  // 用户明确写了 http:// 就保留 http（仍有站点只支持 http），其余一律 https
  const scheme = /^http:\/\//i.test(value) ? 'http' : 'https';

  // 循环剥离是因为历史脏数据可能已被拼坏成 https://https://xxx 这种多重前缀
  let host = value;
  for (let previous = ''; host !== previous; ) {
    previous = host;
    host = host
      .replace(/^https?:/i, '')
      .replace(/^[\/\\]+/, '')
      .replace(/^https?[\/\\]+/i, '');
  }

  return host ? `${scheme}://${host}` : '';
}
