import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="relative overflow-hidden border-b border-hairline bg-white">
      <div class="container-page relative py-24 md:py-32">
        <p *ngIf="eyebrow" class="mb-5 text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">
          {{ eyebrow }}
        </p>
        
        <h1 class="text-5xl md:text-7xl font-extrabold text-balance max-w-4xl leading-[1.02]">
          {{ title }}
        </h1>
        
        <p *ngIf="subtitle" class="mt-6 max-w-2xl text-lg text-muted-ink">
          {{ subtitle }}
        </p>
      </div>
    </section>
  `
})
export class PageHeaderComponent {
  @Input() eyebrow?: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
