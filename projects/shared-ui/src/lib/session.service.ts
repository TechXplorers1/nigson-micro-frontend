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

  /**
   * Calls GET /bff/session and populates all signals.
   * Returns an Observable that resolves to the session state.
   */
  loadSession(): Observable<BffSession> {
    return this.http
      .get<BffSession>(`${BFF_BASE}/bff/session`, { withCredentials: true })
      .pipe(
        tap(session => {
          this.applySession(session);
        }),
        catchError(err => {
          this.clearSessionState();
          return of({ authenticated: false });
        })
      );
  }

  /**
   * Initiates Keycloak OIDC login through the Commerce BFF session flow.
   */
  signIn(returnUrl = '/account'): void {
    window.location.href = `${BFF_BASE}/bff/login?returnTo=${encodeURIComponent(returnUrl)}`;
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

  private clearSessionState() {
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
    this.userId.set(s.userId ?? null);
    this.fullName.set(s.fullName ?? null);
    this.email.set(s.email ?? null);
    this.roles.set(s.roles ?? []);
    this.csrfToken.set(s.csrfToken ?? null);
    this.sessionLoaded.set(true);
  }

  /**
   * Sets the session state from an authenticated user object (e.g. from Keycloak callback).
   */
  setSession(user: { userId?: string; fullName?: string; email?: string; roles?: string[]; csrfToken?: string }): void {
    this.applySession({
      authenticated: true,
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      csrfToken: user.csrfToken
    });
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
