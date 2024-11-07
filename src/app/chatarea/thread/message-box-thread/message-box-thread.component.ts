import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { ChatServiceService } from '../../../firestore-service/chat-service.service';
import { Message } from '../../../models/messages/channel-message.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FileUploadThreadService } from '../../../firestore-service/file-upload-thread.service';
import { User } from '../../../models/user/user.model';
import { ChatareaServiceService } from '../../../firestore-service/chatarea-service.service';
import { AuthService } from '../../../firestore-service/auth.service';
import { EmojiService } from '../../../modules/emoji.service';
import { EmojiPickerComponent } from '../../../shared/emoji-picker/emoji-picker.component';
import { Subject, Subscription, filter, takeUntil } from 'rxjs';

@Component({
  selector: 'app-message-box-thread',
  standalone: true,
  imports: [CommonModule, MatIcon, FormsModule, MatProgressBarModule, EmojiPickerComponent],
  templateUrl: './message-box-thread.component.html',
  styleUrl: './message-box-thread.component.scss',
})
export class MessageBoxThreadComponent {
  @ViewChild('addMember') addMember!: ElementRef;
  @ViewChild('emojiPicker', { read: ElementRef }) emojiPicker!: ElementRef;
  @Input() channelId: string = '';
  @Input() messageId: string = '';
  @Input() threadId: string = '';
  uid: string | null = null;
  content: string = '';
  selectedFile: File | null = null;
  fileURL: SafeResourceUrl | null = null;
  cleanUrl: string | null = null;
  fileName: string | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  fileType: string | null = null;
  users: User[] = [];
  memberIds: string[] = [];
  linkDialog: boolean = false;
  showUsers: boolean = false;
  showChannels: boolean = false;
  channels: any[] = [];
  toggleEmojiPicker: boolean = false;

  private uidSubscription: Subscription | null = null;
  private emojiSubscription: Subscription | null = null;
  private fileUploadService = inject(FileUploadThreadService);
  private emojiService = inject(EmojiService);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();

  @ViewChild('fileUploadThread') fileInputThreadElement!: ElementRef;
  @ViewChild('inputBox') inputBox!: ElementRef;

  constructor(private chatService: ChatServiceService, private cdr: ChangeDetectorRef, private fireService: ChatareaServiceService, private authService: AuthService) { }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.loadChannelMembers();
    this.loadChannels();
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
    const targetElement = event.target as HTMLElement;
    if (this.linkDialog && this.addMember) {
      const clickedInsideAddMember = this.addMember.nativeElement.contains(targetElement);
      const isMatIcon = targetElement.closest('mat-icon') !== null;
      if (!clickedInsideAddMember && !isMatIcon) {
        this.linkDialog = false;
        this.showUsers = false;
        this.showChannels = false;
      }
    }
    if (this.toggleEmojiPicker && this.emojiPicker) {
      const clickedInsideEmojiPicker = this.emojiPicker.nativeElement.contains(targetElement);
      if (!clickedInsideEmojiPicker) {
        this.toggleEmojiPicker = false;
        if (this.emojiSubscription) {
          this.emojiSubscription.unsubscribe();
          this.emojiSubscription = null;
        }
      }
    }
  }

  showEmojiPicker() {
    this.toggleEmojiPicker = !this.toggleEmojiPicker;
    if (this.toggleEmojiPicker) {
      this.emojiSubscription = this.emojiService.emoji$.pipe(filter((emoji: string) => emoji.trim() !== '')).subscribe((emoji: string) => {
        this.content = this.content ? this.content + emoji : emoji;
      });
    } else {
      if (this.emojiSubscription) {
        this.emojiSubscription.unsubscribe();
        this.emojiSubscription = null;
      }
    }
  }

  toggleLinkDialog() {
    if (this.linkDialog && this.showUsers) {
      this.linkDialog = false;
      this.showUsers = false;
    } else {
      this.linkDialog = true;
      this.showUsers = true;
      this.showChannels = false;
    }
  }

  loadChannelMembers() {
    this.fireService.getActiveChannel().subscribe((channel: any) => {
      this.memberIds = channel.member || [];
      this.loadUsers();
    });
  }

  loadUsers() {
    this.users = [];
    this.memberIds.forEach(memberId => {
      this.fireService.loadDocument('users', memberId).subscribe((user: any) => {
        const userInstance = new User({ ...user });
        this.users.push(userInstance);
      });
    });
  }

  deleteUploadedFile() {
    this.fileURL = null;
    this.fileName = null;
    this.fileType = null;
    this.selectedFile = null;
  }

  openFileDialog() {
    this.fileInputThreadElement.nativeElement.click();
  }

  ngAfterViewInit() {
    this.fileInputThreadElement.nativeElement.addEventListener('change', (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
          this.fileName = this.selectedFile!.name;
          this.fileType = this.fileUploadService.getFileTypeFromFileName(this.fileName);
        };
        reader.readAsDataURL(this.selectedFile);
      }
    });
    this.inputBox.nativeElement.addEventListener('keyup', (event: KeyboardEvent) => {
      this.checkForAtSymbol(event);
    });
    this.inputBox.nativeElement.focus();
  }

  clearFileUploadData() {
    this.content = '';
    this.fileURL = null;
    this.fileName = null;
    this.selectedFile = null;
    this.fileType = null;
    this.isUploading = false;

    if (this.fileInputThreadElement && this.fileInputThreadElement.nativeElement) {
      this.fileInputThreadElement.nativeElement.value = '';
    }
  }

  uploadFile(channelId: string, messageId: string, threadId: string, threadMessageId: string) {
    if (this.selectedFile) {
      this.isUploading = true;
      this.fileType = this.fileUploadService.getFileTypeFromFileName(this.selectedFile.name);
      this.fileUploadService
        .uploadFile(this.selectedFile, threadMessageId, progress => {
          this.uploadProgress = progress;
        })
        .then((result: { url: string; fileName: string }) => {
          this.cleanUrl = result.url;
          this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(result.url);
          this.fileName = result.fileName;
          this.fileUploadService.updateMessageFileUrl(channelId, messageId, threadId, threadMessageId, this.cleanUrl, this.fileName).then(() => {
            this.clearFileUploadData();
            this.cdr.detectChanges();
          });
        })
        .catch(error => {
          console.error('Fehler beim Hochladen der Datei:', error);
          this.isUploading = false;
        });
    }
  }

  async sendMessage() {
    if (this.content.trim() != '' || this.selectedFile) {
      const userName = await this.chatService.getUserNameByUid(this.uid!);
      const newMessage = new Message({
        content: this.content,
        name: userName,
        senderId: this.uid,
        time: new Date().toISOString(),
        reactions: [],
        fileUrl: null,
        fileName: null,
        messageEdit: false,
      });
      const latestMessageId = await this.chatService.addMessageToThread(this.channelId, this.messageId, this.threadId, newMessage);
      if (this.selectedFile) {
        this.uploadFile(this.channelId, this.messageId, this.threadId, latestMessageId);
      } else {
        this.clearFileUploadData();
      }
    } else {
      this.clearFileUploadData();
    }
  }

  loadChannels() {
    this.fireService.getAllChannels().subscribe(channels => {
      this.channels = channels;
    });
  }

  checkForAtSymbol(event: KeyboardEvent) {
    const textareaValue = (event.target as HTMLTextAreaElement).value;
    const lastChar = textareaValue.slice(-1);
    if (lastChar === '@') {
      this.linkDialog = true;
      this.showUsers = true;
      this.showChannels = false;
    } else if (lastChar === '#') {
      this.linkDialog = true;
      this.showUsers = false;
      this.showChannels = true;
    } else {
      this.linkDialog = false;
    }
  }

  addChannelToMessage(channelName: string) {
    this.content += `${channelName} `;
    this.linkDialog = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.inputBox) {
        this.inputBox.nativeElement.focus();
      }
    }, 0);
  }

  addMemberToMessage(name: string) {
    this.content += `${name} `;
    this.linkDialog = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.inputBox) {
        this.inputBox.nativeElement.focus();
      }
    }, 0);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
