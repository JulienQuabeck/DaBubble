import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatServiceService } from '../../../firestore-service/chat-service.service';
import { MatMenu } from '@angular/material/menu';
import { MainServiceService } from '../../../firestore-service/main-service.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileUploadThreadService } from '../../../firestore-service/file-upload-thread.service';
import { ChatareaServiceService } from '../../../firestore-service/chatarea-service.service';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../firestore-service/auth.service';
import { ChannelService } from '../../../modules/channel.service';
import { ReactionService } from '../../../firestore-service/reaction.service';
import { EmojiPickerComponent } from "../../../shared/emoji-picker/emoji-picker.component";
import { EmojiService } from '../../../modules/emoji.service';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatMenu, EmojiPickerComponent],
  templateUrl: './message-thread.component.html',
  styleUrl: './message-thread.component.scss',
})
export class MessageThreadComponent implements OnInit, OnDestroy {
  @ViewChild('reactionContainer') reactionContainer!: ElementRef;
  private sanitizer = inject(DomSanitizer);
  private uidSubscription: Subscription | null = null;

  @Input() thread: any;
  @Input() id: string = '';
  @Input() showReactionIcon: boolean = false;

  threadData: any;
  threadMessages: any[] = [];
  fileType: string | null = null;
  fileURL: SafeResourceUrl | null = null;
  fileName: string | null = null;
  avatar: string | null = null;
  uid: string | null = null;
  reactionNames: string[] = [];
  showReactions: boolean = false;
  reactions: any[] = [];
  toggleEmojiPicker: boolean = false;
  private emojiSubscription: Subscription | null = null;
  openNextWrapper: 'wrapper_1' | 'wrapper_2' | 'wrapper_3' | 'wrapper_4' = 'wrapper_1';
  constructor(
    private chatService: ChatServiceService,
    private mainService: MainServiceService,
    private fileUploadServiceThread: FileUploadThreadService,
    private chatareaService: ChatareaServiceService,
    private authService: AuthService,
    private channelService: ChannelService,
    private reactionService: ReactionService,
    private emojiService: EmojiService,
    private cdr: ChangeDetectorRef,
  ) {
    this.chatService.pickedThread$.subscribe(data => {
      if (data) {
        this.threadData = data;
      }
    });
  }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.loadFileUpload();
    this.loadReactionNames();
    this.loadThreadMessages();
    this.loadUserAvatar();
    this.loadFileUpload();

    this.channelService.openMessageMobile$.subscribe(state => {
      this.openNextWrapper = state;
    });
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
    if (this.emojiSubscription) {
      this.emojiSubscription.unsubscribe();
    }
  }

  toggleReactions() {
    this.showReactions = !this.showReactions;
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

  loadUserAvatar() {
    this.chatareaService.getUserAvatar(this.thread.senderId).subscribe(avatar => {
      this.avatar = avatar;
    });
  }

  async loadFileUpload() {
    if (this.thread.fileName) {
      this.fileType = this.fileUploadServiceThread.getFileTypeFromFileName(this.thread.fileName);
      this.fileName = this.thread.fileName;
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.thread.fileUrl);
    }
  }

  loadThreadMessages(): void {
    const { channelId, messageId, id: threadId } = this.threadData;
    this.chatService.loadThreadMessages(channelId, messageId, threadId).then(messages => {
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

  formatTime(timeString: string): string {
    return this.mainService.formatTime(timeString);
  }

  formatDate(dateString: string): string {
    return this.mainService.formatDate(dateString);
  }
}
