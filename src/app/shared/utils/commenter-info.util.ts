/**
 * 评论者身份信息的 localStorage 缓存（博客评论与点滴评论共用一套）
 * 旧版本各自使用 article_commenter_info / life_commenter_info 两个 key，这里负责迁移合并。
 */

export interface CommenterInfo {
  name?: string;
  email?: string;
  website?: string;
  avatarUrl?: string;
}

const CACHE_KEY = 'commenter_info';
/** 旧版本各自独立的 key，仅用于一次性迁移 */
const LEGACY_KEYS = ['article_commenter_info', 'life_commenter_info'];

/** 读取统一缓存；无统一缓存时尝试迁移旧 key 数据并写入新 key */
export function loadCommenterInfo(): CommenterInfo {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as CommenterInfo;
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch { /* ignore */ }

  // 一次性迁移：合并旧的独立缓存（后写覆盖先写，字段为空则回退）
  let legacy: CommenterInfo = {};
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as CommenterInfo;
      if (!parsed || typeof parsed !== 'object') continue;
      legacy = { ...legacy, ...parsed };
    } catch { /* ignore */ }
  }
  if (legacy.name || legacy.email || legacy.website || legacy.avatarUrl) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(legacy));
    } catch { /* ignore */ }
  }
  for (const key of LEGACY_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }
  }
  return legacy;
}

/** 写入统一缓存（只写入非空字段） */
export function saveCommenterInfo(info: CommenterInfo): void {
  const clean: CommenterInfo = {};
  if (info.name) clean.name = info.name;
  if (info.email) clean.email = info.email;
  if (info.website) clean.website = info.website;
  if (info.avatarUrl) clean.avatarUrl = info.avatarUrl;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(clean));
  } catch { /* ignore */ }
}
