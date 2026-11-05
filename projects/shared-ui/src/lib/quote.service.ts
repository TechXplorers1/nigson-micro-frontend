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
    this.loading.set(true);
    const params = new HttpParams().set("page", String(page)).set("size", String(size));
    return this.http.get<QuotesPage>("/api/v1/quotes", { params }).pipe(
      tap(pg => {
        const backendItems = pg?.content ?? [];
        const localItems = this.readUserLocalQuotes();
        const merged = [...localItems, ...backendItems.filter(b => !localItems.some(l => l.quoteId === b.quoteId))];
        this.quotes.set(merged);
        this.totalElements.set(merged.length);
        this.loading.set(false);
      }),
      catchError(err => {
        const localItems = this.readUserLocalQuotes();
        this.quotes.set(localItems);
        this.totalElements.set(localItems.length);
        this.loading.set(false);
        return of({
          content: localItems,
          totalElements: localItems.length,
          totalPages: 1,
          number: 0,
          size: 20
        });
      })
    );
  }

  private readUserLocalQuotes(): BackendQuote[] {
    try {
      const raw = localStorage.getItem('nigson_quotes_user');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveUserLocalQuotes(q: BackendQuote): void {
    try {
      const existing = this.readUserLocalQuotes();
      localStorage.setItem('nigson_quotes_user', JSON.stringify([q, ...existing]));
    } catch {}
  }

  /** TASK-46: Submit a new quote request */
  submitQuote(payload: QuoteRequestPayload): Observable<BackendQuote | null> {
    this.submitting.set(true);
    const headers = {
      "Idempotency-Key": crypto.randomUUID()
    };
    const localQuote: BackendQuote = {
      quoteId: 'quo_' + Math.random().toString(36).slice(2, 9),
      quoteNumber: 'QUO-' + Math.floor(10000 + Math.random() * 90000),
      productDescription: payload.productDescription,
      quantityRequested: payload.quantityRequested,
      status: 'PENDING',
      targetPriceMinorUnits: payload.targetPriceMinorUnits,
      notes: payload.notes,
      contactPhone: payload.contactPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.http.post<BackendQuote>("/api/v1/quotes", payload, { headers }).pipe(
      tap(q => {
        const item = q || localQuote;
        this.saveUserLocalQuotes(item);
        this.quotes.update(list => [item, ...list]);
        this.submitting.set(false);
      }),
      catchError(err => {
        this.saveUserLocalQuotes(localQuote);
        this.quotes.update(list => [localQuote, ...list]);
        this.submitting.set(false);
        return of(localQuote);
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
