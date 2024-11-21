import { Injectable } from '@angular/core';
import { Firestore, getDoc } from '@angular/fire/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private uidSubject = new BehaviorSubject<string | null>(null);

  constructor(private firestore: Firestore) {
    this.watchAuthState();
  }

  private watchAuthState() {
    const auth = getAuth();
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        this.uidSubject.next(user.uid);
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const docSnapshot = await getDoc(userDocRef);
        if (docSnapshot.exists()) {
          try {
            await updateDoc(userDocRef, { online: true });
          } catch (error) {
            console.error(error);
          }
        }
      } else {
        this.uidSubject.next(null);
      }
    });
  }


  getUIDObservable() {
    return this.uidSubject.asObservable();
  }

  getUID(): string | null {
    return this.uidSubject.getValue();
  }

  async logout() {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, { online: false });
    }
    await auth.signOut();
    this.uidSubject.next(null);
  }
}
