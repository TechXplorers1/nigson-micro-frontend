import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideShoppingCart, LucideStar, LucideLoader2 } from '@lucide/angular';
import { CatalogService, Product, ShopService } from 'shared-ui';

/**
 * ProductCardComponent (TASK-19, TASK-20, TASK-21)
 *
 * - Route now uses product UUID (/products/:id) not SKU
 * - Price loaded from GET /api/v1/catalogue/skus/{id}/price (kobo -> Naira)
 * - imageFor uses backend images[] or fallback category image
 * - Removed fake ratingFor() hash — real reviews wired in TASK-52
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideShoppingCart, LucideStar, LucideLoader2],
  template: `
    <div class="group flex flex-col text-left rounded-2xl border border-border bg-background overflow-hidden hover:shadow-elegant hover:-translate-y-1 transition-all h-full">
      <!-- TASK-21: Route uses product UUID (id), not SKU -->
      <a [routerLink]="['/products', p.id]" class="text-left flex-1">
        <div class="aspect-[4/3] bg-surface-alt relative overflow-hidden">
          <img
            [src]="primaryImage()"
            [alt]="p.name"
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
          />
          <span class="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand">
            {{ p.categoryName ?? 'Product' }}
          </span>
        </div>
        <div class="px-5 pt-5">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground">{{ p.sku }}</p>
          <h3 class="mt-1 text-lg font-semibold group-hover:text-brand transition-colors">{{ p.name }}</h3>
          <p class="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Starting from</p>
          <!-- TASK-19/20: Price from backend (kobo) — formatPrice divides by 100 -->
          <ng-container *ngIf="!priceLoading()">
            <p class="mt-1 text-[22px] font-bold text-[#D62828] leading-tight">
              {{ displayPrice() }}
            </p>
          </ng-container>
          <p *ngIf="priceLoading()" class="mt-1 h-7 w-28 animate-pulse rounded-lg bg-surface-alt"></p>
          <p *ngIf="!compact" class="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{{ p.description }}</p>
        </div>
      </a>

      <div class="mt-auto px-5 pb-5 pt-4 flex gap-2">
        <a
          [routerLink]="['/products', p.id]"
          class="flex-1 rounded-full border border-hairline px-4 py-2.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand transition-colors text-center"
        >View Details</a>
        <button
          type="button"
          (click)="addToCart()"
          class="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand text-white px-4 py-2.5 text-xs font-semibold hover:bg-brand-deep transition-colors"
        >
          <svg lucideShoppingCart class="h-3.5 w-3.5"></svg> Add to Cart
        </button>
      </div>
    </div>
  `
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) p!: Product;
  @Input() compact = false;

  catalog = inject(CatalogService);
  shop = inject(ShopService);

  readonly priceLoading = signal(true);
  readonly displayPrice = signal('—');

  ngOnInit() {
    // Use priceMinorUnits if already embedded in product response
    if (this.p.priceMinorUnits != null) {
      this.displayPrice.set(this.catalog.formatPrice(this.p.priceMinorUnits));
      this.priceLoading.set(false);
    } else {
      // Fetch price separately from /api/v1/catalogue/skus/{id}/price
      this.catalog.getPrice(this.p.id).subscribe({
        next: pr => {
          this.displayPrice.set(this.catalog.formatPrice(pr.priceMinorUnits));
          this.priceLoading.set(false);
        },
        error: () => {
          this.displayPrice.set('Contact for price');
          this.priceLoading.set(false);
        }
      });
    }
  }

  primaryImage(): string {
    return this.catalog.primaryImage(this.p);
  }

  addToCart() {
    // TASK-28: will be updated to use server cart in Phase 3
    this.shop.addToCart({
      sku: this.p.sku,
      skuId: this.p.id,
      name: this.p.name,
      category: this.p.categoryName ?? '',
      price: (this.p.priceMinorUnits ?? 0) / 100, // store in Naira for now
      image: this.primaryImage()
    } as any);
  }
}
