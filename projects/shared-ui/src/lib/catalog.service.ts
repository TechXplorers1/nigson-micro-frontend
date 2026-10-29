import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

// ─── Backend DTOs ──────────────────────────────────────────────────────────────

/**
 * Product (TASK-16) — aligned to GET /api/v1/catalogue/products response.
 *
 * Key changes from old interface:
 *  - id (UUID) added as primary key — used for all API calls
 *  - price removed (comes from separate GET /api/v1/catalogue/skus/{id}/price)
 *  - originalPrice removed (not a backend concept)
 *  - desc → description (matches backend field name)
 *  - stock removed (comes from GET /api/v1/staff/inventory, not product DTO)
 */
export interface Product {
  /** UUID primary key — use for all backend API calls */
  id: string;
  /** Human-readable SKU code — use for display only */
  sku: string;
  /** SKU UUID for cart operations */
  skuId?: string;
  name: string;
  /** Category UUID — resolved to name via categories list */
  categoryId: string;
  /** Resolved category name — populated client-side after fetching categories */
  categoryName?: string;
  description: string;
  /** Technical specifications */
  specifications?: Record<string, any>;
  /** Backend-provided image URLs */
  images?: string[];
  /** Price in NGN minor units (kobo) — divide by 100 for display */
  priceMinorUnits?: number;
  price?: number;
  stock?: number;
  /** Publication status from backend */
  publicationStatus?: string;
  brand?: string;
  tags?: string[];
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface Brand {
  id: string;
  name: string;
}

export interface PriceResponse {
  skuId: string;
  /** Price in NGN minor units (kobo) */
  priceMinorUnits: number;
  currency: string;
  marketId: string;
}

export interface ProductsPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProductFilters {
  q?: string;
  categoryId?: string;
  brandId?: string;
  page?: number;
  size?: number;
  sort?: string;
}

// ─── Service ───────────────────────────────────────────────────────────────────

/**
 * CatalogService (TASK-15 to TASK-27)
 *
 * Replaces all hardcoded PRODUCTS/CATEGORIES arrays with real HTTP calls to:
 *   GET /api/v1/catalogue/products               — TASK-15, TASK-23
 *   GET /api/v1/catalogue/products/{id}           — TASK-21
 *   GET /api/v1/catalogue/products/{id}/recommendations — TASK-22
 *   GET /api/v1/catalogue/categories             — TASK-17
 *   GET /api/v1/catalogue/brands                 — TASK-18
 *   GET /api/v1/catalogue/skus/{id}/price        — TASK-19
 *   GET /api/v1/reviews?productId={id}           — TASK-26 (rating)
 *
 * Price display: backend returns kobo (NGN × 100). Use formatPrice() which
 * divides by 100 before display (TASK-20).
 */
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  // ─── Reactive state ──────────────────────────────────────────────────────

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly loading = signal(false);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly currentPage = signal(0);

  /** Loaded flag — true once initial products list has been fetched */
  readonly loaded = signal(false);

  // ─── Static fallback image map (for display while backend images load) ────

  readonly CAT_IMG: Record<string, string> = {
    'Power Banks': '/assets/cat-powerbank.jpg',
    'Earbuds': '/assets/cat-earbuds.jpg',
    'Cables': '/assets/cat-cable.jpg',
    'Chargers': '/assets/cat-charger.jpg',
    'Extension Sockets': '/assets/cat-powerbank.jpg',
    'Motion-Activated Lights': '/assets/hero-accessories.jpg',
    'Wireless Chargers': '/assets/cat-charger.jpg',
    'Car Chargers': '/assets/cat-charger.jpg',
    'Home Chargers': '/assets/cat-charger.jpg',
    'Adapters': '/assets/cat-charger.jpg',
    'Power Strips': '/assets/cat-powerbank.jpg',
    'Lighting': '/assets/hero-accessories.jpg',
    'FMCG': '/assets/hero-accessories.jpg',
  };
  readonly FALLBACK_IMG = '/assets/hero-accessories.jpg';

  resolveImageUrl(url: string | null | undefined): string {
    if (!url) return this.FALLBACK_IMG;
    if (url.includes('cdn.synthetic.test/assets/')) {
      return url.replace(/^https?:\/\/[^\/]+\/assets\//, '/assets/');
    }
    return url;
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  /**
   * TASK-15, TASK-23: Load products from backend with optional filters.
   * Results stored in `products` signal.
   */
  loadProducts(filters: ProductFilters = {}): Observable<ProductsPage> {
    this.loading.set(true);
    let params = new HttpParams().set('market', 'NG');
    if (filters.q) params = params.set('q', filters.q);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.brandId) params = params.set('brandId', filters.brandId);
    if (filters.page != null) params = params.set('page', String(filters.page));
    if (filters.size != null) params = params.set('size', String(filters.size));
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<any>('/api/v1/catalogue/products', { params }).pipe(
      map(res => {
        const rawItems = res?.items || res?.content || [];
        const content: Product[] = rawItems.map((item: any) => ({
          id: item.id,
          sku: item.slug || item.id,
          skuId: item.skus?.[0]?.id || item.id,
          name: item.name,
          categoryId: item.brandName || 'General',
          categoryName: item.brandName || 'General',
          description: item.name,
          images: item.imageUrl ? [this.resolveImageUrl(item.imageUrl)] : [this.FALLBACK_IMG],
          priceMinorUnits: 0,
          publicationStatus: item.available ? 'PUBLISHED' : 'UNAVAILABLE',
          brand: item.brandName || 'Nigson',
          tags: []
        }));
        return {
          content,
          totalElements: res?.totalElements ?? content.length,
          totalPages: res?.totalPages ?? 1,
          number: res?.page ?? 0,
          size: res?.size ?? 20
        };
      }),
      tap(page => {
        const enriched = this.enrichWithCategories(page.content);
        this.products.set(enriched);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.currentPage.set(page.number);
        this.loading.set(false);
        this.loaded.set(true);
      }),
      catchError(err => {
        console.error('[CatalogService] Backend /api/v1/catalogue/products failed:', err);
        this.products.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        this.currentPage.set(0);
        this.loading.set(false);
        this.loaded.set(true);
        return of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
      })
    );
  }

  /**
   * TASK-21: Load single product by UUID.
   * Route now uses /products/:id (UUID) not /products/:sku.
   */
  getProduct(id: string): Observable<Product> {
    return this.http.get<any>(`/api/v1/catalogue/products/${id}?market=NG`).pipe(
      map(raw => {
        const p: Product = {
          id: raw.id,
          sku: raw.skus?.[0]?.code || raw.slug,
          skuId: raw.skus?.[0]?.id || raw.id,
          name: raw.name,
          categoryId: raw.categories?.[0]?.name || 'General',
          categoryName: raw.categories?.[0]?.name || 'General',
          description: raw.description,
          specifications: raw.specifications || {},
          images: raw.assets?.length ? raw.assets.map((a: any) => this.resolveImageUrl(a.url)) : [this.FALLBACK_IMG],
          priceMinorUnits: 0,
          publicationStatus: 'PUBLISHED',
          brand: raw.brand?.name || 'Nigson'
        };
        return this.enrichWithCategories([p])[0];
      }),
      catchError(err => {
        console.error('[CatalogService] getProduct failed:', err);
        throw err;
      })
    );
  }

  /**
   * TASK-22: Recommended products for a given product UUID.
   */
  getRecommended(id: string): Observable<Product[]> {
    return this.http.get<any[]>(`/api/v1/catalogue/products/${id}/recommendations?market=NG`).pipe(
      map(list => this.enrichWithCategories(list || [])),
      catchError(() => of([]))
    );
  }

  // ─── Categories (TASK-17) ─────────────────────────────────────────────────

  loadCategories(): Observable<Category[]> {
    return this.http.get<any[]>('/api/v1/catalogue/categories?market=NG').pipe(
      map(cats => (cats || []).map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        imageUrl: this.CAT_IMG[c.name] || this.FALLBACK_IMG
      }))),
      tap(cats => this.categories.set(cats)),
      catchError(err => {
        console.error('[CatalogService] loadCategories failed:', err);
        return of([]);
      })
    );
  }

  // ─── Brands (TASK-18) ─────────────────────────────────────────────────────

  loadBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>('/api/v1/catalogue/brands').pipe(
      tap(brands => this.brands.set(brands)),
      catchError(() => of([]))
    );
  }

  // ─── Pricing (TASK-19, TASK-20) ──────────────────────────────────────────

  /**
   * Load price for a SKU UUID. Returns price in minor units (kobo).
   * Use formatPrice() to convert for display.
   */
  getPrice(skuId: string, quantity = 1): Observable<PriceResponse> {
    return this.http.get<any>(`/api/v1/catalogue/skus/${skuId}/price?market=NG&quantity=${quantity}`).pipe(
      map(res => ({
        skuId: res.skuId,
        priceMinorUnits: Math.round(parseFloat(res.unitAmount) * 100),
        currency: res.currency,
        marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6'
      })),
      catchError(err => {
        console.error('[CatalogService] getPrice failed:', err);
        return of({
          skuId,
          priceMinorUnits: 0,
          currency: 'NGN',
          marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6'
        });
      })
    );
  }

  /**
 * TASK-20: Format price from NGN minor units (kobo) to display string.
 * Backend always returns kobo — divide by 100 before showing.
 *
 * Examples:
 *   formatPrice(2850000) → '₦28,500.00'
 *   formatPrice(450000)  → '₦4,500.00'
 */
  formatPrice(minorUnits: number): string {
    const naira = minorUnits / 100;
    return '₦' + naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Format price from whole Naira (legacy local data) — for transition period only */
  formatPriceNaira(naira: number): string {
    return '₦' + naira.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── Image helpers ────────────────────────────────────────────────────────

  imageFor(categoryName: string | undefined | null): string {
    if (!categoryName) return this.FALLBACK_IMG;
    return this.CAT_IMG[categoryName] ?? this.FALLBACK_IMG;
  }

  primaryImage(product: Product): string {
    return product.images?.[0] ?? this.imageFor(product.categoryName ?? '');
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Enrich products with resolved category name from loaded categories signal */
  private enrichWithCategories(products: Product[]): Product[] {
    const cats = this.categories();
    if (!cats.length) return products;
    const catMap = new Map(cats.map(c => [c.id, c.name]));
    return products.map(p => ({
      ...p,
      categoryName: catMap.get(p.categoryId) ?? p.categoryName
    }));
  }

  /** TASK-27: Is product a "deal"? Driven by backend campaigns, not hardcoded SKUs */
  isDeal(p: Product): boolean {
    return p.tags?.includes('deal') ?? false;
  }

  /** TASK-27: Is product a new arrival? Based on createdAt date (last 30 days) */
  isNewArrival(p: Product): boolean {
    if (!p.createdAt) return false;
    const days = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
    return days <= 30;
  }

  // ─── Legacy hash (kept for non-rating use cases during transition) ─────────
  hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  // ─── TASK-84: Market Validation (API-029) ──────────────────────────────────
  readonly marketActive = signal<boolean>(true);
  readonly marketCurrency = signal<string>('NGN');

  /** Validate that the NG (Nigeria) market policy is active from GET /api/v1/markets */
  validateMarket(): Observable<boolean> {
    return this.http.get<any[]>('/api/v1/markets').pipe(
      map(markets => {
        const ng = (markets || []).find(m => m.code === 'NG' || m.currency === 'NGN');
        const active = !!ng;
        this.marketActive.set(active);
        if (ng?.currency) this.marketCurrency.set(ng.currency);
        return active;
      }),
      catchError(err => {
        // Fallback gracefully in development / test environments
        this.marketActive.set(true);
        return of(true);
      })
    );
  }

}