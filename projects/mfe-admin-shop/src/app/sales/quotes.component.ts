import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone } from 'shared-ui';

@Component({
  selector: 'app-admin-quotes',
  standalone: true,
  imports: [CommonModule, AdminHeadingComponent, BadgeComponent],
  template: `
    <lib-admin-heading title="Quote Requests" subtitle="Manage wholesale quote requests from businesses"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Quote ID</th>
              <th class="px-6 py-4">Customer</th>
              <th class="px-6 py-4">Product</th>
              <th class="px-6 py-4">Quantity</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let q of admin.quotes()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4 font-semibold">{{ q.number }}</td>
              <td class="px-6 py-4">
                <p class="font-bold">{{ q.customer }}</p>
                <p class="text-xs text-muted-ink">{{ q.email }}</p>
                <p class="text-xs text-muted-ink">{{ q.phone }}</p>
              </td>
              <td class="px-6 py-4 font-semibold">{{ q.product }}<br><span class="font-normal text-xs text-muted-ink">{{ q.sku }}</span></td>
              <td class="px-6 py-4 font-semibold">{{ q.quantity }} units</td>
              <td class="px-6 py-4"><lib-badge [tone]="getTone(q.status)">{{ q.status }}</lib-badge></td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ q.date | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="admin.quotes().length === 0">
              <td colspan="6" class="p-8 text-center text-muted-ink">No quote requests found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminQuotesComponent {
  admin = inject(AdminService);
  getTone(status: string) { return statusTone(status); }
}
