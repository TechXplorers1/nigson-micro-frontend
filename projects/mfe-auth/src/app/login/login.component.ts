import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideEye, LucideEyeOff, LucideLoader2, 
  LucideMail, LucideLock, LucidePhone, LucideShieldCheck 
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { ShopService, CountrySelectComponent, Country, DEFAULT_COUNTRY } from 'shared-ui';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, AuthShellComponent, CountrySelectComponent,
    LucideEye, LucideEyeOff, LucideLoader2, 
    LucideMail, LucideLock, LucidePhone, LucideShieldCheck
  ],
  template: `
    <app-auth-shell
      eyebrow="Welcome back"
      title="Sign in to your account"
      subtitle="Access your orders, saved products and quote history."
      [hasFooter]="true"
    >
      <form (ngSubmit)="submit()" class="space-y-5" novalidate>
        <!-- identity mode switch -->
        <div class="grid grid-cols-2 gap-1 rounded-full border border-hairline bg-surface-alt p-1">
          <button
            type="button"
            (click)="setMode('email')"
            class="rounded-full py-2 text-sm font-semibold transition-all duration-200"
            [ngClass]="mode() === 'email' ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:text-brand'"
          >
            Email
          </button>
          <button
            type="button"
            (click)="setMode('phone')"
            class="rounded-full py-2 text-sm font-semibold transition-all duration-200"
            [ngClass]="mode() === 'phone' ? 'bg-brand text-white shadow-sm' : 'text-ink/70 hover:text-brand'"
          >
            Phone
          </button>
        </div>

        <div class="animate-in fade-in-0 slide-in-from-bottom-1 duration-200">
          <div *ngIf="mode() === 'email'" class="block">
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
            <p *ngIf="errors().id" class="mt-1.5 text-xs text-brand font-medium">{{ errors().id }}</p>
          </div>

          <div *ngIf="mode() === 'phone'" class="block">
            <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Phone number</span>
            <div class="mt-1.5 flex items-stretch rounded-xl border border-hairline bg-white focus-within:border-brand overflow-visible">
              <ui-country-select [value]="country" (valueChange)="country.set($event)"></ui-country-select>
              <div class="relative flex-1">
                <svg lucidePhone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
                <input
                  type="tel"
                  name="phone"
                  [(ngModel)]="phone"
                  placeholder="807 346 7809"
                  class="w-full bg-transparent pl-9 pr-4 py-3 text-sm outline-none"
                />
              </div>
            </div>
            <p *ngIf="errors().id" class="mt-1.5 text-xs text-brand font-medium">{{ errors().id }}</p>
          </div>
        </div>

        <div class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Password</span>
          <div class="mt-1.5 relative">
            <svg lucideLock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
            <input
              [type]="showPw() ? 'text' : 'password'"
              name="password"
              [(ngModel)]="password"
              placeholder="Enter your password"
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

        <p *ngIf="errors().form" class="rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm font-medium text-brand animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {{ errors().form }}
        </p>

        <div class="flex items-center justify-between text-sm">
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="remember"
              [(ngModel)]="remember"
              class="h-4 w-4 rounded border-hairline accent-brand"
            />
            <span class="text-ink/80">Remember me</span>
          </label>
          <a routerLink="/auth/forgot-password" class="font-semibold text-brand hover:underline">Forgot password?</a>
        </div>

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70"
        >
          <svg *ngIf="loading()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          {{ loading() ? "Signing in..." : "Sign In" }}
        </button>

        <div class="rounded-2xl border border-hairline bg-surface-alt p-4">
          <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">
            <svg lucideShieldCheck class="h-3.5 w-3.5 text-brand"></svg> Demo accounts
          </p>
          <div class="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" (click)="fillDemo('user')" class="rounded-xl border border-hairline bg-white px-3 py-2.5 text-left text-xs hover:border-brand transition-colors">
              <span class="block font-semibold text-ink">Customer</span>
              <span class="block text-muted-ink">user@nigson.com</span>
              <span class="block text-muted-ink">User@12345</span>
            </button>
            <button type="button" (click)="fillDemo('admin')" class="rounded-xl border border-hairline bg-white px-3 py-2.5 text-left text-xs hover:border-brand transition-colors">
              <span class="block font-semibold text-ink">Administrator</span>
              <span class="block text-muted-ink">admin@nigson.com</span>
              <span class="block text-muted-ink">Admin@12345</span>
            </button>
          </div>
        </div>

        <p class="text-center text-xs text-muted-ink">
          By continuing you agree to Nigson's Terms & Privacy Policy.
        </p>
      </form>
      <div footer>
        Don't have an account? <a routerLink="/auth/signup" class="font-semibold text-brand hover:underline">Create one</a>
      </div>
    </app-auth-shell>
  `
})
export class LoginComponent {
  shop = inject(ShopService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  mode = signal<'email' | 'phone'>('email');
  email = '';
  country = signal<Country>(DEFAULT_COUNTRY);
  phone = '';
  password = '';
  remember = true;
  showPw = signal(false);
  loading = signal(false);
  errors = signal<{ id?: string; password?: string; form?: string }>({});

  setMode(m: 'email' | 'phone') {
    this.mode.set(m);
    this.errors.set({});
  }

  fillDemo(kind: "user" | "admin") {
    this.setMode("email");
    this.email = kind === "admin" ? "admin@nigson.com" : "user@nigson.com";
    this.password = kind === "admin" ? "Admin@12345" : "User@12345";
    this.errors.set({});
  }

  submit() {
    const errs: any = {};
    if (this.mode() === "email") {
      if (!this.email.trim()) errs.id = "Email address is required.";
      else if (!this.email.includes('@')) errs.id = "Please enter a valid email address.";
    } else {
      if (!this.phone.trim()) errs.id = "Phone number is required.";
    }
    if (!this.password) errs.password = "Password is required.";
    
    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    setTimeout(() => {
      // Mock Authentication
      const user = {
        id: "u_1",
        fullName: this.email.includes("admin") ? "Admin User" : "Demo User",
        email: this.mode() === "email" ? this.email : "phone@nigson.com",
        role: this.email.includes("admin") ? "admin" : "user",
        createdAt: new Date().toISOString(),
        avatarColor: this.email.includes("admin") ? "#2563EB" : "#10B981",
      } as any;
      
      this.shop.authenticate(user);
      this.loading.set(false);
      
      const returnUrl = this.route.snapshot.queryParams['redirect'] || '/';
      
      if (user.role === "admin") {
        this.router.navigate(['/admin']); // Mocking admin redirection
      } else {
        this.router.navigateByUrl(returnUrl);
      }
    }, 700);
  }
}
