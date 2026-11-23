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
