import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpdateProfilService {
  private logSubject = new BehaviorSubject<boolean>(false);
  constructor() {}
  open_update_profil$ = this.logSubject.asObservable();
  isDialogOpen = false;

  updateProfile() {
    this.isDialogOpen = !this.isDialogOpen;
    this.logSubject.next(this.isDialogOpen);
  }
}
