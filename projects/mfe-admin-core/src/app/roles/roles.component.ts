import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, BadgeComponent } from 'shared-ui';
import { LucideShieldCheck, LucidePencil } from '@lucide/angular';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [
    CommonModule, AdminHeadingComponent, BadgeComponent,
    LucideShieldCheck, LucidePencil
  ],
  template: `
    <lib-admin-heading title="Roles & Permissions" subtitle="Define what modules admin users can access"></lib-admin-heading>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div *ngFor="let r of admin.roles()" class="flex flex-col rounded-2xl border border-hairline bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div class="mb-4 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <svg lucideShieldCheck class="h-5 w-5"></svg>
            </div>
            <div>
              <h3 class="font-extrabold text-ink">{{ r.name }}</h3>
              <p class="text-xs text-muted-ink">{{ membersCount(r.id) }} members</p>
            </div>
          </div>
          <button *ngIf="isSuper()" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="Edit Role">
            <svg lucidePencil class="h-4 w-4"></svg>
          </button>
        </div>

        <div class="flex-1 space-y-2 border-t border-hairline pt-4">
          <p class="text-[10px] font-bold uppercase tracking-widest text-muted-ink">Permissions</p>
          <div class="flex flex-wrap gap-1.5">
            <lib-badge *ngFor="let p of r.permissions" tone="neutral" class="capitalize">{{ p }}</lib-badge>
            <p *ngIf="r.permissions.length === 0" class="text-xs text-muted-ink">No permissions assigned.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminRolesComponent {
  admin = inject(AdminService);

  get isSuper() {
    return () => this.admin.currentRole()?.id === 'r_super';
  }

  membersCount(roleId: string) {
    return this.admin.admins().filter(a => a.roleId === roleId).length;
  }
}
