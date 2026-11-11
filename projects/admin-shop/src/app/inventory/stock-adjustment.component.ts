import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService, AdminHeadingComponent, BadgeComponent } from 'shared-ui';

@Component({
  selector: 'app-stock-adjustment',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, BadgeComponent],
  template: `
    <ng-container *ngIf="isStockIn">
      <lib-admin-heading title="Stock In / Receive Stock" subtitle="Record new stock arriving into the warehouse"></lib-admin-heading>

      <!-- Feedback alerts -->
      <div *ngIf="successMessage()" class="mb-6 rounded-[16px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
        {{ successMessage() }}
      </div>
      <div *ngIf="errorMessage()" class="mb-6 rounded-[16px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
        {{ errorMessage() }}
      </div>
      
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
        <label class="mb-4 block text-sm font-semibold">Warehouse<select [(ngModel)]="locationId" name="warehouse" class="mt-1 w-full rounded-lg border p-2"><option value="">Choose warehouse</option><option *ngFor="let location of admin.stockLocations()" [value]="location.id">{{location.name}} ({{location.code}})</option></select></label><form (ngSubmit)="saveStockIn()" class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Product *</label>
            <select [(ngModel)]="sku" name="sku" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              <option value="">Select product...</option>
              <option *ngFor="let p of admin.products()" [value]="p.sku">{{ p.name }} ({{ p.sku }}) &middot; {{ p.stock }} in stock</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Quantity received *</label>
            <input type="number" [(ngModel)]="qty" name="qty" required min="1" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Supplier</label>
            <select [(ngModel)]="supplier" name="supplier" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              <option *ngFor="let s of suppliers" [value]="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Invoice / reference number</label>
            <input type="text" [(ngModel)]="ref" name="ref" placeholder="e.g. INV-20451" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Date received</label>
            <input type="date" [(ngModel)]="date" name="date" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Notes</label>
            <input type="text" [(ngModel)]="notes" name="notes" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div class="sm:col-span-2 flex justify-end mt-2">
            
            <button type="submit" [disabled]="!sku || !qty || isSubmitting()" class="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 shadow-sm transition-colors">
              {{ isSubmitting() ? 'Receiving stock...' : 'Receive stock' }}
            </button>
          </div>
        </form>
      </div>

      <h2 class="mb-4 text-lg font-extrabold text-ink">Recent stock received</h2>
      <div class="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm text-ink">
            <thead class="border-b border-gray-100 bg-white text-[10px] font-bold uppercase tracking-widest text-muted-ink">
              <tr>
                <th class="px-6 py-5">Date</th>
                <th class="px-6 py-5">Product</th>
                <th class="px-6 py-5">Supplier</th>
                <th class="px-6 py-5">Reference</th>
                <th class="px-6 py-5 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let m of receivedLogs()" class="transition-colors hover:bg-gray-50/50">
                <td class="px-6 py-4 whitespace-nowrap text-muted-ink">{{ m.date | date:'mediumDate' }}</td>
                <td class="px-6 py-4 font-semibold">{{ m.product }}<br><span class="text-xs font-normal text-muted-ink">{{ m.sku }}</span></td>
                <td class="px-6 py-4">{{ m.supplier || '—' }}</td>
                <td class="px-6 py-4 text-muted-ink">{{ m.ref || '—' }}</td>
                <td class="px-6 py-4 text-right">
                  <lib-badge tone="success">+{{ m.qty || m.change }}</lib-badge>
                </td>
              </tr>
              <tr *ngIf="receivedLogs().length === 0">
                <td colspan="5" class="p-12 text-center text-muted-ink">No stock has been received yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>

    <ng-container *ngIf="!isStockIn">
      <lib-admin-heading title="Stock Adjustment" subtitle="Correct stock after physical counts, damages or losses"></lib-admin-heading>

      <!-- Feedback alerts -->
      <div *ngIf="successMessage()" class="mb-6 rounded-[16px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
        {{ successMessage() }}
      </div>
      <div *ngIf="errorMessage()" class="mb-6 rounded-[16px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-800">
        {{ errorMessage() }}
      </div>
      
      <div class="rounded-[20px] border border-gray-100 bg-white p-8 shadow-sm mb-8">
        <label class="mb-4 block text-sm font-semibold">Warehouse<select [(ngModel)]="locationId" name="warehouse" class="mt-1 w-full rounded-lg border p-2"><option value="">Choose warehouse</option><option *ngFor="let location of admin.stockLocations()" [value]="location.id">{{location.name}} ({{location.code}})</option></select></label><form (ngSubmit)="saveAdjustment()" class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Product *</label>
            <select [(ngModel)]="sku" (change)="onSkuSelect()" name="sku" required class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              <option value="">Select product...</option>
              <option *ngFor="let p of admin.products()" [value]="p.sku">{{ p.name }} ({{ p.sku }})</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Current stock</label>
            <input type="text" [value]="currentStock !== null ? currentStock : '—'" disabled class="w-full rounded-full border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-500 shadow-sm focus:outline-none">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Adjustment type</label>
            <select [(ngModel)]="increase" name="increase" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              <option [ngValue]="false">Decrease</option>
              <option [ngValue]="true">Increase</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Quantity *</label>
            <input type="number" [(ngModel)]="qty" name="qty" required min="1" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Reason *</label>
            <select [(ngModel)]="reason" name="reason" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
              <option *ngFor="let r of reasons" [value]="r">{{ r }}</option>
            </select>
          </div>
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Notes</label>
            <input type="text" [(ngModel)]="notes" name="notes" class="w-full rounded-full border border-gray-200 bg-white px-5 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20">
          </div>
          <div class="sm:col-span-2">
            <p *ngIf="currentStock !== null" class="mt-2 text-xs font-semibold text-muted-ink">
              New stock after adjustment: {{ getProjectedStock() }}
            </p>
            <div class="flex justify-end mt-2">
              
              <button type="submit" [disabled]="!sku || !qty || isSubmitting()" class="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50 shadow-sm transition-colors">
                {{ isSubmitting() ? 'Applying adjustment...' : 'Apply adjustment' }}
              </button>
            </div>
          </div>
        </form>
      </div>

      <h2 class="mb-4 text-lg font-extrabold text-ink">Recent adjustments</h2>
      <div class="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[720px] text-left text-sm text-ink">
            <thead class="border-b border-gray-100 bg-white text-[10px] font-bold uppercase tracking-widest text-muted-ink">
              <tr>
                <th class="px-6 py-5">Date</th>
                <th class="px-6 py-5">Product</th>
                <th class="px-6 py-5">Reason</th>
                <th class="px-6 py-5">Notes</th>
                <th class="px-6 py-5">By</th>
                <th class="px-6 py-5 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr *ngFor="let m of adjustmentLogs()" class="transition-colors hover:bg-gray-50/50">
                <td class="px-6 py-4 whitespace-nowrap text-muted-ink">{{ m.date | date:'mediumDate' }}</td>
                <td class="px-6 py-4 font-semibold">{{ m.product }}<br><span class="text-xs font-normal text-muted-ink">{{ m.sku }}</span></td>
                <td class="px-6 py-4">{{ m.reason || '—' }}</td>
                <td class="px-6 py-4 text-muted-ink">{{ m.notes || '—' }}</td>
                <td class="px-6 py-4 text-muted-ink">{{ m.by || 'Administrator' }}</td>
                <td class="px-6 py-4 text-right">
                  <lib-badge [tone]="(m.qty || m.change) >= 0 ? 'success' : 'danger'">
                    {{ (m.qty || m.change) > 0 ? '+' : '' }}{{ m.qty || m.change }}
                  </lib-badge>
                </td>
              </tr>
              <tr *ngIf="adjustmentLogs().length === 0">
                <td colspan="6" class="p-12 text-center text-muted-ink">No stock adjustments recorded yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
  `
})
export class StockAdjustmentComponent implements OnInit {
  admin = inject(AdminService);
  route = inject(ActivatedRoute);

  isStockIn = false;
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  // Form Fields
  sku = '';
  locationId = '';
  qty = 1;
  notes = '';

  // Stock In specific
  suppliers = ['Nigson HQ', 'Shenzhen Factory', 'Local Distributor', 'Other'];
  supplier = this.suppliers[0];
  ref = '';
  date = new Date().toISOString().slice(0, 10);

  // Adjustment specific
  reasons = ['Physical Count', 'Damaged Goods', 'Lost/Stolen', 'Promotional Giveaway', 'Other'];
  reason = this.reasons[0];
  increase = false;
  currentStock: number | null = null;

  constructor() {
    this.route.data.subscribe(data => {
      this.isStockIn = data['type'] === 'stock-in';
    });
  }

  ngOnInit() {
    this.admin.loadStockLocations().subscribe();
    this.admin.loadStaffProducts().subscribe();
    this.admin.loadStockMovements().subscribe();
    this.admin.loadStaffInventory().subscribe();
  }

  onSkuSelect() {
    if (!this.sku) {
      this.currentStock = null;
      return;
    }
    const p = this.admin.products().find(x => x.sku === this.sku);
    this.currentStock = p ? p.stock : null;
  }

  getProjectedStock() {
    if (this.currentStock === null) return 0;
    return Math.max(0, this.currentStock + (this.increase ? this.qty : -this.qty));
  }

  saveStockIn() {
    if (!this.sku || !this.qty) return;
    if (!this.sku || !this.qty || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const targetSku = this.sku;
    const targetQty = Number(this.qty);

    this.admin.postStockAdjustment(targetSku, targetQty, 'Stock Received', {
      locationId: this.locationId,
      supplier: this.supplier,
      ref: this.ref,
      notes: this.notes
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Successfully received ${targetQty} units for ${targetSku}.`);
        this.sku = '';
        this.qty = 1;
        this.ref = '';
        this.notes = '';
        setTimeout(() => this.successMessage.set(''), 4500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.detail || 'Failed to record stock in.');
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  saveAdjustment() {
    if (!this.sku || !this.qty || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const targetSku = this.sku;
    const finalChange = this.increase ? Number(this.qty) : -Number(this.qty);

    this.admin.postStockAdjustment(targetSku, finalChange, this.reason, {
      locationId: this.locationId,
      notes: this.notes
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(`Successfully adjusted stock by ${finalChange > 0 ? '+' : ''}${finalChange} units.`);
        this.sku = '';
        this.qty = 1;
        this.notes = '';
        this.currentStock = null;
        setTimeout(() => this.successMessage.set(''), 4500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.detail || 'Failed to apply stock adjustment.');
        setTimeout(() => this.errorMessage.set(''), 5000);
      }
    });
  }

  receivedLogs() {
    // Basic filter for received stock
    return this.admin.stockLog().filter(l => l.reason === 'Stock Received' || l.change > 0 && l.reason !== 'Physical Count');
    return this.admin.stockLog().filter(l => l.reason === 'Stock Received' || (l.change > 0 && l.reason !== 'Physical Count'));
  }

  adjustmentLogs() {
    // Basic filter for adjustments
    return this.admin.stockLog().filter(l => l.reason !== 'Stock Received');
  }
}

