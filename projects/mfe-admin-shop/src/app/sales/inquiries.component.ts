import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone } from 'shared-ui';

@Component({
  selector: 'app-admin-inquiries',
  standalone: true,
  imports: [CommonModule, AdminHeadingComponent, BadgeComponent],
  template: `
    <lib-admin-heading title="Contact Inquiries" subtitle="General questions and support requests"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Sender</th>
              <th class="px-6 py-4">Subject & Message</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let i of admin.inquiries()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4">
                <p class="font-bold">{{ i.name }}</p>
                <p class="text-xs text-muted-ink">{{ i.email }}</p>
                <p class="text-xs text-muted-ink">{{ i.phone }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-semibold">{{ i.subject }}</p>
                <p class="mt-1 line-clamp-2 max-w-md text-xs text-muted-ink">{{ i.message }}</p>
              </td>
              <td class="px-6 py-4"><lib-badge [tone]="getTone(i.status)">{{ i.status }}</lib-badge></td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ i.date | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="admin.inquiries().length === 0">
              <td colspan="4" class="p-8 text-center text-muted-ink">No inquiries found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminInquiriesComponent {
  admin = inject(AdminService);
  getTone(status: string) { return statusTone(status); }
}
