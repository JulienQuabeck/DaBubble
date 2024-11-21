import { Injectable } from '@angular/core';
import { DocumentReference, Firestore, addDoc, arrayUnion, collection, collectionData, doc, docData, getDoc, getDocs, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { Observable, Subscription, catchError, filter, from, map, of, switchMap } from 'rxjs';
import { MainServiceService } from './main-service.service';
import { AuthService } from './auth.service';
import { CollectionReference, arrayRemove, deleteDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class ChatareaServiceService {
  uid: string | null = null;
  private uidSubscription: Subscription | null = null;

  constructor(private firestore: Firestore, private mainService: MainServiceService, private authService: AuthService) {
    this.uidSubscription = this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.uid = uid;
    });
  }

  ngOnDestroy() {
    if (this.uidSubscription) {
      this.uidSubscription.unsubscribe();
    }
  }

  async getMessageByIdOnce(channelId: string, messageId: string): Promise<any> {
    const messageRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    const messageSnap = await getDoc(messageRef);
    return messageSnap.data();
  }

  /**
   * Loads a Firestore document and returns an observable with its data.
   * @param {string} collection - The Firestore collection name.
   * @param {string} docId - The ID of the document to load.
   * @returns {Observable<any>} An observable that emits the document data.
   */
  loadDocument(collection: string, docId: string): Observable<any> {
    return new Observable(observer => {
      const docRef = this.mainService.getSingleChannelRef(collection, docId);
      onSnapshot(docRef, snapshot => {
        if (snapshot.exists()) observer.next({ id: snapshot.id, ...snapshot.data() });
      });
    });
  }

  getUserAvatar(docId: string): Observable<string | null> {
    return this.loadDocument('users', docId).pipe(map(user => user?.avatar || null));
  }

  getActiveChannel(): Observable<any> {
    return this.authService.getUIDObservable().pipe(
      filter(uid => !!uid),
      switchMap(uid => new Observable(observer => {
        const userDoc = doc(this.firestore, `users/${uid}`);
        onSnapshot(userDoc, userSnap => {
          const channelId = userSnap.data()?.['activeChannelId'];
          if (channelId) this.subscribeToChannel(channelId, observer);
        });
      }))
    );
  }

  private subscribeToChannel(channelId: string, observer: any) {
    const channelDoc = doc(this.firestore, `channels/${channelId}`);
    onSnapshot(channelDoc, channelSnap => {
      if (channelSnap.exists()) observer.next({ id: channelSnap.id, ...channelSnap.data() });
    });
  }

  leaveActiveChannel(): Observable<void> {
    return new Observable((observer) => {
      (async () => {
        try {
          const userRef = doc(this.firestore, `users/${this.uid}`);
          const userSnap = await getDoc(userRef);
          const channelId = userSnap.data()?.['activeChannelId'];
          await updateDoc(doc(this.firestore, `channels/${channelId}`), { member: arrayRemove(this.uid) });
          //await updateDoc(userRef, { activeChannelId: '' });
          observer.next();
        } catch (error) { observer.error(error); }
      })();
    });
  }

  /**
   * Updates a Firestore channel document with the provided data.
   * @param {string} channelId - The ID of the channel to update.
   * @param {any} updatedData - The data to update in the channel document.
   * @returns {Promise<void>} A promise that resolves when the update is complete.
   */
  updateChannel(channelId: string, updatedData: any): Promise<void> {
    const channelDocRef = this.mainService.getSingleChannelRef('channels', channelId);
    return updateDoc(channelDocRef, updatedData);
  }

  /**
   * Loads all users from the 'users' collection.
   * @returns {Observable<any[]>} An observable that emits an array of user data.
   */
  loadAllUsers(): Observable<any[]> {
    const usersCollectionRef = this.mainService.getChannelRef('users');
    return new Observable((observer) => {
      onSnapshot(usersCollectionRef, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        observer.next(users);
      });
    });
  }

  /**
   * Adds a list of user IDs to the 'member' field of the active channel.
   * @param {string[]} userIds - The list of user IDs to add to the channel.
   * @returns {Observable<void>} An observable that completes when the users are added.
   */
  addMembersToActiveChannel(userIds: string[]): Observable<void> {
    return this.getActiveChannel().pipe(
      switchMap(channel => {
        const channelDocRef = this.mainService.getSingleChannelRef('channels', channel.id);
        return from(updateDoc(channelDocRef, { member: arrayUnion(...userIds) }));
      })
    );
  }

  /**
   * Loads all messages from a specific channel.
   * @param {string} channelId - The ID of the channel to load messages from.
   * @returns {Observable<any[]>} An observable that emits an array of message data.
   */
  loadMessages(channelId: string): Observable<any[]> {
    const messagesCollectionRef = collection(this.firestore, `channels/${channelId}/messages`);
    return new Observable(observer => {
      onSnapshot(messagesCollectionRef, snapshot => {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isOwnMessage: doc.data()['senderId'] === this.uid }));
        observer.next(messages);
      });
    });
  }

  /**
   * Adds a new message to a specific channel.
   * @param {string} channelId - The ID of the channel to add the message to.
   * @param {any} messageData - The message data to add.
   * @returns {Promise<DocumentReference<any>>} A promise that resolves with the reference to the new message.
   */
  addMessage(channelId: string, messageData: any): Promise<DocumentReference<any> | null> {
    const messagesCollectionRef = collection(this.firestore, `channels/${channelId}/messages`);
    if (messageData.content.trim() !== '' || messageData.fileUrl != null || messageData.fileName != null) {
      return addDoc(messagesCollectionRef, messageData);
    } else {
      return Promise.resolve(null);
    }
  }

  async deleteMessageWithSubcollections(channelId: string, messageId: string): Promise<void> {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    await deleteDoc(messageDocRef);
    const repliesCollectionRef = collection(this.firestore, `channels/${channelId}/messages/${messageId}/threads`);
    const repliesSnapshot = await getDocs(repliesCollectionRef);
    const deletePromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

  /**
   * Updates a specific message within the active channel.
   * @param {string} messageId - The ID of the message to update.
   * @param {any} updatedData - The data to update in the message document.
   * @returns {Observable<void>} An observable that completes when the message is updated.
   */
  updateMessage(messageId: string, updatedData: any): Observable<void> {
    return new Observable((observer) => {
      this.getActiveChannel().subscribe({
        next: (channel: any) => {
          const messageDocRef = doc(this.firestore, `channels/${channel.id}/messages`, messageId);
          updateDoc(messageDocRef, updatedData)
            .then(() => observer.next())
        }
      });
    });
  }

  /**
   * Adds a reaction to a specific message.
   * @param {string} channelId - The ID of the channel containing the message.
   * @param {string} messageId - The ID of the message to add the reaction to.
   * @param {string} reactionType - The type of the reaction.
   * @param {string} userId - The ID of the user adding the reaction.
   * @param {string} reactionPath - The path to the reaction image.
   * @returns {Promise<void>} A promise that resolves when the reaction is added.
   */
  async addReactionToMessage(channelId: string, messageId: string, reactionType: string, userId: string, reactionPath: string): Promise<void> {
    const messageDocRef = this.mainService.getSingleChannelRef(`channels/${channelId}/messages`, messageId);
    const messageData = (await getDoc(messageDocRef)).data() || {};
    const reactions = messageData['reactions'] || [];
    const existingReaction = reactions.find((reaction: any) => reaction.type === reactionType && reaction.userId === userId);
    existingReaction ? existingReaction.count++ : reactions.push({ type: reactionType, userId, count: 1, path: reactionPath });
    await updateDoc(messageDocRef, { reactions });
  }

  /**
   * Loads all available reactions from the 'reactions' collection.
   * @returns {Promise<any[]>} A promise that resolves with an array of reaction data.
   */
  async loadReactions(): Promise<any[]> {
    const reactionsRef = this.mainService.getChannelRef('reactions');
    const snapshot = await getDocs(reactionsRef);
    const reactions = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data()['name'],
      path: doc.data()['path']
    }));
    return reactions;
  }

  getAllChannels(): Observable<any[]> {
    const channelsRef = collection(this.firestore, 'channels');
    return collectionData(channelsRef, { idField: 'id' });
  }

  getMessageById(channelId: string, messageId: string): Observable<any> {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    return docData(messageDocRef, { idField: 'id' });
  }
}