import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CmsService, PAGES, PageDef } from 'shared-ui';
import { LucideSearch, LucideFileText, LucideExternalLink } from '@lucide/angular';

@Component({
  selector: 'app-admin-pages',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideSearch, LucideFileText, LucideExternalLink],
  template: `
    <div class="px-8 py-8">
      <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-3xl font-black tracking-tight text-ink">Pages</h1>
          <p class="mt-1 text-sm text-muted-ink">Full website CMS &mdash; edit every section of each page, then publish</p>
        </div>
        
        <div class="relative w-full sm:w-[320px]">
          <svg lucideSearch class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"></svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search pages..." 
            class="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink shadow-sm outline-none transition-all focus:border-gray-300 focus:ring-4 focus:ring-gray-100"
          >
        </div>
      </div>
      
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let p of filteredPages()" class="flex flex-col rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-brand">
                <svg lucideFileText class="h-6 w-6"></svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-ink leading-tight">{{ p.name }}</h3>
                <span class="text-sm text-muted-ink">{{ p.path }}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Published
            </div>
          </div>
          
          <div class="mt-6 flex-1 space-y-2">
            <p class="text-sm text-ink font-medium">{{ p.sections.length }} sections</p>
            <p class="text-[13px] text-muted-ink">Updated &mdash;</p>
          </div>
          
          <div class="mt-6 flex items-center gap-3">
            <a 
              [routerLink]="getEditorLink(p.id)" 
              class="flex h-9 items-center justify-center rounded-full bg-brand px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand-600"
            >
              Edit Page
            </a>
            
            <a 
              [href]="p.path" 
              target="_blank"
              class="flex h-9 items-center justify-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 text-[13px] font-bold text-ink transition-colors hover:bg-gray-50"
            >
              Preview <svg lucideExternalLink class="h-3.5 w-3.5"></svg>
            </a>
          </div>
        </div>
      </div>

      <div *ngIf="filteredPages().length === 0" class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-20 text-center">
        <svg lucideFileText class="mb-4 h-10 w-10 text-gray-300"></svg>
        <h3 class="text-lg font-bold text-ink">No pages found</h3>
        <p class="mt-1 text-sm text-muted-ink">We couldn't find any pages matching "{{ searchQuery() }}".</p>
      </div>
    </div>
  `
})
export class AdminPagesComponent {
  cms = inject(CmsService);
  
  searchQuery = signal('');
  
  pages = computed(() => PAGES);

  filteredPages = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.pages();
    return this.pages().filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.path.toLowerCase().includes(q)
    );
  });

  getEditorLink(id: string): string {
    return id === 'home' ? '/admin/pages/home' : '/admin/pages/' + id;
  }
}
