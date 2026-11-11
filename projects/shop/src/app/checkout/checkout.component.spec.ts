import '@angular/compiler';
import { of } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { CheckoutComponent } from './checkout.component';

function setup() {
  const component: any = Object.create(CheckoutComponent.prototype);
  Object.assign(component, {
    step: () => 1, address: { street: '12 Test street', city: 'Lagos', state: 'Lagos', postal: '' },
    selectedAddressId: '', savedAddresses: [],
    customer: { fullName: 'Test Customer', phone: '+2348000000001' },
    session: { fullName: () => '' }, http: { post: vi.fn(), patch: vi.fn() }
  });
  return component;
}

describe('Checkout automatic delivery location', () => {
  it('accepts a complete postal address without asking for coordinates', () => {
    const c = setup();
    expect(c.validate()).toBeNull();
    c.address.street = '';
    expect(c.validate()).toContain('Street address');
  });
  it('saves the postal address without client-supplied coordinates', async () => {
    const c = setup(); c.http.post.mockReturnValue(of({ id: 'saved-address' }));
    expect(await c.ensureAddressId()).toBe('saved-address');
    const body = c.http.post.mock.calls[0][1];
    expect(body).toMatchObject({ line1: '12 Test street', city: 'Lagos' });
    expect(body).not.toHaveProperty('latitude');
    expect(body).not.toHaveProperty('longitude');
  });
  it('uses saved addresses without requiring or patching coordinates', async () => {
    const c = setup(); c.selectedAddressId = 'saved-address';
    c.savedAddresses = [{ id: 'saved-address', phone: c.customer.phone, version: 2 }];
    expect(await c.ensureAddressId()).toBe('saved-address');
    expect(c.http.patch).not.toHaveBeenCalled();
  });
  it('persists a corrected phone on a saved address before quoting', async () => {
    const c = setup(); c.selectedAddressId = 'saved-address';
    c.savedAddresses = [{ id: 'saved-address', phone: 'invalid', version: 2 }];
    c.customer.phone = '08012345678';
    c.http.patch.mockReturnValue(of({ id: 'saved-address', phone: '+2348012345678', version: 3 }));
    expect(await c.ensureAddressId()).toBe('saved-address');
    expect(c.http.patch.mock.calls[0][1]).toEqual({ phone: '+2348012345678' });
    expect(c.http.patch.mock.calls[0][2].headers.get('If-Match')).toBe('"2"');
    expect(c.savedAddresses[0].version).toBe(3);
  });
  it('rejects an invalid delivery phone before any address or quote call', async () => {
    const c = setup(); c.customer.phone = '12345678901';
    await expect(c.ensureAddressId()).rejects.toThrow('country code');
    expect(c.http.post).not.toHaveBeenCalled();
    expect(c.http.patch).not.toHaveBeenCalled();
  });
  it('shows the exact backend address lookup failure', () => {
    const c = setup();
    expect(c.errorMessage({ status: 422, error: { code: 'ADDRESS_NOT_LOCATED', detail: 'Enter a complete street address.' } })).toBe('Enter a complete street address.');
  });
  it('identifies disabled delivery instead of advising an ineffective retry', () => {
    expect(setup().errorMessage({ url: '/api/v1/carts/id/delivery-quotes', status: 422, error: { code: 'FEATURE_DISABLED' } })).toContain('disabled on the server');
  });
});
