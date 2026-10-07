import { AfterViewInit, Directive, ElementRef, Renderer2, inject } from '@angular/core';

/**
 * 图片淡入 —— 让图片「浮」出来，而不是解码完成后硬蹦一下。
 *
 * 用法：`<img flImgFade src="...">`
 *
 * 三个坑，都踩过：
 *
 * 1. **不要跳过命中缓存的图片。** 早先的写法是「初始化时已经 complete 就直接不管它」，
 *    本意是避开闪一下，结果是回访用户（图片全在缓存里）根本看不到任何淡入。
 *    现在一律先停住再淡入：停住时的那一帧空白肉眼看不见，但淡入一定发生。
 *
 * 2. **`decoding="async"` 时 `load` 早于解码完成。** 这时候直接开始淡入，
 *    动画会在「还没画出来」的图上跑完，观感就是没有动画。等 `decode()` 落地再放出来。
 *
 * 3. **别用 transition，用动画。** 组件样式在全局样式之后注入，权重相同时它赢：
 *    点滴页的 `.image-item-wrapper img { transition: transform … }` 会把
 *    `img.fl-img-fade--loaded { transition: opacity … }` 整个顶掉，透明度变瞬时。
 *    换成 CSS 动画就没这个问题（详见 fi-base.css 里那段注释）。
 *
 * 样式在 `fi-base.css`（全局，因为要作用到各组件里的 <img> 上）。
 * Markdown 正文里的图片是 innerHTML 注入的，指令够不到，
 * 那一处在 `BlogDetailComponent` 的图片绑定逻辑里手动加同名类。
 */
@Directive({
  selector: 'img[flImgFade]',
  standalone: true,
  host: {
    '(load)': 'settle()',
    '(error)': 'settle()',
  },
})
export class FlImgFadeDirective implements AfterViewInit {
  private readonly el = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private revealed = false;

  ngAfterViewInit(): void {
    const img = this.el.nativeElement;
    this.renderer.addClass(img, 'fl-img-fade');

    if (!img.complete) {
      // 加载中：交给 load / error 事件
      return;
    }

    if (img.naturalWidth > 0) {
      // 已经解码好了（多半命中缓存）。动画不依赖「元素先以旧值画过一帧」，
      // 所以这里直接开播就行，不需要强制回流、也不需要错开一帧。
      this.reveal(img);
      return;
    }

    if (img.getAttribute('src')) {
      // complete 且没有位图 = 加载失败。放出来，别留个看不见的空洞。
      this.reveal(img);
    }
    // 没有 src：等调用方赋值后由 load 事件接管（此时 complete 为真但没有可显示的内容）
  }

  /** 加载成功或失败都算「结束」，事件由 host 绑定 */
  protected settle(): void {
    if (this.revealed) {
      return;
    }
    const img = this.el.nativeElement;
    this.renderer.addClass(img, 'fl-img-fade');

    if (typeof img.decode === 'function') {
      // decode() 完成 = 位图已经就绪，这时候淡入才是「看得见的淡入」
      img.decode().then(
        () => this.reveal(img),
        () => this.reveal(img),
      );
      return;
    }
    this.reveal(img);
  }

  private nextFrame(run: () => void): void {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(run);
      return;
    }
    setTimeout(run, 16);
  }

  private reveal(img: HTMLImageElement): void {
    if (this.revealed) {
      return;
    }
    this.revealed = true;
    this.renderer.addClass(img, 'fl-img-fade--loaded');
  }
}
