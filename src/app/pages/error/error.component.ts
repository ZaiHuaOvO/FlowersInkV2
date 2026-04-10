import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTypographyModule } from 'ng-zorro-antd/typography';

@Component({
  selector: 'flower-error',
  standalone: true,
  imports: [NzTypographyModule, RouterModule, NzButtonModule],
  templateUrl: './error.component.html',
  styleUrl: './error.component.css',
})
export class ErrorComponent {}
