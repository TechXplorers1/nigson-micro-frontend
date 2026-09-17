import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, InputComponent } from 'shared-ui';
import { NigeriaMapComponent } from '../components/nigeria-map.component';

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent, NigeriaMapComponent],
  template: `
    <div class="bg-surface">
      <!-- Hero -->
      <section class="relative overflow-hidden bg-ink py-24 text-white sm:py-32">
        <div class="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8ed3c84a0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center"></div>
        <div class="container relative z-10 mx-auto px-4 text-center">
          <h1 class="font-display text-4xl font-bold tracking-tight sm:text-6xl text-white">Become a Nigson Distributor</h1>
          <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            Partner with West Africa's leading wholesale network. Grow your business with our extensive catalogue, competitive pricing, and reliable logistics.
          </p>
        </div>
      </section>

      <!-- Application Form & Map -->
      <section class="py-24">
        <div class="container mx-auto px-4 max-w-6xl">
          <div class="grid gap-12 lg:grid-cols-2 items-start">
            
            <!-- Map Side -->
            <div>
              <h2 class="text-3xl font-display font-bold text-ink mb-6">Nationwide Coverage</h2>
              <p class="text-lg text-ink/70 mb-10">
                Our logistics network spans across Nigeria, ensuring timely delivery and robust support for all our distribution partners regardless of location.
              </p>
              <app-nigeria-map></app-nigeria-map>
            </div>

            <!-- Form Side -->
            <div class="rounded-2xl border border-hairline bg-white p-8 shadow-sm sm:p-12">
              <h3 class="text-2xl font-display font-bold text-ink mb-6">Distributor Application</h3>
              <form class="space-y-6" (submit)="onSubmit($event)">
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-bold text-ink">Company Name</label>
                  <input ui-input placeholder="Your Business Ltd">
                </div>
                <div>
                  <label class="mb-2 block text-sm font-bold text-ink">RC Number</label>
                  <input ui-input placeholder="RC123456">
                </div>
              </div>
              
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-bold text-ink">Contact Person</label>
                  <input ui-input placeholder="Full Name">
                </div>
                <div>
                  <label class="mb-2 block text-sm font-bold text-ink">Phone Number</label>
                  <input ui-input placeholder="+234">
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Email Address</label>
                <input ui-input type="email" placeholder="contact@business.com">
              </div>

              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Business Address / Store Location</label>
                <textarea rows="3" class="w-full rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all" placeholder="Full address..."></textarea>
              </div>

              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Primary Product Categories of Interest</label>
                <select class="w-full rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all">
                  <option>Food & Beverages</option>
                  <option>Building Materials</option>
                  <option>Household Goods</option>
                  <option>Mixed Catalogue</option>
                </select>
              </div>

              <div class="pt-4">
                <button ui-button type="submit" variant="default" class="w-full">Submit Application</button>
                <p class="mt-4 text-center text-xs text-muted-ink">Our B2B team will review your application and contact you within 48 hours.</p>
              </div>
            </form>
          </div>
        </div>
        </div>
      </section>
    </div>
  `
})
export class DistributorComponent {
  onSubmit(e: Event) {
    e.preventDefault();
    alert('Application submitted! We will contact you shortly.');
  }
}
