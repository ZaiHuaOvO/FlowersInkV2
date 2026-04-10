import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
interface TargetRoute {
  title: string;
  symbol: string;
  url: string;
}

@Component({
  selector: 'flower-target',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './target.component.html',
  styleUrl: './target.component.css',
})
export class TargetComponent {
  routeList: TargetRoute[] = [
    { title: '\u5173\u4E8E\u6211', symbol: '\u263A\uFE0E', url: '/about/me' },
    { title: '\u5173\u4E8E\u7F51\u7AD9', symbol: '\u2699\uFE0E', url: '/about/website' },
    { title: '\u7559\u8A00\u677F', symbol: '\u270E\uFE0E', url: '/about/message' }];
}
