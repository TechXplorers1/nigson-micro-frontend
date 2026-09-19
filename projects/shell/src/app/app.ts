import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './layout/header/header';
import { FooterComponent } from './layout/footer/footer';
import { FloatingActionsComponent } from './layout/floating-actions.component';
import { LoginRequiredComponent } from 'shared-ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent, FloatingActionsComponent, LoginRequiredComponent],
  template: `
    <div class="flex min-h-screen flex-col font-sans antialiased text-foreground bg-background">
      <app-header *ngIf="!isAdminRoute()"></app-header>
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
      <app-footer *ngIf="!isAdminRoute()"></app-footer>
      <app-floating-actions *ngIf="!isAdminRoute()"></app-floating-actions>
      <ui-login-required></ui-login-required>
    </div>
  `
})
export class AppComponent {
  title = 'shell';
  isAdminRoute = signal(false);

  constructor() {
    const router = inject(Router);
    router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute.set(event.urlAfterRedirects.startsWith('/admin'));
    });
  }
}
