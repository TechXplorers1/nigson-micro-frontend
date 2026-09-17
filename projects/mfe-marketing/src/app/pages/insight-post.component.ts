import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-insight-post',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideArrowLeft],
  template: `
    <div class="bg-surface py-12 min-h-[60vh]">
      <div class="container mx-auto px-4 max-w-4xl">
        <a routerLink="/insights" class="mb-8 inline-flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-600">
          <svg lucideArrowLeft class="h-4 w-4"></svg> Back to Insights
        </a>
        
        <article class="rounded-2xl border border-hairline bg-white p-8 shadow-sm sm:p-16 prose prose-lg mx-auto text-ink max-w-none">
          <div class="mb-12 border-b border-hairline pb-8 text-center">
            <span class="rounded-full bg-brand/10 text-brand px-3 py-1 text-xs font-bold">Report</span>
            <h1 class="mt-4 font-display text-4xl font-bold text-ink capitalize">{{ pageTitle() }}</h1>
            <div class="mt-4 flex items-center justify-center gap-4 text-sm text-muted-ink">
              <span>By Research Team</span>
              <span>•</span>
              <span>Oct 10, 2023</span>
            </div>
          </div>
          
          <p class="lead text-xl">
            This is a placeholder for the detailed market insight report representing "{{ slug() }}".
          </p>
          <p>
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.
          </p>
          
          <div class="my-8 rounded-xl bg-surface-alt p-6 border-l-4 border-brand">
            <h4 class="font-bold text-ink mt-0">Key Takeaway</h4>
            <p class="mb-0 text-sm">Sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.</p>
          </div>
          
          <h3>Methodology</h3>
          <p>
            Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.
          </p>
        </article>
      </div>
    </div>
  `
})
export class InsightPostComponent {
  private route = inject(ActivatedRoute);
  
  slug = toSignal(
    this.route.paramMap.pipe(map(params => params.get('slug') || 'report')),
    { initialValue: 'report' }
  );

  pageTitle = computed(() => {
    return this.slug().replace(/-/g, ' ');
  });
}
