import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-add-user-name',
  standalone: true,
  imports: [],
  templateUrl: './add-user-name.component.html',
  styleUrl: './add-user-name.component.scss',
})
export class AddUserNameComponent {
  @Output() close = new EventEmitter<void>();

  closeDialog() {
    this.close.emit();
  }
}
