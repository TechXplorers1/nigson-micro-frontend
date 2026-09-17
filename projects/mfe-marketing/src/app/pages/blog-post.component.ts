import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideArrowLeft],
  template: `
    <div class="bg-surface py-12 min-h-[60vh]">
      <div class="container mx-auto px-4 max-w-3xl">
        <a routerLink="/blog" class="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-600">
          <svg lucideArrowLeft class="h-4 w-4"></svg> Back to Blog
        </a>
        
        <article class="rounded-2xl border border-hairline bg-white p-8 shadow-sm sm:p-12 prose prose-lg mx-auto text-ink">
          <div class="mb-8 border-b border-hairline pb-8 text-center">
            <span class="rounded-full bg-surface-alt px-3 py-1 text-xs font-bold text-muted-ink">Company</span>
            <h1 class="mt-4 font-display text-4xl font-bold text-ink capitalize">{{ pageTitle() }}</h1>
            <div class="mt-4 flex items-center justify-center gap-4 text-sm text-muted-ink">
              <span>By Admin User</span>
              <span>•</span>
              <span>Nov 1, 2023</span>
            </div>
          </div>
          
          <p class="lead">
            Welcome to the official blog of Nigson Group. This is a placeholder for the article content representing "{{ slug() }}".
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <h3>Section Heading</h3>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </article>
      </div>
    </div>
  `
})
export class BlogPostComponent {
  private route = inject(ActivatedRoute);
  
  slug = toSignal(
    this.route.paramMap.pipe(map(params => params.get('slug') || 'post')),
    { initialValue: 'post' }
  );

  pageTitle = computed(() => {
    return this.slug().replace(/-/g, ' ');
  });
}
