import { Injectable } from '@angular/core';
import { User } from './database.model';

@Injectable({
  providedIn: 'root',
})
export class GuestService {
  guestData = {
    id: 'uLZkuWo4GcM9ppi1aPMXa',
    name: 'bubble guest',
    email: 'guest@mail.com',
    avatar: 'assets/img/profiles/male_avatar.svg',
    password: '123456789',
    online: true,
    thread_open: false,
    activeChannelId: '',
  };
  constructor() {}
}
