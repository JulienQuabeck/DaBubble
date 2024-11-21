import { Injectable, OnInit } from '@angular/core';
import { collection, Firestore, onSnapshot, query, where } from '@angular/fire/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CurrentUserService {
  private authUserSubject = new BehaviorSubject<string | null>(null);
  private onlineUserSubject = new BehaviorSubject<any>(null);
  userID$ = this.authUserSubject.asObservable();
  onlineUser$ = this.onlineUserSubject.asObservable();
  constructor(private firestore: Firestore) {
    this.userSession();
  }

  userSession() {
    const auth = getAuth();
    onAuthStateChanged(auth, (user: User | null) => {
      if (user && user !== null) {
        this.authUserSubject.next(user.uid);
      } else {
        this.authUserSubject.next(null);
      }
    });
  }

  getGuestUser() {
    const onlineUsersQuery = query(collection(this.firestore, 'users'), where('name', '==', 'bubble guest'));

    onSnapshot(onlineUsersQuery, snapshot => {
      const onlineUsers = snapshot.docs.map(doc => doc.data())[0];
      this.onlineUserSubject.next(onlineUsers);
    });
  }
}
