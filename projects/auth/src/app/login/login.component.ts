import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideLoader2,
  LucideShieldCheck,
  LucideUser,
  LucideShield,
  LucideArrowRight,
  LucideExternalLink,
  LucideCheckCircle2,
  LucideMail,
  LucideLock
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { SessionService, KeycloakService } from 'shared-ui';

/**
 * LoginComponent (TASK-08)
 *
 * Provides authentication options:
 * 1. Keycloak OIDC Single Sign-On via PKCE.
 * 2. Direct Keycloak credential authentication.
 * 3. Quick test profiles for local development and verification.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AuthShellComponent,
    LucideLoader2,
    LucideShieldCheck,
    LucideUser,
    LucideShield,
    LucideArrowRight,
    LucideExternalLink,
    LucideCheckCircle2,
    LucideMail,
    LucideLock
  ],
  template: `
    <app-auth-shell
      eyebrow="Authentication"
      title="Sign in to Nigson"
      subtitle="Access your orders, quotes, account settings, and administrative consoles."
      [hasFooter]="true"
    >
      <div class="flex flex-col gap-5 py-2">
        <!-- Status / Error Banner -->
        <div *ngIf="authError()" class="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
          <span class="font-bold flex-shrink-0">Error:</span>
          <span>{{ authError() }}</span>
        </div>

        <div *ngIf="isProcessingCode()" class="rounded-2xl border border-brand/20 bg-brand/5 p-4 text-xs text-brand flex items-center justify-center gap-3">
          <svg lucideLoader2 class="h-5 w-5 animate-spin"></svg>
          <span class="font-semibold text-sm">Authenticating with Keycloak...</span>
        </div>

        <!-- Keycloak Direct Sign-in Form -->
        <form *ngIf="!isProcessingCode()" (ngSubmit)="submitDirectLogin()" class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-ink/80 mb-1.5" for="login-username">Username or Email</label>
            <div class="relative">
              <svg lucideUser class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="login-username"
                name="username"
                type="text"
                [(ngModel)]="username"
                required
                placeholder="e.g. retailA or name@company.com"
                class="w-full rounded-xl border border-hairline bg-surface-alt/50 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:border-brand focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="text-xs font-semibold text-ink/80" for="login-password">Password</label>
              <a routerLink="/auth/forgot-password" class="text-[11px] font-semibold text-brand hover:underline">Forgot?</a>
            </div>
            <div class="relative">
              <svg lucideLock class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="login-password"
                name="password"
                type="password"
                [(ngModel)]="password"
                required
                placeholder="••••••••"
                class="w-full rounded-xl border border-hairline bg-surface-alt/50 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:border-brand focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            [disabled]="submitting() || redirecting()"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3 text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm disabled:opacity-70 mt-1"
          >
            <svg *ngIf="submitting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
            <svg *ngIf="!submitting()" lucideArrowRight class="h-4 w-4"></svg>
            {{ submitting() ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <div *ngIf="!isProcessingCode()" class="relative flex items-center justify-center my-0.5">
          <div class="w-full border-t border-hairline"></div>
          <span class="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-ink">OR</span>
        </div>

        <!-- Keycloak SSO redirect button -->
        <button
          *ngIf="!isProcessingCode()"
          id="btn-bff-login"
          type="button"
          (click)="redirectToLogin()"
          [disabled]="redirecting() || submitting()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full border border-hairline bg-white py-2.5 text-sm font-semibold text-ink hover:border-brand hover:text-brand transition-colors disabled:opacity-70 shadow-2xs"
        >
          <svg *ngIf="redirecting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          <svg *ngIf="!redirecting()" lucideExternalLink class="h-4 w-4 text-brand"></svg>
          {{ redirecting() ? 'Opening Keycloak...' : 'Sign In with Keycloak SSO' }}
        </button>

        <!-- Quick Demo Profiles for Local Development -->
        <div *ngIf="!isProcessingCode()" class="space-y-2 pt-1">
          <div class="flex items-center justify-between">
            <p class="text-[10px] font-bold uppercase tracking-widest text-muted-ink">Keycloak Test Accounts</p>
            <span class="text-[10px] text-muted-ink">pw: mock-local-user</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button
              id="btn-login-customer"
              type="button"
              (click)="loginWithDemo('customer')"
              class="flex flex-col items-center justify-center rounded-xl border border-hairline bg-surface-alt/60 p-2.5 hover:border-brand hover:bg-white transition-all text-center group"
            >
              <svg lucideUser class="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform"></svg>
              <span class="text-xs font-semibold text-ink mt-1">Customer Account</span>
              <span class="text-[10px] text-muted-ink font-mono">retailA</span>
            </button>

            <button
              id="btn-login-admin"
              type="button"
              (click)="loginWithDemo('admin')"
              class="flex flex-col items-center justify-center rounded-xl border border-hairline bg-surface-alt/60 p-2.5 hover:border-brand hover:bg-white transition-all text-center group"
            >
              <svg lucideShieldCheck class="h-4 w-4 text-purple-600 group-hover:scale-110 transition-transform"></svg>
              <span class="text-xs font-semibold text-ink mt-1">Admin Account</span>
              <span class="text-[10px] text-muted-ink font-mono">admin</span>
            </button>
          </div>
        </div>
      </div>

      <div footer>
        Don't have an account?
        <a routerLink="/auth/signup" class="font-semibold text-brand hover:underline">Create an account</a>
      </div>
    </app-auth-shell>
  `
})
export class LoginComponent implements OnInit {
  private keycloak = inject(KeycloakService);
  private session = inject(SessionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly redirecting = signal(false);
  readonly submitting = signal(false);
  readonly isProcessingCode = signal(false);
  readonly authError = signal<string | null>(null);

  username = '';
  password = '';

  ngOnInit() {
    // 1. Check for Keycloak OIDC Authorization Code return (?code=...)
    const code = this.route.snapshot.queryParams['code'];
    if (code) {
      this.isProcessingCode.set(true);
      this.keycloak.handleCallback(code).subscribe(result => {
        this.isProcessingCode.set(false);
        if (result.success) {
          this.router.navigateByUrl(result.returnUrl);
        } else {
          this.authError.set(result.error || 'Authentication code exchange failed.');
        }
      });
      return;
    }

    // 2. Check if already authenticated
    if (this.session.authenticated()) {
      const returnUrl = this.getReturnUrl();
      this.router.navigateByUrl(returnUrl);
    }
  }

  getReturnUrl(): string {
    const raw = this.route.snapshot.queryParams['returnTo'] ||
                this.route.snapshot.queryParams['redirect'] ||
                '/account';
    if (raw.startsWith('/checkout') || raw.startsWith('/cart')) return '/checkout';
    if (raw.startsWith('/admin')) return '/admin';
    return '/account';
  }

  submitDirectLogin() {
    if (!this.username || !this.password) {
      this.authError.set('Please provide both username and password.');
      return;
    }
    this.submitting.set(true);
    this.authError.set(null);

    this.keycloak.loginWithPassword(this.username, this.password).subscribe(res => {
      this.submitting.set(false);
      if (res.success) {
        const target = this.getReturnUrl();
        this.router.navigateByUrl(target === '/' ? '/account' : target);
      } else {
        this.authError.set(res.error || 'Invalid credentials or Keycloak unavailable.');
      }
    });
  }

  redirectToLogin() {
    this.redirecting.set(true);
    const returnUrl = this.getReturnUrl();
    this.keycloak.redirectToLogin(returnUrl).catch(err => {
      this.redirecting.set(false);
      this.authError.set('Could not initialize Keycloak login: ' + (err?.message || err));
    });
  }

  loginWithDemo(role: 'customer' | 'admin' | 'staff') {
    if (role === 'customer') {
      this.session.setSession({
        userId: 'dev-cust-001',
        fullName: 'Chidi Okonkwo',
        email: 'chidi.customer@nigson.ng',
        roles: ['CUSTOMER']
      });
      const target = this.getReturnUrl();
      this.router.navigateByUrl(target === '/' ? '/account' : target);
    } else if (role === 'admin') {
      this.session.setSession({
        userId: 'dev-admin-001',
        fullName: 'Adaobi Admin',
        email: 'admin@nigson.ng',
        roles: ['ADMIN', 'CUSTOMER', 'SALES', 'OPERATIONS', 'FINANCE', 'CONTENT_EDITOR', 'CONTENT_PUBLISHER', 'ANALYST']
      });
      const target = this.getReturnUrl();
      this.router.navigateByUrl(target === '/' ? '/admin' : target);
    }
  }
}
