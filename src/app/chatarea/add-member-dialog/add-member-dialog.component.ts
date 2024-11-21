import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogRef, MatDialogActions, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../models/user/user.model';
import { MatSelectModule } from '@angular/material/select';
import { FilterSelectedPipe } from '../../pipes/filter-selected.pipe';
import { ChatareaServiceService } from '../../firestore-service/chatarea-service.service';
import { MainServiceService } from '../../firestore-service/main-service.service';

@Component({
  selector: 'app-add-member-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatDialogActions,
    MatButtonModule,
    MatSelectModule,
    FilterSelectedPipe,
  ],
  templateUrl: './add-member-dialog.component.html',
  styleUrl: './add-member-dialog.component.scss',
})
export class AddMemberDialogComponent {
  @Output() toggleAddMemberDialog = new EventEmitter<void>();
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: string[] = [];
  memberIds: string[] = [];
  channelName: string = '';

  constructor(private fireService: ChatareaServiceService) {
    this.loadChannelMembers();
    this.loadUsers();
  }

  loadChannelMembers() {
    this.fireService.getActiveChannel().subscribe({
      next: (channel: any) => {
        this.channelName = channel.channel_name;
        this.memberIds = channel.member || [];
        this.filterUsers();
      },
      error: err => {
        console.error('Fehler beim Laden der Mitglieder:', err);
      },
    });
  }

  loadUsers() {
    this.fireService.loadAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.filterUsers(); // Filtere die Benutzer nach dem Laden
      },
      error: err => {
        console.error('Fehler beim Laden der Benutzer:', err);
      },
    });
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => user.id && !this.memberIds.includes(user.id));
  }

  onUserSelected(selectedUserIds: string[]) {
    this.selectedUser = selectedUserIds;
  }

  addUser() {
    this.fireService.addMembersToActiveChannel(this.selectedUser).subscribe({
      next: () => {
        this.closeDialog();
      },
      error: err => {
        console.error('Fehler beim Hinzufügen der Benutzer:', err);
      },
    });
  }

  closeDialog() {
    this.toggleAddMemberDialog.emit();
  }
}
