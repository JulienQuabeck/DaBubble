import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { Channel, ChannelMember, User } from './database.model';
import { collection, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  private isChannelSource = new Subject<boolean>();
  private channelMemberSource = new ReplaySubject<ChannelMember[]>(1);
  private logFilteredUserSubject = new ReplaySubject<User[]>(1);
  private pickedUserObjSubject = new ReplaySubject<User[]>(1);
  private logFilteredChannelsSubject = new ReplaySubject<Channel[]>(1);
  private logUserSubject = new ReplaySubject<string[]>(1);
  private logSubject = new BehaviorSubject<boolean>(false);
  private openMessageContainerSubject = new BehaviorSubject<'wrapper_1' | 'wrapper_2' | 'wrapper_3'>('wrapper_1');
  private openLogoutContainerSubject = new BehaviorSubject<boolean>(false);
  private logchosenSubject = new BehaviorSubject<boolean>(false);
  private mobileChannelSubject = new BehaviorSubject<boolean>(false);
  private openLeftMenuSubject = new BehaviorSubject<boolean>(false);
  showChannelMsg$ = this.isChannelSource.asObservable();
  channelMembers$ = this.channelMemberSource.asObservable();
  userPicked$ = this.logUserSubject.asObservable();
  filtered_users$ = this.logFilteredUserSubject.asObservable();
  pickedUserObj$ = this.pickedUserObjSubject.asObservable();
  filtered_channels$ = this.logFilteredChannelsSubject.asObservable();
  open_update_channel$ = this.logSubject.asObservable();
  chosen$ = this.logchosenSubject.asObservable();
  openMessageMobile$ = this.openMessageContainerSubject.asObservable();
  openLogoutMobile$ = this.openLogoutContainerSubject.asObservable();
  channelMobileInfo$ = this.mobileChannelSubject.asObservable();
  openLeftMenu$ = this.openLeftMenuSubject.asObservable();
  isDialogOpen = false;

  constructor(private firestore: Firestore) {}

  emitChannelView(isShown: boolean) {
    this.isChannelSource.next(isShown);
  }

  emitChannelMembers(members: ChannelMember[]) {
    this.channelMemberSource.next(members);
  }

  editChannelInfos() {
    this.isDialogOpen = !this.isDialogOpen;
    this.logSubject.next(this.isDialogOpen);
  }

  emitFilteredUsers(users: User[]) {
    this.logFilteredUserSubject.next(users);
  }
  emitPickedUsersObj(users: User[]) {
    this.pickedUserObjSubject.next(users);
  }

  emitFilteredChannels(channels: Channel[]) {
    this.logFilteredChannelsSubject.next(channels);
  }

  emitPickedUser(userId: string[]) {
    this.logUserSubject.next(userId);
  }

  async getDocumentIdById(collectionName: string, field: string, parameter: any) {
    const collectionRef = collection(this.firestore, collectionName);
    const q = query(collectionRef, where(field, '==', parameter));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    } else {
      const docSnapshot = querySnapshot.docs[0];
      return docSnapshot.id;
    }
  }

  async updateChannelData(collectionName: string, field: string, parameter: any, editedData: object) {
    const docId = await this.getDocumentIdById(collectionName, field, parameter);
    if (docId) {
      const userDocRef = doc(this.firestore, `${collectionName}/${docId}`);
      try {
        await updateDoc(userDocRef, editedData);
      } catch (error) {}
    }
  }

  emitOpenMessageMobile(value: 'wrapper_1' | 'wrapper_2' | 'wrapper_3') {
    this.openMessageContainerSubject.next(value);
  }
  emitLogoutMobile() {
    this.isDialogOpen = !this.isDialogOpen;
    this.openLogoutContainerSubject.next(this.isDialogOpen);
  }
  emitOpenLeftMenu() {
    this.isDialogOpen = !this.isDialogOpen;
    this.openLeftMenuSubject.next(this.isDialogOpen);
  }

  onDisplayMobileChannelInfo(val: boolean) {
    this.mobileChannelSubject.next(val);
  }
}
