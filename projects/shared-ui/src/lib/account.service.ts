import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, tap, catchError, map } from "rxjs";
import { SessionService } from "./session.service";
import { ShopService } from "./shop.service";

/**
 * Backend Profile DTO (API-005, API-006 - TASK-47, TASK-48)
 */
export interface ProfileDTO {
  id: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  locale: string;
  version: number;
}

export interface ProfilePatch {
  displayName?: string;
  phone?: string | null;
  locale?: string;
}

/**
 * Backend Address DTO (API-007, API-008, API-009, API-010 - TASK-49)
 */
export interface AddressDTO {
  id: string;
  label?: string | null;
  recipient: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode: string;
  organizationId?: string | null;
  isDefault: boolean;
  version: number;
}

export interface AddressInput {
  label?: string;
  recipient: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  countryCode: string;
  isDefault?: boolean;
}

export interface AddressPatch {
  label?: string | null;
  recipient?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string;
  isDefault?: boolean;
}

/**
 * Backend Reward DTO (API-062 - TASK-50)
 */
export interface RewardBalanceDTO {
  currency: string;
  availableMinorUnits: number;
  lifetimeEarnedMinorUnits?: number;
  tierName?: string;
}

export interface RewardEntryDTO {
  id: string;
  type: string;
  minorUnits: number;
  currency: string;
  description: string;
  createdAt: string;
}

export interface RewardLedgerDTO {
  availableByCurrency: RewardBalanceDTO[];
  entries: RewardEntryDTO[];
}

/**
 * Backend Referral DTO (API-063, API-161 - TASK-51)
 */
export interface ReferralDTO {
  code: string;
  link: string;
  qualifiedReferralCount: number;
}

@Injectable({ providedIn: "root" })
export class AccountService {
  private http = inject(HttpClient);
  private session = inject(SessionService);
  private shop = inject(ShopService);

  readonly profile = signal<ProfileDTO | null>(null);
  readonly addresses = signal<AddressDTO[]>([]);
  readonly rewards = signal<RewardLedgerDTO | null>(null);
  readonly referral = signal<ReferralDTO | null>(null);

  readonly loadingProfile = signal(false);
  readonly loadingAddresses = signal(false);
  readonly loadingRewards = signal(false);
  readonly loadingReferral = signal(false);

  /** TASK-47: Load profile from GET /api/v1/me and sync to ShopService.user */
  loadProfile(): Observable<ProfileDTO | null> {
    if (!this.session.authenticated()) return of(null);
    this.loadingProfile.set(true);
    return this.http.get<ProfileDTO>("/api/v1/me").pipe(
      tap(p => {
        this.profile.set(p);
        this.loadingProfile.set(false);
        // Sync into ShopService.user signal
        this.shop.user.set({
          id: p.id,
          fullName: p.displayName,
          email: p.email,
          phone: p.phone ?? undefined,
          roles: this.session.roles(),
          createdAt: new Date().toISOString()
        });
      }),
      catchError(err => {
        console.error("[AccountService] Backend /api/v1/me unavailable:", err?.status ?? err);
        this.profile.set(null);
        this.loadingProfile.set(false);
        return of(null);
      })
    );
  }

  /** TASK-48: Update profile via PATCH /api/v1/me */
  updateProfile(patch: ProfilePatch): Observable<ProfileDTO | null> {
    return this.http.patch<ProfileDTO>("/api/v1/me", patch).pipe(
      tap(p => {
        this.profile.set(p);
        if (this.shop.user()) {
          this.shop.user.update(u => u ? {
            ...u,
            fullName: p.displayName,
            phone: p.phone ?? undefined
          } : null);
        }
      }),
      catchError(err => {
        console.error("[AccountService] updateProfile failed:", err);
        return of(null);
      })
    );
  }

  /** TASK-49: Load saved addresses (GET /api/v1/me/addresses) */
  loadAddresses(): Observable<AddressDTO[]> {
    if (!this.session.authenticated()) return of([]);
    this.loadingAddresses.set(true);
    return this.http.get<AddressDTO[]>("/api/v1/me/addresses").pipe(
      tap(addrs => {
        this.addresses.set(addrs ?? []);
        this.loadingAddresses.set(false);
      }),
      catchError(err => {
        console.error("[AccountService] Backend /api/v1/me/addresses unavailable:", err?.status ?? err);
        this.addresses.set([]);
        this.loadingAddresses.set(false);
        return of([]);
      })
    );
  }

  /** TASK-49: Add a new address (POST /api/v1/me/addresses) */
  addAddress(address: AddressInput): Observable<AddressDTO | null> {
    return this.http.post<AddressDTO>("/api/v1/me/addresses", address).pipe(
      tap(created => {
        this.addresses.update(list => [...list, created]);
      }),
      catchError(err => {
        console.error("[AccountService] addAddress failed:", err);
        return of(null);
      })
    );
  }

  /** TASK-49: Update existing address (PATCH /api/v1/me/addresses/:id) */
  updateAddress(id: string, patch: AddressPatch): Observable<AddressDTO | null> {
    return this.http.patch<AddressDTO>("/api/v1/me/addresses/" + id, patch).pipe(
      tap(updated => {
        this.addresses.update(list => list.map(a => a.id === id ? updated : a));
      }),
      catchError(err => {
        console.error("[AccountService] updateAddress failed:", err);
        return of(null);
      })
    );
  }

  /** TASK-49: Delete address (DELETE /api/v1/me/addresses/:id) */
  deleteAddress(id: string): Observable<boolean> {
    return this.http.delete("/api/v1/me/addresses/" + id).pipe(
      tap(() => {
        this.addresses.update(list => list.filter(a => a.id !== id));
      }),
      map(() => true),
      catchError(err => {
        console.error("[AccountService] deleteAddress failed:", err);
        return of(false);
      })
    );
  }

  /** TASK-50: Load rewards ledger (GET /api/v1/me/rewards) */
  loadRewards(): Observable<RewardLedgerDTO | null> {
    if (!this.session.authenticated()) return of(null);
    this.loadingRewards.set(true);
    return this.http.get<RewardLedgerDTO>("/api/v1/me/rewards").pipe(
      tap(r => {
        this.rewards.set(r);
        this.loadingRewards.set(false);
      }),
      catchError(err => {
        console.error("[AccountService] Backend /api/v1/me/rewards unavailable:", err?.status ?? err);
        this.rewards.set(null);
        this.loadingRewards.set(false);
        return of(null);
      })
    );
  }

  /** TASK-51: Load referral code (GET /api/v1/me/referral-code) */
  loadReferral(): Observable<ReferralDTO | null> {
    if (!this.session.authenticated()) return of(null);
    this.loadingReferral.set(true);
    return this.http.get<ReferralDTO>("/api/v1/me/referral-code").pipe(
      tap(ref => {
        this.referral.set(ref);
        this.loadingReferral.set(false);
      }),
      catchError(err => {
        console.error("[AccountService] Backend /api/v1/me/referral-code unavailable:", err?.status ?? err);
        this.referral.set(null);
        this.loadingReferral.set(false);
        return of(null);
      })
    );
  }

  formatPrice(minorUnits: number): string {
    return String.fromCharCode(8358) + (minorUnits / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
}
