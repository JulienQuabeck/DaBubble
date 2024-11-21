import { AfterViewInit, ChangeDetectorRef, Component, DoCheck, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChatareaServiceService } from '../../firestore-service/chatarea-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadService } from '../../firestore-service/file-upload.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { User } from '../../models/user/user.model';
import { MainServiceService } from '../../firestore-service/main-service.service';
import { AuthService } from '../../firestore-service/auth.service';
import { Subject, Subscription, filter } from 'rxjs';
import { EmojiService } from '../../modules/emoji.service';
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiComponent } from '@ctrl/ngx-emoji-mart/ngx-emoji';

@Component({
  selector: 'app-message-box',
  standalone: true,
  imports: [MatIconModule, CommonModule, FormsModule, MatProgressBarModule, EmojiPickerComponent, PickerComponent, EmojiComponent],
  templateUrl: './message-box.component.html',
  styleUrl: './message-box.component.scss',
})
export class MessageBoxComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('addMember') addMember!: ElementRef;
  @ViewChild('emojiPicker', { read: ElementRef }) emojiPicker!: ElementRef;

  uid: string | null = null;
  messageContent: string = '';
  channelName: string = '';
  selectedFile: File | null = null;
  fileURL: SafeResourceUrl | null = null;
  cleanUrl: string | null = null;
  tempFilePath: string | null = null;
  fileName: string | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  fileType: string | null = null;
  users: User[] = [];
  memberIds: string[] = [];
  linkDialog: boolean = false;
  linkedUsers: string[] = [];
  toggleEmojiPicker: boolean = false;
  private emojiSubscription: Subscription | null = null;
  private fireService = inject(ChatareaServiceService);
  private fileUploadService = inject(FileUploadService);
  private emojiService = inject(EmojiService);
  private sanitizer = inject(DomSanitizer);

  private uidSubscription: Subscription | null = null;
  private destroy$ = new Subject<void>();

  @ViewChild('fileUpload') fileInputElement!: ElementRef;
  @ViewChild('messageTextArea') messageTextArea!: ElementRef;

  constructor(private cdr: ChangeDetectorRef, private mainService: MainServiceService, private authService: AuthService, private emojiRef: ElementRef) {}

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.loadActiveChannelName();
    this.loadChannelMembers();
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
        this.messageContent = this.messageContent ? this.messageContent + emoji : emoji;
      });
    } else {
      if (this.emojiSubscription) {
        this.emojiSubscription.unsubscribe();
        this.emojiSubscription = null;
      }
    }
  }

  checkForAtSymbol(event: KeyboardEvent) {
    const textareaValue = (event.target as HTMLTextAreaElement).value;
    const lastChar = textareaValue.slice(-1);
    if (lastChar != '@') {
      this.linkDialog = false;
    } else {
      this.linkDialog = true;
    }
  }

  toggleLinkDialog() {
    this.linkDialog = !this.linkDialog;
  }

  addMemberToMessage(name: string, userId: string) {
    this.messageContent += `@${name} `;
    this.linkedUsers.push(userId);
    this.toggleLinkDialog();
    this.cdr.detectChanges();
    setTimeout(() => {
      if (this.messageTextArea) {
        this.messageTextArea.nativeElement.focus();
      }
    }, 0);
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

  clearFileUpload() {
    this.fileURL = null;
    this.fileName = null;
    this.fileType = null;
    this.selectedFile = null;
  }

  openFileDialog() {
    this.fileInputElement.nativeElement.click();
  }

  ngAfterViewInit() {
    this.messageTextArea.nativeElement.focus();
    this.fileInputElement.nativeElement.addEventListener('change', (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];

        const reader = new FileReader();
        reader.onload = () => {
          this.fileURL = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
          this.fileName = this.selectedFile!.name;
          this.fileType = this.fileUploadService.getFileTypeFromFileName(this.fileName);
        };
        reader.readAsDataURL(this.selectedFile);
      }
    });

    this.messageTextArea.nativeElement.addEventListener('keyup', (event: KeyboardEvent) => {
      this.checkForAtSymbol(event);
    });
  }

  uploadFile(messageId: string, channelId: string) {
    if (this.selectedFile) {
      this.isUploading = true;
      this.fileType = this.fileUploadService.getFileTypeFromFileName(this.selectedFile.name);
      this.fileUploadService
        .uploadFile(this.selectedFile, messageId, progress => {
          this.uploadProgress = progress;
        })
        .then((result: { url: string; fileName: string }) => {
          this.cleanUrl = result.url;
          this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(result.url);
          this.fileName = result.fileName;
          this.fileUploadService.updateMessageFileUrl(channelId, messageId, this.cleanUrl, this.fileName).then(() => {
            this.messageContent = '';
            this.fileURL = null;
            this.fileName = null;
            this.isUploading = false;
          });
        })
        .catch(error => {
          console.error('Fehler beim Hochladen der Datei:', error);
          this.isUploading = false;
        });
      this.selectedFile = null;
    }
  }

  sendMessage() {
    if (this.messageContent.trim() === '' && !this.selectedFile) return;
    this.fireService.loadDocument('users', this.uid!).subscribe({
      next: (user: any) => {
        const userName = `${user.name}`;
        this.fireService.getActiveChannel().subscribe({
          next: (channel: any) => {
            const messageData = {
              content: this.messageContent,
              name: userName,
              time: new Date().toISOString(),
              reactions: [],
              senderId: this.uid,
              fileUrl: null,
              fileName: null,
              messageEdit: false,
            };
            this.fireService.addMessage(channel.id, messageData).then(docRef => {
              const messageId = docRef!.id;
              this.messageContent = '';
              if (this.selectedFile) {
                this.uploadFile(messageId, channel.id);
              }
            });
          },
        });
      },
    });
  }

  async loadActiveChannelName() {
    this.fireService.getActiveChannel().subscribe((channel: any) => {
      const channelId = channel.id;
      this.fireService.loadDocument('channels', channelId).subscribe((channelDoc: any) => {
        const channelData = channelDoc;
        this.channelName = channelData.name;
      });
    });
  }
}
