import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { RightWrapperComponent } from '../shared/right-wrapper/right-wrapper.component';
import { LeftSideMenuComponent } from '../components/left-side-menu/left-side-menu.component';
import { NavBarComponent } from '../components/nav-bar/nav-bar.component';
import { CommonModule } from '@angular/common';
import { NavService } from '../modules/nav.service';
import { LogoutComponent } from '../components/logout/logout.component';
import { ShowProfilComponent } from '../components/show-profil/show-profil.component';
import { UpdateProfilComponent } from '../components/update-profil/update-profil.component';
import { LogOutService } from '../modules/log-out.service';
import { ShowProfilService } from '../modules/show-profil.service';
import { UpdateProfilService } from '../modules/update-profil.service';
import { ChatareaComponent } from '../chatarea/chatarea.component';
import { MessagesComponent } from '../components/messages/messages.component';
import { Channel, ChannelMember, Message, User } from '../modules/database.model';
import { DatabaseServiceService } from '../database-service.service';
import { UserService } from '../modules/user.service';
import { ChannelService } from '../modules/channel.service';
import { FormsModule, NgForm } from '@angular/forms';
import { EditChannelComponent } from '../components/edit-channel/edit-channel.component';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../firestore-service/auth.service';
import { DevSpaceAreaComponent } from '../dev-space-area/chatarea.component';
import { MobileLogoutComponent } from '../components/mobile-logout/mobile-logout.component';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { NewChannelSearchComponent } from '../components/new-channel-search/new-channel-search.component';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { MainServiceService } from '../firestore-service/main-service.service';

@Component({
  selector: 'app-main-component',
  standalone: true,
  imports: [
    CommonModule,
    RightWrapperComponent,
    DevSpaceAreaComponent,
    LeftSideMenuComponent,
    ChatareaComponent,
    NavBarComponent,
    MessagesComponent,
    NewChannelSearchComponent,
    EditChannelComponent,
    FormsModule,
    LogoutComponent,
    ShowProfilComponent,
    UpdateProfilComponent,
    MobileLogoutComponent,
  ],
  templateUrl: './main-component.component.html',
  styleUrl: './main-component.component.scss',
})
export class MainComponentComponent implements OnInit {
  state_text: string = 'schließen';
  state_icon: string = 'assets/img/icons/Hide-navigation.svg';
  close = false;
  state!: boolean;
  open_logout!: boolean;
  open_show_profil!: boolean;
  open_show_profile_nav!: boolean;
  open_update_profil!: boolean;
  open_dialog_add_user: boolean = false;
  hide_navigation: boolean = false;
  chatMessages: Message[] = [];
  ChannelMembers: ChannelMember[] = [];
  selectedUser: User = new User();
  isChannelView: boolean = true;
  channel_description: string = '';
  channelName: string = '';
  isChecked: string = 'officeTeam';
  Channel!: Channel;
  all_channel!: Channel[];
  authenticatedUser: User | undefined;
  new_person_name: string = '';
  open_edit_channel: boolean = false;
  openLogoutMobile: boolean = false;
  isThreadVisible: boolean = true;
  openWrapper: 'wrapper_1' | 'wrapper_2' | 'wrapper_3' | null = null;
  all_users: User[] = [];
  filtered_users: User[] = [];
  searchUser: User[] = [];
  pickedArrayObj: User[] = [];
  PickedArray: string[] = [];
  showSearchUser: boolean = false;
  dev_message_search: boolean = false;
  officeTeamChannel!: Channel;
  nameError: boolean = false;
  syntaxError: boolean = false;

  screenWidth: number = window.innerWidth;
  private uidSubscription: Subscription | null = null;
  @ViewChild(MessagesComponent) messageTextArea!: MessagesComponent;
  @ViewChild('inputForm') channelInputForm!: NgForm;
  constructor(
    private navService: NavService,
    private updateProfilService: UpdateProfilService,
    private channelService: ChannelService,
    private logOutService: LogOutService,
    private showProfileService: ShowProfilService,
    private databaseService: DatabaseServiceService,
    private authService: AuthService,
    private userService: UserService,
    private firestore: Firestore,
    private mainService: MainServiceService
  ) {
    this.navService.state$.subscribe(state => {
      this.state = state;
    });
    this.updateProfilService.open_update_profil$.subscribe(state => {
      this.open_update_profil = state;
    });
    this.channelService.openLeftMenu$.subscribe(state => {
      this.hide_navigation = state;
    });

    this.logOutService.open_logout$.subscribe(state => {
      this.open_logout = state;
    });

    this.showProfileService.open_show_profile$.subscribe(state => {
      this.open_show_profil = state;
    });

    this.showProfileService.open_show_profile_nav$.subscribe(state => {
      this.open_show_profile_nav = state;
    });

    this.channelService.open_update_channel$.subscribe(state => {
      this.open_edit_channel = state;
    });

    this.databaseService.messages$.subscribe(state => {
      this.chatMessages = state;
    });
    this.channelService.showChannelMsg$.subscribe(show_channel => {
      this.isChannelView = show_channel;
    });

    this.databaseService.channels$.subscribe(channel => {
      this.all_channel = channel;
    });

    this.channelService.filtered_users$.subscribe(user => {
      this.searchUser = user;
    });

    this.channelService.openMessageMobile$.subscribe(state => {
      this.openWrapper = state;
    });

    this.channelService.openLogoutMobile$.subscribe(state => {
      this.openLogoutMobile = state;
    });

    this.channelService.pickedUserObj$.subscribe(userObj => {
      this.pickedArrayObj = userObj;
    });

    /**
     * subscribe to selectedUser$ for the selected user object
     */
    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
    });

    this.channelService.channelMembers$.subscribe(members => {
      this.ChannelMembers = members;
    });
  }

  onFocus() {
    setTimeout(() => this.messageTextArea.keepFocus(), 0);
  }

  ngOnInit(): void {
    this.open_logout = false;
    this.open_show_profil = false;
    this.open_show_profile_nav = false;
    this.open_update_profil = false;
    this.openLogoutMobile = false;
    this.state = false;
    this.open_edit_channel = false;
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.authenticatedUser = user;
        });
    });
    this.databaseService.officeTeam().subscribe(team => {
      this.officeTeamChannel = team;
    });

    this.databaseService.users$.subscribe(users => {
      this.all_users = users;
    });

    this.channelService.userPicked$.subscribe(user => {
      this.PickedArray = user;
    });
    this.navService.stateOpenDevSearch$.subscribe(state => {
      this.dev_message_search = state;
    });;

    this.checkScreenSize();
    this.mainService.checkAndUpdateChannelMembers();
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    if (window.innerWidth < 630 && this.close) {
      this.close = false;
      this.channelService.emitOpenLeftMenu();
    }
  }

  toggelThread() {
    this.isThreadVisible = !this.isThreadVisible;
  }

  toggleNavigation() {
    if (!this.close) {
      this.state_text = 'schließen';
    } else {
      this.state_text = 'öffnen   ';
    }
  }
  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  alreadyExist(newChannelName: string) {
    let channel_names = this.all_channel.map(channel => channel.channel_name.toLowerCase());
    return channel_names.includes(newChannelName.toLowerCase());
  }

  onCreateChannel() {
    let channelData = {
      channel_name: this.channelName,
      description: this.channel_description,
      admin: this.authenticatedUser ? this.authenticatedUser.id : 'Unknown',
    };

    let office = new Channel(channelData).toObject();
    this.databaseService.getOfficeTeamMembers(this.officeTeamChannel?.channel_id, members => {
      if (members) {
        const memberArray = members.map(m => m.member_id);
        if (this.isChecked === 'officeTeam') {
          this.onAddPeopleToChannel(memberArray, office);
        }
      } else {
      }
      if (this.isChecked === 'singleUser') {
        const idArray = this.pickedArrayObj.map(user => user.id);

        this.onAddPeopleToChannel(idArray, office);
      }
    });
  }

  async onAddPeopleToChannel(array: any[], office: any) {
    if (this.alreadyExist(office.channel_name)) {
      this.syntaxError = false;
      this.nameError = true;
      this.open_dialog_add_user = false;
      this.navService.createChannel();
    } else {
      this.nameError = false;
      if (!array.includes(this.authenticatedUser?.id)) {
        array.push(this.authenticatedUser?.id);
      }

      this.databaseService
        .addChannel(office)
        .then(id => this.updateChannelIdOrMember(id, { channel_id: id }).then(id => this.updateChannelIdOrMember(id, { member: array.filter(m => m !== undefined) })));

      array.forEach(member => {
        const newMember = new ChannelMember({ member_id: member, channel_id: office.channel_id }).toObject();
        this.databaseService.addMemberToChannel(newMember);
      });
      this.channelName = '';
      this.channel_description = '';
    }
    this.onCancelAddUser();
  }

  async updateChannelIdOrMember(id: string | undefined, data: any) {
    const userDocRef = doc(this.firestore, `channels/${id}`);
    await updateDoc(userDocRef, data);
    return id;
  }

  iconPath() {
    if (!this.close) {
      return 'assets/img/icons/Hide-navigation.svg';
    } else {
      return 'assets/img/icons/show-navigation.svg';
    }
  }

  handleToggle() {
    this.close = !this.close;
    this.channelService.emitOpenLeftMenu();
    this.toggleNavigation();
    this.state_icon = this.iconPath();

    if (this.openWrapper === 'wrapper_1') {
      this.openWrapper = null;
    } else {
      this.openWrapper = 'wrapper_1';
    }
  }

  handleOpenWrapper(wrapper: 'wrapper_1' | 'wrapper_2' | 'wrapper_3' | null) {
    this.openWrapper = wrapper;
  }

  openRightWrapper() {
    this.handleOpenWrapper('wrapper_3');
  }

  openChatarea() {
    this.handleOpenWrapper('wrapper_2');
  }

  onCloseDialog() {
    this.navService.createChannel();
  }

  onResetForm() {
    this.channelInputForm?.resetForm();
    this.syntaxError = false;
    this.nameError = false;
  }

  toggleCheckTeam() {
    this.isChecked = this.isChecked;
    return this.isChecked;
  }

  onAddUser() {
    if (this.channelName && this.channelName[0] !== ' ') {
      this.onCloseDialog();
      this.open_dialog_add_user = true;
      this.syntaxError = false;
    } else {
      this.nameError = false;
      this.syntaxError = true;
    }
  }

  onCancelAddUser() {
    this.open_dialog_add_user = false;
    this.showSearchUser = false;
    this.channelService.emitPickedUser([]);
    this.channelService.emitPickedUsersObj([]);
    this.new_person_name = '';
    this.channelName = '';
    this.channel_description = '';
    this.isChecked = 'officeTeam';
  }

  onOpenEditChannel() {
    this.channelService.editChannelInfos();
  }

  onCloseEditChannel() {
    this.channelService.editChannelInfos();
  }

  onCloseLogout() {
    this.logOutService.updateProfile();
  }
  onCloseShowProfil() {
    this.showProfileService.updateProfile();
  }
  onOpenNavProfile() {
    this.showProfileService.updateNavProfile();
  }

  onCloseUpdateProfil() {
    this.updateProfilService.updateProfile();
  }

  onSearchUser() {
    if (this.new_person_name.length >= 1 && this.new_person_name[0] === '@') {
      this.showSearchUser = true;
      if (this.new_person_name.length == 1) {
        this.filtered_users = this.all_users;
        this.channelService.emitFilteredUsers(this.filtered_users);
      } else if (this.new_person_name.length > 1 && this.new_person_name[0] === '@') {
        this.filtered_users = this.all_users.filter(u => this.onFilterUser(u, 1));
        this.channelService.emitFilteredUsers(this.filtered_users);
      }
    } else if (this.new_person_name.length >= 1 && this.new_person_name[0] !== '@') {
      this.showSearchUser = true;
      this.filtered_users = this.all_users.filter(u => this.onFilterUser(u, 0));
      this.channelService.emitFilteredUsers(this.filtered_users);
    } else {
      this.showSearchUser = false;
      this.channelService.emitFilteredUsers([]);
    }
  }

  closeShowSearchUser() {
    if (this.showSearchUser) {
      this.showSearchUser = false;
      this.new_person_name = '';
    }
  }

  onFilterUser(array: User, index: number) {
    return array.name.toLowerCase().substring(0, this.new_person_name.length - index) === this.new_person_name.slice(index).toLowerCase();
  }

  handleDialogMobile(val: 'wrapper_1' | 'wrapper_2' | 'wrapper_3') {
    this.channelService.emitOpenMessageMobile(val);
  }

  onRemoveUser(id: string) {
    this.pickedArrayObj = this.pickedArrayObj.filter(user => user.id !== id);
    const idArray = this.pickedArrayObj.map(user => user.id);
    this.channelService.emitPickedUser(idArray);
    this.channelService.emitPickedUsersObj(this.pickedArrayObj);
  }

  clearPickedUsers() {
    if (this.pickedArrayObj.length != 0) {
      this.pickedArrayObj = []
      this.channelService.emitPickedUser([]);
      this.channelService.emitPickedUsersObj([]);
    }
  }

  onCloseMobileLogout() {
    this.channelService.emitLogoutMobile();
  }
}
