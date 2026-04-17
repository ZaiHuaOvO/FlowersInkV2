import { environment } from '../../environments/environment';

export const API = {
  BASE_URL: environment.apiBaseUrl,

  BLOG: '/blog',
  TAG: '/blog/tag',
  TYPE: '/blog/type',
  INFO: '/blog/site/visit',
  DAY_INFO: '/blog/info',
  LIFE: '/life',
  LIFE_YEAR: '/life/years',
  LIFE_TAG: '/life/tag',
  IMAGE: '/upload',
  IMAGE_UPLOAD: '/upload/image',
  MESSAGE: '/site/message',
  BOOK: '/world/book',
  BOOK_LIST: '/world/book/list',
  GAME: '/world/GAME',
  GAME_LIST: '/world/GAME/list',
  LINK: '/site/link',
};
