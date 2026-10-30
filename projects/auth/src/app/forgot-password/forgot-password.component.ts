import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideLoader2, LucideMail, LucideLock, LucideCheckCircle2, LucideArrowRight } from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';
import { KeycloakService } from 'shared-ui';

/**
 * ForgotPasswordComponent (TASK-11)
 * Enables direct password reset within the Nigson site without external redirects.
 */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AuthShellComponent, LucideLoader2, LucideMail, LucideLock, LucideCheckCircle2, LucideArrowRight],
  template: `
    <app-auth-shell
      eyebrow="Forgot Password"
      title="Reset your password"
      subtitle="Enter your account email and choose a new password."
      [hasFooter]="false"
    >
      <div class="flex flex-col gap-4 py-2">
        <!-- Error Banner -->
        <div *ngIf="errorMessage()" class="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-start gap-2.5">
          <span class="font-bold flex-shrink-0">Error:</span>
          <span>{{ errorMessage() }}</span>
        </div>

        <!-- Success Banner -->
        <div *ngIf="successMessage()" class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5">
          <svg lucideCheckCircle2 class="h-4 w-4 text-emerald-600 flex-shrink-0"></svg>
          <span class="font-semibold">{{ successMessage() }}</span>
        </div>

        <form (ngSubmit)="submitReset()" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-ink/80 mb-1.5" for="reset-email">Your Account Email</label>
            <div class="relative">
              <svg lucideMail class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="reset-email"
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
            <label class="block text-xs font-semibold text-ink/80 mb-1.5" for="reset-new-password">New Password</label>
            <div class="relative">
              <svg lucideLock class="absolute left-3.5 top-3.5 h-4 w-4 text-muted-ink"></svg>
              <input
                id="reset-new-password"
                name="newPassword"
                type="password"
                [(ngModel)]="newPassword"
                required
                minlength="6"
                placeholder="At least 6 characters"
                class="w-full rounded-xl border border-hairline bg-surface-alt/50 pl-10 pr-3.5 py-2.5 text-sm text-ink placeholder:text-muted-ink focus:border-brand focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            id="btn-submit-reset"
            type="submit"
            [disabled]="submitting()"
            class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3 text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm disabled:opacity-70 mt-1"
          >
            <svg *ngIf="submitting()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
            <svg *ngIf="!submitting()" lucideArrowRight class="h-4 w-4"></svg>
            {{ submitting() ? 'Updating Password...' : 'Update Password' }}
          </button>
        </form>

        <div class="text-center pt-2">
          <a routerLink="/auth/login" class="text-xs font-semibold text-brand hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    </app-auth-shell>
  `
})
export class ForgotPasswordComponent {
  private keycloak = inject(KeycloakService);
  private router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  email = '';
  newPassword = '';

  submitReset() {
    if (!this.email || !this.newPassword) {
      this.errorMessage.set('Please provide both your account email and new password.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMessage.set('New password must be at least 6 characters.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.keycloak.resetPasswordDirect(this.email, this.newPassword).subscribe(res => {
      this.submitting.set(false);
      if (res.success) {
        this.successMessage.set('Password updated successfully! Redirecting to sign in...');
        setTimeout(() => {
          this.router.navigate(['/auth/login'], { queryParams: { email: this.email } });
        }, 1500);
      } else {
        this.errorMessage.set(res.error || 'Password update failed. Make sure the email is registered.');
      }
    });
  }
}
