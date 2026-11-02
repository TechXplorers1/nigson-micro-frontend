import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import { BFF_BASE } from './api.service';

/** The server-side Commerce BFF session view. The browser never stores identity tokens. */
export interface BffSession {
  authenticated: boolean;
  partyId?: string | null;
  displayName?: string | null;
  roles?: string[];
  organizationMemberships?: Array<{ organizationId: string; role: string }>;
  expiresAt?: string | null;
  csrfToken?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);
  readonly csrfToken = signal<string | null>(null);
  readonly authenticated = signal(false);
  readonly userId = signal<string | null>(null);
  readonly fullName = signal<string | null>(null);
  readonly email = signal<string | null>(null);
  readonly roles = signal<string[]>([]);
  readonly sessionLoaded = signal(false);

  constructor() { this.loadSession().subscribe(); }

  /** Load only the session asserted by the Java BFF cookie. */
  loadSession(): Observable<BffSession> {
    return this.http.get<BffSession>(`${BFF_BASE}/bff/session`, { withCredentials: true }).pipe(
      tap(session => this.applySession(session)),
      catchError(() => {
        const anonymous = { authenticated: false };
        this.applySession(anonymous);
        return of(anonymous);
      })
    );
  }

  /** Start the Keycloak authorization-code flow through the Java BFF. */
  signIn(returnUrl = '/account'): void {
    const target = ['/','/account','/shop','/checkout'].includes(returnUrl)
      ? returnUrl
      : returnUrl.startsWith('/checkout') || returnUrl.startsWith('/cart') ? '/checkout' : '/account';
    const loginUrl = new URL(`${BFF_BASE}/bff/login`, window.location.origin);
    // The local Compose callback defaults to localhost:4200. Host-only session
    // cookies created on 127.0.0.1 are not sent to that callback host.
    if (!BFF_BASE && window.location.protocol === 'http:' &&
        window.location.hostname === '127.0.0.1' && window.location.port === '4200') {
      loginUrl.hostname = 'localhost';
    }
    loginUrl.searchParams.set('returnTo', target);
    window.location.assign(loginUrl.toString());
  }

  clearSession(): void {
    this.logout().subscribe();
  }

  /** Use the current CSRF proof (loading it if needed), end one server session, then clear local state. */
  logout(): Observable<void> {
    const currentToken = this.csrfToken();
    const session$ = currentToken
      ? of({ authenticated: true, csrfToken: currentToken } as BffSession)
      : this.loadSession();
    return session$.pipe(
      switchMap(session => {
        if (!session.authenticated || !session.csrfToken) return of(undefined);
        return this.http.post<void>(`${BFF_BASE}/bff/logout`, {}, {
          withCredentials: true,
          headers: { 'X-CSRF-TOKEN': session.csrfToken }
        }).pipe(map(() => undefined));
      }),
      catchError(() => of(undefined)),
      finalize(() => this.clearSessionState())
    );
  }

  clearSessionState(): void {
    this.authenticated.set(false);
    this.userId.set(null);
    this.fullName.set(null);
    this.email.set(null);
    this.roles.set([]);
    this.csrfToken.set(null);
    this.sessionLoaded.set(true);
  }

  private applySession(session: BffSession): void {
    this.authenticated.set(session.authenticated === true);
    this.userId.set(session.partyId ?? null);
    this.fullName.set(session.displayName ?? null);
    this.email.set(null);
    this.roles.set(session.authenticated ? (session.roles ?? []) : []);
    this.csrfToken.set(session.authenticated ? (session.csrfToken ?? null) : null);
    this.sessionLoaded.set(true);
  }

  hasRole(role: string): boolean { return this.roles().includes(role); }
  isAdmin(): boolean { return this.hasRole('ADMIN'); }
  isCustomer(): boolean { return this.hasRole('CUSTOMER'); }
  isStaff(): boolean { return ['ADMIN','SALES','OPERATIONS','FINANCE','CONTENT_EDITOR','CONTENT_PUBLISHER','ANALYST'].some(role => this.hasRole(role)); }
  isSales(): boolean { return this.hasRole('SALES'); }
  isOperations(): boolean { return this.hasRole('OPERATIONS'); }
  isContentEditor(): boolean { return this.hasRole('CONTENT_EDITOR'); }
  isContentPublisher(): boolean { return this.hasRole('CONTENT_PUBLISHER'); }
}
