import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SessionService } from 'shared-ui';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CmsService, ShopService, MarketingService, PageHeaderComponent } from 'shared-ui';
import { LucideCheckCircle2 } from '@lucide/angular';

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LucideCheckCircle2],
  template: `
    <div class="bg-surface min-h-screen">
      <ng-container *ngIf="hero().visible">
        <lib-page-header [eyebrow]="hero().t('eyebrow')" [title]="hero().t('heading')" [subtitle]="hero().t('body')"></lib-page-header>
      </ng-container>

      <section class="container-page py-16 grid gap-12 lg:grid-cols-3">
        <div *ngIf="benefits().visible" class="space-y-6 lg:col-span-1">
          <h2 class="text-2xl font-semibold">{{ benefits().t('heading') }}</h2>
          <ul class="space-y-3 text-muted-foreground">
            <li *ngFor="let c of benefitsCards()" class="flex gap-3">
              <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
              <span>{{ c.title }}</span>
            </li>
          </ul>
        </div>

        <form (submit)="onSubmit($event)" class="rounded-2xl border border-border bg-background p-8 shadow-elegant space-y-5" [ngClass]="benefits().visible ? 'lg:col-span-2' : 'lg:col-span-3'">
          <ng-container *ngIf="submitted(); else formFields">
            <div class="text-center py-10">
              <svg lucideCheckCircle2 class="mx-auto h-14 w-14 text-brand"></svg>
              <h3 class="mt-4 text-2xl font-semibold">Application received</h3>
              <p class="mt-2 text-muted-foreground">{{ form().t('successText') }}</p>
            </div>
          </ng-container>

          <ng-template #formFields>
            <div>
              <h2 class="text-2xl font-semibold">{{ form().t('heading') }}</h2>
              <p class="mt-2 text-sm text-muted-foreground">{{ form().t('body') }}</p>
            </div>
            
            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium mb-1.5">Company name <span class="text-brand">*</span></label>
                <input type="text" required [(ngModel)]="f.company" name="company" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Contact person <span class="text-brand">*</span></label>
                <input type="text" required [(ngModel)]="f.contact" name="contact" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Phone number <span class="text-brand">*</span></label>
                <input type="tel" required [(ngModel)]="f.phone" name="phone" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Email <span class="text-brand">*</span></label>
                <input type="email" required [(ngModel)]="f.email" name="email" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">State <span class="text-brand">*</span></label>
                <input type="text" required [(ngModel)]="f.state" name="state" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Years of operation</label>
                <input type="number" [(ngModel)]="f.years" name="years" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Business address <span class="text-brand">*</span></label>
              <input type="text" required [(ngModel)]="f.address" name="address" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Product interest</label>
              <select [(ngModel)]="f.category" name="category" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                <option>Phone accessories</option>
                <option>Power solutions</option>
                <option>FMCG products</option>
                <option>All categories</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Business registration document</label>
              <ng-container *ngIf="sampleDocument() as sample; else proofUnavailable">
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="useSampleDocument" name="useSampleDocument" /> Use the sample registration document for local testing</label>
                <a [href]="sample.url" target="_blank" rel="noopener" class="text-sm underline">View sample document</a>
                <p class="mt-1 text-xs text-muted-ink">Synthetic test document. This is not a real business registration.</p>
              </ng-container>
              <ng-template #proofUnavailable><p class="text-sm text-muted-ink">A verified business registration document is required. Document upload is not configured in this environment.</p></ng-template>
              <label class="mt-3 block text-sm font-medium">Registration reference (optional)</label>
              <input type="text" [(ngModel)]="f.registrationReference" name="registrationReference" maxlength="100" class="w-full rounded-lg border border-border px-4 py-2.5" />
            </div>

            <button type="submit" class="w-full rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold hover:bg-brand-deep transition-colors">
              {{ form().t('btnLabel') }}
            </button>
          </ng-template>
        </form>
      </section>
    </div>
  `
})
export class DistributorComponent {
  private http = inject(HttpClient);
  private session = inject(SessionService);
  private localDocuments = signal<Record<string, { id: string; url: string }>>({});
  sampleDocument = computed(() => this.localDocuments()[this.session.userId() ?? '']);
  useSampleDocument = false;
  constructor() {
    if (['localhost','127.0.0.1'].includes(window.location.hostname)) {
      this.http.get<{ localOnly: boolean; phase: number; documents: Record<string,{ id: string; url: string }> }>('/local-distributor-fixtures.json').subscribe({
        next: data => { if (data.localOnly && data.phase === 3) this.localDocuments.set(data.documents); },
        error: () => {}
      });
    }
  }
  marketingSvc = inject(MarketingService);
  submitting = this.marketingSvc.submittingDistributor;
  submitError = signal<string | null>(null);
  cms = inject(CmsService);
  shop = inject(ShopService);
  router = inject(Router);
  
  page = this.cms.getPageSections('distributor');

  hero = computed(() => this.page.get('hero'));
  benefits = computed(() => this.page.get('benefits'));
  form = computed(() => this.page.get('form'));

  benefitsCards = computed(() => this.benefits().cards((c) => ({ title: c['title'] })));

  submitted = signal(false);
  
  f = {
    registrationReference: '',
    company: '',
    contact: '',
    phone: '',
    email: '',
    state: '',
    years: '',
    address: '',
    category: 'Phone accessories'
  };

  onSubmit(event: Event) {
    event.preventDefault();
    this.submitError.set(null);

    if (!this.shop.user()) {
      this.shop.openLoginRequired("Please sign in to submit a verified wholesale distributor application.");
      return;
    }

    const document = this.sampleDocument();
    if (!this.useSampleDocument || !document) {
      this.submitError.set('A verified registration document is required. Select the local sample document to test this form.');
      return;
    }
    const businessReference = this.f.registrationReference.trim() || undefined;

    this.marketingSvc.submitDistributorApplication({
      organizationName: this.f.company.trim(),
      countryCode: 'NG',
      documentIds: [document.id],
      businessReference: businessReference
    }).subscribe({
      next: (res) => {
        if (res) {
          this.submitted.set(true);
        } else {
          this.submitError.set('Failed to submit application. Please check all fields and ensure your business is eligible.');
        }
      },
      error: () => {
        this.submitError.set('An unexpected error occurred while submitting your application.');
      }
    });
  }
}
