import { Component, OnInit } from '@angular/core';
import { ShowProfilService } from '../../modules/show-profil.service';
import { UpdateProfilService } from '../../modules/update-profil.service';
import { DatabaseServiceService } from '../../database-service.service';
import { User } from '../../modules/database.model';
import { FormsModule } from '@angular/forms';
import { doc, Firestore, updateDoc, collection } from '@angular/fire/firestore';
import { AuthService } from '../../firestore-service/auth.service';
import { map, Subscription } from 'rxjs';

@Component({
  selector: 'app-update-profil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './update-profil.component.html',
  styleUrl: './update-profil.component.scss',
})
export class UpdateProfilComponent implements OnInit {
  open_show_profile_nav!: boolean;
  open_update_profil!: boolean;
  authenticatedUser: User | undefined;
  username: string = '';
  user_email: string | undefined = '';
  disable_btn: boolean = false;
  isFormEmpty!: boolean;
  isFormFieldNull!: boolean;
  originalUsername: string = '';
  originalUserEmail: string = '';

  private uidSubscription: Subscription | null = null;
  constructor(
    private firestore: Firestore,
    private showProfileService: ShowProfilService,
    private updateProfilService: UpdateProfilService,
    private databaseService: DatabaseServiceService,
    private authService: AuthService
  ) {
    this.showProfileService.open_show_profile_nav$.subscribe(state => {
      this.open_show_profile_nav = state;
    });
    this.updateProfilService.open_update_profil$.subscribe(state => {
      this.open_update_profil = state;
    });
  }

  ngOnInit(): void {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.authenticatedUser = user;
          this.username = this.authenticatedUser?.name;
          this.user_email = this.authenticatedUser?.email;

          this.originalUsername = this.username;
          this.originalUserEmail = this.user_email;
        });
    });
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  onCloseUpdateProfile() {
    this.updateProfilService.updateProfile();
  }

  save(collectionName: string, userId: string) {
    this.databaseService.updateUserData(collectionName, userId, { email: this.user_email, name: this.username });
    this.updateProfilService.updateProfile();
    this.showProfileService.updateNavProfile();
  }
}
