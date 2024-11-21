import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FooterComponent } from '../footer/footer.component';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { SignInComponent } from '../sign-in/sign-in.component';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { FirebaseLoginService } from '../firebase_LogIn/firebase-login.service';
import { PasswordResetService } from '../password_Reset/password-reset.service';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";


@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [
    MatCardModule,
    FooterComponent,
    MatIconModule,
    RouterModule,
    SignInComponent,
    FormsModule,
    NgIf,
    NgClass
  ],
  templateUrl: './new-password.component.html',
  styleUrl: './new-password.component.scss'
})
export class NewPasswordComponent {

  mailSent: boolean = false;
  wrongMail: boolean = false;

  email: string = '';
  message: string = '';

  constructor(private router: Router, private firebase: FirebaseLoginService, private resetService: PasswordResetService) {

  }

  data = {
    mail: ''
  }

  mail: string = '';
  http = inject(HttpClient);
  auth = getAuth();

  /**
   * This function trigggers functions who send a Mail to the given mail adress to change the password
   * @param ngForm data of the form (mail adress)
   */
  async onSubmit(ngForm: NgForm) {
    this.email = ngForm.value.email;
    if (await this.firebase.findUserWithRef("email", this.email)) {
      if (ngForm.valid && ngForm.submitted) {
        this.resetService.resetPassword(this.email);
        this.displayMailsentFeedback();
        this.resetMailsentFeedback();
        this.resetService.redirectToLogin();
      }
    } else {
      this.displayWrongMailError();
      this.resetDisplayWrongMailError();
    }
  }

  /**
  * This function sets the variable of the "mailsent"-Feedback to true, sothat the feedback will be displayed
  */
  displayMailsentFeedback() {
    this.mailSent = true;
  }

  /**
   * This function resets the variable which displays the "mail sent" Feedback
   */
  resetMailsentFeedback() {
    setTimeout(() => {
      this.mailSent = false;
    }, 2000);
  }

  /**
   * This function sets the variable of the "wrong Email"-Error to true, sothat the error will be displayed
   */
  displayWrongMailError() {
    this.wrongMail = true;
  }

  /**
   * This function resets the variable which displays the "wrong Email" Error
   */
  resetDisplayWrongMailError() {
    setTimeout(() => {
      this.wrongMail = false;
    }, 2000);
  }

}
