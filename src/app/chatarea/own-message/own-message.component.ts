import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { ChatareaServiceService } from '../../firestore-service/chatarea-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { reactionList } from '../../models/reactions/reaction-list.model';
import { ChatServiceService } from '../../firestore-service/chat-service.service';
import { MainServiceService } from '../../firestore-service/main-service.service';
import { FileUploadService } from '../../firestore-service/file-upload.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../firestore-service/auth.service';
import { filter, Subject, Subscription } from 'rxjs';
import { EmojiService } from '../../modules/emoji.service';
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { ReactionService } from '../../firestore-service/reaction.service';
import { ChannelService } from '../../modules/channel.service';

@Component({
  selector: 'app-own-message',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatMenuModule, CommonModule, FormsModule, EmojiPickerComponent, PickerComponent, EmojiComponent],
  templateUrl: './own-message.component.html',
  styleUrl: './own-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OwnMessageComponent implements OnInit, OnDestroy {
  @Input() message: any;
  @Input() close!: boolean;
  @Output() notifyThreadOpen: EventEmitter<void> = new EventEmitter();
  @ViewChild('fileInputElement', { static: false }) fileInputElement!: ElementRef;
  isReactionBarVisible: { [messageId: string]: boolean } = {};
  private isMenuOpen: { [messageId: string]: boolean } = {};

  messages: any[] = [];
  reactions: any[] = [];
  allReactions: boolean = false;
  selectedReactionPath: string = '';
  previousMessageDate: string | null = null;
  uid: string | null = null;
  editMode: { [messageId: string]: boolean } = {};
  channelId: string = '';
  answerCount: number = 0;
  lastAnswerTime: string | null = null;
  reactionNames: string[] = [];
  fileType: string | null = null;
  fileURL: SafeResourceUrl | null = null;
  fileName: string | null = null;
  originalFileURL: SafeResourceUrl | null = null;
  originalFileType: string | null = null;
  originalFileName: string | null = null;
  avatar: string | null = null;
  messageEdited: boolean = false;
  toggleEmojiPicker: boolean = false;
  selectedFile: File | null = null;
  cleanUrl: string | null = null;

  private uidSubscription: Subscription | null = null;
  private emojiSubscription: Subscription | null = null;
  private messageSubscription: Subscription | null = null;
  private channelSubscription: Subscription | null = null;
  private channelService = inject(ChannelService);

  private fireService = inject(ChatareaServiceService);
  private emojiService = inject(EmojiService);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();

  constructor(
    private reactionService: ReactionService,
    private cdr: ChangeDetectorRef,
    private chatService: ChatServiceService,
    private mainService: MainServiceService,
    private fileUploadService: FileUploadService,
    private authService: AuthService
  ) {
    this.fireService.loadReactions();
  }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.channelSubscription = this.fireService.getActiveChannel().subscribe(channel => {
      if (channel && channel.id) {
        this.channelId = channel.id;
        this.subscribeToMessageUpdates();
      }
    });
    this.subscribeToMessageUpdates();
    this.loadActiveChannelMessages();
    this.renderReact();
    this.loadActiveChannelId();
    this.loadReactionNames();
    this.loadAvatar();
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
    if (this.channelSubscription) {
      this.channelSubscription.unsubscribe();
    }
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.fileName = this.selectedFile!.name;
        this.fileType = this.fileUploadService.getFileTypeFromFileName(this.fileName);
        this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  openFileDialog() {
    this.fileInputElement.nativeElement.click();
  }

  clearFileUpload() {
    this.fileURL = null;
    this.fileName = null;
    this.fileType = null;
    this.selectedFile = null;
  }

  uploadFile(messageId: string, channelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.selectedFile) {
        this.fileType = this.fileUploadService.getFileTypeFromFileName(this.selectedFile.name);
        this.fileUploadService
          .uploadFile(this.selectedFile, messageId, progress => { })
          .then((result: { url: string; fileName: string }) => {
            this.cleanUrl = result.url;
            this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(result.url);
            this.fileName = result.fileName;
            this.fileUploadService
              .updateMessageFileUrl(channelId, messageId, this.cleanUrl, this.fileName)
              .then(() => {
                this.clearFileUploadData();
                resolve();
              })
              .catch(reject);
          })
          .catch(reject);
      } else {
        resolve();
      }
    });
  }

  clearFileUploadData() {
    this.message.content = '';
    this.fileURL = null;
    //this.fileName = null;
    this.selectedFile = null;
    this.fileType = null;

    if (this.fileInputElement && this.fileInputElement.nativeElement) {
      this.fileInputElement.nativeElement.value = '';
    }
  }

  private subscribeToMessageUpdates() {
    if (!this.channelId || !this.message.id) return;
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    this.messageSubscription = this.fireService.getMessageById(this.channelId, this.message.id).subscribe(updatedMessage => {
      this.message = updatedMessage;
      this.loadFileUpload();
      this.cdr.markForCheck();
    });
  }

  deleteFileTemporarily() {
    this.originalFileURL = this.fileURL;
    this.originalFileType = this.fileType;
    this.originalFileName = this.fileName;
    this.fileURL = null;
    this.fileType = null;
    this.fileName = null;
    this.cdr.detectChanges();
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

  deleteMessage(messageId: string) {
    this.fireService.getActiveChannel().subscribe(channelData => {
      const channelId = channelData.id;
      this.fireService.deleteMessageWithSubcollections(channelId, messageId);
    });
  }

  loadAvatar() {
    const docId = this.message.senderId;
    this.fireService.getUserAvatar(docId).subscribe(avatar => {
      this.avatar = avatar;
    });
  }

  async loadFileUpload() {
    if (this.message.fileName && this.message.fileUrl) {
      this.fileType = this.fileUploadService.getFileTypeFromFileName(this.message.fileName);
      this.fileName = this.message.fileName;
      this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.message.fileUrl);
      this.cdr.markForCheck();
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
    this.lastAnswerTime = '';
    if (this.message && this.channelId) {
      this.chatService.getThreadDetails(this.channelId, this.message.id, (count, lastMessageTime) => {
        this.answerCount = count;
        this.lastAnswerTime = lastMessageTime ? this.mainService.formatTime(lastMessageTime) : null;
      });
    }
  }

  openThread(messageId: string) {
    this.chatService.setThreadDataFromMessage(this.uid!, this.channelId, messageId);
    // if (window.innerWidth > 970 && window.innerWidth < 1350 && !this.close) {
    //   this.notifyThreadOpen.emit();
    // }
  }

  handleDialogMobile(val: 'wrapper_1' | 'wrapper_2' | 'wrapper_3') {
    this.channelService.emitOpenMessageMobile(val);
    if (window.innerWidth > 950) {
      this.channelService.emitOpenLeftMenu();
    }
  }

  loadActiveChannelId() {
    this.fireService.getActiveChannel().subscribe({
      next: (channel: any) => {
        this.channelId = channel.id;
        this.loadThreadDetails();
      },
    });
  }

  openReactions() {
    this.allReactions = !this.allReactions;
  }

  onReactionClick(reactionName: string) {
    this.openReactions();
    const selectedReaction = reactionList.find(reaction => reaction.name === reactionName);
    if (selectedReaction) {
      this.selectedReactionPath = selectedReaction.path;
    }
  }

  async renderReact() {
    this.reactions = await this.fireService.loadReactions();
  }

  async reactToMessage(messageId: string, emoji: string) {
    if (!this.channelId) return;
    const hasReacted = this.hasUserReacted(emoji);
    await this.toggleReaction(messageId, emoji, hasReacted);
    await this.updateThreadsIfNecessary(messageId);
  }

  private hasUserReacted(emoji: string): boolean {
    return this.message.reactions?.some((reaction: any) => reaction.emoji === emoji && reaction.userId.includes(this.uid!));
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

  private async updateThreadsIfNecessary(messageId: string) {
    if (!this.channelId || !messageId) return;
    if (await this.chatService.hasThreads(this.channelId, messageId)) {
      const updatedMessage = await this.fireService.getMessageByIdOnce(this.channelId, messageId);
      await this.chatService.updateMessageInAllThreads(this.channelId, messageId, updatedMessage);
      if (await this.chatService.isThreadOpen(this.uid!)) {
        this.openThread(messageId);
      }
    }
  }

  editMessage(messageId: string) {
    this.editMode[messageId] = true;
  }

  cancelEdit(messageId: string) {
    this.editMode[messageId] = false;
    this.fileURL = this.originalFileURL;
    this.fileType = this.originalFileType;
    this.fileName = this.originalFileName;
  }

  isEditingMessage(messageId: string): boolean {
    return this.editMode[messageId] || false;
  }

  async saveEditMessage(message: any) {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    if (this.selectedFile && this.fileURL) {
      await this.uploadFile(message.id, this.channelId);
      await this.updateMessageContent(message);
    } else {
      this.cleanUrl = null;
      await this.updateMessageContent(message);
    }
    await this.updateThreadsIfNecessary(message.id);
  }


  private updateMessageContent(message: any) {
    this.fireService
      .updateMessage(message.id, {
        content: message.content,
        fileUrl: this.cleanUrl,
        fileName: this.fileName,
        messageEdit: true,
      })
      .subscribe({
        next: () => {
          this.editMode[message.id] = false;
          this.messageEdited = true;
          this.cdr.detectChanges();
          this.subscribeToMessageUpdates();
        },
      });
  }

  loadActiveChannelMessages() {
    this.fireService.getActiveChannel().subscribe({
      next: (channel: any) => {
        const channelId = channel.id;
        this.loadMessages(channelId);
      },
    });
  }

  loadMessages(channelId: string) {
    this.previousMessageDate = null;
    this.fireService.loadMessages(channelId).subscribe(messages => {
      this.messages = messages.filter(message => message.isOwnMessage).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      this.cdr.detectChanges();
    });
  }

  shouldShowDivider(currentMessageTime: string, index: number): boolean {
    const currentMessageDate = new Date(currentMessageTime).toLocaleDateString();
    if (index === 0 || this.previousMessageDate !== currentMessageDate) {
      this.previousMessageDate = currentMessageDate;
      return true;
    }
    return false;
  }

  formatTime(timeString: string): string {
    return this.mainService.formatTime(timeString);
  }

  formatDate(dateString: string): string {
    return this.mainService.formatDate(dateString);
  }

  onMenuOpened(messageId: string) {
    setTimeout(() => {
      this.isMenuOpen[messageId] = true;
      this.isReactionBarVisible[messageId] = true;
    });
  }

  onMenuClosed(messageId: string) {
    setTimeout(() => {
      this.isMenuOpen[messageId] = false;
      this.isReactionBarVisible[messageId] = false;
    });
  }

  onMessageHover(messageId: string, isHovering: boolean) {
    if (!this.isMenuOpen[messageId]) {
      this.isReactionBarVisible[messageId] = isHovering;
    }
  }
}
