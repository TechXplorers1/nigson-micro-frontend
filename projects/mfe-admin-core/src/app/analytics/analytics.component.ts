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
  `
})
export class AnalyticsComponent {
  admin = inject(AdminService);

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
