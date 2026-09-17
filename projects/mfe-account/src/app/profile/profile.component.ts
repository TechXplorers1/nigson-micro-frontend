import { Component, inject, signal, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from 'shared-ui';
import { 
  LucideUpload, LucideTrash2, LucidePencil, LucideSave, LucideX, 
  LucidePackage, LucideFileText, LucideBuilding2, LucideCalendarClock 
} from '@lucide/angular';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LucideUpload, LucideTrash2, LucidePencil, LucideSave, LucideX,
    LucidePackage, LucideFileText, LucideBuilding2, LucideCalendarClock
  ],
  template: `
    <div class="space-y-6" *ngIf="user()">
      <!-- Header card -->
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <div class="flex flex-wrap items-start justify-between gap-6">
          <div class="flex items-center gap-5">
            <div class="relative">
              <img *ngIf="form().avatarUrl" [src]="form().avatarUrl" alt="Avatar" class="h-20 w-20 rounded-full object-cover border border-hairline" />
              <div *ngIf="!form().avatarUrl" class="grid h-20 w-20 place-items-center rounded-full text-white text-2xl font-extrabold" [ngStyle]="{'background': user()?.avatarColor}">
                {{ initialsOf(form().fullName) }}
              </div>
              
              <button
                *ngIf="editing()"
                (click)="fileInput.click()"
                class="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-md hover:bg-brand-deep"
              >
                <svg lucideUpload class="h-4 w-4"></svg>
              </button>
              <input #fileInput type="file" accept="image/*" hidden (change)="onAvatar($event)" />
            </div>
            
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-brand">Profile</p>
              <h2 class="text-2xl font-extrabold">{{ form().fullName }}</h2>
              <p class="text-sm text-muted-ink">{{ form().email }}</p>
              
              <button
                *ngIf="editing() && form().avatarUrl"
                (click)="removePhoto()"
                class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <svg lucideTrash2 class="h-3 w-3"></svg> Remove photo
              </button>
            </div>
          </div>
          
          <div class="flex gap-2">
            <button *ngIf="!editing()" (click)="startEditing()" class="inline-flex items-center gap-2 rounded-full bg-ink text-white px-5 py-2.5 text-xs font-semibold hover:bg-brand transition-colors">
              <svg lucidePencil class="h-3.5 w-3.5"></svg> Edit Profile
            </button>
            
            <ng-container *ngIf="editing()">
              <button (click)="cancelEdit()" class="inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-xs font-semibold hover:border-brand hover:text-brand">
                <svg lucideX class="h-3.5 w-3.5"></svg> Cancel
              </button>
              <button (click)="save()" class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-xs font-semibold hover:bg-brand-deep">
                <svg lucideSave class="h-3.5 w-3.5"></svg> Save Changes
              </button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="rounded-2xl border border-hairline bg-white p-4">
          <svg lucidePackage class="h-4 w-4 text-brand"></svg>
          <p class="mt-3 text-2xl font-extrabold">{{ ordersCount() }}</p>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink mt-1">Total Orders</p>
        </div>
        <div class="rounded-2xl border border-hairline bg-white p-4">
          <svg lucideFileText class="h-4 w-4 text-brand"></svg>
          <p class="mt-3 text-2xl font-extrabold">0</p>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink mt-1">Quote Requests</p>
        </div>
        <div class="rounded-2xl border border-hairline bg-white p-4">
          <svg lucideBuilding2 class="h-4 w-4 text-brand"></svg>
          <p class="mt-3 text-2xl font-extrabold">0</p>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink mt-1">Distributor Apps</p>
        </div>
        <div class="rounded-2xl border border-hairline bg-white p-4">
          <svg lucideCalendarClock class="h-4 w-4 text-brand"></svg>
          <p class="mt-3 text-2xl font-extrabold">{{ memberSince() }}</p>
          <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink mt-1">Member Since</p>
        </div>
      </div>

      <!-- Personal Info Form -->
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <h3 class="text-sm font-extrabold uppercase tracking-widest">Personal Information</h3>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Full Name</span>
            <input 
              [(ngModel)]="form().fullName" 
              [disabled]="!editing()"
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand disabled:bg-surface-alt" 
            />
          </label>
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Email Address</span>
            <input 
              [(ngModel)]="form().email" 
              [disabled]="!editing()"
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand disabled:bg-surface-alt" 
            />
          </label>
          <label class="block">
            <span class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Phone Number</span>
            <input 
              [(ngModel)]="form().phone" 
              [disabled]="!editing()"
              class="mt-1.5 w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-brand disabled:bg-surface-alt" 
            />
          </label>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  shop = inject(ShopService);
  
  user = this.shop.user;
  editing = signal(false);
  form = signal<any>({});
  
  ordersCount = signal(0);
  memberSince = signal('');

  ngOnInit() {
    this.resetForm();
    this.ordersCount.set(this.shop.orders().length);
    if (this.user()?.createdAt) {
      const date = new Date(this.user()!.createdAt);
      this.memberSince.set(date.toLocaleDateString(undefined, { month: "short", year: "numeric" }));
    }
  }

  resetForm() {
    const u = this.user();
    if (u) {
      this.form.set({
        fullName: u.fullName,
        email: u.email,
        phone: u.phone ?? "",
        avatarUrl: u.avatarUrl,
      });
    }
  }

  startEditing() {
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
    this.resetForm();
  }

  onAvatar(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.form.update(f => ({ ...f, avatarUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.form.update(f => ({ ...f, avatarUrl: undefined }));
  }

  save() {
    // In a real app we'd dispatch an update Profile event
    const current = this.user();
    if (current) {
      const updated = { ...current, ...this.form() };
      this.shop.user.set(updated);
      try { localStorage.setItem('nigson_user', JSON.stringify(updated)); } catch {}
    }
    this.editing.set(false);
  }

  initialsOf(name?: string) {
    if (!name) return 'U';
    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }
}
