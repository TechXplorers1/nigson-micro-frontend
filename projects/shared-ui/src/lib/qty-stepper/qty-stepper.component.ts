import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopService } from '../shop.service';
import { LucideMinus, LucidePlus, LucideShoppingCart } from '@lucide/angular';

/**
 * QtyStepperComponent (TASK-13 fix)
 *
 * stockFor() removed from CatalogService — real stock comes from inventory API.
 * Stock check now uses product.stock if provided by backend; otherwise
 * defaults to a generous limit (99) so the UI stays functional until
 * real inventory is wired (TASK-39).
 */
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
        class="inline-flex w-full shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-brand text-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-brand-deep transition-colors"
      >
        <svg lucideShoppingCart class="h-4 w-4"></svg> Add to Cart
      </button>

      <div *ngIf="qty() > 0" class="flex w-full items-center justify-between gap-1 rounded-full bg-brand text-white px-2 py-1.5">
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

  @Input({ required: true }) product!: any;
  @Input() image?: string;

  /**
   * Available stock — uses backend-provided stock field when present,
   * otherwise uses a safe default of 99 until real inventory API is wired (TASK-39).
   */
  get stock(): number {
    return this.product?.stock ?? 99;
  }

  qty(): number {
    const item = this.shop.cart().find(
      (c: any) => c.sku === this.product?.sku || c.skuId === this.product?.id
    );
    return item ? item.qty : 0;
  }

  atMax(): boolean {
    return this.qty() >= this.stock;
  }

  add() {
    this.shop.addToCart({
      sku: this.product.sku,
      skuId: this.product.id,
      name: this.product.name,
      category: this.product.categoryName ?? this.product.category ?? '',
      price: this.product.price ?? (this.product.priceMinorUnits ?? 0) / 100,
      image: this.image,
    } as any);
  }

  update(newQty: number) {
    this.shop.updateQty(this.product.sku, newQty);
  }
}
