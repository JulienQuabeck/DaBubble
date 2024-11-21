import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ShowProfilService {
  private logSubject = new BehaviorSubject<boolean>(false);
  private logProfileSubject = new BehaviorSubject<boolean>(false);
  private logAutoFocusSubject = new BehaviorSubject<boolean>(false);
  open_show_profile$ = this.logSubject.asObservable();
  open_show_profile_nav$ = this.logProfileSubject.asObservable();
  auto_focus$ = this.logAutoFocusSubject.asObservable();
  isDialogOpen = false;

  constructor() {}

  updateProfile() {
    this.isDialogOpen = !this.isDialogOpen;
    this.logSubject.next(this.isDialogOpen);
  }
  updateNavProfile() {
    this.isDialogOpen = !this.isDialogOpen;
    this.logProfileSubject.next(this.isDialogOpen);
  }
  emitAutoFocus(value: boolean) {
    this.logAutoFocusSubject.next(value);
  }
}
