import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CatalogService, PageHeaderComponent } from 'shared-ui';
import { ProductCardComponent } from '../products/product-card.component';
import { LucideSearch } from '@lucide/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, FormsModule, PageHeaderComponent],
  template: `
    <div class="bg-surface min-h-screen">
      <lib-page-header
        [title]="headerTitle()"
        [subtitle]="headerSubtitle()"
      ></lib-page-header>

      <section class="container-page py-12">
        <ng-container *ngIf="matches().length > 0; else noMatches">
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <app-product-card *ngFor="let p of matches()" [p]="p"></app-product-card>
          </div>
        </ng-container>

        <ng-template #noMatches>
          <div class="rounded-2xl border border-border bg-surface-alt/40 py-16 text-center">
            <p class="text-lg font-semibold text-ink">No products found</p>
            <p class="mt-2 text-sm text-muted-foreground">
              We couldn't find a match{{ term() ? ' for "' + term() + '"' : '' }}. Try another keyword or explore the picks below.
            </p>
          </div>
        </ng-template>

        <div *ngIf="recommended().length > 0" class="mt-16">
          <h2 class="text-2xl font-extrabold text-ink">
            {{ matches().length > 0 ? "You may also like" : "Recommended for you" }}
          </h2>
          <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <app-product-card *ngFor="let p of recommended()" [p]="p" [compact]="true"></app-product-card>
          </div>
        </div>
      </section>
    </div>
  `
})
export class SearchComponent {
  route = inject(ActivatedRoute);
  catalog = inject(CatalogService);

  q = toSignal(this.route.queryParamMap.pipe(map(params => params.get('q') || '')), { initialValue: '' });
  
  term = computed(() => this.q().trim().toLowerCase());

  matches = computed(() => {
    const t = this.term();
    if (!t) return [];
    return this.catalog.PRODUCTS.filter((p: any) => 
      [p.name, p.sku, p.category, p.desc].join(" ").toLowerCase().includes(t)
    );
  });

  recommended = computed(() => {
    const m = this.matches();
    const matchedSkus = new Set(m.map((p: any) => p.sku));
    const cats = new Set(m.map((p: any) => p.category));
    
    const rest = this.catalog.PRODUCTS.filter((p: any) => !matchedSkus.has(p.sku));
    const sameCat = rest.filter((p: any) => cats.has(p.category));
    const others = rest.filter((p: any) => !cats.has(p.category));
    
    return [...sameCat, ...others].slice(0, 4);
  });

  headerTitle = computed(() => {
    const t = this.term();
    return t ? `Search results for "${t}"` : "Search our products";
  });

  headerSubtitle = computed(() => {
    const t = this.term();
    const m = this.matches();
    return t 
      ? `${m.length} ${m.length === 1 ? 'product' : 'products'} found in the Nigson catalog.`
      : "Use the search icon in the navigation to find products by name, SKU or category.";
  });
}
