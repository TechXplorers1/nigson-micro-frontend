import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideLoader2, LucideMail } from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { BFF_BASE } from 'shared-ui';

/**
 * ForgotPasswordComponent (TASK-11)
 * Redirects to Keycloak forgot-password flow via the BFF.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthShellComponent, LucideLoader2, LucideMail],
  template: `
    <app-auth-shell
      eyebrow="Forgot Password"
      title="Reset your password"
      subtitle="We will redirect you to our secure portal to reset your password."
      [hasFooter]="false"
    >
      <div class="flex flex-col items-center gap-6 py-4">
        <div class="grid h-16 w-16 place-items-center rounded-full bg-brand/10">
          <svg *ngIf="!redirecting()" lucideMail class="h-8 w-8 text-brand"></svg>
          <svg *ngIf="redirecting()" lucideLoader2 class="h-8 w-8 text-brand animate-spin"></svg>
        </div>

        <button
          id="btn-forgot-password"
          (click)="redirect()"
          [disabled]="redirecting()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70"
        >
          <svg *ngIf="redirecting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          {{ redirecting() ? 'Redirecting...' : 'Send Reset Link' }}
        </button>
        <a routerLink="/auth/login" class="text-xs text-muted-ink hover:text-brand transition-colors">
          Back to sign in
        </a>
      </div>
    </app-auth-shell>
  `
})
export class ForgotPasswordComponent {
  readonly redirecting = signal(false);
  redirect() {
    this.redirecting.set(true);
    window.location.href = `${BFF_BASE}/bff/login?kc_action=UPDATE_PASSWORD`;
  }
}
