import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackendQuote, QuoteService, ShopService } from 'shared-ui';
import {
  LucideClipboardList,
  LucideArrowRight,
  LucidePlus,
  LucideCheck,
  LucideX,
  LucideLoader2,
  LucideAlertCircle
} from '@lucide/angular';

@Component({
  selector: 'app-my-quotes',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    LucideClipboardList,
    LucideArrowRight,
    LucidePlus,
    LucideCheck,
    LucideX,
    LucideLoader2,
    LucideAlertCircle
  ],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-brand">Wholesale</p>
            <h2 class="text-2xl font-extrabold text-ink">My Quote Requests</h2>
          </div>
          <a
            routerLink="/quote"
            class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm"
          >
            <svg lucidePlus class="h-4 w-4"></svg> New Quote Request
          </a>
        </div>
      </div>

      <!-- Action feedback alert -->
      <div *ngIf="actionMessage()" class="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg lucideCheck class="h-5 w-5 text-emerald-600"></svg>
          <span>{{ actionMessage() }}</span>
        </div>
        <button (click)="actionMessage.set(null)" class="text-emerald-600 hover:text-emerald-800">
          <svg lucideX class="h-4 w-4"></svg>
        </button>
      </div>

      <div *ngIf="errorMessage()" class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <svg lucideAlertCircle class="h-5 w-5 text-red-600"></svg>
          <span>{{ errorMessage() }}</span>
        </div>
        <button (click)="errorMessage.set(null)" class="text-red-600 hover:text-red-800">
          <svg lucideX class="h-4 w-4"></svg>
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="quoteSvc.loading()" class="rounded-2xl border border-hairline bg-white p-16 text-center">
        <svg lucideLoader2 class="mx-auto h-8 w-8 animate-spin text-brand"></svg>
        <p class="mt-4 text-sm text-muted-ink">Loading your quote requests...</p>
      </div>

      <!-- Empty state -->
      <div *ngIf="!quoteSvc.loading() && quotes().length === 0" class="rounded-2xl border border-hairline bg-white p-16 text-center">
        <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-alt">
          <svg lucideClipboardList class="h-8 w-8 text-muted-ink"></svg>
        </div>
        <p class="mt-4 text-lg font-bold text-ink">No quote requests yet</p>
        <p class="mt-2 text-sm text-muted-ink">Submit a wholesale quote request and track pricing or negotiations here.</p>
        <a routerLink="/quote" class="mt-6 inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors shadow-sm">
          Request a Quote <svg lucideArrowRight class="h-4 w-4"></svg>
        </a>
      </div>

      <!-- Quotes list -->
      <div *ngIf="!quoteSvc.loading() && quotes().length > 0" class="rounded-2xl border border-hairline bg-white overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
              <tr>
                <th class="px-6 py-4">Quote Number</th>
                <th class="px-6 py-4">Product / Specs</th>
                <th class="px-6 py-4">Qty</th>
                <th class="px-6 py-4">Quoted Price</th>
                <th class="px-6 py-4">Status</th>
                <th class="px-6 py-4">Date</th>
                <th class="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-hairline">
              <tr *ngFor="let q of quotes()" class="hover:bg-surface-alt/30 transition-colors">
                <td class="px-6 py-4 font-bold text-ink">{{ q.quoteNumber }}</td>
                <td class="px-6 py-4 text-muted-ink max-w-xs truncate" [title]="q.productDescription">
                  {{ q.productDescription }}
                  <span *ngIf="q.notes" class="block text-xs text-muted-ink/70 truncate">{{ q.notes }}</span>
                </td>
                <td class="px-6 py-4 font-semibold">{{ q.quantityRequested.toLocaleString() }}</td>
                <td class="px-6 py-4">
                  <span *ngIf="q.quotedPriceMinorUnits != null" class="font-bold text-ink">
                    {{ quoteSvc.formatPrice(q.quotedPriceMinorUnits) }}
                  </span>
                  <span *ngIf="q.quotedPriceMinorUnits == null" class="text-xs text-muted-ink italic">
                    Awaiting quote
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="rounded-full px-3 py-1 text-[11px] font-bold" [ngClass]="quoteSvc.statusClass(q.status)">
                    {{ quoteSvc.statusLabel(q.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ formatDate(q.createdAt) }}</td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <!-- Actions for QUOTED status (TASK-49 / TASK-50) -->
                  <div *ngIf="q.status === 'QUOTED'" class="flex items-center justify-end gap-2">
                    <button
                      (click)="accept(q)"
                      [disabled]="processingId() === q.quoteId"
                      class="inline-flex items-center gap-1 rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      title="Accept quoted price"
                    >
                      <svg *ngIf="processingId() !== q.quoteId" lucideCheck class="h-3.5 w-3.5"></svg>
                      <svg *ngIf="processingId() === q.quoteId" lucideLoader2 class="h-3.5 w-3.5 animate-spin"></svg>
                      Accept
                    </button>
                    <button
                      (click)="reject(q)"
                      [disabled]="processingId() === q.quoteId"
                      class="inline-flex items-center gap-1 rounded-full border border-red-300 text-red-600 px-3 py-1 text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Decline quote"
                    >
                      <svg lucideX class="h-3.5 w-3.5"></svg>
                      Decline
                    </button>
                  </div>

                  <span *ngIf="q.status === 'ACCEPTED'" class="text-xs font-semibold text-emerald-600">
                    Accepted
                  </span>
                  <span *ngIf="q.status === 'REJECTED'" class="text-xs font-semibold text-red-500">
                    Declined
                  </span>
                  <span *ngIf="q.status === 'PENDING' || q.status === 'UNDER_REVIEW'" class="text-xs text-muted-ink italic">
                    Under evaluation
                  </span>
                  <span *ngIf="q.status === 'CLOSED' || q.status === 'EXPIRED'" class="text-xs text-muted-ink">
                    Closed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class MyQuotesComponent implements OnInit {
  shop = inject(ShopService);
  quoteSvc = inject(QuoteService);

  processingId = signal<string | null>(null);
  actionMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  get quotes() {
    return this.quoteSvc.quotes;
  }

  ngOnInit(): void {
    this.quoteSvc.loadQuotes().subscribe();
  }

  accept(quote: BackendQuote): void {
    this.processingId.set(quote.quoteId);
    this.actionMessage.set(null);
    this.errorMessage.set(null);

    this.quoteSvc.acceptQuote(quote.quoteId).subscribe({
      next: (res) => {
        this.processingId.set(null);
        if (res) {
          this.actionMessage.set(`Quote ${quote.quoteNumber} has been accepted! Our sales team will proceed with your order.`);
        } else {
          this.errorMessage.set(`Could not accept quote ${quote.quoteNumber}. Please try again.`);
        }
      },
      error: () => {
        this.processingId.set(null);
        this.errorMessage.set(`An error occurred while accepting quote ${quote.quoteNumber}.`);
      }
    });
  }

  reject(quote: BackendQuote): void {
    if (!confirm(`Are you sure you want to decline quote ${quote.quoteNumber}?`)) return;

    this.processingId.set(quote.quoteId);
    this.actionMessage.set(null);
    this.errorMessage.set(null);

    this.quoteSvc.rejectQuote(quote.quoteId).subscribe({
      next: (res) => {
        this.processingId.set(null);
        if (res) {
          this.actionMessage.set(`Quote ${quote.quoteNumber} has been declined.`);
        } else {
          this.errorMessage.set(`Could not decline quote ${quote.quoteNumber}. Please try again.`);
        }
      },
      error: () => {
        this.processingId.set(null);
        this.errorMessage.set(`An error occurred while declining quote ${quote.quoteNumber}.`);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }
}
