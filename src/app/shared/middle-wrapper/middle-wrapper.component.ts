import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-middle-wrapper',
  standalone: true,
  imports: [],
  templateUrl: './middle-wrapper.component.html',
  styleUrl: './middle-wrapper.component.scss',
})
export class MiddleWrapperComponent {
  @Input() hasDefaultPadding: boolean = true;
}
