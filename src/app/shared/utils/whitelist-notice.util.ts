import { NzMessageService } from 'ng-zorro-antd/message';
import { findEmojiItem } from '../../ts/emoji-packs';

/** 提示里附带的那个表情取自 assets/粉毛再花/唱歌.gif */
const NOTICE_EMOJI_PACK = '粉毛再花';
const NOTICE_EMOJI_NAME = '唱歌';

/** 展示时长比默认的 3 秒略长一点，让表情能看清 */
const NOTICE_DURATION_MS = 4000;

/** 表情图片；打包清单里查不到就退化成只显示文字 */
function noticeStickerHtml(): string {
  const emoji = findEmojiItem(NOTICE_EMOJI_PACK, NOTICE_EMOJI_NAME);
  if (!emoji) {
    return '';
  }

  // 尺寸写在全局 styles.css 的 .whitelist-notice-sticker 里：
  // 提示内容渲染在组件视图之外（作用域样式够不着），而 Angular 的 sanitizer
  // 会把行内 style 属性直接剥掉，所以只能用 class。
  return `<img class="whitelist-notice-sticker" src="${emoji.url}" alt="${NOTICE_EMOJI_NAME}" />`;
}

/**
 * 命中评论白名单、内容被直接放行时的提示。
 *
 * 用轻提示（`nz-message`）而不是弹窗：自动消失、不用额外点一次确认，
 * 提交完接着做别的事就行。
 *
 * 只有提交者本人能看到这条提示：接口返回的 `autoApproved` 描述的是
 * 「你刚提交的这条」，不含任何名单信息。想拿到它必须已经知道完整三元组
 * （昵称+邮箱+网址），而知道三元组本身就已经能获得免审核。
 */
export function showWhitelistApprovedNotice(msg: NzMessageService): void {
  msg.success(
    `再花觉得你是好人，所以你提交的内容神奇的通过审核啦${noticeStickerHtml()}`,
    { nzDuration: NOTICE_DURATION_MS },
  );
}
