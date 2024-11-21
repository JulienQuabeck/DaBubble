import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { ChannelDialogComponent } from './channel-dialog/channel-dialog.component';
import { MemberDialogComponent } from './member-dialog/member-dialog.component';
import { AddMemberDialogComponent } from './add-member-dialog/add-member-dialog.component';
import { MessageComponent } from './message/message.component';
import { OwnMessageComponent } from './own-message/own-message.component';
import { MessageBoxComponent } from './message-box/message-box.component';
import { ChatareaServiceService } from '../firestore-service/chatarea-service.service';
import { MainServiceService } from '../firestore-service/main-service.service';
import { ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../firestore-service/auth.service';
import { Subscription } from 'rxjs';
import { MiddleWrapperComponent } from '../shared/middle-wrapper/middle-wrapper.component';
import { FormsModule } from '@angular/forms';
import { SearchDevspaceComponent } from '../components/search-devspace/search-devspace.component';
import { Channel, User } from '../modules/database.model';
import { ChannelService } from '../modules/channel.service';
import { DatabaseServiceService } from '../database-service.service';
import { NavService } from '../modules/nav.service';
import { DevNewMessageComponent } from '../components/dev-new-message/dev-new-message.component';

@Component({
  selector: 'app-dev-space-area',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDialogModule,
    ChannelDialogComponent,
    MessageComponent,
    OwnMessageComponent,
    MessageBoxComponent,
    MemberDialogComponent,
    AddMemberDialogComponent,
    MiddleWrapperComponent,
    FormsModule,
    SearchDevspaceComponent,
    DevNewMessageComponent,
  ],
  templateUrl: './chatarea.component.html',
  styleUrl: './chatarea.component.scss',
})
export class DevSpaceAreaComponent {
  @ViewChild('messageContainer') messageContainer!: ElementRef;

  private uidSubscription: Subscription | null = null;
  channelInfoDialog: boolean = false;
  channelMemberDialog: boolean = false;
  addMemberDialog: boolean = false;
  channelName: string | null = null;
  memberIds: string[] = [];
  members: User[] = [];
  messages: any[] = [];
  uid: string | null = null;
  previousMessageDate: string | null = null;
  allChannelsAreFalse: boolean = false;

  constructor(
    public dialog: MatDialog,
    private fireService: ChatareaServiceService,
    private mainService: MainServiceService,
    private cdRef: ChangeDetectorRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });

    this.loadActiveChannelData();
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  clearChannelData() {
    this.channelName = null;
    this.memberIds = [];
    this.members = [];
    this.messages = [];
  }

  loadMessages(channelId: string) {
    if (!channelId) {
      this.clearChannelData();
      return;
    }
    this.fireService.loadMessages(channelId).subscribe(messages => {
      this.messages = messages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setTimeout(() => {
        this.scrollToBottom();
      }, 250);
    });
  }

  loadActiveChannelData() {
    this.fireService.getActiveChannel().subscribe({
      next: (channel: any) => {
        this.channelName = channel.channel_name || null;
        this.memberIds = channel.member || [];
        this.loadMembers();
        this.loadMessages(channel.id);
        this.cdRef.detectChanges();
      },
    });
  }

  loadMembers() {
    this.members = [];
    this.memberIds.forEach(memberId => {
      this.fireService.loadDocument('users', memberId).subscribe((user: any) => {
        const userInstance = new User({ ...user });
        this.members.push(userInstance);
      });
    });
  }

  shouldShowDivider(currentMessageTime: string, index: number): boolean {
    const currentMessageDate = new Date(currentMessageTime).toLocaleDateString();
    if (index === 0 || this.previousMessageDate !== currentMessageDate) {
      this.previousMessageDate = currentMessageDate;
      return true;
    }
    return false;
  }

  scrollToBottom(): void {
    this.messageContainer.nativeElement.scroll({
      top: this.messageContainer.nativeElement.scrollHeight,
      behavior: 'smooth',
    });
  }

  formatTime(timeString: string): string {
    return this.mainService.formatTime(timeString);
  }

  formatDate(dateString: string): string {
    return this.mainService.formatDate(dateString);
  }

  closeDialogOnClick(event: MouseEvent) {
    if (this.channelInfoDialog) {
      this.channelInfoDialog = false;
    }
    if (this.channelMemberDialog) {
      this.channelMemberDialog = false;
    }
    if (this.addMemberDialog) {
      this.addMemberDialog = false;
    }
  }
}
