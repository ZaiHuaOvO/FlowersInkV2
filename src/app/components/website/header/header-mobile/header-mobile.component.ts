import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { RoutePrefetchService } from '../../../../services/route-prefetch.service';

@Component({
  selector: 'flower-header-mobile',
  standalone: true,
  imports: [
    RouterModule,
    NzIconModule,
    NzDividerModule
  ],
  templateUrl: './header-mobile.component.html',
  styleUrl: './header-mobile.component.css'
})
export class HeaderMobileComponent {
  nzData: { value: any[] } = inject(NZ_DRAWER_DATA);
  private readonly destroyRef = inject(DestroyRef);
  activeRoute = '';

  constructor(
    private drawerRef: NzDrawerRef<string>,
    private router: Router,
    private routePrefetchService: RoutePrefetchService,
  ) {
    this.activeRoute = this.router.url;
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.activeRoute = this.router.url;
        this.drawerRef.close();
      });
  }

  isActive(url: string): boolean {
    return this.activeRoute === url;
  }

  isParentActive(parentUrl: string): boolean {
    return this.activeRoute.startsWith('/' + parentUrl + '/')
        || this.activeRoute === '/' + parentUrl;
  }

  isChildActive(child: any[]): boolean {
    return child.some(sub => this.activeRoute === sub.url);
  }

  toggleChildren(item: any): void {
    item.showChildren = !item.showChildren;
  }

  prefetchUrl(url: string | undefined, parentUrl?: string): void {
    if (url) {
      this.routePrefetchService.prefetchByUrl(url);
      return;
    }
    if (parentUrl) {
      this.routePrefetchService.prefetchByUrl(`/${parentUrl}`);
    }
  }

  closeDrawer(): void {
    this.drawerRef.close();
  }
}
