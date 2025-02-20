import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NZ_DRAWER_DATA, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzImageModule } from 'ng-zorro-antd/image';

@Component({
  selector: 'flower-game-pic',
  standalone: true,
  imports: [
    NzFlexModule,
    NzImageModule,
    CommonModule,
    NzGridModule
  ],
  templateUrl: './game-pic.component.html',
  styleUrl: './game-pic.component.css'
})
export class GamePicComponent {
  nzData: { value: string } = inject(NZ_DRAWER_DATA);
  constructor(private drawerRef: NzDrawerRef<string>) {
    console.log(this.nzData);
  }

  close(): void {
    this.drawerRef.close(this.nzData);
  }
}
