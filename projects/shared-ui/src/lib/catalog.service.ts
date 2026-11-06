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

export function extractSku(slug?: string, name?: string): string {
  if (slug) {
    const clean = slug.replace(/^nigson-/, '');
    if (clean.includes('earbud')) return 'NG-EB-01';
    if (clean.includes('30000') || clean.includes('20000') || (clean.includes('power-bank') && !clean.includes('magnetic'))) return 'NG-PB-01';
    if (clean.includes('gan-100w')) return 'NG-GAN-100';
    if (clean.includes('65w') || clean.includes('triple-port')) return 'NG-CH-01';
    if (clean.includes('cable') || clean.includes('braided')) return 'NG-CB-01';
    if (clean.includes('car-charger') || clean.includes('magsafe')) return 'NG-CC-01';
    if (clean.includes('surge') || clean.includes('extension')) return 'NG-SP-01';
    if (clean.includes('magnetic')) return 'PQ28';
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
  if (upper.startsWith('NS03') || upper.startsWith('NS06') || upper.startsWith('NG-EB') || upper.includes('EARBUD')) return 'Earbuds';
  if (upper.startsWith('PQ') || upper.startsWith('NG-PB') || upper.includes('POWER')) return 'Power Banks';
  if (upper.startsWith('NS211') || upper.startsWith('NS25') || upper.startsWith('NS901') || upper.startsWith('NS96') || upper.startsWith('NG-CB') || upper.includes('CABLE')) return 'Cables';
  if (upper.startsWith('NS107') || upper.startsWith('NS2526') || upper.startsWith('NS2618') || upper.startsWith('NS4') || upper.startsWith('ZS') || upper.startsWith('NG-CH') || upper.startsWith('NG-GAN') || upper.startsWith('NG-CC') || upper.includes('CHARG')) return 'Chargers';
  if (upper.startsWith('NS3416') || upper.startsWith('NS3604') || upper.startsWith('NG-SP') || upper.includes('SURGE') || upper.includes('SOCKET')) return 'Extension Sockets';
  if (upper.startsWith('NS6') || upper.includes('LIGHT')) return 'Motion-Activated Lights';
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
  marketId?: string;
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
export const PRODUCT_SKU_MAP: Record<string, { sku: string; skuId: string; priceMinorUnits: number; image: string }> = {
  '11111111-2222-3333-4444-555555555501': { sku: 'NG-EB-01', skuId: '11111111-2222-3333-4444-555555555511', priceMinorUnits: 2500000, image: '/assets/cat-earbuds.jpg' },
  '22222222-2222-3333-4444-555555555502': { sku: 'NG-PB-01', skuId: '22222222-2222-3333-4444-555555555512', priceMinorUnits: 3500000, image: '/assets/nigson-power.jpg' },
  '33333333-2222-3333-4444-555555555503': { sku: 'NG-CH-01', skuId: '33333333-2222-3333-4444-555555555513', priceMinorUnits: 1850000, image: '/assets/cat-charger.jpg' },
  '44444444-2222-3333-4444-555555555504': { sku: 'NG-CB-01', skuId: '44444444-2222-3333-4444-555555555514', priceMinorUnits: 550000, image: '/assets/cat-cable.jpg' },
  '55555555-2222-3333-4444-555555555505': { sku: 'NG-CC-01', skuId: '55555555-2222-3333-4444-555555555515', priceMinorUnits: 1500000, image: '/assets/shopcat/car-chargers.jpg' },
  '66666666-2222-3333-4444-555555555506': { sku: 'NG-SP-01', skuId: '66666666-2222-3333-4444-555555555516', priceMinorUnits: 1950000, image: '/assets/cat-powerbank.jpg' },
  '34c745d2-b6ad-4dab-8eda-4c295687b0c5': { sku: 'NG-GAN-100', skuId: '4eff5dd2-44ed-49fd-a715-5d3f5176f5ee', priceMinorUnits: 2800000, image: '/assets/cat-charger.jpg' },
  '3d84c1ea-b96c-45af-a665-1ef8c8cdc9dc': { sku: 'PQ28', skuId: '4886036e-574a-4bc3-aaaa-ee82af43cf1b', priceMinorUnits: 2400000, image: '/assets/cat-powerbank.jpg' }
};

export const DEFAULT_CATEGORIES: Category[] = [
  { id: '10000000-0000-0000-0000-000000000001', name: 'Earbuds', slug: 'earbuds', imageUrl: '/assets/cat-earbuds.jpg' },
  { id: '10000000-0000-0000-0000-000000000002', name: 'Power Banks', slug: 'power-banks', imageUrl: '/assets/cat-powerbank.jpg' },
  { id: '11111111-2222-3333-4444-555555555503', name: 'Cables', slug: 'cables', imageUrl: '/assets/cat-cable.jpg' },
  { id: '11111111-2222-3333-4444-555555555504', name: 'Chargers', slug: 'chargers', imageUrl: '/assets/cat-charger.jpg' },
  { id: '11111111-2222-3333-4444-555555555505', name: 'Extension Sockets', slug: 'extension-sockets', imageUrl: '/assets/cat-powerbank.jpg' }
];

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);

  // ─── Reactive state ──────────────────────────────────────────────────────

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>(DEFAULT_CATEGORIES);
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

  removeProductOverride(idOrSku: string): void {
    try {
      localStorage.removeItem(`nigson_prod_override_${idOrSku}`);
      const upper = idOrSku.toUpperCase();
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith('nigson_prod_override_')) {
          const val = localStorage.getItem(k);
          if (k.includes(idOrSku) || (val && (val.includes(idOrSku) || val.toUpperCase().includes(upper)))) {
            localStorage.removeItem(k);
          }
        }
      }
      this.products.update(all => all.filter(p => p.id !== idOrSku && p.sku !== idOrSku));
    } catch (e) {
      console.warn('[CatalogService] Error removing override', e);
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
      map(res => {
        const rawItems = res?.items || res?.content || [];
        const content: Product[] = rawItems.map((item: any) => {
          const skuInfo = PRODUCT_SKU_MAP[item.id] || Object.values(PRODUCT_SKU_MAP).find(x => x.sku === item.sku);
          const sku = item.sku || item.skus?.[0]?.code || skuInfo?.sku || extractSku(item.slug, item.name);
          const override = this.getProductOverride(item.id) || this.getProductOverride(sku);
          const cat = override?.categoryName || resolveCategoryFromSku(sku, item.brandName || 'General');
          const priceMinor = override?.priceMinorUnits ?? (override?.price != null ? override.price * 100 : (skuInfo?.priceMinorUnits ?? undefined));
          const primaryImg = override?.images?.[0] || (item.imageUrl ? this.resolveImageUrl(item.imageUrl) : (skuInfo?.image || this.imageFor(cat)));

          const p: Product = {
            id: item.id,
            sku: override?.sku || sku,
            skuId: item.skus?.[0]?.id || skuInfo?.skuId || item.id,
            name: override?.name || item.name,
            categoryId: override?.categoryId || cat,
            categoryName: cat,
            description: (override?.description || item.name || '').replace(/\s*<!--\[price:.*?\]-->/g, '').trim(),
            images: override?.images?.length ? override.images : (item.imageUrl ? [this.resolveImageUrl(item.imageUrl)] : [primaryImg]),
            priceMinorUnits: priceMinor,
            price: priceMinor == null ? undefined : priceMinor / 100,
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
      map(raw => {
        const sku = raw.sku || raw.skus?.[0]?.code || extractSku(raw.slug, raw.name);
        const override = this.getProductOverride(raw.id) || this.getProductOverride(sku) || (aliasSku ? this.getProductOverride(aliasSku) : null);
        const catName = raw.categories?.[0]?.name || resolveCategoryFromSku(sku);
        const priceMinor = override?.priceMinorUnits ?? (override?.price != null ? override.price * 100 : undefined);

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
          description: (override?.description || raw.description || '').replace(/\s*<!--\[price:.*?\]-->/g, '').trim(),
          publicationStatus: 'PUBLISHED',
          brand: override?.brand || raw.brand?.name || 'Nigson',
          ...override,
          specifications: {
            ...(raw.specifications || {}),
            ...(override?.specifications || {})
          },
          images: mergedImages,
          priceMinorUnits: priceMinor,
          price: priceMinor == null ? undefined : priceMinor / 100
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
    return this.http.get<any>('/api/v1/catalogue/categories?market=NG').pipe(
      map(res => {
        const list: any[] = Array.isArray(res) ? res : (res?.items || res?.content || res?.value || []);
        return list.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: this.CAT_IMG[c.name] || this.FALLBACK_IMG
        }));
      }),
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
  private priceCache = new Map<string, PriceResponse>();

  getPrice(skuId: string, quantity = 1): Observable<PriceResponse> {
    const key = `${skuId}_${quantity}`;
    if (this.priceCache.has(key)) {
      return of(this.priceCache.get(key)!);
    }
    return this.http.get<any>(`/api/v1/catalogue/skus/${skuId}/price?market=NG&quantity=${quantity}`).pipe(
      map(res => ({
        skuId: res.skuId,
        priceMinorUnits: Math.round(Number(res.unitAmount) * 100),
        currency: res.currency
      })),
  tap(res => this.priceCache.set(key, res))
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
    catchError(() => {
      // Fallback gracefully in development / test environments
      this.marketActive.set(true);
      return of(true);
    })
  );
}
}
