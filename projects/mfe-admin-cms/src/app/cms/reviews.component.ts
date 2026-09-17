import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHeadingComponent, BadgeComponent } from 'shared-ui';
import { LucideCheck, LucideMessageCircle, LucideTrash2 } from '@lucide/angular';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, BadgeComponent, LucideCheck, LucideMessageCircle, LucideTrash2],
  template: `
    <lib-admin-heading title="Customer Reviews" subtitle="Moderate and respond to product reviews."></lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 border-b border-hairline p-4 bg-surface/50">
        <select [(ngModel)]="statusFilter" class="rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
          <option value="All">All Reviews</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
        </select>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Customer</th>
              <th class="px-6 py-4">Product</th>
              <th class="px-6 py-4">Rating & Review</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let r of filteredReviews()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4 font-bold">{{ r.author }}</td>
              <td class="px-6 py-4 text-muted-ink">{{ r.product }}</td>
              <td class="px-6 py-4 max-w-sm">
                <div class="flex text-amber-400 mb-1">
                  <span *ngFor="let s of [1,2,3,4,5]">★</span>
                </div>
                <p class="text-xs text-ink line-clamp-2">{{ r.text }}</p>
              </td>
              <td class="px-6 py-4"><lib-badge [tone]="r.status === 'Approved' ? 'success' : 'warning'">{{ r.status }}</lib-badge></td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ r.date | date:'mediumDate' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button *ngIf="r.status === 'Pending'" (click)="approve(r.id)" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-emerald-100 hover:text-emerald-600" title="Approve">
                    <svg lucideCheck class="h-4 w-4"></svg>
                  </button>
                  <button class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="Reply">
                    <svg lucideMessageCircle class="h-4 w-4"></svg>
                  </button>
                  <button (click)="delete(r.id)" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-rose-100 hover:text-rose-600" title="Delete">
                    <svg lucideTrash2 class="h-4 w-4"></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredReviews().length === 0">
              <td colspan="6" class="p-8 text-center text-muted-ink">No reviews found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminReviewsComponent {
  statusFilter = signal('All');
  
  reviews = signal([
    { id: '1', author: 'Sarah Mensah', product: 'Golden Penny Pasta', text: 'Great quality, my customers love it.', rating: 5, status: 'Approved', date: '2023-11-25T10:00:00Z' },
    { id: '2', author: 'Chukwudi Okafor', product: 'Dangote Sugar', text: 'Delivery was a bit delayed but product is fine.', rating: 4, status: 'Pending', date: '2023-11-26T14:30:00Z' }
  ]);

  filteredReviews = computed(() => {
    const s = this.statusFilter();
    if (s === 'All') return this.reviews();
    return this.reviews().filter(r => r.status === s);
  });

  approve(id: string) {
    this.reviews.update(rs => rs.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
  }
  
  delete(id: string) {
    this.reviews.update(rs => rs.filter(r => r.id !== id));
  }
}
