import { Component } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { Forever } from '../svg/forever/forever';
import { PlanetComponent } from '../svg/planet/planet.component';

@Component({
  selector: 'flower-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css'],
  standalone: true,
  imports: [
    NzFlexModule,
    NzIconModule,
    NzAvatarModule,
    NzTypographyModule,
    PlanetComponent,
    Forever,
  ],
})
export class FooterComponent {}
