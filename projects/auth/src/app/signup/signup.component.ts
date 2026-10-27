import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideLoader2, LucideShieldCheck, LucideUserPlus, LucideExternalLink, LucideUser } from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { SessionService, BFF_BASE } from 'shared-ui';

/**
 * SignupComponent (TASK-10)
 *
 * Provides self-registration options:
 * 1. Instant test customer creation for development and verification.
 * 2. Keycloak registration portal flow.
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthShellComponent, LucideLoader2, LucideShieldCheck, LucideUserPlus, LucideExternalLink, LucideUser],
  template: `
    <app-auth-shell
      eyebrow="Create an account"
      title="Join Nigson Group"
      subtitle="Account registration is managed through our secure identity portal."
      [hasFooter]="true"
    >
      <div class="flex flex-col gap-6 py-2">
        <div class="rounded-2xl border border-hairline bg-surface-alt p-4">
          <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink/60">
            <svg lucideShieldCheck class="h-3.5 w-3.5 text-brand"></svg>
            Secure Registration
          </p>
          <p class="mt-2 text-sm text-ink/70">
            Your account will be created in our secure identity system.
            Nigson never stores or handles your password directly.
          </p>
        </div>

        <button
          id="btn-dev-register"
          type="button"
          (click)="createDemoAccount()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full border border-hairline bg-white py-3.5 text-sm font-semibold hover:border-brand hover:text-brand transition-colors"
        >
          <svg lucideUser class="h-4 w-4 text-brand"></svg>
          Create Instant Test Account
        </button>

        <div class="relative flex items-center justify-center">
          <div class="w-full border-t border-hairline"></div>
          <span class="absolute bg-white px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-ink">OR</span>
        </div>

        <button
          id="btn-bff-register"
          (click)="redirectToRegister()"
          [disabled]="redirecting()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70"
        >
          <svg *ngIf="redirecting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          <svg *ngIf="!redirecting()" lucideExternalLink class="h-4 w-4"></svg>
          {{ redirecting() ? 'Redirecting...' : 'Register with Keycloak' }}
        </button>

        <p class="text-center text-xs text-muted-ink">
          By continuing you agree to Nigson's Terms &amp; Privacy Policy.
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
  private session = inject(SessionService);
  private router = inject(Router);

  readonly redirecting = signal(false);

  createDemoAccount() {
    this.session.setSession({
      userId: 'dev-cust-' + Math.random().toString(36).substring(2, 9),
      fullName: 'New Customer',
      email: 'customer@nigson.ng',
      roles: ['CUSTOMER']
    });
    this.router.navigate(['/account']);
  }

  redirectToRegister() {
    this.redirecting.set(true);
    window.location.href = `${BFF_BASE}/bff/login?returnTo=/account`;
  }
}
