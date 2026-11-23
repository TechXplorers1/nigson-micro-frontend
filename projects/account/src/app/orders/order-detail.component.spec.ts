import '@angular/compiler';
import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { OrderDetailComponent } from './order-detail.component';
function component(order: any) {
 const c: any = Object.create(OrderDetailComponent.prototype);
 c.order = signal(order);
 return c;
}
describe('Order cancellation presentation', () => {
 it('uses server eligibility and excludes existing cancellation requests', () => {
  expect(component({ status: 'PAID', cancellationAllowed: true }).canCancel()).toBe(true);
  expect(component({ status: 'SHIPPED', cancellationAllowed: false }).canCancel()).toBe(false);
  expect(component({ status: 'PAID' }).canCancel()).toBe(false);
  expect(component({ cancellationAllowed: true, cancellation: { state: 'REQUESTED' } }).canCancel()).toBe(false);
 });
 it('distinguishes a pending carrier outcome from confirmed cancellation', () => {
  expect(component({ cancellation: { state: 'WAITING_CARRIER' } }).cancellationMessage()).toContain('waiting for delivery');
  expect(component({ cancellation: { state: 'CANCELLED' } }).cancellationMessage()).toContain('has been cancelled');
 });
 it('shows refund review, success and attention independently', () => {
  const c = component({ cancellation: { state: 'CANCELLED', refundState: 'REQUESTED' } });
  expect(c.refundMessage()).toContain('Finance review');
  c.order.set({ cancellation: { state: 'CANCELLED', refundState: 'FAILED' } });
  expect(c.refundMessage()).toContain('needs attention');
  expect(c.cancellationMessage()).toContain('has been cancelled');
 });
});
