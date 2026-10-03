import { Component, HostListener, OnInit, OnDestroy, inject } from '@angular/core';
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
import { CatalogService, ShopService, Product, QtyStepperComponent } from 'shared-ui';

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

  heroImage = '/assets/nigson-hero-products.jpg';
  audioImage = '/assets/nigson-audio.jpg';
  powerImage = '/assets/nigson-power.jpg';
  wholesaleImage = '/assets/nigson-wholesale.jpg';
  lifestyleSound = '/assets/nigson-lifestyle-sound.jpg';
  lifestyleWork = '/assets/nigson-lifestyle-work.jpg';

  categories = [
    { label: "Audio", title: "Sound that moves with you.", description: "Immersive listening, made effortless.", image: this.audioImage, filter: "Earbuds" },
    { label: "Power", title: "Ready when you need it.", description: "Dependable portable power for every day.", image: this.powerImage, filter: "Power Banks" },
    { label: "Charging", title: "Fast power. Less waiting.", description: "Compact chargers and cables built to keep up.", image: this.heroImage, filter: "Home Chargers" },
    { label: "Mobile Accessories", title: "Made for your mobile life.", description: "The useful details that make every device better.", image: this.audioImage, filter: "Cables" },
    { label: "Car Accessories", title: "Upgrade every drive.", description: "Smarter essentials for the road ahead.", image: this.powerImage, filter: "Car Chargers" },
    { label: "Home & Power", title: "Everyday power, simplified.", description: "Reliable essentials for a more connected home.", image: this.heroImage, filter: "Power Strips" },
    { label: "FMCG", title: "The everyday, considered.", description: "Useful products selected for modern routines.", image: this.wholesaleImage, filter: "FMCG" },
  ];

  get products() {
    return this.catalog.PRODUCTS.filter(p => this.catalog.isDeal(p)).slice(0, 4).map(p => ({
      name: p.name,
      detail: p.desc,
      price: this.catalog.formatPrice(p.price),
      image: this.catalog.imageFor(p.category),
      product: p
    }));
  }

  lifestylePanels = [
    { title: "YOUR WORLD. YOUR SOUND.", text: "Turn everyday moments into your own soundtrack.", image: this.lifestyleSound, alt: "Person relaxing with Nigson wireless headphones" },
    { title: "POWER YOUR WORKDAY.", text: "Stay connected, charged and ready for what comes next.", image: this.lifestyleWork, alt: "Person working with a Nigson power bank charging their phone" },
  ];

  slides = [
    { kicker: "Nigson Audio", title: "SOUND. SIMPLIFIED.", desc: "Wireless audio made for every moment.", cta: "Shop Audio", link: "/products", queryParams: { category: "Earbuds" }, image: this.audioImage, tone: "dark" },
    { kicker: "Nigson Power", title: "POWER YOUR EVERYDAY.", desc: "Reliable charging essentials, wherever you go.", cta: "Shop Power", link: "/products", queryParams: { category: "Power Banks" }, image: this.powerImage, tone: "light" },
    { kicker: "Mobile Essentials", title: "READY FOR EVERY DAY.", desc: "Smart accessories designed around your devices.", cta: "Explore Accessories", link: "/products", queryParams: { category: "Cables" }, image: this.heroImage, tone: "white" },
    { kicker: "Nigson Deals", title: "MORE VALUE. LESS WAITING.", desc: "Discover limited-time offers across Nigson.", cta: "View Deals", link: "/products", queryParams: { isDeal: "true" }, image: this.wholesaleImage, tone: "dark" },
  ];

  N = this.slides.length;
  pos = 0;
  drag = 0;
  paused = false;
  intervalId: any;
  startX: number | null = null;
  
  offsets = [-2, -1, 0, 1, 2];

  mod(n: number) {
    return ((n % this.N) + this.N) % this.N;
  }
  
  ngOnInit() {
    this.startInterval();
  }
  
  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  startInterval() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      if (!this.paused && this.startX === null) {
        this.pos++;
      }
    }, 5500);
  }

  setPaused(p: boolean) {
    this.paused = p;
  }

  go(d: number) {
    this.pos += d;
    this.startInterval();
  }

  onPointerDown(e: PointerEvent) {
    this.startX = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  onPointerMove(e: PointerEvent) {
    if (this.startX !== null) {
      this.drag = e.clientX - this.startX;
    }
  }
  onPointerUp(e: PointerEvent) {
    if (this.startX === null) return;
    const w = (e.currentTarget as HTMLElement).offsetWidth || 1000;
    if (Math.abs(this.drag) > w * 0.08) {
      this.go(this.drag < 0 ? 1 : -1);
    }
    this.startX = null;
    this.drag = 0;
  }
  
  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft") this.go(-1);
    if (e.key === "ArrowRight") this.go(1);
  }
}
