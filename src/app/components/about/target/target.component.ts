import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { filter } from 'rxjs';
import { SlowLeft } from '../../../common_ui/animations/animation';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'flower-target',
  standalone: true,
  imports: [
    NzMenuModule,
    RouterModule,
    CommonModule,
    NzIconModule,
    NzFlexModule,
    NzAvatarModule,
    NzPopoverModule,
  ],
  templateUrl: './target.component.html',
  styleUrl: './target.component.css',
})
export class TargetComponent implements OnInit {
  showText = false;
  routeList = [
    {
      title: '关于我',
      icon: 'smile',
      url: '/about/me',
      showText: false,
    },
    {
      title: '关于网站',
      icon: 'cloud',
      url: '/about/website',
      showText: false,
    },
    {
      title: '留言板',
      icon: 'form',
      url: '/about/message',
      showText: false,
    },
  ];
  isPage: string = '';
  constructor(public router: Router) {}
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // 监听路由变化
  }
}
