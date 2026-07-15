import { Component, EventEmitter, Output } from '@angular/core';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { emojiCategories, kaomojiList } from '../../../ts/emoji';

type EmojiTab = 'face' | 'gesture' | 'heart' | 'kaomoji';

@Component({
  selector: 'flower-emoji',
  standalone: true,
  imports: [NzFlexModule, NzPopoverModule, NzIconModule],
  templateUrl: './emoji.component.html',
  styleUrl: './emoji.component.css',
})
export class EmojiComponent {
  @Output() emojiSelected = new EventEmitter<string>();
  visible = false;

  readonly emojiCategories = emojiCategories;
  readonly kaomojiList = kaomojiList;
  activeTab: EmojiTab = 'face';

  selectEmoji(emoji: string): void {
    this.emojiSelected.emit(emoji);
  }

  selectKaomoji(text: string): void {
    this.emojiSelected.emit(text);
  }
}
