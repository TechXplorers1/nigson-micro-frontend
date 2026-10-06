import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService } from 'shared-ui';
import { LucideClipboardList, LucideArrowRight, LucidePlus } from '@lucide/angular';

// Quote shape stored in ShopService (mocked via localStorage)
export interface QuoteRequest {
  id: string;
  number: string;
  products: string;
  qty: number;
  message: string;
  status: 'Pending' | 'Under Review' | 'Quoted' | 'Closed';
  createdAt: string;
}

@Component({
  selector: 'app-my-quotes',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideClipboardList, LucideArrowRight, LucidePlus],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-brand">Wholesale</p>
            <h2 class="text-2xl font-extrabold">My Quote Requests</h2>
          </div>
          <a
            routerLink="/quote"
            class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-deep transition-colors"
          >
            <svg lucidePlus class="h-4 w-4"></svg> New Quote Request
          </a>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="quotes.length === 0" class="rounded-2xl border border-hairline bg-white p-16 text-center">
        <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-alt">
          <svg lucideClipboardList class="h-8 w-8 text-muted-ink"></svg>
        </div>
        <p class="mt-4 text-lg font-bold text-ink">No quote requests yet</p>
        <p class="mt-2 text-sm text-muted-ink">Submit a wholesale quote request and track its status here.</p>
        <a routerLink="/quote" class="mt-6 inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors">
          Request a Quote <svg lucideArrowRight class="h-4 w-4"></svg>
        </a>
      </div>

      <!-- Quotes list -->
      <div *ngIf="quotes.length > 0" class="rounded-2xl border border-hairline bg-white overflow-hidden">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Quote Number</th>
              <th class="px-6 py-4">Products</th>
              <th class="px-6 py-4">Qty</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let q of quotes" class="hover:bg-surface-alt/30 transition-colors">
              <td class="px-6 py-4 font-bold">{{ q.number }}</td>
              <td class="px-6 py-4 text-muted-ink max-w-xs truncate">{{ q.products }}</td>
              <td class="px-6 py-4">{{ q.qty.toLocaleString() }}</td>
              <td class="px-6 py-4">
                <span class="rounded-full px-3 py-1 text-[11px] font-bold" [ngClass]="statusClass(q.status)">
                  {{ q.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ formatDate(q.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class MyQuotesComponent {
  shop = inject(ShopService);

  // Quote requests are read from localStorage (will come from API in production)
  get quotes(): QuoteRequest[] {
    try {
      const raw = localStorage.getItem('nigson_quotes');
      if (raw) {
        const all: QuoteRequest[] = JSON.parse(raw);
        // Filter to only this user's quotes
        return all.filter(() => !!this.shop.user());
      }
    } catch {}
    return [];
  }

  statusClass(status: string) {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      case 'Quoted': return 'bg-emerald-100 text-emerald-700';
      case 'Closed': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
