import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'flower-back-top',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzBackTopModule],
  templateUrl: './back-top.component.html',
  styleUrl: './back-top.component.css',
})
export class BackTopComponent {
  isHovered = false;

  constructor(private cdr: ChangeDetectorRef) {}

  onMouseEnter() {
    this.isHovered = true;
    this.cdr.detectChanges(); // 手动触发变更检测
  }

  onMouseLeave() {
    this.isHovered = false;
    this.cdr.detectChanges(); // 手动触发变更检测
  }
}
