import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideShoppingCart, LucideStar, LucideMinus, LucidePlus } from '@lucide/angular';
import { CatalogService, Product } from 'shared-ui';
import { ShopService } from 'shared-ui';

@Component({
  selector: 'app-flash-sale',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideShoppingCart, LucideStar, LucideMinus, LucidePlus],
  template: `
    <section class="bg-ink py-14 md:py-16">
      <div class="container-page">
        <div class="reveal-on-scroll">
          <span class="inline-block border-l-2 border-brand bg-brand/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
            Ends Soon
          </span>
          <h2 class="mt-4 text-3xl md:text-[40px] font-extrabold uppercase leading-none tracking-[-0.02em] text-white">
            Flash Sale
          </h2>
          <p class="mt-2 text-sm text-white/60">Limited-time deals. Don't miss out.</p>
        </div>

        <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div
            *ngFor="let p of flashProducts(); let i = index"
            class="reveal-on-scroll flex flex-col rounded-2xl bg-white p-4 transition-transform hover:-translate-y-1"
            [style.transitionDelay]="i * 60 + 'ms'"
          >
            <a [routerLink]="['/shop/products', p.sku]" class="block">
              <div class="relative aspect-square overflow-hidden rounded-xl bg-[#f1f1f1]">
                <img
                  [src]="catalog.imageFor(p.category)"
                  [alt]="p.name"
                  loading="lazy"
                  class="absolute inset-0 h-full w-full object-cover"
                />
                <span class="absolute left-2 top-2 rounded-md bg-brand px-2 py-1 text-[11px] font-bold text-white">
                  -{{ discountFor(p.sku) }}%
                </span>
                <span *ngIf="i % 2 === 0" class="absolute bottom-2 left-2 rounded-md bg-ink px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  Best Seller
                </span>
              </div>

              <div class="mt-3 flex items-center gap-1.5 text-sm">
                <svg lucideStar class="h-4 w-4 fill-[#F5A623] text-[#F5A623]"></svg>
                <span class="font-semibold text-ink">{{ catalog.ratingFor(p.sku).average }}</span>
                <span class="text-muted-foreground">({{ catalog.ratingFor(p.sku).count }})</span>
              </div>

              <h3 class="mt-2 text-[15px] font-semibold leading-snug text-ink line-clamp-2">{{ p.name }}</h3>

              <div class="mt-3 flex items-baseline gap-2">
                <span class="text-xl font-extrabold text-brand">{{ catalog.formatPrice(p.price) }}</span>
                <span class="text-sm text-muted-foreground line-through">{{ catalog.formatPrice(originalPrice(p)) }}</span>
              </div>
            </a>

            <div class="mt-4">
              <button
                *ngIf="qtyFor(p.sku)() === 0"
                type="button"
                (click)="addToCart(p)"
                class="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand text-white px-4 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors"
              >
                <svg lucideShoppingCart class="h-4 w-4"></svg> Add to Cart
              </button>

              <div *ngIf="qtyFor(p.sku)() > 0" class="w-full inline-flex items-center justify-between rounded-xl bg-brand text-white px-2 py-1.5">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  (click)="shop.updateQty(p.sku, qtyFor(p.sku)() - 1)"
                  class="grid h-9 w-9 place-items-center rounded-lg hover:bg-brand-deep transition-colors"
                >
                  <svg lucideMinus class="h-4 w-4"></svg>
                </button>
                <span class="text-sm font-bold tabular-nums">{{ qtyFor(p.sku)() }}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  (click)="shop.updateQty(p.sku, qtyFor(p.sku)() + 1)"
                  class="grid h-9 w-9 place-items-center rounded-lg hover:bg-brand-deep transition-colors"
                >
                  <svg lucidePlus class="h-4 w-4"></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class FlashSaleComponent {
  catalog = inject(CatalogService);
  shop = inject(ShopService);

  flashProducts = computed(() => {
    return this.catalog.PRODUCTS.filter(p => this.catalog.isDeal(p)).slice(0, 4);
  });

  discountFor(sku: string): number {
    let h = 0;
    for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) % 997;
    return 20 + (h % 16);
  }

  originalPrice(p: Product): number {
    const off = this.discountFor(p.sku);
    return Math.round((p.price / (1 - off / 100)) / 100) * 100;
  }

  qtyFor(sku: string) {
    return computed(() => {
      return this.shop.cart().find(c => c.sku === sku)?.qty ?? 0;
    });
  }

  addToCart(p: Product) {
    this.shop.addToCart({
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      image: this.catalog.imageFor(p.category)
    });
  }
}
