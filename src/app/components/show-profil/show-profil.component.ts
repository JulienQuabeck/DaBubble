import { CurrentUserService } from './../../modules/current-user.service';
import { Component, Input, OnInit } from '@angular/core';
import { ShowProfilService } from '../../modules/show-profil.service';
import { UpdateProfilService } from '../../modules/update-profil.service';
import { User } from '../../modules/database.model';
import { DatabaseServiceService } from '../../database-service.service';
import { UserService } from '../../modules/user.service';
import { CommonModule } from '@angular/common';
import { map, Subscription } from 'rxjs';
import { AuthService } from '../../firestore-service/auth.service';

@Component({
  selector: 'app-show-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './show-profil.component.html',
  styleUrl: './show-profil.component.scss',
})
export class ShowProfilComponent implements OnInit {
  open_show_profile!: boolean;
  open_show_profile_nav!: boolean;
  open_update_profile!: boolean;
  authenticatedUser: User | undefined;
  selectedUser: User = new User();
  onlineUser: any = null;
  @Input() isNavBar: boolean = false;

  private uidSubscription: Subscription | null = null;
  constructor(
    private userService: UserService,
    private showProfileService: ShowProfilService,
    private updateProfilService: UpdateProfilService,
    private databaseService: DatabaseServiceService,
    private currentUserService: CurrentUserService,
    private authService: AuthService
  ) {
    this.showProfileService.open_show_profile$.subscribe(state => {
      this.open_show_profile = state;
    });

    this.showProfileService.open_show_profile_nav$.subscribe(state => {
      this.open_show_profile_nav = state;
    });

    this.updateProfilService.open_update_profil$.subscribe(state => {
      this.open_update_profile = state;
    });

    /**
     * subscribe to selectedUser$ for the selected user object
     */
  }

  ngOnInit(): void {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.databaseService
        .snapUsers()
        .pipe(map(users => users.filter(user => user.id === uid)[0]))
        .subscribe(user => {
          this.authenticatedUser = user;
        });
    });
    // this.databaseService.authenticatedUser().subscribe(user => {
    //   this.authenticatedUser = user;
    // });

    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
    });

    this.currentUserService.onlineUser$.subscribe(user => {
      this.onlineUser = user;
    });
  }

  onCloseShowProfil() {
    if (this.open_show_profile) {
      this.showProfileService.updateProfile();
    }
    if (this.open_show_profile_nav) {
      this.showProfileService.updateNavProfile();
    }
  }

  onOpenUpdateProfil() {
    if (this.open_show_profile_nav) {
      this.showProfileService.updateNavProfile();
    }
    this.updateProfilService.updateProfile();
  }

  onAutoFocus() {
    this.showProfileService.emitAutoFocus(true);
    this.onCloseShowProfil();
  }
}
