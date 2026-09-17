import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone } from 'shared-ui';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, AdminHeadingComponent, BadgeComponent],
  template: `
    <lib-admin-heading title="Distributor Applications" subtitle="Review applications to join the wholesale network"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">App ID</th>
              <th class="px-6 py-4">Business</th>
              <th class="px-6 py-4">Type</th>
              <th class="px-6 py-4">Location</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let a of admin.applications()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4 font-semibold">{{ a.number }}</td>
              <td class="px-6 py-4">
                <p class="font-bold">{{ a.businessName }}</p>
                <p class="text-xs text-muted-ink">{{ a.contactPerson }}</p>
                <p class="text-xs text-muted-ink">{{ a.email }}</p>
              </td>
              <td class="px-6 py-4">{{ a.type }}<br><span class="text-xs text-muted-ink">{{ a.category }}</span></td>
              <td class="px-6 py-4 text-muted-ink">{{ a.location }}</td>
              <td class="px-6 py-4"><lib-badge [tone]="getTone(a.status)">{{ a.status }}</lib-badge></td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ a.date | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="admin.applications().length === 0">
              <td colspan="6" class="p-8 text-center text-muted-ink">No applications found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminApplicationsComponent {
  admin = inject(AdminService);
  getTone(status: string) { return statusTone(status); }
}
