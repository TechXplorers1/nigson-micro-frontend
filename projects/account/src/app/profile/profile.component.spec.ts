import '@angular/compiler';
import { signal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { ProfileComponent } from './profile.component';

function component(create: () => any) {
  const instance: any = Object.create(ProfileComponent.prototype);
  instance.creatingReferral = signal(false);
  instance.copied = signal(false);
  instance.accountSvc = { createReferral: vi.fn(create) };
  return instance;
}

describe('Profile referral card', () => {
  it('creates the referral code and clears the pending flag', () => {
    const c = component(() => of({ code: 'ABCDEF0123456789', link: 'https://shop.example/referrals/ABCDEF0123456789', qualifiedReferralCount: 0 }));
    c.createReferral();
    expect(c.accountSvc.createReferral).toHaveBeenCalledTimes(1);
    expect(c.creatingReferral()).toBe(false);
  });

  it('does not request a second code while creation is in flight', () => {
    const pending = new Subject<any>();
    const c = component(() => pending.asObservable());
    c.createReferral();
    c.createReferral();
    expect(c.accountSvc.createReferral).toHaveBeenCalledTimes(1);
    expect(c.creatingReferral()).toBe(true);
    pending.next({ code: 'ABCDEF0123456789', link: 'x', qualifiedReferralCount: 0 });
    pending.complete();
    expect(c.creatingReferral()).toBe(false);
  });
});
