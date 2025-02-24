import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzAffixModule } from 'ng-zorro-antd/affix';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { BlogCardComponent } from '../../../components/blog/blog-card/blog-card.component';
import { BlogTitleComponent } from '../../../components/blog/blog-title/blog-title.component';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { WindowService } from '../../../services/window.service';
import { LifeService } from '../../life/life.service';
import { debounceTime } from 'rxjs';
import { SlowUp, QuickUp } from '../../../common_ui/animations/animation';
import { FoodWaterfallComponent } from '../../../components/life/food-waterfall/food-waterfall.component';
import { NodataComponent } from '../../../components/website/nodata/nodata.component';
import { NzImageModule, NzImageService } from 'ng-zorro-antd/image';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'flower-food',
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
    FoodWaterfallComponent,
    NodataComponent,
    NzImageModule,
    NzMenuModule,
  ],
  templateUrl: './food.component.html',
  styleUrl: './food.component.css',
  animations: [SlowUp, QuickUp],
})
export class FoodComponent implements OnInit {
  data: any[] = [];
  loading = true;
  isMobile: boolean = false;
  searchControl = new FormControl('');
  foodMenuList: any[] = [];
  tagList: any[] = [];
  targetList: any[] = [];
  constructor(
    private life: LifeService,
    private modal: NzModalService,
    private window: WindowService,
    private image: NzImageService,
    private msg: NzMessageService
  ) {
    this.window.isMobile$.subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
    // 添加防抖，设置时间为500ms
    this.searchControl.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.getFood();
    });
  }
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getFoodTag();
  }
  getFood(): void {
    this.loading = true;
    this.life
      .getLifeList({
        title: this.searchControl.value,
        tag: this.tagList,
      })
      .subscribe((res: any) => {
        this.data = res['data'].data;
        this.FoodTitle();

        setTimeout(() => {
          this.loading = false;
        }, 250);
      });
  }

  getFoodTag(): void {
    this.loading = true;
    this.life.getLifeTag().subscribe((res: any) => {
      this.tagList = res['data']
        .map((item: any) => item.label)
        .filter((tag: string) => tag.startsWith('美食-'));
      this.targetList = this.tagList.map(
        (tag) => tag.replace('美食-', '') // 去掉 "美食-" 前缀
      );
      this.getFood();
    });
  }

  getFoodMenu(tag: any): void {
    this.loading = true;
    this.life
      .getLifeList({
        title: this.searchControl.value,
        tag: tag,
      })
      .subscribe((res: any) => {
        this.data = res['data'].data;

        setTimeout(() => {
          this.loading = false;
        }, 250);
      });
  }

  FoodTitle(): any {
    this.data.forEach((item: any) => {
      if (item.title.includes('+')) {
        item.title = item.title.replace('+', ' \n ');
      }
    });
  }

  FoodMenu(foodMenu: TemplateRef<{}>): void {
    this.modal.create({
      nzTitle: '美食全收录',
      nzContent: foodMenu,
      nzFooter: null,
      nzMaskClosable: true,
      nzClosable: false,
      nzStyle: { height: '80vw' },
    });
  }

  FoodImage(img: any): void {
    this.msg.info('原图加载中，会比较慢哦')
    window.open(img, '_blank');
  }
}
