import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { CatalogService, Product } from 'shared-ui';
import { ProductCardComponent } from '../products/product-card.component';
import { LucideSearch } from '@lucide/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent, LucideSearch, FormsModule],
  template: `
    <div class="bg-surface min-h-[70vh]">
      <div class="border-b border-hairline bg-white shadow-sm">
        <div class="container mx-auto px-4 py-8">
          <form class="mx-auto flex max-w-2xl items-center rounded-2xl border-2 border-brand bg-white px-4 shadow-sm focus-within:ring-4 focus-within:ring-brand/20">
            <svg lucideSearch class="h-5 w-5 text-brand"></svg>
            <input 
              type="search" 
              [ngModel]="query()" 
              (ngModelChange)="onSearch($event)"
              name="search"
              class="w-full bg-transparent p-4 text-lg text-ink focus:outline-none placeholder:text-muted-ink"
              placeholder="Search products, brands, or categories..."
              autocomplete="off"
            >
          </form>
          
          <div class="mt-4 text-center text-sm text-muted-ink">
            <span *ngIf="query()">Showing results for "<strong class="text-ink">{{ query() }}</strong>"</span>
            <span *ngIf="!query()">Start typing to search our entire catalogue</span>
          </div>
        </div>
      </div>

      <div class="container mx-auto px-4 py-12">
        <div *ngIf="filteredProducts().length > 0" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-8">
          <app-product-card *ngFor="let p of filteredProducts()" [p]="p"></app-product-card>
        </div>

        <div *ngIf="filteredProducts().length === 0 && query()" class="py-24 text-center">
          <svg lucideSearch class="mx-auto h-16 w-16 text-muted-ink/30 mb-4"></svg>
          <h2 class="text-2xl font-bold text-ink">No results found</h2>
          <p class="mt-2 text-muted-ink">We couldn't find any products matching "{{ query() }}".</p>
          <a routerLink="/products" class="mt-6 inline-block font-bold text-brand hover:underline">Browse all products</a>
        </div>
      </div>
    </div>
  `
})
export class SearchComponent {
  private route = inject(ActivatedRoute);
  catalog = inject(CatalogService);
  
  querySignal = signal('');
  
  routeQuery = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('q') || '')),
    { initialValue: '' }
  );
  
  query = computed(() => this.querySignal() || this.routeQuery());

  filteredProducts = computed(() => {
    const q = this.query().toLowerCase();
    if (!q) return [];
    
    return this.catalog.PRODUCTS.filter((p: Product) => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });
  
  onSearch(val: string) {
    this.querySignal.set(val);
  }
}
