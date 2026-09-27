import { NzModalService } from 'ng-zorro-antd/modal';
import { findEmojiItem } from '../../ts/emoji-packs';

/** 弹窗末尾的表情取自 assets/粉毛再花/唱歌.gif */
const NOTICE_EMOJI_PACK = '粉毛再花';
const NOTICE_EMOJI_NAME = '唱歌';

/** 表情图片地址；打包清单里查不到就退化成不显示图片（只留文字） */
function noticeStickerHtml(): string {
  const emoji = findEmojiItem(NOTICE_EMOJI_PACK, NOTICE_EMOJI_NAME);
  if (!emoji) {
    return '';
  }

  // 尺寸写在全局 styles.css 的 .whitelist-notice-sticker 里：
  // 弹窗内容渲染在组件视图之外（作用域样式够不着），而 Angular 的 sanitizer
  // 会把行内 style 属性直接剥掉，所以不能用行内样式。
  return `<img class="whitelist-notice-sticker" src="${emoji.url}" alt="${NOTICE_EMOJI_NAME}" />`;
}

/**
 * 命中评论白名单、内容被直接放行时的提示。
 *
 * 只有提交者本人能看到这条提示：接口返回的 `autoApproved` 描述的是
 * 「你刚提交的这条」，不含任何名单信息。想拿到它必须已经知道完整三元组
 * （昵称+邮箱+网址），而知道三元组本身就已经能获得免审核。
 */
export function showWhitelistApprovedNotice(modal: NzModalService): void {
  // 这段 HTML 会被 Angular 的 sanitizer 过一遍：它按属性白名单清理，
  // 行内 style 属性会被直接剥掉（并打出一条 warning）。所以这里不用任何行内样式，
  // 需要样式的元素一律挂 class，规则写在全局 styles.css 里。
  modal.success({
    nzTitle: '免审核通过 ✨',
    nzContent: `<p>再花觉得你是好人，所以你提交的内容神奇的通过审核啦</p>${noticeStickerHtml()}`,
    nzOkText: '好耶',
    nzCentered: true,
    nzMaskClosable: true,
  });
}
