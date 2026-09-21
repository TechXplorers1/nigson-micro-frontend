import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from 'shared-ui';
import { 
  LucideEye, LucideEyeOff, LucideLogOut, LucideTrash2, LucideX, LucideSave
} from '@lucide/angular';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LucideEye, LucideEyeOff, LucideLogOut, LucideTrash2, LucideX, LucideSave
  ],
  template: `
    <div class="space-y-6" *ngIf="user()">
      <!-- Account -->
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <h3 class="text-sm font-extrabold uppercase tracking-widest">Account</h3>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Full Name</span>
            <input 
              [(ngModel)]="fullName" 
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand" 
            />
          </label>
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Email Address</span>
            <input 
              [(ngModel)]="email" 
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand" 
            />
          </label>
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button (click)="resetAccount()" class="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-xs font-semibold hover:border-brand hover:text-brand">
            <svg lucideX class="h-3.5 w-3.5"></svg> Cancel
          </button>
          <button (click)="saveAccount()" class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-xs font-semibold hover:bg-brand-deep">
            <svg lucideSave class="h-3.5 w-3.5"></svg> Save Changes
          </button>
        </div>
      </div>

      <!-- Security -->
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <h3 class="text-sm font-extrabold uppercase tracking-widest">Security</h3>
        <div class="mt-5 grid gap-4 md:grid-cols-3">
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Current Password</span>
            <div class="relative mt-1.5">
              <input 
                [type]="showPw() ? 'text' : 'password'"
                [(ngModel)]="currentPw" 
                class="w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand pr-10" 
              />
              <button type="button" (click)="showPw.set(!showPw())" class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-ink hover:text-brand">
                <svg *ngIf="showPw()" lucideEyeOff class="h-4 w-4"></svg>
                <svg *ngIf="!showPw()" lucideEye class="h-4 w-4"></svg>
              </button>
            </div>
          </label>
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">New Password</span>
            <input 
              [type]="showPw() ? 'text' : 'password'"
              [(ngModel)]="newPw" 
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand" 
            />
          </label>
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Confirm Password</span>
            <input 
              [type]="showPw() ? 'text' : 'password'"
              [(ngModel)]="confirmPw" 
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand" 
            />
          </label>
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button (click)="resetPassword()" class="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-xs font-semibold hover:border-brand hover:text-brand">
            <svg lucideX class="h-3.5 w-3.5"></svg> Cancel
          </button>
          <button (click)="savePassword()" class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-xs font-semibold hover:bg-brand-deep">
            <svg lucideSave class="h-3.5 w-3.5"></svg> Save Changes
          </button>
        </div>
      </div>

      <!-- Privacy -->
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <h3 class="text-sm font-extrabold uppercase tracking-widest">Privacy</h3>
        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <button (click)="logoutAll()" class="inline-flex items-center justify-center gap-2 rounded-full border border-ink px-5 py-3 text-sm font-semibold text-ink hover:bg-ink hover:text-white transition-colors">
            <svg lucideLogOut class="h-4 w-4"></svg> Logout all devices
          </button>
          <button (click)="deleteAccount()" class="inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white px-5 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors">
            <svg lucideTrash2 class="h-4 w-4"></svg> Delete account
          </button>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  shop = inject(ShopService);

  user = this.shop.user;

  fullName = '';
  email = '';

  currentPw = '';
  newPw = '';
  confirmPw = '';
  showPw = signal(false);

  ngOnInit() {
    this.resetAccount();
  }

  resetAccount() {
    const u = this.user();
    if (u) {
      this.fullName = u.fullName;
      this.email = u.email;
    }
  }

  saveAccount() {
    if (!this.fullName.trim()) { alert("Name is required."); return; }
    if (!this.email.includes('@')) { alert("Valid email required."); return; }
    
    const u = this.user();
    if (u) {
      const updated = { ...u, fullName: this.fullName.trim(), email: this.email.trim() };
      this.shop.user.set(updated);
      try { localStorage.setItem('nigson_user', JSON.stringify(updated)); } catch {}
      alert("Account details updated.");
    }
  }

  resetPassword() {
    this.currentPw = '';
    this.newPw = '';
    this.confirmPw = '';
  }

  savePassword() {
    if (!this.currentPw || !this.newPw || !this.confirmPw) { alert("Fill all password fields."); return; }
    if (this.newPw.length < 8) { alert("Password must be at least 8 characters."); return; }
    if (this.newPw !== this.confirmPw) { alert("New passwords do not match."); return; }
    
    this.resetPassword();
    alert("Password changed successfully.");
  }

  logoutAll() {
    alert("Signed out from all devices.");
    this.shop.signOut();
  }

  deleteAccount() {
    if (confirm("This will permanently delete your account. Continue?")) {
      alert("Account deletion requested.");
      this.shop.signOut();
    }
  }
}
