import { ChangeDetectorRef, Component, HostListener } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";

@Component({
  selector: "flower-back-top",
  standalone: true,
  imports: [NzIconModule],
  templateUrl: "./back-top.component.html",
  styleUrl: "./back-top.component.css",
})
export class BackTopComponent {
  isHovered = false;
  visible = false;

  constructor(private cdr: ChangeDetectorRef) {}

  @HostListener("window:scroll")
  onScroll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const shouldShow = scrollY > 400;
    if (shouldShow !== this.visible) {
      this.visible = shouldShow;
      this.cdr.detectChanges();
    }
  }

  onMouseEnter() {
    this.isHovered = true;
    this.cdr.detectChanges();
  }

  onMouseLeave() {
    this.isHovered = false;
    this.cdr.detectChanges();
  }

  scrollToTop() {
    const startY = window.scrollY || document.documentElement.scrollTop || 0;
    const duration = 600;
    const startTime = performance.now();

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };

    const scroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      window.scrollTo(0, startY * (1 - eased));

      if (progress < 1) {
        requestAnimationFrame(scroll);
      }
    };

    requestAnimationFrame(scroll);
  }
}
