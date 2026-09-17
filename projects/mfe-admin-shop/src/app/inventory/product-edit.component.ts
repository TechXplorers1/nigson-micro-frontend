import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, AdminHeadingComponent } from 'shared-ui';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent],
  template: `
    <lib-admin-heading [title]="isNew() ? 'New Product' : 'Edit Product'"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden p-6 max-w-3xl">
      <form (ngSubmit)="save()" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">Name</label>
          <input type="text" [(ngModel)]="product.name" name="name" required class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">SKU</label>
          <input type="text" [(ngModel)]="product.sku" name="sku" required class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">Category</label>
          <input type="text" [(ngModel)]="product.category" name="category" required class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        </div>
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">Price</label>
          <input type="number" [(ngModel)]="product.price" name="price" required class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        </div>
        
        <div class="flex gap-4 pt-4 border-t border-hairline">
          <button type="button" (click)="cancel()" class="rounded-xl px-4 py-2 text-sm font-bold text-muted-ink hover:bg-surface-alt">Cancel</button>
          <button type="submit" class="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Save Product</button>
        </div>
      </form>
    </div>
  `
})
export class ProductEditComponent {
  admin = inject(AdminService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  isNew = signal(false);
  product: any = {};

  constructor() {
    this.route.paramMap.subscribe(params => {
      const sku = params.get('sku');
      if (sku) {
        const existing = this.admin.products().find(p => p.sku === sku);
        if (existing) {
          this.product = { ...existing };
        } else {
          this.router.navigate(['/admin/inventory/products']);
        }
      } else {
        this.isNew.set(true);
        this.product = { status: 'Draft', stock: 0 };
      }
    });
  }

  save() {
    if (this.isNew()) {
      this.admin.products.update(p => [...p, { ...this.product, id: Math.random().toString() }]);
    } else {
      this.admin.products.update(p => p.map(x => x.sku === this.product.sku ? this.product : x));
    }
    this.router.navigate(['/admin/inventory/products']);
  }

  cancel() {
    this.router.navigate(['/admin/inventory/products']);
  }
}
