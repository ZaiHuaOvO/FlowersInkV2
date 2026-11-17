import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import { resolveGameCover } from './game-display.util';
import { GameTimelineRevealService } from './game-timeline-reveal.service';
import type { TimelineEvent } from './game-view.model';

@Directive({
  selector: '[gameReveal]',
  standalone: true,
})
export class GameRevealDirective implements OnChanges, OnDestroy {
  @Input({ required: true }) gameReveal!: TimelineEvent;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly reveal = inject(GameTimelineRevealService);
  private observedId: number | null = null;

  ngOnChanges(): void {
    const event = this.gameReveal;
    if (!event) {
      return;
    }

    const id = event.game.id;
    if (this.observedId === id) {
      return;
    }

    if (this.observedId !== null) {
      this.reveal.unobserve(this.element.nativeElement);
    }
    this.observedId = id;
    this.reveal.observe(
      this.element.nativeElement,
      id,
      event.order,
      resolveGameCover(event.game),
    );
  }

  ngOnDestroy(): void {
    this.reveal.unobserve(this.element.nativeElement);
  }
}
