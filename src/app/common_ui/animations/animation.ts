import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import type { AnimationMetadata } from '@angular/animations';

/**
 * 动效节奏常量 —— 与 `common_ui/css/fi-tokens.css` 的 `--fi-motion-*` / `--fi-ease-standard` 对齐。
 *
 * 为什么在这里复写一份：Angular 的 `animate()` 最终交给 Web Animations API，
 * 那里的 duration / delay 不接受 CSS 变量（只接受数字或 `250ms` 这样的时间串），
 * 所以拿不到 `var(--fi-motion-normal)`。改 token 时请同步改这里，
 * `/design` 设计系统页的「动效」章节把两边并排列出，便于核对。
 */
const MOTION_FAST = '0.16s';
const MOTION_NORMAL = '0.24s';
const MOTION_SLOW = '0.32s';
const EASE_STANDARD = 'cubic-bezier(0.22, 1, 0.36, 1)';
/** 出场统一用 ease-in：起步慢、末尾快，收得干净 */
const EASE_EXIT = 'ease-in';

/** 「慢」系列 = 与「快」系列同样的时长，但延后半拍再开始 */
const SLOW_DELAY = MOTION_NORMAL;

const enter = (
  from: Record<string, string | number>,
  duration = MOTION_NORMAL
): AnimationMetadata[] => [
    style(from),
    animate(`${duration} ${EASE_STANDARD}`, style({ opacity: 1, transform: 'translate(0, 0)' })),
  ];

// 更加快速的从下往上平移渐出
export const QuickUp = trigger('QuickUp', [
  transition(':enter', enter({ opacity: 0, transform: 'translateY(20px)' })),
]);

// 支持相同区域的重新刷新动画
export const RefreshUp = trigger('RefreshUp', [
  transition(':enter', enter({ opacity: 0, transform: 'translateY(16px)' })),
  transition(':increment', enter({ opacity: 0, transform: 'translateY(16px)' })),
  transition(':decrement', enter({ opacity: 0, transform: 'translateY(16px)' })),
]);

// 更加快速的从上往下平移
export const QuickDown = trigger('QuickDown', [
  transition(':enter', enter({ opacity: 0, transform: 'translateY(-20px)' })),
]);

// 更慢的从下往上平移渐出
export const SlowUp = trigger('SlowUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(
      `${MOTION_NORMAL} ${SLOW_DELAY} ${EASE_STANDARD}`,
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

// 更慢的从上往下平移
export const SlowDown = trigger('SlowDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate(
      `${MOTION_NORMAL} ${SLOW_DELAY} ${EASE_STANDARD}`,
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

// 更加快速的从左往右平移渐出
export const QuickLeft = trigger('QuickLeft', [
  transition(':enter', enter({ opacity: 0, transform: 'translateX(-20px)' })),
]);

// 更加快速的从右往左平移渐出
export const QuickRight = trigger('QuickRight', [
  transition(':enter', enter({ opacity: 0, transform: 'translateX(20px)' })),
]);

export const SlowLeft = trigger('SlowLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate(
      `${MOTION_SLOW} ${SLOW_DELAY} ${EASE_STANDARD}`,
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
]);

export const SlowRight = trigger('SlowRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate(
      `${MOTION_SLOW} ${SLOW_DELAY} ${EASE_STANDARD}`,
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
]);

// 方向感知滑动动画 — 通过 params.offset 控制从哪侧进入
// offset: '24px'（从右侧进入）, offset: '-24px'（从左侧进入）
export const SlideEnter = trigger('SlideEnter', [
  transition(':enter', [
    style({
      opacity: 0,
      transform: 'translateX({{offset}})',
    }),
    animate(`${MOTION_NORMAL} ${EASE_STANDARD}`, style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

// 列表逐条 Stagger 入场动画
//
// limit: 12 —— 只让前 12 条走错走，之后的直接出现。
// 不封顶的话，第 80 条要等 80×60ms ≈ 4.8 秒才浮上来，那不是灵动是卡顿。
export const StaggerList = trigger('StaggerList', [
  transition(':enter', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        stagger(60, [
          animate(`${MOTION_SLOW} ${EASE_STANDARD}`, style({ opacity: 1, transform: 'translateY(0)' })),
        ]),
      ],
      { optional: true, limit: 12 }
    ),
  ]),
]);

// 表单 / 回复框展开收起动画（淡入下滑 / 淡出上滑）
export const FadeSlide = trigger('FadeSlide', [
  transition(':enter', enter({ opacity: 0, transform: 'translateY(-8px)' })),
  transition(':leave', [
    animate(`${MOTION_FAST} ${EASE_EXIT}`, style({ opacity: 0, transform: 'translateY(-8px)' })),
  ]),
]);

// 列表展开/收起动画（展开平滑淡入；收起由 @if 直接移除）
export const ExpandCollapse = trigger('ExpandCollapse', [
  transition(':enter', [
    style({ opacity: 0, height: 0 }),
    animate(`${MOTION_NORMAL} ${EASE_STANDARD}`, style({ opacity: 1, height: '*' })),
  ]),
]);

// 段落想法浮窗的入场 / 退场：淡入 + 轻微上浮放大，关闭时略快收回去
// 只动 transform 与 opacity —— 浮窗的水平/垂直定位靠 CSS `translate` 属性，
// 与这里的 transform 互不干扰，所以动画不会把浮窗位置带偏。
export const PopoverIn = trigger('PopoverIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(8px) scale(0.96)' }),
    animate(
      `${MOTION_NORMAL} ${EASE_STANDARD}`,
      style({ opacity: 1, transform: 'translateY(0) scale(1)' })
    ),
  ]),
  transition(':leave', [
    animate(
      `${MOTION_FAST} ${EASE_EXIT}`,
      style({ opacity: 0, transform: 'translateY(4px) scale(0.98)' })
    ),
  ]),
]);

// 「写想法」气泡：从选区里弹出来（回弹曲线保留，这是它「弹」的来源）
export const BubbleIn = trigger('BubbleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.8)' }),
    animate(`${MOTION_FAST} cubic-bezier(0.34, 1.56, 0.64, 1)`, style({ opacity: 1, transform: 'scale(1)' })),
  ]),
  transition(':leave', [
    animate(`${MOTION_FAST} ${EASE_EXIT}`, style({ opacity: 0, transform: 'scale(0.9)' })),
  ]),
]);
