import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideLoader2,
  LucideShieldCheck,
  LucideUser,
  LucideShield,
  LucideArrowRight,
  LucideExternalLink,
  LucideCheckCircle2
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { SessionService, BFF_BASE } from 'shared-ui';

/**
 * LoginComponent (TASK-08)
 *
 * Provides authentication options:
 * 1. Test profiles for local and MFE verification across all modules.
 * 2. Keycloak OIDC authentication via the Commerce BFF (/bff/login?returnTo=...).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AuthShellComponent,
    LucideLoader2,
    LucideShieldCheck,
    LucideUser,
    LucideShield,
    LucideArrowRight,
    LucideExternalLink,
    LucideCheckCircle2
  ],
  template: `
    <app-auth-shell
      eyebrow="Authentication"
      title="Sign in to Nigson"
      subtitle="Access your orders, quotes, account settings, and administrative consoles."
      [hasFooter]="true"
    >
      <div class="flex flex-col gap-6 py-2">
        <!-- Foundation mode info note -->
        <div class="rounded-2xl border border-hairline bg-surface-alt p-4">
          <div class="flex items-center gap-2">
            <svg lucideShield class="h-4 w-4 text-brand flex-shrink-0"></svg>
            <p class="text-xs font-bold uppercase tracking-wider text-ink/80">Local Development &amp; Test Sessions</p>
          </div>
          <p class="mt-1.5 text-xs text-muted-ink leading-relaxed">
            The local backend runs in foundation security mode. You can instantly test protected routes using one of the predefined profiles below, or continue with Keycloak.
          </p>
        </div>

        <!-- Quick Demo Profiles -->
        <div class="space-y-2.5">
          <p class="text-[11px] font-bold uppercase tracking-widest text-muted-ink">Choose a Test Profile</p>

          <button
            id="btn-login-customer"
            type="button"
            (click)="loginWithDemo('customer')"
            class="group w-full flex items-center justify-between rounded-2xl border border-hairline bg-white p-3.5 hover:border-brand hover:shadow-sm transition-all text-left"
          >
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                <svg lucideUser class="h-5 w-5"></svg>
              </div>
              <div>
                <p class="text-sm font-bold text-ink">Chidi Okonkwo</p>
                <p class="text-xs text-muted-ink">Customer &bull; Orders, Quotes, Addresses</p>
              </div>
            </div>
            <div class="inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:translate-x-1 transition-transform">
              Sign In <svg lucideArrowRight class="h-3.5 w-3.5"></svg>
            </div>
          </button>

          <button
            id="btn-login-admin"
            type="button"
            (click)="loginWithDemo('admin')"
            class="group w-full flex items-center justify-between rounded-2xl border border-hairline bg-white p-3.5 hover:border-brand hover:shadow-sm transition-all text-left"
          >
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                <svg lucideShieldCheck class="h-5 w-5"></svg>
              </div>
              <div>
                <p class="text-sm font-bold text-ink">Adaobi Admin</p>
                <p class="text-xs text-muted-ink">Administrator &bull; Commerce, Catalog, CMS, Users</p>
              </div>
            </div>
            <div class="inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:translate-x-1 transition-transform">
              Sign In <svg lucideArrowRight class="h-3.5 w-3.5"></svg>
            </div>
          </button>

          <button
            id="btn-login-staff"
            type="button"
            (click)="loginWithDemo('staff')"
            class="group w-full flex items-center justify-between rounded-2xl border border-hairline bg-white p-3.5 hover:border-brand hover:shadow-sm transition-all text-left"
          >
            <div class="flex items-center gap-3">
              <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                <svg lucideCheckCircle2 class="h-5 w-5"></svg>
              </div>
              <div>
                <p class="text-sm font-bold text-ink">Emeka Logistics</p>
                <p class="text-xs text-muted-ink">Operations &amp; Sales Staff &bull; Inventory, Quotes</p>
              </div>
            </div>
            <div class="inline-flex items-center gap-1 text-xs font-semibold text-brand group-hover:translate-x-1 transition-transform">
              Sign In <svg lucideArrowRight class="h-3.5 w-3.5"></svg>
            </div>
          </button>
        </div>

        <div class="relative flex items-center justify-center">
          <div class="w-full border-t border-hairline"></div>
          <span class="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-ink">OR</span>
        </div>

        <!-- Keycloak SSO redirect -->
        <div class="space-y-3">
          <button
            id="btn-bff-login"
            type="button"
            (click)="redirectToLogin()"
            [disabled]="redirecting()"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep hover:border-brand-deep transition-colors disabled:opacity-70 shadow-sm"
          >
            <svg *ngIf="redirecting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
            <svg *ngIf="!redirecting()" lucideExternalLink class="h-4 w-4"></svg>
            {{ redirecting() ? 'Redirecting to Keycloak...' : 'Sign In with Keycloak SSO' }}
          </button>

          <p class="text-center text-xs text-muted-ink">
            By signing in, you agree to Nigson's Terms of Service and Privacy Policy.
          </p>
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
  private session = inject(SessionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly redirecting = signal(false);

  ngOnInit() {
    if (this.session.authenticated()) {
      const returnUrl = this.getReturnUrl();
      this.router.navigateByUrl(returnUrl);
    }
  }

  getReturnUrl(): string {
    return this.route.snapshot.queryParams['returnTo'] ||
           this.route.snapshot.queryParams['redirect'] ||
           '/';
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
    } else {
      this.session.setSession({
        userId: 'dev-staff-001',
        fullName: 'Emeka Logistics',
        email: 'operations@nigson.ng',
        roles: ['OPERATIONS', 'SALES', 'CUSTOMER']
      });
      const target = this.getReturnUrl();
      this.router.navigateByUrl(target === '/' ? '/admin' : target);
    }
  }

  redirectToLogin() {
    this.redirecting.set(true);
    const returnUrl = this.getReturnUrl();
    window.location.href = `${BFF_BASE}/bff/login?returnTo=${encodeURIComponent(returnUrl)}`;
  }
}
