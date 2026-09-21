import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService, AdminHeadingComponent } from 'shared-ui';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent],
  template: `
    <lib-admin-heading [title]="isStockIn ? 'Stock In / Receive' : 'Stock Adjustment'" [subtitle]="isStockIn ? 'Add newly received inventory.' : 'Correct inventory discrepancies.'"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden p-6 max-w-xl">
      <form (ngSubmit)="save()" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">Product</label>
          <select [(ngModel)]="sku" name="sku" required class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
            <option value="">Select a product...</option>
            <option *ngFor="let p of admin.products()" [value]="p.sku">{{ p.name }} ({{ p.sku }}) - Current: {{ p.stock }}</option>
          </select>
        </div>
        
        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">Quantity Change</label>
          <input type="number" [(ngModel)]="change" name="change" required [min]="isStockIn ? 1 : -9999" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
          <p class="mt-1 text-xs text-muted-ink" *ngIf="isStockIn">Must be a positive number.</p>
        </div>

        <div>
          <label class="mb-1 block text-xs font-bold uppercase tracking-widest text-muted-ink">Reason / Note</label>
          <input type="text" [(ngModel)]="reason" name="reason" required class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        </div>
        
        <div class="flex gap-4 pt-4 border-t border-hairline">
          <button type="submit" [disabled]="!sku || !change" class="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50">Confirm Adjustment</button>
        </div>
      </form>
    </div>
  `
})
export class StockAdjustmentComponent {
  admin = inject(AdminService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  isStockIn = false;
  sku = '';
  change: number | null = null;
  reason = '';

  constructor() {
    this.route.data.subscribe(data => {
      this.isStockIn = data['type'] === 'stock-in';
      if (this.isStockIn) {
        this.reason = 'Container intake';
      }
    });
  }

  save() {
    if (!this.sku || !this.change) return;
    this.admin.adjustStock(this.sku, this.change, this.reason);
    this.router.navigate(['/admin/inventory/movements']);
  }
}
