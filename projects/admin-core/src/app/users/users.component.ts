import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone, AdminUser } from 'shared-ui';
import { LucidePlus, LucidePencil } from '@lucide/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, AdminHeadingComponent, BadgeComponent,
    LucidePlus, LucidePencil
  ],
  template: `
    <lib-admin-heading title="Admin Users" subtitle="Manage access to the Nigson admin portal">
      <button (click)="openNewUser()" *ngIf="isSuper()" class="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600">
        <svg lucidePlus class="h-4 w-4"></svg> New User
      </button>
    </lib-admin-heading>

    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 border-b border-hairline p-4 bg-surface/50">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search users by name or email..." class="flex-1 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        <select [(ngModel)]="roleFilter" class="rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
          <option value="All roles">All roles</option>
          <option *ngFor="let r of admin.roles()" [value]="r.name">{{ r.name }}</option>
        </select>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Name</th>
              <th class="px-6 py-4">Role</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Last Login</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let u of filteredUsers()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4">
                <p class="font-bold">{{ u.name }}</p>
                <p class="text-xs text-muted-ink">{{ u.email }}</p>
              </td>
              <td class="px-6 py-4">{{ roleName(u.roleId) }}</td>
              <td class="px-6 py-4">
                <lib-badge [tone]="getTone(u.status)">{{ u.status }}</lib-badge>
              </td>
              <td class="px-6 py-4 text-xs text-muted-ink">{{ u.lastLogin | date:'medium' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2" *ngIf="isSuper()">
                  <button class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="Edit">
                    <svg lucidePencil class="h-4 w-4"></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredUsers().length === 0">
              <td colspan="5" class="p-8 text-center text-muted-ink">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminUsersComponent {
  admin = inject(AdminService);
  
  searchQuery = signal('');
  roleFilter = signal('All roles');

  get isSuper() {
    return () => this.admin.currentRole()?.id === 'r_super';
  }

  get filteredUsers() {
    return () => {
      let users = this.admin.admins();
      const q = this.searchQuery().toLowerCase();
      if (q) {
        users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      const rf = this.roleFilter();
      if (rf !== 'All roles') {
        const rid = this.admin.roles().find(r => r.name === rf)?.id;
        users = users.filter(u => u.roleId === rid);
      }
      return users;
    };
  }

  roleName(id: string) {
    return this.admin.roles().find((r) => r.id === id)?.name ?? "—";
  }

  getTone(status: string) {
    return statusTone(status);
  }

  openNewUser() {
    alert('New user modal would open here.');
  }
}
