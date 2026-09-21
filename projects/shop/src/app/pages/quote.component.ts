import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PageHeaderComponent, ShopService } from 'shared-ui';
import { LucideCheckCircle2 } from '@lucide/angular';

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, LucideCheckCircle2],
  template: `
    <div class="bg-surface min-h-screen">
      <lib-page-header
        eyebrow="Get pricing"
        title="Request a quote."
        subtitle="Tell us what you need and expected quantity. We'll come back with wholesale pricing within 24 hours."
      ></lib-page-header>
      
      <section class="container-page py-16 max-w-3xl">
        <form (submit)="onSubmit($event)" class="rounded-2xl border border-border bg-background p-8 shadow-elegant space-y-5">
          <ng-container *ngIf="submitted(); else formFields">
            <div class="text-center py-10">
              <svg lucideCheckCircle2 class="mx-auto h-14 w-14 text-brand"></svg>
              <h3 class="mt-4 text-2xl font-semibold">Quote request sent</h3>
              <p class="mt-2 text-muted-foreground">Redirecting you to your dashboard…</p>
            </div>
          </ng-container>

          <ng-template #formFields>
            <div class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium mb-1.5">Name <span class="text-brand">*</span></label>
                <input type="text" required [(ngModel)]="f.name" name="name" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Company</label>
                <input type="text" [(ngModel)]="f.company" name="company" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Phone <span class="text-brand">*</span></label>
                <input type="tel" required [(ngModel)]="f.phone" name="phone" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1.5">Email <span class="text-brand">*</span></label>
                <input type="email" required [(ngModel)]="f.email" name="email" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Product(s) interested in <span class="text-brand">*</span></label>
              <input type="text" required [(ngModel)]="f.products" name="products" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1.5">Estimated quantity <span class="text-brand">*</span></label>
              <input type="number" required [(ngModel)]="f.qty" name="qty" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Message</label>
              <textarea rows="5" [(ngModel)]="f.message" name="message" class="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:border-brand"></textarea>
            </div>
            
            <button type="submit" class="w-full rounded-full bg-brand text-brand-foreground py-3 text-sm font-semibold hover:bg-brand-deep transition-colors">
              Send quote request
            </button>
          </ng-template>
        </form>
      </section>
    </div>
  `
})
export class QuoteComponent {
  shop = inject(ShopService);
  router = inject(Router);

  submitted = signal(false);

  f = {
    name: '',
    company: '',
    phone: '',
    email: '',
    products: '',
    qty: '',
    message: ''
  };

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.shop.user()) {
      this.shop.openLoginRequired("Sign in to submit a quote and track its status.");
      return;
    }

    // this.shop.addQuote({ 
    //   productName: this.f.products || "General enquiry", 
    //   quantity: Number(this.f.qty) || 1, 
    //   note: this.f.message 
    // });
    
    this.submitted.set(true);
    setTimeout(() => {
      this.router.navigate(['/account/quotes']);
    }, 1200);
  }
}
