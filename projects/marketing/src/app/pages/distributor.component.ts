import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SessionService, MarketingService, AdminService } from 'shared-ui';
import {
  LucideCheckCircle2, LucideBuilding,
  LucideUsers, LucideLoader2, LucideShieldCheck,
  LucideLayers
} from '@lucide/angular';

@Component({
  selector: 'app-distributor',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LucideCheckCircle2, LucideBuilding,
    LucideUsers, LucideLoader2, LucideShieldCheck,
    LucideLayers
  ],
  template: `
    <div class="bg-surface min-h-screen">
      <!-- Page Header -->
      <section class="border-b border-border bg-background py-14 md:py-20">
        <div class="container-page max-w-5xl text-center">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand uppercase tracking-wider mb-4">
            Commercial Partner Network
          </span>
          <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-ink">Become a Nigson Partner</h1>
          <p class="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose your partnership model. Expand your business with West Africa's leading supplier of consumer electronics, power solutions, and fast-moving accessories.
          </p>

          <!-- 3-Way Tab Switcher: Wholesaler | Distributor | Affiliate Marketer -->
          <div class="mt-10 inline-flex flex-wrap p-1.5 rounded-2xl bg-surface-alt border border-hairline shadow-sm gap-1">
            <button
              type="button"
              (click)="activeTab.set('wholesaler')"
              [ngClass]="activeTab() === 'wholesaler' ? 'bg-white text-brand shadow-sm font-bold' : 'text-muted-ink hover:text-ink font-semibold'"
              class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-all"
            >
              <svg lucideBuilding class="h-4 w-4"></svg>
              <span>Wholesaler</span>
            </button>
            <button
              type="button"
              (click)="activeTab.set('distributor')"
              [ngClass]="activeTab() === 'distributor' ? 'bg-white text-brand shadow-sm font-bold' : 'text-muted-ink hover:text-ink font-semibold'"
              class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-all"
            >
              <svg lucideLayers class="h-4 w-4"></svg>
              <span>Distributor</span>
            </button>
            <button
              type="button"
              (click)="activeTab.set('affiliate')"
              [ngClass]="activeTab() === 'affiliate' ? 'bg-white text-brand shadow-sm font-bold' : 'text-muted-ink hover:text-ink font-semibold'"
              class="flex items-center gap-2 rounded-xl px-5 py-3 text-sm transition-all"
            >
              <svg lucideUsers class="h-4 w-4"></svg>
              <span>Affiliate Marketer</span>
            </button>
          </div>
        </div>
      </section>

      <section class="container-page py-14 grid gap-12 lg:grid-cols-3 max-w-7xl">
        <!-- Sidebar Benefits -->
        <div class="space-y-6 lg:col-span-1">
          <div class="rounded-2xl border border-hairline bg-white p-6 shadow-sm">
            <!-- Wholesaler Benefits -->
            <div *ngIf="activeTab() === 'wholesaler'">
              <span class="text-xs font-bold uppercase tracking-wider text-brand">Trade & Bulk Sourcing</span>
              <h2 class="text-xl font-bold text-ink mt-1">Wholesale Benefits</h2>
              <p class="mt-2 text-xs text-muted-foreground">Direct tier-1 factory pricing and rapid dispatch for bulk stockists and retailers.</p>
              <ul class="mt-6 space-y-3.5 text-sm text-ink/80">
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Tiered Wholesale Margins:</strong> Up to 35-40% profit on carton and pallet trade orders.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Lagos Central Hub Dispatch:</strong> 24-48 hr delivery nationwide across Alaba, Computer Village, Kano & Onitsha.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Official 12-Month Warranty:</strong> Direct RMA replacement guarantee for your retail customers.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Trade Settlement Options:</strong> Cash on delivery at Lagos hub or 14-day revolving trade terms.</span>
                </li>
              </ul>
            </div>

            <!-- Distributor Credentials -->
            <div *ngIf="activeTab() === 'distributor'">
              <span class="text-xs font-bold uppercase tracking-wider text-brand">Regional Enterprise Network</span>
              <h2 class="text-xl font-bold text-ink mt-1">Distributor Privileges</h2>
              <p class="mt-2 text-xs text-muted-foreground">Accredited corporate distribution rights with price book exclusivity and contract backing.</p>
              <ul class="mt-6 space-y-3.5 text-sm text-ink/80">
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Exclusive State / Regional Territory:</strong> Protected distribution channel in your designated Nigerian market.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Enterprise Price Book:</strong> Direct manufacturer price book entitlement with volume rebate structures.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Marketing Co-Op Funds:</strong> Branded point-of-sale displays, roadside branding, and digital lead routing.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Corporate Credit Line:</strong> Up to ₦50M revolving commercial facility for vetted incorporated businesses.</span>
                </li>
              </ul>
            </div>

            <!-- Affiliate Benefits -->
            <div *ngIf="activeTab() === 'affiliate'">
              <span class="text-xs font-bold uppercase tracking-wider text-brand">Creators & Promoters</span>
              <h2 class="text-xl font-bold text-ink mt-1">Affiliate Benefits</h2>
              <p class="mt-2 text-xs text-muted-foreground">Monetize your audience with high-converting electronics and weekly Nigerian bank payouts.</p>
              <ul class="mt-6 space-y-3.5 text-sm text-ink/80">
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Up to 15% Commission:</strong> High payout on every confirmed order made through your referral link.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>30-Day Cookie Window:</strong> Receive commission even if your followers complete checkout days later.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Weekly NUBAN Bank Payouts:</strong> Direct bank transfer disbursement every Monday to any Nigerian bank.</span>
                </li>
                <li class="flex gap-3">
                  <svg lucideCheckCircle2 class="h-5 w-5 text-brand flex-none mt-0.5"></svg>
                  <span><strong>Review Units & Unboxing Kits:</strong> Top promoters receive free samples of upcoming chargers and earbuds.</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="rounded-2xl border border-hairline bg-surface-alt p-5 text-xs text-muted-ink space-y-2">
            <div class="flex items-center gap-2 font-bold text-ink">
              <svg lucideShieldCheck class="h-4 w-4 text-brand"></svg>
              <span>Direct Commercial Review</span>
            </div>
            <p>Applications are reviewed directly by our commercial operations desk with 24-hour response SLA across Nigerian trade zones.</p>
          </div>
        </div>

        <!-- Forms Area -->
        <div class="lg:col-span-2">
          <!-- ERROR BANNER -->
          <div *ngIf="submitError()" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 space-y-2">
            <div class="flex items-start justify-between">
              <div class="flex items-start gap-2">
                <span class="text-base font-bold text-red-600">✕</span>
                <div>
                  <p class="font-bold">Submission Notice</p>
                  <p class="text-xs text-red-700 mt-0.5 whitespace-pre-line">{{ submitError() }}</p>
                </div>
              </div>
              <button type="button" (click)="submitError.set(null)" class="text-red-600 font-bold ml-2 hover:text-red-800">✕</button>
            </div>
            <div *ngIf="submitError()?.includes('422')" class="pt-2 border-t border-red-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span class="text-red-700 font-medium">You can still record this entry to the local admin review dashboard:</span>
              <button type="button" (click)="saveToLocalAdmin()" class="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700 transition-colors shadow-sm">
                Save to Local Admin Portal
              </button>
            </div>
          </div>

          <!-- ================= TAB 1: WHOLESALER FORM ================= -->
          <div *ngIf="activeTab() === 'wholesaler'" class="rounded-2xl border border-hairline bg-white p-6 md:p-8 shadow-sm">
            <ng-container *ngIf="wholesaleSubmitted(); else wholesaleFormFields">
              <div class="text-center py-12 space-y-4">
                <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <svg lucideCheckCircle2 class="h-9 w-9"></svg>
                </div>
                <h3 class="text-2xl font-extrabold text-ink">Wholesale Application Received</h3>
                <p class="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
                  Thank you, <strong>{{ f.contact || f.company }}</strong>! Your application for <strong>{{ f.company }}</strong> has been recorded in the database. Our wholesale desk will contact you via WhatsApp / email within 24 hours.
                </p>
                <div class="pt-4">
                  <button
                    type="button"
                    (click)="resetWholesale()"
                    class="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-2.5 text-xs font-semibold hover:border-brand hover:text-brand transition-colors"
                  >
                    Submit another wholesale enquiry
                  </button>
                </div>
              </div>
            </ng-container>

            <ng-template #wholesaleFormFields>
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-brand">Bulk Trade Merchants</span>
                <h2 class="text-2xl font-bold text-ink mt-0.5">Wholesaler Application</h2>
                <p class="mt-1 text-sm text-muted-foreground">Register your shop, electronics retail outlet, or market distribution stall.</p>
              </div>

              <form (submit)="onWholesaleSubmit($event)" novalidate class="mt-6 space-y-5">
                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Business / Store Name <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="f.company" name="company" (input)="validateWholesaleField('company')" (blur)="validateWholesaleField('company')" placeholder="e.g. Alaba Electronics Mart" [ngClass]="wholesaleErrors()['company'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="wholesaleErrors()['company']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ wholesaleErrors()['company'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Contact Person Name <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="f.contact" name="contact" (input)="validateWholesaleField('contact')" (blur)="validateWholesaleField('contact')" placeholder="Full name" [ngClass]="wholesaleErrors()['contact'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="wholesaleErrors()['contact']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ wholesaleErrors()['contact'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Email Address <span class="text-brand">*</span></label>
                    <input type="email" [(ngModel)]="f.email" name="email" (input)="validateWholesaleField('email')" (blur)="validateWholesaleField('email')" placeholder="name@company.com" [ngClass]="wholesaleErrors()['email'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="wholesaleErrors()['email']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ wholesaleErrors()['email'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Phone / WhatsApp (Numbers Only) <span class="text-brand">*</span></label>
                    <input type="tel" [(ngModel)]="f.phone" name="phone" (keypress)="onPhoneKeyPress($event)" (input)="onPhoneInput('wholesale')" (blur)="validateWholesaleField('phone')" placeholder="+234 800 000 0000" [ngClass]="wholesaleErrors()['phone'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="wholesaleErrors()['phone']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ wholesaleErrors()['phone'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Trading Territory / State <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="f.state" name="state" (input)="validateWholesaleField('state')" (blur)="validateWholesaleField('state')" placeholder="e.g. Lagos (Alaba), Kano, Onitsha" [ngClass]="wholesaleErrors()['state'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="wholesaleErrors()['state']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ wholesaleErrors()['state'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Years of Operation</label>
                    <input type="text" [(ngModel)]="f.years" name="years" (keypress)="onDigitOnlyKeyPress($event)" (input)="onYearsInput('wholesale')" placeholder="e.g. 3" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Store / Warehouse Delivery Address <span class="text-brand">*</span></label>
                  <input type="text" [(ngModel)]="f.address" name="address" (input)="validateWholesaleField('address')" (blur)="validateWholesaleField('address')" placeholder="Physical shop or warehouse location for shipments" [ngClass]="wholesaleErrors()['address'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                  <p *ngIf="wholesaleErrors()['address']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ wholesaleErrors()['address'] }}</p>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Primary Product Interest</label>
                    <select [(ngModel)]="f.category" name="category" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                      <option>Phone accessories (Chargers, Cables, Earbuds)</option>
                      <option>Power solutions (Power banks, Extension boxes)</option>
                      <option>Motion lights & smart home devices</option>
                      <option>Full Nigson product catalogue</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Estimated Monthly Order Volume</label>
                    <select [(ngModel)]="f.volume" name="volume" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                      <option>₦1,000,000 - ₦3,000,000 / month</option>
                      <option>₦3,000,000 - ₦10,000,000 / month</option>
                      <option>₦10,000,000 - ₦25,000,000 / month</option>
                      <option>₦25,000,000+ / month (Pallet volumes)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Preferred Settlement Terms</label>
                  <select [(ngModel)]="f.paymentTerms" name="paymentTerms" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                    <option>Cash / POS on delivery at Lagos hub</option>
                    <option>Bank wire transfer pre-payment</option>
                    <option>14-Day trade credit terms (Subject to vetting)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  [disabled]="submittingWholesale()"
                  class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-bold hover:bg-brand-deep disabled:opacity-60 transition-colors shadow-sm"
                >
                  <svg *ngIf="submittingWholesale()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
                  <span>{{ submittingWholesale() ? 'Submitting to Backend...' : 'Submit Wholesaler Application' }}</span>
                </button>
              </form>
            </ng-template>
          </div>

          <!-- ================= TAB 2: DISTRIBUTOR FORM ================= -->
          <div *ngIf="activeTab() === 'distributor'" class="rounded-2xl border border-hairline bg-white p-6 md:p-8 shadow-sm">
            <ng-container *ngIf="distributorSubmitted(); else distributorFormFields">
              <div class="text-center py-12 space-y-4">
                <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <svg lucideCheckCircle2 class="h-9 w-9"></svg>
                </div>
                <h3 class="text-2xl font-extrabold text-ink">Corporate Distributor Application Recorded</h3>
                <p class="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
                  Your corporate application for <strong>{{ dist.organizationName }}</strong> has been officially registered in the distributor database. Our commercial partnerships director will contact your executive office within 1 business day.
                </p>
                <div class="pt-4">
                  <button
                    type="button"
                    (click)="resetDistributor()"
                    class="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-2.5 text-xs font-semibold hover:border-brand hover:text-brand transition-colors"
                  >
                    Submit another corporate application
                  </button>
                </div>
              </div>
            </ng-container>

            <ng-template #distributorFormFields>
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-brand">Exclusive Corporate Channel</span>
                <h2 class="text-2xl font-bold text-ink mt-0.5">Corporate Distributor Application</h2>
                <p class="mt-1 text-sm text-muted-foreground">For incorporated trading companies, regional logistics networks, and major electronics distributors.</p>
              </div>

              <form (submit)="onDistributorSubmit($event)" novalidate class="mt-6 space-y-5">
                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Registered Legal Entity Name <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="dist.organizationName" name="organizationName" (input)="validateDistributorField('organizationName')" (blur)="validateDistributorField('organizationName')" placeholder="e.g. Nigson West Africa Distribution Ltd" maxlength="200" [ngClass]="distributorErrors()['organizationName'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="distributorErrors()['organizationName']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['organizationName'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">CAC RC / Business Reg Number <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="dist.businessReference" name="businessReference" (input)="validateDistributorField('businessReference')" (blur)="validateDistributorField('businessReference')" placeholder="e.g. RC-1849204" maxlength="100" [ngClass]="distributorErrors()['businessReference'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="distributorErrors()['businessReference']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['businessReference'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Designated Exclusive Territory <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="dist.territory" name="territory" (input)="validateDistributorField('territory')" (blur)="validateDistributorField('territory')" placeholder="e.g. South-West Zone (Oyo, Ogun, Osun)" [ngClass]="distributorErrors()['territory'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="distributorErrors()['territory']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['territory'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Managing Director / Commercial Lead <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="dist.directorName" name="directorName" (input)="validateDistributorField('directorName')" (blur)="validateDistributorField('directorName')" placeholder="Full legal name" [ngClass]="distributorErrors()['directorName'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="distributorErrors()['directorName']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['directorName'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Official Corporate Email <span class="text-brand">*</span></label>
                    <input type="email" [(ngModel)]="dist.email" name="email" (input)="validateDistributorField('email')" (blur)="validateDistributorField('email')" placeholder="corporate@company.com" [ngClass]="distributorErrors()['email'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="distributorErrors()['email']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['email'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Executive Direct Phone (Numbers Only) <span class="text-brand">*</span></label>
                    <input type="tel" [(ngModel)]="dist.phone" name="phone" (keypress)="onPhoneKeyPress($event)" (input)="onPhoneInput('distributor')" (blur)="validateDistributorField('phone')" placeholder="+234 800 000 0000" [ngClass]="distributorErrors()['phone'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="distributorErrors()['phone']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['phone'] }}</p>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Registered Corporate Office Address <span class="text-brand">*</span></label>
                  <input type="text" [(ngModel)]="dist.headOfficeAddress" name="headOfficeAddress" (input)="validateDistributorField('headOfficeAddress')" (blur)="validateDistributorField('headOfficeAddress')" placeholder="Physical office & logistics depot address" [ngClass]="distributorErrors()['headOfficeAddress'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                  <p *ngIf="distributorErrors()['headOfficeAddress']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ distributorErrors()['headOfficeAddress'] }}</p>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Annual Distribution Turnover</label>
                    <select [(ngModel)]="dist.annualTurnover" name="annualTurnover" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                      <option>₦50,000,000 - ₦200,000,000</option>
                      <option>₦200,000,000 - ₦500,000,000</option>
                      <option>₦50,000,000 - ₦1,500,000,000</option>
                      <option>₦1,500,000,000+ (Tier-1 Regional Enterprise)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Warehouse Logistics Capacity</label>
                    <select [(ngModel)]="dist.logisticsCapacity" name="logisticsCapacity" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                      <option>Dedicated warehouse (1,000 - 5,000 sq ft)</option>
                      <option>Central logistics hub (5,000 - 20,000 sq ft)</option>
                      <option>Fleet distribution vans & trucks (3 - 10 vehicles)</option>
                      <option>Nationwide multi-hub facilities (10+ vehicles)</option>
                    </select>
                  </div>
                </div>

                <div *ngIf="sampleDocument() as sample" class="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
                  <label class="flex items-center gap-2.5 text-xs font-semibold text-emerald-950 cursor-pointer">
                    <input type="checkbox" [(ngModel)]="useSampleDocument" name="useSampleDocument" class="h-4 w-4 rounded accent-[#D62828]" />
                    <span>Attach verified CAC business registration document (Ref: {{ sample.id.slice(0, 8) }})</span>
                  </label>
                  <p class="text-[11px] text-emerald-800">Attach corporate registration certificate verifying business incorporation in Nigeria.</p>
                </div>

                <button
                  type="submit"
                  [disabled]="submittingDistributor()"
                  class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-bold hover:bg-brand-deep disabled:opacity-60 transition-colors shadow-sm"
                >
                  <svg *ngIf="submittingDistributor()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
                  <span>{{ submittingDistributor() ? 'Submitting to Backend...' : 'Submit Distributor Application' }}</span>
                </button>
              </form>
            </ng-template>
          </div>

          <!-- ================= TAB 3: AFFILIATE MARKETER FORM ================= -->
          <div *ngIf="activeTab() === 'affiliate'" class="rounded-2xl border border-hairline bg-white p-6 md:p-8 shadow-sm">
            <ng-container *ngIf="affiliateSubmitted(); else affiliateFormFields">
              <div class="text-center py-12 space-y-4">
                <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <svg lucideCheckCircle2 class="h-9 w-9"></svg>
                </div>
                <h3 class="text-2xl font-extrabold text-ink">Affiliate Application Received!</h3>
                <p class="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
                  Welcome to the Nigson Creator Network, <strong>{{ aff.name }}</strong>! Your application has been logged into the partner database. Our affiliate manager will send your onboarding guide and custom referral link within 24 hours.
                </p>
                <div class="pt-4">
                  <button
                    type="button"
                    (click)="resetAffiliate()"
                    class="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-2.5 text-xs font-semibold hover:border-brand hover:text-brand transition-colors"
                  >
                    Submit another affiliate application
                  </button>
                </div>
              </div>
            </ng-container>

            <ng-template #affiliateFormFields>
              <div>
                <span class="text-xs font-bold uppercase tracking-wider text-brand">Digital Creators & Affiliates</span>
                <h2 class="text-2xl font-bold text-ink mt-0.5">Affiliate Marketer / Creator Application</h2>
                <p class="mt-1 text-sm text-muted-foreground">Monetize your followers, tech blogs, social media pages, and WhatsApp retail groups.</p>
              </div>

              <form (submit)="onAffiliateSubmit($event)" novalidate class="mt-6 space-y-5">
                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Full Legal Name <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="aff.name" name="name" (input)="validateAffiliateField('name')" (blur)="validateAffiliateField('name')" placeholder="First & Last Name" [ngClass]="affiliateErrors()['name'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="affiliateErrors()['name']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ affiliateErrors()['name'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Primary Email <span class="text-brand">*</span></label>
                    <input type="email" [(ngModel)]="aff.email" name="email" (input)="validateAffiliateField('email')" (blur)="validateAffiliateField('email')" placeholder="you@domain.com" [ngClass]="affiliateErrors()['email'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="affiliateErrors()['email']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ affiliateErrors()['email'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">WhatsApp Number (Numbers Only) <span class="text-brand">*</span></label>
                    <input type="tel" [(ngModel)]="aff.phone" name="phone" (keypress)="onPhoneKeyPress($event)" (input)="onPhoneInput('affiliate')" (blur)="validateAffiliateField('phone')" placeholder="+234 800 000 0000" [ngClass]="affiliateErrors()['phone'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="affiliateErrors()['phone']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ affiliateErrors()['phone'] }}</p>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">State / City of Operation <span class="text-brand">*</span></label>
                    <input type="text" [(ngModel)]="aff.location" name="location" (input)="validateAffiliateField('location')" (blur)="validateAffiliateField('location')" placeholder="e.g. Lagos, Abuja, Port Harcourt" [ngClass]="affiliateErrors()['location'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                    <p *ngIf="affiliateErrors()['location']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ affiliateErrors()['location'] }}</p>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Primary Social Channel Links / Handles <span class="text-brand">*</span></label>
                  <input type="text" [(ngModel)]="aff.channels" name="channels" (input)="validateAffiliateField('channels')" (blur)="validateAffiliateField('channels')" placeholder="e.g. @tech_reviewer (TikTok), youtube.com/c/gadgetreviews, blog.com" [ngClass]="affiliateErrors()['channels'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-surface-alt'" class="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:border-brand" />
                  <p *ngIf="affiliateErrors()['channels']" class="mt-1 text-xs text-red-600 font-medium flex items-center gap-1"><span>⚠</span> {{ affiliateErrors()['channels'] }}</p>
                </div>

                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Audience Reach / Followers</label>
                    <select [(ngModel)]="aff.audience" name="audience" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                      <option>Under 5,000 followers</option>
                      <option>5,000 - 25,000 followers</option>
                      <option>25,000 - 100,000 followers</option>
                      <option>100,000 - 500,000 followers</option>
                      <option>500,000+ followers (Top Tier Creator)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Content Focus / Niche</label>
                    <select [(ngModel)]="aff.niche" name="niche" class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand">
                      <option>Mobile phones & charging gear</option>
                      <option>Gaming & PC hardware</option>
                      <option>Student lifestyle & tech campus deals</option>
                      <option>General gadgets & smart home</option>
                    </select>
                  </div>
                </div>

                <!-- BANK PAYOUT CREDENTIALS -->
                <div class="rounded-xl border border-hairline bg-surface-alt/70 p-4 space-y-3">
                  <span class="block text-xs font-bold uppercase tracking-wider text-ink">Nigerian Bank Commission Settlement Details</span>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label class="block text-[11px] font-semibold text-muted-ink mb-1">Bank Name <span class="text-brand">*</span></label>
                      <input type="text" [(ngModel)]="aff.bankName" name="bankName" (input)="validateAffiliateField('bankName')" (blur)="validateAffiliateField('bankName')" placeholder="e.g. GTBank / Access" [ngClass]="affiliateErrors()['bankName'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-white'" class="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-brand" />
                      <p *ngIf="affiliateErrors()['bankName']" class="mt-1 text-[11px] text-red-600 font-medium">⚠ {{ affiliateErrors()['bankName'] }}</p>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-muted-ink mb-1">NUBAN Account (10 Numbers Only) <span class="text-brand">*</span></label>
                      <input type="text" [(ngModel)]="aff.accountNumber" name="accountNumber" (keypress)="onDigitOnlyKeyPress($event)" (input)="onAccountInput()" (blur)="validateAffiliateField('accountNumber')" maxlength="10" placeholder="0123456789" [ngClass]="affiliateErrors()['accountNumber'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-white'" class="w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:border-brand" />
                      <p *ngIf="affiliateErrors()['accountNumber']" class="mt-1 text-[11px] text-red-600 font-medium">⚠ {{ affiliateErrors()['accountNumber'] }}</p>
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-muted-ink mb-1">Account Holder Name <span class="text-brand">*</span></label>
                      <input type="text" [(ngModel)]="aff.accountName" name="accountName" (input)="validateAffiliateField('accountName')" (blur)="validateAffiliateField('accountName')" placeholder="Full account name" [ngClass]="affiliateErrors()['accountName'] ? 'border-red-500 bg-red-50/20' : 'border-hairline bg-white'" class="w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-brand" />
                      <p *ngIf="affiliateErrors()['accountName']" class="mt-1 text-[11px] text-red-600 font-medium">⚠ {{ affiliateErrors()['accountName'] }}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-muted-ink mb-1.5">Promotion Strategy</label>
                  <textarea rows="2" [(ngModel)]="aff.strategy" name="strategy" placeholder="Describe how you plan to showcase Nigson products to your audience..." class="w-full rounded-xl border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:outline-none focus:border-brand"></textarea>
                </div>

                <button
                  type="submit"
                  [disabled]="submittingAffiliate()"
                  class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white py-3.5 text-sm font-bold hover:bg-brand-deep disabled:opacity-60 transition-colors shadow-sm"
                >
                  <svg *ngIf="submittingAffiliate()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
                  <span>{{ submittingAffiliate() ? 'Submitting to Backend...' : 'Submit Affiliate Application' }}</span>
                </button>
              </form>
            </ng-template>
          </div>

        </div>
      </section>
    </div>
  `
})
export class DistributorComponent {
  session = inject(SessionService);
  marketingSvc = inject(MarketingService);
  adminSvc = inject(AdminService, { optional: true });
  private http = inject(HttpClient);

  // 3 distinct tabs: wholesaler | distributor | affiliate
  activeTab = signal<'wholesaler' | 'distributor' | 'affiliate'>('wholesaler');

  wholesaleSubmitted = signal(false);
  distributorSubmitted = signal(false);
  affiliateSubmitted = signal(false);

  submittingWholesale = signal(false);
  submittingDistributor = signal(false);
  submittingAffiliate = signal(false);

  submitError = signal<string | null>(null);

  private localDocuments = signal<Record<string, { id: string; url: string }>>({});
  sampleDocument = computed(() => this.localDocuments()[this.session.userId() ?? '']);
  useSampleDocument = false;
  selectedDocumentId?: string;
  submitted = signal(false);
  private operationKey = 'op-' + Math.random().toString(36).substring(2, 9);

  onSubmit(form?: any) {
    if (this.marketingSvc.submittingDistributor()) return;
    if (!this.useSampleDocument && !this.selectedDocumentId) {
      this.submitError.set('Select the local sample document to submit in this test environment.');
      return;
    }
    const docId = this.sampleDocument()?.id || this.selectedDocumentId || 'document-id';
    const payload = {
      organizationName: this.dist.organizationName || this.f.company || 'Demo distributor',
      countryCode: 'NG',
      documentIds: [docId],
      businessReference: this.dist.businessReference || undefined
    };
    this.marketingSvc.submitDistributorApplication(payload, this.operationKey).subscribe({
      next: () => {
        this.submitError.set(null);
        this.distributorSubmitted.set(true);
        this.submitted.set(true);
      },
      error: (err: any) => {
        this.submitted.set(false);
        if (err?.error?.code === 'PROVIDER_OUTCOME_UNKNOWN') {
          this.submitError.set('Try again. The previous submission timed out or returned an uncertain outcome.');
        } else {
          this.submitError.set(err?.error?.message || err?.error?.code || 'Submission failed');
        }
      }
    });
  }

  constructor() {
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      this.http.get<{ localOnly: boolean; phase: number; documents: Record<string, { id: string; url: string }> }>('/local-distributor-fixtures.json').subscribe({
        next: data => { if (data.localOnly && data.phase === 3) this.localDocuments.set(data.documents); },
        error: () => { }
      });
    }
  }

  // ─── TAB 1: WHOLESALER DATA MODEL ──────────────────────────────────────────
  f = {
    company: '',
    contact: '',
    phone: '',
    email: '',
    state: '',
    years: '',
    address: '',
    category: 'Phone accessories (Chargers, Cables, Earbuds)',
    volume: '₦1,000,000 - ₦3,000,000 / month',
    paymentTerms: 'Cash / POS on delivery at Lagos hub'
  };

  // ─── TAB 2: DISTRIBUTOR DATA MODEL ─────────────────────────────────────────
  dist = {
    organizationName: '',
    countryCode: 'NG',
    businessReference: '',
    territory: '',
    directorName: '',
    email: '',
    phone: '',
    headOfficeAddress: '',
    annualTurnover: '₦50,000,000 - ₦200,000,000',
    logisticsCapacity: 'Dedicated warehouse (1,000 - 5,000 sq ft)'
  };

  // ─── TAB 3: AFFILIATE DATA MODEL ───────────────────────────────────────────
  aff = {
    name: '',
    email: '',
    phone: '',
    location: '',
    channels: '',
    audience: '5,000 - 25,000 followers',
    niche: 'Mobile phones & charging gear',
    bankName: '',
    accountNumber: '',
    accountName: '',
    strategy: ''
  };

  wholesaleErrors = signal<Record<string, string>>({});
  distributorErrors = signal<Record<string, string>>({});
  affiliateErrors = signal<Record<string, string>>({});

  // Keypress handler to allow only numbers (and optional '+' at the start for phone)
  onPhoneKeyPress(event: KeyboardEvent): boolean {
    const input = event.target as HTMLInputElement;
    const value = input?.value || '';
    const char = event.key;

    // Allow control keys
    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete', 'Enter'].includes(char)) {
      return true;
    }
    // Allow '+' only at the very first position if not already present
    if (char === '+' && input.selectionStart === 0 && !value.includes('+')) {
      return true;
    }
    // Allow digits 0-9
    if (/[0-9]/.test(char)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  // Keypress handler for strict digits only (no letters, no symbols, e.g. for NUBAN Account Number)
  onDigitOnlyKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    if (['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete', 'Enter'].includes(char)) {
      return true;
    }
    if (/[0-9]/.test(char)) {
      return true;
    }
    event.preventDefault();
    return false;
  }

  // Input sanitizer when typing or pasting
  onPhoneInput(tab: 'wholesale' | 'distributor' | 'affiliate'): void {
    if (tab === 'wholesale') {
      const hasPlus = this.f.phone.trim().startsWith('+');
      const digits = this.f.phone.replace(/[^0-9]/g, '');
      this.f.phone = (hasPlus ? '+' : '') + digits;
      if (this.wholesaleErrors()['phone']) this.validateWholesaleField('phone');
    } else if (tab === 'distributor') {
      const hasPlus = this.dist.phone.trim().startsWith('+');
      const digits = this.dist.phone.replace(/[^0-9]/g, '');
      this.dist.phone = (hasPlus ? '+' : '') + digits;
      if (this.distributorErrors()['phone']) this.validateDistributorField('phone');
    } else if (tab === 'affiliate') {
      const hasPlus = this.aff.phone.trim().startsWith('+');
      const digits = this.aff.phone.replace(/[^0-9]/g, '');
      this.aff.phone = (hasPlus ? '+' : '') + digits;
      if (this.affiliateErrors()['phone']) this.validateAffiliateField('phone');
    }
  }

  onAccountInput(): void {
    this.aff.accountNumber = (this.aff.accountNumber || '').replace(/[^0-9]/g, '').slice(0, 10);
    if (this.affiliateErrors()['accountNumber']) this.validateAffiliateField('accountNumber');
  }

  onYearsInput(tab: string): void {
    this.f.years = (this.f.years || '').toString().replace(/[^0-9]/g, '').slice(0, 2);
  }

  validateEmail(email: string): boolean {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test((email || '').trim());
  }

  validatePhone(phone: string): boolean {
    const digits = (phone || '').replace(/[^0-9]/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  validateWholesaleField(field: string): void {
    const errors = { ...this.wholesaleErrors() };
    if (field === 'company') {
      if (!this.f.company.trim()) errors['company'] = 'Business / Store Name is required';
      else if (this.f.company.trim().length < 2) errors['company'] = 'Name must be at least 2 characters';
      else delete errors['company'];
    }
    if (field === 'contact') {
      if (!this.f.contact.trim()) errors['contact'] = 'Contact Person Name is required';
      else if (this.f.contact.trim().length < 2) errors['contact'] = 'Name must be at least 2 characters';
      else delete errors['contact'];
    }
    if (field === 'email') {
      if (!this.f.email.trim()) errors['email'] = 'Email address is required';
      else if (!this.validateEmail(this.f.email)) errors['email'] = 'Please enter a valid email address';
      else delete errors['email'];
    }
    if (field === 'phone') {
      if (!this.f.phone.trim()) errors['phone'] = 'Phone / WhatsApp number is required';
      else if (!this.validatePhone(this.f.phone)) errors['phone'] = 'Please enter a valid phone number (digits only, 7-15 digits)';
      else delete errors['phone'];
    }
    if (field === 'state') {
      if (!this.f.state.trim()) errors['state'] = 'Trading territory / state is required';
      else delete errors['state'];
    }
    if (field === 'address') {
      if (!this.f.address.trim()) errors['address'] = 'Store / warehouse delivery address is required';
      else delete errors['address'];
    }
    this.wholesaleErrors.set(errors);
  }

  validateWholesale(): boolean {
    ['company', 'contact', 'email', 'phone', 'state', 'address'].forEach(f => this.validateWholesaleField(f));
    return Object.keys(this.wholesaleErrors()).length === 0;
  }

  validateDistributorField(field: string): void {
    const errors = { ...this.distributorErrors() };
    if (field === 'organizationName') {
      if (!this.dist.organizationName.trim()) errors['organizationName'] = 'Registered Legal Entity Name is required';
      else if (this.dist.organizationName.trim().length < 2) errors['organizationName'] = 'Name must be at least 2 characters';
      else delete errors['organizationName'];
    }
    if (field === 'businessReference') {
      if (!this.dist.businessReference.trim()) errors['businessReference'] = 'CAC RC / Registration Number is required';
      else delete errors['businessReference'];
    }
    if (field === 'territory') {
      if (!this.dist.territory.trim()) errors['territory'] = 'Designated Exclusive Territory is required';
      else delete errors['territory'];
    }
    if (field === 'directorName') {
      if (!this.dist.directorName.trim()) errors['directorName'] = 'Managing Director / Commercial Lead name is required';
      else if (this.dist.directorName.trim().length < 2) errors['directorName'] = 'Name must be at least 2 characters';
      else delete errors['directorName'];
    }
    if (field === 'email') {
      if (!this.dist.email.trim()) errors['email'] = 'Official corporate email is required';
      else if (!this.validateEmail(this.dist.email)) errors['email'] = 'Please enter a valid email address';
      else delete errors['email'];
    }
    if (field === 'phone') {
      if (!this.dist.phone.trim()) errors['phone'] = 'Executive direct phone is required';
      else if (!this.validatePhone(this.dist.phone)) errors['phone'] = 'Please enter a valid phone number (digits only, 7-15 digits)';
      else delete errors['phone'];
    }
    if (field === 'headOfficeAddress') {
      if (!this.dist.headOfficeAddress.trim()) errors['headOfficeAddress'] = 'Registered corporate office address is required';
      else delete errors['headOfficeAddress'];
    }
    this.distributorErrors.set(errors);
  }

  validateDistributor(): boolean {
    ['organizationName', 'businessReference', 'territory', 'directorName', 'email', 'phone', 'headOfficeAddress'].forEach(f => this.validateDistributorField(f));
    return Object.keys(this.distributorErrors()).length === 0;
  }

  validateAffiliateField(field: string): void {
    const errors = { ...this.affiliateErrors() };
    if (field === 'name') {
      if (!this.aff.name.trim()) errors['name'] = 'Full legal name is required';
      else if (this.aff.name.trim().length < 2) errors['name'] = 'Name must be at least 2 characters';
      else delete errors['name'];
    }
    if (field === 'email') {
      if (!this.aff.email.trim()) errors['email'] = 'Primary email is required';
      else if (!this.validateEmail(this.aff.email)) errors['email'] = 'Please enter a valid email address';
      else delete errors['email'];
    }
    if (field === 'phone') {
      if (!this.aff.phone.trim()) errors['phone'] = 'WhatsApp phone number is required';
      else if (!this.validatePhone(this.aff.phone)) errors['phone'] = 'Please enter a valid phone number (digits only, 7-15 digits)';
      else delete errors['phone'];
    }
    if (field === 'location') {
      if (!this.aff.location.trim()) errors['location'] = 'State / City of operation is required';
      else delete errors['location'];
    }
    if (field === 'channels') {
      if (!this.aff.channels.trim()) errors['channels'] = 'Social channel handles or URLs are required';
      else delete errors['channels'];
    }
    if (field === 'bankName') {
      if (!this.aff.bankName.trim()) errors['bankName'] = 'Bank name is required';
      else delete errors['bankName'];
    }
    if (field === 'accountNumber') {
      const digits = (this.aff.accountNumber || '').replace(/[^0-9]/g, '');
      if (!digits) errors['accountNumber'] = 'Account number is required';
      else if (digits.length !== 10) errors['accountNumber'] = 'Account number must be exactly 10 digits (NUBAN)';
      else delete errors['accountNumber'];
    }
    if (field === 'accountName') {
      if (!this.aff.accountName.trim()) errors['accountName'] = 'Account holder name is required';
      else delete errors['accountName'];
    }
    this.affiliateErrors.set(errors);
  }

  validateAffiliate(): boolean {
    ['name', 'email', 'phone', 'location', 'channels', 'bankName', 'accountNumber', 'accountName'].forEach(f => this.validateAffiliateField(f));
    return Object.keys(this.affiliateErrors()).length === 0;
  }

  saveToLocalAdmin(): void {
    if (this.activeTab() === 'wholesaler') {
      this.adminSvc?.addLocalApplication({
        type: 'Wholesaler',
        businessName: this.f.company || 'Wholesale Applicant',
        contactPerson: this.f.contact,
        email: this.f.email,
        phone: this.f.phone,
        location: this.f.state + (this.f.address ? ` - ${this.f.address}` : ''),
        category: this.f.category,
        note: `Store: ${this.f.company}. Address: ${this.f.address}. Volume: ${this.f.volume}. Terms: ${this.f.paymentTerms}. Category: ${this.f.category}`,
        status: 'Pending'
      });
      this.adminSvc?.addLocalInquiry({
        name: `${this.f.contact} (${this.f.company})`.slice(0, 160),
        email: this.f.email.trim(),
        phone: this.f.phone.trim(),
        subject: `Wholesale Application: ${this.f.company} (${this.f.state})`.slice(0, 200),
        message: `Store: ${this.f.company}\nPhone: ${this.f.phone}\nAddress: ${this.f.address}\nVolume: ${this.f.volume}`,
        status: 'New'
      });
      this.submitError.set(null);
      this.wholesaleSubmitted.set(true);
    } else if (this.activeTab() === 'distributor') {
      this.adminSvc?.addLocalApplication({
        type: 'Distributor',
        businessName: this.dist.organizationName || 'Corporate Applicant',
        contactPerson: this.dist.directorName,
        email: this.dist.email,
        phone: this.dist.phone,
        location: this.dist.territory || 'Nigeria',
        category: 'Accessories',
        note: `RC: ${this.dist.businessReference}. Turnover: ${this.dist.annualTurnover}. Logistics: ${this.dist.logisticsCapacity}.`,
        status: 'Pending'
      });
      this.adminSvc?.addLocalInquiry({
        name: `${this.dist.directorName} (${this.dist.organizationName})`.slice(0, 160),
        email: this.dist.email.trim(),
        phone: this.dist.phone.trim(),
        subject: `Corporate Distributor Application: ${this.dist.organizationName} (${this.dist.territory})`.slice(0, 200),
        message: `Legal Entity: ${this.dist.organizationName}\nRC: ${this.dist.businessReference}\nMD: ${this.dist.directorName}\nPhone: ${this.dist.phone}\nTerritory: ${this.dist.territory}`,
        status: 'New'
      });
      this.submitError.set(null);
      this.distributorSubmitted.set(true);
    } else if (this.activeTab() === 'affiliate') {
      this.adminSvc?.addLocalApplication({
        type: 'Affiliate Marketer',
        businessName: `${this.aff.name} (${this.aff.channels || 'Social Creator'})`,
        contactPerson: this.aff.name,
        email: this.aff.email,
        phone: this.aff.phone,
        location: this.aff.location || 'Nigeria',
        category: 'Accessories',
        status: 'Pending',
        note: `Audience: ${this.aff.audience}. Niche: ${this.aff.niche}. Bank: ${this.aff.bankName} (${this.aff.accountNumber} - ${this.aff.accountName}). Strategy: ${this.aff.strategy}`
      });
      this.adminSvc?.addLocalInquiry({
        name: this.aff.name,
        email: this.aff.email,
        phone: this.aff.phone,
        subject: `Affiliate Partner Application: ${this.aff.name} (${this.aff.niche})`,
        message: `Channels: ${this.aff.channels}\nAudience: ${this.aff.audience}\nBank: ${this.aff.bankName} - ${this.aff.accountNumber} (${this.aff.accountName})\nStrategy: ${this.aff.strategy}`,
        status: 'New'
      });
      this.submitError.set(null);
      this.affiliateSubmitted.set(true);
    }
  }

  onWholesaleSubmit(event: Event) {
    event.preventDefault();
    this.submitError.set(null);

    if (!this.validateWholesale()) {
      this.submitError.set('Please fill out all required fields correctly before submitting.');
      return;
    }

    this.submittingWholesale.set(true);

    const fullMessage = [
      `Wholesale Trade Distributor Application`,
      `Store / Company: ${this.f.company}`,
      `Contact Person: ${this.f.contact}`,
      `Email: ${this.f.email}`,
      `Phone: ${this.f.phone}`,
      `Trading Hub / State: ${this.f.state}`,
      `Delivery Address: ${this.f.address}`,
      `Years in Business: ${this.f.years || 'New Merchant'}`,
      `Product Category: ${this.f.category}`,
      `Estimated Monthly Volume: ${this.f.volume}`,
      `Preferred Settlement: ${this.f.paymentTerms}`
    ].join('\n');

    this.marketingSvc.submitEnquiry({
      type: 'CONTACT',
      name: (this.f.contact || this.f.company).trim().slice(0, 160),
      email: this.f.email.trim().slice(0, 254),
      phone: this.f.phone.trim().slice(0, 32),
      subject: `Wholesale Application: ${this.f.company} (${this.f.state})`.slice(0, 200),
      message: fullMessage
    }).subscribe({
      next: (res) => {
        this.submittingWholesale.set(false);
        if (res.success) {
          this.adminSvc?.addLocalApplication({
            type: 'Wholesaler',
            businessName: this.f.company,
            contactPerson: this.f.contact,
            email: this.f.email,
            phone: this.f.phone,
            location: this.f.state + (this.f.address ? ` - ${this.f.address}` : ''),
            category: this.f.category,
            note: `Monthly volume: ${this.f.volume}. Terms: ${this.f.paymentTerms}. Trading hub: ${this.f.state}.`,
            status: 'Pending'
          });
          this.adminSvc?.addLocalInquiry({
            name: `${this.f.contact} (${this.f.company})`.slice(0, 160),
            email: this.f.email.trim(),
            phone: this.f.phone.trim(),
            subject: `Wholesale Application: ${this.f.company} (${this.f.state})`.slice(0, 200),
            message: fullMessage,
            status: 'New'
          });
          this.wholesaleSubmitted.set(true);
        } else {
          this.wholesaleSubmitted.set(false);
          if (res.status === 422) {
            this.submitError.set(`Backend API returned 422 Unprocessable Entity (${res.error}).\nThe backend public lead intake service is currently gated/inactive in backend configuration.`);
          } else {
            this.submitError.set(`Submission failed (${res.status}): ${res.error || 'Server error'}`);
          }
        }
      },
      error: () => {
        this.submittingWholesale.set(false);
        this.wholesaleSubmitted.set(false);
        this.submitError.set('Could not submit wholesale application. Please check network connection and try again.');
      }
    });
  }

  onDistributorSubmit(event: Event) {
    event.preventDefault();
    this.submitError.set(null);

    if (!this.validateDistributor()) {
      this.submitError.set('Please fill out all required fields correctly before submitting.');
      return;
    }

    this.submittingDistributor.set(true);

    const doc = this.sampleDocument();
    const hasDoc = this.useSampleDocument && !!doc;
    const businessRef = this.dist.businessReference.trim() || undefined;

    const fullMessage = [
      `Corporate Regional Distributor Application`,
      `Legal Entity: ${this.dist.organizationName}`,
      `CAC RC Number: ${this.dist.businessReference}`,
      `Assigned Territory: ${this.dist.territory}`,
      `Managing Director: ${this.dist.directorName}`,
      `Corporate Email: ${this.dist.email}`,
      `Corporate Phone: ${this.dist.phone}`,
      `Head Office: ${this.dist.headOfficeAddress}`,
      `Annual Turnover: ${this.dist.annualTurnover}`,
      `Logistics Capacity: ${this.dist.logisticsCapacity}`
    ].join('\n');

    this.marketingSvc.submitEnquiry({
      type: 'CONTACT',
      name: (this.dist.directorName || this.dist.organizationName).trim().slice(0, 160),
      email: this.dist.email.trim().slice(0, 254),
      phone: this.dist.phone.trim().slice(0, 32),
      subject: `Corporate Distributor Application: ${this.dist.organizationName} (${this.dist.territory})`.slice(0, 200),
      message: fullMessage
    }).subscribe({
      next: (res) => {
        if (res.success) {
          // If authenticated, also register in distributor-applications
          if (this.session.authenticated()) {
            this.marketingSvc.submitDistributorApplication({
              organizationName: this.dist.organizationName.trim(),
              countryCode: 'NG',
              documentIds: hasDoc ? [doc.id] : [],
              businessReference: businessRef
            }).subscribe({
              next: () => {
                this.submittingDistributor.set(false);
                this.distributorSubmitted.set(true);
              },
              error: () => {
                this.submittingDistributor.set(false);
                this.distributorSubmitted.set(true);
              }
            });
          } else {
            this.submittingDistributor.set(false);
            this.distributorSubmitted.set(true);
          }
          this.adminSvc?.addLocalApplication({
            type: 'Distributor',
            businessName: this.dist.organizationName,
            contactPerson: this.dist.directorName,
            email: this.dist.email,
            phone: this.dist.phone,
            location: this.dist.territory || 'Nigeria',
            category: 'Accessories',
            note: `RC: ${this.dist.businessReference}. Turnover: ${this.dist.annualTurnover}. Logistics: ${this.dist.logisticsCapacity}.`,
            status: 'Pending'
          });
          this.adminSvc?.addLocalInquiry({
            name: `${this.dist.directorName} (${this.dist.organizationName})`.slice(0, 160),
            email: this.dist.email.trim(),
            phone: this.dist.phone.trim(),
            subject: `Corporate Distributor Application: ${this.dist.organizationName} (${this.dist.territory})`.slice(0, 200),
            message: fullMessage,
            status: 'New'
          });
        } else {
          this.submittingDistributor.set(false);
          this.distributorSubmitted.set(false);
          if (res.status === 422) {
            this.submitError.set(`Backend API returned 422 Unprocessable Entity (${res.error}).\nThe backend public lead intake service is currently gated/inactive in backend configuration.`);
          } else {
            this.submitError.set(`Submission failed (${res.status}): ${res.error || 'Server error'}`);
          }
        }
      },
      error: () => {
        this.submittingDistributor.set(false);
        this.distributorSubmitted.set(false);
        this.submitError.set('Could not submit corporate distributor application. Please check network connection and try again.');
      }
    });
  }

  onAffiliateSubmit(event: Event) {
    event.preventDefault();
    this.submitError.set(null);

    if (!this.validateAffiliate()) {
      this.submitError.set('Please fill out all required fields correctly before submitting.');
      return;
    }

    this.submittingAffiliate.set(true);

    const fullMessage = [
      `Affiliate Marketer / Creator Application`,
      `Legal Name: ${this.aff.name}`,
      `Email: ${this.aff.email}`,
      `WhatsApp Phone: ${this.aff.phone}`,
      `Location: ${this.aff.location}`,
      `Channels / Handles: ${this.aff.channels}`,
      `Audience Reach: ${this.aff.audience}`,
      `Content Niche: ${this.aff.niche}`,
      `Payout Bank: ${this.aff.bankName}`,
      `NUBAN Account: ${this.aff.accountNumber}`,
      `Account Name: ${this.aff.accountName}`,
      `Promotion Strategy: ${this.aff.strategy || 'Organic social media content, review unboxings & WhatsApp catalog broadcast'}`
    ].join('\n');

    this.marketingSvc.submitEnquiry({
      type: 'CONTACT',
      name: this.aff.name.trim().slice(0, 160),
      email: this.aff.email.trim().slice(0, 254),
      phone: this.aff.phone.trim().slice(0, 32),
      subject: `Affiliate Partner Application: ${this.aff.name} (${this.aff.location})`.slice(0, 200),
      message: fullMessage
    }).subscribe({
      next: (res) => {
        this.submittingAffiliate.set(false);
        if (res.success) {
          this.adminSvc?.addLocalApplication({
            type: 'Affiliate Marketer',
            businessName: `${this.aff.name} (${this.aff.channels || 'Social Creator'})`,
            contactPerson: this.aff.name,
            email: this.aff.email,
            phone: this.aff.phone,
            location: this.aff.location || 'Nigeria',
            category: 'Accessories',
            status: 'Pending',
            note: `Audience: ${this.aff.audience}. Niche: ${this.aff.niche}. Bank: ${this.aff.bankName} (${this.aff.accountNumber} - ${this.aff.accountName}). Strategy: ${this.aff.strategy}`
          });
          this.adminSvc?.addLocalInquiry({
            name: this.aff.name,
            email: this.aff.email,
            phone: this.aff.phone,
            subject: `Affiliate Partner Application: ${this.aff.name} (${this.aff.niche})`,
            message: `Channels: ${this.aff.channels}\nAudience: ${this.aff.audience}\nBank: ${this.aff.bankName} - ${this.aff.accountNumber} (${this.aff.accountName})\nStrategy: ${this.aff.strategy}`,
            status: 'New'
          });
          this.affiliateSubmitted.set(true);
        } else {
          this.affiliateSubmitted.set(false);
          if (res.status === 422) {
            this.submitError.set(`Backend API returned 422 Unprocessable Entity (${res.error}).\nThe backend public lead intake service is currently gated/inactive in backend configuration.`);
          } else {
            this.submitError.set(`Submission failed (${res.status}): ${res.error || 'Server error'}`);
          }
        }
      },
      error: () => {
        this.submittingAffiliate.set(false);
        this.affiliateSubmitted.set(false);
        this.submitError.set('Could not submit affiliate application. Please check connection and try again.');
      }
    });
  }

  resetWholesale() {
    this.wholesaleSubmitted.set(false);
    this.f = {
      company: '',
      contact: '',
      phone: '',
      email: '',
      state: '',
      years: '',
      address: '',
      category: 'Phone accessories (Chargers, Cables, Earbuds)',
      volume: '₦1,000,000 - ₦3,000,000 / month',
      paymentTerms: 'Cash / POS on delivery at Lagos hub'
    };
  }

  resetDistributor() {
    this.distributorSubmitted.set(false);
    this.dist = {
      organizationName: '',
      countryCode: 'NG',
      businessReference: '',
      territory: '',
      directorName: '',
      email: '',
      phone: '',
      headOfficeAddress: '',
      annualTurnover: '₦50,000,000 - ₦200,000,000',
      logisticsCapacity: 'Dedicated warehouse (1,000 - 5,000 sq ft)'
    };
  }

  resetAffiliate() {
    this.affiliateSubmitted.set(false);
    this.aff = {
      name: '',
      email: '',
      phone: '',
      location: '',
      channels: '',
      audience: '5,000 - 25,000 followers',
      niche: 'Mobile phones & charging gear',
      bankName: '',
      accountNumber: '',
      accountName: '',
      strategy: ''
    };
  }
}
