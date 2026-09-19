import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { 
  LucideCheckCircle2, LucidePackage, LucideArrowRight, LucideMail 
} from '@lucide/angular';
import { CatalogService, ShopService, Order } from 'shared-ui';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [
    CommonModule, RouterLink, 
    LucideCheckCircle2, LucidePackage, LucideArrowRight, LucideMail
  ],
  template: `
    <div class="min-h-[70vh] bg-background">
      <section class="pt-20 pb-24 md:pt-32">
        <div class="mx-auto max-w-3xl px-6 text-center">
          <div class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 animate-scale-in">
            <svg lucideCheckCircle2 class="h-10 w-10"></svg>
          </div>
          <p class="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">Order confirmed</p>
          <h1 class="mt-2 text-4xl md:text-5xl font-extrabold tracking-[-0.02em]">Thank you for your order</h1>
          <p class="mt-4 text-muted-ink max-w-xl mx-auto">
            Your payment was successful and your order is being prepared. A confirmation email is on its way.
          </p>

          <div *ngIf="order()" class="mt-10 rounded-2xl border border-hairline bg-white p-6 md:p-8 text-left shadow-sm">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p class="text-[10px] uppercase tracking-widest text-muted-ink">Order number</p>
                <p class="font-bold">{{ order()!.number }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-widest text-muted-ink">Payment status</p>
                <p class="font-bold text-emerald-600">Paid • {{ order()!.paymentMethod }}</p>
              </div>
              <div>
                <p class="text-[10px] uppercase tracking-widest text-muted-ink">Total</p>
                <p class="font-bold text-[#D62828]">{{ catalog.formatPrice(order()!.total) }}</p>
              </div>
            </div>

            <ul class="mt-6 space-y-3">
              <li *ngFor="let i of order()!.items" class="flex items-center gap-3 text-sm">
                <div class="h-12 w-12 rounded-lg overflow-hidden bg-surface-alt shrink-0">
                  <img *ngIf="i.image" [src]="i.image" alt="" class="h-full w-full object-cover" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="truncate font-semibold">{{ i.name }}</p>
                  <p class="text-xs text-muted-ink">Qty {{ i.qty }}</p>
                </div>
                <p class="font-semibold">{{ catalog.formatPrice(i.price * i.qty) }}</p>
              </li>
            </ul>

            <div class="mt-6 rounded-xl bg-surface-alt p-5 flex items-start gap-3">
              <svg lucidePackage class="h-5 w-5 text-brand shrink-0 mt-0.5"></svg>
              <div class="text-sm">
                <p class="font-semibold">Estimated delivery: {{ order()!.estimatedDelivery }}</p>
                <p class="text-muted-ink mt-1">Shipping to {{ order()!.address.street }}, {{ order()!.address.city }}, {{ order()!.address.state }}.</p>
              </div>
            </div>
          </div>

          <div class="mt-8 flex flex-wrap justify-center gap-3">
            <a routerLink="/products" class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep">
              Continue shopping <svg lucideArrowRight class="h-4 w-4"></svg>
            </a>
            
            <a *ngIf="order()" [routerLink]="['/account/orders', order()!.id]" class="inline-flex items-center gap-2 rounded-full border border-ink text-ink px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-white">
              View Order
            </a>
            <a *ngIf="!order()" routerLink="/account/orders" class="inline-flex items-center gap-2 rounded-full border border-ink text-ink px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-white">
              View my orders
            </a>
          </div>

          <p class="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-ink">
            <svg lucideMail class="h-3.5 w-3.5"></svg> Confirmation sent to {{ order()?.customer?.email }}
          </p>
        </div>
      </section>
    </div>
  `
})
export class OrderSuccessComponent {
  shop = inject(ShopService);
  catalog = inject(CatalogService);
  route = inject(ActivatedRoute);

  orderId = toSignal(this.route.queryParams.pipe(map(params => params['id'])), { initialValue: '' });

  order = computed(() => {
    const id = this.orderId();
    const orders = this.shop.orders();
    return orders.find((o: Order) => o.id === id) ?? orders[0];
  });
}
