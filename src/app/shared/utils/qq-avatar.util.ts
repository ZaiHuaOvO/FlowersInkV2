/**
 * QQ 邮箱头像识别工具。
 *
 * QQ 邮箱（@qq.com）与 Foxmail（@foxmail.com）的邮箱前缀在纯数字时即 QQ 号，
 * 可直接通过 q1.qlogo.cn 获取头像。非纯数字前缀（foxmail 自定义英文名）不识别。
 */
export function getQqNumber(email: string | null | undefined): string | null {
  const normalized = String(email ?? '').trim().toLowerCase();
  const match = normalized.match(/^(\d+)@(qq\.com|foxmail\.com)$/);
  if (!match) {
    return null;
  }
  return match[1];
}

export function buildQqAvatarUrl(qqNumber: string, size = 640): string {
  return `https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=${size}`;
}

/** 若邮箱可识别为 QQ 号则返回头像 URL，否则返回 null */
export function tryBuildQqAvatarUrl(email: string | null | undefined): string | null {
  const qq = getQqNumber(email);
  return qq ? buildQqAvatarUrl(qq) : null;
}
