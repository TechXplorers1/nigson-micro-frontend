import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { SessionService } from './session.service';

/**
 * AuthGuard (TASK-14)
 *
 * Protects routes that require an authenticated BFF session.
 * If the user is not authenticated, navigates to the /auth/login route
 * with the return destination preserved in query params.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const check = () => {
    if (session.authenticated()) {
      return true;
    }
    return router.parseUrl('/auth/login?redirect=' + encodeURIComponent(state.url));
  };

  return session.sessionLoaded() ? check() : session.loadSession().pipe(map(() => check()));
};

/**
 * AdminGuard — requires ADMIN role in addition to authentication.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const check = () => {
    if (session.authenticated() && session.isAdmin()) {
      return true;
    }
    if (!session.authenticated()) {
      return router.parseUrl('/auth/login?redirect=' + encodeURIComponent(state.url));
    }
    // Authenticated but not admin — redirect to home
    return router.parseUrl('/');
  };

  return session.sessionLoaded() ? check() : session.loadSession().pipe(map(() => check()));
};

/**
 * StaffGuard — requires any staff role (ADMIN, SALES, OPERATIONS, etc.)
 */
export const staffGuard: CanActivateFn = (route, state) => {
  const session = inject(SessionService);
  const router = inject(Router);

  const check = () => {
    if (session.authenticated() && session.isStaff()) {
      return true;
    }
    if (!session.authenticated()) {
      return router.parseUrl('/auth/login?redirect=' + encodeURIComponent(state.url));
    }
    return router.parseUrl('/');
  };

  return session.sessionLoaded() ? check() : session.loadSession().pipe(map(() => check()));
};
