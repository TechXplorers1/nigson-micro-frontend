import { Component, HostListener, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  LucideArrowRight, 
  LucideTruck, 
  LucideShieldCheck, 
  LucideRotateCcw, 
  LucideHeadphones,
  LucideChevronLeft,
  LucideChevronRight
} from '@lucide/angular';
import { CatalogService, ShopService, CmsService, QtyStepperComponent } from 'shared-ui';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LucideArrowRight, 
    LucideTruck, 
    LucideShieldCheck, 
    LucideRotateCcw, 
    LucideHeadphones,
    LucideChevronLeft,
    LucideChevronRight,
    QtyStepperComponent
  ],
  templateUrl: './home.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  catalog = inject(CatalogService);
  shop = inject(ShopService);
  cms = inject(CmsService);

  /** CMS sections for the home page (reads published content) */
  private sections = this.cms.getPageSections('home');

  // ── section getters ──────────────────────────────────────────────────────
  hero             = computed(() => this.sections.get('hero'));
  newArrivals      = computed(() => this.sections.get('newArrivals'));
  categoryShowcase = computed(() => this.sections.get('categoryShowcase'));
  lifestyle        = computed(() => this.sections.get('lifestylePanels'));
  bestSellers      = computed(() => this.sections.get('bestSellers'));
  wholesale        = computed(() => this.sections.get('wholesale'));
  distCta          = computed(() => this.sections.get('distributorCta'));
  benefits         = computed(() => this.sections.get('serviceBenefits'));
  testimonials     = computed(() => this.sections.get('testimonials'));
  seo              = computed(() => this.sections.get('home_seo'));
  carousel         = computed(() => this.sections.get('featuredCarousel'));

  // ── derived card arrays ──────────────────────────────────────────────────
  showcaseCards = computed(() =>
    this.categoryShowcase().cards((f) => ({
      label: f['label'], title: f['title'], description: f['description'],
      filter: f['filter'], image: f['image'] || '/assets/nigson-hero-products.jpg'
    }))
  );

  lifestyleCards = computed(() =>
    this.lifestyle().cards((f) => ({
      title: f['title'], text: f['text'],
      image: f['image'] || '/assets/nigson-lifestyle-sound.jpg',
      alt: f['alt'] || '',
      btnLabel: f['btnLabel'] || 'SHOP NOW',
      btnLink: f['btnLink'] || '#best-sellers'
    }))
  );

  carouselSlides = computed(() =>
    this.carousel().cards((f) => ({
      kicker: f['kicker'], title: f['title'], desc: f['desc'],
      cta: f['cta'], link: f['link'] || '/products',
      queryParams: f['category'] ? { category: f['category'] } : {},
      tone: f['tone'] || 'dark',
      image: f['image'] || '/assets/nigson-audio.jpg'
    }))
  );

  benefitCards = computed(() =>
    this.benefits().cards((f) => ({ title: f['title'], desc: f['desc'] }))
  );

  testimonialCards = computed(() =>
    this.testimonials().cards((f) => ({ quote: f['quote'], name: f['name'], role: f['role'] }))
  );

  distBenefits = computed(() =>
    this.distCta().cards((f) => ({ title: f['title'] }))
  );

  // ── image assets ─────────────────────────────────────────────────────────
  heroImage      = '/assets/nigson-hero-products.jpg';
  audioImage     = '/assets/nigson-audio.jpg';
  powerImage     = '/assets/nigson-power.jpg';
  wholesaleImage = '/assets/nigson-wholesale.jpg';
  lifestyleWork  = '/assets/nigson-lifestyle-work.jpg';

  get products() {
    return this.catalog.PRODUCTS.filter(p => this.catalog.isDeal(p)).slice(0, 4).map(p => ({
      name: p.name,
      detail: p.desc,
      price: this.catalog.formatPrice(p.price),
      image: this.catalog.imageFor(p.category),
      product: p
    }));
  }

  // ── carousel state ────────────────────────────────────────────────────────
  get N() { return this.carouselSlides().length || 1; }
  pos = 0;
  drag = 0;
  paused = false;
  intervalId: any;
  startX: number | null = null;
  offsets = [-2, -1, 0, 1, 2];

  mod(n: number) { return ((n % this.N) + this.N) % this.N; }

  ngOnInit() { this.startInterval(); }
  ngOnDestroy() { if (this.intervalId) clearInterval(this.intervalId); }

  startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.paused && this.startX === null) this.pos++;
    }, 5500);
  }

  setPaused(p: boolean) { this.paused = p; }
  go(d: number) { this.pos += d; this.startInterval(); }

  onPointerDown(e: PointerEvent) {
    this.startX = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  onPointerMove(e: PointerEvent) {
    if (this.startX !== null) this.drag = e.clientX - this.startX;
  }
  onPointerUp(e: PointerEvent) {
    if (this.startX === null) return;
    const w = (e.currentTarget as HTMLElement).offsetWidth || 1000;
    if (Math.abs(this.drag) > w * 0.08) this.go(this.drag < 0 ? 1 : -1);
    this.startX = null;
    this.drag = 0;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") this.go(-1);
    if (e.key === "ArrowRight") this.go(1);
  }
}

