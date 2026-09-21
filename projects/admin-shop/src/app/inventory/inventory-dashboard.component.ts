import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, StatCardComponent } from 'shared-ui';
import { LucideBoxes, LucidePackageCheck, LucideAlertTriangle, LucideXCircle } from '@lucide/angular';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, AdminHeadingComponent, StatCardComponent, LucideBoxes, LucidePackageCheck, LucideAlertTriangle, LucideXCircle],
  template: `
    <lib-admin-heading title="Inventory" subtitle="Manage and monitor your product stock."></lib-admin-heading>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total products" [value]="admin.products().length" [icon]="true">
        <svg lucideBoxes class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="In stock" [value]="inStock()" [icon]="true">
        <svg lucidePackageCheck class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Low stock" [value]="lowStock()" [icon]="true">
        <svg lucideAlertTriangle class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Out of stock" [value]="outOfStock()" [icon]="true">
        <svg lucideXCircle class="h-5 w-5"></svg>
      </lib-stat-card>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <h2 class="mb-5 text-lg font-extrabold text-ink">Stock Overview</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-ink">
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
    </div>
  `
})
export class InventoryDashboardComponent {
  admin = inject(AdminService);

  inStock = computed(() => this.admin.products().filter((p) => p.stock > 10).length);
  lowStock = computed(() => this.admin.products().filter((p) => p.stock > 0 && p.stock <= 10).length);
  outOfStock = computed(() => this.admin.products().filter((p) => p.stock === 0).length);

  categories = computed(() => {
    const prods = this.admin.products();
    const cats = Array.from(new Set(prods.map((p) => p.category)));
    return cats.map((c) => {
      const items = prods.filter((p) => p.category === c);
      return { category: c, count: items.length, stock: items.reduce((n, p) => n + p.stock, 0) };
    });
  });
}
