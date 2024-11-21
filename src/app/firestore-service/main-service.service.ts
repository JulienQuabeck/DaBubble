import { Injectable } from '@angular/core';
import { Firestore, collection, doc, updateDoc, getDocs, docData, getDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { getAuth, User } from 'firebase/auth';
import { AuthService } from './auth.service';
import { Observable, Subscription, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MainServiceService {
  uid: string | null = null;
  private uidSubscription: Subscription | null = null;

  constructor(private firestore: Firestore, private route: ActivatedRoute, private router: Router, private authService: AuthService) {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  /**
 * Returns a reference to a Firestore collection based on the provided collection ID.
 * @param {string} colId - The ID of the collection.
 * @returns {CollectionReference} A reference to the specified Firestore collection.
 */
  getChannelRef(colId: string) {
    return collection(this.firestore, colId);
  }

  /**
   * Returns a reference to a Firestore document within a collection based on the provided collection and document IDs.
   * @param {string} colId - The ID of the collection.
   * @param {string} docId - The ID of the document within the collection.
   * @returns {DocumentReference} A reference to the specified Firestore document.
   */
  getSingleChannelRef(colId: string, docId: string) {
    return doc(collection(this.firestore, colId), docId);
  }

  /**
   * Retrieves all document IDs from a specific Firestore collection.
   * @param {string} colId - The ID of the collection.
   * @returns {Promise<string[]>} A promise that resolves to an array of document IDs.
   */
  async getDocIdsByColId(colId: string): Promise<string[]> {
    const collectionRef = collection(this.firestore, colId);
    const snapshot = await getDocs(collectionRef);
    const docIds = snapshot.docs.map(doc => doc.id);
    return docIds;
  }

  /**
   * Updates a Firestore document by assigning a document ID to the specified field.
   * @param {string} colId - The ID of the collection.
   * @param {string} docId - The ID of the document to update.
   * @returns {Promise<void>} A promise that resolves when the document is updated.
   */
  async assignDocId(colId: string, docId: string): Promise<void> {
    const docRef = this.getSingleChannelRef(colId, docId);
    return updateDoc(docRef, {
      docId: docId
    });
  }

  /**
 * Formats a time string into HH:MM format.
 * @param {string} timeString - The time string to format.
 * @returns {string} The formatted time string.
 */
  formatTime(timeString: string): string {
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Formats a date string into 'heute' if the date is today, otherwise returns a localized date string.
   * @param {string} dateString - The date string to format.
   * @returns {string} The formatted date string in the format 'Freitag, 08. November 2024'.
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'heute';
    }
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    };
    return date.toLocaleDateString('de-DE', options);
  }


  async setThreadOpenFalse(): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${this.uid}`);
    await updateDoc(userDocRef, { thread_open: false });
  }

  getThreadOpen(uid: string): Observable<boolean> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return docData(userDocRef).pipe(
      map(userData => {
        if (userData && 'thread_open' in userData) {
          return userData['thread_open'] === true;
        } else {
          return false;
        }
      })
    );
  }

  async checkAndUpdateChannelMembers(): Promise<string[]> {
    const channelRef = this.getSingleChannelRef('channels', 'Za3v5gMhmXHumJr7483M');
    const channelSnap = await getDoc(channelRef);
    if (!channelSnap.exists()) {
      return [];
    }
    const channelData = channelSnap.data();
    const members = channelData['member'] || [];
    const usersCollectionRef = collection(this.firestore, 'users');
    const userDocsSnap = await getDocs(usersCollectionRef);
    const allUserIds = userDocsSnap.docs.map(doc => doc.id);
    const missingIds = allUserIds.filter(userId => !members.includes(userId));
    if (missingIds.length > 0) {
      const updatedMembers = [...members, ...missingIds];
      await updateDoc(channelRef, { member: updatedMembers });
      return updatedMembers;
    } else {
      return members;
    }
  }
}