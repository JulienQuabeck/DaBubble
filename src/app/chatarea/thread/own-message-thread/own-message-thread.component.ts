import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, ViewChild, inject } from '@angular/core';
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
import { ReactionService } from '../../../firestore-service/reaction.service';

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
  showEditBtns: boolean = false;
  private sanitizer = inject(DomSanitizer);
  private uidSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();
  private emojiSubscription: Subscription | null = null;
  private threadSubscription: Subscription | null = null;
  private threadDataSubscription: Subscription | null = null;

  constructor(private chatService: ChatServiceService, private cdr: ChangeDetectorRef, private reactionService: ReactionService, private mainService: MainServiceService, private fileUploadServiceThread: FileUploadThreadService, private authService: AuthService, private chatareaService: ChatareaServiceService, private emojiService: EmojiService) {
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
    this.threadDataSubscription = this.chatService.pickedThread$.subscribe((data) => {
      if (data && data.channelId && data.messageId && data.id) {
        this.threadData = data;
        this.loadFileUpload();
        if (this.thread && this.thread.id && this.threadData.channelId && this.threadData.messageId && this.threadData.id) {
          this.subscribeToThreadMessageUpdates();
          this.loadReactionNames();
          this.loadThreadMessages();
          this.loadUserAvatar();
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
    if (this.threadDataSubscription) {
      this.threadDataSubscription.unsubscribe();
    }
    if (this.threadSubscription) {
      this.threadSubscription.unsubscribe();
    }
    if (this.emojiSubscription) {
      this.emojiSubscription.unsubscribe();
    }
  }

  private subscribeToThreadMessageUpdates() {
    const { channelId, messageId, id: threadId } = this.threadData;
    if (!channelId || !messageId || !threadId || !this.thread) return;
    if (this.threadSubscription) {
      this.threadSubscription.unsubscribe();
    }
    this.threadSubscription = this.chatService.getThreadMessageById(
      channelId, messageId, threadId, this.thread.id
    ).subscribe(updatedThread => {
      if (updatedThread) {
        this.thread = updatedThread;
        this.loadFileUpload();
        this.cdr.markForCheck();
      }
    });
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
        .pipe(filter((emoji: string) => emoji.trim() !== ''))
        .subscribe((emoji: string) => {
          this.reactToThreadMessage(this.thread.id, emoji);
          this.toggleEmojiPicker = false;
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
    if (this.thread && this.thread.fileUrl && this.thread.fileName) {
      this.fileType = this.fileUploadServiceThread.getFileTypeFromFileName(this.thread.fileName);
      this.fileName = this.thread.fileName;
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.thread.fileUrl);
      this.cdr.markForCheck();
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

  async reactToThreadMessage(id: string, emoji: string): Promise<void> {
    const { channelId, messageId, id: threadId } = this.threadData;
    if (channelId && messageId && threadId && id) {
      this.reactionService.addReactionToThreadMessage(channelId, messageId, threadId, emoji, id, this.uid!);
      const hasReacted = this.hasUserReacted(emoji);
      await this.toggleReaction(id, emoji, hasReacted);
    }
  }

  private async toggleReaction(threadMessageId: string, emoji: string, hasReacted: boolean) {
    const { channelId, messageId, id: threadId } = this.threadData;
    if (hasReacted) {
      await this.reactionService.removeReactionFromThreadMessage(channelId, messageId, threadId, emoji, threadMessageId, this.uid!);
      this.updateLocalReactions(emoji, false);
    } else {
      await this.reactionService.addReactionToThreadMessage(channelId, messageId, threadId, emoji, threadMessageId, this.uid!);
      this.updateLocalReactions(emoji, true);
    }
  }

  private hasUserReacted(emoji: string): boolean {
    return this.thread.reactions?.some((reaction: any) =>
      reaction.emoji === emoji && reaction.userId.includes(this.uid!)
    );
  }

  updateLocalReactions(emoji: string, isAdding: boolean) {
    const reactions = this.thread.reactions || [];
    const reactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);

    if (reactionIndex !== -1) {
      this.modifyReactionUsers(reactions[reactionIndex], isAdding);
      if (reactions[reactionIndex].count === 0) reactions.splice(reactionIndex, 1);
    } else if (isAdding) {
      reactions.push({ emoji, userId: [this.uid!], count: 1 });
    }
    this.thread.reactions = reactions;
    this.loadReactionNames();
    this.cdr.markForCheck();
  }

  private modifyReactionUsers(reaction: any, isAdding: boolean) {
    const userIndex = reaction.userId.indexOf(this.uid!);
    if (isAdding && userIndex === -1) {
      reaction.userId.push(this.uid!);
      reaction.count += 1;
    } else if (!isAdding && userIndex !== -1) {
      reaction.userId.splice(userIndex, 1);
      reaction.count -= 1;
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
    this.editMode = true;
    this.showEditBtns = false;
  }

  openEditBtns() {
    if (!this.editMode) {
      this.showEditBtns = !this.showEditBtns
    }
  }

  cancelEdit() {
    this.editMode = false;
    this.showEditBtns = false;
  }

  saveEditMessage(threadMessageId: string, content: string) {
    const { channelId, messageId, id: threadId } = this.threadData;
    if (content.length > 1) {
      this.chatService.updateThreadMessage(channelId, messageId, threadId, threadMessageId, content)
    } else {
      this.deleteMessage(threadMessageId);
    }
  }

  deleteMessage(threadMessageId: string) {
    const { channelId, messageId, id: threadId } = this.threadData;
    this.chatService.deleteThreadMessage(channelId, messageId, threadId, threadMessageId);
  }
}
