import { Component, OnInit } from '@angular/core';
import { ChannelService } from '../../modules/channel.service';
import { UserService } from '../../modules/user.service';
import { Channel, ChannelMember, Message, User } from '../../modules/database.model';
import { DatabaseServiceService } from '../../database-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../../firestore-service/auth.service';

@Component({
  selector: 'app-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-channel.component.html',
  styleUrl: './edit-channel.component.scss',
})
export class EditChannelComponent implements OnInit {
  open_edit_channel: boolean = false;
  channel: Channel = new Channel();
  admin_name: string = '';
  authenticatedUser: User | undefined;
  is_delete_channel: boolean = false;
  ChannelMembers: ChannelMember[] = [];
  admin_password: string = '';
  deletion_message: string = '';
  private uidSubscription: Subscription | null = null;
  constructor(private channelService: ChannelService, private authService: AuthService, private userService: UserService, private databaseService: DatabaseServiceService) {}

  ngOnInit(): void {
    this.channelService.open_update_channel$.subscribe(state => {
      this.open_edit_channel = state;
    });

    this.userService.channel$.subscribe(channel => {
      this.channel = channel;
    });

    this.channelService.channelMembers$.subscribe(members => {
      this.ChannelMembers = members;
    });

    this.databaseService.getChannelAdmin(this.channel.admin).subscribe(admin => {
      this.admin_name = admin.name;
    });

    // this.databaseService.authenticatedUser().subscribe(user => {
    //   this.authenticatedUser = user;
    // });
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.authenticatedUser = user;
        });
    });
  }

  onOpenEditChannel() {
    this.channelService.editChannelInfos();
  }

  onLeaveChannel() {
    if (this.authenticatedUser?.id !== this.channel.admin) {
      this.databaseService.deleteDocument('channel_members', 'member_id', this.authenticatedUser?.id);
    } else {
      console.log('Admin cannot leave the channel');
    }

    this.onOpenEditChannel();
  }

  onTryToDeleteChannel() {
    this.is_delete_channel = true;
  }

  onDeleteChannel() {
    if (this.admin_password === this.authenticatedUser?.password) {
      let all_channel_members = this.ChannelMembers.map(member => member.member_id);
      this.ChannelMembers.forEach(member => this.databaseService.deleteDocument('channel_members', 'member_id', member.member_id));
      all_channel_members.forEach(member => this.sendDeletionMessage(member));

      this.handleIsDeleted(this.channel.channel_id);
      console.log('Channel deleted');
      this.onCancelDeletion();
    } else {
      console.log('Eingegebenes Passwort ist falsch, bitte versuchen Sie nochmal!');
    }
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  /**
   * this method handle the is_deleted field of the Channel. Set it to true if
   * the current channel is deleted or let the default value (False) if not.
   * @param {string} currentChannelId - Id of the current channel to be deleted
   */
  handleIsDeleted(currentChannelId: string) {
    this.channelService.updateChannelData('channels', 'channel_id', currentChannelId, { is_deleted: true });
  }

  /**
   * this method send messages to all users of the channel to be deleted to inform them that the admin
   * has deleted the channel.
   * @param {string} toUser - Id of the user who the message is sent to,
   */
  sendDeletionMessage(toUser: string) {
    let msg = {
      message_content: `Deine Mitgliedschaf zum folgenden Channel #${this.channel.channel_name} wurde vom mir beendet.
                        Ich habe den Channel endgültig gelöscht. Du kannst alten Nachrichten sehen aber keine Neuen schreiben.
                        Grund: ${this.deletion_message ? this.deletion_message : 'Kein Grund wurde gegeben.'}`,
      from_user: this.channel.admin,
      to_user: toUser,
    };
    let newMessage = new Message(msg);
    let msgObject = newMessage.toObject();
    this.databaseService.addMessage(msgObject);
  }

  /**
   * this method allow to cancel the deletion process
   */
  onCancelDeletion() {
    this.is_delete_channel = false;
  }
}
