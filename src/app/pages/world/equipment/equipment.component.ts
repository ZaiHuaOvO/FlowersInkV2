import { Component, OnInit } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { WorldService } from '../world.service';
import { QuickUp } from '../../../common_ui/animations/animation';
import { EquipmentCardComponent } from '../../../components/world/equipment-card/equipment-card.component';
import { FlCommentBoardComponent } from '../../../common_ui/fl_ui/fl-comment-board/fl-comment-board.component';
import { CommentService } from '../../../services/comment.service';
import { articleCommentSource } from '../../../shared/comment/comment-source.factory';
import type { CommentSource } from '../../../shared/comment/comment.model';

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
    FlCommentBoardComponent,
  ],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.css',
  animations: [QuickUp],
})
export class EquipmentComponent implements OnInit {
  data: any[] = [];
  loading = true;

  /** 装备评论是模块级线程，没有 targetId，所以可以在构造时一次性定下来 */
  readonly commentSource: CommentSource;

  constructor(
    private world: WorldService,
    commentService: CommentService,
  ) {
    this.commentSource = articleCommentSource(commentService, 'equipment');
  }

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
