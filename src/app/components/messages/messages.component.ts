import { Message, User } from './../../modules/database.model';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MiddleWrapperComponent } from '../../shared/middle-wrapper/middle-wrapper.component';
import { FirestoreModule } from '@angular/fire/firestore';
import { FirebaseAppModule } from '@angular/fire/app';
import { DatabaseServiceService } from '../../database-service.service';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeftSideMenuComponent } from '../left-side-menu/left-side-menu.component';
import { UserService } from '../../modules/user.service';
import { ShowProfilService } from '../../modules/show-profil.service';
import { ChannelService } from '../../modules/channel.service';
@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [MiddleWrapperComponent, CommonModule, FormsModule, FirestoreModule, FirebaseAppModule, LeftSideMenuComponent],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MessagesComponent implements OnInit {
  message_content = '';
  chatMessages: Message[] = [];
  toUserId: string = '';
  toChannelId: string = '';
  chat: Message[] = [];
  channelChat: Message[] = [];
  groupedChat: any;
  userByIdMap: { [userId: string]: any } = {};
  authenticatedUser: User | undefined;
  today!: string;
  open_show_profile!: boolean;
  selectedUser: User = new User();
  show_delete_msg!: number;
  showEmojiPicker = false;
  update_message: string = '';
  is_update_msg: boolean = false;
  update_point!: number;

  constructor(
    private channelService: ChannelService,
    private showProfileService: ShowProfilService,
    private userService: UserService,
    private databaseService: DatabaseServiceService
  ) {
    this.databaseService.messages$.subscribe(state => {
      this.chatMessages = state;
    });
    this.showProfileService.open_show_profile$.subscribe(state => {
      this.open_show_profile = state;
    });
  }

  ngOnInit(): void {
    this.databaseService.authenticatedUser().subscribe(user => {
      this.authenticatedUser = user;
      console.log('Auth User ooo', this.authenticatedUser.user_id);
    });

    this.userService.userIds$.subscribe(userId => {
      this.toUserId = userId;
      console.log('current to user no', this.toUserId);
    });

    this.userService.chatMessages$.subscribe(msg => {
      this.today = formatDate(new Date(), 'EEEE, dd MMMM y', 'de-DE');
      this.chat = msg.sort((a, b) => b.send_date - a.send_date);
      this.groupedChat = this.groupMessagesByDate(this.chat);
      this.loadChatData(this.groupedChat, this.toUserId);
      console.log('Group', this.groupMessagesByDate(this.chat));
    });

    this.databaseService.filteredMessages$.subscribe(messages => {
      this.chatMessages = messages;
    });

    /**
     * subscribe to selectedUser$ for the selected user object
     */
    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
      console.log('selected User is:', this.selectedUser);
    });
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

  onAddMessage(currentUser_id: string | undefined, to_user_id: string) {
    let msg = {
      message_content: this.message_content,
      from_user: currentUser_id,
      to_user: to_user_id,
    };
    let newMessage = new Message(msg);

    let msgObject = newMessage.toObject();

    this.databaseService.addMessage(msgObject);
    this.message_content = '';
  }

  onAddEmoji(event: any) {
    this.message_content += event.detail.unicode;
  }

  sendMessage() {
    console.log('Message sent:', this.message_content);
    this.message_content = '';
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
    const formattedDate = formatDate(date, 'EEEE, dd MMMM y', 'de-DE');
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

  onUpdateMessage(msgContent: string, index: number) {
    this.update_point = index;
    this.update_message = msgContent;
    this.show_delete_msg = -1;
  }
  handleUpdateMsg(currentMsgId: string) {
    this.channelService.updateChannelData('messages', 'message_id', currentMsgId, { message_content: this.update_message });
    this.onCancelUpdateMsg();
  }

  onCancelUpdateMsg() {
    this.update_point = -1;
  }

  onRespond(index: number) {
    // this.update_point = index;
    // this.show_delete_msg = -1;
  }
  handleResponse() {}
}
