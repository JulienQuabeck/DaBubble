import { Message, User } from './../../modules/database.model';
import { Component, AfterViewInit, ElementRef, inject, OnInit, ViewChild, DoCheck, Renderer2, AfterViewChecked, SimpleChanges, Input } from '@angular/core';
import { MiddleWrapperComponent } from '../../shared/middle-wrapper/middle-wrapper.component';
import { FirestoreModule, Firestore } from '@angular/fire/firestore';
import { FirebaseAppModule } from '@angular/fire/app';
import { DatabaseServiceService } from '../../database-service.service';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeftSideMenuComponent } from '../left-side-menu/left-side-menu.component';
import { UserService } from '../../modules/user.service';
import { ShowProfilService } from '../../modules/show-profil.service';
import { ChannelService } from '../../modules/channel.service';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { EmojiPickerComponent } from '../../shared/emoji-picker/emoji-picker.component';
import { EmojiService } from '../../modules/emoji.service';
import { SearchUserComponent } from '../search-user/search-user.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../../firestore-service/auth.service';
import { FileUploadService } from '../../firestore-service/file-upload.service';
import { Storage } from '@angular/fire/storage';
import { NavService } from '../../modules/nav.service';
import { UpdateProfilService } from '../../modules/update-profil.service';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    MatIconModule,
    MiddleWrapperComponent,
    CommonModule,
    FormsModule,
    FirestoreModule,
    FirebaseAppModule,
    LeftSideMenuComponent,
    PickerModule,
    EmojiPickerComponent,
    SearchUserComponent,
    MatProgressBarModule,
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
})
export class MessagesComponent implements OnInit, AfterViewInit {
  message_content = '';
  chatMessages: Message[] = [];
  toUserId: string = '';
  toChannelId: string = '';
  chat: Message[] = [];
  channelChat: Message[] = [];
  groupedChat: any;
  userByIdMap: { [userId: string]: any } = {};
  autoFocusSendMessage: boolean = false;
  today!: string;
  open_show_profile!: boolean;
  selectedUser: User = new User();
  show_delete_msg!: number;
  update_message: string = '';
  clearFile: boolean = false;
  update_FileUrl: string | null = '';
  update_FileName: string | null = '';
  is_update_msg: boolean = false;
  update_group!: number;
  update_chat!: number;
  update_title = formatDate(new Date(), 'EEEE, dd MMMM y HH:MM', 'de-DE');
  is_response: boolean = false;
  toggleEmojiPicker: boolean = false;
  showSearchUserName: boolean = false;
  excludeClick = false;
  chosenEmoji: string = '';
  pickedUserArray: string[] = [];
  chosenReaction: string = '';
  isMainEmoji: boolean = true;
  messageId: string = '';
  fileURL: SafeResourceUrl | null = null;
  messageFileURL: SafeResourceUrl | null = null;
  fileType: string | null = null;
  messageFileType: string | null = null;
  fileName: string | null = null;
  messageFileName: string | null = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  authenticatedUser: User | undefined;
  cleanUrl: string | null = null;
  open_update_profil: boolean = false;
  state: boolean = false;
  memoFileUploader: boolean = false;

  private uidSubscription: Subscription | null = null;
  private fileUploadService = inject(FileUploadService);
  private sanitizer = inject(DomSanitizer);
  @Input() changeDetect!: any;
  @ViewChild('fileUpload') fileInputElement!: ElementRef;
  @ViewChild('focusMsg') myTextarea!: ElementRef;
  @ViewChild('updateArea') updateArea!: ElementRef;
  constructor(
    private navService: NavService,
    private updateProfilService: UpdateProfilService,
    private channelService: ChannelService,
    private elementRef: ElementRef,
    private showProfileService: ShowProfilService,
    private userService: UserService,
    private databaseService: DatabaseServiceService,
    private emojiService: EmojiService,
    private authService: AuthService,
    private renderer: Renderer2,
    private firestore: Firestore,
    private storage: Storage
  ) {
    this.databaseService.messages$.subscribe(state => {
      this.chatMessages = state;
    });
    this.showProfileService.open_show_profile$.subscribe(state => {
      this.open_show_profile = state;
    });
  }

  ngOnInit(): void {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.authenticatedUser = user;
        });
    });

    this.navService.state$.subscribe(state => {
      this.state = state;
    });
    this.updateProfilService.open_update_profil$.subscribe(state => {
      this.open_update_profil = state;
    });

    this.userService.userIds$.subscribe(userId => {
      this.toUserId = userId;

      if (this.toUserId !== this.changeDetect) {
        this.changeDetect = this.toUserId;
        this.myTextarea?.nativeElement.focus();
      }
    });

    this.userService.chatMessages$.subscribe(msg => {
      this.today = formatDate(new Date(), 'EEEE, dd MMMM y', 'de-DE');
      this.chat = msg.sort((a, b) => b.send_date - a.send_date);
      this.groupedChat = this.groupMessagesByDate(this.chat);
      this.loadChatData(this.groupedChat, this.toUserId);
      this.message_content = '';
    });

    this.databaseService.filteredMessages$.subscribe(messages => {
      this.chatMessages = messages;
    });

    /**
     * subscribe to selectedUser$ for the selected user object
     */
    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
      this.onCancelUpdateMsg();
    });

    this.userService.selectedMessageId$.subscribe(id => {
      this.messageId = id;
    });

    /**
     * this method add the selected emoji to the current tipped message
     */
    this.emojiService.emoji$.subscribe((emoji: string) => {
      this.chosenReaction = emoji;

      if (this.update_chat != undefined && this.update_chat !== -1) {
        this.update_message = this.update_message ? this.update_message + emoji : emoji;
      } else if (this.isMainEmoji) {
        this.message_content = this.message_content ? this.message_content + emoji : emoji;
      } else if (!this.isMainEmoji) {
        this.onAddReaction(this.messageId);
      }
    });

    /**
     * this method manage the state of emoji picker. If the  user picks an emoji it handles the
     * closing of the picker
     */
    this.emojiService.toggle_emoji_picker$.subscribe(statePicker => {
      this.toggleEmojiPicker = statePicker;
    });

    this.userService.toggle_show_search_user$.subscribe(state => {
      this.showSearchUserName = state;
    });

    this.userService.clickedInsideButton$.subscribe(isClicked => {
      this.excludeClick = isClicked;
    });

    this.userService.pickedUser$.subscribe(user => {
      if (this.message_content[this.message_content.length - 1] === '@') {
        this.message_content = this.message_content ? this.message_content + `${user.name} ` : `${user.name} `;
      } else {
        this.message_content = this.message_content ? this.message_content + ` @${user.name} ` : ` @${user.name} `;
      }
    });

    this.channelService.userPicked$.subscribe(users => {
      this.pickedUserArray = users;
    });

    this.showProfileService.auto_focus$.subscribe(focus => {
      this.autoFocusSendMessage = focus;
    });
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  /**
   *Fetch user data for all unique user IDs and cache them for
   * performance improvement
   * @param {array} messages -  array of message
   */
  prefetchUsers(messages: any[], toUserId: string) {
    const uniqueUserIds = new Set<string>();

    messages.forEach(message => {
      if (message.from_user && !this.userByIdMap[message.from_user]) {
        uniqueUserIds.add(message.from_user);
      }
    });

    if (toUserId && !this.userByIdMap[toUserId]) {
      uniqueUserIds.add(toUserId);
    }
    uniqueUserIds.forEach(userId => {
      this.databaseService.getUserById(userId, user => {
        if (user) {
          this.userByIdMap[userId] = user;
        }
      });
    });
  }

  loadChatData(chatGroups: any[], toUserId: string) {
    const allMessages = chatGroups.reduce((acc, group) => [...acc, ...group.messages], []);
    this.prefetchUsers(allMessages, toUserId);
  }

  getCachedUser(userId: string) {
    return this.userByIdMap[userId];
  }

  getAllUsers() {
    return this.databaseService.users;
  }
  getAllMessages() {
    return this.databaseService.messages;
  }

  onAddMessage(to_user_id: string) {
    if (this.pickedUserArray.length != 0) {
      if (!this.pickedUserArray.includes(to_user_id)) {
        this.pickedUserArray.push(to_user_id);
      }
      this.pickedUserArray.forEach(userId => {
        let msgVal = this.messageSender(userId);
        this.databaseService.addMessage(msgVal);
      });
    } else {
      let msgObject = this.messageSender(to_user_id);
      this.databaseService.addMessage(msgObject).then(id => {
        if (this.selectedFile) {
          this.memoFileUploader = false;
          this.uploadFile(id!);
        }
      });
    }
    this.message_content = '';
  }

  messageSender(receiverId: string): object {
    let msg = {
      message_content: this.message_content,
      from_user: this.authenticatedUser?.id,
      to_user: receiverId,
    };
    let newMessage = new Message(msg);

    return newMessage.toObject();
  }

  groupMessagesByDate(messages: any[]) {
    const groupedMessages: { [key: string]: any[] } = {};

    messages.forEach(message => {
      const messageDate = this.checkDateIfToday(new Date(message.send_date));

      if (!groupedMessages[messageDate]) {
        groupedMessages[messageDate] = [];
      }
      groupedMessages[messageDate].push(message);
    });

    return Object.entries(groupedMessages).map(([date, msgs]) => ({ date, messages: msgs.sort((a, b) => a.send_date - b.send_date) }));
  }

  checkDateIfToday(date: Date) {
    const formattedDate = formatDate(date, 'EEEE, dd MMMM yyyy', 'de-DE');
    return formattedDate === this.today ? 'heute' : formattedDate;
  }

  setTimeFormat(date: Date) {
    return formatDate(date, 'HH:mm', 'en-US');
  }

  onOpenShowProfile() {
    this.showProfileService.updateProfile();
  }

  sendSelectedUser(user: User) {
    this.userService.emitSelectedUser(user);
  }

  sendSelectedMsgId(id: string) {
    this.userService.emitSelectedMessageId(id);
    this.isMainEmoji = false;
  }

  onShowDeleteDialog(index: number) {
    if (this.show_delete_msg === index) {
      this.show_delete_msg = -1;
    } else {
      this.show_delete_msg = index;
    }
  }

  onDeleteMessage(msgId: string) {
    this.databaseService.deleteDocument('messages', 'message_id', msgId);
    this.show_delete_msg = -1;
  }

  onUpdateMessage(msgContent: string, fileUrl: any, fileName: any, index_chat: number, index_group: number) {
    this.update_chat = index_chat;
    this.update_group = index_group;
    this.update_message = msgContent;
    this.update_FileUrl = fileUrl;
    this.update_FileName = fileName;
    this.show_delete_msg = -1;
  }

  handleUpdateMsg(currentMsgId: string) {
    if (this.selectedFile) {
      this.channelService.updateChannelData('messages', 'message_id', currentMsgId, { message_content: this.update_message }).then(() => {
        this.channelService.getDocumentIdById('messages', 'message_id', currentMsgId).then(id => {
          this.memoFileUploader = true;
          this.uploadFile(id!);
        });
        this.channelService.updateChannelData('messages', 'message_id', currentMsgId, { is_updated: true });
      });
    } else {
      this.channelService
        .updateChannelData('messages', 'message_id', currentMsgId, { message_content: this.update_message, fileUrl: this.update_FileUrl, fileName: this.update_FileName })
        .then(() => {
          this.channelService.updateChannelData('messages', 'message_id', currentMsgId, { is_updated: true });
        });
    }

    this.update_message = '';
    this.onCancelUpdateMsg();

    this.clearFile = false;
  }

  loadFileUpload(msg: Message) {
    if (msg.fileName) {
      this.messageFileType = this.fileUploadService.getFileTypeFromFileName(msg.fileName);
      this.messageFileName = msg.fileName;
      this.messageFileURL = this.sanitizer.bypassSecurityTrustResourceUrl(msg.fileUrl);
    } else {
      this.messageFileType = null;
      this.messageFileURL = null;
    }
  }

  updateFile(msg: Message) {
    if (msg.fileName) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(msg.fileUrl);
    } else {
      return;
    }
  }

  onCancelUpdateMsg() {
    this.update_group = -1;
    this.update_chat = -1;
    this.is_response = false;
    this.fileURL = null;
  }

  onRespond(index_chat: number, index_group: number) {
    this.is_response = true;
    this.update_chat = index_chat;
    this.update_group = index_group;
    this.show_delete_msg = -1;
  }

  handleResponse(currentMsg: Message) {
    let msg = {
      message_content: this.update_message,
      response_content: currentMsg?.message_content,
      from_user_origin: currentMsg?.from_user,
      from_user: this.authenticatedUser?.id,
      to_user: currentMsg?.to_user === this.authenticatedUser?.id ? currentMsg?.from_user : currentMsg?.to_user,
    };

    let newMessage = new Message(msg);

    let msgObject = newMessage.toObject();

    this.databaseService.addMessage(msgObject);
    this.update_message = '';
    this.onCancelUpdateMsg();
  }

  onShowEmojiPicker() {
    this.emojiService.handleShowPicker();
    this.showSearchUserName ? this.userService.emitShowSearchUser(!this.showSearchUserName) : '';
  }

  sendShowSearchUser() {
    this.userService.emitShowSearchUser(!this.showSearchUserName);
    this.toggleEmojiPicker ? this.emojiService.handleShowPicker() : '';
  }

  onButtonClick() {
    this.isMainEmoji = true;
    this.userService.setClickedInsideButton(true);
  }

  onAddReaction(message_id: string) {
    this.channelService.updateChannelData('messages', 'message_id', message_id, { reaction: this.chosenReaction });
  }

  onAddEmoji(message_id: string, name: string) {
    this.channelService.updateChannelData('messages', 'message_id', message_id, { reaction: name });
  }

  onAddThreadMsg(event: Event) {
    if (!this.message_content && this.showSearchUserName) {
      this.userService.emitShowSearchUser(false);
    }
    const inputElement = event.target as HTMLInputElement;
    const enteredText = inputElement.selectionStart;
    if (enteredText !== null) {
      const currentChar = this.message_content[enteredText - 1];
      if (currentChar === '@') {
        this.sendShowSearchUser();
      }
    }
  }

  clearFileUpload() {
    this.fileURL = null;
    this.fileName = null;
    this.fileType = null;
    this.selectedFile = null;
  }
  clearUpdateFile() {
    this.update_FileUrl = null;
    this.update_FileName = null;
    this.clearFile = true;
    this.messageFileURL = null;
    this.fileName = null;
    this.messageFileType = null;
  }

  openFileDialog() {
    this.fileInputElement?.nativeElement.click();
  }

  keepFocus() {
    this.myTextarea?.nativeElement.focus();
  }

  keepUpdateFocus() {
    this.updateArea?.nativeElement.focus();
  }

  ngAfterViewInit() {
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
    this.myTextarea?.nativeElement.focus();
  }

  uploadFile(msg_id: string) {
    if (this.selectedFile) {
      this.isUploading = true;
      this.fileType = this.fileUploadService.getFileTypeFromFileName(this.selectedFile.name);
      this.fileUploadService
        .uploadFile(this.selectedFile, msg_id, progress => {
          this.uploadProgress = progress;
        })
        .then((result: { url: string; fileName: string }) => {
          this.cleanUrl = result.url;
          this.fileURL = this.sanitizer.bypassSecurityTrustResourceUrl(result.url);
          this.fileName = result.fileName;
          this.fileUploadService.updateMessageFileUrlDirectMsg(msg_id, this.cleanUrl, this.fileName).then(() => {
            this.message_content = '';
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
    } else {
      console.log('Error');
    }
  }

  onDeleteEmoji(message_id: string) {
    this.channelService.updateChannelData('messages', 'message_id', message_id, { reaction: '' });
  }
}
