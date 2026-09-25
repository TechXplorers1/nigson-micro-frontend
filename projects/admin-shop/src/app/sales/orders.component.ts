import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, StatCardComponent, BadgeComponent, statusTone, AdminOrder, AdminOrderStatus } from 'shared-ui';
import { LucideEye } from '@lucide/angular';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, StatCardComponent, BadgeComponent, LucideEye],
  template: `
    <lib-admin-heading title="Orders" subtitle="Every customer order, payment and delivery state"></lib-admin-heading>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total orders" [value]="admin.orders().length"></lib-stat-card>
      <lib-stat-card label="Pending" [value]="pendingCount()"></lib-stat-card>
      <lib-stat-card label="Delivered" [value]="deliveredCount()"></lib-stat-card>
      <lib-stat-card label="Revenue" [value]="revenue() | currency:'NGN':'symbol-narrow':'1.0-0'"></lib-stat-card>
    </div>

    <div class="mb-5 flex flex-wrap gap-3">
      <input type="text" [(ngModel)]="searchQuery" placeholder="Search order or customer..." class="w-64 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
      <select [(ngModel)]="statusFilter" class="rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        <option value="All statuses">All statuses</option>
        <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
      </select>
    </div>

    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-x-auto">
      <table class="w-full min-w-[720px] text-left text-sm text-ink">
        <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
          <tr>
            <th class="px-6 py-4">Order ID</th>
            <th class="px-6 py-4">Customer</th>
            <th class="px-6 py-4">Products</th>
            <th class="px-6 py-4">Amount</th>
            <th class="px-6 py-4">Payment</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4">Delivery</th>
            <th class="px-6 py-4">Date</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-hairline">
          <tr *ngFor="let o of filteredOrders()" class="transition-colors hover:bg-surface-alt/30">
            <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ o.number }}</td>
            <td class="px-6 py-4">
              {{ o.customer.name }}<br>
              <span class="text-xs text-muted-ink">{{ o.customer.email }}</span>
            </td>
            <td class="px-6 py-4 text-muted-ink">{{ o.items.length }} items</td>
            <td class="px-6 py-4 font-semibold">{{ o.total | currency:'NGN':'symbol-narrow':'1.0-0' }}</td>
            <td class="px-6 py-4"><lib-badge [tone]="getTone(o.paymentStatus)">{{ o.paymentStatus }}</lib-badge></td>
            <td class="px-6 py-4"><lib-badge [tone]="getTone(o.status)">{{ o.status }}</lib-badge></td>
            <td class="px-6 py-4 text-muted-ink">{{ o.delivery }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-muted-ink">{{ o.date | date:'shortDate' }}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end">
                <button (click)="viewOrder = o" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="View order">
                  <svg lucideEye class="h-4 w-4"></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredOrders().length === 0">
            <td colspan="9" class="p-8 text-center text-muted-ink">No orders match your filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal view (Simplified) -->
    <div *ngIf="viewOrder" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Order {{ viewOrder.number }}</h2>
          <button (click)="viewOrder = null" class="text-muted-ink hover:text-ink">✕</button>
        </div>
        
        <div class="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-muted-ink uppercase font-bold">Customer</p>
            <p>{{ viewOrder.customer.name }}</p>
            <p class="text-sm text-muted-ink">{{ viewOrder.customer.email }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-ink uppercase font-bold">Total</p>
            <p class="font-bold text-brand">{{ viewOrder.total | currency:'NGN':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="mb-2 font-bold">Items</h3>
          <ul class="divide-y divide-hairline rounded-lg border border-hairline">
            <li *ngFor="let it of viewOrder.items" class="flex justify-between p-3 text-sm">
              <span>{{ it.qty }}x {{ it.name }}</span>
              <span class="font-medium">{{ (it.price * it.qty) | currency:'NGN':'symbol-narrow':'1.0-0' }}</span>
            </li>
          </ul>
        </div>

        <div class="flex items-center gap-2">
          <select #st class="flex-1 rounded-xl border border-hairline bg-surface-alt px-4 py-2" [value]="viewOrder.status">
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>
          <button (click)="admin.setOrderStatus(viewOrder.id, st.value); viewOrder = null" class="rounded-xl bg-brand px-4 py-2 font-bold text-white">Save Status</button>
        </div>
      </div>
    </div>
  `
})
export class AdminOrdersComponent {
  admin = inject(AdminService);
  
  searchQuery = signal('');
  statusFilter = signal('All statuses');
  statuses: string[] = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];
  
  viewOrder: any = null;

  pendingCount = computed(() => this.admin.orders().filter(o => o.status === 'Pending').length);
  deliveredCount = computed(() => this.admin.orders().filter(o => o.status === 'Delivered').length);
  revenue = computed(() => this.admin.orders().filter(o => o.status !== 'Cancelled').reduce((n, o) => n + o.total, 0));

  filteredOrders = computed(() => {
    let list = this.admin.orders();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(o => (o.number + o.customer.name + o.customer.email).toLowerCase().includes(q));
    }
    const s = this.statusFilter();
    if (s !== 'All statuses') {
      list = list.filter(o => o.status === s);
    }
    return list;
  });

  getTone(status: string) {
    return statusTone(status);
  }
}

