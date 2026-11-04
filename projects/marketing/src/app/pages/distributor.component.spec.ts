import '@angular/compiler';
import { Injector, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { of, Subject, finalize } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SessionService, MarketingService, CmsService, ShopService } from 'shared-ui';
import { DistributorComponent } from './distributor.component';

function setup() {
  const submitting = signal(false);
  const requests: Subject<any>[] = [];
  const submit = vi.fn(() => {
    submitting.set(true);
    const result = new Subject<any>(); requests.push(result);
    return result.pipe(finalize(() => submitting.set(false)));
  });
  const session = { authenticated: signal(true), userId: signal('party-id'), signIn: vi.fn() };
  const injector = Injector.create({ providers: [
    { provide: HttpClient, useValue: { get: () => of({ localOnly: true, phase: 3, documents: { 'party-id': { id: 'document-id', url: '/sample.pdf' } } }) } },
    { provide: SessionService, useValue: session },
    { provide: MarketingService, useValue: { submittingDistributor: submitting, submitDistributorApplication: submit } },
    { provide: CmsService, useValue: { getPageSections: () => new Map() } },
    { provide: ShopService, useValue: { user: () => null } },
    { provide: Router, useValue: {} },
    { provide: DistributorComponent, useFactory: () => new DistributorComponent() }
  ] });
  const component = injector.get(DistributorComponent);
  component.f.company = 'Demo distributor';
  const form = { invalid: false, control: { markAllAsTouched: vi.fn() } } as unknown as NgForm;
  return { component, submit, requests, form, session };
}

describe('Distributor form submission', () => {
  it('shows a useful validation error when no document is selected', () => {
    const { component, submit, form } = setup();
    component.onSubmit(form);
    expect(submit).not.toHaveBeenCalled();
    expect(component.submitError()).toContain('Select the local sample document');
  });
  it('uses the authenticated session even before the shop profile has hydrated', () => {
    const { component, submit, form, session } = setup();
    component.useSampleDocument = true;
    component.onSubmit(form);
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ documentIds: ['document-id'] }), expect.any(String));
    expect(session.signIn).not.toHaveBeenCalled();
  });
  it('blocks double submission and reuses the operation key after an uncertain result', () => {
    const { component, submit, requests, form } = setup();
    component.useSampleDocument = true;
    component.onSubmit(form); component.onSubmit(form);
    expect(submit).toHaveBeenCalledTimes(1);
    requests[0].error({ error: { code: 'PROVIDER_OUTCOME_UNKNOWN' } });
    expect(component.submitError()).toContain('Try again');
    expect(component.submitted()).toBe(false);
    component.onSubmit(form);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[1]).toEqual(submit.mock.calls[0]);
    requests[1].next({ id: 'accepted-application', state: 'SUBMITTED' });
    requests[1].complete();
    expect(component.submitted()).toBe(true);
  });
});
