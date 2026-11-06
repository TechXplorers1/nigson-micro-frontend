import { Injectable, inject, signal, computed, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { CartService } from './cart.service';

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

// ─── Synthetic Demo Products Metadata Map ────────────────────────────────────
export const DEMO_SKU_MAP: Record<string, { code: string; skuId: string; productId: string; category: string; name: string }> = {
  'demo-14-inch-ultrabook': { code: 'DEMO-EL-01-01', skuId: '8dd03db8-c840-5da9-a005-67174d5272fc', productId: 'afb3c9bf-4885-5f5b-b929-a0ea7cb76df2', category: 'Laptops', name: 'Demo 14-inch Ultrabook' },
  'demo-15-inch-performance-laptop': { code: 'DEMO-EL-01-02', skuId: 'dd3573ba-5a3a-5c20-be9c-c3265f48e7dc', productId: '7fad7d19-05f3-5517-8cfb-9b609eaa64f3', category: 'Laptops', name: 'Demo 15-inch Performance Laptop' },
  'demo-13-inch-student-laptop': { code: 'DEMO-EL-01-03', skuId: '024bcad4-81c6-5379-97d2-947e77a9a8c4', productId: '16378b8b-e963-54ad-bfd0-27039459ca47', category: 'Laptops', name: 'Demo 13-inch Student Laptop' },
  'demo-5g-smartphone-128-gb': { code: 'DEMO-EL-02-01', skuId: 'c9122607-2f48-5329-b497-70725334813b', productId: 'ab80d37e-4dca-5e9f-8aa6-461bba6d991b', category: 'Smartphones', name: 'Demo 5G Smartphone 128 GB' },
  'demo-pro-smartphone-256-gb': { code: 'DEMO-EL-02-02', skuId: 'c59b5e73-0da1-5ba9-98cd-7f183ffb59ef', productId: '6babee4f-7b82-562f-89a6-3a64334f6c22', category: 'Smartphones', name: 'Demo Pro Smartphone 256 GB' },
  'demo-compact-smartphone-64-gb': { code: 'DEMO-EL-02-03', skuId: 'b546d4f3-4605-5016-90dd-36a0168a3452', productId: '7b76a39b-85bf-5490-92bd-d0f54b96f1c6', category: 'Smartphones', name: 'Demo Compact Smartphone 64 GB' },
  'demo-10-inch-android-tablet': { code: 'DEMO-EL-03-01', skuId: '13b3215c-6a3f-538e-afb7-530d96a5ac4a', productId: '8a3a8400-13c3-5111-9795-755942a20863', category: 'Tablets', name: 'Demo 10-inch Android Tablet' },
  'demo-11-inch-drawing-tablet': { code: 'DEMO-EL-03-02', skuId: 'ac5217b8-d5af-58ab-bff5-0b6462adb152', productId: 'da31161c-eef2-518d-a4e8-1dfb6d277628', category: 'Tablets', name: 'Demo 11-inch Drawing Tablet' },
  'demo-8-inch-kids-tablet': { code: 'DEMO-EL-03-03', skuId: '613216bb-4795-5039-b0f2-0df2a01528f8', productId: '7448afea-6817-50af-b242-b49c2c0ebb6d', category: 'Tablets', name: 'Demo 8-inch Kids Tablet' },
  'demo-wireless-noise-cancelling-headphones': { code: 'DEMO-EL-04-01', skuId: 'b38607c1-f008-5923-8e29-0de559560329', productId: 'cfae03e5-b480-52e6-9fed-df8b23a3a12b', category: 'Audio', name: 'Demo Wireless Noise-Cancelling Headphones' },
  'demo-true-wireless-earbuds': { code: 'DEMO-EL-04-02', skuId: '03538c8a-5dcb-5d1a-a5e1-9d1670ba9620', productId: '1137ba42-7718-5f64-9461-9900d52e68b7', category: 'Audio', name: 'Demo True Wireless Earbuds' },
  'demo-portable-bluetooth-speaker': { code: 'DEMO-EL-04-03', skuId: '877d2857-7d5a-5472-bced-8c938c564905', productId: '5444f3bc-4e84-50ed-9903-042087710f0e', category: 'Audio', name: 'Demo Portable Bluetooth Speaker' },
  'demo-mechanical-gaming-keyboard': { code: 'DEMO-EL-05-01', skuId: 'a4240469-5751-5ee3-b11e-423b5bcd1df1', productId: '729cc696-6588-59b7-aad3-75a268413ca3', category: 'Gaming', name: 'Demo Mechanical Gaming Keyboard' },
  'demo-wireless-gaming-mouse': { code: 'DEMO-EL-05-02', skuId: '0677c163-e73d-5c80-bfa4-93c0a255e882', productId: 'b720ab55-fe00-55ec-b112-fce043589208', category: 'Gaming', name: 'Demo Wireless Gaming Mouse' },
  'demo-27-inch-gaming-monitor': { code: 'DEMO-EL-05-03', skuId: 'b4a11381-8921-50b8-b979-aa303945a1eb', productId: 'd45b7897-222c-54ba-9ef8-9c3640dfa4ed', category: 'Gaming', name: 'Demo 27-inch Gaming Monitor' },
  'demo-wi-fi-6-dual-band-router': { code: 'DEMO-EL-06-01', skuId: '29f666d2-5b32-5564-a5cf-f095215c81b3', productId: '8fced558-b0fa-58f1-8dd5-dbe2f012ef8e', category: 'Networking', name: 'Demo Wi-Fi 6 Dual-Band Router' },
  'demo-8-port-gigabit-switch': { code: 'DEMO-EL-06-02', skuId: 'd7d48669-6d1d-5b96-bc0b-d146de217738', productId: '8dec8340-6b04-54d9-80fa-01ad2943d7dd', category: 'Networking', name: 'Demo 8-Port Gigabit Switch' },
  'demo-usb-wi-fi-adapter': { code: 'DEMO-EL-06-03', skuId: 'b0c7bd40-d1b8-546f-8bdc-c2194894d605', productId: '7d9c70a9-2a25-5c51-9b8a-67685dcbd7a7', category: 'Networking', name: 'Demo USB Wi-Fi Adapter' },
  'demo-1-tb-portable-ssd': { code: 'DEMO-EL-07-01', skuId: '3ac8e4e4-49c7-549c-958f-9051347f33d2', productId: '65604e71-466b-5ffa-8293-3cbacd038b62', category: 'Storage', name: 'Demo 1 TB Portable SSD' },
  'demo-2-tb-external-hard-drive': { code: 'DEMO-EL-07-02', skuId: 'e96bcd85-3620-5858-8dda-acfda62ff3b6', productId: '2f85101c-1c36-5f86-a3b1-e382aec189f4', category: 'Storage', name: 'Demo 2 TB External Hard Drive' },
  'demo-128-gb-usb-flash-drive': { code: 'DEMO-EL-07-03', skuId: '4fc83b37-fd00-547d-8c67-129976973011', productId: '961350eb-4b06-5081-9840-7fa09679d95e', category: 'Storage', name: 'Demo 128 GB USB Flash Drive' },
  'demo-65-w-usb-c-gan-charger': { code: 'DEMO-EL-08-01', skuId: '7ddfd7c5-0e32-5482-80d6-05f656854a11', productId: '29c5d453-66c5-527a-818a-2f4da2b022a6', category: 'Power and Accessories', name: 'Demo 65 W USB-C GaN Charger' },
  'demo-20000-mah-power-bank': { code: 'DEMO-EL-08-02', skuId: 'd9a0ad9d-c004-572b-af94-86cb6618222d', productId: '716b41e5-0bcf-5d17-85b6-b601d6c5c0a5', category: 'Power and Accessories', name: 'Demo 20000 mAh Power Bank' },
  'demo-6-outlet-surge-protector': { code: 'DEMO-EL-08-03', skuId: 'e286c2ac-8c4a-5838-bc0a-dbbdccd1a68a', productId: '5aa7e4a1-d035-56cd-aeab-465f2cd64dee', category: 'Power and Accessories', name: 'Demo 6-Outlet Surge Protector' }
};

export function extractSku(slug?: string, name?: string): string {
  if (slug) {
    const clean = slug.toLowerCase().replace(/^nigson-/, '');
    if (DEMO_SKU_MAP[clean]) return DEMO_SKU_MAP[clean].code;
    if (clean.startsWith('ns6-1')) return 'NS6-1';
    if (clean.startsWith('ns2526c')) return 'NS2526C';
    if (clean.startsWith('ns3604c')) return 'NS3604C';
    if (clean.startsWith('ns211c')) return 'NS211C';
    if (clean.startsWith('ns211i')) return 'NS211i';
    if (clean.startsWith('ns901c')) return 'NS901C';
    if (clean.startsWith('ns901i')) return 'NS901i';
    if (clean.startsWith('ns96u')) return 'NS96U';
    if (clean.startsWith('demo-')) {
      return clean.replace(/^demo-/, 'DEMO-').toUpperCase();
    }
    return clean.split('-')[0].toUpperCase();
  }
  if (name) {
    const cleanNameSlug = 'demo-' + name.toLowerCase().replace(/^demo\s+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (DEMO_SKU_MAP[cleanNameSlug]) return DEMO_SKU_MAP[cleanNameSlug].code;
    return name.split(' ')[0].toUpperCase();
  }
  return 'NG-SKU';
}

export function resolveCategoryFromSku(sku: string, fallback = 'General'): string {
  const upper = (sku || '').toUpperCase();
  if (upper.startsWith('DEMO-EL-01')) return 'Laptops';
  if (upper.startsWith('DEMO-EL-02')) return 'Smartphones';
  if (upper.startsWith('DEMO-EL-03')) return 'Tablets';
  if (upper.startsWith('DEMO-EL-04')) return 'Audio';
  if (upper.startsWith('DEMO-EL-05')) return 'Gaming';
  if (upper.startsWith('DEMO-EL-06')) return 'Networking';
  if (upper.startsWith('DEMO-EL-07')) return 'Storage';
  if (upper.startsWith('DEMO-EL-08')) return 'Power and Accessories';
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
@Injectable({ providedIn: 'root' })
export class CatalogService {
  private http = inject(HttpClient);
  private injector = inject(Injector);

  private syncWithCart(products: Product[]) {
    try {
      const cartSvc = this.injector.get(CartService, null, { optional: true });
      if (cartSvc) {
        for (const p of products) {
          if (p?.skuId) {
            cartSvc.registerSkuMetadata({
              skuId: p.skuId,
              productId: p.id,
              code: p.sku,
              name: p.name,
              priceMinor: p.priceMinorUnits ?? 0,
              img: this.primaryImage(p),
              category: p.categoryName || 'General'
            });
          }
        }
      }
    } catch {}
  }

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
          const cleanSlug = (item.slug || '').toLowerCase().replace(/^nigson-/, '');
          const demoInfo = DEMO_SKU_MAP[cleanSlug] || Object.values(DEMO_SKU_MAP).find(d => d.productId === item.id);
          const sku = item.sku || item.skus?.[0]?.code || demoInfo?.code || extractSku(item.slug, item.name);
          const override = this.getProductOverride(item.id) || this.getProductOverride(sku);
          const priceMinor = override?.priceMinorUnits ?? (override?.price != null ? override.price * 100 : undefined);
          const primaryImg = override?.images?.[0] || (item.imageUrl ? this.resolveImageUrl(item.imageUrl) : this.FALLBACK_IMG);
          const cat = override?.categoryName || demoInfo?.category || resolveCategoryFromSku(sku, item.brandName || 'General');

          const p: Product = {
            id: item.id,
            sku: override?.sku || sku,
            skuId: item.skus?.[0]?.id || demoInfo?.skuId || item.id,
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
        this.syncWithCart(enriched);
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
        const cleanSlug = (raw.slug || '').toLowerCase().replace(/^nigson-/, '');
        const demoInfo = DEMO_SKU_MAP[cleanSlug] || Object.values(DEMO_SKU_MAP).find(d => d.productId === raw.id);
        const sku = raw.sku || raw.skus?.[0]?.code || demoInfo?.code || extractSku(raw.slug, raw.name);
        const override = this.getProductOverride(raw.id) || this.getProductOverride(sku) || (aliasSku ? this.getProductOverride(aliasSku) : null);
        const catName = raw.categories?.[0]?.name || demoInfo?.category || resolveCategoryFromSku(sku);
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
        const finalP = this.enrichWithCategories([p])[0];
        this.syncWithCart([finalP]);
        return finalP;
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
