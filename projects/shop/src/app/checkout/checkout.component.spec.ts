import '@angular/compiler';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
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

function prefillCheckout(){
 const c=setup();c.customer.phone='';c.session={authenticated:()=>true,fullName:()=>'',email:()=>''};c.shop={user:()=>null};c.deliveryQuote=signal(null);const profile=new Subject<any>(),addresses=new Subject<any>();c.account={loadProfile:()=>profile,loadAddresses:()=>addresses};return {c,profile,addresses};
}
describe('Checkout phone prefilling',()=>{
 it('loads the saved profile phone when no address is selected',()=>{const {c,profile,addresses}=prefillCheckout();c.ngOnInit();addresses.next([]);profile.next({displayName:'Customer',email:'test@example.invalid',phone:'+2348012345678'});expect(c.customer.phone).toBe('+2348012345678');});
 it('uses the delivery address phone regardless of profile response order',()=>{
  for(const profileFirst of [true,false]){const {c,profile,addresses}=prefillCheckout();c.ngOnInit();const p={phone:'+2348012345678'};if(profileFirst)profile.next(p);addresses.next([{id:'address',isDefault:true,phone:'+2348098765432'}]);if(!profileFirst)profile.next(p);expect(c.customer.phone).toBe('+2348098765432');}
 });
 it('preserves a deliberate phone edit when asynchronous saved data arrives',()=>{const {c,profile,addresses}=prefillCheckout();c.ngOnInit();c.phoneChanged('+2348099999999');profile.next({phone:'+2348012345678'});addresses.next([{id:'address',phone:'+2348098765432'}]);expect(c.customer.phone).toBe('+2348099999999');});
 it('normalizes local and full international inputs before delivery requests',()=>{const c=setup();for(const [input,expected] of [['8012345678','+2348012345678'],['+2348012345678','+2348012345678'],['+447700900123','+447700900123']]){c.customer.phone=input;expect(c.deliveryPhone()).toBe(expected);}});
});
