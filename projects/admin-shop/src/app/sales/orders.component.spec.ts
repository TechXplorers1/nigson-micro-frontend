import '@angular/compiler';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { AdminOrdersComponent } from './orders.component';
function component() {
 const c: any = Object.create(AdminOrdersComponent.prototype);
 const order = { id: 'order-1', number: 'NIG-1', cancellation: { state: 'CANCELLED', refundId: 'refund-1', refundState: 'REQUESTED' } };
 c.viewOrder = order;
 c.reviewingRefund = signal(false); c.refundError = signal(null);
 c.admin = { session: { hasRole: vi.fn(() => true) },
   getRefund: vi.fn(() => of({ id: 'refund-1', state: 'REQUESTED', amount: '25.00', currency: 'NGN', version: 0 })),
   approveCancellationRefund: vi.fn(() => of({})), loadStaffOrders: vi.fn(() => of([order])), orders: signal([order]) };
 return c;
}
describe('Cancellation refund review', () => {
 it('requires Finance and explicit confirmation of the current refund amount', () => {
  const c = component(); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
  c.reviewRefund();
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining('25.00'));
  expect(c.admin.approveCancellationRefund).toHaveBeenCalledWith(expect.objectContaining({ id: 'refund-1', version: 0 }));
  expect(c.reviewingRefund()).toBe(false); confirm.mockRestore();
 });
 it('does not approve when the reviewer declines or lacks Finance access', () => {
  const c = component(); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  c.reviewRefund(); expect(c.admin.approveCancellationRefund).not.toHaveBeenCalled();
  c.admin.session.hasRole.mockReturnValue(false); c.reviewRefund();
  expect(c.admin.getRefund).toHaveBeenCalledTimes(1); confirm.mockRestore();
 });
 it('refreshes an already approved refund without another approval command', () => {
  const c = component(); c.admin.getRefund.mockReturnValue(of({ id: 'refund-1', state: 'APPROVED' }));
  c.reviewRefund(); expect(c.admin.approveCancellationRefund).not.toHaveBeenCalled();
  expect(c.admin.loadStaffOrders).toHaveBeenCalledTimes(1);
 });
 it('keeps errors visible and releases the busy guard after denial', () => {
  const c = component(); c.admin.getRefund.mockReturnValue(throwError(() => ({ error: { code: 'ACCESS_DENIED' } })));
  c.reviewRefund(); expect(c.refundError()).toContain('recent MFA'); expect(c.reviewingRefund()).toBe(false);
 });
});

function returnComponent(state: string) {
 const c: any = Object.create(AdminOrdersComponent.prototype);
 const item = { id: 'return-1', orderId: 'order-1', productName: 'Nexa Power Bank', quantity: 2, reason: 'Synthetic damaged product return', policyRevision: 'POLICY_1', state, version: 1 };
 const view = { orderId: 'order-1', orderVersion: 2, delivered: true, lines: [], requests: [item], refundableAmount: 25, paystackRefundAvailable: true };
 c.viewOrder = { id: 'order-1' };
 c.returns = signal(view); c.returnsLoading = signal(false); c.returnAction = signal(null); c.returnBusy = signal(false); c.returnError = signal(null);
 c.admin = {
   errors: signal({}), session: { hasRole: vi.fn(() => true) },
   reviewReturn: vi.fn(() => of(view)), receiveReturn: vi.fn(() => of(view)), requestReturnRefund: vi.fn(() => of(view))
 };
 return { c, item, view };
}

describe('Return review, receipt and refund', () => {
 it('requires approval instructions and sends only an Operations decision', () => {
  const { c, item, view } = returnComponent('REQUESTED');
  c.beginReturn(item, 'APPROVE');
  c.returnReason = 'Operations reviewed the recorded returns policy';
  c.submitReturnAction();
  expect(c.returnError()).toContain('instructions');
  expect(c.admin.reviewReturn).not.toHaveBeenCalled();
  c.returnInstructions = 'Send the item through the approved support channel';
  c.submitReturnAction();
  expect(c.admin.reviewReturn).toHaveBeenCalledWith('order-1', item, true, 'Operations reviewed the recorded returns policy', 'Send the item through the approved support channel');
  expect(c.returns()).toBe(view);
  expect(c.returnAction()).toBeNull();
  expect(c.returnBusy()).toBe(false);
 });

 it('requires an external receipt reference and an explicit restock decision', () => {
  const { c, item, view } = returnComponent('APPROVED');
  c.beginReturn(item, 'RECEIVE');
  c.returnReason = 'Physical inspection completed at the returns desk';
  c.submitReturnAction();
  expect(c.returnError()).toContain('receipt reference');
  c.receiptReference = 'SYNTH_RETURN_RECEIPT_01';
  c.restock = true;
  c.submitReturnAction();
  expect(c.admin.receiveReturn).toHaveBeenCalledWith('order-1', item, 'SYNTH_RETURN_RECEIPT_01', true, 'Physical inspection completed at the returns desk');
  expect(c.returns()).toBe(view);
 });

 it('asks Finance to confirm a bounded amount before requesting the linked refund', () => {
  const { c, item, view } = returnComponent('RECEIVED');
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  c.beginReturn(item, 'REFUND');
  c.returnReason = 'Finance approved the returned-product refund';
  c.refundAmount = '10.00';
  c.submitReturnAction();
  expect(confirm).toHaveBeenCalledWith(expect.stringContaining('10.00'));
  expect(c.admin.requestReturnRefund).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  c.submitReturnAction();
  expect(c.admin.requestReturnRefund).toHaveBeenCalledWith('order-1', item, '10.00', 'Finance approved the returned-product refund');
  expect(c.returns()).toBe(view);
  confirm.mockRestore();
 });
});


describe('Operator PandaGo pickup code', () => {
 it('matches the backend code for the full order number', () => {
  const c: any = Object.create(AdminOrdersComponent.prototype);
  const number = 'NIG_0123456789ABCDEF0123456789ABCDEF';
  expect(c.pickupCode(number)).toBe('6789ABCDEF');
  expect(c.pickupCode(number.toLowerCase())).toBe('6789ABCDEF');
  expect(c.pickupCode(number)).toMatch(/^[A-Z0-9]{10}$/);
 });
 it('does not invent a pickup code for missing or malformed short order references', () => {
  const c: any = Object.create(AdminOrdersComponent.prototype);
  expect(c.pickupCode('NIG-1')).toBeNull(); expect(c.pickupCode(undefined)).toBeNull();
 });
});
