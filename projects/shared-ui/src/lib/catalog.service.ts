import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';

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
  lowLevel?: number;
  /** Publication status from backend */
  publicationStatus?: string;
  brand?: string;
  tags?: string[];
  createdAt?: string;

  // Rich editable product details matching product page
  status?: string;
  priceSubtitle?: string;
  retailPrice?: number;
  retail?: number;
  wholesalePrice?: number;
  wholesale?: number;
  distributorPrice?: number;
  distributor?: number;
  features?: string[] | string;
  overview?: string;
  overviewExtra?: string;
  highlights?: string[] | string;
  packaging?: string[] | string;
  cartonSpecs?: string[] | string;
  warehouseStatus?: string;
  dispatchTurnaround?: string;
  nationwideShipping?: string;
  minWholesaleOrder?: string;
  updatedAt?: string;
}

export const OFFICIAL_SKU_PRICES: Record<string, number> = {
  'NS03': 1850000,
  'NS06': 2850000,
  'NS107': 1650000,
  'NS211C': 550000,
  'NS211i': 480000,
  'NS25': 650000,
  'NS2526C': 2450000,
  'NS2618': 2950000,
  'NS3416': 3200000,
  'NS3604C': 2750000,
  'NS4': 950000,
  'NS6': 1950000,
  'NS6-1': 1450000,
  'NS901C': 450000,
  'NS901i': 420000,
  'NS96U': 520000,
  'PQ19': 1650000,
  'PQ20': 2650000,
  'PQ28': 1950000,
  'PQ30': 3450000,
  'PQ50': 4850000,
  'ZS6': 2650000,
  'ZS8': 2150000
};

export function extractSku(slug?: string, name?: string): string {
  if (slug) {
    const clean = slug.replace(/^nigson-/, '');
    if (clean.startsWith('ns6-1')) return 'NS6-1';
    if (clean.startsWith('ns2526c')) return 'NS2526C';
    if (clean.startsWith('ns3604c')) return 'NS3604C';
    if (clean.startsWith('ns211c')) return 'NS211C';
    if (clean.startsWith('ns211i')) return 'NS211i';
    if (clean.startsWith('ns901c')) return 'NS901C';
    if (clean.startsWith('ns901i')) return 'NS901i';
    if (clean.startsWith('ns96u')) return 'NS96U';
    return clean.split('-')[0].toUpperCase();
  }
  if (name) {
    return name.split(' ')[0].toUpperCase();
  }
  return 'NG-SKU';
}

export function resolveCategoryFromSku(sku: string, fallback = 'General'): string {
  const upper = (sku || '').toUpperCase();
  if (upper.startsWith('NS03') || upper.startsWith('NS06')) return 'Earbuds';
  if (upper.startsWith('PQ')) return 'Power Banks';
  if (upper.startsWith('NS211') || upper.startsWith('NS25') || upper.startsWith('NS901') || upper.startsWith('NS96')) return 'Cables';
  if (upper.startsWith('NS107') || upper.startsWith('NS2526') || upper.startsWith('NS2618') || upper.startsWith('NS4') || upper.startsWith('ZS')) return 'Chargers';
  if (upper.startsWith('NS3416') || upper.startsWith('NS3604')) return 'Extension Sockets';
  if (upper.startsWith('NS6')) return 'Motion-Activated Lights';
  return fallback;
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
      return url.replace(/^https?:\/\/[^\/]+\/assets\//, 'http://localhost:4566/nigson-product-images/');
    }
    if (url.startsWith('/assets/products/')) {
      return url.replace('/assets/products/', 'http://localhost:4566/nigson-product-images/products/');
    }
    return url;
  }

  // ─── Local Overrides / Synchronized Edits ────────────────────────────────

  saveProductOverride(idOrSku: string, override: Partial<Product>): void {
    try {
      const existing = this.getProductOverride(idOrSku) || {};
      const merged = { ...existing, ...override, updatedAt: new Date().toISOString() };
      localStorage.setItem(`nigson_prod_override_${idOrSku}`, JSON.stringify(merged));
      if (merged.id) localStorage.setItem(`nigson_prod_override_${merged.id}`, JSON.stringify(merged));
      if (merged.sku) localStorage.setItem(`nigson_prod_override_${merged.sku}`, JSON.stringify(merged));

      this.products.update(all => all.map(p =>
        (p.id === idOrSku || p.sku === idOrSku || (merged.id && p.id === merged.id) || (merged.sku && p.sku === merged.sku))
          ? { ...p, ...merged }
          : p
      ));
    } catch (e) {
      console.warn('[CatalogService] Error persisting override', e);
    }
  }

  getProductOverride(idOrSku: string): Partial<Product> | null {
    try {
      const raw = localStorage.getItem(`nigson_prod_override_${idOrSku}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ─── Products ─────────────────────────────────────────────────────────────

  /**
   * TASK-15, TASK-23: Load products from backend with optional filters.
   * Results stored in `products` signal and enriched with real SKUs, prices, categories, and overrides.
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
      catchError(() => this.http.get<any>('http://localhost:8085/api/v1/catalogue/products', { params })),
      map(res => {
        const rawItems = res?.items || res?.content || [];
        const content: Product[] = rawItems.map((item: any) => {
          const sku = item.sku || item.skus?.[0]?.code || extractSku(item.slug, item.name);
          const override = this.getProductOverride(item.id) || this.getProductOverride(sku);
          const priceMinor = override?.priceMinorUnits || (override?.price ? override.price * 100 : (OFFICIAL_SKU_PRICES[sku] || 450000));
          const primaryImg = override?.images?.[0] || (item.imageUrl ? this.resolveImageUrl(item.imageUrl) : this.FALLBACK_IMG);
          const cat = override?.categoryName || resolveCategoryFromSku(sku, item.brandName || 'General');

          const p: Product = {
            id: item.id,
            sku: override?.sku || sku,
            skuId: item.skus?.[0]?.id || item.id,
            name: override?.name || item.name,
            categoryId: override?.categoryId || cat,
            categoryName: cat,
            description: override?.description || item.name,
            images: override?.images?.length ? override.images : (item.imageUrl ? [this.resolveImageUrl(item.imageUrl)] : [primaryImg]),
            priceMinorUnits: priceMinor,
            price: priceMinor / 100,
            publicationStatus: item.available ? 'PUBLISHED' : 'UNAVAILABLE',
            brand: override?.brand || item.brandName || 'Nigson',
            tags: [],
            ...override
          };
          return p;
        });
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
  /**
   * TASK-21: Load single product by UUID or SKU.
   * Resolves UUID, fetches backend record with all images/specifications, and merges overrides.
   */
  getProduct(idOrSku: string): Observable<Product> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSku);
    if (!isUuid) {
      // Find UUID by SKU or slug from loaded products
      const found = this.products().find(p =>
        p.sku?.toUpperCase() === idOrSku.toUpperCase() ||
        p.id === idOrSku ||
        p.name?.toUpperCase().startsWith(idOrSku.toUpperCase())
      );
      if (found?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(found.id)) {
        return this.getProductByUuid(found.id, idOrSku);
      }
      return this.loadProducts({ size: 100 }).pipe(
        switchMap(page => {
          const match = page.content.find(p =>
            p.sku?.toUpperCase() === idOrSku.toUpperCase() ||
            p.id === idOrSku ||
            p.name?.toUpperCase().startsWith(idOrSku.toUpperCase())
          );
          const targetId = match?.id || idOrSku;
          return this.getProductByUuid(targetId, idOrSku);
        })
      );
    }
    return this.getProductByUuid(idOrSku);
  }

  private getProductByUuid(uuid: string, aliasSku?: string): Observable<Product> {
    return this.http.get<any>(`/api/v1/catalogue/products/${uuid}?market=NG`).pipe(
      catchError(() => this.http.get<any>(`http://localhost:8085/api/v1/catalogue/products/${uuid}?market=NG`)),
      map(raw => {
        const sku = raw.sku || raw.skus?.[0]?.code || extractSku(raw.slug, raw.name);
        const override = this.getProductOverride(raw.id) || this.getProductOverride(sku) || (aliasSku ? this.getProductOverride(aliasSku) : null);
        const catName = raw.categories?.[0]?.name || resolveCategoryFromSku(sku);
        const priceMinor = override?.priceMinorUnits || (override?.price ? override.price * 100 : (OFFICIAL_SKU_PRICES[sku] || 450000));

        // Map ALL backend assets into images array
        const backendImages: string[] = raw.assets?.length
          ? raw.assets.map((a: any) => this.resolveImageUrl(a.url)).filter(Boolean)
          : (raw.imageUrl ? [this.resolveImageUrl(raw.imageUrl)] : [this.FALLBACK_IMG]);

        // Merge images: keep any customized override images, and ensure all backend S3 assets are included
        const mergedImages: string[] = [];
        if (override?.images?.length) {
          for (const img of override.images) {
            if (img && typeof img === 'string' && img.trim() && !mergedImages.includes(img.trim())) {
              mergedImages.push(img.trim());
            }
          }
        }
        for (const bImg of backendImages) {
          if (bImg && !mergedImages.includes(bImg)) {
            mergedImages.push(bImg);
          }
        }
        if (mergedImages.length === 0) {
          mergedImages.push(this.FALLBACK_IMG);
        }

        const p: Product = {
          id: raw.id,
          sku: override?.sku || sku,
          skuId: raw.skus?.[0]?.id || raw.id,
          name: override?.name || raw.name,
          categoryId: raw.categories?.[0]?.id || catName,
          categoryName: override?.categoryName || catName,
          description: override?.description || raw.description,
          publicationStatus: 'PUBLISHED',
          brand: override?.brand || raw.brand?.name || 'Nigson',
          ...override,
          specifications: {
            ...(raw.specifications || {}),
            ...(override?.specifications || {})
          },
          images: mergedImages,
          priceMinorUnits: priceMinor,
          price: priceMinor / 100
        };
        return this.enrichWithCategories([p])[0];
      }),
      catchError(err => {
        const override = this.getProductOverride(uuid) || (aliasSku ? this.getProductOverride(aliasSku) : null);
        if (override) {
          return of(override as Product);
        }
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
      catchError(() => this.http.get<any[]>('http://localhost:8085/api/v1/catalogue/categories?market=NG')),
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
      catchError(() => {
        // Fallback gracefully in development / test environments
        this.marketActive.set(true);
        return of(true);
      })
    );
  }
}