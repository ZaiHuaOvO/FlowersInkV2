import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { FlButtonComponent } from '../../../common_ui/fl_ui/fl-button/fl-button.component';

export interface ExternalLinkConfirmData {
  url: string;
  host: string;
}

/**
 * 外链确认弹窗内容。只由 ExternalLinkService 通过 NzModalService 打开，
 * 因此不直接依赖该 service，避免两个模块循环引用。
 */
@Component({
  selector: 'flower-external-link-confirm',
  standalone: true,
  imports: [FlButtonComponent],
  templateUrl: './external-link-confirm.component.html',
  styleUrl: './external-link-confirm.component.css',
})
export class ExternalLinkConfirmComponent implements AfterViewInit {
  private readonly data = inject<ExternalLinkConfirmData>(NZ_MODAL_DATA);
  private readonly modalRef = inject(NzModalRef);
  private readonly cancelButton = viewChild('cancelButton', { read: ElementRef });

  readonly url = this.data.url;
  readonly host = this.data.host;

  constructor() {
    this.modalRef.afterOpen.subscribe(() => this.focusCancelButton());
  }

  ngAfterViewInit(): void {
    this.focusCancelButton();
  }

  private focusCancelButton(): void {
    setTimeout(() =>
      this.cancelButton()?.nativeElement.querySelector('button')?.focus(),
    );
  }

  confirm(): void {
    this.modalRef.close();
    window.open(this.url, '_blank', 'noopener,noreferrer');
  }

  cancel(): void {
    this.modalRef.close();
  }
}
