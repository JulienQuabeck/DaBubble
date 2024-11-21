import { Component } from '@angular/core';
import { ImprintComponent } from '../imprint/imprint.component';
import { RouterModule } from '@angular/router';
import { PrivacypolicyComponent } from '../privacypolicy/privacypolicy.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [ImprintComponent, PrivacypolicyComponent, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}
