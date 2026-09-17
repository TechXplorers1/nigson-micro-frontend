import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideSearch } from '@lucide/angular';
import { CatalogService, Product } from 'shared-ui';
import { ProductCardComponent } from './product-card.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, ProductCardComponent],
  template: `
    <div class="min-h-screen bg-background">
      <header class="bg-surface-alt border-b border-border py-12 md:py-16">
        <div class="container-page text-center">
          <span class="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-4">
            Product Catalog
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Phone accessories, power solutions & FMCG.
          </h1>
          <p class="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Curated global sourcing, competitive wholesale pricing, and consistent supply across Nigeria.
          </p>
        </div>
      </header>

      <section class="container-page py-12">
        <div class="flex flex-col md:flex-row md:items-center gap-3 mb-8">
          <div class="relative flex-1">
            <svg lucideSearch class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"></svg>
            <input
              [(ngModel)]="searchQuery"
              placeholder="Search by name, SKU or feature..."
              class="w-full rounded-full border border-border bg-background pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-10">
          <button
            *ngFor="let c of displayChips()"
            (click)="selectCategory(c)"
            [ngClass]="{
              'bg-ink text-background border-ink': activeCategory() === c,
              'border-border text-muted-foreground hover:border-brand hover:text-brand': activeCategory() !== c
            }"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
          >
            {{ c }}
          </button>
        </div>

        <div *ngIf="filteredProducts().length === 0" class="py-20 text-center text-muted-foreground">
          No products match your search.
        </div>
        
        <div *ngIf="filteredProducts().length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <app-product-card *ngFor="let p of filteredProducts()" [p]="p"></app-product-card>
        </div>
      </section>
    </div>
  `
})
export class ProductListComponent {
  catalog = inject(CatalogService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  searchQuery = '';

  // Get category from query param
  categoryParam = toSignal(this.route.queryParams.pipe(map(params => params['category'])), { initialValue: '' });

  activeCategory = computed(() => {
    return this.categoryFromSlug(this.categoryParam() || '');
  });

  filteredProducts = computed(() => {
    const cat = this.activeCategory();
    const q = this.searchQuery.toLowerCase();
    
    return this.catalog.PRODUCTS.filter((p) => {
      const matchCat = this.matchesCategory(p, cat);
      const matchQ = !q || (p.name + " " + p.sku + " " + p.desc).toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  });

  displayChips = computed(() => {
    const base = [...this.catalog.CATEGORIES];
    const cat = this.activeCategory();
    if (!base.includes(cat as any) && cat !== "All") {
      return [...base.slice(0, 3), cat, ...base.slice(3)];
    }
    return base;
  });

  selectCategory(c: string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: this.slugForCategory(c) },
      queryParamsHandling: 'merge'
    });
  }

  // Helper functions directly inside the component
  categoryFromSlug(slug: string): string {
    switch (slug) {
      case "earbuds": return "Earbuds";
      case "power-banks": return "Power Banks";
      case "chargers": return "Chargers"; 
      case "cables": return "Cables";
      case "mobile-accessories": return "Mobile Accessories";
      case "car-chargers": return "Car Chargers";
      case "home-power": return "Home & Power";
      case "fmcg": return "FMCG";
      case "deals": return "Deals";
      case "new-arrivals": return "New Arrivals";
      default:
        return (this.catalog.CATEGORIES as readonly string[]).includes(slug) ? slug : "All";
    }
  }

  slugForCategory(cat: string): string {
    switch (cat) {
      case "Earbuds": return "earbuds";
      case "Power Banks": return "power-banks";
      case "Chargers": return "chargers";
      case "Cables": return "cables";
      case "Mobile Accessories": return "mobile-accessories";
      case "Car Chargers": return "car-chargers";
      case "Home & Power": return "home-power";
      case "FMCG": return "fmcg";
      case "Deals": return "deals";
      case "New Arrivals": return "new-arrivals";
      default: return "";
    }
  }

  matchesCategory(p: Product, cat: string): boolean {
    if (cat === "All") return true;
    if (cat === "Chargers") return p.category.includes("Charger");
    if (cat === "Mobile Accessories") return p.category === "Adapters";
    if (cat === "Car Chargers") return p.category === "Car Chargers";
    if (cat === "Home & Power") return p.category === "Home Chargers" || p.category === "Power Strips";
    if (cat === "Deals") return this.catalog.isDeal(p);
    if (cat === "New Arrivals") return this.catalog.isNewArrival(p);
    return p.category === cat;
  }
}
