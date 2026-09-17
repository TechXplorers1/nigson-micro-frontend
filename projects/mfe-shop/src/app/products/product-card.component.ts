import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideShoppingCart, LucideStar } from '@lucide/angular';
import { CatalogService, Product, ShopService } from 'shared-ui';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideShoppingCart, LucideStar],
  template: `
    <div class="group flex flex-col text-left rounded-2xl border border-border bg-background overflow-hidden hover:shadow-elegant hover:-translate-y-1 transition-all h-full">
      <a [routerLink]="['/shop/products', p.sku]" class="text-left flex-1">
        <div class="aspect-[4/3] bg-surface-alt relative overflow-hidden">
          <img
            [src]="catalog.imageFor(p.category)"
            [alt]="p.name"
            loading="lazy"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
          />
          <span class="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand">
            {{ p.category }}
          </span>
        </div>
        <div class="px-5 pt-5">
          <p class="text-[11px] uppercase tracking-widest text-muted-foreground">{{ p.sku }}</p>
          <h3 class="mt-1 text-lg font-semibold group-hover:text-brand transition-colors">{{ p.name }}</h3>
          <p class="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground">Starting from</p>
          <p class="mt-1 text-[22px] font-bold text-[#D62828] leading-tight">{{ catalog.formatPrice(p.price) }}</p>
          <p *ngIf="!compact" class="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">{{ p.desc }}</p>
        </div>
      </a>

      <div class="px-5 pt-3">
        <a
          [routerLink]="['/shop/products', p.sku]"
          fragment="reviews"
          class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-brand transition-colors"
        >
          <svg lucideStar class="h-4 w-4 fill-brand text-brand"></svg>
          <span class="text-brand">{{ catalog.ratingFor(p.sku).average }}</span>
          <span class="text-muted-foreground font-medium">({{ catalog.ratingFor(p.sku).count }})</span>
        </a>
      </div>

      <div class="mt-auto px-5 pb-5 pt-4 flex gap-2">
        <a
          [routerLink]="['/shop/products', p.sku]"
          class="flex-1 rounded-full border border-hairline px-4 py-2.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand transition-colors text-center"
        >
          View Details
        </a>
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
export class ProductCardComponent {
  @Input({ required: true }) p!: Product;
  @Input() compact = false;

  catalog = inject(CatalogService);
  shop = inject(ShopService);

  addToCart() {
    this.shop.addToCart({
      sku: this.p.sku,
      name: this.p.name,
      category: this.p.category,
      price: this.p.price,
      image: this.catalog.imageFor(this.p.category)
    });
  }
}
