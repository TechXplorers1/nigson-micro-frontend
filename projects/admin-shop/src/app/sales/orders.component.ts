import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { EMPTY, switchMap, finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, StatCardComponent, BadgeComponent, statusTone, AdminOrder, AdminOrderStatus, OrderReturn, OrderReturns } from 'shared-ui';
import { LucideEye } from '@lucide/angular';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, StatCardComponent, BadgeComponent, LucideEye],
  template: `
    <lib-admin-heading title="Orders" subtitle="Every customer order, payment and delivery state"></lib-admin-heading>

    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total orders" [value]="admin.orders().length"></lib-stat-card>
      <lib-stat-card label="Pending" [value]="pendingCount()"></lib-stat-card>
      <lib-stat-card label="Delivered" [value]="deliveredCount()"></lib-stat-card>
      <lib-stat-card label="Revenue" [value]="revenue() | currency:'NGN':'symbol-narrow':'1.0-0'"></lib-stat-card>
    </div>

    <p *ngIf="admin.errors()['Orders']" role="alert" class="mb-3 text-sm text-rose-700">{{ admin.errors()['Orders'] }}</p>
    <div class="mb-5 flex flex-wrap gap-3">
      <button (click)="refreshOrders()" [disabled]="reviewingRefund()" class="rounded-xl border border-hairline bg-white px-4 py-2 text-sm">Refresh orders</button>
      <input type="text" [(ngModel)]="searchQuery" placeholder="Search order or customer..." class="w-64 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
      <select [(ngModel)]="statusFilter" class="rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
        <option value="All statuses">All statuses</option>
        <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
      </select>
    </div>

    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-x-auto">
      <table class="w-full min-w-[720px] text-left text-sm text-ink">
        <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
          <tr>
            <th class="px-6 py-4">Order ID</th>
            <th class="px-6 py-4">Customer</th>
            <th class="px-6 py-4">Products</th>
            <th class="px-6 py-4">Amount</th>
            <th class="px-6 py-4">Payment</th>
            <th class="px-6 py-4">Status</th>
            <th class="px-6 py-4">Delivery</th>
            <th class="px-6 py-4">Date</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-hairline">
          <tr *ngFor="let o of filteredOrders()" class="transition-colors hover:bg-surface-alt/30">
            <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ o.number }}</td>
            <td class="px-6 py-4">
              {{ o.customer.name }}<br>
              <span class="text-xs text-muted-ink">{{ o.customer.email }}</span>
            </td>
            <td class="px-6 py-4 text-muted-ink">{{ o.items.length }} items</td>
            <td class="px-6 py-4 font-semibold">{{ o.total | currency:'NGN':'symbol-narrow':'1.0-0' }}</td>
            <td class="px-6 py-4"><lib-badge [tone]="getTone(o.paymentStatus)">{{ o.paymentStatus }}</lib-badge></td>
            <td class="px-6 py-4"><lib-badge [tone]="getTone(o.status)">{{ o.status }}</lib-badge></td>
            <td class="px-6 py-4 text-muted-ink">{{ o.delivery }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-muted-ink">{{ o.date | date:'shortDate' }}</td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end">
                <button (click)="openOrder(o)" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="View order">
                  <svg lucideEye class="h-4 w-4"></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr *ngIf="filteredOrders().length === 0">
            <td colspan="9" class="p-8 text-center text-muted-ink">No orders match your filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal view (Simplified) -->
    <div *ngIf="viewOrder" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-bold">Order {{ viewOrder.number }}</h2>
          <button (click)="closeOrder()" [disabled]="reviewingRefund()" class="text-muted-ink hover:text-ink">✕</button>
        </div>
        
        <div class="mb-4 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-muted-ink uppercase font-bold">Customer</p>
            <p>{{ viewOrder.customer.name }}</p>
            <p class="text-sm text-muted-ink">{{ viewOrder.customer.email }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-ink uppercase font-bold">Total</p>
            <p class="font-bold text-brand">{{ viewOrder.total | currency:'NGN':'symbol-narrow':'1.0-0' }}</p>
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="mb-2 font-bold">Items</h3>
          <ul class="divide-y divide-hairline rounded-lg border border-hairline">
            <li *ngFor="let it of viewOrder.items" class="flex justify-between p-3 text-sm">
              <span>{{ it.qty }}x {{ it.name }}</span>
              <span class="font-medium">{{ (it.price * it.qty) | currency:'NGN':'symbol-narrow':'1.0-0' }}</span>
            </li>
          </ul>
        </div>

        <div *ngIf="viewOrder.cancellation" class="mb-4 rounded-xl border border-hairline bg-surface-alt p-4 text-sm">
          <p>Cancellation: {{ viewOrder.cancellation.state }}</p>
          <p *ngIf="viewOrder.cancellation.refundState">Refund: {{ viewOrder.cancellation.refundState }}</p>
          <button *ngIf="viewOrder.cancellation.state === 'CANCELLED' && viewOrder.cancellation.refundId && viewOrder.cancellation.refundState === 'REQUESTED' && admin.session.hasRole('FINANCE')"
            (click)="reviewRefund()" [disabled]="reviewingRefund()" class="mt-3 rounded-xl bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50">
            {{ reviewingRefund() ? 'Checking refund...' : 'Review and approve refund' }}
          </button>
          <p *ngIf="refundError()" role="alert" class="mt-2 text-rose-700">{{ refundError() }}</p>
        </div>

        <div class="mb-4 rounded-xl border border-hairline bg-surface-alt/40 p-4 text-sm">
          <div class="mb-2 flex items-center justify-between">
            <h3 class="font-bold">Returns</h3>
            <span *ngIf="returnsLoading()" class="text-xs text-muted-ink">Loading...</span>
          </div>
          <p *ngIf="!returns() && !returnsLoading()" class="text-xs text-muted-ink">No return records were loaded.</p>
          <p *ngIf="returns() && !returns()!.delivered" class="text-xs text-muted-ink">This order has not been delivered, so returns are not requestable.</p>
          <p *ngIf="returns() && returns()!.delivered && !returns()!.requests.length" class="text-xs text-muted-ink">No return requests have been recorded.</p>
          <div *ngIf="returns()?.requests?.length" class="space-y-3">
            <div *ngFor="let item of returns()!.requests" class="rounded-lg border border-hairline bg-white p-3">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="font-semibold">{{ item.productName }} &times; {{ item.quantity }}</p>
                  <p class="text-xs text-muted-ink">Policy {{ item.policyRevision }} &bull; {{ item.createdAt | date:'medium' }}</p>
                </div>
                <lib-badge tone="neutral">{{ item.state }}</lib-badge>
              </div>
              <p class="mt-2 text-xs text-muted-ink">Customer reason: {{ item.reason }}</p>
              <p *ngIf="item.decisionReason" class="mt-1 text-xs text-muted-ink">Decision: {{ item.decisionReason }}</p>
              <p *ngIf="item.instructions" class="mt-1 text-xs text-muted-ink">Instructions: {{ item.instructions }}</p>
              <p *ngIf="item.receiptReference" class="mt-1 text-xs text-muted-ink">Receipt: <span class="font-mono">{{ item.receiptReference }}</span> &bull; {{ item.restock ? 'Restocked' : 'Not restocked' }}</p>
              <p *ngIf="item.refundId" class="mt-1 text-xs text-muted-ink">Refund: {{ item.refundState }} ({{ item.refundId }})</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <ng-container *ngIf="item.state === 'REQUESTED' && admin.session.hasRole('OPERATIONS')">
                  <button (click)="beginReturn(item, 'APPROVE')" [disabled]="returnBusy()" class="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Approve</button>
                  <button (click)="beginReturn(item, 'REJECT')" [disabled]="returnBusy()" class="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50">Reject</button>
                </ng-container>
                <button *ngIf="item.state === 'APPROVED' && admin.session.hasRole('OPERATIONS')" (click)="beginReturn(item, 'RECEIVE')" [disabled]="returnBusy()" class="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Record receipt</button>
                <button *ngIf="item.state === 'RECEIVED' && !item.refundId && admin.session.hasRole('FINANCE')" (click)="beginReturn(item, 'REFUND')" [disabled]="returnBusy()" class="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Request refund</button>
              </div>
              <p *ngIf="item.state === 'RECEIVED' && !item.refundId && !returns()!.paystackRefundAvailable" class="mt-2 text-xs text-amber-700">
                No verified Paystack settlement is available. Resolve payment and refund outside this automated flow.
              </p>
            </div>
          </div>

          <div *ngIf="returnAction()" class="mt-3 rounded-lg border border-hairline bg-white p-3">
            <p class="mb-2 text-xs font-bold uppercase tracking-widest text-muted-ink">{{ returnActionLabel() }}</p>
            <label class="mb-2 block text-xs font-semibold">Reason
              <textarea rows="2" maxlength="500" [(ngModel)]="returnReason" class="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm font-normal"></textarea>
            </label>
            <label *ngIf="returnAction() === 'APPROVE'" class="mb-2 block text-xs font-semibold">Customer instructions
              <textarea rows="2" maxlength="1000" [(ngModel)]="returnInstructions" class="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm font-normal"></textarea>
            </label>
            <ng-container *ngIf="returnAction() === 'RECEIVE'">
              <label class="mb-2 block text-xs font-semibold">External receipt reference
                <input type="text" maxlength="120" [(ngModel)]="receiptReference" class="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm font-normal">
              </label>
              <label class="mb-2 flex items-center gap-2 text-xs font-semibold">
                <input type="checkbox" [(ngModel)]="restock"> Restock this quantity into saleable stock
              </label>
            </ng-container>
            <label *ngIf="returnAction() === 'REFUND'" class="mb-2 block text-xs font-semibold">Refund amount (NGN)
              <input type="number" min="0.01" step="0.01" [(ngModel)]="refundAmount" class="mt-1 w-full rounded-lg border border-hairline px-3 py-2 text-sm font-normal">
            </label>
            <p *ngIf="returnError()" role="alert" class="mb-2 text-xs text-rose-700">{{ returnError() }}</p>
            <div class="flex gap-2">
              <button (click)="submitReturnAction()" [disabled]="returnBusy()" class="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{{ returnBusy() ? 'Saving...' : 'Confirm' }}</button>
              <button (click)="cancelReturnAction()" [disabled]="returnBusy()" class="rounded-lg border border-hairline px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Cancel</button>
            </div>
          </div>
          <p *ngIf="admin.errors()['Returns']" role="alert" class="mt-2 text-xs text-rose-700">{{ admin.errors()['Returns'] }}</p>
        </div>

        <div class="flex items-center gap-2">
          <p class="text-sm">Shipping and delivery update from recorded fulfillment operations.</p>
          <button *ngIf="viewOrder.rawState === 'PAID' && (!viewOrder.cancellation || viewOrder.cancellation.state === 'REJECTED') && admin.session.hasRole('OPERATIONS')" (click)="admin.setOrderStatus(viewOrder.id, 'Processing')" class="rounded-xl bg-brand px-4 py-2 font-bold text-white">Release for processing</button>
        </div>
      </div>
    </div>
  `
})
export class AdminOrdersComponent implements OnInit {
  ngOnInit() {
    this.admin.loadStaffOrders().subscribe();
  }
  admin = inject(AdminService);
  refreshOrders() { this.admin.loadStaffOrders().subscribe({ error: () => {} }); }
  
  searchQuery = signal('');
  statusFilter = signal('All statuses');
  statuses: string[] = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];
  
  viewOrder: AdminOrder | null = null;
  readonly reviewingRefund = signal(false);
  readonly refundError = signal<string | null>(null);
  readonly returns = signal<OrderReturns | null>(null);
  readonly returnsLoading = signal(false);
  readonly returnAction = signal<'APPROVE' | 'REJECT' | 'RECEIVE' | 'REFUND' | null>(null);
  readonly returnBusy = signal(false);
  readonly returnError = signal<string | null>(null);
  selectedReturnId = '';
  returnReason = '';
  returnInstructions = '';
  receiptReference = '';
  restock = false;
  refundAmount = '';

  openOrder(order: AdminOrder) {
    if (this.reviewingRefund()) return;
    this.refundError.set(null);
    this.viewOrder = order;
    this.loadReturns(order.id);
  }

  closeOrder() {
    if (this.reviewingRefund() || this.returnBusy()) return;
    this.viewOrder = null;
    this.resetReturnAction();
    this.returns.set(null);
  }

  private loadReturns(orderId: string) {
    this.returnsLoading.set(true);
    this.returns.set(null);
    this.resetReturnAction();
    this.admin.getOrderReturns(orderId).subscribe({
      next: view => { this.returns.set(view); this.returnsLoading.set(false); },
      error: () => this.returnsLoading.set(false)
    });
  }

  selectedReturn(): OrderReturn | null {
    return this.returns()?.requests.find(item => item.id === this.selectedReturnId) ?? null;
  }

  beginReturn(item: OrderReturn, action: 'APPROVE' | 'REJECT' | 'RECEIVE' | 'REFUND') {
    this.selectedReturnId = item.id;
    this.returnAction.set(action);
    this.returnError.set(null);
    this.returnReason = '';
    this.returnInstructions = '';
    this.receiptReference = '';
    this.restock = false;
    this.refundAmount = action === 'REFUND' ? (this.returns()?.refundableAmount ?? 0).toFixed(2) : '';
  }

  cancelReturnAction() {
    if (!this.returnBusy()) this.resetReturnAction();
  }

  private resetReturnAction() {
    this.returnAction.set(null);
    this.selectedReturnId = '';
    this.returnError.set(null);
    this.returnReason = '';
    this.returnInstructions = '';
    this.receiptReference = '';
    this.restock = false;
    this.refundAmount = '';
  }

  returnActionLabel(): string {
    return ({ APPROVE: 'Approve return', REJECT: 'Reject return', RECEIVE: 'Record physical receipt', REFUND: 'Request Finance refund' } as Record<string, string>)[this.returnAction() ?? ''] ?? '';
  }

  submitReturnAction() {
    const order = this.viewOrder;
    const item = this.selectedReturn();
    const action = this.returnAction();
    if (!order || !item || !action || this.returnBusy()) return;
    const reason = this.returnReason.trim();
    if (reason.length < 10) { this.returnError.set('Enter a reason of at least 10 characters.'); return; }
    if (action === 'APPROVE' && this.returnInstructions.trim().length < 10) {
      this.returnError.set('Approval requires customer return instructions of at least 10 characters.');
      return;
    }
    if (action === 'RECEIVE' && !/^[A-Za-z0-9][A-Za-z0-9:_-]{0,119}$/.test(this.receiptReference.trim())) {
      this.returnError.set('Enter a valid external receipt reference (letters, digits, colon, underscore or hyphen).');
      return;
    }
    const amount = Number(this.refundAmount);
    if (action === 'REFUND' && (!Number.isFinite(amount) || amount <= 0 || amount > (this.returns()?.refundableAmount ?? 0))) {
      this.returnError.set('Enter a refund amount within the remaining refundable amount.');
      return;
    }
    if (action === 'REFUND') {
      const formatted = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
      if (!confirm(`Request a ${formatted} refund on the original Paystack payment? Finance approval and payment processing remain separate.`)) return;
    }
    this.returnError.set(null);
    this.returnBusy.set(true);
    const request = action === 'APPROVE' || action === 'REJECT'
      ? this.admin.reviewReturn(order.id, item, action === 'APPROVE', reason, this.returnInstructions.trim())
      : action === 'RECEIVE'
        ? this.admin.receiveReturn(order.id, item, this.receiptReference.trim(), this.restock, reason)
        : this.admin.requestReturnRefund(order.id, item, amount.toFixed(2), reason);
    request.subscribe({
      next: view => { this.returns.set(view); this.returnBusy.set(false); this.resetReturnAction(); },
      error: () => this.returnBusy.set(false)
    });
  }
  reviewRefund() {
    const order = this.viewOrder;
    const id = order?.cancellation?.refundId;
    if (!order || !id || this.reviewingRefund() || !this.admin.session.hasRole('FINANCE')) return;
    this.reviewingRefund.set(true);
    this.refundError.set(null);
    this.admin.getRefund(id).pipe(
      switchMap(refund => {
        if (refund.state !== 'REQUESTED') return this.admin.loadStaffOrders();
        const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: refund.currency }).format(Number(refund.amount));
        if (!confirm(`Approve a refund of ${amount} to the original payment for cancelled order ${order.number}? This will submit the approved refund for processing.`)) return EMPTY;
        return this.admin.approveCancellationRefund(refund).pipe(switchMap(() => this.admin.loadStaffOrders()));
      }),
      finalize(() => this.reviewingRefund.set(false))
    ).subscribe({
      next: () => { this.viewOrder = this.admin.orders().find(o => o.id === order.id) ?? order; },
      error: (error: any) => { this.refundError.set(error?.error?.code === 'ACCESS_DENIED'
        ? 'Finance approval requires current permissions, recent MFA and a separate approver when configured.'
        : 'We could not confirm refund approval. Refresh the order or retry to check the same request.'); }
    });
  }

  pendingCount = computed(() => this.admin.orders().filter(o => o.status === 'Pending').length);
  deliveredCount = computed(() => this.admin.orders().filter(o => o.status === 'Delivered').length);
  revenue = computed(() => this.admin.orders().filter(o => o.status !== 'Cancelled').reduce((n, o) => n + o.total, 0));

  filteredOrders = computed(() => {
    let list = this.admin.orders();
    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(o => (o.number + o.customer.name + o.customer.email).toLowerCase().includes(q));
    }
    const s = this.statusFilter();
    if (s !== 'All statuses') {
      list = list.filter(o => o.status === s);
    }
    return list;
  });

  getTone(status: string) {
    return statusTone(status);
  }
}

