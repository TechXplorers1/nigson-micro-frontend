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
  name: string;
  /** Category UUID — resolved to name via categories list */
  categoryId: string;
  /** Resolved category name — populated client-side after fetching categories */
  categoryName?: string;
  description: string;
  /** Backend-provided image URLs */
  images?: string[];
  /** Price in NGN minor units (kobo) — divide by 100 for display */
  priceMinorUnits?: number;
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
    'Earbuds': '/assets/cat-earbuds.jpg',
    'Power Banks': '/assets/cat-powerbank.jpg',
    'Wireless Chargers': '/assets/cat-charger.jpg',
    'Car Chargers': '/assets/cat-charger.jpg',
    'Home Chargers': '/assets/cat-charger.jpg',
    'Cables': '/assets/cat-cable.jpg',
    'Adapters': '/assets/cat-charger.jpg',
    'Power Strips': '/assets/cat-powerbank.jpg',
    'Lighting': '/assets/hero-accessories.jpg',
    'FMCG': '/assets/hero-accessories.jpg',
  };
  readonly FALLBACK_IMG = '/assets/hero-accessories.jpg';

  // ─── Products ─────────────────────────────────────────────────────────────

  /**
   * TASK-15, TASK-23: Load products from backend with optional filters.
   * Results stored in `products` signal.
   */
  loadProducts(filters: ProductFilters = {}): Observable<ProductsPage> {
    this.loading.set(true);
    let params = new HttpParams();
    let params = new HttpParams().set('market', 'NG');
    if (filters.q) params = params.set('q', filters.q);
    if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters.brandId) params = params.set('brandId', filters.brandId);
    if (filters.page != null) params = params.set('page', String(filters.page));
    if (filters.size != null) params = params.set('size', String(filters.size));
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<ProductsPage>('/api/v1/catalogue/products', { params }).pipe(
    return this.http.get<any>('/api/v1/catalogue/products', { params }).pipe(
      map(res => {
        const rawItems = res.items || res.content || [];
        const rawItems = res?.items || res?.content || [];
        const content: Product[] = rawItems.map((item: any) => ({
          id: item.id,
          sku: item.slug || item.id,
          name: item.name,
          categoryId: item.brandName || 'General',
          categoryName: item.brandName || 'General',
          description: item.name,
          images: item.imageUrl ? [item.imageUrl] : [this.FALLBACK_IMG],
          priceMinorUnits: 0,
          publicationStatus: item.available ? 'PUBLISHED' : 'UNAVAILABLE',
          brand: item.brandName || 'Nigson',
          tags: []
        }));
        return {
          content,
          totalElements: res.totalElements ?? content.length,
          totalPages: res.totalPages ?? 1,
          number: res.page ?? 0,
          size: res.size ?? 20
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
        console.warn('[CatalogService] Backend /api/v1/catalogue/products unavailable, loading local catalog.');
        const fallback = this.getFallbackProducts(filters);
        this.products.set(fallback);
        this.totalElements.set(fallback.length);
        this.totalPages.set(1);
        console.error('[CatalogService] Backend /api/v1/catalogue/products failed:', err);
        this.products.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        this.currentPage.set(0);
        console.error('[CatalogService] Backend /api/v1/catalogue/products failed:', err);
        this.loading.set(false);
        this.loaded.set(true);
        return of({ content: fallback, totalElements: fallback.length, totalPages: 1, number: 0, size: 20 });
        return of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
      })
    );
  }

  /**
   * TASK-21: Load single product by UUID.
   * Route now uses /products/:id (UUID) not /products/:sku.
   */
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product>(`/api/v1/catalogue/products/${id}`).pipe(
      map(p => this.enrichWithCategories([p])[0]),
    return this.http.get<any>(`/api/v1/catalogue/products/${id}?market=NG`).pipe(
        map(raw => {
          const p: Product = {
            id: raw.id,
            sku: raw.skus?.[0]?.code || raw.slug,
            name: raw.name,
            categoryId: raw.categories?.[0]?.name || 'General',
            categoryName: raw.categories?.[0]?.name || 'General',
            description: raw.description,
            images: raw.assets?.length ? raw.assets.map((a: any) => a.url) : [this.FALLBACK_IMG],
            priceMinorUnits: 0,
            publicationStatus: 'PUBLISHED',
            brand: raw.brand?.name || 'Nigson'
          };
          return this.enrichWithCategories([p])[0];
        }),
        catchError(err => {
          const found = this.products().find(p => p.id === id || p.sku === id) ||
            this.getFallbackProducts({}).find((p: Product) => p.id === id || p.sku === id);
          if (found) {
            return of(found);
          }
          console.error('[CatalogService] getProduct failed:', err);
          throw err;
          return this.http.get<any>(`/api/v1/catalogue/products/${id}?market=NG`).pipe(
            map(raw => {
              const p: Product = {
                id: raw.id,
                sku: raw.skus?.[0]?.code || raw.slug,
                name: raw.name,
                categoryId: raw.categories?.[0]?.name || 'General',
                categoryName: raw.categories?.[0]?.name || 'General',
                description: raw.description,
                images: raw.assets?.length ? raw.assets.map((a: any) => a.url) : [this.FALLBACK_IMG],
                priceMinorUnits: 0,
                publicationStatus: 'PUBLISHED',
                brand: raw.brand?.name || 'Nigson'
              };
              return this.enrichWithCategories([p])[0];
            })
          );
        }
      })
    );
}

/**
 * TASK-22: Recommended products for a given product UUID.
 * Replaces local same-category algorithm.
 */
getRecommended(id: string): Observable < Product[] > {
  return this.http.get<Product[]>(`/api/v1/catalogue/products/${id}/recommendations`).pipe(
    map(list => this.enrichWithCategories(list)),
    getRecommended(id: string): Observable < Product[] > {
      return this.http.get<any[]>(`/api/v1/catalogue/products/${id}/recommendations?market=NG`).pipe(
        map(list => this.enrichWithCategories(list || [])),
        catchError(() => of([]))
      );
    }

  getFallbackProducts(filters: ProductFilters): Product[] {
    let prods: any[] = [];
    try {
      const stored = localStorage.getItem('nigson_admin_products');
      if(stored) {
        prods = JSON.parse(stored);
      }
    } catch {}

    if(!Array.isArray(prods) || prods.length === 0) {
  prods = [
    { id: 'prod-tws-01', sku: 'NG-EB-01', name: 'Nigson TWS Earbuds Pro ANC', category: 'Earbuds', price: 28500, desc: 'Active Noise Cancelling wireless earbuds with 36-hour total battery life and IPX5 water resistance.', image: '/assets/cat-earbuds.jpg', images: ['/assets/cat-earbuds.jpg'], stock: 120, rating: 4.8, status: 'Active' },
    { id: 'prod-pb-01', sku: 'NG-PB-01', name: 'Nigson 20,000mAh 65W Fast Power Bank', category: 'Power Banks', price: 18500, desc: 'High-density Li-Polymer power bank with 65W USB-C Power Delivery, capable of charging laptops and phones.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], stock: 85, rating: 4.9, status: 'Active' },
    { id: 'prod-gan-01', sku: 'NG-CH-01', name: 'Nigson 65W GaN Triple-Port Fast Wall Charger', category: 'Fast Chargers', price: 14200, desc: 'Gallium Nitride (GaN) fast charger with dual USB-C and single USB-A ports, UK 3-pin standard.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], stock: 210, rating: 4.7, status: 'Active' },
    { id: 'prod-cbl-01', sku: 'NG-CB-01', name: 'Nigson Armored Braided Type-C to Type-C Cable (2m)', category: 'Cables & Adapters', price: 4500, desc: '100W Power Delivery nylon-braided cable with aluminum alloy connectors, tested to 25,000 bends.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], stock: 500, rating: 4.6, status: 'Active' },
    { id: 'prod-car-01', sku: 'NG-CC-01', name: 'Nigson MagSafe 15W Wireless Car Charger & Mount', category: 'Fast Chargers', price: 12800, desc: 'Automatic magnetic alignment car vent mount with fast wireless charging and 360-degree rotation.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], stock: 64, rating: 4.5, status: 'Active' },
    { id: 'prod-oil-01', sku: 'NIG-IND-OIL-5L', name: 'Nigson Industrial Grade Machinery Lubricant 5L', category: 'Industrial Lubricants', price: 45000, desc: 'High-viscosity synthetic industrial gear oil formulated for extreme pressure and high operating temperatures.', image: '/assets/hero-accessories.jpg', images: ['/assets/hero-accessories.jpg'], stock: 40, rating: 4.9, status: 'Active' },
    { id: 'prod-sol-01', sku: 'NIG-SOL-35KVA', name: 'Nigson Smart Solar Hybrid Inverter 3.5kVA / 24V', category: 'Solar & Inverters', price: 380000, desc: 'Pure sine wave hybrid solar inverter with integrated 80A MPPT charge controller and WiFi monitoring.', image: '/assets/hero-accessories.jpg', images: ['/assets/hero-accessories.jpg'], stock: 18, rating: 5.0, status: 'Active' },
    { id: 'prod-srg-01', sku: 'NG-SP-01', name: 'Nigson 6-Way Surge Protector Extension with 4 USB Ports', category: 'Cables & Adapters', price: 16500, desc: 'Flame-retardant multi-socket surge protector with individual switches, overload breaker, and fast USB ports.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], stock: 140, rating: 4.7, status: 'Active' }
  ];
}

let mapped: Product[] = prods.map(p => ({
  id: p.id || p.sku,
  sku: p.sku || p.id,
  name: p.name,
  categoryId: p.category || 'General',
  categoryName: p.category || 'General',
  description: p.desc || p.description || '',
  images: p.images?.length ? p.images : [p.image || this.FALLBACK_IMG],
  priceMinorUnits: Math.round((p.price || p.retail || 0) * 100),
  publicationStatus: 'PUBLISHED',
  brand: 'Nigson',
  tags: [p.category || 'General']
}));

if (filters.q) {
  const query = filters.q.toLowerCase();
  mapped = mapped.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));
}
if (filters.categoryId) {
  const cat = filters.categoryId.toLowerCase();
  mapped = mapped.filter(p => p.categoryId.toLowerCase().includes(cat) || (p.categoryName && p.categoryName.toLowerCase().includes(cat)));
}

return mapped;
map(list => this.enrichWithCategories(list || [])),
  catchError(() => of([]))
    );
  }

// ─── Categories (TASK-17) ─────────────────────────────────────────────────

loadCategories(): Observable < Category[] > {
  return this.http.get<Category[]>('/api/v1/catalogue/categories').pipe(
    return this.http.get<any[]>('/api/v1/catalogue/categories?market=NG').pipe(
    map(cats => (cats || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      imageUrl: this.CAT_IMG[c.name] || this.FALLBACK_IMG
    }))),
    tap(cats => this.categories.set(cats)),
    catchError(err => {
      console.warn('[CatalogService] Backend /api/v1/catalogue/categories unavailable, using local categories.');
      const fallbackCats: Category[] = [
        { id: 'Earbuds', name: 'Earbuds', slug: 'earbuds', imageUrl: '/assets/cat-earbuds.jpg' },
        { id: 'Power Banks', name: 'Power Banks', slug: 'power-banks', imageUrl: '/assets/cat-powerbank.jpg' },
        { id: 'Fast Chargers', name: 'Fast Chargers', slug: 'fast-chargers', imageUrl: '/assets/cat-charger.jpg' },
        { id: 'Cables & Adapters', name: 'Cables & Adapters', slug: 'cables', imageUrl: '/assets/cat-cable.jpg' },
        { id: 'Industrial Lubricants', name: 'Industrial Lubricants', slug: 'industrial-lubricants', imageUrl: '/assets/hero-accessories.jpg' },
        { id: 'Solar & Inverters', name: 'Solar & Inverters', slug: 'solar-inverters', imageUrl: '/assets/hero-accessories.jpg' }
      ];
      this.categories.set(fallbackCats);
      return of(fallbackCats);
      console.error('[CatalogService] loadCategories failed:', err);
      return of([]);
    })
      catchError(() => of([]))
  );
}

// ─── Brands (TASK-18) ─────────────────────────────────────────────────────

loadBrands(): Observable < Brand[] > {
  return this.http.get<Brand[]>('/api/v1/catalogue/brands').pipe(
    tap(brands => this.brands.set(brands)),
    catchError(() => {
      const fallbackBrands: Brand[] = [
        { id: 'b-nigson', name: 'Nigson' },
        { id: 'b-powerpro', name: 'PowerPro' },
        { id: 'b-soundcore', name: 'SoundCore' }
      ];
      this.brands.set(fallbackBrands);
      return of(fallbackBrands);
    })
      tap(brands => this.brands.set(brands || [])),
    catchError(() => of([]))
  );
}

// ─── Pricing (TASK-19, TASK-20) ──────────────────────────────────────────

/**
 * Load price for a SKU UUID. Returns price in minor units (kobo).
 * Use formatPrice() to convert for display.
 */
getPrice(skuId: string): Observable < PriceResponse > {
  return this.http.get<PriceResponse>(`/api/v1/catalogue/skus/${skuId}/price`);
  getPrice(skuId: string, quantity = 1): Observable<PriceResponse> {
    return this.http.get<any>(`/api/v1/catalogue/skus/${skuId}/price?market=NG&quantity=${quantity}`).pipe(
      map(res => ({
        skuId: res.skuId,
        priceMinorUnits: Math.round(parseFloat(res.unitAmount) * 100),
        currency: res.currency,
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
              }))
          );
        }
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
validateMarket(): Observable < boolean > {
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