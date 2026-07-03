import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WelcomeService } from '../welcome/welcome.service';

interface Game {
  name: string;
  desc: string;
}

interface Music {
  song: string;
  artist: string;
}

@Component({
  selector: 'app-welcome-v2',
  standalone: true,
  templateUrl: './welcome-v2.component.html',
  styleUrls: ['./welcome-v2.component.css'],
  imports: [RouterModule],
})
export class WelcomeV2Component implements OnInit {
  private welcomeService = inject(WelcomeService);

  articles: any[] = [];
  loading = true;

  games: Game[] = [
    { name: '阴阳师', desc: '我为什么要玩这个' },
    { name: '崩坏：星穹铁道', desc: '流萤小姐请对我使用战技' },
    { name: '碧蓝航线', desc: '拉菲独角兽一生推' },
    { name: '棕色尘埃2', desc: '不讲不讲' },
    { name: '想不想修真', desc: '怀旧文字数值修仙游戏' },
    { name: '绝区零', desc: '伤心之人回归游玩中' },
  ];

  musicList: Music[] = [];

  private readonly allMusic: Music[] = [
    { song: 'Lemon', artist: '米津玄師' },
    { song: '打上花火', artist: 'DAOKO × 米津玄師' },
    { song: '夜に駆ける', artist: 'YOASOBI' },
    { song: 'Pretender', artist: 'Official髭男dism' },
    { song: '紅蓮華', artist: 'LiSA' },
    { song: '廻廻奇譚', artist: 'Eve' },
    { song: '怪物', artist: 'YOASOBI' },
    { song: 'うっせぇわ', artist: 'Ado' },
    { song: '新時代', artist: 'Ado' },
    { song: 'KICK BACK', artist: '米津玄師' },
    { song: 'アイドル', artist: 'YOASOBI' },
    { song: '地球儀', artist: '米津玄師' },
    { song: '祝福', artist: 'YOASOBI' },
    { song: '絆ノ奇跡', artist: 'MAN WITH A MISSION × milet' },
    { song: 'シルエット', artist: 'KANA-BOON' },
    { song: '裸の勇者', artist: 'Vaundy' },
    { song: 'ドライフラワー', artist: '優里' },
    { song: '花になって', artist: 'BE:FIRST' },
  ];

  ngOnInit() {
    // 随机选取 6 首音乐
    const shuffled = [...this.allMusic].sort(() => Math.random() - 0.5);
    this.musicList = shuffled.slice(0, 6);

    // 获取精选文章，取前 5 篇
    this.welcomeService.getBlogs({ star: true }).subscribe({
      next: (res: any) => {
        const data = res?.data?.data ?? [];
        this.articles = data.slice(0, 5);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
