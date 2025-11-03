
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { QuickDown } from '../../../common_ui/animations/animation';
import { WindowService } from '../../../services/window.service';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { HeaderMobileComponent } from './header-mobile/header-mobile.component';

interface MenuItem {
  title: string;
  icon: string;
  url?: string;
  URL?: string;
  child?: MenuItem[];
  showChildren?: boolean;
}

@Component({
  selector: 'flower-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    RouterModule,
    NzIconModule,
    NzMenuModule,
    NzFlexModule,
    NzAvatarModule,
    NzDropDownModule,
    NzDrawerModule
],
  animations: [QuickDown],
})
export class HeaderComponent implements OnInit {
  MenuList: MenuItem[] = [
    {
      title: '首页',
      icon: 'home',
      url: '/welcome',
      child: [],
      showChildren: false
    },
    {
      title: '写作',
      icon: 'edit',
      URL: 'blog',
      child: [
        {
          title: '技术',
          icon: '',
          url: '/blog/article',
        },
        {
          title: '随笔',
          icon: '',
          url: '/blog/essay',
        },
        {
          title: '文归档',
          icon: '',
          url: '/blog/all',
        },
      ],
      showChildren: false
    },
    {
      title: '见闻',
      icon: 'bulb',
      URL: 'world',
      child: [
        // {
        //   title: '美食',
        //   icon: '',
        //   url: '/world/food',
        // },
        {
          title: '书籍',
          icon: '',
          url: '/world/book',
        },
        {
          title: '游戏',
          icon: '',
          url: '/world/game',
        },
      ],
      showChildren: false
    },
    {
      title: '友链',
      icon: 'link',
      url: '/link',
      child: [],
      showChildren: false
    },
    {
      title: '关于',
      icon: 'user',
      URL: 'about',
      child: [
        {
          title: '关于我',
          icon: '',
          url: '/about/me',
        },
        {
          title: '关于网站',
          icon: '',
          url: '/about/website',
        },
        {
          title: '留言板',
          icon: '',
          url: '/about/message',
        },
      ],
      showChildren: false
    },
  ];
  isMobile: boolean = false;
  activeRoute = '';
  @ViewChild('mobileMenuTitle', { static: true })
  mobileMenuTitle!: TemplateRef<any>;
  constructor(private window: WindowService,
    private router: Router,
    private drawerService: NzDrawerService,

  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    this.router.events.subscribe(() => {
      this.activeRoute = this.router.url;
    });
  }
  // [ngStyle]="{'width':isMobile ?'100%':'60%','margin-left' :isMobile ?'0':'9.5%'}"
  ngOnInit() { }

  isActive(url: any): boolean {
    return this.activeRoute === url;
  }

  isParentActive(URL: any): boolean {
    return this.activeRoute.includes(URL);
  }

  mobileMenu(): void {
    this.drawerService.create({
      nzTitle: this.mobileMenuTitle,
      // nzFooter: 'Footer',
      // nzExtra: 'Extra',
      nzClosable: false,
      nzContent: HeaderMobileComponent,
      nzPlacement: 'left',
      nzWidth: '60vw',
      nzData: {
        value: this.MenuList
      }
    });
  }
}
