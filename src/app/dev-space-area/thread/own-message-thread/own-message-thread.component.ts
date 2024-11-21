import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, Input, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ChatServiceService } from '../../../firestore-service/chat-service.service';
import { FormsModule } from '@angular/forms';
import { MainServiceService } from '../../../firestore-service/main-service.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileUploadThreadService } from '../../../firestore-service/file-upload-thread.service';
import { AuthService } from '../../../firestore-service/auth.service';
import { ChatareaServiceService } from '../../../firestore-service/chatarea-service.service';
import { Subject, Subscription, filter } from 'rxjs';
import { EmojiService } from '../../../modules/emoji.service';
import { EmojiPickerComponent } from "../../../shared/emoji-picker/emoji-picker.component";

@Component({
  selector: 'app-own-message-thread',
  standalone: true,
  imports: [MatIconModule, MatMenuModule, CommonModule, FormsModule, EmojiPickerComponent],
  templateUrl: './own-message-thread.component.html',
  styleUrl: './own-message-thread.component.scss'
})
export class OwnMessageThreadComponent {
  @ViewChild('reactionContainer') reactionContainer!: ElementRef;
  @Input() thread: any;
  @Input() id: string = '';
  @Input() showReactionIcon: boolean = false;
  @Input() filURL: SafeResourceUrl | null = null;

  editMode: boolean = false;
  threadData: any;
  showReactions: boolean = false;
  reactions: any[] = [];
  threadMessages: any[] = [];
  reactionNames: string[] = [];
  uid: string | null = null;
  fileType: string | null = null;
  fileURL: SafeResourceUrl | null = null;
  fileName: string | null = null;
  avatar: string | null = null;
  toggleEmojiPicker: boolean = false;
  private sanitizer = inject(DomSanitizer);
  private uidSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();
  private emojiSubscription: Subscription | null = null;

  constructor(private chatService: ChatServiceService, private mainService: MainServiceService, private fileUploadServiceThread: FileUploadThreadService, private authService: AuthService, private chatareaService: ChatareaServiceService, private emojiService: EmojiService) {
    this.chatService.pickedThread$.subscribe((data) => {
      if (data) {
        this.threadData = data;
      }
    });
  }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.loadReactionNames();
    this.loadThreadMessages();
    this.loadUserAvatar();
    this.loadFileUpload();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
    if (this.emojiSubscription) {
      this.emojiSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event) {
    if (this.showReactions && this.reactionContainer) {
      const clickedInside = this.reactionContainer.nativeElement.contains(event.target);
      const isMatIcon = (event.target as HTMLElement).closest('mat-icon') !== null;
      if (!clickedInside && !isMatIcon) {
        this.showReactions = false;
      }
    }
  }

  showEmojiPicker() {
    this.toggleEmojiPicker = !this.toggleEmojiPicker;
    if (this.toggleEmojiPicker) {
      this.emojiSubscription = this.emojiService.emoji$
        .pipe(
          filter((emoji: string) => emoji.trim() !== '')
        )
        .subscribe((emoji: string) => {
          this.thread.content = this.thread.content ? this.thread.content + emoji : emoji;
        });
    } else {
      if (this.emojiSubscription) {
        this.emojiSubscription.unsubscribe();
        this.emojiSubscription = null;
      }
    }
  }

  loadUserAvatar() {
    this.chatareaService.getUserAvatar(this.thread.senderId).subscribe(avatar => {
      this.avatar = avatar;
    });
  }

  async loadFileUpload() {
    if (this.thread.fileUrl) {
      this.fileType = this.fileUploadServiceThread.getFileTypeFromFileName(this.thread.fileName)
      this.fileName = this.thread.fileName
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.thread.fileUrl)
    }
  }

  async loadReactionNames() {
    if (this.thread.reactions && this.thread.reactions.length > 0) {
      for (let reaction of this.thread.reactions) {
        const names = [];
        let currentUserIncluded = false;
        for (let id of reaction.userId) {
          if (id === this.uid) {
            currentUserIncluded = true;
          } else {
            const name = await this.chatService.getUserNameByUid(id);
            names.push(name);
          }
        }
        if (currentUserIncluded) {
          if (names.length === 0) {
            this.reactionNames.push('Du');
          } else if (names.length === 1) {
            this.reactionNames.push(`Du und ${names[0]}`);
          } else {
            this.reactionNames.push(`Du und ${names.length} weitere`);
          }
        } else {
          this.reactionNames.push(names.join(' und '));
        }
      }
    }
  }

  async loadThreadMessages() {
    const { channelId, messageId, id: threadId } = this.threadData;
    this.chatService.loadThreadMessages(channelId, messageId, threadId).then((messages) => {
      this.threadMessages = messages;
    });
  }

  reactToThreadMessage(reactionType: string, path: string, id: string): void {
    const { channelId, messageId, id: threadId } = this.threadData;
    if (channelId && messageId && threadId && id) {
      this.chatService.addReactionToThreadMessage(channelId, messageId, threadId, reactionType, path, id, this.uid!)
    }
  }

  toggleReactions() {
    this.showReactions = !this.showReactions
  }

  formatTime(timeString: string): string {
    return this.mainService.formatTime(timeString);
  }

  formatDate(dateString: string): string {
    return this.mainService.formatDate(dateString);
  }


  editMessage() {

  }

  cancelEdit() {

  }

  saveEditMessage() {

  }

  isEditingMessage() {

  }
}
