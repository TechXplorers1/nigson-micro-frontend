import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from './session.service';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF Interceptor (TASK-03)
 *
 * Attaches the CSRF token obtained from GET /bff/session onto every
 * state-mutating request (POST, PUT, PATCH, DELETE).
 *
 * The backend Commerce BFF uses Spring Security's server-side session
 * protection. The token is returned in the /bff/session response body
 * as `csrfToken` and must be sent back as the `X-CSRF-TOKEN` header.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);

  if (!MUTATION_METHODS.has(req.method)) {
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
