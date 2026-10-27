import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { 
  LucideTrash2, LucideShoppingBag, 
  LucideShieldCheck, LucideTruck, LucideArrowRight 
} from '@lucide/angular';
import { CartService, CatalogService, ShopService, QtyStepperComponent } from 'shared-ui';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, RouterLink, LucideTrash2, 
    LucideShoppingBag, LucideShieldCheck, LucideTruck, LucideArrowRight, QtyStepperComponent
  ],
  template: `
    <div class="min-h-[70vh] bg-background">
      <section class="pt-20 pb-16 md:pt-28 md:pb-24">
        <div class="mx-auto max-w-7xl px-6">
          <div class="mb-10">
            <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">Shopping</p>
            <h1 class="mt-2 text-4xl md:text-5xl font-extrabold tracking-[-0.02em]">Your Cart</h1>
          </div>

          <div *ngIf="!shop.hydrated()" class="rounded-2xl border border-hairline p-10 animate-pulse h-64 bg-surface-alt"></div>
          
          <ng-container *ngIf="shop.hydrated()">
            <div *ngIf="cart.items().length === 0" class="rounded-3xl border border-hairline bg-surface-alt p-10 md:p-16 text-center">
              <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white shadow-elegant">
                <svg lucideShoppingBag class="h-8 w-8 text-brand"></svg>
              </div>
              <h2 class="mt-6 text-2xl md:text-3xl font-extrabold">Your cart is empty</h2>
              <p class="mt-3 text-sm md:text-base text-muted-ink max-w-md mx-auto">
                Browse our premium accessories and FMCG range and add products to build your order.
              </p>
              <a
                routerLink="/products"
                class="mt-8 inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors"
              >
                Explore products <svg lucideArrowRight class="h-4 w-4"></svg>
              </a>
            </div>

            <div *ngIf="cart.items().length > 0" class="grid gap-10 lg:grid-cols-[1fr_400px]">
              <div class="space-y-4">
                <article *ngFor="let item of cart.items()" class="flex gap-4 rounded-2xl border border-hairline bg-white p-4 md:p-5">
                  <div class="h-24 w-24 md:h-28 md:w-28 shrink-0 rounded-xl overflow-hidden bg-surface-alt">
                    <img *ngIf="item.imageUrl" [src]="item.imageUrl" [alt]="item.name" class="h-full w-full object-cover" />
                    <div *ngIf="!item.imageUrl" class="h-full w-full grid place-items-center text-muted-ink">
                      <svg lucideShoppingBag class="h-8 w-8"></svg>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0 flex flex-col">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-ink">{{ item.sku }} • {{ item.categoryName }}</p>
                        <h3 class="mt-1 text-base md:text-lg font-semibold truncate">{{ item.name }}</h3>
                        <p class="mt-1 text-sm text-muted-ink">Unit price {{ catalog.formatPrice((item.unitPriceMinorUnits / 100)) }}</p>
                      </div>
                      <p class="text-lg font-bold text-[#D62828] whitespace-nowrap">
                        {{ catalog.formatPrice((item.unitPriceMinorUnits / 100) * item.quantity) }}
                      </p>
                    </div>
                    <div class="mt-auto pt-4 flex items-center justify-between">
                      <ui-qty-stepper [product]="item" [image]="item.imageUrl"></ui-qty-stepper>
                      <button
                        (click)="removeItem(item.lineId)"
                        class="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-ink hover:text-brand"
                      >
                        <svg lucideTrash2 class="h-3.5 w-3.5"></svg> Remove
                      </button>
                    </div>
                  </div>
                </article>
              </div>

              <aside class="lg:sticky lg:top-28 h-fit rounded-2xl border border-hairline bg-white p-6 md:p-7">
                <h2 class="text-lg font-bold">Order summary</h2>
                <dl class="mt-5 space-y-3 text-sm">
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-ink">Subtotal</dt>
                    <dd class="font-semibold">{{ catalog.formatPrice(subtotal()) }}</dd>
                  </div>
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-ink">Shipping</dt>
                    <dd class="font-semibold">{{ catalog.formatPrice(shipping()) }}</dd>
                  </div>
                  <div class="flex items-center justify-between">
                    <dt class="text-muted-ink">VAT (7.5%)</dt>
                    <dd class="font-semibold">{{ catalog.formatPrice(vat()) }}</dd>
                  </div>
                  
                  <div class="h-px bg-hairline my-2"></div>
                  
                  <div class="flex items-center justify-between">
                    <dt class="text-base font-bold">Total</dt>
                    <dd class="text-2xl font-extrabold text-[#D62828]">{{ catalog.formatPrice(total()) }}</dd>
                  </div>
                </dl>

                <button
                  (click)="proceedToCheckout()"
                  class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-semibold hover:bg-brand-deep transition-colors"
                >
                  Proceed to Checkout <svg lucideArrowRight class="h-4 w-4"></svg>
                </button>
                
                <div class="mt-5 grid grid-cols-2 gap-3 text-[11px] text-muted-ink">
                  <div class="flex items-center gap-1.5"><svg lucideShieldCheck class="h-3.5 w-3.5 text-emerald-600"></svg> Secure checkout</div>
                  <div class="flex items-center gap-1.5"><svg lucideTruck class="h-3.5 w-3.5 text-emerald-600"></svg> Nationwide delivery</div>
                </div>
                
                <a routerLink="/products" class="mt-5 block text-center text-xs font-semibold text-brand hover:underline">
                  Continue shopping →
                </a>
              </aside>
            </div>
          </ng-container>
        </div>
      </section>
    </div>
  `
})
export class CartComponent {
  shop = inject(ShopService);
  cart = inject(CartService);
  catalog = inject(CatalogService);
  router = inject(Router);

  /** Flat shipping fee in NGN minor units (kobo): NGN 3500 */
  SHIPPING_MINOR = 350000;

  /** Use CartService signals for real server cart data */
  subtotalMinorUnits = computed(() => this.cart.items().reduce((n, i) => n + i.unitPriceMinorUnits * i.quantity, 0));
  shippingMinorUnits = computed(() => this.cart.items().length ? this.SHIPPING_MINOR : 0);
  vatMinorUnits = computed(() => Math.round(this.subtotalMinorUnits() * 0.075));
  totalMinorUnits = computed(() => this.subtotalMinorUnits() + this.shippingMinorUnits() + this.vatMinorUnits());

  // Keep backward-compat properties for the summary template (which calls catalog.formatPrice)
  subtotal = computed(() => this.subtotalMinorUnits());
  shipping = computed(() => this.shippingMinorUnits());
  vat = computed(() => this.vatMinorUnits());
  total = computed(() => this.totalMinorUnits());

  updateQty(lineId: string, qty: number) {
    this.cart.updateQty(lineId, qty).subscribe();
  }

  removeItem(lineId: string) {
    this.cart.removeItem(lineId).subscribe();
  }

  saveForLater(lineId: string) {
    this.cart.saveForLater(lineId).subscribe();
  }

  proceedToCheckout() {
    this.router.navigate(["/checkout"]);
  }
}
