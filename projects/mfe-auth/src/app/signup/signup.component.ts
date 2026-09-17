import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideEye, LucideEyeOff, LucideLoader2, 
  LucideMail, LucideLock, LucideUser
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { ShopService } from 'shared-ui';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, AuthShellComponent,
    LucideEye, LucideEyeOff, LucideLoader2, 
    LucideMail, LucideLock, LucideUser
  ],
  template: `
    <app-auth-shell
      eyebrow="Create an account"
      title="Join Nigson Group"
      subtitle="Create an account to track orders, save products and request quotes."
      [hasFooter]="true"
    >
      <form (ngSubmit)="submit()" class="space-y-5" novalidate>
        <div class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Full Name</span>
          <div class="mt-1.5 relative">
            <svg lucideUser class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
            <input
              type="text"
              name="fullName"
              [(ngModel)]="fullName"
              placeholder="John Doe"
              class="w-full rounded-xl border border-hairline bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <p *ngIf="errors().name" class="mt-1.5 text-xs text-brand font-medium">{{ errors().name }}</p>
        </div>

        <div class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Email address</span>
          <div class="mt-1.5 relative">
            <svg lucideMail class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              placeholder="you@company.com"
              class="w-full rounded-xl border border-hairline bg-white pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <p *ngIf="errors().email" class="mt-1.5 text-xs text-brand font-medium">{{ errors().email }}</p>
        </div>

        <div class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Password</span>
          <div class="mt-1.5 relative">
            <svg lucideLock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
            <input
              [type]="showPw() ? 'text' : 'password'"
              name="password"
              [(ngModel)]="password"
              placeholder="Create a password"
              class="w-full rounded-xl border border-hairline bg-white pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              (click)="showPw.set(!showPw())"
              class="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full text-muted-ink hover:text-brand"
            >
              <svg *ngIf="showPw()" lucideEyeOff class="h-4 w-4"></svg>
              <svg *ngIf="!showPw()" lucideEye class="h-4 w-4"></svg>
            </button>
          </div>
          <p *ngIf="errors().password" class="mt-1.5 text-xs text-brand font-medium">{{ errors().password }}</p>
        </div>
        
        <p class="text-xs text-muted-ink">Password must be at least 8 characters long.</p>

        <p *ngIf="errors().form" class="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {{ errors().form }}
        </p>

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70"
        >
          <svg *ngIf="loading()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          {{ loading() ? "Creating account..." : "Create Account" }}
        </button>

        <p class="text-center text-xs text-muted-ink">
          By registering you agree to Nigson's <a href="#" class="underline">Terms</a> & <a href="#" class="underline">Privacy Policy</a>.
        </p>
      </form>
      <div footer>
        Already have an account? <a routerLink="/auth/login" class="font-semibold text-brand hover:underline">Sign In</a>
      </div>
    </app-auth-shell>
  `
})
export class SignupComponent {
  shop = inject(ShopService);
  router = inject(Router);

  fullName = '';
  email = '';
  password = '';
  showPw = signal(false);
  loading = signal(false);
  errors = signal<{ name?: string; email?: string; password?: string; form?: string }>({});

  submit() {
    const errs: any = {};
    if (!this.fullName.trim()) errs.name = "Full name is required.";
    if (!this.email.trim()) errs.email = "Email address is required.";
    else if (!this.email.includes('@')) errs.email = "Please enter a valid email address.";
    if (this.password.length < 8) errs.password = "Password must be at least 8 characters.";
    
    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    setTimeout(() => {
      // Mock Authentication
      const user = {
        id: "u_" + Math.random().toString(36).substring(2, 9),
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        role: "user",
        createdAt: new Date().toISOString(),
        avatarColor: "#10B981",
      } as any;
      
      this.shop.authenticate(user);
      this.loading.set(false);
      this.router.navigate(['/']);
    }, 700);
  }
}
