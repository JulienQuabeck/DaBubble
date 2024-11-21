import { Injectable } from '@angular/core';
import { User } from '../../models/user.class';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { collection, doc, Firestore, getDocs, query, setDoc, updateDoc, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseLoginService {
  constructor(private firestore: Firestore, public auth: Auth) {
  }

  /**
   * This function returns the UserRef from Firebase
   * @returns UserRef from Firebase
   */
  getUserRef() {
    return collection(this.firestore, 'users');
  }

  /**
   * This function returns the DocRef from Firebase
   * @param colId id of the collection
   * @param docId id of the document
   * @returns the docId / docRef
   */
  getSingleUserRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  /**
   * This function sets all given data to a structured user Object
   * @param obj userdata
   * @returns the user object
   */
  setUserObject(obj: any): User {
    return {
      id: obj.id || 'default',
      name: obj.name || '',
      mail: obj.mail || '',
      password: obj.password || '',
      avatar: obj.avatar || 'default',
      online: obj.online || false,
    };
  }

  /**
   * This function creates a User in the Firebase AUthentivator
   * @param email E-Mail of the user
   * @param password Password of the user
   * @param name Jame of the user
   * @returns the user ID
   */
  async addUserInAuth(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      this.saveUserDataToDatabase(user.uid, user.email, name, password);
      return user.uid;
    } catch (error) {
      console.error('Fehler bei der Registrierung:', error);
      return 'error';
    }
  }

  /**
   * This function creates a User in the Firestore database
   * @param uid id of the user
   * @param email E-Mail of the user
   */
  saveUserDataToDatabase(uid: string, email: any, name: string, password: string) {
    const userRef = doc(this.firestore, 'users', uid);
    setDoc(userRef, {
      name: name,
      email: email,
      online: false,
      avatar: '',
      id: uid,
    })
      .then(() => {
        return uid;
      })
      .catch(error => {
        console.error('Fehler beim Speichern des Benutzers:', error);
      });
  }

  /**
   * This functionupdates the avatar of the user
   * @param chosenAvatar the link of the profil picture
   * @param id the user-id (DocRef of firebase)
   */
  async updateAvatar(chosenAvatar: string, id: any) {
    let user = doc(this.firestore, 'users', id);
    await updateDoc(user, {
      avatar: chosenAvatar,
    });
  }

  /**
  * This functionupdates the avatar of the user
  * @param password the password
  * @param id the user-id (DocRef of firebase)
  */
  async updatePassword(password: string, id: any) {
    let user = doc(this.firestore, "users", id)
    await updateDoc(user, {
      password: password,
    });
  }

  /**
   * This function checks, if the entered Email exists in die firebase database or not
   * @param email entered Email
   * @returns the User who belongs to the entered mail-adress
   */
  async gettingQuery(searchDocRef: string, value: string) {
    const q = query(this.getUserRef(), where(searchDocRef, '==', value));
    const querySnapshot = await getDocs(q);
    return querySnapshot;
  }

  /**
   * This function checks, if the entered Email exists in the firebase database or not.
   * @param email in the form entered Email
   * @returns true / false
   */
  async findUserWithRef(searchRef: string, value: string) {
    try {
      const querySnapshot = await this.gettingQuery(searchRef, value);
      return !querySnapshot.empty;
    } catch (err) {
      console.error('Error checking email existence: ', err);
      return false;
    }
  }
}
