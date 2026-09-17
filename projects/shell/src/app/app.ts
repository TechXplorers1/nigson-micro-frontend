import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header';
import { FooterComponent } from './layout/footer/footer';
import { FloatingActionsComponent } from './layout/floating-actions.component';
import { LoginRequiredComponent } from 'shared-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, FloatingActionsComponent, LoginRequiredComponent],
  template: `
    <div class="flex min-h-screen flex-col font-sans antialiased text-foreground bg-background">
      <app-header></app-header>
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-floating-actions></app-floating-actions>
      <ui-login-required></ui-login-required>
    </div>
  `
})
export class AppComponent {
  title = 'shell';
}
