import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CatalogService, PageHeaderComponent, Product, QuoteService, ShopService } from 'shared-ui';
import { LucideCheckCircle2 } from '@lucide/angular';

interface QuoteSkuOption {
  id: string;
  code: string;
  variantName?: string;
}

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LucideCheckCircle2],
  template: `
    <div class="bg-surface min-h-screen">
      <lib-page-header
        eyebrow="Get pricing"
        title="Request a quote."
        subtitle="Choose a catalogue product and quantity. Our team will follow up with wholesale pricing."
      ></lib-page-header>

      <section class="container-page py-16 max-w-3xl">
        <form (submit)="onSubmit($event)" class="rounded-2xl border border-border bg-background p-8 shadow-elegant space-y-5">
          <ng-container *ngIf="submitted(); else formFields">
            <div class="text-center py-10">
              <svg lucideCheckCircle2 class="mx-auto h-14 w-14 text-brand"></svg>
              <h3 class="mt-4 text-2xl font-semibold">Quote request sent</h3>
              <p class="mt-2 text-muted-foreground">Redirecting you to your quote requests...</p>
            </div>
          </ng-container>

          <ng-template #formFields>
            <div *ngIf="error()" class="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
              {{ error() }}
            </div>

            <p *ngIf="loadingOptions()" class="text-sm text-muted-foreground">Loading available products...</p>

            <div>
              <label class="block text-sm font-medium mb-1.5">Product <span class="text-brand">*</span></label>
              <select required [(ngModel)]="f.productId" (ngModelChange)="onProductChanged($event)" name="productId" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm">
                <option value="" disabled>Select a catalogue product</option>
                <option *ngFor="let product of products()" [value]="product.id">{{ product.name }}</option>
              </select>
            </div>

            <div *ngIf="skuOptions().length > 1">
              <label class="block text-sm font-medium mb-1.5">Variant <span class="text-brand">*</span></label>
              <select required [(ngModel)]="f.skuId" name="skuId" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm">
                <option *ngFor="let sku of skuOptions()" [value]="sku.id">{{ sku.variantName || sku.code }}</option>
              </select>
            </div>
            <p *ngIf="selectedProduct() && skuOptions().length === 0" class="text-sm text-amber-700">
              This product has no currently available quoteable variants. Select another product.
            </p>

            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium mb-1.5">Name <span class="text-brand">*</span></label>
                <input type="text" required maxlength="160" [(ngModel)]="f.name" name="name" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Phone</label>
                <input type="tel" maxlength="32" [(ngModel)]="f.phone" name="phone" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1.5">Email <span class="text-brand">*</span></label>
                <input type="email" required maxlength="254" [(ngModel)]="f.email" name="email" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Quantity <span class="text-brand">*</span></label>
              <input type="number" min="0.001" step="0.001" required [(ngModel)]="f.quantity" name="quantity" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Specifications or message <span class="text-brand">*</span></label>
              <textarea rows="5" required maxlength="10000" [(ngModel)]="f.message" name="message" placeholder="Share specifications, delivery location, or timeline..." class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand"></textarea>
            </div>

            <button
              type="submit"
              [disabled]="quoteSvc.submitting() || loadingOptions() || !marketId() || products().length === 0"
              class="w-full rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold hover:bg-brand-deep transition-colors disabled:opacity-50"
            >
              {{ quoteSvc.submitting() ? 'Submitting request...' : 'Send quote request' }}
            </button>
          </ng-template>
        </form>
      </section>
    </div>
  `
})
export class QuoteComponent implements OnInit {
  private http = inject(HttpClient);
  private catalog = inject(CatalogService);
  shop = inject(ShopService);
  quoteSvc = inject(QuoteService);
  router = inject(Router);

  products = signal<Product[]>([]);
  skuOptions = signal<QuoteSkuOption[]>([]);
  selectedProduct = signal<Product | null>(null);
  marketId = signal<string | null>(null);
  loadingOptions = signal(true);
  submitted = signal(false);
  error = signal<string | null>(null);

  f = {
    productId: '',
    skuId: '',
    name: '',
    phone: '',
    email: '',
    quantity: '1',
    message: ''
  };

  ngOnInit(): void {
    forkJoin({
      markets: this.http.get<Array<{ id: string; code: string }>>('/api/v1/markets'),
      products: this.catalog.loadProducts({ page: 0, size: 100 })
    }).subscribe({
      next: ({ markets, products }) => {
        this.marketId.set(markets.find(market => market.code === 'NG')?.id ?? null);
        this.products.set(products.content.filter(product => product.publicationStatus === 'PUBLISHED'));
        if (!this.marketId()) this.error.set('No active NG market is available for quote requests.');
        else if (this.products().length === 0) this.error.set('No catalogue products are currently available for quotes.');
        this.loadingOptions.set(false);
      },
      error: () => {
        this.error.set('Unable to load quote products. Please refresh and try again.');
        this.loadingOptions.set(false);
      }
    });
  }

  onProductChanged(productId: string): void {
    this.error.set(null);
    this.selectedProduct.set(null);
    this.skuOptions.set([]);
    this.f.skuId = '';
    if (!productId) return;

    this.catalog.getProduct(productId).subscribe({
      next: product => {
        const options = product.quoteSkus ?? [];
        this.selectedProduct.set(product);
        this.skuOptions.set(options);
        if (options.length === 1) this.f.skuId = options[0].id;
      },
      error: () => this.error.set('Unable to load variants for this product. Please choose another product.')
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.error.set(null);

    if (!this.shop.user()) {
      this.shop.openLoginRequired('Sign in to submit a quote and track its status.');
      return;
    }

    const product = this.selectedProduct();
    if (!this.marketId() || !product || !this.f.skuId || !this.f.quantity || Number(this.f.quantity) <= 0) {
      this.error.set('Select an available product variant and enter a valid quantity.');
      return;
    }

    this.quoteSvc.submitQuote({
      marketId: this.marketId()!,
      products: [{ skuId: this.f.skuId, quantity: String(this.f.quantity) }],
      subject: `Quote request - ${product.name}`,
      message: this.f.message,
      contact: {
        name: this.f.name,
        email: this.f.email,
        phone: this.f.phone || undefined
      }
    }).subscribe({
      next: () => {
        this.submitted.set(true);
        setTimeout(() => this.router.navigate(['/account/quotes']), 1200);
      },
      error: () => this.error.set('Failed to submit quote request. Please check your details and try again.')
    });
  }
}
