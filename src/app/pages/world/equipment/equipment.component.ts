import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { WorldService } from '../world.service';
import { QuickUp } from '../../../common_ui/animations/animation';
import { EquipmentCardComponent } from '../../../components/world/equipment-card/equipment-card.component';
import { CommentSectionComponent } from '../../../components/website/comment-section/comment-section.component';

@Component({
  selector: 'flower-equipment',
  standalone: true,
  imports: [
    NzFlexModule,
    NzSpinModule,
    NzGridModule,
    NzTypographyModule,
    BlogTitleComponent,
    EquipmentCardComponent,
    CommentSectionComponent,
  ],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.css',
  animations: [QuickUp],
})
export class EquipmentComponent implements OnInit {
  data: any[] = [];
  loading = true;

  constructor(private world: WorldService) {}

  ngOnInit(): void {
    this.getEquipment();
  }

  getEquipment(): void {
    this.world.getEquipmentList().subscribe((res: any) => {
      this.data = (res?.data?.categories ?? []).filter(
        (cat: any) => (cat?.items?.length ?? 0) > 0,
      );
      this.loading = false;
    });
  }
}
