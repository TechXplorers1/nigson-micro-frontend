import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from 'shared-ui';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="bg-surface py-24">
      <div class="container mx-auto px-4 max-w-4xl text-center">
        <h1 class="font-display text-4xl font-bold text-ink sm:text-5xl">Join the Nigson Group</h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg text-muted-ink">
          We're always looking for talented individuals who are passionate about building the future of distribution and real estate in West Africa.
        </p>

        <div class="mt-16 text-left">
          <h2 class="text-2xl font-display font-bold text-ink mb-8">Open Positions</h2>
          
          <div class="space-y-4">
            <!-- Job 1 -->
            <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 class="text-lg font-bold text-ink">Senior Logistics Coordinator</h3>
                <div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-ink">
                  <span class="flex items-center gap-1">📍 Lagos, Nigeria</span>
                  <span class="flex items-center gap-1">⏱ Full-time</span>
                  <span class="flex items-center gap-1">💼 Operations</span>
                </div>
              </div>
              <button ui-button variant="outline" class="shrink-0">Apply Now</button>
            </div>

            <!-- Job 2 -->
            <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 class="text-lg font-bold text-ink">B2B Sales Representative</h3>
                <div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-ink">
                  <span class="flex items-center gap-1">📍 Kano, Nigeria</span>
                  <span class="flex items-center gap-1">⏱ Full-time</span>
                  <span class="flex items-center gap-1">💼 Sales</span>
                </div>
              </div>
              <button ui-button variant="outline" class="shrink-0">Apply Now</button>
            </div>
            
            <!-- Job 3 -->
            <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h3 class="text-lg font-bold text-ink">Warehouse Manager</h3>
                <div class="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-ink">
                  <span class="flex items-center gap-1">📍 Port Harcourt, Nigeria</span>
                  <span class="flex items-center gap-1">⏱ Full-time</span>
                  <span class="flex items-center gap-1">💼 Operations</span>
                </div>
              </div>
              <button ui-button variant="outline" class="shrink-0">Apply Now</button>
            </div>
          </div>
          
          <div class="mt-12 rounded-2xl bg-brand/5 p-8 text-center border border-brand/10">
            <h3 class="text-xl font-bold text-ink mb-2">Don't see a fit?</h3>
            <p class="text-muted-ink mb-6">Send us your resume anyway. We're always on the lookout for great talent.</p>
            <button ui-button variant="default">Send Resume</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CareersComponent {}
