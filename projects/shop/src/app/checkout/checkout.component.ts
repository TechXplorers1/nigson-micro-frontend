import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { 
  LucideArrowLeft, LucideArrowRight, LucideBuilding2, 
  LucideCreditCard, LucideLoader2, LucideLock, LucideWallet, LucideCheck 
} from '@lucide/angular';
import { CartService, CatalogService, ShopService, AccountService, SessionService } from 'shared-ui';
import { firstValueFrom } from 'rxjs';

type Step = 0 | 1 | 2;
type PayId = "credit" | "debit" | "netbanking";

const PAY_LABEL: Record<PayId, string> = {
  credit: "Credit Card",
  debit: "Debit Card",
  netbanking: "Net Banking",
};

const BANKS = ["Access Bank", "First Bank", "Guaranty Trust Bank", "United Bank for Africa", "Zenith Bank"];

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LucideArrowLeft, LucideArrowRight, LucideBuilding2, 
    LucideCreditCard, LucideLoader2, LucideLock, LucideWallet, LucideCheck
  ],
  template: `
    <div class="min-h-[70vh] bg-background">
      <section class="pt-20 pb-16 md:pt-28 md:pb-24">
        <div class="mx-auto max-w-7xl px-6">
          <div class="mb-8">
            <p class="text-[11px] font-semibold uppercase tracking-[0.25em] text-brand">Secure Checkout</p>
            <h1 class="mt-2 text-4xl md:text-5xl font-extrabold tracking-[-0.02em]">Checkout</h1>
          </div>

          <!-- Stepper -->
          <div class="flex items-center gap-2 md:gap-4 overflow-x-auto pb-4">
            <ng-container *ngFor="let s of STEPS; let i = index">
              <div class="flex items-center gap-2 min-w-fit">
                <span class="grid h-6 w-6 place-items-center rounded-full text-xs font-bold transition-colors" [ngClass]="step() >= i ? 'bg-brand text-white' : 'bg-surface-alt text-muted-ink'">
                  <ng-container *ngIf="step() > i"><svg lucideCheck class="h-3.5 w-3.5"></svg></ng-container>
                  <ng-container *ngIf="step() <= i">{{ i + 1 }}</ng-container>
                </span>
                <span class="text-sm font-semibold transition-colors" [ngClass]="step() >= i ? 'text-ink' : 'text-muted-ink'">
                  {{ s }}
                </span>
              </div>
              <div *ngIf="i < 2" class="h-px w-8 md:w-16 bg-hairline"></div>
            </ng-container>
          </div>

          <div class="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
            <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
              
              <div *ngIf="step() === 0" class="space-y-5">
                <h2 class="text-xl font-bold">Customer information</h2>
                <div class="space-y-1">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Full name</label>
                  <input [(ngModel)]="customer.fullName" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                </div>
                <div class="grid gap-5 md:grid-cols-2">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Email</label>
                    <input type="email" [(ngModel)]="customer.email" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Phone</label>
                    <input [(ngModel)]="customer.phone" placeholder="+234 800 000 0000" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                  </div>
                </div>
              </div>

              <div *ngIf="step() === 1" class="space-y-5">
                <h2 class="text-xl font-bold">Shipping address</h2>
                <div class="space-y-1">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Street address</label>
                  <input [(ngModel)]="address.street" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                </div>
                <div class="grid gap-5 md:grid-cols-2">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">City</label>
                    <input [(ngModel)]="address.city" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">State</label>
                    <input [(ngModel)]="address.state" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                  </div>
                </div>
                <div class="grid gap-5 md:grid-cols-2">
                  <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Country</label>
                    <input [(ngModel)]="address.country" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                  </div>
                  <div class="space-y-1">
                    <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Postal code</label>
                    <input [(ngModel)]="address.postal" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2.5 text-sm focus:border-brand focus:outline-none" />
                  </div>
                </div>
              </div>

              <div *ngIf="step() === 2" class="space-y-4">
                <h2 class="text-xl font-bold">Payment method</h2>
                
                <label class="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors" [ngClass]="payment() === 'credit' ? 'border-brand bg-brand/5' : 'border-hairline hover:border-brand/50'">
                  <div class="flex items-center gap-4">
                    <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full" [ngClass]="payment() === 'credit' ? 'bg-brand text-white' : 'bg-surface-alt text-ink'">
                      <svg lucideCreditCard class="h-5 w-5"></svg>
                    </div>
                    <div>
                      <p class="font-semibold text-ink">Credit Card</p>
                      <p class="text-xs text-muted-ink">Visa, Mastercard, Verve credit cards</p>
                    </div>
                  </div>
                  <div class="grid h-5 w-5 place-items-center rounded-full border border-hairline" [ngClass]="payment() === 'credit' ? 'border-brand' : ''">
                    <div *ngIf="payment() === 'credit'" class="h-2.5 w-2.5 rounded-full bg-brand"></div>
                  </div>
                  <input type="radio" name="payment" value="credit" class="hidden" (change)="payment.set('credit')" [checked]="payment() === 'credit'">
                </label>

                <label class="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors" [ngClass]="payment() === 'debit' ? 'border-brand bg-brand/5' : 'border-hairline hover:border-brand/50'">
                  <div class="flex items-center gap-4">
                    <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full" [ngClass]="payment() === 'debit' ? 'bg-brand text-white' : 'bg-surface-alt text-ink'">
                      <svg lucideWallet class="h-5 w-5"></svg>
                    </div>
                    <div>
                      <p class="font-semibold text-ink">Debit Card</p>
                      <p class="text-xs text-muted-ink">Pay directly from your bank account</p>
                    </div>
                  </div>
                  <div class="grid h-5 w-5 place-items-center rounded-full border border-hairline" [ngClass]="payment() === 'debit' ? 'border-brand' : ''">
                    <div *ngIf="payment() === 'debit'" class="h-2.5 w-2.5 rounded-full bg-brand"></div>
                  </div>
                  <input type="radio" name="payment" value="debit" class="hidden" (change)="payment.set('debit')" [checked]="payment() === 'debit'">
                </label>

                <label class="flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors" [ngClass]="payment() === 'netbanking' ? 'border-brand bg-brand/5' : 'border-hairline hover:border-brand/50'">
                  <div class="flex items-center gap-4">
                    <div class="grid h-10 w-10 shrink-0 place-items-center rounded-full" [ngClass]="payment() === 'netbanking' ? 'bg-brand text-white' : 'bg-surface-alt text-ink'">
                      <svg lucideBuilding2 class="h-5 w-5"></svg>
                    </div>
                    <div>
                      <p class="font-semibold text-ink">Net Banking</p>
                      <p class="text-xs text-muted-ink">Log in to your internet banking</p>
                    </div>
                  </div>
                  <div class="grid h-5 w-5 place-items-center rounded-full border border-hairline" [ngClass]="payment() === 'netbanking' ? 'border-brand' : ''">
                    <div *ngIf="payment() === 'netbanking'" class="h-2.5 w-2.5 rounded-full bg-brand"></div>
                  </div>
                  <input type="radio" name="payment" value="netbanking" class="hidden" (change)="payment.set('netbanking')" [checked]="payment() === 'netbanking'">
                </label>

                <div class="mt-3 flex items-center gap-2 text-xs text-muted-ink">
                  <svg lucideLock class="h-3.5 w-3.5 text-emerald-600"></svg>
                  Your payment is processed over a secure encrypted connection.
                </div>
              </div>

              <div *ngIf="errorMsg()" class="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                {{ errorMsg() }}
              </div>

              <div class="mt-8 flex items-center justify-between">
                <button
                  (click)="step() === 0 ? goCart() : back()"
                  class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-brand"
                >
                  <svg lucideArrowLeft class="h-4 w-4"></svg> {{ step() === 0 ? "Back to cart" : "Back" }}
                </button>
                <button
                  *ngIf="step() < 2"
                  (click)="advance()"
                  class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors"
                >
                  Continue <svg lucideArrowRight class="h-4 w-4"></svg>
                </button>
                <button
                  *ngIf="step() === 2"
                  (click)="payOpen.set(true)"
                  class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors"
                >
                  <svg lucideLock class="h-4 w-4"></svg> Continue to {{ payLabel() }}
                </button>
              </div>
            </div>

            <aside class="lg:sticky lg:top-28 h-fit rounded-2xl border border-hairline bg-white p-6">
              <h3 class="text-base font-bold">Order summary</h3>
              <ul class="mt-4 space-y-3 max-h-64 overflow-auto pr-1">
                <li *ngFor="let i of shop.cart()" class="flex items-center gap-3 text-sm">
                  <div class="h-12 w-12 rounded-lg overflow-hidden bg-surface-alt shrink-0">
                    <img *ngIf="i.image" [src]="i.image" alt="" class="h-full w-full object-cover" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="truncate font-semibold">{{ i.name }}</p>
                    <p class="text-xs text-muted-ink">Qty {{ i.qty }}</p>
                  </div>
                  <p class="font-semibold">{{ catalog.formatPrice(i.price * i.qty) }}</p>
                </li>
              </ul>
              
              <dl class="mt-6 space-y-3 text-sm border-t border-hairline pt-6">
                <div class="flex items-center justify-between">
                  <dt class="text-muted-ink">Subtotal</dt>
                  <dd class="font-semibold">{{ catalog.formatPrice(subtotal()) }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-muted-ink">Shipping</dt>
                  <dd class="font-semibold">{{ catalog.formatPrice(shipping()) }}</dd>
                </div>
                <div class="flex items-center justify-between">
                  <dt class="text-muted-ink">VAT (7.5%)</dt>
                  <dd class="font-semibold">{{ catalog.formatPrice(vat()) }}</dd>
                </div>
                <div class="h-px bg-hairline my-2"></div>
                <div class="flex items-center justify-between">
                  <dt class="text-base font-bold">Total</dt>
                  <dd class="text-2xl font-extrabold text-[#D62828]">{{ catalog.formatPrice(total()) }}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      </section>

      <!-- Payment Modal -->
      <div *ngIf="payOpen()" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-ink/40 backdrop-blur-sm" (click)="payOpen.set(false)"></div>
        <div class="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-elegant animate-scale-in">
          <h2 class="text-xl font-bold">Complete Payment</h2>
          <p class="mt-1 text-sm text-muted-ink">Pay <span class="font-bold text-ink">{{ catalog.formatPrice(total()) }}</span> securely via {{ payLabel() }}.</p>
          
          <div class="mt-6" *ngIf="payment() === 'credit' || payment() === 'debit'">
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Cardholder Name</label>
                <input [(ngModel)]="card.name" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Card Number</label>
                <input [(ngModel)]="card.number" placeholder="0000 0000 0000 0000" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none tabular-nums" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Expiry (MM/YY)</label>
                  <input [(ngModel)]="card.expiry" placeholder="MM/YY" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none tabular-nums" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">CVV</label>
                  <input [(ngModel)]="card.cvv" type="password" placeholder="123" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none tabular-nums" />
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6" *ngIf="payment() === 'netbanking'">
            <div class="space-y-4">
              <div class="space-y-1">
                <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Select Bank</label>
                <select [(ngModel)]="netbank.bank" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none appearance-none">
                  <option *ngFor="let b of BANKS" [value]="b">{{ b }}</option>
                </select>
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">Customer ID</label>
                <input [(ngModel)]="netbank.userId" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-semibold uppercase tracking-wider text-muted-ink">PIN / Password</label>
                <input type="password" [(ngModel)]="netbank.pin" class="w-full rounded-md border border-hairline bg-surface-alt px-4 py-2 text-sm focus:border-brand focus:outline-none" />
              </div>
            </div>
          </div>

          <div *ngIf="modalError()" class="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
            {{ modalError() }}
          </div>

          <button
            (click)="payNow()"
            [disabled]="processing()"
            class="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-deep disabled:opacity-70"
          >
            <svg *ngIf="processing()" lucideLoader2 class="h-4 w-4 animate-spin"></svg>
            <svg *ngIf="!processing()" lucideLock class="h-4 w-4"></svg>
            {{ processing() ? 'Processing...' : 'Pay ' + catalog.formatPrice(total()) }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent {
  shop = inject(ShopService);
  cart = inject(CartService);
  catalog = inject(CatalogService);
  account = inject(AccountService);
  session = inject(SessionService);
  http = inject(HttpClient);
  router = inject(Router);

  STEPS = ["Customer", "Address", "Payment"];
  BANKS = BANKS;

  step = signal<Step>(0);
  processing = signal(false);
  payOpen = signal(false);
  payment = signal<PayId>("credit");
  errorMsg = signal<string | null>(null);
  modalError = signal<string | null>(null);

  payLabel = computed(() => PAY_LABEL[this.payment()]);

  customer = {
    fullName: this.shop.user()?.fullName ?? "",
    email: this.shop.user()?.email ?? "",
    phone: "",
  };
  address = { street: "", city: "", state: "Lagos", country: "Nigeria", postal: "" };
  card = { name: "", number: "", expiry: "", cvv: "" };
  netbank = { bank: BANKS[0], userId: "", pin: "" };

  subtotalMinor = computed((): number => {
    const items = this.cart.items();
    return items.reduce((sum, i) => sum + i.unitPriceMinorUnits * i.quantity, 0);
  });
  shippingMinor = computed((): number => this.cart.items().length > 0 ? 350000 : 0);
  vatMinor = computed(() => Math.round(this.subtotalMinor() * 0.075));
  totalMinor = computed(() => this.subtotalMinor() + this.shippingMinor() + this.vatMinor());

  subtotal = computed(() => this.subtotalMinor());
  shipping = computed(() => this.shippingMinor());
  vat = computed(() => this.vatMinor());
  total = computed(() => this.totalMinor());

  next() { this.step.set(Math.min(2, this.step() + 1) as Step); }
  back() { this.step.set(Math.max(0, this.step() - 1) as Step); }
  goCart() { this.router.navigate(["/cart"]); }

  validate(): string | null {
    if (this.step() === 0) {
      if (!this.customer.fullName.trim()) return "Please enter your full name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.customer.email)) return "Please enter a valid email.";
      if (this.customer.phone.replace(/\D/g, "").length < 10) return "Please enter a valid phone number.";
    }
    if (this.step() === 1) {
      if (!this.address.street.trim()) return "Street address is required.";
      if (!this.address.city.trim()) return "City is required.";
    }
    return null;
  }

  advance() {
    this.errorMsg.set(null);
    const err = this.validate();
    if (err) { this.errorMsg.set(err); return; }
    this.next();
  }

  validatePayment(): string | null {
    if (this.payment() === "netbanking") {
      if (!this.netbank.bank) return "Please select your bank.";
      if (!this.netbank.userId.trim()) return "Please enter your customer / user ID.";
      if (this.netbank.pin.trim().length < 4) return "Please enter your password / PIN.";
      return null;
    }
    if (!this.card.name.trim()) return "Please enter the cardholder name.";
    if (this.card.number.replace(/\D/g, "").length < 12) return "Please enter a valid card number.";
    if (!/^\d{2}\s?\/\s?\d{2}$/.test(this.card.expiry.trim())) return "Expiry must be in MM/YY format.";
    if (!/^\d{3,4}$/.test(this.card.cvv.trim())) return "Please enter a valid CVV.";
    return null;
  }

  async payNow() {
    this.modalError.set(null);
    const err = this.validatePayment();
    if (err) { this.modalError.set(err); return; }

    const cartId = this.cart.cartId();
    if (!cartId) {
      this.modalError.set("Your cart is empty or not initialized.");
      return;
    }

    if (!this.session.authenticated()) {
      this.session.signIn('/checkout');
      return;
    }

    this.processing.set(true);

    try {
      // 1. Ensure address is saved and obtain addressId
      let addressId: string | null = null;
      try {
        const addrs = await firstValueFrom(this.http.get<any[]>('/api/v1/me/addresses'));
        if (addrs && addrs.length > 0) {
          addressId = addrs[0].id;
        }
      } catch (e) {
        // Address query error
      }

      if (!addressId) {
        const newAddr = await firstValueFrom(
          this.http.post<any>('/api/v1/me/addresses', {
            label: 'Home',
            recipient: this.customer.fullName || 'Customer',
            phone: this.customer.phone || '+2348000000000',
            line1: this.address.street || '10 Lagos Island',
            line2: null,
            city: this.address.city || 'Lagos',
            region: this.address.state || 'Lagos',
            postalCode: this.address.postal || '100001',
            countryCode: 'NG',
            isDefault: true
          }, {
            headers: new HttpHeaders({
              'Content-Type': 'application/json',
              'Idempotency-Key': crypto.randomUUID()
            })
          })
        );
        addressId = newAddr.id;
      }

      // 2. Request delivery quote
      const delQuote = await firstValueFrom(
        this.http.post<any>(`/api/v1/carts/${cartId}/delivery-quotes`, {
          addressId: addressId
        }, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'If-Match': `"${this.cart.cartVersion()}"`,
            'Idempotency-Key': crypto.randomUUID()
          })
        })
      );
      const carrierQuoteId = delQuote.id;

      // 3. Request checkout quote
      const chkQuote = await firstValueFrom(
        this.http.post<any>('/api/v1/checkout/quotes', {
          cartId: cartId,
          addressId: addressId,
          carrierQuoteId: carrierQuoteId
        }, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID()
          })
        })
      );

      // 4. Initiate checkout attempt
      const attempt = await firstValueFrom(
        this.http.post<any>('/api/v1/checkout/attempts', {
          checkoutQuoteId: chkQuote.id,
          quoteHash: chkQuote.quoteHash,
          paymentMethod: 'HOSTED'
        }, {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Idempotency-Key': crypto.randomUUID()
          })
        })
      );

      this.processing.set(false);
      this.payOpen.set(false);
      sessionStorage.removeItem('nigson_active_cart_id');
      this.cart.clearCart().subscribe();

      if (attempt.payment?.checkoutUrl) {
        window.location.href = attempt.payment.checkoutUrl;
      } else {
        this.router.navigate(['/checkout/success'], { queryParams: { id: attempt.order.id } });
      }
    } catch (error: any) {
      this.processing.set(false);
      console.error('[Checkout] payNow error:', error);
      const msg = error?.error?.detail || error?.error?.title || error?.message || "Order checkout failed. Please try again.";
      this.modalError.set(msg);
    }
  }
}
