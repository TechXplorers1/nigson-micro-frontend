import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CmsService, ShopService, PageHeaderComponent } from 'shared-ui';
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
              <label class="block text-sm font-medium mb-1.5">Business identity card (upload)</label>
              <input type="file" class="w-full text-sm file:rounded-full file:border-0 file:bg-ink file:text-background file:px-4 file:py-2 file:font-medium" />
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
    if (!this.shop.user()) {
      this.shop.openLoginRequired("Sign in to submit your distributor application and track its status.");
      return;
    }
    
    // this.shop.addDistributorApp({
    //   businessName: this.f.company,
    //   contactPerson: this.f.contact,
    //   phone: this.f.phone,
    //   email: this.f.email,
    //   state: this.f.state,
    //   category: this.f.category,
    // });
    
    this.submitted.set(true);
    setTimeout(() => {
      this.router.navigate(['/account/distributor']);
    }, 1200);
  }
}
