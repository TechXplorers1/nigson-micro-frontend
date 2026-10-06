import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService, PageHeaderComponent } from 'shared-ui';
import { LucideBriefcase, LucideGraduationCap, LucideSparkles, LucideUsers } from '@lucide/angular';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule, 
    PageHeaderComponent,
    FormsModule,
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
                
                <!-- Inline Application Form -->
                <div *ngIf="applyingTo() === o.title" class="mt-4 p-4 rounded-xl border border-border bg-surface-alt/50">
                  <ng-container *ngIf="appliedTo() === o.title; else formFields">
                    <p class="text-sm font-semibold text-brand">Application submitted successfully. We will be in touch!</p>
                  </ng-container>
                  <ng-template #formFields>
                    <div class="grid gap-4 sm:grid-cols-2 text-sm">
                      <input type="text" placeholder="Full Name" [(ngModel)]="appForm.name" class="rounded-lg border border-border px-3 py-2 bg-background">
                      <input type="email" placeholder="Email Address" [(ngModel)]="appForm.email" class="rounded-lg border border-border px-3 py-2 bg-background">
                      <input type="tel" placeholder="Phone Number" [(ngModel)]="appForm.phone" class="rounded-lg border border-border px-3 py-2 bg-background">
                      <input type="text" placeholder="Link to Resume/CV (URL)" [(ngModel)]="appForm.cv" class="rounded-lg border border-border px-3 py-2 bg-background">
                      <textarea placeholder="Cover Letter (Optional)" [(ngModel)]="appForm.coverLetter" class="sm:col-span-2 rounded-lg border border-border px-3 py-2 bg-background" rows="3"></textarea>
                    </div>
                    <div class="mt-4 flex gap-2">
                      <button (click)="submitApplication(o.title)" class="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand-deep">Submit</button>
                      <button (click)="applyingTo.set(null)" class="rounded-full bg-surface px-4 py-1.5 text-xs font-semibold text-ink border border-border hover:bg-surface-alt">Cancel</button>
                    </div>
                  </ng-template>
                </div>
              </div>
              <button
                *ngIf="applyingTo() !== o.title && appliedTo() !== o.title"
                (click)="applyingTo.set(o.title)"
                class="inline-flex items-center justify-center rounded-full bg-brand text-brand-foreground px-5 py-2 text-sm font-semibold hover:bg-brand-deep transition-colors"
              >
                {{ openings().t('btnLabel') }}
              </button>
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

  tracksCards = computed(() => this.tracks().cards((c: any) => ({ title: c['title'], body: c['body'] })));
  openingsCards = computed(() => this.openings().cards((c: any) => ({ title: c['title'], type: c['type'], location: c['location'] })));

  applyingTo = signal<string | null>(null);
  appliedTo = signal<string | null>(null);

  appForm = { name: '', email: '', phone: '', cv: '', coverLetter: '' };

  submitApplication(jobTitle: string) {
    if (!this.appForm.name || !this.appForm.email || !this.appForm.cv) return;
    
    // Simulate API persistence
    try {
      const apps = JSON.parse(localStorage.getItem('nigson_job_applications') || '[]');
      apps.push({
        jobTitle, ...this.appForm, date: new Date().toISOString()
      });
      localStorage.setItem('nigson_job_applications', JSON.stringify(apps));
    } catch {}

    this.appliedTo.set(jobTitle);
    this.appForm = { name: '', email: '', phone: '', cv: '', coverLetter: '' };
  }
}
