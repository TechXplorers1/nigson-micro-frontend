import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucideLoader2 } from '@lucide/angular';
import { CatalogService, Product } from 'shared-ui';
import { ProductCardComponent } from './product-card.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';

/**
 * ProductListComponent (TASK-15, TASK-17, TASK-23)
 *
 * Replaces hardcoded PRODUCTS/CATEGORIES arrays with:
 *  - GET /api/v1/catalogue/products?q=...&categoryId=...
 *  - GET /api/v1/catalogue/categories
 */
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucideLoader2, ProductCardComponent],
  template: `
    <div class="min-h-screen bg-background">
      <header class="bg-surface-alt border-b border-border py-12 md:py-16">
        <div class="container-page text-center">
          <span class="inline-block px-3 py-1 rounded-full bg-brand/10 text-brand text-xs font-bold uppercase tracking-widest mb-4">
            Product Catalog
          </span>
          <h1 class="text-3xl md:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Phone accessories, power solutions &amp; FMCG.
          </h1>
          <p class="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
            Curated global sourcing, competitive wholesale pricing, and consistent supply across Nigeria.
          </p>
        </div>
      </header>

      <section class="container-page py-12">
        <!-- Search bar -->
        <div class="flex flex-col md:flex-row md:items-center gap-3 mb-8">
          <div class="relative flex-1">
            <svg lucideSearch class="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"></svg>
            <input
              [ngModel]="searchQuery()"
              (ngModelChange)="onSearch($event)"
              placeholder="Search by name, SKU or feature..."
              class="w-full rounded-full border border-border bg-background pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <!-- Category chips from backend -->
        <div class="flex flex-wrap gap-2 mb-10">
          <button
            (click)="selectCategory(null)"
            [ngClass]="activeCategory() === null ? 'bg-ink text-background border-ink' : 'border-border text-muted-foreground hover:border-brand hover:text-brand'"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
          >All</button>
          <button
            *ngFor="let c of catalog.categories()"
            (click)="selectCategory(c.id)"
            [ngClass]="activeCategory() === c.id ? 'bg-ink text-background border-ink' : 'border-border text-muted-foreground hover:border-brand hover:text-brand'"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
          >{{ c.name }}</button>
        </div>

        <!-- Loading state -->
        <div *ngIf="catalog.loading()" class="flex items-center justify-center py-20">
          <svg lucideLoader2 class="h-8 w-8 text-brand animate-spin"></svg>
        </div>

        <!-- Empty state -->
        <div *ngIf="!catalog.loading() && catalog.products().length === 0" class="py-20 text-center text-muted-foreground">
          No products match your search.
        </div>

        <!-- Product grid -->
        <div *ngIf="!catalog.loading() && catalog.products().length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <app-product-card *ngFor="let p of catalog.products()" [p]="p"></app-product-card>
        </div>

        <!-- Pagination -->
        <div *ngIf="catalog.totalPages() > 1" class="mt-10 flex items-center justify-center gap-2">
          <button
            (click)="changePage(catalog.currentPage() - 1)"
            [disabled]="catalog.currentPage() === 0"
            class="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:border-brand hover:text-brand transition-colors"
          >Previous</button>
          <span class="text-sm text-muted-foreground">
            Page {{ catalog.currentPage() + 1 }} of {{ catalog.totalPages() }}
          </span>
          <button
            (click)="changePage(catalog.currentPage() + 1)"
            [disabled]="catalog.currentPage() >= catalog.totalPages() - 1"
            class="rounded-full border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:border-brand hover:text-brand transition-colors"
          >Next</button>
        </div>
      </section>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  catalog = inject(CatalogService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  readonly searchQuery = signal('');
  readonly activeCategory = signal<string | null>(null);
  private searchSubject = new Subject<string>();

  ngOnInit() {
    // Load categories first, then products
    this.catalog.loadCategories().subscribe(() => {
      const params = this.route.snapshot.queryParams;
      const categoryId = params['categoryId'] ?? null;
      this.activeCategory.set(categoryId);
      this.loadProducts();
    });

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(q => {
      this.searchQuery.set(q);
      this.loadProducts(0);
    });
  }

  onSearch(q: string) {
    this.searchSubject.next(q);
  }

  selectCategory(categoryId: string | null) {
    this.activeCategory.set(categoryId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: categoryId ? { categoryId } : {},
      queryParamsHandling: 'replace'
    });
    this.loadProducts(0);
  }

  changePage(page: number) {
    this.loadProducts(page);
  }

  private loadProducts(page = 0) {
    this.catalog.loadProducts({
      q: this.searchQuery() || undefined,
      categoryId: this.activeCategory() ?? undefined,
      page,
      size: 20,
    }).subscribe();
  }
}
