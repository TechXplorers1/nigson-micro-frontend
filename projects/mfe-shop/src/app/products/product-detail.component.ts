import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { 
  LucideArrowLeft, LucideChevronLeft, LucideChevronRight, 
  LucideZoomIn, LucideZoomOut, LucideRotateCcw, LucideStar,
  LucideFileText, LucidePenLine
} from '@lucide/angular';
import { CatalogService, ShopService, QtyStepperComponent, ratingFor, relativeDate } from 'shared-ui';
import { WriteReviewComponent } from './write-review.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, LucideArrowLeft, LucideChevronLeft, 
    LucideChevronRight, LucideZoomIn, LucideZoomOut, LucideRotateCcw, 
    LucideStar, LucideFileText, LucidePenLine,
    QtyStepperComponent, WriteReviewComponent
  ],
  template: `
    <div class="min-h-screen bg-background" *ngIf="product()">
      <section class="container-page pt-10">
        <button (click)="goBack()" class="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand transition-colors">
          <svg lucideArrowLeft class="h-4 w-4"></svg> Back
        </button>
      </section>

      <section class="container-page pb-16 pt-6">
        <div class="grid gap-10 md:grid-cols-2">
          
          <!-- Gallery -->
          <div>
            <div class="relative rounded-2xl bg-surface-alt overflow-hidden aspect-square border border-hairline">
              <div class="absolute inset-0 flex items-center justify-center overflow-hidden">
                <img
                  [src]="gallery()[index()]"
                  [alt]="product()?.name"
                  class="max-h-full max-w-full object-contain transition-all duration-300"
                  [ngClass]="fading() ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0'"
                  [style.transform]="'scale(' + zoom() + ')'"
                />
              </div>

              <button
                (click)="go(index() - 1)"
                class="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/95 backdrop-blur border border-hairline hover:bg-brand hover:text-white transition-colors"
              >
                <svg lucideChevronLeft class="h-5 w-5"></svg>
              </button>
              <button
                (click)="go(index() + 1)"
                class="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/95 backdrop-blur border border-hairline hover:bg-brand hover:text-white transition-colors"
              >
                <svg lucideChevronRight class="h-5 w-5"></svg>
              </button>

              <span class="absolute top-3 left-3 rounded-full bg-white/95 backdrop-blur border border-hairline px-3 py-1 text-[11px] font-semibold tabular-nums">
                {{ index() + 1 }} / {{ gallery().length }}
              </span>

              <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur border border-hairline shadow-lg px-2 py-1.5">
                <button (click)="setZoom(zoom() - 0.25)" class="grid h-8 w-8 place-items-center rounded-full hover:bg-brand hover:text-white transition-colors">
                  <svg lucideZoomOut class="h-4 w-4"></svg>
                </button>
                <span class="min-w-[3rem] text-center text-xs font-semibold tabular-nums">{{ math.round(zoom() * 100) }}%</span>
                <button (click)="setZoom(zoom() + 0.25)" class="grid h-8 w-8 place-items-center rounded-full hover:bg-brand hover:text-white transition-colors">
                  <svg lucideZoomIn class="h-4 w-4"></svg>
                </button>
                <span class="h-5 w-px bg-hairline mx-1"></span>
                <button (click)="setZoom(1)" class="grid h-8 w-8 place-items-center rounded-full hover:bg-brand hover:text-white transition-colors">
                  <svg lucideRotateCcw class="h-4 w-4"></svg>
                </button>
              </div>
            </div>

            <!-- Thumbnails -->
            <div class="mt-4 flex gap-3 overflow-x-auto pb-1">
              <button
                *ngFor="let g of gallery(); let i = index"
                (click)="go(i)"
                [ngClass]="i === index() ? 'border-brand' : 'border-hairline hover:border-brand/50'"
                class="shrink-0 h-20 w-20 rounded-xl overflow-hidden border-2 transition-colors"
              >
                <img [src]="g" alt="" class="h-full w-full object-cover" />
              </button>
            </div>
          </div>

          <!-- Info -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">{{ product()?.category }}</p>
            <h1 class="mt-3 text-3xl md:text-4xl font-extrabold leading-tight tracking-[-0.02em]">{{ product()?.name }}</h1>
            <p class="mt-2 text-xs uppercase tracking-widest text-muted-ink">SKU • {{ product()?.sku }}</p>

            <button class="mt-4 inline-flex items-center gap-3 rounded-full border border-hairline px-4 py-2 hover:border-brand transition-colors" (click)="scrollToReviews()">
              <svg lucideStar class="h-4 w-4 fill-brand text-brand"></svg>
              <span class="text-sm font-bold text-brand">{{ liveAverage() }} / 5</span>
              <span class="text-sm text-muted-foreground">{{ totalReviews() }} Reviews</span>
            </button>

            <div class="mt-6">
              <p class="text-[11px] uppercase tracking-widest text-muted-foreground">Starting From</p>
              <p class="mt-1 text-3xl md:text-4xl font-bold text-[#D62828] leading-tight">{{ catalog.formatPrice(product()?.price || 0) }}</p>
              <p class="mt-2 text-sm text-muted-foreground">Wholesale pricing available for distributors.</p>
            </div>

            <p class="mt-6 text-base text-ink/80 leading-relaxed">{{ product()?.desc }}</p>

            <ul class="mt-6 space-y-2 text-sm text-ink/80">
              <li class="flex gap-3"><span class="text-brand">✔</span> Wholesale & retail pricing</li>
              <li class="flex gap-3"><span class="text-brand">✔</span> Nationwide delivery from Lagos hub</li>
              <li class="flex gap-3"><span class="text-brand">✔</span> 12-month standard warranty</li>
              <li class="flex gap-3"><span class="text-brand">✔</span> Bulk discounts for distributors</li>
            </ul>

            <div class="mt-8 flex flex-wrap gap-3">
              <!-- Qty Stepper / Cart Control -->
              <ui-qty-stepper *ngIf="product()" [product]="product()!" [image]="gallery()[0]"></ui-qty-stepper>

              <a [routerLink]="['/shop/quote']" class="inline-flex items-center gap-2 rounded-full border border-ink text-ink px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-white transition-colors">
                <svg lucideFileText class="h-4 w-4"></svg> Request quote
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Reviews -->
      <section #reviewsRef id="reviews" class="border-t border-hairline bg-white py-14">
        <div class="container-page">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <h2 class="text-2xl font-extrabold tracking-[-0.02em]">Reviews</h2>
            <button
              (click)="writeOpen = true"
              class="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-sm font-semibold hover:bg-brand-deep transition-colors"
            >
              <svg lucidePenLine class="h-4 w-4"></svg> Write a Review
            </button>
          </div>

          <div class="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
            <div class="rounded-2xl border border-hairline bg-white p-6 text-center h-fit">
              <p class="text-4xl font-extrabold text-[#D62828]">{{ liveAverage() }}</p>
              <p class="text-xs text-muted-foreground">out of 5</p>
              <div class="mt-2 flex justify-center">
                <ng-container *ngFor="let i of [1,2,3,4,5]">
                  <svg lucideStar class="h-4 w-4 transition-colors" [ngClass]="i <= liveAverage() ? 'fill-brand text-brand' : 'text-hairline'"></svg>
                </ng-container>
              </div>
              <p class="mt-2 text-sm font-semibold">{{ totalReviews() }} Reviews</p>
            </div>

            <div class="space-y-2">
              <ng-container *ngFor="let s of [5, 4, 3, 2, 1]">
                <div class="flex items-center gap-3">
                  <span class="w-10 text-xs font-semibold tabular-nums">{{ s }} ★</span>
                  <div class="h-2 flex-1 rounded-full bg-hairline/60 overflow-hidden">
                    <div class="h-full rounded-full bg-brand transition-all duration-700" [style.width]="$any(rating()?.breakdown)?.[s] + '%'"></div>
                  </div>
                  <span class="w-10 text-right text-xs text-muted-foreground tabular-nums">{{ $any(rating()?.breakdown)?.[s] }}%</span>
                </div>
              </ng-container>
            </div>
          </div>

          <ul class="mt-8 space-y-4">
            <li *ngFor="let r of reviews()" class="rounded-2xl border border-hairline bg-white p-5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-3">
                  <span class="grid h-9 w-9 place-items-center rounded-full bg-brand/10 text-brand text-xs font-extrabold">
                    {{ r.name.slice(0, 1).toUpperCase() }}
                  </span>
                  <div>
                    <p class="text-sm font-bold">{{ r.name }}</p>
                    <div class="flex gap-0.5">
                      <ng-container *ngFor="let i of [1,2,3,4,5]">
                        <svg lucideStar class="h-3 w-3" [ngClass]="i <= r.rating ? 'fill-brand text-brand' : 'text-hairline'"></svg>
                      </ng-container>
                    </div>
                  </div>
                </div>
                <span class="text-xs text-muted-foreground">{{ relativeDate(r.date) }}</span>
              </div>
              <p class="mt-3 text-sm text-ink/80 leading-relaxed">{{ r.text }}</p>
            </li>
          </ul>
        </div>
      </section>

      <app-write-review *ngIf="writeOpen && product()" [sku]="product()!.sku" (close)="writeOpen = false"></app-write-review>
    </div>
    
    <div class="min-h-[50vh] flex items-center justify-center" *ngIf="!product()">
      <p>Product not found.</p>
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  location = inject(Location);
  catalog = inject(CatalogService);
  shop = inject(ShopService);

  math = Math;

  sku = signal<string>('');
  
  product = computed(() => {
    return this.catalog.PRODUCTS.find(p => p.sku === this.sku());
  });

  primaryImg = computed(() => {
    const p = this.product();
    return p ? this.catalog.imageFor(p.category) : '';
  });

  gallery = computed(() => {
    const p = this.product();
    if (!p) return [];
    
    // Simulate gallery generator
    const pool = [
      this.primaryImg(),
      '/assets/cat-earbuds.jpg',
      '/assets/cat-powerbank.jpg',
      '/assets/cat-charger.jpg'
    ];
    return pool;
  });

  rating = computed(() => {
    const p = this.product();
    return p ? ratingFor(p.sku) : null;
  });
  reviews = computed(() => {
    const p = this.product();
    return p ? this.shop.reviewsFor(p.sku) : [];
  });
  
  liveAverage = computed(() => {
    const revs = this.reviews();
    if (revs.length) {
      return +(revs.reduce((n, r) => n + r.rating, 0) / revs.length).toFixed(1);
    }
    return this.rating()?.average ?? 0;
  });
  
  totalReviews = computed(() => {
    const r = this.rating();
    if (!r) return 0;
    return r.count + Math.max(0, this.reviews().length - 4);
  });

  writeOpen = false;
  
  relativeDate = relativeDate;

  qtyInCart = computed(() => {
    const p = this.product();
    if (!p) return 0;
    return this.shop.cart().find(c => c.sku === p.sku)?.qty || 0;
  });

  zoom = signal(1);
  index = signal(0);
  fading = signal(false);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.sku.set(params.get('sku') || '');
      this.index.set(0);
      this.zoom.set(1);
      window.scrollTo({ top: 0 });
    });
  }

  goBack() {
    this.location.back();
  }

  setZoom(val: number) {
    this.zoom.set(Math.max(0.5, Math.min(3, val)));
  }

  go(next: number) {
    this.fading.set(true);
    setTimeout(() => {
      const len = this.gallery().length;
      this.index.set((next + len) % len);
      this.zoom.set(1);
      this.fading.set(false);
    }, 140);
  }

  scrollToReviews() {
    document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  addToCart() {
    const p = this.product();
    if (!p) return;
    this.shop.addToCart({
      sku: p.sku,
      name: p.name,
      category: p.category,
      price: p.price,
      image: this.primaryImg()
    });
  }
}

