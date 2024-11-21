import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { QuickDown } from '../../common_ui/animations/animation';
import { WindowService } from '../../services/window.service';

interface MenuItem {
  title: string;
  icon: string;
  url?: string;
  child?: MenuItem[];
}

@Component({
  selector: 'flower-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NzIconModule,
    NzMenuModule,
    NzFlexModule,
    NzAvatarModule,
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
    },
    {
      title: '技术',
      icon: 'align-left',
      child: [
        {
          title: '技术文章',
          icon: '',
          url: '/blog/article',
        },
        {
          title: '问题记录',
          icon: '',
          url: '/blog/question',
        },
        {
          title: '文归档',
          icon: '',
          url: '/blog/all',
        },
      ],
    },
    {
      title: '生活',
      icon: 'heart',
      child: [
        {
          title: '老婆',
          icon: '',
          url: '/life/heart',
        },
        // {
        //   title: '美食',
        //   icon: '',
        //   url: '/life/food',
        // },
      ],
    },
    {
      title: '关于',
      icon: 'user',
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
    },
  ];
  isMobile: boolean = false;
  constructor(private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }
  // [ngStyle]="{'width':isMobile ?'100%':'60%','margin-left' :isMobile ?'0':'9.5%'}"
  ngOnInit() {}
}
