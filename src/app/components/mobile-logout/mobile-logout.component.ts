import { Component } from '@angular/core';
import { UserService } from '../../modules/user.service';
import { DatabaseServiceService } from '../../database-service.service';
import { ShowProfilService } from '../../modules/show-profil.service';
import { ChannelService } from '../../modules/channel.service';
import { AuthService } from '../../firestore-service/auth.service';
import { Router } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { User } from '../../modules/database.model';

@Component({
  selector: 'app-mobile-logout',
  standalone: true,
  imports: [],
  templateUrl: './mobile-logout.component.html',
  styleUrl: './mobile-logout.component.scss',
})
export class MobileLogoutComponent {
  open_show_profile_nav!: boolean;
  authenticatedUser: User | undefined;
  selectedUser: User | undefined;
  private uidSubscription: Subscription | null = null;
  constructor(
    private userService: UserService,
    private showProfileService: ShowProfilService,
    private databaseService: DatabaseServiceService,
    private channelService: ChannelService,
    private authService: AuthService,
    private router: Router
  ) {
    this.showProfileService.open_show_profile_nav$.subscribe(state => {
      this.open_show_profile_nav = state;
    });
  }

  ngOnInit(): void {
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

    /**
     * subscribe to selectedUser$ for the selected user object
     */
    this.userService.selectedUser$.subscribe(selected_user => {
      this.selectedUser = selected_user;
    });
  }

  onOpenShowProfile() {
    this.showProfileService.updateNavProfile();
  }

  sendSelectedUser(user: User) {
    this.userService.emitSelectedUser(user);
  }

  logout() {
    localStorage.removeItem('currentName');
    localStorage.removeItem('authUser');
    localStorage.removeItem('currentState');
    localStorage.removeItem('selectedUser');
    localStorage.removeItem('guest');
    this.authService.logout();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }
}
