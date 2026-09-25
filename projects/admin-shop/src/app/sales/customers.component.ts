import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone } from 'shared-ui';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, BadgeComponent],
  template: `
    <lib-admin-heading title="Customers" subtitle="Manage registered retail and wholesale clients"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 border-b border-hairline p-4 bg-surface/50">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search customers..." class="flex-1 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Customer</th>
              <th class="px-6 py-4">Location</th>
              <th class="px-6 py-4">Orders</th>
              <th class="px-6 py-4">Total Spend</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Joined</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let c of filteredCustomers()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4">
                <p class="font-bold">{{ c.name }}</p>
                <p class="text-xs text-muted-ink">{{ c.email }}</p>
                <p class="text-xs text-muted-ink">{{ c.phone }}</p>
              </td>
              <td class="px-6 py-4 text-muted-ink">{{ c.location }}</td>
              <td class="px-6 py-4 font-semibold">{{ c.orders }}</td>
              <td class="px-6 py-4 font-semibold text-brand">{{ c.spend | currency:'NGN':'symbol-narrow':'1.0-0' }}</td>
              <td class="px-6 py-4"><lib-badge [tone]="getTone(c.status)">{{ c.status }}</lib-badge></td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ c.joined | date:'mediumDate' }}</td>
            </tr>
            <tr *ngIf="filteredCustomers().length === 0">
              <td colspan="6" class="p-8 text-center text-muted-ink">No customers found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminCustomersComponent {
  admin = inject(AdminService);
  searchQuery = signal('');

  filteredCustomers = computed(() => {
    let list = this.admin.customers();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    return list;
  });

  getTone(status: string) { return statusTone(status); }
}

