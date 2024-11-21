import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  MatDialogRef,
  MatDialogActions,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profil-member-dialog',
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
  ],
  templateUrl: './profil-member-dialog.component.html',
  styleUrl: './profil-member-dialog.component.scss'
})
export class ProfilMemberDialogComponent {
  constructor(public dialogRef: MatDialogRef<ProfilMemberDialogComponent>) { }

  closeDialog() {
    this.dialogRef.close();
  }
}
