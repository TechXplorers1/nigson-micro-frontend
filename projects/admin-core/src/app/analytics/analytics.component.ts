import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, StatCardComponent } from 'shared-ui';
import { LucideTrendingUp, LucidePackage, LucideUsers, LucideShoppingCart, LucideClipboardList, LucideBuilding2, LucideBoxes, LucideMail } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule, AdminHeadingComponent, StatCardComponent,
    LucideTrendingUp, LucidePackage, LucideUsers, LucideShoppingCart,
    LucideClipboardList, LucideBuilding2, LucideBoxes, LucideMail
  ],
  template: `
    <lib-admin-heading title="Business Analytics" subtitle="Performance across catalogue, sales and lead generation"></lib-admin-heading>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total sales" [value]="sales() | currency:'NGN':'symbol-narrow':'1.0-0'" [hint]="liveOrders().length + ' paid orders'" [icon]="true">
        <svg lucideTrendingUp class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Average Order Value" [value]="aov() | currency:'NGN':'symbol-narrow':'1.0-0'" [icon]="true">
        <svg lucideShoppingCart class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Total Customers" [value]="admin.customers().length" [icon]="true">
        <svg lucideUsers class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Active Products" [value]="admin.products().length" [icon]="true">
        <svg lucidePackage class="h-5 w-5"></svg>
      </lib-stat-card>

      <lib-stat-card label="Quote Requests" [value]="admin.quotes().length" [icon]="true">
        <svg lucideClipboardList class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Distributor Apps" [value]="admin.applications().length" [icon]="true">
        <svg lucideBuilding2 class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Contact Inquiries" [value]="admin.inquiries().length" [icon]="true">
        <svg lucideMail class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Total Units in Stock" [value]="inventory()" [icon]="true">
        <svg lucideBoxes class="h-5 w-5"></svg>
      </lib-stat-card>
    </div>

    <!-- Charts Section -->
    <div class="mt-8 grid gap-6 lg:grid-cols-2">
      <!-- Sales Chart Mock -->
      <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <h3 class="mb-6 font-semibold">Sales Trend (Last 7 Days)</h3>
        <div class="flex h-48 items-end justify-between gap-2">
          <div *ngFor="let day of [40, 65, 30, 80, 50, 95, 60]" class="group relative flex w-full flex-col items-center justify-end">
            <div class="w-full rounded-t-md bg-brand transition-all hover:opacity-80" [style.height.%]="day"></div>
          </div>
        </div>
        <div class="mt-2 flex justify-between text-xs text-muted-ink">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>

      <!-- Inventory Status -->
      <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
        <h3 class="mb-6 font-semibold">Top Products by Stock</h3>
        <div class="space-y-4">
          <div *ngFor="let p of admin.products().slice(0, 5)" class="flex items-center justify-between gap-4">
            <div class="flex-1 truncate text-sm font-medium">{{ p.name }}</div>
            <div class="flex w-1/3 items-center gap-2">
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-surface-alt">
                <div class="h-full rounded-full bg-brand" [style.width.%]="Math.min((p.stock / 200) * 100, 100)"></div>
              </div>
              <span class="w-8 text-right text-xs text-muted-ink">{{ p.stock }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsComponent {
  admin = inject(AdminService);
  Math = Math;

  get liveOrders() {
    return () => this.admin.orders().filter((o) => o.status !== "Cancelled");
  }

  get sales() {
    return () => this.liveOrders().reduce((n, o) => n + o.total, 0);
  }

  get aov() {
    return () => {
      const l = this.liveOrders();
      return l.length ? Math.round(this.sales() / l.length) : 0;
    };
  }

  get inventory() {
    return () => this.admin.products().reduce((n, p) => n + p.stock, 0);
  }
}
