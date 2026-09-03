import { environment } from '../../environments/environment';

export const API = {
  BASE_URL: environment.apiBaseUrl,

  BLOG: '/blog',
  BLOG_RELATED: '/blog/related',
  TAG: '/blog/tag',
  TYPE: '/blog/type',
  INFO: '/site/visit',
  SITE_INFO: '/site/info',
  DAY_INFO: '/blog/info',
  LIFE: '/life',
  LIFE_YEAR: '/life/years',
  LIFE_TAG: '/life/tag',
  CAPTCHA: '/site/captcha',
  MESSAGE: '/site/message',
  BOOK: '/world/book',
  BOOK_LIST: '/world/book/list',
  GAME: '/world/game',
  GAME_LIST: '/world/game/list',
  EQUIPMENT_LIST: '/equipment/list',
  MODULE: '/module',
  LINK: '/site/link',
  LINK_ARTICLES: '/site/link/articles',
  GITHUB_CONTRIBUTIONS: '/github/contributions',
};
