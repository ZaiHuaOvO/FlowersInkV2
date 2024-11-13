import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMenuModule } from 'ng-zorro-antd/menu';

interface MenuItem {
  title: string;
  icon: string;
  child?: MenuItem[];
}

@Component({
  selector: 'flower-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzMenuModule,
    NzFlexModule,
    NzAvatarModule,
  ],
})
export class HeaderComponent implements OnInit {
  MenuList: MenuItem[] = [
    {
      title: '首页',
      icon: 'home',
      child: [],
    },
    {
      title: '技术',
      icon: 'align-left',
      child: [
        {
          title: '文章',
          icon: '',
        },
        {
          title: '问题',
          icon: '',
        },
        {
          title: '归档',
          icon: '',
        },
      ],
    },
    {
      title: '生活',
      icon: 'heart',
      child: [
        {
          title: '我老婆',
          icon: '',
        },
        {
          title: '美食',
          icon: '',
        },
      ],
    },
    {
      title: '关于',
      icon: 'user',
      child: [
        {
          title: '关于我',
          icon: '',
        },
        {
          title: '关于网站',
          icon: '',
        },
      ],
    },
  ];
  constructor() {}

  ngOnInit() {}
}
