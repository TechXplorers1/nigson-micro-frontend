import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminHeadingComponent } from 'shared-ui';
import { LucidePlus, LucidePencil, LucideTrash2, LucideGlobe, LucideFileText } from '@lucide/angular';

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, LucidePlus, LucidePencil, LucideTrash2, LucideGlobe, LucideFileText],
  template: `
    <lib-admin-heading title="Blog Posts" subtitle="Write and manage articles, announcements, and tutorials.">
      <button class="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-600">
        <svg lucidePlus class="h-4 w-4"></svg> New Post
      </button>
    </lib-admin-heading>
    
    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden">
      <div class="flex items-center gap-4 border-b border-hairline p-4 bg-surface/50">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search posts..." class="flex-1 rounded-xl border border-hairline bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Title</th>
              <th class="px-6 py-4">Author</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr *ngFor="let p of filteredPosts()" class="transition-colors hover:bg-surface-alt/30">
              <td class="px-6 py-4">
                <p class="font-bold">{{ p.title }}</p>
                <p class="text-xs text-muted-ink">{{ p.slug }}</p>
              </td>
              <td class="px-6 py-4 text-muted-ink">{{ p.author }}</td>
              <td class="px-6 py-4 cursor-pointer" (click)="toggleStatus(p)" title="Toggle Status">
                <div class="flex items-center gap-2">
                  <svg *ngIf="p.status === 'Published'" lucideGlobe class="h-4 w-4 text-emerald-600"></svg>
                  <svg *ngIf="p.status === 'Draft'" lucideFileText class="h-4 w-4 text-amber-600"></svg>
                  <span class="font-semibold" [ngClass]="p.status === 'Published' ? 'text-emerald-600' : 'text-amber-600'">{{ p.status }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink">{{ p.date | date:'mediumDate' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand" title="Edit">
                    <svg lucidePencil class="h-4 w-4"></svg>
                  </button>
                  <button (click)="delete(p.id)" class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-rose-100 hover:text-rose-600" title="Delete">
                    <svg lucideTrash2 class="h-4 w-4"></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredPosts().length === 0">
              <td colspan="5" class="p-8 text-center text-muted-ink">No blog posts found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminBlogComponent {
  searchQuery = signal('');
  
  posts = signal<any[]>([]);

  constructor() {
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem('nigson.admin.v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.posts)) {
          this.posts.set(parsed.posts);
          return;
        }
      }
    } catch {}
    
    // Seed dummy if empty
    this.posts.set([
      { id: '1', title: 'Welcome to Nigson Products', slug: 'welcome', author: 'Admin User', status: 'Published', date: new Date().toISOString(), excerpt: 'Welcome to our new store.' },
      { id: '2', title: 'Top 10 Benefits of Buying Bulk', slug: 'bulk-benefits', author: 'Content Team', status: 'Draft', date: new Date().toISOString(), excerpt: 'Save money by buying bulk.' }
    ]);
    this.save();
  }

  save() {
    try {
      const raw = localStorage.getItem('nigson.admin.v2') || '{}';
      const parsed = JSON.parse(raw);
      parsed.posts = this.posts();
      localStorage.setItem('nigson.admin.v2', JSON.stringify(parsed));
    } catch {}
  }

  filteredPosts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.posts().filter(p => p.title.toLowerCase().includes(q) || (p.slug || '').toLowerCase().includes(q));
  });

  delete(id: string) {
    if (confirm("Delete this post?")) {
      this.posts.update(ps => ps.filter(p => p.id !== id));
      this.save();
    }
  }

  toggleStatus(p: any) {
    const next = p.status === 'Published' ? 'Draft' : 'Published';
    this.posts.update(ps => ps.map(x => x.id === p.id ? { ...x, status: next } : x));
    this.save();
  }
}

