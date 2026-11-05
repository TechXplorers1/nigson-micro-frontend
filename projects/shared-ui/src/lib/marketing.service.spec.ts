import '@angular/compiler';
import { Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { MarketingService, BackendDistributorApplication } from './marketing.service';
import { SessionService } from './session.service';

function setup() {
  const response = new Subject<BackendDistributorApplication>();
  const http = { post: vi.fn(() => response.asObservable()) };
  const injector = Injector.create({ providers: [
    { provide: HttpClient, useValue: http },
    { provide: SessionService, useValue: {} },
    { provide: MarketingService, useFactory: () => new MarketingService() }
  ] });
  return { service: injector.get(MarketingService), http, response };
}
const payload = { organizationName: 'Local test company', countryCode: 'NG', documentIds: ['document-id'] };

describe('Distributor submission outcomes', () => {
  it('keeps the request key for safe replay and completes only with the server response', () => {
    const { service, http, response } = setup();
    const next = vi.fn();
    service.submitDistributorApplication(payload, 'stable-key').subscribe(next);
    expect(service.submittingDistributor()).toBe(true);
    expect(next).not.toHaveBeenCalled();
    expect(http.post).toHaveBeenCalledWith('/api/v1/distributor-applications', expect.objectContaining(payload), { headers: { 'Idempotency-Key': 'stable-key' } });
    const accepted: BackendDistributorApplication = { id: 'application-id', state: 'SUBMITTED', submittedAt: '2026-11-03T00:00:00Z', version: 0 };
    response.next(accepted); response.complete();
    expect(next).toHaveBeenCalledWith(accepted);
    expect(service.submittingDistributor()).toBe(false);
  });
  it('surfaces the backend failure instead of silently converting it to null', () => {
    const { service, response } = setup();
    const failure = { status: 422, error: { code: 'BUSINESS_RULE_VIOLATION' } };
    const next = vi.fn(), error = vi.fn();
    service.submitDistributorApplication(payload, 'stable-key').subscribe({ next, error });
    response.error(failure);
    expect(next).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(failure);
    expect(service.submittingDistributor()).toBe(false);
  });
  it('unlocks the form after a cancelled request', () => {
    const { service } = setup();
    const request = service.submitDistributorApplication(payload, 'stable-key').subscribe();
    request.unsubscribe();
    expect(service.submittingDistributor()).toBe(false);
  });
});
