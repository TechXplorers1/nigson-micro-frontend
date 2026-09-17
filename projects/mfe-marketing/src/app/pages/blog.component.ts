import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideArrowRight } from '@lucide/angular';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideArrowRight],
  template: `
    <div class="bg-surface py-24">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="text-center mb-16">
          <h1 class="font-display text-4xl font-bold text-ink sm:text-5xl">Nigson Blog</h1>
          <p class="mt-4 text-lg text-muted-ink">News, company updates, and product announcements.</p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article *ngFor="let post of posts()" class="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm transition-all hover:shadow-md hover:border-brand/30">
            <div class="h-48 w-full bg-surface-alt/50 object-cover">
              <!-- Placeholder for image -->
              <div class="w-full h-full bg-brand/5 flex items-center justify-center text-brand/20">
                <svg lucideArrowRight class="h-8 w-8 opacity-0"></svg>
              </div>
            </div>
            <div class="flex flex-1 flex-col justify-between p-6">
              <div>
                <div class="mb-3 flex items-center gap-2 text-xs text-muted-ink">
                  <span class="rounded-full bg-surface-alt px-2 py-1">{{ post.category }}</span>
                  <span>{{ post.date }}</span>
                </div>
                <h2 class="font-display text-xl font-bold text-ink mb-2">
                  <a [routerLink]="['/blog', post.slug]" class="hover:text-brand hover:underline">{{ post.title }}</a>
                </h2>
                <p class="text-sm text-muted-ink line-clamp-3">{{ post.excerpt }}</p>
              </div>
              <div class="mt-6 flex items-center justify-between">
                <span class="text-xs font-bold text-ink">{{ post.author }}</span>
                <a [routerLink]="['/blog', post.slug]" class="flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-600">
                  Read More <svg lucideArrowRight class="h-4 w-4"></svg>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  `
})
export class BlogComponent {
  posts = signal([
    {
      slug: 'welcome-to-nigson',
      title: 'Welcome to Nigson Products',
      excerpt: 'Discover the heritage and future of West Africa\'s premier wholesale distribution network.',
      author: 'Admin User',
      category: 'Company',
      date: 'Nov 1, 2023'
    },
    {
      slug: 'bulk-buying-benefits',
      title: 'Top 10 Benefits of Buying Bulk',
      excerpt: 'How purchasing in volume can drastically reduce your operational costs and increase margins.',
      author: 'Content Team',
      category: 'Tips',
      date: 'Nov 15, 2023'
    }
  ]);
}
