import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, BadgeComponent } from 'shared-ui';
import { LucidePlus, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminHeadingComponent, BadgeComponent, LucidePlus, LucidePencil, LucideTrash2],
  template: `
    <lib-admin-heading title="Products" subtitle="Manage your catalogue">
      <a routerLink="new" class="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600">
        <svg lucidePlus class="h-4 w-4"></svg> Add Product
      </a>
    </lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 border-b border-hairline p-4 bg-surface/50">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search products..." class="flex-1 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Product</th>
              <th class="px-6 py-4">Category</th>
              <th class="px-6 py-4">Price</th>
              <th class="px-6 py-4">Stock</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let p of filteredProducts()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4">
                <p class="font-bold">{{ p.name }}</p>
                <p class="text-xs text-muted-ink">{{ p.sku }}</p>
              </td>
              <td class="px-6 py-4 text-muted-ink">{{ p.category }}</td>
              <td class="px-6 py-4 font-semibold">{{ p.price | currency:'NGN':'symbol-narrow':'1.0-0' }}</td>
              <td class="px-6 py-4 font-semibold">{{ p.stock | number }}</td>
              <td class="px-6 py-4"><lib-badge [tone]="p.status === 'Active' ? 'success' : 'neutral'">{{ p.status }}</lib-badge></td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <a [routerLink]="[p.sku, 'edit']" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="Edit">
                    <svg lucidePencil class="h-4 w-4"></svg>
                  </a>
                  <button class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-rose-100 hover:text-rose-600" title="Delete">
                    <svg lucideTrash2 class="h-4 w-4"></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredProducts().length === 0">
              <td colspan="6" class="p-8 text-center text-muted-ink">No products found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ProductListComponent {
  admin = inject(AdminService);
  searchQuery = signal('');

  filteredProducts = computed(() => {
    let list = this.admin.products();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return list;
  });
}
