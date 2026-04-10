import { trigger, transition, style, animate } from '@angular/animations';

// 更加快速的从下往上平移渐出
export const QuickUp = trigger('QuickUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate('250ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

// 更加快速的从上往下平移
export const QuickDown = trigger('QuickDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate('250ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
  ]),
]);

// 更慢的从下往上平移渐出
export const SlowUp = trigger('SlowUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(
      '250ms 250ms ease-in',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

// 更慢的从上往下平移
export const SlowDown = trigger('SlowDown', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(-20px)' }),
    animate(
      '250ms 250ms ease-in',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

// 更加快速的从左往右平移渐出
export const QuickLeft = trigger('QuickLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate('250ms ease-in', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

// 更加快速的从右往左平移渐出
export const QuickRight = trigger('QuickRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate('250ms ease-in', style({ opacity: 1, transform: 'translateX(0)' })),
  ]),
]);

export const SlowLeft = trigger('SlowLeft', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate(
      '500ms 250ms ease-in',
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
]);

export const SlowRight = trigger('SlowRight', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(20px)' }),
    animate(
      '500ms 250ms ease-in',
      style({ opacity: 1, transform: 'translateX(0)' })
    ),
  ]),
]);
