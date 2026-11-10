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
    expect(await c.ensureAddressId()).toBe('saved-address');
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
