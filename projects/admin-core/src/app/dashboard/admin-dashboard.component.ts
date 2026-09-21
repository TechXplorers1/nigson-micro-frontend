import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent, StatCardComponent } from 'shared-ui';
import { LucidePackage, LucideUsers, LucideShoppingCart, LucideTrendingUp, LucideBoxes, LucideBuilding2, LucideClipboardList, LucideMail } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, AdminHeadingComponent, StatCardComponent,
    LucidePackage, LucideUsers, LucideShoppingCart, LucideBoxes
  ],
  template: `
    <lib-admin-heading title="Dashboard" subtitle="Overview of the Nigson Products business"></lib-admin-heading>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
      <lib-stat-card label="Total Products" [value]="admin.products().length" [icon]="true">
        <svg lucidePackage class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Total Customers" [value]="admin.customers().length" [icon]="true">
        <svg lucideUsers class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Total Orders" [value]="admin.orders().length" [icon]="true">
        <svg lucideShoppingCart class="h-5 w-5"></svg>
      </lib-stat-card>
      <lib-stat-card label="Total Inventory" [value]="inventory()" [icon]="true">
        <svg lucideBoxes class="h-5 w-5"></svg>
      </lib-stat-card>
    </div>

    <!-- Additional sections like Recent Activity could go here -->
    <div class="grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-hairline bg-white p-5">
        <h3 class="mb-4 text-sm font-bold tracking-widest uppercase text-muted-ink">Recent Activity</h3>
        <div class="space-y-4">
          <div *ngFor="let a of admin.activity().slice(0, 5)" class="flex gap-3">
            <div class="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand"></div>
            <div>
              <p class="text-sm text-ink">{{ a.text }}</p>
              <p class="text-xs text-muted-ink">{{ a.date | date:'short' }}</p>
            </div>
          </div>
          <p *ngIf="admin.activity().length === 0" class="text-sm text-muted-ink">No recent activity.</p>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent {
  admin = inject(AdminService);

  get inventory() {
    return () => this.admin.products().reduce((n, p) => n + p.stock, 0);
  }
}
