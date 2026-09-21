import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminHeadingComponent } from 'shared-ui';

@Component({
  selector: 'app-stock-movements',
  standalone: true,
  imports: [CommonModule, AdminHeadingComponent],
  template: `
    <lib-admin-heading title="Stock Movements" subtitle="A comprehensive log of all inventory changes"></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Product</th>
              <th class="px-6 py-4">Change</th>
              <th class="px-6 py-4">Reason</th>
              <th class="px-6 py-4">Operator</th>
              <th class="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let l of admin.stockLog()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4 font-semibold">{{ l.product }}<br><span class="text-xs font-normal text-muted-ink">{{ l.sku }}</span></td>
              <td class="px-6 py-4 font-bold" [ngClass]="l.change > 0 ? 'text-emerald-600' : 'text-rose-600'">{{ l.change > 0 ? '+' : '' }}{{ l.change }}</td>
              <td class="px-6 py-4 text-muted-ink">{{ l.reason }}</td>
              <td class="px-6 py-4">{{ l.by }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ l.date | date:'medium' }}</td>
            </tr>
            <tr *ngIf="admin.stockLog().length === 0">
              <td colspan="5" class="p-8 text-center text-muted-ink">No stock movements recorded.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class StockMovementsComponent {
  admin = inject(AdminService);
}
