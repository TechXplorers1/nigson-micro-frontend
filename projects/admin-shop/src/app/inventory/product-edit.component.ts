import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, AdminHeadingComponent } from 'shared-ui';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AdminHeadingComponent],
  template: `
    <lib-admin-heading [title]="isNew() ? 'New Product' : 'Edit Product'"></lib-admin-heading>
    
    <form (ngSubmit)="save()" class="space-y-6 max-w-5xl pb-12">
      <!-- Basic information -->
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm">
        <h2 class="mb-6 text-sm font-extrabold uppercase tracking-[0.12em] text-muted-ink">Basic information</h2>
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Product name *</label>
            <input type="text" [(ngModel)]="product.name" name="name" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">SKU *</label>
            <input type="text" [(ngModel)]="product.sku" name="sku" required [disabled]="!isNew()" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:bg-gray-50 disabled:text-gray-500">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Category *</label>
            <select [(ngModel)]="product.category" name="category" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Brand</label>
            <input type="text" [(ngModel)]="product.brand" name="brand" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div class="sm:col-span-2">
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Product type</label>
            <input type="text" [(ngModel)]="product.type" name="type" placeholder="e.g. Wireless charger" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
        </div>
      </div>

      <!-- Product details -->
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm">
        <h2 class="mb-6 text-sm font-extrabold uppercase tracking-[0.12em] text-muted-ink">Product details</h2>
        <div class="grid gap-6 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Description</label>
            <textarea [(ngModel)]="product.desc" name="desc" rows="3" class="w-full rounded-[20px] border border-gray-200 bg-white px-5 py-4 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"></textarea>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Features</label>
            <textarea [(ngModel)]="product.features" name="features" rows="3" placeholder="One feature per line" class="w-full rounded-[20px] border border-gray-200 bg-white px-5 py-4 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"></textarea>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Specifications</label>
            <textarea [(ngModel)]="product.specs" name="specs" rows="3" placeholder="One specification per line" class="w-full rounded-[20px] border border-gray-200 bg-white px-5 py-4 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Packaging information</label>
            <input type="text" [(ngModel)]="product.packaging" name="packaging" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
        </div>
      </div>

      <!-- Product Images -->
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm">
        <h2 class="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-muted-ink">Product Images (5-Image Gallery)</h2>
        <p class="mb-6 text-xs text-muted-ink">Manage up to 5 images for the product detail gallery. Slot 1 is the Primary / Main Product Image.</p>
        
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div *ngFor="let idx of [0, 1, 2, 3, 4]" 
               [class]="'flex flex-col justify-between rounded-2xl border p-4 transition-all ' + (idx === 0 ? 'border-brand bg-brand/5 shadow-sm' : 'border-gray-100 bg-white')">
            <div>
              <div class="mb-1 flex items-center justify-between gap-1">
                <span class="text-xs font-extrabold text-ink">{{ idx === 0 ? 'Main Product Image' : 'Product Image ' + (idx + 1) }}</span>
                <span *ngIf="idx === 0" class="rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Primary</span>
                <span *ngIf="idx !== 0" class="text-[10px] font-semibold text-muted-ink">Optional</span>
              </div>
              <p class="mb-3 text-[11px] text-muted-ink leading-tight">{{ idx === 0 ? 'Primary product image' : 'Additional product image' }}</p>

              <div class="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-50 mb-3 grid place-items-center">
                <img *ngIf="product.images[idx]" [src]="product.images[idx]" class="h-full w-full object-cover">
                <span *ngIf="!product.images[idx]" class="text-xs font-semibold text-muted-ink">No image</span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block w-full text-center cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand transition-colors shadow-sm">
                {{ product.images[idx] ? 'Replace Image' : 'Upload Image' }}
                <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event, idx)">
              </label>

              <button *ngIf="product.images[idx]" type="button" (click)="removeImage(idx)" class="w-full text-center text-xs font-semibold text-brand hover:underline pt-0.5">
                Remove Image
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm">
        <h2 class="mb-6 text-sm font-extrabold uppercase tracking-[0.12em] text-muted-ink">Pricing (₦)</h2>
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Retail price *</label>
            <input type="number" [(ngModel)]="product.retail" name="retail" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Wholesale price</label>
            <input type="number" [(ngModel)]="product.wholesale" name="wholesale" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Distributor price</label>
            <input type="number" [(ngModel)]="product.distributor" name="distributor" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
        </div>
      </div>

      <!-- Inventory -->
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm">
        <h2 class="mb-6 text-sm font-extrabold uppercase tracking-[0.12em] text-muted-ink">Inventory</h2>
        <div class="grid gap-6 sm:grid-cols-2 mb-4">
          <div *ngIf="isNew()">
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Opening stock *</label>
            <input type="number" [(ngModel)]="product.stock" name="stock" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div *ngIf="!isNew()">
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Current stock (managed by stock movements)</label>
            <input type="number" [(ngModel)]="product.stock" name="stock" disabled class="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500 shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Low stock level *</label>
            <input type="number" [(ngModel)]="product.lowLevel" name="lowLevel" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
        </div>
        <p class="text-xs text-muted-ink">
          Availability is calculated automatically from current stock and the low stock level. Stock itself only changes through Stock In, Stock Adjustment, customer orders and returns.
        </p>
      </div>

      <div class="flex justify-end gap-4">
        <a routerLink="/admin/inventory/products" class="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-bold text-ink hover:bg-gray-50 shadow-sm transition-colors">Cancel</a>
        <button type="submit" class="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 shadow-sm transition-colors">Save product</button>
      </div>
    </form>
  `
})
export class ProductEditComponent {
  admin = inject(AdminService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  isNew = signal(false);
  
  categories = ['Earbuds', 'Power Banks', 'Wireless Chargers', 'Car Chargers', 'Home Chargers', 'Cables', 'Accessories'];

  product: any = {
    name: '',
    sku: '',
    category: this.categories[0],
    brand: 'Nigson',
    type: '',
    desc: '',
    features: '',
    specs: '',
    packaging: '',
    images: ['', '', '', '', ''],
    retail: 0,
    wholesale: 0,
    distributor: 0,
    stock: 0,
    lowLevel: 10,
    status: 'Active'
  };

  constructor() {
    this.route.paramMap.subscribe(params => {
      const sku = params.get('sku');
      if (sku) {
        const existing = this.admin.products().find(p => p.sku === sku);
        if (existing) {
          this.product = { ...existing };
          if (!this.product.images || this.product.images.length === 0) {
            this.product.images = [this.product.image || '', '', '', '', ''];
          }
          while (this.product.images.length < 5) this.product.images.push('');
          
          // Map price to retail if retail doesn't exist
          if (!this.product.retail && this.product.price) {
            this.product.retail = this.product.price;
          }
        } else {
          this.router.navigate(['/admin/inventory/products']);
        }
      } else {
        this.isNew.set(true);
      }
    });
  }

  onFileChange(event: any, index: number) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.product.images[index] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number) {
    this.product.images[index] = '';
  }

  save() {
    this.product.price = this.product.retail; // Sync price field if used elsewhere
    
    // Auto status
    this.product.status = this.product.stock > 0 ? 'Active' : 'Out of Stock';

    if (this.isNew()) {
      this.admin.products.update(p => [...p, { ...this.product, id: Math.random().toString() }]);
    } else {
      this.admin.products.update(p => p.map(x => x.sku === this.product.sku ? this.product : x));
    }
    this.router.navigate(['/admin/inventory/products']);
  }
}

