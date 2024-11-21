import { Component } from '@angular/core';
import { FirebaseLoginService } from '../firebase_LogIn/firebase-login.service';
import { ActivatedRoute } from '@angular/router';
import { collection, doc } from 'firebase/firestore';
import { Firestore, getFirestore } from 'firebase/firestore';
import { inject } from '@angular/core';
import { UserService } from '../service/user.service/user.service';

@Component({
  selector: 'app-desktop',
  standalone: true,
  imports: [],
  templateUrl: './desktop.component.html',
  styleUrl: './desktop.component.scss',
})
export class DesktopComponent {
  userId: any = '';
  img: string = '';
  name: string = '';

  constructor(private firebase: FirebaseLoginService, private route: ActivatedRoute, private userService: UserService) {
    this.loadData();
  }

  loadData() {
    let user = this.userService.getUser();

    this.name = user.name;
    this.img = user.avatar;
  }
}
