import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

const VERSIONED_METHODS = new Set(['PUT', 'PATCH', 'DELETE']);

/**
 * If-Match / ETag Interceptor (TASK-05)
 *
 * Many Nigson backend resources are versioned with optimistic locking.
 * The backend returns an `ETag` response header (or a `version` field in the
 * body) on GET responses. Subsequent mutations on that resource MUST include
 * the same value as the `If-Match` request header, otherwise the backend
 * returns 412 Precondition Failed (concurrent modification protection).
 *
 * Strategy:
 *  - RESPONSE side: cache `ETag` header keyed by the resource URL path.
 *  - REQUEST side:  for PUT / PATCH / DELETE, look up the cached ETag for
 *    the target URL and inject it as `If-Match`.
 *
 * Callers can override by setting `If-Match` manually before the request.
 */

/** In-memory ETag cache: URL path → ETag value */
const etagCache = new Map<string, string>();

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export const ifMatchInterceptor: HttpInterceptorFn = (req, next) => {
  // --- Request side: attach If-Match for mutations ---
  if (VERSIONED_METHODS.has(req.method) && !req.headers.has('If-Match')) {
    const cached = etagCache.get(urlPath(req.url));
    if (cached) {
      req = req.clone({ headers: req.headers.set('If-Match', cached) });
    }
  }

  return next(req).pipe(
    tap(event => {
      // --- Response side: cache ETag from GET / HEAD responses ---
      if (event instanceof HttpResponse) {
        const etag = event.headers.get('ETag');
        if (etag) {
          etagCache.set(urlPath(event.url ?? req.url), etag);
        }
        // Also handle backends that embed version in body as { version: N }
        if (event.body && typeof event.body === 'object') {
          const body = event.body as Record<string, unknown>;
          if (typeof body['version'] === 'number' || typeof body['version'] === 'string') {
            etagCache.set(urlPath(event.url ?? req.url), String(body['version']));
          }
        }
      }
    })
  );
};

/** Manually clear the ETag for a resource after a destructive operation */
export function clearEtag(url: string): void {
  etagCache.delete(urlPath(url));
}
