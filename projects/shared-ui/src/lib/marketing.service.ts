import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, tap, catchError, map } from "rxjs";
import { SessionService } from "./session.service";

/**
 * Enquiry Input DTO (API-087 - TASK-56)
 */
export interface EnquiryPayload {
  type: "CONTACT" | "COMPLAINT";
  name: string;
  email: string;
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

  /** TASK-56: Submit contact or complaint enquiry (POST /api/v1/enquiries) */
  submitEnquiry(payload: EnquiryPayload): Observable<boolean> {
    this.submittingEnquiry.set(true);
    const body = {
      ...payload,
      antiSpamToken: payload.antiSpamToken || "token_" + Math.random().toString(36).substring(2)
    };

    return this.http.post("/api/v1/enquiries", body).pipe(
      map(() => true),
      tap(() => this.submittingEnquiry.set(false)),
      catchError(err => {
        console.error("[MarketingService] submitEnquiry failed:", err);
        this.submittingEnquiry.set(false);
        return of(false);
      })
    );
  }

  /** TASK-57: Subscribe to newsletter with double opt-in (POST /api/v1/newsletter-subscriptions) */
  subscribeNewsletter(email: string): Observable<boolean> {
    this.subscribingNewsletter.set(true);
    const body = {
      email,
      policyVersion: "1.0",
      antiSpamToken: "token_" + Math.random().toString(36).substring(2)
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
  submitDistributorApplication(payload: DistributorApplicationPayload): Observable<BackendDistributorApplication | null> {
    this.submittingDistributor.set(true);
    const body = {
      organizationName: payload.organizationName,
      countryCode: payload.countryCode || "NG",
      documentIds: payload.documentIds || [],
      businessReference: payload.businessReference || undefined
    };

    return this.http.post<BackendDistributorApplication>("/api/v1/distributor-applications", body).pipe(
      tap(() => this.submittingDistributor.set(false)),
      catchError(err => {
        console.error("[MarketingService] submitDistributorApplication failed:", err);
        this.submittingDistributor.set(false);
        return of(null);
      })
    );
  }

  /** TASK-60: Get my distributor applications (GET /api/v1/me/distributor-applications) */
  getMyDistributorApplications(): Observable<BackendDistributorApplication[]> {
    if (!this.session.authenticated()) return of([]);
    return this.http.get<{ content: BackendDistributorApplication[] }>("/api/v1/me/distributor-applications").pipe(
      map(res => res?.content ?? []),
      catchError(err => {
        console.warn("[MarketingService] getMyDistributorApplications failed:", err);
        return of([]);
      })
    );
  }
}
