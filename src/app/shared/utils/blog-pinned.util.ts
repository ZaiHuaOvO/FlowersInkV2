export interface PinnableBlog {
  id?: number | string;
}

/** 是否为唯一的置顶文章（id=0，《关于我和花墨的一切》）。 */
export const isPinnedBlog = (blog: PinnableBlog | null | undefined): boolean =>
  Number(blog?.id) === 0;
