import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, updateProfile } from 'firebase/auth';
import { FirebaseLoginService } from '../../firebase_LogIn/firebase-login.service';

@Injectable({
  providedIn: 'root'
})
export class UpdateNameService {

  //private auth = getAuth(initializeApp(this.firebase.firebaseConfig));
  //user = this.auth.currentUser;

  constructor(private firebase: FirebaseLoginService) { }

  /**
   * This function updates the name of the user
   * @param newName new Username
   */
  updateUserName(newName: string) {
    //   if (this.user) {
    //     updateProfile(this.user, {
    //       displayName: newName
    //     }).then(() => {
    //       // Profil erfolgreich aktualisiert
    //       console.log("Name wurde erfolgreich aktualisiert");
    //     }).catch((error) => {
    //       // Fehler bei der Aktualisierung
    //       console.error("Fehler beim Aktualisieren des Namens: ", error);
    //     });
    //   } else {
    //     console.error("Kein Benutzer angemeldet.");
    //   }
  }
}
