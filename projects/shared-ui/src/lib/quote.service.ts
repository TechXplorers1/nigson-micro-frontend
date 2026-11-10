import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, finalize, tap } from "rxjs/operators";

export interface QuoteRequestPayload {
  marketId: string;
  organizationId?: string | null;
  products: Array<{ skuId: string; quantity: string }>;
  subject: string;
  message: string;
  contact: { name: string; email: string; phone?: string };
}

export interface QuoteRequestCreated {
  leadId: string;
  state: "NEW";
}

export interface QuoteRequestHistoryItem {
  leadId: string;
  subject: string;
  message: string;
  state: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  quoteId: string | null;
  createdAt: string;
  updatedAt: string;
  products: Array<{ skuId: string; quantity: string }>;
}

export interface QuoteRequestsPage {
  items: QuoteRequestHistoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

@Injectable({ providedIn: "root" })
export class QuoteService {
  private http = inject(HttpClient);

  readonly quotes = signal<QuoteRequestHistoryItem[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly totalElements = signal(0);
  readonly loadError = signal<string | null>(null);

  loadQuotes(page = 0, size = 20): Observable<QuoteRequestsPage | null> {
    this.loading.set(true);
    this.loadError.set(null);
    const params = new HttpParams().set("page", String(page)).set("size", String(size));
    return this.http.get<QuoteRequestsPage>("/api/v1/quote-requests", { params }).pipe(
      tap(result => {
        this.quotes.set(result.items);
        this.totalElements.set(result.totalElements);
      }),
      catchError(error => {
        this.loadError.set(error?.error?.detail || "Unable to load quote requests. Please try again.");
        return of(null);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  submitQuote(payload: QuoteRequestPayload): Observable<QuoteRequestCreated> {
    this.submitting.set(true);
    return this.http.post<QuoteRequestCreated>("/api/v1/quote-requests", payload, {
      headers: { "Idempotency-Key": crypto.randomUUID() }
    }).pipe(finalize(() => this.submitting.set(false)));
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      NEW: "Submitted",
      ASSIGNED: "Under review",
      IN_PROGRESS: "In progress",
      RESOLVED: "Responded",
      CLOSED: "Closed"
    };
    return labels[status] ?? status;
  }

  statusClass(status: string): string {
    const classes: Record<string, string> = {
      NEW: "bg-amber-100 text-amber-700",
      ASSIGNED: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      RESOLVED: "bg-emerald-100 text-emerald-700",
      CLOSED: "bg-gray-100 text-gray-600"
    };
    return classes[status] ?? "bg-gray-100 text-gray-600";
  }
}
