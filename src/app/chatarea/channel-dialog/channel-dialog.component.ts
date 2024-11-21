import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../models/channels/entwickler-team.model';
import { ChatareaServiceService } from '../../firestore-service/chatarea-service.service';
import { MemberDialogComponent } from '../member-dialog/member-dialog.component';
import { ChatServiceService } from '../../firestore-service/chat-service.service';
import { AuthService } from '../../firestore-service/auth.service';
import { Subscription } from 'rxjs';
import { ChannelService } from '../../modules/channel.service';

@Component({
  selector: 'app-channel-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, CommonModule, MatCardModule, MatIconModule, MatInputModule, MatDialogActions, MatButtonModule, FormsModule, MemberDialogComponent],
  templateUrl: './channel-dialog.component.html',
  styleUrls: ['./channel-dialog.component.scss'],
})
export class ChannelDialogComponent {
  @Input() isMember: boolean = false;
  @Output() toggleChannelInfoDialog = new EventEmitter<void>();
  uid: string | null = null;
  private uidSubscription: Subscription | null = null;
  admin: string = '';
  description: string = '';
  name: string = '';
  selectedChannelId: string = '';
  channels: Channel[] = [];
  channelNameEdit: boolean = false;
  channelDescEdit: boolean = false;
  channel: Channel = new Channel();
  isAdmin: boolean = false;
  channelAdminId: string = '';

  private channelService = inject(ChannelService);

  constructor(private fireService: ChatareaServiceService, private chatService: ChatServiceService, private authService: AuthService) {}

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
    this.loadActiveChannel();
  }

  checkAdmin(adminId: string) {
    if (this.uid && adminId) {
      this.isAdmin = this.uid === adminId;
    } else {
      this.isAdmin = false;
    }
    if (!this.isAdmin) {
      this.channelNameEdit = false;
      this.channelDescEdit = false;
    }
  }

  onOpenChannelInfo(val: boolean) {
    this.channelService.onDisplayMobileChannelInfo(val);
  }

  loadActiveChannel() {
    this.fireService.getActiveChannel().subscribe({
      next: async (channel: any) => {
        this.selectedChannelId = channel.channel_id;
        this.name = channel.channel_name;
        this.description = channel.description;
        this.admin = await this.chatService.getUserNameByUid(channel.admin);
        this.checkAdmin(channel.admin);
      },
    });
  }

  async leaveChannel() {
    this.fireService.leaveActiveChannel().subscribe({
      next: () => {
        this.closeDialog();
      },
    });
  }

  editChannelName() {
    if (this.channelNameEdit) {
      this.saveChanges({ channel_name: this.name });
    }
    this.channelNameEdit = !this.channelNameEdit;
  }

  editChannelDescription() {
    if (this.channelDescEdit) {
      this.saveChanges({ description: this.description });
    }
    this.channelDescEdit = !this.channelDescEdit;
  }

  saveChanges(updatedData: any) {
    this.fireService.updateChannel(this.selectedChannelId, updatedData);
  }

  closeDialog() {
    this.toggleChannelInfoDialog.emit();
  }
}
