import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { Channel, Message, User } from './database.model';
import { collection, Firestore, onSnapshot, query, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // private channelIdsSource = new Subject<string>();
  private chatSource = new Subject<Message[]>();
  private channelSource = new ReplaySubject<Channel>(1);
  private channelMsgSource = new Subject<Message[]>();
  private userIdsSource = new ReplaySubject<string>(1);
  private messageIdSource = new ReplaySubject<string>(1);
  private userSource = new ReplaySubject<User>(1);
  private pickedUserSource = new ReplaySubject<User>(1);
  private officeSource = new Subject<string[]>();
  private logShowSearchSubject = new BehaviorSubject<boolean>(false);
  private clickedInsideButton = new BehaviorSubject<boolean>(false);
  private onlineUsersSubject = new BehaviorSubject<any>(null);

  clickedInsideButton$ = this.clickedInsideButton.asObservable();
  userIds$ = this.userIdsSource.asObservable();
  channel$ = this.channelSource.asObservable();
  selectedUser$ = this.userSource.asObservable();
  selectedMessageId$ = this.messageIdSource.asObservable();
  pickedUser$ = this.pickedUserSource.asObservable();
  chatMessages$ = this.chatSource.asObservable();
  officeMembers$ = this.officeSource.asObservable();
  channelMessages$ = this.channelMsgSource.asObservable();
  onlineUsers$ = this.onlineUsersSubject.asObservable();
  toggle_show_search_user$ = this.logShowSearchSubject.asObservable();

  constructor() {}

  emitUserId(userId: string) {
    this.userIdsSource.next(userId);
  }

  emitSelectedUser(user: User) {
    this.userSource.next(user);
  }

  emitSelectedMessageId(msg_id: string) {
    this.messageIdSource.next(msg_id);
  }

  emitPickedUser(user: User) {
    this.pickedUserSource.next(user);
  }

  emitShowSearchUser(show: boolean) {
    this.logShowSearchSubject.next(show);
  }

  emitChannel(channel: Channel) {
    this.channelSource.next(channel);
  }

  emitChat(chat: Message[]) {
    this.chatSource.next(chat);
  }

  emitChannelMessage(msg: Message[]) {
    this.channelMsgSource.next(msg);
  }

  emitOfficeMembers(members: string[]) {
    this.officeSource.next(members);
  }

  setClickedInsideButton(isClicked: boolean) {
    this.clickedInsideButton.next(isClicked);
  }
}
