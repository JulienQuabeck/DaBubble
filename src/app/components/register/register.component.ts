import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth, getAuth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  name!: string;
  email!: string;
  password!: string;

  constructor(private auth: Auth) {}

  aut = getAuth();
  onRegister(emailAdress: string, password: string, name: string) {
    if (!this.validateEmail(emailAdress)) {
      console.error('Invalid email format');
      return;
    }
    createUserWithEmailAndPassword(this.aut, emailAdress, password)
      .then(userCredential => {
        const user = userCredential.user;
        return updateProfile(user, { displayName: name });
      })
      .then(() => console.log('User registered and name updated successfully'))
      .catch(error => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  }

  validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  }
}
