import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-header-mobile',
  standalone: true,
  imports: [
    CommonModule,
    NzFlexModule,
    NzTypographyModule,
    RouterModule,
    NzIconModule,
    NzDividerModule
  ],
  templateUrl: './header-mobile.component.html',
  styleUrl: './header-mobile.component.css'
})
export class HeaderMobileComponent {
  nzData: { value: any } = inject(NZ_DRAWER_DATA);
  activeRoute = '';

  constructor(
    private drawerRef: NzDrawerRef<string>,
    private router: Router,
    private cdr: ChangeDetectorRef,

  ) {
    this.activeRoute = this.router.url;
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
      this.drawerRef.close();
    });

  }

  isActive(url: any): boolean {
    return this.activeRoute === url;
  }

  isParentActive(URL: any): boolean {
    return this.activeRoute.includes(URL);
  }

}
