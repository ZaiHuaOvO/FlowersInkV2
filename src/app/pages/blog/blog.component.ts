import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { debounceTime } from 'rxjs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogTitleComponent } from '../../components/blog/blog-title/blog-title.component';
import { SlowUp, QuickUp } from '../../common_ui/animations/animation';
import {
  groupByYearDesc,
  sortByDateDesc,
} from '../../shared/utils/date-grouping.util';
import { WindowService } from '../../services/window.service';
import { WelcomeService } from '../welcome/welcome.service';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzSpinModule,
    NzTimelineModule,
    NzTypographyModule,
    NzInputModule,
    NzIconModule,
    RouterModule,
    BlogTitleComponent,
    DatePipe],
  animations: [SlowUp, QuickUp],
})
export class BlogComponent implements OnInit {
  data: any[] = [];
  count = 0;
  loading = true;
  searchControl = new FormControl('');
  isMobile = false;

  constructor(private welcome: WelcomeService, private window: WindowService) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });

    this.searchControl.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.getBlog();
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.getBlog();
  }

  getBlog(): void {
    this.loading = true;
    this.welcome
      .getBlogs({
        title: this.searchControl.value,
        limit: 999,
      })
      .subscribe((res: any) => {
        const blogs = res['data'].data ?? [];
        this.data = this.processAndGroupData(blogs);
        this.count = res['data'].count;
        this.loading = false;
      });
  }

  processAndGroupData(dataArray: any[]) {
    const sorted = sortByDateDesc(dataArray, (item) => new Date(item.date));
    return groupByYearDesc(sorted, (item) => new Date(item.date));
  }
}
