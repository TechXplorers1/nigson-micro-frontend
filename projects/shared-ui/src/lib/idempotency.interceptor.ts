import { HttpInterceptorFn } from '@angular/common/http';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Idempotency-Key Interceptor (TASK-04)
 *
 * Generates a unique UUID and attaches it as the `Idempotency-Key` header
 * on every state-mutating request (POST, PUT, PATCH, DELETE).
 *
 * The backend requires this header on all mutation endpoints
 * (`requiredIdempotency: true` in the API catalog). It guarantees that
 * duplicate network retries do not create duplicate server-side effects
 * (double orders, double payments, double stock adjustments, etc.).
 *
 * Each request in a given user action gets its own UUID — do NOT reuse
 * the same key across different logical operations.
 */
export const idempotencyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!MUTATION_METHODS.has(req.method)) {
    return next(req);
  }

  // Only add if not already present (allows callers to override when replaying)
  if (req.headers.has('Idempotency-Key')) {
    return next(req);
  }

  const key = crypto.randomUUID();
  const cloned = req.clone({
    headers: req.headers.set('Idempotency-Key', key),
  });

  return next(cloned);
};
