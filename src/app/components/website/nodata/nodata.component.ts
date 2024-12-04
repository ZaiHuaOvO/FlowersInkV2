import { Component } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-nodata',
  standalone: true,
  imports: [NzFlexModule, NzTypographyModule],
  templateUrl: './nodata.component.html',
  styleUrl: './nodata.component.css',
})
export class NodataComponent {}
