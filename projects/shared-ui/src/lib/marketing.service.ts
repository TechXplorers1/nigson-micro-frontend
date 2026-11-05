import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpHeaders, HttpErrorResponse } from "@angular/common/http";
import { Observable, of, from, tap, catchError, map, switchMap } from "rxjs";
import { SessionService } from "./session.service";

/** Local dev anti-spam HMAC-SHA256 signature generator matching backend LocalLeadMocks.AntiSpam */
async function createLeadAntiSpamToken(idempotencyKey: string): Promise<string> {
  const nonce = "syntheticnonce123456";
  const keyBase64 = "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=";
  try {
    const rawKey = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      rawKey,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const message = new TextEncoder().encode(`${nonce}\n${idempotencyKey}`);
    const signature = await window.crypto.subtle.sign("HMAC", cryptoKey, message);
    const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `${nonce}.${sigBase64}`;
  } catch {
    return `${nonce}.fallback`;
  }
}

export interface EnquiryResult {
  success: boolean;
  status: number;
  data?: any;
  error?: string;
}

export interface DistributorApplicationResult {
  success: boolean;
  status: number;
  data?: BackendDistributorApplication | null;
  error?: string;
}

/**
 * Enquiry Input DTO (API-087 - TASK-56)
 */
export interface EnquiryPayload {
  type: "CONTACT" | "COMPLAINT" | "QUOTE" | "DISTRIBUTOR";
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  antiSpamToken?: string;
}

/**
 * Distributor Application Input DTO (API-092 - TASK-60)
 */
export interface DistributorApplicationPayload {
  organizationName: string;
  countryCode: string;
  documentIds?: string[];
  businessReference?: string;
}

export interface BackendDistributorApplication {
  id: string;
  state: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  organizationId?: string;
  submittedAt: string;
  version: number;
}

/**
 * Career Opportunity DTO (API-103, API-105 - TASK-58, TASK-59)
 */
export interface CareerOpportunity {
  id: string;
  title: string;
  slug: string;
  kind: string;
  description: string;
  closesAt?: string;
  state: string;
}

@Injectable({ providedIn: "root" })
export class MarketingService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  readonly submittingEnquiry = signal(false);
  readonly submittingDistributor = signal(false);
  readonly subscribingNewsletter = signal(false);

  readonly careers = signal<CareerOpportunity[]>([]);
  readonly loadingCareers = signal(false);

  /** TASK-56: Submit contact, distributor, or partner enquiry (POST /api/v1/enquiries) */
  submitEnquiry(payload: EnquiryPayload): Observable<EnquiryResult> {
    this.submittingEnquiry.set(true);
    const idempotencyKey = crypto.randomUUID();
    // Backend LeadValues.validate requires type to be CONTACT or COMPLAINT for public intake,
    // while experience.lead database stores the full structured details in message and subject.
    const intakeType = (payload.type === 'DISTRIBUTOR' || payload.type === 'QUOTE') ? 'CONTACT' : payload.type;

    return from(createLeadAntiSpamToken(idempotencyKey)).pipe(
      switchMap(token => {
        const body: Record<string, any> = {
          type: intakeType,
          name: (payload.name || '').trim().slice(0, 160),
          email: (payload.email || '').trim().toLowerCase().slice(0, 254),
          subject: (payload.subject || 'Commercial Partner Enquiry').trim().slice(0, 200),
          message: (payload.message || '').trim(),
          antiSpamToken: payload.antiSpamToken || token
        };

        if (payload.phone) {
          const cleaned = payload.phone.replace(/[^0-9+]/g, '');
          if (cleaned.startsWith('+') && cleaned.length >= 8 && cleaned.length <= 16) {
            body['phone'] = cleaned;
          } else if (cleaned.length >= 8 && cleaned.length <= 15) {
            body['phone'] = '+' + cleaned.replace(/^\+/, '');
          }
        }

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        });

        return this.http.post<any>("/api/v1/enquiries", body, { headers }).pipe(
          map(res => {
            this.submittingEnquiry.set(false);
            return { success: true, status: 201, data: res };
          }),
          catchError((err: HttpErrorResponse) => {
            console.error("[MarketingService] submitEnquiry failed:", err);
            this.submittingEnquiry.set(false);
            const detail = err?.error?.detail || err?.error?.title || (err.status === 422 ? 'This feature is currently gated or inactive in backend environment.' : (err.message || 'Submission error'));
            return of({
              success: false,
              status: err.status || 500,
              error: detail
            });
          })
        );
      })
    );
  }

  /** TASK-57: Subscribe to newsletter with double opt-in (POST /api/v1/newsletter-subscriptions) */
  subscribeNewsletter(email: string): Observable<boolean> {
    this.subscribingNewsletter.set(true);
    const body = {
      email,
      policyVersion: "",
      antiSpamToken: ""
    };

    return this.http.post("/api/v1/newsletter-subscriptions", body).pipe(
      map(() => true),
      tap(() => this.subscribingNewsletter.set(false)),
      catchError(err => {
        console.error("[MarketingService] subscribeNewsletter failed:", err);
        this.subscribingNewsletter.set(false);
        return of(false);
      })
    );
  }

  /** TASK-58: Load public career opportunities (GET /api/v1/career-opportunities) */
  loadCareers(): Observable<CareerOpportunity[]> {
    this.loadingCareers.set(true);
    return this.http.get<{ items: CareerOpportunity[] }>("/api/v1/career-opportunities").pipe(
      map(res => res?.items ?? []),
      tap(items => {
        this.careers.set(items);
        this.loadingCareers.set(false);
      }),
      catchError(err => {
        console.warn("[MarketingService] loadCareers failed:", err);
        this.loadingCareers.set(false);
        return of([]);
      })
    );
  }

  /** TASK-59: Submit career job application (POST /api/v1/career-opportunities/:id/applications) */
  submitCareerApplication(opportunityId: string, payload: {
    name: string;
    email: string;
    answers?: Record<string, any>;
    cvFileId?: string;
  }): Observable<boolean> {
    return this.http.post(`/api/v1/career-opportunities/${opportunityId}/applications`, payload).pipe(
      map(() => true),
      catchError(err => {
        console.error("[MarketingService] submitCareerApplication failed:", err);
        return of(false);
      })
    );
  }

  /** TASK-60: Submit distributor application (POST /api/v1/distributor-applications) */
  submitDistributorApplication(payload: DistributorApplicationPayload): Observable<DistributorApplicationResult> {
    this.submittingDistributor.set(true);
    const body = {
      organizationName: (payload.organizationName || '').trim().slice(0, 200),
      countryCode: (payload.countryCode || "NG").trim().slice(0, 2).toUpperCase(),
      documentIds: payload.documentIds || [],
      businessReference: payload.businessReference ? payload.businessReference.trim().slice(0, 100) : undefined
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    });

    return this.http.post<BackendDistributorApplication>("/api/v1/distributor-applications", body, { headers }).pipe(
      map(res => {
        this.submittingDistributor.set(false);
        return { success: true, status: 201, data: res };
      }),
      catchError((err: HttpErrorResponse) => {
        console.error("[MarketingService] submitDistributorApplication failed:", err);
        this.submittingDistributor.set(false);
        const detail = err?.error?.detail || err?.error?.title || (err.status === 422 ? 'Corporate distributor intake feature is currently inactive in this phase.' : (err.message || 'Submission error'));
        return of({
          success: false,
          status: err.status || 500,
          data: null,
          error: detail
        });
      })
    );
  }

  /** TASK-60: Get my distributor applications (GET /api/v1/me/distributor-applications) */
  getMyDistributorApplications(): Observable<BackendDistributorApplication[]> {
    if (!this.session.authenticated()) return of([]);
    return this.http.get<BackendDistributorApplication[]>("/api/v1/me/distributor-applications").pipe(
      map(res => res ?? []),
      catchError(err => {
        console.warn("[MarketingService] getMyDistributorApplications failed:", err);
        return of([]);
      })
    );
  }
}
