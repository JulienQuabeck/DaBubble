import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavService {
  private stateSubject = new BehaviorSubject<boolean>(false);
  private stateOpenDevSearchSubject = new BehaviorSubject<boolean>(false);
  private searchInputSubject = new BehaviorSubject<string>('');
  constructor() {}
  state$ = this.stateSubject.asObservable();
  stateOpenDevSearch$ = this.stateOpenDevSearchSubject.asObservable();
  search_input$ = this.searchInputSubject.asObservable();
  isDialogOpen = false;

  createChannel() {
    this.isDialogOpen = !this.isDialogOpen;
    this.stateSubject.next(this.isDialogOpen);
  }

  emitOpenDevSearch(bool: boolean) {
    this.stateOpenDevSearchSubject.next(bool);
  }

  emitSearchInput(input: string) {
    this.searchInputSubject.next(input);
  }
}
