import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideLoader2,
  LucideShieldCheck,
  LucideUserPlus,
  LucideExternalLink,
  LucideUser,
  LucideMail,
  LucideLock,
  LucideArrowRight,
  LucideCheckCircle2
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { SessionService, KeycloakService } from 'shared-ui';

/**
 * SignupComponent (TASK-10)
 *
 * Provides self-registration options:
 * 1. Direct registration into Keycloak realm with immediate session initialization.
 * 2. Keycloak official registration portal flow with PKCE.
 * 3. Instant test customer creation for development and verification.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AuthShellComponent,
    LucideLoader2,
    LucideShieldCheck,
    LucideUserPlus,
    LucideExternalLink,
    LucideUser,
    LucideMail,
    LucideLock,
    LucideArrowRight,
    LucideCheckCircle2
  ],
  template: `
    <app-auth-shell
      eyebrow="Create an account"
      title="Join Nigson Group"
      subtitle="Register securely to manage your procurement, tracking, and trade credit accounts."
      [hasFooter]="true"
    >
      <div class="flex flex-col gap-5 py-2">
        <!-- Status / Error banners -->
        <div *ngIf="errorMessage()" class="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
          <span class="font-bold flex-shrink-0">Error:</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <div *ngIf="successMessage()" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
          <svg lucideCheckCircle2 class="h-4 w-4 text-emerald-600 flex-shrink-0"></svg>
          <span class="font-semibold">{{ successMessage() }}</span>
        </div>

        <!-- In-app Keycloak Registration Form -->
        <form (ngSubmit)="submitDirectRegistration()" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-ink/80 mb-1.5" for="signup-name">Full Name</label>
            <div class="relative">
              <svg lucideUser class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="signup-name"
                name="fullName"
                type="text"
                [(ngModel)]="fullName"
                required
                placeholder="e.g. Chidi Okonkwo"
                class="w-full rounded-xl border border-hairline bg-surface-alt/50 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:border-brand focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-ink/80 mb-1.5" for="signup-email">Work / Personal Email</label>
            <div class="relative">
              <svg lucideMail class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="signup-email"
                name="email"
                type="email"
                [(ngModel)]="email"
                required
                placeholder="name@company.com"
                class="w-full rounded-xl border border-hairline bg-surface-alt/50 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:border-brand focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-ink/80 mb-1.5" for="signup-password">Password</label>
            <div class="relative">
              <svg lucideLock class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="signup-password"
                name="password"
                type="password"
                [(ngModel)]="password"
                required
                minlength="6"
                placeholder="At least 6 characters"
                class="w-full rounded-xl border border-hairline bg-surface-alt/50 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:border-brand focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            id="btn-submit-signup"
            type="submit"
            [disabled]="submitting() || redirecting()"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3 text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm disabled:opacity-70 mt-2"
          >
            <svg *ngIf="submitting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
            <svg *ngIf="!submitting()" lucideUserPlus class="h-4 w-4"></svg>
            {{ submitting() ? 'Creating Keycloak Account...' : 'Create Account' }}
          </button>
        </form>

        <div class="relative flex items-center justify-center my-1">
          <div class="w-full border-t border-hairline"></div>
          <span class="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-ink">OR</span>
        </div>

        <!-- Keycloak Portal Flow -->
        <button
          id="btn-bff-register"
          type="button"
          (click)="redirectToRegister()"
          [disabled]="redirecting() || submitting()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full border border-hairline bg-white py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-70"
        >
          <svg *ngIf="redirecting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          <svg *ngIf="!redirecting()" lucideExternalLink class="h-4 w-4 text-brand"></svg>
          {{ redirecting() ? 'Opening Keycloak...' : 'Register on Keycloak Portal' }}
        </button>

        <!-- Fast Dev Test Profile -->
        <div class="rounded-2xl border border-hairline bg-surface-alt p-3.5 flex items-center justify-between">
          <div>
            <p class="text-xs font-bold text-ink">Fast Development Bypass</p>
            <p class="text-[11px] text-muted-ink">Create temporary test customer session instantly.</p>
          </div>
          <button
            id="btn-dev-register"
            type="button"
            (click)="createDemoAccount()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-hairline bg-white text-xs font-semibold text-brand hover:border-brand transition-colors"
          >
            <svg lucideUser class="h-3.5 w-3.5"></svg> Instant Test
          </button>
        </div>

        <p class="text-center text-[11px] text-muted-ink">
          By registering, you agree to Nigson Group's Terms of Service and Privacy Policy.
        </p>
      </div>

      <div footer>
        Already have an account?
        <a routerLink="/auth/login" class="font-semibold text-brand hover:underline">Sign in</a>
      </div>
    </app-auth-shell>
  `
})
export class SignupComponent {
  private keycloak = inject(KeycloakService);
  private session = inject(SessionService);
  private router = inject(Router);

  readonly redirecting = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  fullName = '';
  email = '';
  password = '';

  createDemoAccount() {
    this.session.signIn('/account');
  }

  redirectToRegister() {
    this.redirecting.set(true);
    this.session.signIn('/account');
  }

  submitDirectRegistration() {
    if (!this.email || !this.fullName || !this.password) {
      this.errorMessage.set('Please fill in your name, email, and password.');
      return;
    }
    if (this.password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.keycloak.registerDirect({
      fullName: this.fullName,
      email: this.email,
      password: this.password
    }).subscribe(res => {
      this.submitting.set(false);
      if (res.success) {
        this.successMessage.set('Account registered in Keycloak! Redirecting...');
        setTimeout(() => {
          this.router.navigate(['/account']);
        }, 1000);
      } else {
        this.errorMessage.set(res.error || 'Registration failed. The email may already be in use.');
      }
    });
  }
}
