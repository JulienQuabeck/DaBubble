import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatabaseServiceService } from '../../database-service.service';
import { User } from '../../modules/database.model';
import { ChannelService } from '../../modules/channel.service';
import { Observable } from 'rxjs';
import { CurrentUserService } from '../../modules/current-user.service';
import { ProfileComponent } from '../../shared/profile/profile.component';
import { UserService } from '../../modules/user.service';

@Component({
  selector: 'app-new-channel-search',
  standalone: true,
  imports: [FormsModule, CommonModule, ProfileComponent],
  templateUrl: './new-channel-search.component.html',
  styleUrl: './new-channel-search.component.scss',
})
export class NewChannelSearchComponent implements OnInit {
  filteredUsers: User[] = [];
  users$: Observable<User[]> = new Observable<User[]>();
  authenticatedUser: User | undefined;
  PickedArray: string[] = [];
  pickedUserObj: User[] = [];
  pickedUser: string = '';

  private authService = inject(CurrentUserService);
  private userService = inject(UserService);

  constructor(private databaseService: DatabaseServiceService, private channelService: ChannelService) {}

  ngOnInit(): void {
    this.authService.userID$.subscribe(userId => {
      this.databaseService.authUser(userId!).then(user => {
        if (user && user != null) {
          this.authenticatedUser = user;
        }
      });
    });
    this.users$ = this.databaseService.snapUsers();

    this.channelService.filtered_users$.subscribe(users => {
      this.filteredUsers = users;
    });

    this.channelService.pickedUserObj$.subscribe(values => {
      this.pickedUserObj = values;
    });
  }

  sendToAddUserToChannel(user: User) {
    if (!this.pickedUserObj.map(user => user.id).includes(user.id)) {
      this.PickedArray.push(user.id);
      this.pickedUserObj.push(user);
      this.channelService.emitPickedUser(this.PickedArray);
      this.channelService.emitPickedUsersObj(this.pickedUserObj);
    }
  }

  onAddTread(user: User) {
    this.userService.emitPickedUser(user);
  }
}
