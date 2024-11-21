import { UserService } from './../../modules/user.service';
import { Component, OnInit } from '@angular/core';
import { MiddleWrapperComponent } from '../../shared/middle-wrapper/middle-wrapper.component';
import { CommonModule, formatDate } from '@angular/common';
import { ChannelService } from '../../modules/channel.service';
import { Channel, Message, User, ChannelMember } from '../../modules/database.model';
import { DatabaseServiceService } from '../../database-service.service';
import { FormsModule } from '@angular/forms';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../../firestore-service/auth.service';

@Component({
  selector: 'app-channel-messages',
  standalone: true,
  imports: [MiddleWrapperComponent, CommonModule, FormsModule],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss',
})
export class ChannelMessagesComponent implements OnInit {
  message_content = '';
  channel: Channel = new Channel();
  authenticatedUser: User | undefined;
  today!: string;
  show_error_message: boolean = false;
  channel_is_deleted: boolean = false;
  groupedChat: any;
  channelChat: Message[] = [];
  ChannelMembers: ChannelMember[] = [];
  userByIdMap: { [userId: string]: any } = {};
  open_edit_channel: boolean = false;

  private uidSubscription: Subscription | null = null;
  constructor(private userService: UserService, private authService: AuthService, private channelService: ChannelService, private databaseService: DatabaseServiceService) {}

  ngOnInit(): void {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.authenticatedUser = user;
        });
    });

    // this.databaseService.authenticatedUser().subscribe(user => {
    //   this.authenticatedUser = user;
    // });

    this.userService.channel$.subscribe(channel => {
      this.channel = channel;
      this.show_error_message = false;
      this.channel_is_deleted = false;
    });

    this.channelService.channelMembers$.subscribe(members => {
      this.ChannelMembers = members;
    });

    this.userService.channelMessages$.subscribe(msg => {
      this.today = formatDate(new Date(), 'EEEE, dd MMMM y', 'de-DE');
      this.channelChat = msg.sort((a, b) => b.send_date - a.send_date);
      this.groupedChat = this.groupMessagesByDate(this.channelChat);
      this.loadChatData(this.groupedChat, this.channel.channel_id);
    });

    this.channelService.open_update_channel$.subscribe(state => {
      this.open_edit_channel = state;
    });
  }

  onAddMessage(currentUser_id: string | undefined, to_user_id: string) {
    let msg = {
      message_content: this.message_content,
      from_user: currentUser_id,
      to_user: to_user_id,
    };

    let all_subscribers = this.ChannelMembers.map(member => member.member_id);
    let newMessage = new Message(msg);

    let msgObject = newMessage.toObject();

    if (all_subscribers.includes(currentUser_id!)) {
      this.databaseService.addMessage(msgObject);
    } else if (!this.channel.is_deleted) {
      this.show_error_message = true;
    } else {
      this.channel_is_deleted = true;
    }

    this.message_content = '';
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
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
    return formattedDate === this.today ? 'Heute' : formattedDate;
  }

  setChannelCreateDate(date: number) {
    if (date) {
      return this.checkDateIfToday(new Date(date)) === 'Heute' ? 'heute' : `am ${this.checkDateIfToday(new Date(date))}`;
    } else {
      return '';
    }
  }

  setTimeFormat(date: Date) {
    return formatDate(date, 'HH:mm', 'en-US');
  }

  loadChatData(chatGroups: any[], toUserId: string) {
    const allMessages = chatGroups.reduce((acc, group) => [...acc, ...group.messages], []);
    this.prefetchUsers(allMessages, toUserId);
  }

  getCachedUser(userId: string) {
    return this.userByIdMap[userId];
  }

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

  onOpenEditChannel() {
    this.channelService.editChannelInfos();
  }
}
