import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-surface">
      <!-- Hero Section -->
      <section class="relative overflow-hidden bg-brand py-24 text-white sm:py-32">
        <div class="absolute inset-0 bg-brand-800 mix-blend-multiply"></div>
        <div class="container relative z-10 mx-auto px-4 text-center">
          <h1 class="font-display text-4xl font-bold tracking-tight sm:text-6xl text-white">About Nigson Group</h1>
          <p class="mx-auto mt-6 max-w-2xl text-lg text-brand-100">
            A proudly Nigerian, second-generation enterprise with over three decades of heritage in importation, distribution and real estate.
          </p>
        </div>
      </section>

      <!-- Content -->
      <section class="py-24">
        <div class="container mx-auto px-4 max-w-4xl">
          <div class="prose prose-lg mx-auto text-ink">
            <h2 class="text-3xl font-display font-bold text-ink mb-6">Our Heritage</h2>
            <p class="mb-8">
              Founded in the bustling commercial heart of Nigeria, Nigson Group has grown from a modest trading post into a formidable conglomerate. For over 30 years, we have been the bridge connecting global manufacturers to the vast, vibrant markets of West Africa.
            </p>
            
            <div class="grid gap-12 sm:grid-cols-2 mb-16 mt-12">
              <div class="rounded-2xl bg-white p-8 shadow-sm border border-hairline">
                <h3 class="text-xl font-bold text-brand mb-4">Our Mission</h3>
                <p class="text-sm text-muted-ink">To provide unparalleled access to high-quality goods across Nigeria, empowering local businesses and enriching lives through reliable distribution networks and sustainable real estate development.</p>
              </div>
              <div class="rounded-2xl bg-white p-8 shadow-sm border border-hairline">
                <h3 class="text-xl font-bold text-brand mb-4">Our Vision</h3>
                <p class="text-sm text-muted-ink">To be the undisputed leader in wholesale distribution and infrastructure development in West Africa, recognized for our integrity, scale, and generational impact.</p>
              </div>
            </div>

            <h2 class="text-3xl font-display font-bold text-ink mb-6 mt-16">The Nigson Standard</h2>
            <p class="mb-6">
              As a second-generation business, our reputation is our most valuable asset. We don't just move boxes; we build lasting partnerships. Our robust logistics network ensures that whether you are in Lagos, Kano, or Port Harcourt, Nigson delivers.
            </p>
            <ul class="list-disc pl-6 space-y-3 mb-12">
              <li><strong>Integrity:</strong> We do what we say we will do.</li>
              <li><strong>Scale:</strong> Unmatched capacity for bulk orders.</li>
              <li><strong>Heritage:</strong> Deeply rooted in the Nigerian business ecosystem.</li>
              <li><strong>Agility:</strong> Adapting to market dynamics while maintaining stability.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  `
})
export class AboutComponent {}
