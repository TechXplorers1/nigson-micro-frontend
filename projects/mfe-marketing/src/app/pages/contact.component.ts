import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent, InputComponent } from 'shared-ui';
import { LucideMapPin, LucidePhone, LucideMail } from '@lucide/angular';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ButtonComponent, InputComponent, LucideMapPin, LucidePhone, LucideMail],
  template: `
    <div class="bg-surface py-24">
      <div class="container mx-auto px-4 max-w-6xl">
        <div class="text-center mb-16">
          <h1 class="font-display text-4xl font-bold text-ink sm:text-5xl">Contact Us</h1>
          <p class="mt-4 text-lg text-muted-ink">We're here to help and answer any question you might have.</p>
        </div>

        <div class="grid gap-12 lg:grid-cols-2">
          <!-- Contact Info -->
          <div>
            <h2 class="text-2xl font-display font-bold text-ink mb-8">Get in Touch</h2>
            <div class="space-y-8">
              <div class="flex items-start gap-4">
                <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <svg lucideMapPin class="h-6 w-6"></svg>
                </div>
                <div>
                  <h3 class="font-bold text-ink">Head Office</h3>
                  <p class="mt-1 text-muted-ink">123 Industrial Layout,<br>Lagos, Nigeria</p>
                </div>
              </div>
              <div class="flex items-start gap-4">
                <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <svg lucidePhone class="h-6 w-6"></svg>
                </div>
                <div>
                  <h3 class="font-bold text-ink">Phone</h3>
                  <p class="mt-1 text-muted-ink">+234 800 123 4567<br>Mon-Fri, 8am to 5pm</p>
                </div>
              </div>
              <div class="flex items-start gap-4">
                <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                  <svg lucideMail class="h-6 w-6"></svg>
                </div>
                <div>
                  <h3 class="font-bold text-ink">Email</h3>
                  <p class="mt-1 text-muted-ink">hello&#64;nigsongroup.com<br>sales&#64;nigsongroup.com</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="rounded-2xl border border-hairline bg-white p-8 shadow-sm">
            <h2 class="text-2xl font-display font-bold text-ink mb-6">Send a Message</h2>
            <form class="space-y-6" (submit)="onSubmit($event)">
              <div class="grid gap-6 sm:grid-cols-2">
                <div>
                  <label class="mb-2 block text-sm font-bold text-ink">First Name</label>
                  <input ui-input placeholder="John">
                </div>
                <div>
                  <label class="mb-2 block text-sm font-bold text-ink">Last Name</label>
                  <input ui-input placeholder="Doe">
                </div>
              </div>
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Email</label>
                <input ui-input type="email" placeholder="john@example.com">
              </div>
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Subject</label>
                <input ui-input placeholder="How can we help?">
              </div>
              <div>
                <label class="mb-2 block text-sm font-bold text-ink">Message</label>
                <textarea rows="4" class="w-full rounded-xl border border-hairline bg-surface/50 px-4 py-3 text-sm focus:border-brand focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand/10 transition-all" placeholder="Your message here..."></textarea>
              </div>
              <button ui-button type="submit" variant="default" class="w-full">Send Message</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {
  onSubmit(e: Event) {
    e.preventDefault();
    alert('Message sent successfully! We will get back to you soon.');
  }
}
