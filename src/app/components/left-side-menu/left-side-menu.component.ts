import { ShowProfilService } from './../../modules/show-profil.service';
import { CurrentUserService } from './../../modules/current-user.service';
import { AuthService } from './../../firestore-service/auth.service';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ProfileComponent } from '../../shared/profile/profile.component';
import { WrapperComponent } from '../../shared/wrapper/wrapper.component';
import { CommonModule } from '@angular/common';
import { NavService } from '../../modules/nav.service';
import { DatabaseServiceService } from '../../database-service.service';
import { User, Channel, Message } from '../../modules/database.model';
import { combineLatest, Observable, of, switchMap, map, Subscription } from 'rxjs';
import { UserService } from '../../modules/user.service';
import { ChannelService } from '../../modules/channel.service';
import { ScrollToTopComponent } from '../scroll-to-top/scroll-to-top.component';
import { MainServiceService } from '../../firestore-service/main-service.service';
import { GuestService } from '../../modules/guest.service';
import { MessagesComponent } from '../messages/messages.component';

@Component({
  selector: 'app-left-side-menu',
  standalone: true,
  imports: [WrapperComponent, ProfileComponent, CommonModule, ScrollToTopComponent, MessagesComponent],
  templateUrl: './left-side-menu.component.html',
  styleUrl: './left-side-menu.component.scss',
})
export class LeftSideMenuComponent implements OnInit, AfterViewInit {
  avatar = 'Elise_Roth.svg';
  is_authenticated = true;
  state: boolean = false;
  active: boolean = false;
  show_channel_msg!: boolean;
  selectedIndex: number = 0;
  selectedChannelIndex!: number;
  collapse: boolean = false;
  expand: boolean = false;
  users$: Observable<User[]> = new Observable<User[]>();
  channels$: Observable<Channel[]> = new Observable<Channel[]>();
  messages$: Observable<Message[]> = new Observable<Message[]>();
  directMessages$: Observable<Message[]> = new Observable<Message[]>();
  authenticatedUser: User | undefined;
  userNames: { [userId: string]: string } = {};
  users: User[] = [new User()];
  messages: Message[] = [new Message()];
  chatMessages: Message[] = [];
  selectedChannel: Channel = new Channel();
  chat!: Message[];
  usersMap: { [key: string]: User } = {};
  messagesMap: { [key: string]: Message } = {};
  toUserId!: string;
  all_channel!: Channel[];
  channel: Channel = new Channel();
  onlineUser: any = null;
  selectedUser: User | undefined;
  userById: any | null = null;
  userByIdMap: { [userId: string]: any } = {};
  chatMap: { [key: string]: any[] } = {};
  openDevSearch: boolean = false;
  auth_user_id!: any;
  observeUser!: Observable<User>;
  private uidSubscription: Subscription | null = null;
  @ViewChild(MessagesComponent) messageTextArea!: MessagesComponent;

  /**
   * @constructor
   * @param {NavService} navService - instance of NavService for subscribing to the
   * Observable state$
   */
  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private channelService: ChannelService,
    private navService: NavService,
    private databaseService: DatabaseServiceService,
    private authService: CurrentUserService,
    private authenticatedService: AuthService,
    private showProfilService: ShowProfilService,
    private mainService: MainServiceService,
    private guestService: GuestService
  ) {
    this.navService.state$.subscribe(state => {
      this.state = state;
    });

    this.showChannelMessages(false);
  }

  ngAfterViewInit(): void {
    this.onFocus();
  }

  ngOnInit(): void {
    this.onlineUser = this.guestService.guestData;
    const currentName = localStorage.getItem('currentName');
    const currentState = localStorage.getItem('currentState');
    const currentUserData = localStorage.getItem('authUser');
    const currentSelectedUserData = localStorage.getItem('selectedUser');
    let currentUser;
    let currentUserSelection;

    if (currentUserData && currentUserData !== 'undefined') {
      currentUser = JSON.parse(currentUserData);
    } else {
      currentUser = '';
    }

    if (currentSelectedUserData && currentSelectedUserData !== 'undefined') {
      currentUserSelection = JSON.parse(currentSelectedUserData);
    } else {
      currentUserSelection = '';
    }

    this.uidSubscription = this.authenticatedService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.auth_user_id = user?.id;
          this.authenticatedUser = user;
        });
    });

    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
    });

    this.userService.channel$.subscribe(selected_channel => {
      this.selectedChannel = selected_channel;
    });
    if (currentName === '') {
      this.selectUser(0);
      this.onToggleDevSearch(false);
      this.showChannelMessages(false);
    } else if (currentName && currentName === 'user') {
      this.userLoad(currentState, currentUser, currentUserSelection);
    } else if (currentName && currentName === 'guest') {
      this.guestLoad(currentState, currentUserSelection);
    } else if (currentName && currentName === 'channel') {
      this.channelLoad(currentState);
    }

    this.authService.getGuestUser();

    this.uidSubscription = this.authenticatedService.getUIDObservable().subscribe((uid: string | null) => {
      this.observeUser = this.databaseService.snapUsers().pipe(map(users => users.filter(user => user.id === uid)[0]));
    });

    this.navService.stateOpenDevSearch$.subscribe(state => {
      this.openDevSearch = state;
    });

    this.users$ = this.databaseService.snapUsers();
    this.channels$ = this.databaseService.snapChannels();
    this.messages$ = this.databaseService.snapMessages();

    this.databaseService.channels$.subscribe(channel => {
      this.all_channel = channel;
    });

    /**
     * find the direct messages from the authenticated user
     */
    this.directMessages$ = combineLatest([this.observeUser, this.messages$]).pipe(
      switchMap(([authenticatedUser, messages]) => {
        if (authenticatedUser) {
          return this.databaseService.directMessages(authenticatedUser?.id);
        } else {
          return of([]);
        }
      })
    );

    this.databaseService.getAllMessages().subscribe(messages => {
      this.chatMessages = messages;
    });

    this.databaseService.getAllUsers().subscribe(users => {
      this.usersMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as { [key: string]: User });
    });

    this.databaseService.getAllMessages().subscribe(messages => {
      this.messagesMap = messages.reduce((acc, message) => {
        acc[message.message_id] = message;
        return acc;
      }, {} as { [key: string]: Message });
    });

    /**
     * subscribe to userIds$ for the Id of the selected user
     */
    this.userService.userIds$.subscribe(userId => {
      this.toUserId = userId;
    });

    /**
     * subscribe to channelId$ for the Id of the selected channel
     */
    // this.userService.channelIds$.subscribe(id => {
    //   this.channelId = id;
    // });

    this.userService.channel$.subscribe(channel => {
      this.channel = channel;
    });

    /**
     * subscribe to selectedUser$ for the selected user object
     */
    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
      this.channelService.emitPickedUser([]);
    });

    this.channelService.showChannelMsg$.subscribe(is_channel => {
      this.show_channel_msg = is_channel;
    });

    this.userService.chatMessages$.subscribe(msg => {
      this.chat = msg;
    });
  }

  onFocus() {
    this.cdr.detectChanges();
    this.messageTextArea?.keepFocus();
    setTimeout(() => this.messageTextArea?.keepFocus(), 0);
  }

  closeThread() {
    this.mainService.setThreadOpenFalse();
  }

  handleUpdateUserChannelId(currentChannelId: string) {
    this.channelService.updateChannelData('users', 'id', this.auth_user_id, { activeChannelId: currentChannelId });
  }

  onOpenSearchSelection(selectionData: Channel | User, flag: 'channel' | 'user') { }

  loadMessages(currentUserId: string | undefined, targetUserId: string) {
    this.databaseService.getMessages(currentUserId, targetUserId, messages => {
      if (messages) {
        if (currentUserId !== targetUserId) {
          messages = messages.filter(m => m.from_user !== m.to_user);
        }
        this.userService.emitChat(messages);
      } else {
        this.userService.emitChat([]);
      }
    });
  }

  channelLoad(state: string | null) {
    this.selectChannel(Number(state));
    this.loadChannelMembers(this.selectedChannel?.channel_id);
    setTimeout(() => this.showChannelMessages(true));
    this.onToggleDevSearch(false);
    this.sendChannel(this.selectedChannel);
    this.loadChannelMembers(this.selectedChannel?.channel_id);
    this.loadChannelMessages(this.selectedChannel?.channel_id);
  }

  guestLoad(state: string | null, selectionUser: User) {
    this.selectUser(Number(state));
    this.onToggleDevSearch(false);
    this.sendUserId(selectionUser ? selectionUser.id! : this.onlineUser?.id);
    this.sendSelectedUser(selectionUser ? selectionUser : this.onlineUser);
    this.showChannelMessages(false);
    this.loadMessages(this.onlineUser?.id, selectionUser ? selectionUser.id! : this.onlineUser?.id);
  }

  userLoad(state: string | null, currentAuthUser: User, selectionUser: User) {
    this.selectUser(Number(state));
    this.onToggleDevSearch(false);
    this.sendUserId(selectionUser ? selectionUser.id! : currentAuthUser?.id);
    this.sendSelectedUser(selectionUser ? selectionUser : currentAuthUser);
    this.showChannelMessages(false);

    this.loadMessages(currentAuthUser?.id, selectionUser ? selectionUser.id! : currentAuthUser?.id);
  }

  loadChannelMembers(channel_id: string) {
    this.databaseService.getChannelMembers(channel_id, members => {
      if (members) {
        this.channelService.emitChannelMembers(members);
      } else {
        this.channelService.emitChannelMembers([]);
      }
    });
  }

  storeStateSessionInfo(authUser: User | string | undefined, selectedUser: User | undefined | string, currentName: string, currentState: number) {
    localStorage.setItem('currentName', currentName);
    localStorage.setItem('authUser', JSON.stringify(authUser!));
    localStorage.setItem('selectedUser', JSON.stringify(selectedUser!));
    localStorage.setItem('currentState', `${currentState}`);
  }

  loadChannelMessages(targetChannelId: string) {
    this.databaseService.getChannelMessages(targetChannelId, messages => {
      if (messages) {
        this.userService.emitChannelMessage(messages);
      } else {
        this.userService.emitChannelMessage([]);
      }
    });
  }

  sendUserId(to_id: string) {
    this.userService.emitUserId(to_id);
  }

  onToggleDevSearch(bool: boolean) {
    this.navService.emitOpenDevSearch(bool);
  }

  sendChannel(channel: Channel) {
    this.userService.emitChannel(channel);
  }

  showChannelMessages(isShown: boolean) {
    this.channelService.emitChannelView(isShown);
  }

  /**
   * This function actualize the value of the selected user defined in userService
   * @param {User} user - current selected user from the navigation
   */
  sendSelectedUser(user: User) {
    this.userService.emitSelectedUser(user);
  }

  /**
   * open the dialog for creating a new channel
   */
  onOpen() {
    this.navService.createChannel();
  }

  /**
   * set active to true if the current user is authenticated.
   * This is used to set the green flag on the user profile.
   */
  onActive() {
    this.active = true;
  }

  /**
   *
   * @param {Number} index - Index of the current user
   */
  selectUser(index: number) {
    this.selectedIndex = index;
    this.selectedChannelIndex = -1;
  }

  /**
   *
   * @param {Number} index - Index of the current channel
   */
  selectChannel(index: number) {
    this.selectedChannelIndex = index;
    this.selectedIndex = -1;
  }

  /**
   * Allow expanding and collapsing the list of direct message users
   */
  onCollapse() {
    this.collapse = !this.collapse;
  }

  /**
   * Allow expanding and collapsing the list of channels
   */
  onExpand() {
    this.expand = !this.expand;
  }

  handleMobileView(val: 'wrapper_1' | 'wrapper_2' | 'wrapper_3') {
    this.channelService.emitOpenMessageMobile(val);
  }

  onAutoFocus() {
    this.showProfilService.emitAutoFocus(true);
  }
}
