import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface py-24 min-h-[60vh]">
      <div class="container mx-auto px-4 max-w-4xl">
        <div class="rounded-2xl border border-hairline bg-white p-8 shadow-sm sm:p-12 prose prose-lg mx-auto text-ink">
          <h1 class="text-3xl font-display font-bold text-ink mb-8 capitalize">{{ pageTitle() }}</h1>
          
          <ng-container *ngIf="pageId() === 'terms'">
            <p>Welcome to Nigson Group. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions of use.</p>
            <h3>1. Wholesale Orders</h3>
            <p>All wholesale orders are subject to a minimum order quantity (MOQ) as specified on individual product listings. Nigson Group reserves the right to reject orders that do not meet the MOQ requirements.</p>
            <h3>2. Pricing</h3>
            <p>Prices are subject to change without notice due to market fluctuations. Quotes provided are valid for 7 days unless otherwise stated.</p>
          </ng-container>

          <ng-container *ngIf="pageId() === 'privacy'">
            <p>Your privacy is important to us. It is Nigson Group's policy to respect your privacy regarding any information we may collect from you across our website.</p>
            <h3>Information we collect</h3>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent.</p>
          </ng-container>

          <ng-container *ngIf="pageId() === 'faq'">
            <h3>What is your delivery timeframe?</h3>
            <p>Standard delivery within Lagos takes 2-3 business days. Interstate deliveries take 4-7 business days depending on the region.</p>
            <h3>Do you offer credit facilities?</h3>
            <p>Yes, approved distributors may qualify for 14-day or 30-day credit terms following a successful application and background check.</p>
          </ng-container>

          <ng-container *ngIf="pageId() !== 'terms' && pageId() !== 'privacy' && pageId() !== 'faq'">
            <p>Page content for "{{ pageId() }}" is currently being updated. Please check back later.</p>
          </ng-container>
        </div>
      </div>
    </div>
  `
})
export class SupportComponent {
  private route = inject(ActivatedRoute);
  
  pageId = toSignal(
    this.route.paramMap.pipe(map(params => params.get('page') || 'support')),
    { initialValue: 'support' }
  );

  pageTitle = computed(() => {
    return this.pageId().replace(/-/g, ' ');
  });
}
