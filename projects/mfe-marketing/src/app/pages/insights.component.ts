import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideArrowRight } from '@lucide/angular';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideArrowRight],
  template: `
    <div class="bg-surface py-24">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="text-center mb-16">
          <h1 class="font-display text-4xl font-bold text-ink sm:text-5xl">Market Insights</h1>
          <p class="mt-4 text-lg text-muted-ink">Deep dives into industry trends, supply chain analytics, and market forecasts.</p>
        </div>

        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article *ngFor="let post of posts()" class="flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-sm transition-all hover:shadow-md hover:border-brand/30">
            <div class="flex flex-1 flex-col justify-between p-6">
              <div>
                <div class="mb-3 flex items-center gap-2 text-xs text-muted-ink">
                  <span class="rounded-full bg-brand/10 text-brand px-2 py-1">{{ post.category }}</span>
                  <span>{{ post.date }}</span>
                </div>
                <h2 class="font-display text-xl font-bold text-ink mb-2">
                  <a [routerLink]="['/insights', post.slug]" class="hover:text-brand hover:underline">{{ post.title }}</a>
                </h2>
                <p class="text-sm text-muted-ink line-clamp-3">{{ post.excerpt }}</p>
              </div>
              <div class="mt-6 flex items-center justify-between">
                <span class="text-xs font-bold text-ink">{{ post.author }}</span>
                <a [routerLink]="['/insights', post.slug]" class="flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-600">
                  Read Report <svg lucideArrowRight class="h-4 w-4"></svg>
                </a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  `
})
export class InsightsComponent {
  posts = signal([
    {
      slug: 'q3-2023-supply-chain-report',
      title: 'Q3 2023 Supply Chain Report',
      excerpt: 'An analysis of port congestion, FOREX impact on FMCG pricing, and strategic sourcing in West Africa.',
      author: 'Research Team',
      category: 'Report',
      date: 'Oct 10, 2023'
    },
    {
      slug: 'future-of-retail-nigeria',
      title: 'The Future of Retail in Nigeria',
      excerpt: 'How modern trade and B2B e-commerce are reshaping the traditional open market distribution model.',
      author: 'Strategy Dept',
      category: 'Analysis',
      date: 'Sep 22, 2023'
    }
  ]);
}
