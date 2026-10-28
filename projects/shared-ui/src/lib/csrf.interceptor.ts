import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from './session.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF Interceptor (TASK-03)
 *
 * Attaches the CSRF token obtained from GET /bff/session onto every
 * state-mutating request (POST, PUT, PATCH, DELETE) to the Commerce BFF.
 *
 * Excludes Keycloak identity requests.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);

  if (!MUTATION_METHODS.has(req.method)) {
    return next(req);
  }

  // Do not attach to Keycloak or non-Nigson API requests
  if (req.url.includes(':8180') || req.url.includes('/realms/') || req.url.includes('/admin/realms/')) {
    return next(req);
  }

  const token = session.csrfToken();
  if (!token) {
    return next(req);
  }

  const cloned = req.clone({
    headers: req.headers.set('X-CSRF-TOKEN', token),
  });

  return next(cloned);
};
