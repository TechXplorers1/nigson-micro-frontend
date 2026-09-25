import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, BadgeComponent } from 'shared-ui';
import { LucidePlus, LucidePencil, LucideTrash2, LucideSearch, LucideEye } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminHeadingComponent, BadgeComponent, LucidePlus, LucidePencil, LucideTrash2, LucideSearch, LucideEye],
  template: `
    <lib-admin-heading title="Products" [subtitle]="admin.products().length + ' products tracked in inventory'">
      <a routerLink="new" class="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-600 shadow-sm">
        <svg lucidePlus class="h-4 w-4"></svg> Add product
      </a>
    </lib-admin-heading>
    
    <div class="mb-6 flex flex-wrap items-center gap-4">
      <div class="relative w-[300px]">
        <svg lucideSearch class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"></svg>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search product or SKU..." class="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-ink shadow-sm outline-none transition-all focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
      </div>
      
      <select class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
        <option>All categories</option>
      </select>
      
      <select class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
        <option>All brands</option>
      </select>
      
      <select class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
        <option>All</option>
      </select>
    </div>
    
    <div class="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm text-ink">
          <thead class="border-b border-gray-100 bg-white text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-5">Product</th>
              <th class="px-6 py-5">SKU</th>
              <th class="px-6 py-5">Category</th>
              <th class="px-6 py-5">Price</th>
              <th class="px-6 py-5">Stock</th>
              <th class="px-6 py-5">Status</th>
              <th class="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let p of filteredProducts()" class="transition-colors hover:bg-gray-50/50 group">
              <td class="px-6 py-4">
                <div class="flex items-center gap-4">
                  <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                    <img *ngIf="p.images?.length" [src]="p.images[0]" [alt]="p.name" class="h-full w-full object-cover">
                  </div>
                  <p class="font-bold text-ink">{{ p.name }}</p>
                </div>
              </td>
              <td class="px-6 py-4 text-ink font-medium">{{ p.sku }}</td>
              <td class="px-6 py-4 text-muted-ink">{{ p.category }}</td>
              <td class="px-6 py-4 font-bold text-ink">{{ p.price | currency:'NGN':'symbol-narrow':'1.0-0' }}</td>
              <td class="px-6 py-4 font-bold text-ink">{{ p.stock | number }}</td>
              <td class="px-6 py-4">
                <span 
                  [class]="p.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'"
                  class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors"
                >
                  {{ p.stock > 0 ? 'In Stock' : 'Out of Stock' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-1.5 transition-opacity">
                  <button class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm" title="View">
                    <svg lucideEye class="h-3.5 w-3.5"></svg>
                  </button>
                  <a [routerLink]="[p.sku, 'edit']" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm" title="Edit">
                    <svg lucidePencil class="h-3.5 w-3.5"></svg>
                  </a>
                  <button class="grid h-8 w-8 place-items-center rounded-full border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all shadow-sm" title="Delete">
                    <svg lucideTrash2 class="h-3.5 w-3.5"></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredProducts().length === 0">
              <td colspan="7" class="p-12 text-center text-muted-ink">
                <div class="flex flex-col items-center justify-center gap-3">
                  <div class="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                    <svg lucideSearch class="h-5 w-5 text-gray-400"></svg>
                  </div>
                  <p class="font-medium">No products found.</p>
                </div>
              </td>
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

