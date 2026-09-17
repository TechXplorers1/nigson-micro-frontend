import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, InputComponent } from 'shared-ui';

@Component({
  selector: 'app-quote',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent],
  template: `
    <div class="bg-surface py-24 min-h-[80vh]">
      <div class="container mx-auto px-4 max-w-3xl">
        
        <div class="text-center mb-12">
          <h1 class="font-display text-4xl font-bold text-ink sm:text-5xl">Request a Bulk Quote</h1>
          <p class="mt-4 text-lg text-muted-ink">For orders exceeding our standard bulk tiers, please fill out the form below. Our wholesale team will provide a custom quote within 24 hours.</p>
        </div>

        <div class="rounded-2xl border border-hairline bg-white p-8 shadow-sm sm:p-12">
          <form class="space-y-6" (submit)="onSubmit($event)">
            
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Company Name</label>
                <input ui-input placeholder="Your Business Ltd">
              </div>
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Contact Name</label>
                <input ui-input placeholder="John Doe">
              </div>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Email Address</label>
                <input ui-input type="email" placeholder="john@example.com">
              </div>
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Phone Number</label>
                <input ui-input placeholder="+234">
              </div>
            </div>
            
            <div>
              <label class="mb-2 block text-sm font-bold text-ink">Product(s) of Interest</label>
              <textarea rows="3" class="w-full rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all" placeholder="Please list the products and SKUs you are interested in..."></textarea>
            </div>
            
            <div class="grid gap-6 sm:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Estimated Quantity</label>
                <input ui-input placeholder="e.g., 500 cartons">
              </div>
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Target Delivery Date</label>
                <input ui-input type="date">
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-bold text-ink">Delivery Location</label>
              <input ui-input placeholder="City, State">
            </div>
            
            <div class="pt-4 border-t border-hairline">
              <button ui-button type="submit" variant="default" class="w-full text-lg h-12">Submit Quote Request</button>
              <p class="mt-4 text-center text-xs text-muted-ink">By submitting this form, you agree to our terms of wholesale engagement.</p>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  `
})
export class QuoteComponent {
  onSubmit(e: Event) {
    e.preventDefault();
    alert('Quote request submitted! Our B2B sales team will contact you shortly.');
  }
}
