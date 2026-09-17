import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideEye, LucideEyeOff, LucideLoader2, LucideLock
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, AuthShellComponent,
    LucideEye, LucideEyeOff, LucideLoader2, LucideLock
  ],
  template: `
    <app-auth-shell
      eyebrow="Reset Password"
      title="Create new password"
      subtitle="Your new password must be different from previous used passwords."
      [hasFooter]="false"
    >
      <form (ngSubmit)="submit()" class="space-y-5" novalidate>
        <div class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">New Password</span>
          <div class="mt-1.5 relative">
            <svg lucideLock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
            <input
              [type]="showPw() ? 'text' : 'password'"
              name="password"
              [(ngModel)]="password"
              placeholder="Enter new password"
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

        <div class="block">
          <span class="text-xs font-semibold uppercase tracking-[0.12em] text-ink/70">Confirm Password</span>
          <div class="mt-1.5 relative">
            <svg lucideLock class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-ink"></svg>
            <input
              [type]="showConfirmPw() ? 'text' : 'password'"
              name="confirmPassword"
              [(ngModel)]="confirmPassword"
              placeholder="Confirm new password"
              class="w-full rounded-xl border border-hairline bg-white pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-brand"
            />
            <button
              type="button"
              (click)="showConfirmPw.set(!showConfirmPw())"
              class="absolute right-3 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full text-muted-ink hover:text-brand"
            >
              <svg *ngIf="showConfirmPw()" lucideEyeOff class="h-4 w-4"></svg>
              <svg *ngIf="!showConfirmPw()" lucideEye class="h-4 w-4"></svg>
            </button>
          </div>
          <p *ngIf="errors().confirm" class="mt-1.5 text-xs text-brand font-medium">{{ errors().confirm }}</p>
        </div>

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70"
        >
          <svg *ngIf="loading()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          {{ loading() ? "Resetting password..." : "Reset Password" }}
        </button>
      </form>
    </app-auth-shell>
  `
})
export class ResetPasswordComponent {
  router = inject(Router);

  password = '';
  confirmPassword = '';
  showPw = signal(false);
  showConfirmPw = signal(false);
  loading = signal(false);
  errors = signal<{ password?: string; confirm?: string }>({});

  submit() {
    const errs: any = {};
    if (this.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (this.password !== this.confirmPassword) errs.confirm = "Passwords do not match.";
    
    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/auth/login']);
    }, 1000);
  }
}
