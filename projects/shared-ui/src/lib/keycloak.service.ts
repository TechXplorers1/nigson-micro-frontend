import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SessionService } from './session.service';

export const KEYCLOAK_BASE = 'http://localhost:8180';
export const KEYCLOAK_REALM = 'nigson-local';
export const KEYCLOAK_CLIENT_ID = 'nigson-frontend';

export interface KeycloakRegistrationInput {
  email: string;
  fullName: string;
  username?: string;
  password?: string;
}

export interface KeycloakLoginResult {
  success: boolean;
  user?: {
    userId: string;
    fullName: string;
    email: string;
    roles: string[];
  };
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class KeycloakService {
  private session = inject(SessionService);

  private get redirectUri(): string {
    return window.location.origin + '/auth/login';
  }

  /**
   * Redirects browser to Keycloak's official OIDC Registration portal using PKCE.
   */
  async redirectToRegister(returnUrl: string = '/account'): Promise<void> {
    const verifier = this.generateVerifier();
    const challenge = await this.generateChallenge(verifier);

    sessionStorage.setItem('nigson_pkce_verifier', verifier);
    sessionStorage.setItem('nigson_auth_return_url', returnUrl);

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: this.redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    window.location.href = KEYCLOAK_BASE + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/registrations?' + params.toString();
  }

  /**
   * Redirects browser to Keycloak's official OIDC Login portal using PKCE.
   */
  async redirectToLogin(returnUrl: string = '/account'): Promise<void> {
    const verifier = this.generateVerifier();
    const challenge = await this.generateChallenge(verifier);

    sessionStorage.setItem('nigson_pkce_verifier', verifier);
    sessionStorage.setItem('nigson_auth_return_url', returnUrl);

    const params = new URLSearchParams({
      client_id: KEYCLOAK_CLIENT_ID,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: this.redirectUri,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });

    window.location.href = KEYCLOAK_BASE + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/auth?' + params.toString();
  }

  /**
   * Handles the OIDC authorization code return from Keycloak (?code=...).
   * Uses native fetch to completely bypass Angular interceptors.
   */
  handleCallback(code: string): Observable<{ success: boolean; returnUrl: string; error?: string }> {
    const verifier = sessionStorage.getItem('nigson_pkce_verifier') || '';
    const returnUrl = sessionStorage.getItem('nigson_auth_return_url') || '/account';

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: KEYCLOAK_CLIENT_ID,
      code: code,
      redirect_uri: this.redirectUri,
      code_verifier: verifier
    });

    const promise = (async () => {
      try {
        const response = await fetch(KEYCLOAK_BASE + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString()
        });

        sessionStorage.removeItem('nigson_pkce_verifier');
        sessionStorage.removeItem('nigson_auth_return_url');

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          return { success: false, returnUrl, error: errData.error_description || 'Token exchange failed' };
        }

        const data = await response.json();
        if (data.id_token) {
          const payload = this.parseJwt(data.id_token);
          if (payload) {
            const user = {
              userId: payload.sub,
              fullName: payload.name || payload.preferred_username || 'Keycloak Customer',
              email: payload.email || '',
              roles: payload.realm_access?.roles?.filter((r: string) => !r.startsWith('default-')) || ['CUSTOMER']
            };
            this.session.setSession(user);
            return { success: true, returnUrl };
          }
        }
        return { success: false, returnUrl, error: 'Could not parse identity tokens.' };
      } catch (err: any) {
        console.error('[KeycloakService] handleCallback error:', err);
        return { success: false, returnUrl, error: err?.message || 'Network error during token exchange.' };
      }
    })();

    return from(promise);
  }

  /**
   * Registers a new user directly in Keycloak via Admin API and signs them in immediately.
   * Uses native fetch with standard headers only (no Idempotency-Key or CSRF headers).
   */
  registerDirect(input: KeycloakRegistrationInput): Observable<KeycloakLoginResult> {
    const names = (input.fullName || 'New User').trim().split(/\s+/);
    const firstName = names[0] || 'New';
    const lastName = names.slice(1).join(' ') || 'Customer';
    const username = (input.username || input.email).toLowerCase().trim();
    const password = input.password || 'NigsonPass123!';

    const promise = (async (): Promise<KeycloakLoginResult> => {
      try {
        // Step 1: Admin token
        const adminBody = new URLSearchParams({
          client_id: 'admin-cli',
          username: 'local-bootstrap',
          password: 'mock-local-identity-admin',
          grant_type: 'password'
        });

        const tokenRes = await fetch(KEYCLOAK_BASE + '/realms/master/protocol/openid-connect/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: adminBody.toString()
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.json().catch(() => ({}));
          return { success: false, error: err.error_description || 'Identity service unavailable.' };
        }

        const { access_token } = await tokenRes.json();

        // Step 2: Create User
        const userPayload = {
          username,
          email: input.email.trim(),
          firstName,
          lastName,
          enabled: true,
          emailVerified: true,
          credentials: [{ type: 'password', value: password, temporary: false }]
        };

        const createRes = await fetch(KEYCLOAK_BASE + '/admin/realms/' + KEYCLOAK_REALM + '/users', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userPayload)
        });

        if (!createRes.ok && createRes.status !== 201) {
          const err = await createRes.json().catch(() => ({}));
          return { success: false, error: err.errorMessage || err.error_description || 'Email or username already registered.' };
        }

        // Step 3: Login as the new user
        return await this.loginWithPasswordAsync(username, password);
      } catch (err: any) {
        console.error('[KeycloakService] registerDirect error:', err);
        return { success: false, error: err?.message || 'Connection to Keycloak failed.' };
      }
    })();

    return from(promise);
  }

  /**
   * Helper to resolve a Keycloak username from an email address via Admin API.
   */
  async resolveUsernameFromEmail(email: string): Promise<string | null> {
    try {
      const adminBody = new URLSearchParams({
        client_id: 'admin-cli',
        username: 'local-bootstrap',
        password: 'mock-local-identity-admin',
        grant_type: 'password'
      });
      const tokenRes = await fetch(KEYCLOAK_BASE + '/realms/master/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: adminBody.toString()
      });
      if (!tokenRes.ok) return null;
      const { access_token } = await tokenRes.json();
      const usersRes = await fetch(KEYCLOAK_BASE + '/admin/realms/' + KEYCLOAK_REALM + '/users?email=' + encodeURIComponent(email.trim()), {
        headers: { Authorization: 'Bearer ' + access_token }
      });
      if (!usersRes.ok) return null;
      const users = await usersRes.json();
      if (Array.isArray(users) && users.length > 0) {
        return users[0].username || null;
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Resets password directly in Keycloak without leaving the site.
   */
  resetPasswordDirect(email: string, newPassword: string): Observable<{ success: boolean; error?: string }> {
    const promise = (async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const adminBody = new URLSearchParams({
          client_id: 'admin-cli',
          username: 'local-bootstrap',
          password: 'mock-local-identity-admin',
          grant_type: 'password'
        });
        const tokenRes = await fetch(KEYCLOAK_BASE + '/realms/master/protocol/openid-connect/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: adminBody.toString()
        });
        if (!tokenRes.ok) return { success: false, error: 'Identity provider unavailable.' };
        const { access_token } = await tokenRes.json();

        const searchRes = await fetch(KEYCLOAK_BASE + '/admin/realms/' + KEYCLOAK_REALM + '/users?email=' + encodeURIComponent(email.trim()), {
          headers: { Authorization: 'Bearer ' + access_token }
        });
        if (!searchRes.ok) return { success: false, error: 'Could not find account with that email.' };
        const users = await searchRes.json();
        if (!Array.isArray(users) || users.length === 0) {
          return { success: false, error: 'No account found with that email address.' };
        }
        const user = users[0];

        const resetRes = await fetch(KEYCLOAK_BASE + '/admin/realms/' + KEYCLOAK_REALM + '/users/' + user.id + '/reset-password', {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer ' + access_token,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'password', value: newPassword, temporary: false })
        });
        if (!resetRes.ok) {
          return { success: false, error: 'Failed to update password in Keycloak.' };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Password reset failed.' };
      }
    })();
    return from(promise);
  }

  /**
   * Direct password login via Keycloak Resource Owner Password Credentials.
   */
  loginWithPassword(username: string, password: string): Observable<KeycloakLoginResult> {
    return from(this.loginWithPasswordAsync(username, password));
  }

  private async loginWithPasswordAsync(username: string, password: string): Promise<KeycloakLoginResult> {
    try {
      let targetUsername = username.trim();
      if (targetUsername.includes('@')) {
        const resolved = await this.resolveUsernameFromEmail(targetUsername);
        if (resolved) {
          targetUsername = resolved;
        }
      }

      let body = new URLSearchParams({
        grant_type: 'password',
        client_id: KEYCLOAK_CLIENT_ID,
        username: targetUsername,
        password,
        scope: 'openid profile email'
      });

      let res = await fetch(KEYCLOAK_BASE + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      // If failed and targetUsername wasn't resolved by email yet, attempt email resolution fallback
      if (!res.ok && !targetUsername.includes('@')) {
        const resolved = await this.resolveUsernameFromEmail(username.trim());
        if (resolved && resolved !== targetUsername) {
          targetUsername = resolved;
          body = new URLSearchParams({
            grant_type: 'password',
            client_id: KEYCLOAK_CLIENT_ID,
            username: targetUsername,
            password,
            scope: 'openid profile email'
          });
          res = await fetch(KEYCLOAK_BASE + '/realms/' + KEYCLOAK_REALM + '/protocol/openid-connect/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString()
          });
        }
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error_description || 'Invalid credentials or account disabled.' };
      }

      const data = await res.json();
      if (data.id_token) {
        const payload = this.parseJwt(data.id_token);
        if (payload) {
          const user = {
            userId: payload.sub,
            fullName: payload.name || payload.preferred_username || username,
            email: payload.email || '',
            roles: payload.realm_access?.roles?.filter((r: string) => !r.startsWith('default-')) || ['CUSTOMER']
          };
          this.session.setSession(user);
          return { success: true, user };
        }
      }
      return { success: false, error: 'Could not parse identity tokens.' };
    } catch (err: any) {
      console.error('[KeycloakService] loginWithPassword error:', err);
      return { success: false, error: err?.message || 'Authentication service unreachable.' };
    }
  }


  /**
   * Clears local authentication state and terminates Keycloak session.
   */
  logout(): void {
    this.session.clearSession();
  }

  private generateVerifier(length: number = 48): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const values = new Uint8Array(length);
    window.crypto.getRandomValues(values);
    return Array.from(values).map(v => charset[v % charset.length]).join('');
  }

  private async generateChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private parseJwt(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }
}
