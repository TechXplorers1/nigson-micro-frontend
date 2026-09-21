import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService, PageHeaderComponent } from 'shared-ui';
import { LucideBriefcase, LucideGraduationCap, LucideSparkles, LucideUsers } from '@lucide/angular';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule, 
    PageHeaderComponent,
    LucideBriefcase,
    LucideGraduationCap,
    LucideSparkles,
    LucideUsers
  ],
  template: `
    <div class="bg-surface">
      <ng-container *ngIf="hero().visible">
        <lib-page-header [eyebrow]="hero().t('eyebrow')" [title]="hero().t('heading')" [subtitle]="hero().t('body')"></lib-page-header>
      </ng-container>

      <section *ngIf="tracks().visible" class="container-page py-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div *ngFor="let t of tracksCards(); let i = index" class="rounded-2xl border border-border p-6">
          <ng-container [ngSwitch]="i % 4">
            <svg lucideBriefcase *ngSwitchCase="0" class="h-7 w-7 text-brand"></svg>
            <svg lucideGraduationCap *ngSwitchCase="1" class="h-7 w-7 text-brand"></svg>
            <svg lucideSparkles *ngSwitchCase="2" class="h-7 w-7 text-brand"></svg>
            <svg lucideUsers *ngSwitchCase="3" class="h-7 w-7 text-brand"></svg>
          </ng-container>
          <h3 class="mt-4 text-lg font-semibold">{{ t.title }}</h3>
          <p class="mt-2 text-sm text-muted-foreground">{{ t.body }}</p>
        </div>
      </section>

      <section *ngIf="openings().visible" class="border-t border-border bg-surface-alt">
        <div class="container-page py-16">
          <h2 class="text-3xl font-semibold mb-8">{{ openings().t('heading') }}</h2>
          <div class="rounded-2xl border border-border bg-background divide-y divide-border overflow-hidden">
            <div *ngFor="let o of openingsCards()" class="flex flex-col md:flex-row md:items-center gap-3 md:gap-8 p-6 hover:bg-surface-alt/60 transition-colors">
              <div class="flex-1">
                <h3 class="font-semibold text-lg">{{ o.title }}</h3>
                <p class="text-sm text-muted-foreground">{{ o.type }} &bull; {{ o.location }}</p>
              </div>
              <a
                [href]="'mailto:' + openings().t('applyEmail') + '?subject=Application'"
                class="inline-flex items-center justify-center rounded-full bg-brand text-brand-foreground px-5 py-2 text-sm font-semibold hover:bg-brand-deep transition-colors"
              >
                {{ openings().t('btnLabel') }}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  `
})
export class CareersComponent {
  cms = inject(CmsService);
  page = this.cms.getPageSections('careers');

  hero = computed(() => this.page.get('hero'));
  tracks = computed(() => this.page.get('tracks'));
  openings = computed(() => this.page.get('openings'));

  tracksCards = computed(() => this.tracks().cards((c) => ({ title: c['title'], body: c['body'] })));
  openingsCards = computed(() => this.openings().cards((c) => ({ title: c['title'], type: c['type'], location: c['location'] })));
}
