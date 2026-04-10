import { Component } from '@angular/core';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-nodata',
  standalone: true,
  imports: [NzTypographyModule],
  templateUrl: './nodata.component.html',
  styleUrl: './nodata.component.css',
})
export class NodataComponent {}
