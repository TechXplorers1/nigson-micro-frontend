import { Injectable, signal, inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export type ApiFailure = { id: number; message: string };

export function isAnonymousSessionUnauthorized(error: unknown, method: string, url: string): boolean {
  if (method !== 'GET' || url.split('?')[0] !== '/bff/session' || !(error instanceof HttpErrorResponse) || error.status !== 401) {
    return false;
  }
  return error.error !== null && typeof error.error === 'object' && error.error.code === 'AUTH_REQUIRED';
}

/** Display the backend's problem response; never turn a failed request into domain data. */
@Injectable({ providedIn: 'root' })
export class ApiErrorsService {
  readonly failures = signal<ApiFailure[]>([]);
  private sequence = 0;
  report(message: string): void {
    this.failures.update(items => items.some(x => x.message === message) ? items : [...items.slice(-4), { id: ++this.sequence, message }]);
  }
  dismiss(id: number): void { this.failures.update(items => items.filter(x => x.id !== id)); }
  describe(error: unknown, method = '', url = ''): string {
    if (!(error instanceof HttpErrorResponse)) return error instanceof Error ? error.message : 'The operation failed.';
    const path = url.split('?')[0];
    const prefix = [method, path].filter(Boolean).join(' ');
    if (error.status === 0) return `${prefix}: backend unreachable. Check the service and API proxy connection.`;
    const problem = error.error && typeof error.error === 'object' ? error.error : {};
    const code = typeof problem.code === 'string' ? problem.code : error.statusText || 'REQUEST_FAILED';
    const detail = typeof problem.detail === 'string' ? problem.detail : 'The backend rejected this request.';
    const violations = Array.isArray(problem.violations) ? problem.violations.map((v: any) => [v.field, v.message].filter(x => typeof x === 'string').join(': ')).filter(Boolean).join('; ') : '';
    const correlation = typeof problem.correlationId === 'string' ? ` Reference: ${problem.correlationId}.` : '';
    return `${prefix}: HTTP ${error.status} ${code}. ${detail}${violations ? ' ' + violations : ''}${correlation}`;
  }
  unavailable<T>(message: string) {
    this.report(message);
    return throwError(() => new Error(message));
  }
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const errors = inject(ApiErrorsService);
  return next(request).pipe(catchError(error => {
    if ((request.url.startsWith('/api/') || request.url.startsWith('/bff/')) &&
        !isAnonymousSessionUnauthorized(error, request.method, request.url)) {
      errors.report(errors.describe(error, request.method, request.url));
    }
    return throwError(() => error);
  }));
};
