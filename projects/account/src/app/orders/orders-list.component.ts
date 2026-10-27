import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, OrderService, ShopService } from 'shared-ui';
import { 
  LucidePackage, LucideArrowRight, LucideDownload, 
  LucideRotateCcw, LucideTruck, LucideEye 
} from '@lucide/angular';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    LucidePackage, LucideArrowRight, LucideDownload, 
    LucideRotateCcw, LucideTruck, LucideEye
  ],
  template: `
    <div *ngIf="!orders().length" class="rounded-2xl border border-hairline bg-surface-alt p-12 text-center">
      <div class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white">
        <svg lucidePackage class="h-7 w-7 text-brand"></svg>
      </div>
      <h2 class="mt-5 text-2xl font-extrabold">No orders yet</h2>
      <p class="mt-2 text-sm text-muted-ink">Your placed orders will appear here.</p>
      <a routerLink="/products" class="mt-6 inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-deep">
        Shop products <svg lucideArrowRight class="h-4 w-4"></svg>
      </a>
    </div>

    <div *ngIf="orders().length" class="space-y-4">
      <div *ngFor="let o of orders()" class="rounded-2xl border border-hairline bg-white p-5">
        <div class="grid gap-4 lg:grid-cols-[1.5fr_2fr_1fr_auto] items-center">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-ink">Order</p>
            <p class="font-bold">{{ o.orderNumber }}</p>
            <p class="text-xs text-muted-ink mt-1">{{ formatDate(o.createdAt) }}</p>
          </div>
          <div class="flex items-center gap-3">
            <img *ngIf="o.items[0]?.imageUrl" [src]="o.items[0].imageUrl" alt="" class="h-14 w-14 rounded-lg object-cover border border-hairline" />
            <div>
              <p class="text-sm font-semibold line-clamp-1">
                {{ o.items[0]?.name }}
                <span *ngIf="o.items?.length > 1"> +{{ o.items?.length - 1 }} more</span>
              </p>
              <p class="text-xs text-muted-ink">Qty: {{ getTotalQty(o) }} &bull; {{ formatPrice(o.totalMinorUnits) }}</p>
            </div>
          </div>
          <div class="space-y-1.5">
            <span 
              class="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              [ngClass]="getStatusColor(o.status)"
            >
              {{ o.status }}
            </span>
            <span class="block text-[10px] font-semibold text-emerald-700">Payment: {{ o.paymentStatus ?? 'Paid' }}</span>
          </div>
          <div class="flex flex-wrap gap-2 justify-end">
            <a [routerLink]="['/account/orders', o.orderId]" class="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-2 text-xs font-semibold hover:border-brand hover:text-brand">
              <svg lucideEye class="h-3.5 w-3.5"></svg> Details
            </a>
            <button class="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-2 text-xs font-semibold hover:border-brand hover:text-brand">
              <svg lucideTruck class="h-3.5 w-3.5"></svg> Track
            </button>
            <button class="inline-flex items-center gap-1.5 rounded-full border border-hairline px-3 py-2 text-xs font-semibold hover:border-brand hover:text-brand">
              <svg lucideDownload class="h-3.5 w-3.5"></svg> Invoice
            </button>
            <button (click)="buyAgain(o)" class="inline-flex items-center gap-1.5 rounded-full bg-brand text-white px-3 py-2 text-xs font-semibold hover:bg-brand-deep">
              <svg lucideRotateCcw class="h-3.5 w-3.5"></svg> Buy Again
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OrdersListComponent implements OnInit {
  private orderSvc = inject(OrderService);
  shop = inject(ShopService);
  cart = inject(CartService);

  orders = this.orderSvc.orders;
  loading = this.orderSvc.loading;

  ngOnInit() {
    this.orderSvc.loadOrders().subscribe();
  }

  formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  }

  getTotalQty(order: any) {
    return order.items.reduce((n: number, i: any) => n + (i.quantity ?? i.qty ?? 0), 0);
  }

  formatPrice(minorUnits: number) {
    return this.orderSvc.formatPrice(minorUnits);
  }

  getStatusColor(status: string) {
    return this.orderSvc.statusColor(status);
  }

  getStatusLabel(status: string) {
    return this.orderSvc.statusLabel(status);
  }

  /** TASK-36: Buy again — adds each order item back to server cart */
  buyAgain(order: any) {
    (order.items as import('shared-ui').OrderItem[]).forEach((i) => {
      this.cart.addItem(i.skuId, i.quantity ?? 1).subscribe();
    });
  }
}
