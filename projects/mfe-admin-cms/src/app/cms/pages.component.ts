import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHeadingComponent } from 'shared-ui';
import { LucidePlus, LucidePencil, LucideEye } from '@lucide/angular';

@Component({
  selector: 'app-admin-pages',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, LucidePlus, LucidePencil, LucideEye],
  template: `
    <lib-admin-heading title="Static Pages" subtitle="Manage your website's static content like About Us and Policies.">
      <button class="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600">
        <svg lucidePlus class="h-4 w-4"></svg> New Page
      </button>
    </lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 border-b border-hairline p-4 bg-surface/50">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search pages..." class="flex-1 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Title</th>
              <th class="px-6 py-4">Path</th>
              <th class="px-6 py-4">Last Updated</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let p of filteredPages()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4 font-bold">{{ p.title }}</td>
              <td class="px-6 py-4 text-muted-ink">{{ p.path }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ p.lastUpdated | date:'medium' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="View live">
                    <svg lucideEye class="h-4 w-4"></svg>
                  </button>
                  <button class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="Edit">
                    <svg lucidePencil class="h-4 w-4"></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredPages().length === 0">
              <td colspan="4" class="p-8 text-center text-muted-ink">No pages found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminPagesComponent {
  searchQuery = signal('');
  
  pages = signal([
    { id: '1', title: 'About Us', path: '/about', lastUpdated: '2023-10-15T10:00:00Z' },
    { id: '2', title: 'Terms of Service', path: '/terms', lastUpdated: '2023-09-01T14:30:00Z' },
    { id: '3', title: 'Privacy Policy', path: '/privacy', lastUpdated: '2023-09-01T14:30:00Z' }
  ]);

  filteredPages = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.pages().filter(p => p.title.toLowerCase().includes(q) || p.path.toLowerCase().includes(q));
  });
}
