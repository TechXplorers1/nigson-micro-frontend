import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap } from 'rxjs/operators';

const VERSIONED_METHODS = new Set(['PUT', 'PATCH', 'DELETE']);

/** In-memory ETag cache: URL path -> ETag value */
const etagCache = new Map<string, string>();

function urlPath(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export const ifMatchInterceptor: HttpInterceptorFn = (req, next) => {
  // Do not attach to Keycloak
  if (req.url.includes(':8180') || req.url.includes('/realms/') || req.url.includes('/admin/realms/')) {
    return next(req);
  }

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

export function clearEtag(url: string): void {
  etagCache.delete(urlPath(url));
}
