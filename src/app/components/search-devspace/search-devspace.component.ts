import { Component, OnInit } from '@angular/core';
import { ProfileComponent } from '../../shared/profile/profile.component';
import { CommonModule } from '@angular/common';
import { ChannelService } from '../../modules/channel.service';
import { Channel, User } from '../../modules/database.model';
import { NavService } from '../../modules/nav.service';
import { DatabaseServiceService } from '../../database-service.service';
import { UserService } from '../../modules/user.service';
import { CurrentUserService } from '../../modules/current-user.service';

@Component({
  selector: 'app-search-devspace',
  standalone: true,
  imports: [ProfileComponent, CommonModule],
  templateUrl: './search-devspace.component.html',
  styleUrl: './search-devspace.component.scss',
})
export class SearchDevspaceComponent implements OnInit {
  PickedArray: string[] = [];
  filteredUsers: User[] = [];
  filteredChannels: Channel[] = [];
  input_search: string = '';
  authenticatedUser: User | undefined;

  constructor(
    private channelService: ChannelService,
    private authService: CurrentUserService,
    private userService: UserService,
    private databaseService: DatabaseServiceService,
    private navService: NavService
  ) { }
  ngOnInit(): void {
    this.authService.userID$.subscribe(userId => {
      this.databaseService.authUser(userId!).then(user => {
        if (user && user !== null) {
          this.authenticatedUser = user;
        }
      });
    });

    this.channelService.filtered_users$.subscribe(users => {
      this.filteredUsers = users;
    });
    this.channelService.filtered_channels$.subscribe(channels => {
      this.filteredChannels = channels;
    });

    this.channelService.userPicked$.subscribe(user => {
      this.PickedArray = user;
    });

    this.navService.search_input$.subscribe(value => {
      this.input_search = value;
    });
  }

  handleUpdateUserChannelId(currentChannelId: string) {
    this.channelService.updateChannelData('users', 'id', this.authenticatedUser?.id, { activeChannelId: currentChannelId });
  }

  sendToOpenUser(user: User) {
    if (!this.PickedArray.includes(user.id)) {
      this.PickedArray.push(user.id);
      this.channelService.emitPickedUser(this.PickedArray);
    } else {
      console.log('member already exist');
    }
  }

  onToggleDevSearch(bool: boolean) {
    this.navService.emitOpenDevSearch(bool);
  }

  showChannelMessages(isShown: boolean) {
    this.channelService.emitChannelView(isShown);
  }

  sendToOpenChannel(channel: Channel) {
    console.log('You picked this channel', channel);
  }

  sendChannel(channel: Channel) {
    this.userService.emitChannel(channel);
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

  loadChannelMembers(channel_id: string) {
    this.databaseService.getChannelMembers(channel_id, members => {
      if (members) {
        this.channelService.emitChannelMembers(members);
      } else {
        this.channelService.emitChannelMembers([]);
      }
    });
  }

  sendSelectedUser(user: User) {
    this.userService.emitSelectedUser(user);
  }

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

  sendUserId(to_id: string) {
    this.userService.emitUserId(to_id);
  }
}
