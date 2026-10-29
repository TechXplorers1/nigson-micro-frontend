import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { BFF_BASE } from './api.service';

/**
 * Shape of the GET /bff/session response from the Commerce BFF.
 * The backend returns this when the user has an active Keycloak session.
 */
export interface BffSession {
  authenticated: boolean;
  /** Keycloak subject UUID */
  userId?: string;
  /** Display name from Keycloak profile */
  fullName?: string;
  /** Email from Keycloak profile */
  email?: string;
  /** Backend roles assigned via Keycloak realm roles */
  roles?: string[];
  /** CSRF token for mutation requests */
  csrfToken?: string;
}

/**
 * SessionService (TASK-07)
 *
 * Loads the current BFF session from GET /bff/session on app startup.
 * The CSRF interceptor reads `csrfToken` from this service.
 * The AuthGuard (TASK-14) checks `authenticated` from this service.
 *
 * In local/dev environments where the backend runs in foundation profile
 * (NIGSON_SECURITY_ENABLED=false), this service supports dev sessions via
 * sessionStorage, enabling full MFE testing without crashing.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);

  /** CSRF token from /bff/session response */
  readonly csrfToken = signal<string | null>(null);

  /** Whether the current user has an active BFF session */
  readonly authenticated = signal<boolean>(false);

  /** Keycloak subject UUID */
  readonly userId = signal<string | null>(null);

  /** Full name from Keycloak profile */
  readonly fullName = signal<string | null>(null);

  /** Email from Keycloak profile */
  readonly email = signal<string | null>(null);

  /**
   * Backend roles e.g. ['CUSTOMER'] or ['ADMIN', 'SALES'].
   * Possible values: CUSTOMER, ADMIN, SALES, OPERATIONS, FINANCE,
   * CONTENT_EDITOR, CONTENT_PUBLISHER, ANALYST
   */
  readonly roles = signal<string[]>([]);

  /** True once loadSession() has completed (success or failure) */
  readonly sessionLoaded = signal<boolean>(false);

  constructor() {
    this.restoreLocalSession();
  }

  private restoreLocalSession(): boolean {
    try {
      const raw = localStorage.getItem('nigson_dev_session') || sessionStorage.getItem('nigson_dev_session');
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.authenticated) {
          this.applySession(s);
          return true;
        }
      }
    } catch {}
    return false;
  }

  /**
   * Calls GET /bff/session and populates all signals.
   * Returns an Observable that resolves to the session state.
   */
  loadSession(): Observable<BffSession> {
    return this.http
      .get<BffSession>(`${BFF_BASE}/bff/session`, { withCredentials: true })
      .pipe(
        tap(session => {
          if (session && session.authenticated) {
            this.applySession(session);
            try {
              localStorage.setItem('nigson_dev_session', JSON.stringify(session));
              sessionStorage.setItem('nigson_dev_session', JSON.stringify(session));
            } catch {}
          } else {
            const hasRestored = this.restoreLocalSession();
            if (!hasRestored) {
              this.applySession(session);
            }
          }
        }),
        catchError(err => {
          this.restoreLocalSession();
          return of({ authenticated: this.authenticated() });
        })
      );
  }

  /**
   * Initiates Keycloak OIDC login through the Commerce BFF session flow.
   * Return URL is validated against the backend allowed return paths:
   * [/, /account, /shop, /checkout]
   */
  signIn(returnUrl = '/account'): void {
    let target = returnUrl;
    if (!['/', '/account', '/shop', '/checkout'].includes(target)) {
      if (target.startsWith('/checkout') || target.startsWith('/cart')) {
        target = '/checkout';
      } else {
        target = '/account';
      }
    }
    window.location.href = `${BFF_BASE}/bff/login?returnTo=${encodeURIComponent(target)}`;
  }

  /**
   * Clears the current session and dev storage.
   */
  clearSession() {
    try {
      sessionStorage.removeItem('nigson_dev_session');
      sessionStorage.removeItem('nigson_pkce_verifier');
      sessionStorage.removeItem('nigson_auth_return_url');
      localStorage.removeItem('nigson_dev_session');
      localStorage.removeItem('nigson_user');
    } catch {}
    this.clearSessionState();

    // Call /bff/logout to invalidate server cookie if present
    this.http
      .post(`${BFF_BASE}/bff/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  clearSessionState() {
    try {
      sessionStorage.removeItem('nigson_dev_session');
      localStorage.removeItem('nigson_dev_session');
    } catch {}
    this.authenticated.set(false);
    this.userId.set(null);
    this.fullName.set(null);
    this.email.set(null);
    this.roles.set([]);
    this.csrfToken.set(null);
    this.sessionLoaded.set(true);
  }

  private applySession(s: BffSession) {
    const isAuth = s.authenticated ?? false;
    this.authenticated.set(isAuth);
    this.userId.set((s as any).partyId ?? s.userId ?? null);
    this.fullName.set((s as any).displayName ?? s.fullName ?? null);
    this.email.set(s.email ?? null);
    this.roles.set(s.roles ?? []);
    this.csrfToken.set(s.csrfToken ?? null);
    this.sessionLoaded.set(true);
  }

  /**
   * Sets the session state from an authenticated user object (e.g. from Keycloak callback).
   */
  setSession(user: { userId?: string; fullName?: string; email?: string; roles?: string[]; csrfToken?: string }): void {
    const sessionObj = {
      authenticated: true,
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      csrfToken: user.csrfToken
    };
    this.applySession(sessionObj);
    try {
      sessionStorage.setItem('nigson_dev_session', JSON.stringify(sessionObj));
      localStorage.setItem('nigson_dev_session', JSON.stringify(sessionObj));
    } catch {}
  }



  // ─── Role helpers ────────────────────────────────────────────────────────

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isCustomer(): boolean {
    return this.hasRole('CUSTOMER');
  }

  isStaff(): boolean {
    return ['ADMIN', 'SALES', 'OPERATIONS', 'FINANCE',
            'CONTENT_EDITOR', 'CONTENT_PUBLISHER', 'ANALYST']
      .some(r => this.hasRole(r));
  }

  isSales(): boolean {
    return this.hasRole('SALES');
  }

  isOperations(): boolean {
    return this.hasRole('OPERATIONS');
  }

  isContentEditor(): boolean {
    return this.hasRole('CONTENT_EDITOR');
  }

  isContentPublisher(): boolean {
    return this.hasRole('CONTENT_PUBLISHER');
  }
}
