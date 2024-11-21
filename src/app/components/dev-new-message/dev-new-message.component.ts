import { ShowProfilService } from './../../modules/show-profil.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavService } from '../../modules/nav.service';
import { MiddleWrapperComponent } from '../../shared/middle-wrapper/middle-wrapper.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SearchDevspaceComponent } from '../search-devspace/search-devspace.component';
import { DatabaseServiceService } from '../../database-service.service';
import { Channel, User } from '../../modules/database.model';
import { ChannelService } from '../../modules/channel.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dev-new-message',
  standalone: true,
  imports: [MiddleWrapperComponent, FormsModule, CommonModule, SearchDevspaceComponent, MatIconModule],
  templateUrl: './dev-new-message.component.html',
  styleUrl: './dev-new-message.component.scss',
})
export class DevNewMessageComponent implements OnInit {
  devSearchState: boolean = false;
  message_content: string = '';
  showSearchUserName: boolean = false;
  all_users: User[] = [];
  all_channels: Channel[] = [];
  input_value: string = '';
  search_input: string = '';
  filtered_users: User[] = [];
  filteredChannels: Channel[] = [];
  autoFocusSendMessage: boolean = false;
  PickedArray: string[] = [];

  constructor(
    private showProfileService: ShowProfilService,
    private navService: NavService,
    private databaseService: DatabaseServiceService,
    private channelService: ChannelService
  ) {}
  ngOnInit(): void {
    this.navService.stateOpenDevSearch$.subscribe(state => {
      this.devSearchState = state;
    });

    this.databaseService.users$.subscribe(users => {
      this.all_users = users;
    });

    this.navService.search_input$.subscribe(val => {
      this.input_value = val;
    });
    this.databaseService.channels$.subscribe(channel => {
      this.all_channels = channel;
    });

    this.showProfileService.auto_focus$.subscribe(focus => {
      this.autoFocusSendMessage = focus;
    });
  }

  sendSearchInput(input: string) {
    this.navService.emitSearchInput(input);
  }
  onSearchInDevspace() {
    if (this.search_input.length >= 1 && this.search_input[0] === '@') {
      this.showSearchUserName = true;
      if (this.search_input.length == 1) {
        this.filteredChannels = this.all_channels;
        this.channelService.emitFilteredUsers(this.filtered_users);
      } else if (this.search_input.length > 1 && this.search_input[0] === '@') {
        this.filtered_users = this.all_users.filter(u => this.onFilterUser(u, 1));
        this.channelService.emitFilteredUsers(this.filtered_users);
      }
    } else if (this.search_input && this.search_input[0] !== '@') {
      if (this.search_input[0] === '#' && this.search_input.length == 1) {
        this.showSearchUserName = true;
        this.filteredChannels = this.all_channels;
        this.channelService.emitFilteredChannels(this.filteredChannels);
      } else if (this.search_input[0] === '#' && this.search_input.length > 1) {
        this.showSearchUserName = true;
        this.filteredChannels = this.all_channels.filter(u => this.onFilterChannel(u, 1));
        this.channelService.emitFilteredChannels(this.filteredChannels);
      } else {
        this.showSearchUserName = true;
        this.filtered_users = this.all_users.filter(u => this.onFilterUser(u, 0));
        this.filteredChannels = this.all_channels.filter(u => this.onFilterChannel(u, 0));

        if (this.filtered_users.length === 0) {
          this.channelService.emitFilteredChannels(this.filteredChannels);
        } else {
          this.channelService.emitFilteredUsers(this.filtered_users);
        }
      }
    } else {
      this.showSearchUserName = false;
      this.channelService.emitFilteredUsers([]);
      this.channelService.emitFilteredChannels([]);
    }
  }

  onFilterChannel(array: Channel, index: number) {
    return array.channel_name.toLowerCase().substring(0, this.search_input.length - index) === this.search_input.slice(index).toLowerCase();
  }

  onFilterUser(array: User, index: number) {
    return array.name.toLowerCase().substring(0, this.search_input.length - index) === this.search_input.slice(index).toLowerCase();
  }

  openFileDialog() {
    // this.fileInputElement.nativeElement.click();
  }
}
