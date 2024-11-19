import { Component } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { TargetComponent } from '../../../components/target/target.component';

@Component({
  selector: 'flower-message',
  standalone: true,
  imports: [NzFlexModule, NzTypographyModule, NzIconModule, TargetComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css',
})
export class MessageComponent {}
