import { Injectable } from '@angular/core';
import { collection, Firestore } from '@angular/fire/firestore';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmojiService {
  private emojiSubject = new Subject<string>();
  private logShowPickerSubject = new BehaviorSubject<boolean>(false);
  emoji$ = this.emojiSubject.asObservable();
  toggle_emoji_picker$ = this.logShowPickerSubject.asObservable();
  isPickerOpen = false;
  constructor(private firestore: Firestore) { }

  selectEmoji(emoji: string) {
    this.emojiSubject.next(emoji);
  }

  handleShowPicker() {
    this.isPickerOpen = !this.isPickerOpen;
    this.logShowPickerSubject.next(this.isPickerOpen);
  }

  handleAddEmoji(message: string, message_from_user: string, description: string) {
    const EmojiRef = collection(this.firestore, 'emojis');
  }
}
