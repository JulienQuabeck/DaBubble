import { Injectable } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, Firestore, FirestoreModule, getDocs, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { FirebaseAppModule } from '@angular/fire/app';
import { User, Message, Channel, ChannelMember } from './modules/database.model';
import { BehaviorSubject, map, Observable, Subject, Subscription, switchMap } from 'rxjs';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class DatabaseServiceService {
  unSubscribeUser;
  unSubscribeMsg;
  userData$: any;
  messageData$: any;
  users: User[] = [new User()];
  messages: Message[] = [new Message()];
  CURRENT_USER: any;

  private logSubject = new BehaviorSubject<User>(new User());
  private usersSubject = new BehaviorSubject<User[]>([new User()]);
  private channelsSubject = new BehaviorSubject<Channel[]>([new Channel()]);
  private channelMemberSubject = new BehaviorSubject<ChannelMember[]>([new ChannelMember()]);
  private messagesSubject = new BehaviorSubject<Message[]>([new Message()]);
  private chatMessagesSubject = new BehaviorSubject<Message[]>([new Message()]);
  private filteredMessagesSource = new Subject<Message[]>();
  private onlineUsersSubject = new BehaviorSubject<any[]>([]);
  private userByIdSubject = new BehaviorSubject<any | null>(null);

  nameState$ = this.logSubject.asObservable();
  users$ = this.usersSubject.asObservable();
  channels$ = this.channelsSubject.asObservable();
  channelMember$ = this.channelMemberSubject.asObservable();
  messages$ = this.messagesSubject.asObservable();

  chatMessages$ = this.chatMessagesSubject.asObservable();
  onlineUsers$ = this.onlineUsersSubject.asObservable();
  filteredMessages$ = this.filteredMessagesSource.asObservable();
  userById$ = this.userByIdSubject.asObservable();

  constructor(private firestore: Firestore) {
    this.unSubscribeUser = this.snapUsers();
    this.unSubscribeMsg = this.snapMessages();
    this.getOnlineUsers();
  }

  ///////////// GET ALL THE COLLECTION REFERENCES FOR THE NEXT SECTION ///////////////////

  getUsersRef() {
    const userRef = collection(this.firestore, 'users');
    return userRef;
  }
  getChannelsRef() {
    const userRef = collection(this.firestore, 'channels');
    return userRef;
  }
  getMessagesRef() {
    const userRef = collection(this.firestore, 'messages');
    return userRef;
  }
  getChannelMemberRef() {
    const channelMemberRef = collection(this.firestore, 'channel_members');
    return channelMemberRef;
  }

  /////////////////////////// CREATE OBSERVABLE TO GET THE DATA FROM FIREBASE //////////////////////////////////

  getAllUsers(): Observable<User[]> {
    const usersCollection = collection(this.firestore, 'users');
    return collectionData(usersCollection, { idField: 'id' }) as Observable<User[]>;
  }
  getAllMessages(): Observable<Message[]> {
    const usersCollection = collection(this.firestore, 'messages');
    return collectionData(usersCollection, { idField: 'id' }) as Observable<Message[]>;
  }

  snapUsers(): Observable<User[]> {
    return new Observable(observer => {
      const unsubscribe = onSnapshot(this.getUsersRef(), snapshot => {
        const users: User[] = [];
        snapshot.forEach(element => {
          users.push(new User(element.data()));
        });
        this.usersSubject.next(users);
        observer.next(users);
      });

      return { unsubscribe };
    });
  }

  snapChannels(): Observable<Channel[]> {
    return new Observable(observer => {
      const unsubscribe = onSnapshot(this.getChannelsRef(), snapshot => {
        const channels: Channel[] = [];
        snapshot.forEach(element => {
          channels.push(new Channel(element.data()));
        });
        this.channelsSubject.next(channels);
        observer.next(channels);
      });

      return { unsubscribe };
    });
  }

  snapMessages(): Observable<Message[]> {
    return new Observable(observer => {
      const unsubscribe = onSnapshot(this.getMessagesRef(), snapshot => {
        const messages: Message[] = [];
        snapshot.forEach(element => {
          messages.push(new Message(element.data()));
        });
        this.messagesSubject.next(messages);
        observer.next(messages);
      });

      return { unsubscribe };
    });
  }

  snapChannelMembers(): Observable<ChannelMember[]> {
    return new Observable(observer => {
      const unsubscribe = onSnapshot(this.getMessagesRef(), snapshot => {
        const members: ChannelMember[] = [];
        snapshot.forEach(element => {
          members.push(new ChannelMember(element.data()));
        });
        this.channelMemberSubject.next(members);
        observer.next(members);
      });

      return { unsubscribe };
    });
  }

  async addUser(newUser: object) {
    try {
      const docRef = await addDoc(this.getUsersRef(), newUser);
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }
  async addMessage(newMessage: object) {
    try {
      const docRef = await addDoc(this.getMessagesRef(), newMessage);
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  async addChannel(channel: object) {
    try {
      const docRef = await addDoc(this.getChannelsRef(), channel);
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }
  async addMemberToChannel(member: object) {
    try {
      const docRef = await addDoc(this.getChannelMemberRef(), member);
      console.log('Document written with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding document: ', e);
    }
  }

  //////////////// MANIPULATE DATA IN THE DATABASE ////////////////////

  /**
   *get the current authenticated user
   * @returns {User}
   */
  getOnlineUsers() {
    const onlineUsersQuery = query(this.getUsersRef(), where('online', '==', true));

    onSnapshot(onlineUsersQuery, snapshot => {
      const onlineUsers = snapshot.docs.map(doc => doc.data());
      this.onlineUsersSubject.next(onlineUsers);
    });
  }

  getUserById(userId: string, callback: (user: any | null) => void) {
    const userQuery = query(this.getUsersRef(), where('user_id', '==', userId));

    onSnapshot(userQuery, snapshot => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        this.userByIdSubject.next(userData);
        callback(userData);
      } else {
        this.userByIdSubject.next(null);
        callback(null);
      }
    });
  }

  getMessages(currentUserId: string | undefined, targetUserId: string, callback: (messages: any[] | null) => void) {
    const messagesQuery = query(this.getMessagesRef(), where('from_user', 'in', [currentUserId, targetUserId]), where('to_user', 'in', [currentUserId, targetUserId]));

    onSnapshot(messagesQuery, snapshot => {
      if (!snapshot.empty) {
        const messages = snapshot.docs.map(doc => doc.data());
        callback(messages);
      } else {
        callback(null);
      }
    });
  }

  getChannelMessages(targetChannelId: string, callback: (messages: any[] | null) => void) {
    const messagesQuery = query(this.getMessagesRef(), where('to_user', '==', targetChannelId));

    onSnapshot(messagesQuery, snapshot => {
      if (!snapshot.empty) {
        const messages = snapshot.docs.map(doc => doc.data());
        callback(messages);
      } else {
        callback(null);
      }
    });
  }

  getChannelMembers(targetChannelId: string, callback: (members: any[] | null) => void) {
    const messagesQuery = query(this.getChannelMemberRef(), where('channel_id', '==', targetChannelId));

    onSnapshot(messagesQuery, snapshot => {
      if (!snapshot.empty) {
        const members = snapshot.docs.map(doc => doc.data());
        callback(members);
      } else {
        callback(null);
      }
    });
  }

  officeTeam(): Observable<Channel> {
    return this.snapChannels().pipe(map(channels => channels.filter(channel => channel.channel_name.toLowerCase() === 'office-team')[0]));
  }

  async getDocumentIdByMemberId(collectionName: string, field: string, parameter: any) {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where(field, '==', parameter));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      return docSnapshot.id;
    } else {
      console.log(`No Member found with ID:', ${parameter}`);
      return null;
    }
  }

  async deleteDocument(collectionName: string, field: string, parameter: any) {
    const docId = await this.getDocumentIdByMemberId(collectionName, field, parameter);
    if (docId) {
      const userDocRef = doc(this.firestore, collectionName, `${docId}`);
      try {
        await deleteDoc(userDocRef);
        console.log(parameter, 'Document deleted');
      } catch (e) {
        console.error('Error adding document: ', e);
      }
    }
  }

  getChannelAdmin(admin_id: string): Observable<User> {
    return this.snapUsers().pipe(map(users => users.filter(user => user.user_id === admin_id)[0]));
  }

  getOfficeTeamMembers(TeamChannelId: string, callback: (members: any[] | null) => void) {
    const channelsQuery = query(this.getChannelMemberRef(), where('channel_id', '==', TeamChannelId));

    onSnapshot(channelsQuery, snapshot => {
      if (!snapshot.empty) {
        const members = snapshot.docs.map(doc => doc.data());
        callback(members);
      } else {
        callback(null);
      }
    });
  }

  authenticatedUser(): Observable<User> {
    return this.snapUsers().pipe(map(users => users.filter(user => user.online === true)[0]));
  }

  /**
   *
   * @param {string} id - Id of the user whose name need to be found
   * @returns {string} - name of the user
   */

  // userFromId(id: string | undefined): Observable<User> {
  //   return this.snapUsers().pipe(
  //     map(users => users.filter(user => user.user_id === id)[0]) // Filter users by the given ID
  //   );
  // }

  // pictureFromId(id: string | undefined): Observable<string> {
  //   return this.snapUsers().pipe(
  //     map(users => users.filter(user => user.user_id === id)[0].image_file) // Filter users by the given ID
  //   );
  // }

  // pictureFromID(id: string): string {
  //   let user = this.users.find(user => user.user_id === id)!;
  //   return `${user?.image_file}`;
  // }
  // nameFromId(id: string | undefined): string {
  //   let user = this.users.find(user => user.user_id === id);
  //   return `${user?.first_name}`;
  // }

  directMessages(currentUserId: string | undefined): Observable<Message[]> {
    return this.snapMessages().pipe(
      map(messages => {
        return messages.filter(message => message.from_user === currentUserId || message.to_user === currentUserId);
      })
    );
  }

  async getDocumentIdByUserId(collectionName: string, userId: string) {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where('user_id', '==', userId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      return docSnapshot.id;
    } else {
      console.log(`No ${collectionName} found with ID:', ${userId}`);
      return null;
    }
  }

  async updateUserData(collectionName: string, userId: string, editedData: object) {
    const docId = await this.getDocumentIdByUserId(collectionName, userId);
    if (docId) {
      const userDocRef = doc(this.firestore, `${collectionName}/${docId}`);
      try {
        await updateDoc(userDocRef, editedData);
        console.log('Document successfully updated!');
      } catch (error) {
        console.error('Error updating document: ', error);
      }
    } else {
      console.log(`No ${collectionName} found with ID:', ${docId}`);
    }
  }
}