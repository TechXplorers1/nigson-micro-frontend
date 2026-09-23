import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopService } from '../shop.service';
import { CatalogService, Product } from '../catalog.service';
import { LucideMinus, LucidePlus, LucideShoppingCart } from '@lucide/angular';

@Component({
  selector: 'ui-qty-stepper',
  standalone: true,
  imports: [CommonModule, LucideMinus, LucidePlus, LucideShoppingCart],
  template: `
    <ng-container *ngIf="stock <= 0; else inStock">
      <span class="inline-flex items-center gap-2 rounded-full bg-surface-alt text-muted-ink px-6 py-3 text-sm font-semibold border border-hairline cursor-not-allowed">
        Out of Stock
      </span>
    </ng-container>

    <ng-template #inStock>
      <button
        *ngIf="qty() <= 0"
        type="button"
        (click)="add()"
        class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors"
      >
        <svg lucideShoppingCart class="h-4 w-4"></svg> Add to Cart
      </button>

      <div *ngIf="qty() > 0" class="inline-flex items-center gap-1 rounded-full bg-brand text-white px-2 py-1.5">
        <button
          type="button"
          aria-label="Decrease quantity"
          (click)="update(qty() - 1)"
          class="grid h-8 w-8 place-items-center rounded-full hover:bg-brand-deep transition-colors"
        >
          <svg lucideMinus class="h-4 w-4"></svg>
        </button>
        
        <span class="min-w-[2.5rem] text-center text-sm font-bold tabular-nums">{{ qty() }}</span>
        
        <button
          type="button"
          aria-label="Increase quantity"
          [disabled]="atMax()"
          (click)="update(qty() + 1)"
          class="grid h-8 w-8 place-items-center rounded-full hover:bg-brand-deep transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <svg lucidePlus class="h-4 w-4"></svg>
        </button>
      </div>
    </ng-template>
  `
})
export class QtyStepperComponent {
  shop = inject(ShopService);
  catalog = inject(CatalogService);

  @Input({ required: true }) product!: any;
  @Input() image?: string;

  get stock() {
    const available = this.product.stock != null
      ? this.product.stock
      : this.catalog.stockFor(this.product.sku);
    return available - this.qty();
  }

  qty() {
    const item = this.shop.cart().find((c: any) => c.sku === this.product.sku);
    return item ? item.qty : 0;
  }

  atMax() {
    return this.qty() >= this.stock;
  }

  add() {
    this.shop.addToCart({
      sku: this.product.sku,
      name: this.product.name,
      category: this.product.category,
      price: this.product.price,
      image: this.image
    });
  }

  update(newQty: number) {
    this.shop.updateQty(this.product.sku, newQty);
  }
}
