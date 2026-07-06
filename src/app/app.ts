import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, Footer],
  template: `
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    router-outlet + * {
      flex: 1;
    }
  `]
})
export class App {}