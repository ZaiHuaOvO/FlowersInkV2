import { Component, OnInit } from '@angular/core';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { debounceTime } from 'rxjs';
import { WindowService } from '../../../services/window.service';
import { WorldService } from '../world.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { FoodWaterfallComponent } from '../../../components/life/food-waterfall/food-waterfall.component';
import { NodataComponent } from '../../../components/website/nodata/nodata.component';
import { QuickUp, SlowUp } from '../../../common_ui/animations/animation';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { BookCardComponent } from '../../../components/world/book-card/book-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'flower-book',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzFlexModule,
    NzInputModule,
    NzIconModule,
    NzTypographyModule,
    BlogTitleComponent,
    NzSpinModule,
    NzModalModule,
    NzAffixModule,
    NzImageModule,
    NzMenuModule,
    NzTagModule,
    NzDividerModule,
    BookCardComponent,
    RouterModule,
  ],
  templateUrl: './book.component.html',
  styleUrl: './book.component.css',
  animations: [SlowUp, QuickUp],
})
export class BookComponent implements OnInit {
  data: any[] = [];
  loading = true;
  isMobile: boolean = false;
  totalBooks = 0;
  totalReadingTime = 0;
  constructor(
    private world: WorldService,
    private modal: NzModalService,
    private window: WindowService,
    private image: NzImageService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  ngOnInit(): void {
    this.getBook();
  }

  getBook(): void {
    this.world.getBookList().subscribe((res: any) => {
      this.data = res['data'].books;
      this.totalBooks = res['data'].totalBooks;
      this.totalReadingTime = res['data'].totalReadingTime;
      setTimeout(() => {
        this.loading = false;
      }, 500);
    });
  }
}
