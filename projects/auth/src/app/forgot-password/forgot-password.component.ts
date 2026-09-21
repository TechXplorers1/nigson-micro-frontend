import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideLoader2, LucideMail, LucideCheckCircle2, LucideArrowLeft
} from '@lucide/angular';
import { AuthShellComponent } from '../auth-shell/auth-shell.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink, AuthShellComponent,
    LucideLoader2, LucideMail, LucideCheckCircle2, LucideArrowLeft
  ],
  template: `
    <app-auth-shell
      eyebrow="Reset Password"
      title="Forgot your password?"
      subtitle="Enter your email address and we'll send you a link to reset your password."
      [hasFooter]="true"
    >
      <div *ngIf="success()" class="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <svg lucideCheckCircle2 class="h-6 w-6"></svg>
        </div>
        <h3 class="mt-4 text-sm font-bold text-emerald-900">Check your email</h3>
        <p class="mt-2 text-xs text-emerald-700">
          We sent a password reset link to <br /><span class="font-semibold">{{ email }}</span>
        </p>
      </div>

      <form *ngIf="!success()" (ngSubmit)="submit()" class="space-y-5" novalidate>
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

        <button
          type="submit"
          [disabled]="loading()"
          class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-70"
        >
          <svg *ngIf="loading()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
          {{ loading() ? "Sending link..." : "Send reset link" }}
        </button>
      </form>
      <div footer>
        <a routerLink="/auth/login" class="inline-flex items-center gap-1.5 font-semibold text-ink hover:text-brand transition-colors">
          <svg lucideArrowLeft class="h-4 w-4"></svg> Back to login
        </a>
      </div>
    </app-auth-shell>
  `
})
export class ForgotPasswordComponent {
  email = '';
  loading = signal(false);
  success = signal(false);
  errors = signal<{ email?: string }>({});

  submit() {
    const errs: any = {};
    if (!this.email.trim()) errs.email = "Email address is required.";
    else if (!this.email.includes('@')) errs.email = "Please enter a valid email address.";
    
    this.errors.set(errs);
    if (Object.keys(errs).length) return;

    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.success.set(true);
    }, 1000);
  }
}
