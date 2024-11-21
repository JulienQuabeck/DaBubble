import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { OwnMessageComponent } from '../own-message/own-message.component';
import { ChatServiceService } from '../../firestore-service/chat-service.service';
import { MainServiceService } from '../../firestore-service/main-service.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FileUploadService } from '../../firestore-service/file-upload.service';
import { AuthService } from '../../firestore-service/auth.service';
import { ChatareaServiceService } from '../../firestore-service/chatarea-service.service';
import { ChannelService } from '../../modules/channel.service';
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker.component';
import { EmojiService } from '../../modules/emoji.service';
import { Subscription, filter } from 'rxjs';
import { ReactionService } from '../../firestore-service/reaction.service';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [MatIconModule, CommonModule, OwnMessageComponent, EmojiPickerComponent],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent {
  @Input() message: any;
  @Input() previousMessageDate: string | null = null;
  @Input() close!: boolean;
  @Output() notifyThreadOpen: EventEmitter<void> = new EventEmitter();

  uid: string | null = null;
  channelId: string = '';
  answerCount: number = 0;
  lastAnswerTime: string | null = null;
  allReactions: boolean = false;
  reactionNames: string[] = [];
  fileType: string | null = null;
  fileURL: SafeResourceUrl | null = null;
  fileName: string | null = null;
  avatar: string | null = null;
  messageEdited: boolean = false;
  openNextWrapper: 'wrapper_1' | 'wrapper_2' | 'wrapper_3' = 'wrapper_1';
  toggleEmojiPicker: boolean = false;

  private sanitizer = inject(DomSanitizer);
  private emojiSubscription: Subscription | null = null;
  private messageSubscription: Subscription | null = null;
  private channelSubscription: Subscription | null = null;

  constructor(
    private chatService: ChatServiceService,
    private mainService: MainServiceService,
    private fileUploadService: FileUploadService,
    private authService: AuthService,
    private chatAreaService: ChatareaServiceService,
    private channelService: ChannelService,
    private emojiService: EmojiService,
    private reactionService: ReactionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.uid = this.authService.getUID();
    this.loadFileUpload();
    this.loadActiveChannelId();
    this.loadReactionNames();
    this.loadAvatar();
    this.channelService.openMessageMobile$.subscribe(state => {
      this.openNextWrapper = state;
    });
    this.channelSubscription = this.chatAreaService.getActiveChannel().subscribe(channel => {
      if (channel && channel.id) {
        this.channelId = channel.id;
        this.subscribeToMessageUpdates();
      }
    });
    this.subscribeToMessageUpdates();
  }

  ngOnDestroy() {
    if (this.emojiSubscription) {
      this.emojiSubscription.unsubscribe();
    }
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  private subscribeToMessageUpdates() {
    if (!this.channelId || !this.message.id) return;

    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    this.messageSubscription = this.chatAreaService.getMessageById(this.channelId, this.message.id).subscribe(updatedMessage => {
      this.message = updatedMessage;
      this.loadFileUpload();
      this.cdr.detectChanges();
    });
  }

  showEmojiPicker() {
    this.toggleEmojiPicker = !this.toggleEmojiPicker;
    if (this.toggleEmojiPicker) {
      this.emojiSubscription = this.emojiService.emoji$.pipe(filter((emoji: string) => emoji.trim() !== '')).subscribe((emoji: string) => {
        this.reactToMessage(this.message.id, emoji);
        this.toggleEmojiPicker = false;
      });
    } else {
      if (this.emojiSubscription) {
        this.emojiSubscription.unsubscribe();
        this.emojiSubscription = null;
      }
    }
  }

  loadAvatar() {
    const docId = this.message.senderId;
    this.chatAreaService.getUserAvatar(docId).subscribe(avatar => {
      this.avatar = avatar;
      this.cdr.detectChanges();
    });
  }

  async loadFileUpload() {
    if (this.message.fileName && this.message.fileUrl) {
      this.fileType = this.fileUploadService.getFileTypeFromFileName(this.message.fileName);
      this.fileName = this.message.fileName;
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.message.fileUrl);
      this.cdr.detectChanges();
    }
  }

  async loadReactionNames() {
    this.reactionNames = [];
    if (this.message.reactions && this.message.reactions.length > 0) {
      for (let reaction of this.message.reactions) {
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

  loadThreadDetails() {
    if (this.message && this.channelId) {
      this.chatService.getThreadDetails(this.channelId, this.message.id, (count, lastMessageTime) => {
        this.answerCount = count;
        this.lastAnswerTime = lastMessageTime ? this.mainService.formatTime(lastMessageTime) : null;
      });
    }
  }

  openThread(messageId: string) {
    this.chatService.setThreadDataFromMessage(this.uid!, this.channelId, messageId);
    // if (window. < 1350 && !this.close) {
    //   this.notifyThreadOpen.emit();
    // }
  }

  loadActiveChannelId() {
    this.chatAreaService.getActiveChannel().subscribe({
      next: (channel: any) => {
        this.channelId = channel.id;
        this.loadThreadDetails();
      },
    });
  }

  openReactions() {
    this.allReactions = !this.allReactions;
  }

  async reactToMessage(messageId: string, emoji: string) {
    if (!this.channelId) return;
    const hasReacted = this.hasUserReacted(emoji);
    await this.toggleReaction(messageId, emoji, hasReacted);
    await this.updateThreadsIfNecessary(messageId, emoji);
  }

  private async toggleReaction(messageId: string, emoji: string, hasReacted: boolean) {
    if (hasReacted) {
      await this.reactionService.removeReactionFromMessage(this.channelId!, messageId, emoji, this.uid!);
      this.updateLocalReactions(emoji, false);
    } else {
      await this.reactionService.addReactionToMessage(this.channelId!, messageId, emoji, this.uid!);
      this.updateLocalReactions(emoji, true);
    }
  }

  private hasUserReacted(emoji: string): boolean {
    return this.message.reactions?.some((reaction: any) => reaction.emoji === emoji && reaction.userId.includes(this.uid!));
  }

  private async updateThreadsIfNecessary(messageId: string, emoji: string) {
    if (await this.chatService.hasThreads(this.channelId!, messageId)) {
      const count = await this.chatService.getReactionCount(this.channelId!, messageId);
      await this.reactionService.updateReactionsInAllThreads(this.channelId!, messageId, emoji, this.uid!, count);
      if (await this.chatService.isThreadOpen(this.uid!)) {
        this.openThread(messageId);
      }
    }
  }

  updateLocalReactions(emoji: string, isAdding: boolean) {
    const reactions = this.message.reactions || [];
    const reactionIndex = reactions.findIndex((r: any) => r.emoji === emoji);

    if (reactionIndex !== -1) {
      this.modifyReactionUsers(reactions[reactionIndex], isAdding);
      if (reactions[reactionIndex].count === 0) reactions.splice(reactionIndex, 1);
    } else if (isAdding) {
      reactions.push({ emoji, userId: [this.uid!], count: 1 });
    }
    this.message.reactions = reactions;
    this.loadReactionNames();
    this.cdr.detectChanges();
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

  handleDialogMobile(val: 'wrapper_1' | 'wrapper_2' | 'wrapper_3') {
    this.channelService.emitOpenMessageMobile(val);
    if (window.innerWidth > 950) {
      this.channelService.emitOpenLeftMenu();
    }
  }
}
