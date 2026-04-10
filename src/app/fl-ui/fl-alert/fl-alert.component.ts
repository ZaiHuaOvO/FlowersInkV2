import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';

type AlertType = 'success' | 'info' | 'warning' | 'error';

@Component({
  selector: 'fl-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fl-alert-shell" [class]="alertClass">
      <div class="fl-alert-body">
        <div class="fl-alert-message" *ngIf="message">
          <ng-container *ngIf="isTemplateRef(message); else messageText" [ngTemplateOutlet]="message"></ng-container>
          <ng-template #messageText>{{ message }}</ng-template>
        </div>
        <div class="fl-alert-description" *ngIf="description">
          <ng-container
            *ngIf="isTemplateRef(description); else descriptionText"
            [ngTemplateOutlet]="description"
          ></ng-container>
          <ng-template #descriptionText>{{ description }}</ng-template>
        </div>
        <ng-content *ngIf="!message && !description"></ng-content>
      </div>
    </div>
  `,
  styleUrl: './fl-alert.component.css',
})
export class FlAlertComponent {
  @Input() type: AlertType = 'info';
  @Input() message: string | TemplateRef<unknown> | null = null;
  @Input() description: string | TemplateRef<unknown> | null = null;

  @Input({ alias: 'nzType' })
  set nzType(value: string) {
    if (value === 'success' || value === 'warning' || value === 'error') {
      this.type = value;
      return;
    }
    this.type = 'info';
  }

  @Input({ alias: 'nzMessage' })
  set nzMessage(value: string | TemplateRef<unknown> | null) {
    this.message = value;
  }

  @Input({ alias: 'nzDescription' })
  set nzDescription(value: string | TemplateRef<unknown> | null) {
    this.description = value;
  }

  get alertClass(): string {
    return `fl-alert-${this.type}`;
  }



  isTemplateRef(value: unknown): value is TemplateRef<unknown> {
    return value instanceof TemplateRef;
  }
}

