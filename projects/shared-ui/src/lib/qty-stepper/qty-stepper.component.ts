import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopService } from '../shop.service';
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
        class="inline-flex w-full shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-full bg-brand text-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
      >
        <svg lucideShoppingCart class="h-4 w-4"></svg> Add to Cart
      </button>

      <div *ngIf="qty() > 0" class="flex w-full items-center justify-between gap-1 rounded-full bg-brand text-white px-2 py-1.5 shadow-sm">
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

  get stock(): number {
    return this.product?.stock ?? 99;
  }

  qty(): number {
    const p = this.product;
    if (!p) return 0;
    const item = this.shop.cart().find(
      (c: any) =>
        c.sku === p.sku ||
        (p.id && (c.skuId === p.id || c.sku === p.id)) ||
        (p.skuId && (c.skuId === p.skuId || c.sku === p.skuId)) ||
        (p.lineId && (c.lineId === p.lineId || c.skuId === p.lineId || c.sku === p.lineId))
    );
    return item ? item.qty : 0;
  }

  atMax(): boolean {
    return this.qty() >= this.stock;
  }

  add() {
    const p = this.product;
    if (!p) return;
    const priceMinor = p.priceMinorUnits ?? (p.price != null ? Math.round(p.price * 100) : 0);
    this.shop.addToCart({
      sku: p.sku || p.id,
      skuId: p.skuId || p.id,
      name: p.name || 'Product',
      category: p.categoryName ?? p.category ?? 'General',
      price: p.price ?? (priceMinor / 100),
      priceMinorUnits: priceMinor,
      image: this.image || p.imageUrl || (p.images ? p.images[0] : undefined),
    } as any);
  }

  update(newQty: number) {
    const p = this.product;
    if (!p) return;
    const skuKey = p.sku || p.skuId || p.id || p.lineId;
    this.shop.updateQty(skuKey, newQty);
  }
}
