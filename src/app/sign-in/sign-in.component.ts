import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FooterComponent } from '../footer/footer.component';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { ChooseAvatarComponent } from '../choose-avatar/choose-avatar.component';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass } from '@angular/common';
import { FirebaseLoginService } from '../firebase_LogIn/firebase-login.service';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    FooterComponent,
    MatCardModule,
    MatIconModule,
    RouterModule,
    ChooseAvatarComponent,
    FormsModule,
    NgClass
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {

  data = {
    id: '',
    name: '',
    mail: '',
    password: '',
    avatar: '',
    online: false,
  }

  name: string = '';
  mail: string = '';
  password: string = '';
  privacyPolicy: boolean = false;

  displayMailError: boolean = false;
  displayNameError: boolean = false;
  displayPasswordError: boolean = false;
  displayPrivatPolicyError: boolean = false;
  passwordNotLongEnough: boolean = false;
  displayPasswordNotLongEnough: boolean = false;

  emptyInputs: boolean = true;

  constructor(private router: Router, private firebase: FirebaseLoginService) {

  }

  /**
   * This function activates the button if all inputs are filled and calls several control functions
   */
  checkInputs() {
    if (this.name && this.mail && this.password && this.privacyPolicy) {
      this.emptyInputs = false;
    }
    this.checkNameInput();
    this.checkMailInput();
    this.checkPasswordInput();
    this.checkPrivacyPolicyInput();
  }

  /**
   * This function checks if the name Input was already filled, if yes it displays an error-message
   */
  checkNameInput() {
    if (!this.name) {
      this.displayNameError = true;
    } else {
      this.displayNameError = false;
    }
  }

  /**
  * This function checks if the mail Input was already filled, if yes it displays an error-message
  */
  checkMailInput() {
    if (!this.mail) {
      this.displayMailError = true;
    } else {
      this.displayMailError = false;
    }
  }

  /**
  * This function checks if the password Input was already filled, if yes it displays an error-message
  */
  checkPasswordInput() {
    if (!this.password || this.password.length < 6) {
      this.displayPasswordError = true;
    } else {
      this.displayPasswordError = false;
    }
  }

  // /**
  //  * This function checks the length of the Password
  //  */
  // checkPasswordLength() {
  //   if (this.password.length < 6) {
  //     this.passwordNotLongEnough = true;
  //     this.displayPasswordLengthError
  //   } else {
  //     this.passwordNotLongEnough = false;
  //   }
  // }

  // /**
  //  * If the Password is not long enough, an Error will be displayed
  //  */
  // displayPasswordLengthError() {
  //   if (this.passwordNotLongEnough) {
  //     this.displayPasswordNotLongEnough = true;
  //   } else {
  //     this.displayPasswordNotLongEnough = false;
  //   }
  // }

  /**
  * This function checks if the Privacy Policy Checkbox was already marked, if yes it displays an error-message
  */
  checkPrivacyPolicyInput() {
    if (!this.privacyPolicy) {
      this.displayPrivatPolicyError = true;
    } else {
      this.displayPrivatPolicyError = false;
    }
  }

  /**
   * This function empties all Inputs
   */
  emptyAllInputs() {
    this.name = '';
    this.mail = '';
    this.password = '';
    this.privacyPolicy = false;
  }

  /**
   * This function sets the given data to a correct user data structure
   */
  setData() {
    this.data.name = this.name;
    this.data.mail = this.mail;
    this.data.password = this.password;
    this.data.avatar = '';
    this.data.online = false;
  }

  /**
   * This function creates a user-obj in the firebase authenticator and sends the user to the chosseAvatar site
   */
  async onSubmit() {
    if (await this.firebase.findUserWithRef('email', this.mail) == false) {
      this.setData();
      let user = this.firebase.setUserObject(this.data);
      let id = await this.firebase.addUserInAuth(user.mail, user.password, user.name);
      this.router.navigate(['/chooseAvatar', id]);
      this.emptyAllInputs();
    } else {
      this.displayMailErrorFor3Sec();
    }
  }

  /**
   * This function displays an Error under the E-Mail-Input for 3 sec.
   */
  displayMailErrorFor3Sec() {
    this.displayMailError = true;
    setTimeout(() => {
      this.displayMailError = false;
    }, 3000);
  }

}