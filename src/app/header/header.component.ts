import { Component, OnInit } from '@angular/core';
import { SignInComponent } from '../sign-in/sign-in.component';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    SignInComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const intro = document.getElementById("intro");
        const intro2 = document.getElementById("intro2");
        const introElem1 = document.getElementById("introElem1")
        const introElem2 = document.getElementById("introElem2")
        if (intro && intro2 && introElem1 && introElem2) {
          // Prüfen, ob die Seite in der aktuellen Sitzung bereits besucht wurde
          if (sessionStorage.getItem("hasVisited")) {
            // Intro ausblenden
            intro.classList.add("animation-finished");
            intro2.classList.add("animation-finished");
            introElem1.classList.add("animation-finished");
            introElem2.classList.add("animation-finished");
          } else {
            // Intro anzeigen und Flag in SessionStorage setzen
            sessionStorage.setItem("hasVisited", "true");

            // Nach der Animation das Intro ausblenden
            setTimeout(() => {
              intro.classList.add("animation-finished");
              intro2.classList.add("animation-finished");
              introElem1.classList.add("animation-finished");
              introElem2.classList.add("animation-finished");
            }, 3000); // 3000 ms entspricht 3 Sekunden Animation
          }
        }
      });
  }
}
