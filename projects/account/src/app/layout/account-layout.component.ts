import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, RouterLinkActive } from '@angular/router';
import { ShopService } from 'shared-ui';
import { 
  LucideUser, LucidePackage, LucideLogOut, LucideSettings
} from '@lucide/angular';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterOutlet, RouterLinkActive,
    LucideUser, LucidePackage, LucideLogOut, LucideSettings
  ],
  template: `
    <div *ngIf="!shop.user()" class="pt-40 pb-24 text-center text-muted-ink">
      Redirecting to sign in...
    </div>

    <section *ngIf="shop.user()" class="pt-32 pb-24 md:pt-40 bg-white min-h-screen">
      <div class="mx-auto max-w-7xl px-6">
        <!-- Header -->
        <div class="mb-10 flex items-center gap-5">
          <div
            class="grid h-16 w-16 place-items-center rounded-full text-white text-xl font-extrabold"
            [ngStyle]="{'background': shop.user()?.avatarColor}"
          >
            {{ initialsOf(shop.user()?.fullName) }}
          </div>
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">Welcome back</p>
            <h1 class="text-3xl md:text-4xl font-extrabold tracking-[-0.02em]">{{ shop.user()?.fullName }}</h1>
            <p class="text-sm text-muted-ink">{{ shop.user()?.email }}</p>
          </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-[260px_1fr]">
          <!-- Sidebar -->
          <aside class="h-fit rounded-2xl border border-hairline bg-white p-3">
            <nav class="flex flex-col">
              <a 
                routerLink="/account" 
                routerLinkActive="bg-brand text-white" 
                [routerLinkActiveOptions]="{exact: true}"
                class="inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors text-ink hover:bg-surface-alt"
              >
                <svg lucideUser class="h-4 w-4"></svg> My Profile
              </a>
              <a 
                routerLink="/account/orders" 
                routerLinkActive="bg-brand text-white"
                class="inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors text-ink hover:bg-surface-alt"
              >
                <svg lucidePackage class="h-4 w-4"></svg> My Orders
              </a>
              <a 
                routerLink="/account/settings" 
                routerLinkActive="bg-brand text-white"
                class="inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors text-ink hover:bg-surface-alt"
              >
                <svg lucideSettings class="h-4 w-4"></svg> Settings
              </a>
              <button
                (click)="logout()"
                class="mt-2 inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-surface-alt border-t border-hairline"
              >
                <svg lucideLogOut class="h-4 w-4"></svg> Logout
              </button>
            </nav>
          </aside>
          
          <!-- Main Content -->
          <div>
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </section>
  `
})
export class AccountLayoutComponent implements OnInit {
  shop = inject(ShopService);
  router = inject(Router);

  ngOnInit() {
    if (!this.shop.user()) {
      this.router.navigate(['/auth/login'], { queryParams: { redirect: '/account' } });
    }
  }

  logout() {
    this.shop.signOut();
    this.router.navigate(['/']);
  }

  initialsOf(name?: string) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
