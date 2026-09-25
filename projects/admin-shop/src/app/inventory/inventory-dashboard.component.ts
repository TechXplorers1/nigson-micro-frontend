import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, StatCardComponent } from 'shared-ui';
import { LucideBoxes, LucidePackageCheck, LucideAlertTriangle, LucideXCircle } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, AdminHeadingComponent, StatCardComponent, LucideBoxes, LucidePackageCheck, LucideAlertTriangle, LucideXCircle, RouterLink],
  template: `
    <lib-admin-heading title="Inventory" subtitle="Manage and monitor your product stock."></lib-admin-heading>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total products" [value]="admin.products().length" [icon]="true">
        <svg lucideBoxes class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="In stock" [value]="inStock()" [icon]="true">
        <svg lucidePackageCheck class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Low stock" [value]="lowStock().length" [icon]="true">
        <svg lucideAlertTriangle class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Out of stock" [value]="outOfStock()" [icon]="true">
        <svg lucideXCircle class="h-5 w-5"></svg>
      </lib-stat-card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <h2 class="mb-5 text-lg font-extrabold text-ink">Stock Overview</h2>
        <div class="overflow-x-auto rounded-md border border-hairline">
          <table class="w-full min-w-[720px] text-left text-sm text-ink">
            <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
              <tr>
                <th class="px-4 py-3">Category</th>
                <th class="px-4 py-3">Products</th>
                <th class="px-4 py-3">Total stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline">
              <tr *ngFor="let c of categories()" class="transition-colors hover:bg-surface-alt/60">
                <td class="px-4 py-3 font-semibold">{{ c.category }}</td>
                <td class="px-4 py-3">{{ c.count }}</td>
                <td class="px-4 py-3 font-semibold">{{ c.stock | number }}</td>
              </tr>
              <tr *ngIf="categories().length === 0">
                <td colspan="3" class="p-8 text-center text-muted-ink">No products in the catalogue yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <h2 class="mb-5 text-lg font-extrabold text-ink">Recent Inventory Activity</h2>
        <div class="overflow-x-auto rounded-md border border-hairline">
          <table class="w-full min-w-[720px] text-left text-sm text-ink">
            <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
              <tr>
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Product</th>
                <th class="px-4 py-3">Activity</th>
                <th class="px-4 py-3 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline">
              <tr *ngFor="let m of movements()" class="transition-colors hover:bg-surface-alt/60">
                <td class="px-4 py-3 whitespace-nowrap text-muted-ink">{{ m.date | date:'mediumDate' }}</td>
                <td class="px-4 py-3 font-semibold">{{ m.product }}</td>
                <td class="px-4 py-3">
                  <span 
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    [ngClass]="{
                      'bg-sky-50 text-sky-700': m.type === 'Order',
                      'bg-amber-50 text-amber-700': m.type === 'Adjustment',
                      'bg-slate-100 text-slate-700': m.type !== 'Order' && m.type !== 'Adjustment'
                    }"
                  >
                    {{ m.type }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <span 
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    [ngClass]="m.qty >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                  >
                    {{ m.qty >= 0 ? '+' : '' }}{{ m.qty }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="movements().length === 0">
                <td colspan="4" class="p-8 text-center text-muted-ink">No inventory activity recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="mt-6 rounded-2xl border border-hairline bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-extrabold text-ink">Low Stock Products</h2>
        <a routerLink="/admin/inventory/low-stock" class="inline-flex h-8 items-center justify-center rounded-md border border-ink bg-transparent px-3 text-xs font-bold text-ink transition-colors hover:bg-ink hover:text-white">
          View all
        </a>
      </div>
      <div class="overflow-x-auto rounded-md border border-hairline">
        <table class="w-full min-w-[720px] text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Current stock</th>
              <th class="px-4 py-3">Low stock level</th>
              <th class="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let p of lowStock().slice(0, 5)" class="transition-colors hover:bg-surface-alt/60">
              <td class="px-4 py-3 font-semibold">
                {{ p.name }}<br />
                <span class="text-xs font-normal text-muted-ink">₦{{ p.retail | number }}</span>
              </td>
              <td class="px-4 py-3">{{ p.sku }}</td>
              <td class="px-4 py-3 font-semibold">{{ p.stock }}</td>
              <td class="px-4 py-3 text-muted-ink">{{ p.lowLevel }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Low Stock
                </span>
              </td>
            </tr>
            <tr *ngIf="lowStock().length === 0">
              <td colspan="5" class="p-8 text-center text-muted-ink">No products are below their low stock level.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class InventoryDashboardComponent {
  admin = inject(AdminService);

  inStock = computed(() => this.admin.products().filter((p) => p.stock > 10).length);
  lowStock = computed(() => this.admin.products().filter((p) => p.stock > 0 && p.stock <= 10));
  outOfStock = computed(() => this.admin.products().filter((p) => p.stock === 0).length);
  
  // Dummy movements since AdminService might not provide a movements() list right now
  movements = computed(() => [
    { id: 1, date: new Date('2026-08-12'), product: 'Household Essentials Bundle', type: 'Opening Stock', qty: 50 },
    { id: 2, date: new Date('2026-08-11'), product: 'Zarina Personal Care Range', type: 'Opening Stock', qty: 20 },
    { id: 3, date: new Date('2026-08-10'), product: 'Rechargeable LED Night Lamp', type: 'Adjustment', qty: -5 },
    { id: 4, date: new Date('2026-08-09'), product: '6-Outlet Power Strip', type: 'Order', qty: -2 },
    { id: 5, date: new Date('2026-08-08'), product: 'GaN Adapter 100W', type: 'Opening Stock', qty: 100 },
  ]);

  categories = computed(() => {
    const prods = this.admin.products();
    const cats = Array.from(new Set(prods.map((p) => p.category)));
    return cats.map((c) => {
      const items = prods.filter((p) => p.category === c);
      return { category: c, count: items.length, stock: items.reduce((n, p) => n + p.stock, 0) };
    });
  });
}


