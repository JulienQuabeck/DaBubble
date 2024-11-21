import { Injectable } from '@angular/core';
import { User } from '../../../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }

  private user: User = new User;

  /**
   * This function creates a new user
   * @param user user-data
   */
  setUser(user: any) {
    this.user = user;
  }

  /**
   * This function returns the user-object
   * @returns the user object
   */
  getUser() {
    return this.user;
  }

}
