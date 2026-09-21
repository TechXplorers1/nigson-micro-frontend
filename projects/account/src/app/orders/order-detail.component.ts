import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ShopService } from 'shared-ui';
import { 
  LucideArrowLeft, LucideXCircle
} from '@lucide/angular';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    LucideArrowLeft, LucideXCircle
  ],
  template: `
    <div class="space-y-6">
      <a routerLink="/account/orders" class="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
        <svg lucideArrowLeft class="h-4 w-4"></svg> Back to orders
      </a>

      <div *ngIf="!order()" class="rounded-2xl border border-hairline p-10 text-center">
        <p class="text-muted-ink">Order not found.</p>
      </div>

      <ng-container *ngIf="order()">
        <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Order</p>
              <h2 class="text-2xl font-extrabold">{{ order()?.number }}</h2>
              <p class="text-xs text-muted-ink mt-1">Placed {{ formatDate(order()?.date ?? '') }}</p>
            </div>
            <div class="text-right">
              <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Status</p>
              <p class="font-bold">{{ order()?.status }}</p>
              <button
                *ngIf="canCancel()"
                (click)="confirmCancel()"
                class="mt-3 inline-flex items-center gap-1.5 rounded-full border border-hairline px-4 py-2 text-xs font-semibold text-brand hover:border-brand transition-colors"
              >
                <svg lucideXCircle class="h-4 w-4"></svg> Cancel Order
              </button>
            </div>
          </div>

          <!-- Tracking timeline -->
          <div class="mt-8" *ngIf="order()?.status !== 'Cancelled'">
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Tracking</p>
            <ol class="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
              <li *ngFor="let s of timeline; let i = index" class="relative">
                <div [ngClass]="['h-1.5 w-full rounded-full transition-colors', isDone(i) ? 'bg-brand' : 'bg-surface-alt']"></div>
                <div class="mt-3 flex items-start gap-2">
                  <div [ngClass]="['grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px]', isDone(i) ? 'bg-brand text-white' : 'bg-surface-alt text-muted-ink']">
                    {{ i + 1 }}
                  </div>
                  <p [ngClass]="['text-xs font-semibold', isDone(i) ? 'text-ink' : 'text-muted-ink']">{{ s }}</p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div class="grid gap-6 md:grid-cols-3">
          <!-- Order Summary -->
          <div class="md:col-span-2 space-y-6">
            <div class="rounded-2xl border border-hairline bg-white p-6">
              <h3 class="text-sm font-extrabold uppercase tracking-widest border-b border-hairline pb-4 mb-4">Items</h3>
              <ul class="space-y-4">
                <li *ngFor="let item of order()?.items" class="flex gap-4">
                  <img *ngIf="item.image" [src]="item.image" alt="" class="h-20 w-20 rounded-xl object-cover border border-hairline" />
                  <div class="flex-1">
                    <p class="font-semibold text-sm">{{ item.name }}</p>
                    <p class="text-xs text-muted-ink">SKU: {{ item.sku }}</p>
                    <div class="mt-2 flex items-center justify-between text-sm">
                      <span class="font-medium">{{ formatNaira(item.price) }} &times; {{ item.qty }}</span>
                      <span class="font-bold">{{ formatNaira(item.price * item.qty) }}</span>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Totals -->
          <div class="space-y-6">
            <div class="rounded-2xl border border-hairline bg-white p-6">
              <h3 class="text-sm font-extrabold uppercase tracking-widest border-b border-hairline pb-4 mb-4">Summary</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between text-muted-ink"><dt>Subtotal</dt><dd>{{ formatNaira(order()?.subtotal ?? 0) }}</dd></div>
                <div class="flex justify-between text-muted-ink"><dt>Shipping</dt><dd>{{ formatNaira(order()?.shipping ?? 0) }}</dd></div>
                <div class="flex justify-between text-muted-ink"><dt>VAT (7.5%)</dt><dd>{{ formatNaira(order()?.tax ?? 0) }}</dd></div>
                <div class="mt-4 border-t border-hairline pt-4 flex justify-between text-base font-extrabold">
                  <dt>Total</dt><dd>{{ formatNaira(order()?.total ?? 0) }}</dd>
                </div>
              </dl>
            </div>
            <div class="rounded-2xl border border-hairline bg-white p-6">
              <h3 class="text-sm font-extrabold uppercase tracking-widest border-b border-hairline pb-4 mb-4">Delivery</h3>
              <p class="text-sm font-bold">{{ order()?.customer?.fullName }}</p>
              <p class="mt-1 text-xs text-muted-ink leading-relaxed">
                {{ order()?.address?.street }}<br/>
                {{ order()?.address?.city }}, {{ order()?.address?.state }} {{ order()?.address?.postal }}<br/>
                {{ order()?.address?.country }}
              </p>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class OrderDetailComponent {
  shop = inject(ShopService);
  route = inject(ActivatedRoute);

  timeline = ["Processing", "Shipped", "Delivered"];

  orderId = computed(() => this.route.snapshot.paramMap.get('id') || '');

  order = computed(() => {
    return this.shop.orders().find(o => o.id === this.orderId());
  });

  canCancel() {
    return this.order()?.status === "Processing" || this.order()?.status === "Confirmed" as any;
  }

  isDone(index: number) {
    const o = this.order();
    if (!o) return false;
    let normalizedStatus = o.status as string;
    if (normalizedStatus === 'Confirmed') normalizedStatus = 'Processing';
    const currentIdx = this.timeline.indexOf(normalizedStatus);
    return index <= currentIdx;
  }

  confirmCancel() {
    if (confirm("Are you sure you want to cancel this order?")) {
      // In a real app we'd dispatch an update
      alert("Order cancelled");
    }
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  formatNaira(amount: number) {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  }
}
