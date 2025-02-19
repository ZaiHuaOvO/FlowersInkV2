import { Component, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-game-card',
  standalone: true,
  imports: [
    NzCardModule,
    NzTagModule,
    NzFlexModule,
    NzTypographyModule,
    NzImageModule
  ],
  templateUrl: './game-card.component.html',
  styleUrl: './game-card.component.css'
})
export class GameCardComponent {
  @Input() game: any;

  colorList: any = {
    'PS5': 'blue',
    'Steam': 'black',
  }

}
