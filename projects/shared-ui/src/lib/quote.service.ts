import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, of, tap, catchError } from "rxjs";
import { SessionService } from "./session.service";

/**
 * QuoteService (TASK-46 to TASK-50)
 * 
 * Backend Quote API endpoints:
 *   POST /api/v1/quotes           - TASK-46: Submit quote request
 *   GET  /api/v1/quotes           - TASK-47: List my quotes (paginated)
 *   GET  /api/v1/quotes/:quoteId  - TASK-48: Get single quote
 *   POST /api/v1/quotes/:quoteId/accept - TASK-49: Accept quoted price
 *   POST /api/v1/quotes/:quoteId/reject - TASK-50: Reject quoted price
 * 
 * Quote status backend enum:
 *   PENDING | UNDER_REVIEW | QUOTED | ACCEPTED | REJECTED | CLOSED | EXPIRED
 */
export interface QuoteRequestPayload {
  productDescription: string;
  quantityRequested: number;
  unitOfMeasure?: string;
  targetPriceMinorUnits?: number;
  deliveryAddress?: {
    line1: string;
    city: string;
    state: string;
    countryCode: string;
  };
  notes?: string;
  contactPhone?: string;
}

export interface BackendQuote {
  quoteId: string;
  quoteNumber: string;
  productDescription: string;
  quantityRequested: number;
  status: "PENDING" | "UNDER_REVIEW" | "QUOTED" | "ACCEPTED" | "REJECTED" | "CLOSED" | "EXPIRED";
  quotedPriceMinorUnits?: number;
  targetPriceMinorUnits?: number;
  validUntil?: string;
  notes?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotesPage {
  content: BackendQuote[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: "root" })
export class QuoteService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  readonly quotes = signal<BackendQuote[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly totalElements = signal(0);

  /** TASK-47: Load my quote history */
  loadQuotes(page = 0, size = 20): Observable<QuotesPage | null> {
    if (!this.session.authenticated()) return of(null);
    this.loading.set(true);
    const params = new HttpParams().set("page", String(page)).set("size", String(size));
    return this.http.get<QuotesPage>("/api/v1/quotes", { params }).pipe(
      tap(pg => {
        this.quotes.set(pg?.content ?? []);
        this.totalElements.set(pg?.totalElements ?? 0);
        this.loading.set(false);
      }),
      catchError(err => {
        console.warn("[QuoteService] Backend /api/v1/quotes unavailable or returned error:", err);
        this.quotes.set([]);
        this.totalElements.set(0);
        this.loading.set(false);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 20
        });
      })
    );
  }

  /** TASK-46: Submit a new quote request */
  submitQuote(payload: QuoteRequestPayload): Observable<BackendQuote | null> {
    this.submitting.set(true);
    const headers = {
      "Idempotency-Key": crypto.randomUUID()
    };
    return this.http.post<BackendQuote>("/api/v1/quotes", payload, { headers }).pipe(
      tap(q => {
        if (q) this.quotes.update(list => [q, ...list]);
        this.submitting.set(false);
      }),
      catchError(err => {
        console.error("[QuoteService] submitQuote:", err);
        this.submitting.set(false);
        return of(null);
      })
    );
  }

  /** TASK-48: Get single quote detail */
  getQuote(quoteId: string): Observable<BackendQuote> {
    return this.http.get<BackendQuote>("/api/v1/quotes/" + quoteId);
  }

  /** TASK-49: Accept quoted price */
  acceptQuote(quoteId: string, version = 0): Observable<BackendQuote | null> {
    const headers = {
      "If-Match": `"${version}"`,
      "Idempotency-Key": crypto.randomUUID()
    };
    return this.http.post<BackendQuote>("/api/v1/quotes/" + quoteId + "/accept", {}, { headers }).pipe(
      tap(q => this.quotes.update(list => list.map(x => x.quoteId === quoteId ? q : x))),
      catchError(err => { console.error("[QuoteService] acceptQuote:", err); return of(null); })
    );
  }

  /** TASK-50: Reject quoted price */
  rejectQuote(quoteId: string, version = 0): Observable<BackendQuote | null> {
    const headers = {
      "If-Match": `"${version}"`,
      "Idempotency-Key": crypto.randomUUID()
    };
    return this.http.post<BackendQuote>("/api/v1/quotes/" + quoteId + "/reject", {}, { headers }).pipe(
      tap(q => this.quotes.update(list => list.map(x => x.quoteId === quoteId ? q : x))),
      catchError(err => { console.error("[QuoteService] rejectQuote:", err); return of(null); })
    );
  }

  /** Map backend status enum to display label */
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: "Pending", UNDER_REVIEW: "Under Review", QUOTED: "Quoted",
      ACCEPTED: "Accepted", REJECTED: "Rejected", CLOSED: "Closed", EXPIRED: "Expired"
    };
    return map[status] ?? status;
  }

  /** Badge CSS classes for each status */
  statusClass(status: string): string {
    const classes: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      UNDER_REVIEW: "bg-blue-100 text-blue-700",
      QUOTED: "bg-emerald-100 text-emerald-700",
      ACCEPTED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      CLOSED: "bg-gray-100 text-gray-600",
      EXPIRED: "bg-gray-100 text-gray-500",
    };
    return classes[status] ?? "bg-gray-100 text-gray-600";
  }

  formatPrice(minorUnits: number): string {
    return String.fromCharCode(8358) + (minorUnits / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }
}
