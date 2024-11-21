import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
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
import { UserService } from '../../modules/user.service';
import { Channel, ChannelMember } from '../../modules/database.model';
import { ChannelService } from '../../modules/channel.service';
import { CurrentUserService } from '../../modules/current-user.service';

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
  showUsers: boolean = false;
  showChannels: boolean = false;
  channels: any[] = [];
  linkedUsers: string[] = [];
  toggleEmojiPicker: boolean = false;
  currentChannel!: Channel;
  ChannelMembers: ChannelMember[] = [];
  guest!: string;
  searchTerm: string = '';
  filteredUsers: User[] = [];
  filteredChannels: any[] = [];
  private emojiSubscription: Subscription | null = null;
  private fireService = inject(ChatareaServiceService);
  private fileUploadService = inject(FileUploadService);
  private emojiService = inject(EmojiService);
  private sanitizer = inject(DomSanitizer);

  private uidSubscription: Subscription | null = null;
  private channelsSubscription: Subscription | null = null;
  private activeChannelSubscription: Subscription | null = null;
  private userSubscriptions: Subscription[] = [];
  private destroy$ = new Subject<void>();

  @ViewChild('fileUpload') fileInputElement!: ElementRef;
  @ViewChild('messageTextArea') messageTextArea!: ElementRef;

  constructor(
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    private authService: AuthService,
    private channelService: ChannelService,
    private currentGuest: CurrentUserService
  ) { }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });

    this.userService.channel$.subscribe(channel => {
      this.currentChannel = channel;
    });

    this.channelService.channelMembers$.subscribe(members => {
      this.ChannelMembers = members;
    });

    this.currentGuest.onlineUser$.subscribe(user => {
      this.guest = user?.id;
    });

    this.loadActiveChannelName();
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
    if (this.channelsSubscription) {
      this.channelsSubscription.unsubscribe();
    }
    if (this.activeChannelSubscription) {
      this.activeChannelSubscription.unsubscribe();
    }
    this.unsubscribeFromUsers();
  }

  focusTextArea() {
    this.messageTextArea?.nativeElement.focus();
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

  checkForAtSymbol(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    const cursorPos = textarea.selectionStart || 0;
    const text = textarea.value.substring(0, cursorPos);
    const words = text.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@')) {
      this.linkDialog = true;
      this.showUsers = true;
      this.showChannels = false;
      this.searchTerm = currentWord.substring(1);
      this.filteredUsers = this.users.filter(u => u.name.toLowerCase().startsWith(this.searchTerm.toLowerCase()));
    } else if (currentWord.startsWith('#')) {
      this.linkDialog = true;
      this.showUsers = false;
      this.showChannels = true;
      this.searchTerm = currentWord.substring(1);
      this.filteredChannels = this.channels.filter(c => c.channel_name.toLowerCase().startsWith(this.searchTerm.toLowerCase()));
    } else {
      this.linkDialog = false;
      this.filteredUsers = [];
      this.filteredChannels = [];
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
      this.searchTerm = this.messageContent.split(' ').pop()?.substring(1) || '';
      this.filteredUsers = this.users.filter(u => u.name.toLowerCase().startsWith(this.searchTerm.toLowerCase()));
    }
  }

  addMemberToMessage(name: string) {
    this.replaceCurrentWordWith(`@${name} `);
    this.linkDialog = false;
    this.cdr.detectChanges();
    setTimeout(() => this.focusTextArea(), 0);
  }

  addChannelToMessage(name: string) {
    this.replaceCurrentWordWith(`#${name} `);
    this.linkDialog = false;
    this.cdr.detectChanges();
    setTimeout(() => this.focusTextArea(), 0);
  }

  replaceCurrentWordWith(replacement: string) {
    const textarea = this.messageTextArea.nativeElement;
    const cursorPos = textarea.selectionStart || 0;
    const text = textarea.value;
    const wordStart = text.lastIndexOf(' ', cursorPos - 1) + 1;
    const newText = text.substring(0, wordStart) + replacement + text.substring(cursorPos);
    this.messageContent = newText;
    const newCursorPos = wordStart + replacement.length;
    this.cdr.detectChanges();
    setTimeout(() => {
      textarea.selectionStart = newCursorPos;
      textarea.selectionEnd = newCursorPos;
    }, 0);
  }

  loadChannelMembers() {
    this.activeChannelSubscription = this.fireService.getActiveChannel().subscribe((channel: any) => {
      const newMemberIds = channel.member || [];
      if (!this.arraysEqual(this.memberIds, newMemberIds)) {
        this.memberIds = newMemberIds;
        this.loadUsers();
      }
    });
  }

  isCurrentUserMember(): boolean {
    let members = this.ChannelMembers.map(member => member?.member_id);
    const ch = members.includes(this.uid ? this.uid : 'Unknown');
    const ch_guest = members.includes(this.guest ? this.guest : 'Unknown');
    const is_member = this.uid != null && this.memberIds != null && this.memberIds.includes(this.uid);
    return ch || is_member || ch_guest;
  }

  loadUsers() {
    this.unsubscribeFromUsers();
    this.users = [];
    this.memberIds.forEach(memberId => {
      const userSubscription = this.fireService.loadDocument('users', memberId).subscribe((user: any) => {
        const userInstance = new User({ ...user });
        const index = this.users.findIndex(u => u.id === userInstance.id);
        if (index !== -1) {
          this.users[index] = userInstance;
        } else {
          this.users.push(userInstance);
        }
        this.cdr.detectChanges();
      });
      this.userSubscriptions.push(userSubscription);
    });
  }

  unsubscribeFromUsers() {
    this.userSubscriptions.forEach(sub => sub.unsubscribe());
    this.userSubscriptions = [];
  }

  arraysEqual(a: any[], b: any[]): boolean {
    return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
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
    this.fileInputElement.nativeElement.addEventListener('change', (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files.length > 0) {
        this.selectedFile = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          this.fileName = this.selectedFile!.name;
          this.fileType = this.fileUploadService.getFileTypeFromFileName(this.fileName);
          this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(reader.result as string);
        };
        reader.readAsDataURL(this.selectedFile);
      }
    });
    this.messageTextArea.nativeElement.addEventListener('keyup', (event: KeyboardEvent) => {
      this.checkForAtSymbol(event);
    });
    this.messageTextArea.nativeElement.focus();
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
            this.clearFileUploadData();
          });
        })
        .catch(error => {
          this.isUploading = false;
        });
      setTimeout(() => {
        this.isUploading = false;
      }, 2000);
    }
  }

  clearFileUploadData() {
    this.messageContent = '';
    this.fileURL = null;
    this.fileName = null;
    this.selectedFile = null;
    this.fileType = null;
    this.isUploading = false;

    if (this.fileInputElement && this.fileInputElement.nativeElement) {
      this.fileInputElement.nativeElement.value = '';
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
              fileName: this.selectedFile ? this.selectedFile.name : null,
              messageEdit: false,
            };
            this.fireService.addMessage(channel.id, messageData).then(docRef => {
              if (docRef) {
                const messageId = docRef.id;
                this.messageContent = '';
                if (this.selectedFile) {
                  this.uploadFile(messageId, channel.id);
                  this.clearFileUpload();
                  this.selectedFile = null;
                }
              } else {
              }
            });
          },
        });
      },
    });
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  async loadActiveChannelName() {
    this.fireService.getActiveChannel().subscribe((channel: any) => {
      const channelId = channel.id;
      this.fireService.loadDocument('channels', channelId).subscribe((channelDoc: any) => {
        const channelData = channelDoc;
        this.channelName = channelData.channel_name;
      });
    });
  }

  loadChannels() {
    this.channelsSubscription = this.fireService.getAllChannels().subscribe(channels => {
      this.channels = channels;
      this.cdr.detectChanges();
    });
  }
}
