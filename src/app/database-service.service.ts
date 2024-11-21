import { Injectable, OnInit } from '@angular/core';
import { addDoc, collection, collectionData, deleteDoc, doc, Firestore, getDoc, getDocs, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { User, Message, Channel, ChannelMember } from './modules/database.model';
import { BehaviorSubject, map, Observable, Subject, Subscription } from 'rxjs';
import { getAuth } from 'firebase/auth';
import { CurrentUserService } from './modules/current-user.service';
import { AuthService } from './firestore-service/auth.service';

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
  currentUserRef!: any;
  authenticatedUserId: string | null = null

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

  constructor(private firestore: Firestore, private authService: AuthService) {
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
    this.authService.getUIDObservable().subscribe((uid: string | null) => {
      this.authenticatedUserId = uid;
    });
    return new Observable(observer => {
      const unsubscribe = onSnapshot(this.getChannelsRef(), snapshot => {
        const channels: Channel[] = [];
        snapshot.forEach(element => {
          const data = element.data();
          if (data['member'] && data['member'].includes(this.authenticatedUserId)) {
            channels.push(new Channel(data));
          }
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
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      return;
    }
  }

  async addMessage(newMessage: object) {
    try {
      const docRef = await addDoc(this.getMessagesRef(), newMessage);
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
    }
    return;
  }

  async addChannel(channel: object) {
    try {
      const docRef = await addDoc(this.getChannelsRef(), channel);
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      return;
    }
  }

  async addMemberToChannel(member: object) {
    try {
      const docRef = await addDoc(this.getChannelMemberRef(), member);
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
    const userQuery = query(this.getUsersRef(), where('id', '==', userId));

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
    return this.snapChannels().pipe(map(channels => channels.filter(channel => channel?.channel_name?.toLowerCase() === 'office-team')[0]));
  }

  async getDocumentIdByMemberId(collectionName: string, field: string, parameter: any) {
    const collectionRef = collection(this.firestore, collectionName);
    if (parameter) {
      const q = query(collectionRef, where(field, '==', parameter));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        return docSnapshot.id;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  async deleteDocument(collectionName: string, field: string, parameter: any) {
    const docId = await this.getDocumentIdByMemberId(collectionName, field, parameter);
    if (docId) {
      const userDocRef = doc(this.firestore, collectionName, `${docId}`);
      try {
        await deleteDoc(userDocRef);
      } catch (e) {
        console.error('Document not deleted: ', e);
      }
    }
  }

  getChannelAdmin(admin_id: string): Observable<User> {
    return this.snapUsers().pipe(map(users => users.filter(user => user.id === admin_id)[0]));
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

  // authenticatedUser(): Observable<User> {
  //   return this.snapUsers().pipe(map(users => users.filter(user => user.online === true)[0]));
  // }

  async authUser(userId: string | undefined) {
    if (userId) {
      const userRef = doc(this.getUsersRef(), userId);
      let user = await getDoc(userRef);
      return user.data() as User;
    }
    return;
  }

  /**
   *
   * @param {string} currentUserId - Id of the current user
   * @returns {Observable<Message[]>} - Messages to the user or from the user whose Id is
   * passed as input
   */
  directMessages(currentUserId: string | undefined): Observable<Message[]> {
    return this.snapMessages().pipe(
      map(messages => {
        return messages.filter(message => message.from_user === currentUserId || message.to_user === currentUserId);
      })
    );
  }

  async getDocumentIdByUserId(collectionName: string, userId: string) {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where('id', '==', userId));
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
      } catch (error) {
        console.error('Error updating document: ', error);
      }
    } else {
      console.log(`No ${collectionName} found with ID:', ${docId}`);
    }
  }
}
