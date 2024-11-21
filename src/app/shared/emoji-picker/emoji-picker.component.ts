import { Component, OnInit } from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiService } from '../../modules/emoji.service';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [PickerComponent],
  templateUrl: './emoji-picker.component.html',
  styleUrl: './emoji-picker.component.scss',
})
export class EmojiPickerComponent implements OnInit {
  selectedEmoji: string | null = null;
  toggleEmojiPicker: boolean = false;
  constructor(private emojiService: EmojiService) { }

  ngOnInit(): void {
    this.emojiService.toggle_emoji_picker$.subscribe(statePicker => {
      this.toggleEmojiPicker = statePicker;
    });
  }

  onAddEmoji(event: any) {
    const emoji = event.emoji.native;
    this.emojiService.selectEmoji(emoji);
    this.onTogglePicker();
  }

  onTogglePicker() {
    this.emojiService.handleShowPicker();
  }
}
