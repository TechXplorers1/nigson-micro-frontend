import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, CatalogService, OFFICIAL_SKU_PRICES, extractSku, resolveCategoryFromSku } from 'shared-ui';

export interface CustomSpec {
  key: string;
  value: string;
}

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-6 max-w-6xl pb-20">
      <!-- Top Action Bar -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div class="flex items-center gap-3">
          <a routerLink="/admin/inventory/products" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-ink hover:bg-gray-50 transition-colors shadow-sm" title="Back to products">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-xl md:text-2xl font-black text-ink tracking-tight">
                {{ isNew() ? 'New Product' : (product.name || 'Edit Product') }}
              </h1>
              <span [class]="product.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'"
                    class="rounded-full border px-2.5 py-0.5 text-[11px] font-bold">
                {{ product.status || 'Active' }}
              </span>
            </div>
            <p class="text-xs text-muted-ink mt-0.5 font-mono">
              SKU: {{ product.sku || 'NG-NEW' }} • Category: {{ product.category }} • Starting Price: ₦{{ (product.retail || product.price || 0) | number }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- View live product on storefront -->
          <a *ngIf="!isNew()" 
             [routerLink]="['/products', product.id || product.sku]" 
             target="_blank"
             class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-ink hover:border-brand hover:text-brand transition-colors shadow-sm">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View on Store
          </a>

          <a routerLink="/admin/inventory/products" 
             class="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-ink hover:bg-gray-50 transition-colors shadow-sm">
            Cancel
          </a>
          <button (click)="save()" 
                  type="button" 
                  [disabled]="isSaving()"
                  class="rounded-full bg-brand px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand/20 hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            <svg *ngIf="isSaving()" class="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSaving() ? 'Saving...' : (isNew() ? 'Create Product' : 'Save Changes') }}</span>
          </button>
        </div>
      </div>

      <!-- Success Notification Banner -->
      <div *ngIf="saveSuccess()" class="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-xs font-bold text-emerald-800 animate-fade-in shadow-sm">
        <div class="flex items-center gap-2">
          <svg class="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Product details saved successfully and live across the store!
          <a *ngIf="product.sku" [routerLink]="['/products', product.id || product.sku]" target="_blank" class="ml-2 underline text-emerald-900 font-extrabold hover:text-brand">
            Open Live Product Page →
          </a>
        </div>
        <button (click)="saveSuccess.set(false)" class="text-emerald-700 hover:text-emerald-900 font-bold">✕</button>
      </div>

      <!-- SECTION 1: STOREFRONT HERO LAYOUT (Image Gallery on Left, Core Product Info & Pricing on Right) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- LEFT: 5-Image Gallery (S3 Storage) -->
        <div class="lg:col-span-5 rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm space-y-5">
          <div class="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Product Images (5-Slot Gallery)</h2>
              <p class="text-[11px] text-muted-ink mt-0.5">S3 storage • Slot 1 is Primary/Hero Image</p>
            </div>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {{ activeImageCount() }}/5 active
            </span>
          </div>

          <div *ngIf="uploadError()" class="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-red-700">
            {{ uploadError() }}
          </div>

          <!-- Slot 1: Primary Main Image (Large View) -->
          <div class="rounded-2xl border-2 border-brand/80 bg-brand/5 p-3.5 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-ink flex items-center gap-1.5">
                <span class="h-2 w-2 rounded-full bg-brand"></span> Main Product Image
              </span>
              <span class="rounded-full bg-brand px-2 py-0.5 text-[10px] font-extrabold uppercase text-white tracking-wider">Primary</span>
            </div>
            
            <div class="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-white grid place-items-center">
              <div *ngIf="uploadingSlot() === 0" class="flex flex-col items-center justify-center gap-2 p-3">
                <svg class="h-6 w-6 animate-spin text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-xs font-bold text-brand">Uploading to S3...</span>
              </div>
              <ng-container *ngIf="uploadingSlot() !== 0">
                <img *ngIf="product.images[0]" [src]="product.images[0]" class="h-full w-full object-contain p-2" alt="Primary product image">
                <span *ngIf="!product.images[0]" class="text-xs font-semibold text-muted-ink">No primary image selected</span>
              </ng-container>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <label [class.pointer-events-none]="uploadingSlot() !== null"
                     class="flex-1 text-center cursor-pointer rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand transition-colors shadow-sm">
                {{ product.images[0] ? 'Replace Primary' : 'Upload Primary Image' }}
                <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event, 0)" [disabled]="uploadingSlot() !== null">
              </label>
              <button *ngIf="product.images[0]" type="button" (click)="removeImage(0)" [disabled]="uploadingSlot() !== null" class="text-xs font-semibold text-red-600 hover:underline px-2">
                Remove
              </button>
            </div>
          </div>

          <!-- Slots 2 to 5: Additional Detail Gallery Slots -->
          <div class="space-y-2">
            <p class="text-[11px] font-bold uppercase tracking-wider text-muted-ink">Additional Gallery Images (Slots 2–5)</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div *ngFor="let idx of [1, 2, 3, 4]" class="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-2">
                <div class="mb-1 flex items-center justify-between">
                  <span class="text-[10px] font-bold text-muted-ink">Slot {{ idx + 1 }}</span>
                </div>

                <div class="relative aspect-square w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50 mb-2 grid place-items-center">
                  <div *ngIf="uploadingSlot() === idx" class="flex flex-col items-center justify-center p-1">
                    <svg class="h-4 w-4 animate-spin text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <ng-container *ngIf="uploadingSlot() !== idx">
                    <img *ngIf="product.images[idx]" [src]="product.images[idx]" class="h-full w-full object-contain p-1" [alt]="'Slot ' + (idx + 1)">
                    <span *ngIf="!product.images[idx]" class="text-[10px] font-medium text-muted-ink">Empty</span>
                  </ng-container>
                </div>

                <div class="space-y-1">
                  <label [class.pointer-events-none]="uploadingSlot() !== null"
                         class="block w-full text-center cursor-pointer rounded-full border border-gray-200 bg-white px-1.5 py-1 text-[10px] font-bold text-ink hover:border-brand hover:text-brand transition-colors shadow-xs">
                    {{ product.images[idx] ? 'Replace' : 'Upload' }}
                    <input type="file" accept="image/*" class="hidden" (change)="onFileChange($event, idx)" [disabled]="uploadingSlot() !== null">
                  </label>
                  <button *ngIf="product.images[idx]" type="button" (click)="removeImage(idx)" [disabled]="uploadingSlot() !== null" class="w-full text-center text-[10px] font-semibold text-red-600 hover:underline">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Storefront Hero Details, Pricing & Feature Bullets -->
        <div class="lg:col-span-7 space-y-6">
          
          <!-- Basic Info Card -->
          <div class="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Product Identification & Category</h2>
            
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Product Name *</label>
                <input type="text" [(ngModel)]="product.name" name="name" required class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 font-bold">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">SKU Model Code *</label>
                <input type="text" [(ngModel)]="product.sku" name="sku" required class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-mono font-bold text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Category *</label>
                <select [(ngModel)]="product.category" name="category" required class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
                  <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Brand</label>
                <input type="text" [(ngModel)]="product.brand" name="brand" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Catalog Status</label>
                <select [(ngModel)]="product.status" name="status" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 font-semibold">
                  <option value="Active">Active (Live in Store)</option>
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Draft">Draft</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Pricing & Commercial Tiers Card -->
          <div class="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Commercial Pricing (₦)</h2>
                <p class="text-[11px] text-muted-ink mt-0.5">Controls the "Starting From" price on the customer card and distributor rate</p>
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-brand">Starting Price (₦) *</label>
                <input type="number" [(ngModel)]="product.retail" name="retail" required class="w-full rounded-2xl border-2 border-brand/50 bg-brand/5 px-4 py-2.5 text-base font-black text-brand shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
                <p class="mt-1 text-[10px] text-muted-ink font-semibold">Displays on storefront card.</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Wholesale Rate (₦)</label>
                <input type="number" [(ngModel)]="product.wholesale" name="wholesale" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
                <p class="mt-1 text-[10px] text-muted-ink">For bulk orders.</p>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Distributor Rate (₦)</label>
                <input type="number" [(ngModel)]="product.distributor" name="distributor" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
                <p class="mt-1 text-[10px] text-muted-ink">For verified partners.</p>
              </div>

              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Price Subtitle Text</label>
                <input type="text" [(ngModel)]="product.priceSubtitle" name="priceSubtitle" placeholder="Wholesale pricing available for distributors." class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>
            </div>
          </div>

          <!-- Short Description & Hero Feature Bullets Card -->
          <div class="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Hero Presentation (Under Price)</h2>

            <div>
              <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Short Summary Description *</label>
              <textarea [(ngModel)]="product.desc" name="desc" rows="2" required placeholder="Nigson NS901C Type-C to Type-C Cable supporting up to 65W fast charging..." class="w-full rounded-2xl border border-gray-200 bg-white p-3.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 leading-relaxed"></textarea>
              <p class="mt-1 text-[10px] text-muted-ink">Renders immediately under the price and rating.</p>
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Key Feature Bullets (Red Checkmarks) — one per line</label>
              <textarea [(ngModel)]="product.features" name="features" rows="4" placeholder="Wholesale & retail pricing&#10;Nationwide delivery from Lagos hub&#10;12-month standard warranty&#10;Bulk discounts for distributors" class="w-full rounded-2xl border border-gray-200 bg-white p-3.5 text-xs font-mono text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 leading-relaxed"></textarea>
              <p class="mt-1 text-[10px] text-muted-ink">Appears with red checkmarks beside the main image.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- SECTION 2: STOREFRONT DETAIL TABS (Mirrors Product Page Tabs 1-to-1) -->
      <div class="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden">
        <!-- Tabs Header Bar -->
        <div class="border-b border-gray-100 bg-gray-50/50 px-6 pt-2">
          <nav class="flex gap-4 sm:gap-8 overflow-x-auto" aria-label="Tabs">
            <button type="button"
                    *ngFor="let tab of tabs"
                    (click)="activeTab.set(tab.id)"
                    [ngClass]="activeTab() === tab.id ? 'border-brand text-brand font-black' : 'border-transparent text-muted-ink hover:text-ink font-bold'"
                    class="whitespace-nowrap border-b-2 py-4 px-2 text-xs md:text-sm transition-colors flex items-center gap-2">
              <span>{{ tab.label }}</span>
            </button>
          </nav>
        </div>

        <div class="p-7">
          <!-- TAB 1: Description Tab Panel -->
          <div *ngIf="activeTab() === 'description'" class="space-y-6 max-w-4xl">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold uppercase tracking-widest text-muted-ink">Section Heading</span>
                <span class="text-[11px] text-muted-ink font-mono">Auto-generated: {{ product.name }} Overview</span>
              </div>
              <p class="text-xs text-muted-ink">The customer page renders a prominent overview header using the product name.</p>
            </div>

            <div>
              <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Extended Overview Paragraph</label>
              <textarea [(ngModel)]="product.overview" name="overview" rows="3" placeholder="Engineered to meet the highest standards of durability and performance across Nigerian markets. Suitable for both wholesale commercial resale and direct consumer use." class="w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 leading-relaxed"></textarea>
              <p class="mt-1 text-[11px] text-muted-ink">Displayed under the product overview heading.</p>
            </div>

            <div class="border-t border-gray-100 pt-5">
              <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Key Highlights Box Bullets — one per line</label>
              <textarea [(ngModel)]="product.highlights" name="highlights" rows="4" placeholder="Wholesale & retail pricing tier&#10;Fast dispatch from central Lagos hub&#10;12-month standard Nigson warranty&#10;Bulk order distributor volume discounts" class="w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs font-mono text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 leading-relaxed"></textarea>
              <p class="mt-1 text-[11px] text-muted-ink">Renders inside the shaded 'Key Highlights' container with green checkmarks.</p>
            </div>
          </div>

          <!-- TAB 2: Specifications Tab Panel -->
          <div *ngIf="activeTab() === 'specifications'" class="space-y-6">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Standard Specifications (Table)</h3>
              <p class="text-xs text-muted-ink mt-0.5">These correspond to the rows shown in the Specifications tab on the customer product page.</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Warranty</label>
                <input type="text" [(ngModel)]="product.warranty" name="warranty" placeholder="12 Months Standard Manufacturer Warranty" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Connectors / Interface</label>
                <input type="text" [(ngModel)]="product.connectors" name="connectors" placeholder="Type-C to Type-C" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Power Rating / Output</label>
                <input type="text" [(ngModel)]="product.powerRating" name="powerRating" placeholder="65W PD" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Device Compatibility</label>
                <input type="text" [(ngModel)]="product.compatibility" name="compatibility" placeholder="Universal iOS / Android / USB-C Standards Compliant" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Build Material</label>
                <input type="text" [(ngModel)]="product.buildMaterial" name="buildMaterial" placeholder="Premium Grade Fire-Retardant Polymer & Alloy" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Quality Certification</label>
                <input type="text" [(ngModel)]="product.certification" name="certification" placeholder="CE / RoHS / FCC Quality Verified" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Importer & Distributor</label>
                <input type="text" [(ngModel)]="product.importer" name="importer" placeholder="Nigson Group Ltd, Lagos Nigeria" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>
            </div>

            <!-- Custom / Additional Specifications Table -->
            <div class="border-t border-gray-100 pt-6 space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Custom / Additional Specifications</h4>
                  <p class="text-[11px] text-muted-ink mt-0.5">Add any custom key-value pairs (e.g. Length, Cable Weight, Fast Charging Protocol) that appear as rows in the specifications table.</p>
                </div>
                <button type="button" (click)="addCustomSpec()" class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-brand hover:text-brand shadow-sm transition-colors">
                  + Add Spec Row
                </button>
              </div>

              <div *ngIf="customSpecs.length === 0" class="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-muted-ink">
                No custom specifications added. Click "+ Add Spec Row" to add custom rows like Length, Material, etc.
              </div>

              <div *ngIf="customSpecs.length > 0" class="space-y-2.5">
                <div *ngFor="let spec of customSpecs; let i = index" class="flex items-center gap-3">
                  <input type="text" [(ngModel)]="spec.key" placeholder="Spec Name (e.g. Cable Length)" class="w-1/3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-ink font-semibold shadow-sm focus:border-brand focus:outline-none">
                  <input type="text" [(ngModel)]="spec.value" placeholder="Spec Value (e.g. 1.2m Braided)" class="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-ink shadow-sm focus:border-brand focus:outline-none">
                  <button type="button" (click)="removeCustomSpec(i)" class="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors" title="Delete specification">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: Packaging Tab Panel -->
          <div *ngIf="activeTab() === 'packaging'" class="space-y-6 max-w-4xl">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Packaging & Box Contents</h3>
              <p class="text-xs text-muted-ink mt-0.5">Corresponds directly to the Packaging tab on the customer product page.</p>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Retail Box Contents — one per line</label>
                <textarea [(ngModel)]="product.packaging" name="packaging" rows="4" placeholder="1x Unit&#10;1x User Manual & Setup Guide&#10;1x Nigson Warranty Card" class="w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs font-mono text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 leading-relaxed"></textarea>
                <p class="mt-1 text-[11px] text-muted-ink">Displayed as bullet points inside the Retail Box Contents card.</p>
              </div>

              <div>
                <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Master Carton Specs — one per line</label>
                <textarea [(ngModel)]="product.cartonSpecs" name="cartonSpecs" rows="4" placeholder="Carton Quantity: 40 Units / Box&#10;Gross Weight: ~ 0.45 kg per unit box&#10;Barcode: Individually Labelled for Resale" class="w-full rounded-2xl border border-gray-200 bg-white p-4 text-xs font-mono text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 leading-relaxed"></textarea>
                <p class="mt-1 text-[11px] text-muted-ink">Displayed as bullet points inside the Master Carton Specs card.</p>
              </div>
            </div>
          </div>

          <!-- TAB 4: Availability & Warehouse Tab Panel -->
          <div *ngIf="activeTab() === 'availability'" class="space-y-6">
            <div>
              <h3 class="text-xs font-extrabold uppercase tracking-[0.14em] text-muted-ink">Distribution & Warehouse Availability</h3>
              <p class="text-xs text-muted-ink mt-0.5">Corresponds directly to the Availability tab and inventory tracking.</p>
            </div>

            <div class="grid gap-5 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Central Lagos Warehouse Status</label>
                <input type="text" [(ngModel)]="product.warehouseStatus" name="warehouseStatus" placeholder="In Stock & Ready to Ship" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 font-semibold">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Dispatch Turnaround</label>
                <input type="text" [(ngModel)]="product.dispatchTurnaround" name="dispatchTurnaround" placeholder="Dispatched within 24 Hours" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Nationwide Shipping</label>
                <input type="text" [(ngModel)]="product.nationwideShipping" name="nationwideShipping" placeholder="2 - 4 Business Days across Nigeria" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Minimum Wholesale Order</label>
                <input type="text" [(ngModel)]="product.minWholesaleOrder" name="minWholesaleOrder" placeholder="10 Units" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-xs text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 font-bold text-brand">
              </div>

              <div class="border-t border-gray-100 pt-4 sm:col-span-2 grid gap-5 sm:grid-cols-2">
                <div>
                  <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Current Inventory Stock (Units) *</label>
                  <input type="number" [(ngModel)]="product.stock" name="stock" required class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
                  <p class="mt-1 text-[10px] text-muted-ink">Tracked across warehouse balances.</p>
                </div>

                <div>
                  <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Low Stock Alert Threshold (Units)</label>
                  <input type="number" [(ngModel)]="product.lowLevel" name="lowLevel" class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
                  <p class="mt-1 text-[10px] text-muted-ink">Triggers warning in admin dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Sticky Save Bar -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-100">
        <a routerLink="/admin/inventory/products" class="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-xs font-bold text-ink hover:bg-gray-50 transition-colors shadow-sm">
          ← Cancel and Return to Products
        </a>

        <div class="flex items-center gap-3">
          <a *ngIf="!isNew()" 
             [routerLink]="['/products', product.id || product.sku]" 
             target="_blank"
             class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-ink hover:border-brand hover:text-brand transition-colors shadow-sm">
            👁️ View on Store
          </a>

          <button (click)="save()" type="button" [disabled]="isSaving()" class="rounded-full bg-brand px-8 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/20 hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center gap-2">
            <svg *ngIf="isSaving()" class="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ isSaving() ? 'Saving Changes...' : (isNew() ? 'Create Product' : 'Save Changes') }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private admin = inject(AdminService);
  private catalog = inject(CatalogService);

  readonly isNew = signal(false);
  readonly isSaving = signal(false);
  readonly saveSuccess = signal(false);
  readonly uploadingSlot = signal<number | null>(null);
  readonly uploadError = signal<string | null>(null);
  readonly activeTab = signal<'description' | 'specifications' | 'packaging' | 'availability'>('description');

  readonly tabs = [
    { id: 'description' as const, label: '1. Description & Overview' },
    { id: 'specifications' as const, label: '2. Specifications Table' },
    { id: 'packaging' as const, label: '3. Packaging & Box' },
    { id: 'availability' as const, label: '4. Availability & Warehouse' }
  ];

  categories = [
    'Cables',
    'Power Banks',
    'Earbuds',
    'Chargers',
    'Extension Sockets',
    'Motion-Activated Lights',
    'Accessories'
  ];

  customSpecs: CustomSpec[] = [];

  product: any = {
    id: '',
    name: '',
    sku: '',
    category: 'Cables',
    brand: 'Nigson',
    status: 'Active',
    price: 4500,
    retail: 4500,
    wholesale: 3600,
    distributor: 3150,
    priceSubtitle: 'Wholesale pricing available for distributors.',
    images: ['', '', '', '', ''],
    image: '',
    desc: '',
    features: 'Wholesale & retail pricing\nNationwide delivery from Lagos hub\n12-month standard warranty\nBulk discounts for distributors',
    overview: 'Engineered to meet the highest standards of durability and performance across Nigerian markets. Suitable for both wholesale commercial resale and direct consumer use.',
    highlights: 'Wholesale & retail pricing tier\nFast dispatch from central Lagos hub\n12-month standard Nigson warranty\nBulk order distributor volume discounts',
    warranty: '12 Months Standard Manufacturer Warranty',
    connectors: 'Type-C to Type-C',
    powerRating: '65W PD',
    compatibility: 'Universal iOS / Android / USB-C Standards Compliant',
    buildMaterial: 'Premium Grade Fire-Retardant Polymer & Alloy',
    certification: 'CE / RoHS / FCC Quality Verified',
    importer: 'Nigson Group Ltd, Lagos Nigeria',
    packaging: '1x Unit\n1x User Manual & Setup Guide\n1x Nigson Warranty Card',
    cartonSpecs: 'Carton Quantity: 40 Units / Box\nGross Weight: ~ 0.45 kg per unit box\nBarcode: Individually Labelled for Resale',
    stock: 150,
    lowLevel: 10,
    warehouseStatus: 'In Stock & Ready to Ship',
    dispatchTurnaround: 'Dispatched within 24 Hours',
    nationwideShipping: '2 - 4 Business Days across Nigeria',
    minWholesaleOrder: '10 Units'
  };

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const skuOrId = params.get('sku');
      if (!skuOrId || skuOrId === 'new') {
        this.isNew.set(true);
        return;
      }

      this.isNew.set(false);
      this.loadProductData(skuOrId);
    });
  }

  activeImageCount(): number {
    return (this.product.images || []).filter((img: string) => !!img && img.trim().length > 0).length;
  }

  addCustomSpec() {
    this.customSpecs.push({ key: '', value: '' });
  }

  removeCustomSpec(index: number) {
    this.customSpecs.splice(index, 1);
  }

  private loadProductData(skuOrId: string) {
    this.catalog.getProduct(skuOrId).subscribe({
      next: (full) => {
        if (!full) return;

        const sku = full.sku || extractSku(undefined, full.name);
        const resolvedCategory = full.categoryName || resolveCategoryFromSku(sku, 'Cables');
        const defaultRetail = OFFICIAL_SKU_PRICES[sku] ? OFFICIAL_SKU_PRICES[sku] / 100 : 4500;
        const retailPrice = full.retailPrice || full.retail || full.price || defaultRetail;

        // Populate images (all available from S3 and backend)
        const loadedImages: string[] = full.images?.length 
          ? [...full.images] 
          : ((full as any).imageUrl ? [this.catalog.resolveImageUrl((full as any).imageUrl)] : []);
        while (loadedImages.length < 5) loadedImages.push('');

        // Extract any custom/extra specifications not in standard fields
        const known = new Set(['warranty', 'connectors', 'power_rating', 'powerRating', 'compatibility', 'buildMaterial', 'certification', 'importer']);
        this.customSpecs = [];
        if (full.specifications) {
          for (const [k, v] of Object.entries(full.specifications)) {
            if (!known.has(k) && v != null && String(v).trim()) {
              const displayVal = Array.isArray(v) ? v.join(', ') : String(v);
              this.customSpecs.push({ key: k, value: displayVal });
            }
          }
        }

        const connRaw = full.specifications?.['connectors'];
        const connFormatted = Array.isArray(connRaw) ? connRaw.join(', ') : (connRaw || this.product.connectors);

        this.product = {
          ...this.product,
          id: full.id,
          name: full.name,
          sku: sku,
          category: resolvedCategory,
          brand: full.brand || 'Nigson',
          status: full.status || (full.stock && full.stock > 0 ? 'Active' : 'Active'),
          retail: retailPrice,
          price: retailPrice,
          wholesale: full.wholesalePrice || full.wholesale || Math.round(retailPrice * 0.8),
          distributor: full.distributorPrice || full.distributor || Math.round(retailPrice * 0.7),
          priceSubtitle: full.priceSubtitle || 'Wholesale pricing available for distributors.',
          images: loadedImages.slice(0, 5),
          image: loadedImages[0] || '',
          desc: full.description || this.product.desc,
          features: full.features ? (Array.isArray(full.features) ? full.features.join('\n') : full.features) : this.product.features,
          overview: full.overview || this.product.overview,
          highlights: full.highlights ? (Array.isArray(full.highlights) ? full.highlights.join('\n') : full.highlights) : this.product.highlights,
          warranty: full.specifications?.['warranty'] || this.product.warranty,
          connectors: connFormatted,
          powerRating: full.specifications?.['power_rating'] || full.specifications?.['powerRating'] || this.product.powerRating,
          compatibility: full.specifications?.['compatibility'] || this.product.compatibility,
          buildMaterial: full.specifications?.['buildMaterial'] || this.product.buildMaterial,
          certification: full.specifications?.['certification'] || this.product.certification,
          importer: full.specifications?.['importer'] || this.product.importer,
          packaging: full.packaging ? (Array.isArray(full.packaging) ? full.packaging.join('\n') : full.packaging) : (`1x ${full.name} unit\n1x User Manual & Setup Guide\n1x Nigson Warranty Card`),
          cartonSpecs: full.cartonSpecs ? (Array.isArray(full.cartonSpecs) ? full.cartonSpecs.join('\n') : full.cartonSpecs) : this.product.cartonSpecs,
          stock: full.stock ?? 150,
          lowLevel: full.lowLevel ?? 10,
          warehouseStatus: full.warehouseStatus || 'In Stock & Ready to Ship',
          dispatchTurnaround: full.dispatchTurnaround || 'Dispatched within 24 Hours',
          nationwideShipping: full.nationwideShipping || '2 - 4 Business Days across Nigeria',
          minWholesaleOrder: full.minWholesaleOrder || '10 Units'
        };
      },
      error: (err) => {
        console.warn('[ProductEdit] Could not load product via getProduct:', err);
      }
    });
  }

  onFileChange(event: any, index: number) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.uploadingSlot.set(index);
    this.uploadError.set(null);

    // Sanitize filename & extension
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const cleanExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext) ? ext : 'png';
    const skuCode = (this.product.sku || 'product').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const filename = `slot-${index + 1}-${Date.now()}.${cleanExt}`;
    const s3Key = `products/${skuCode}/${filename}`;
    const uploadUrl = `http://localhost:4566/nigson-product-images/${s3Key}`;

    // Upload directly to LocalStack S3 bucket via HTTP PUT
    fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/png',
        'x-amz-acl': 'public-read'
      },
      body: file
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`S3 upload returned status ${res.status}`);
        }
        this.product.images[index] = uploadUrl;
        if (index === 0) {
          this.product.image = uploadUrl;
        }
        this.uploadingSlot.set(null);
      })
      .catch(err => {
        console.error('[ProductEdit] Image upload to S3 failed:', err);
        this.uploadError.set('Upload to S3 failed. Please try again.');
        this.uploadingSlot.set(null);
      });
  }

  removeImage(index: number) {
    this.product.images[index] = '';
    if (index === 0) {
      this.product.image = this.product.images.find((img: string) => !!img) || '';
    }
  }

  save() {
    this.isSaving.set(true);
    this.uploadError.set(null);

    const cleanImages = (this.product.images || []).filter((img: string) => !!img && img.trim().length > 0);

    const specsPayload: Record<string, any> = {
      warranty: this.product.warranty,
      connectors: this.product.connectors,
      power_rating: this.product.powerRating,
      powerRating: this.product.powerRating,
      compatibility: this.product.compatibility,
      buildMaterial: this.product.buildMaterial,
      certification: this.product.certification,
      importer: this.product.importer
    };

    for (const item of this.customSpecs) {
      if (item.key && item.key.trim() && item.value && item.value.trim()) {
        specsPayload[item.key.trim()] = item.value.trim();
      }
    }

    const payload = {
      ...this.product,
      id: this.product.id || this.product.sku,
      price: this.product.retail,
      retailPrice: this.product.retail,
      wholesalePrice: this.product.wholesale,
      distributorPrice: this.product.distributor,
      description: this.product.desc,
      categoryName: this.product.category,
      images: cleanImages,
      image: cleanImages[0] || this.product.image || '',
      specifications: specsPayload
    };

    if (this.isNew()) {
      this.admin.createProduct(payload).subscribe({
        next: () => {
          this.catalog.saveProductOverride(payload.id, payload);
          if (payload.sku) this.catalog.saveProductOverride(payload.sku, payload);
          this.isSaving.set(false);
          this.saveSuccess.set(true);
          setTimeout(() => this.router.navigate(['/admin/inventory/products']), 1500);
        },
        error: () => {
          this.isSaving.set(false);
          this.router.navigate(['/admin/inventory/products']);
        }
      });
    } else {
      this.admin.updateProduct(payload.id || payload.sku, payload).subscribe({
        next: () => {
          this.catalog.saveProductOverride(payload.id, payload);
          if (payload.sku) this.catalog.saveProductOverride(payload.sku, payload);
          this.isSaving.set(false);
          this.saveSuccess.set(true);
          setTimeout(() => this.saveSuccess.set(false), 5000);
        },
        error: () => {
          this.catalog.saveProductOverride(payload.id, payload);
          if (payload.sku) this.catalog.saveProductOverride(payload.sku, payload);
          this.isSaving.set(false);
          this.saveSuccess.set(true);
        }
      });
    }
  }
}
