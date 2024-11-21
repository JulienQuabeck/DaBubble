import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FooterComponent } from '../footer/footer.component';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SignInComponent } from '../sign-in/sign-in.component';
import { NgFor } from '@angular/common';
import { FirebaseLoginService } from '../firebase_LogIn/firebase-login.service';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [MatCardModule, FooterComponent, MatIconModule, RouterModule, SignInComponent, NgFor],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss',
})
export class ChooseAvatarComponent {
  userId: any = '';

  constructor(private router: Router, private route: ActivatedRoute, private firebase: FirebaseLoginService) { }

  avatar: string[] = ['Elias_Neumann', 'Elise_Roth', 'Frederik_Beck', 'Noah_Braun', 'Sofia_Müller', 'Steffen_Hoffmann'];

  Userregistrated: boolean = false;
  chosenImage: string = 'assets/img/01_onboarding-login-signup/Profil_Default.png';
  newUrl: string = '';

  /**
   * This function will update the database with a new account photo and will send the user back to the login page
   */
  async registerCompleted() {
    this.Userregistrated = true;
    this.getIDfromURL();
    await this.firebase.updateAvatar(this.chosenImage, this.userId);
    setTimeout(() => {
      this.Userregistrated = false;
      this.router.navigate(['/']);
    }, 2000);
  }

  /**
   * This function collects the user id from the database
   */
  getIDfromURL() {
    this.userId = this.route.snapshot.paramMap.get('id');
  }

  /**
   * This function updates the variable "ChosenImage" to the url of the new image
   * @param name name of the image
   */
  changeImage(name: string) {
    this.chosenImage = `./assets/img/00_general-buttons/characters/${name}.png`;
  }

  /**
   * This function uploads an image of the users computer instead of choosing one of the given ones
   * @param event
   */
  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      const reader = new FileReader();
      reader.onload = e => {
        this.chosenImage = e.target?.result as string; // Setze das Bild auf die hochgeladene Datei
      };
      reader.readAsDataURL(file); // Liest die Datei als Daten-URL
      // Reset das Input-Feld
      target.value = ''; // Setzt das Input-Feld zurück
    }
  }
}
