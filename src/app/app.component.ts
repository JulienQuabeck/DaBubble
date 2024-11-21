import { Component } from '@angular/core';
import { MainComponentComponent } from './main-component/main-component.component';
import { ChatareaComponent } from "./chatarea/chatarea.component";
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MainComponentComponent, ChatareaComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'dabubble';
}
