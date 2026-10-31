import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, tap, catchError, switchMap, map } from "rxjs";
import { SessionService } from "./session.service";

export interface CartLineItem {
  lineId: string;
  skuId: string;
  sku: string;
  name: string;
  unitPriceMinorUnits: number;
  quantity: number;
  imageUrl?: string;
  categoryName?: string;
}

export interface CartSummary {
  cartId: string;
  items: CartLineItem[];
  subtotalMinorUnits: number;
  currency: string;
  marketId: string;
  version: number;
}

interface BackendLine {
  id: string;
  skuId: string;
  quantity: string | number;
  sku?: string;
  name?: string;
  unitPriceMinorUnits?: number;
  imageUrl?: string;
  categoryName?: string;
}

interface BackendCart {
  id: string;
  marketId: string;
  organizationId: string | null;
  state: string;
  lines: BackendLine[];
  version: number;
  lastActivityAt: string;
  userId?: string;
}

export interface SkuMetadata {
  skuId: string;
  productId?: string;
  code: string;
  name: string;
  priceMinor: number;
  img: string;
  category: string;
}

const S3_PRODUCTS_BASE = 'http://localhost:4566/nigson-product-images/products';

const OFFICIAL_SKUS: SkuMetadata[] = [
  { skuId: 'ecac9622-ee78-5c52-8eb5-7c244e055d03', productId: '5570995e-1b59-5592-ba5c-fa95a0c02c20', code: 'NS03', name: 'NS03 Wireless Earbuds (TWS)', priceMinor: 1850000, img: `${S3_PRODUCTS_BASE}/ns03/img-1.png`, category: 'Earbuds' },
  { skuId: 'c52cf637-25d0-5eb6-862a-e737389c7ad4', productId: '8ba363e8-815a-52ee-be26-74da166eba83', code: 'NS06', name: 'NS06 ANC/ENC Wireless Earbuds', priceMinor: 2850000, img: `${S3_PRODUCTS_BASE}/ns06/img-1.png`, category: 'Earbuds' },
  { skuId: '63573bb9-a11d-542a-97aa-ca6cb2c92290', productId: '41934e70-179f-5c0a-9498-28c8b6a4fd9f', code: 'NS107', name: 'NS107 High-Power Car Charger with Retractable Cable', priceMinor: 1650000, img: `${S3_PRODUCTS_BASE}/ns107/img-1.png`, category: 'Chargers' },
  { skuId: '4907f781-8654-5559-88cf-1ce35df2cb15', productId: 'bff4b7e3-8e19-566b-9c95-bc941390f84f', code: 'NS211C', name: 'NS211C Type-C to Type-C PD65W Cable', priceMinor: 550000, img: `${S3_PRODUCTS_BASE}/ns211c/img-1.png`, category: 'Cables' },
  { skuId: 'c3002b2f-4326-59ec-b460-09ba406bc800', productId: '3bd11da9-6a93-5f56-ae87-8afdad3d52ab', code: 'NS211i', name: 'NS211i Type-C to Lightning PD30W Cable', priceMinor: 480000, img: `${S3_PRODUCTS_BASE}/ns211i/img-1.png`, category: 'Cables' },
  { skuId: 'f65f2023-ef23-53ca-bfa2-8b40877ed658', productId: '1908dc43-accf-5578-870c-ec519d73367c', code: 'NS25', name: 'NS25 4-in-1 Charging Cable', priceMinor: 650000, img: `${S3_PRODUCTS_BASE}/ns25/img-1.png`, category: 'Cables' },
  { skuId: '812f8742-6c94-5b92-a313-f0c0fdee9559', productId: '51c9cd3c-5d6c-5049-b821-d80c7c512305', code: 'NS2526C', name: 'NS2526C High Power Fast Wall Charger, GaN65W', priceMinor: 2450000, img: `${S3_PRODUCTS_BASE}/ns2526c/img-1.png`, category: 'Chargers' },
  { skuId: 'b5cf3ecb-5ed0-5e6f-9cea-4da88f91baa3', productId: '1fc9d7b4-1716-54fb-905a-ea5a80620a07', code: 'NS2618', name: 'NS2618 All-in-One Universal Multiway Adapter, GaN65W', priceMinor: 2950000, img: `${S3_PRODUCTS_BASE}/ns2618/img-1.png`, category: 'Chargers' },
  { skuId: 'c4f089fb-7a27-5b3e-bc02-f9565d5653ff', productId: '28cd1e1a-bc40-5728-bf56-4c785b8613f2', code: 'NS3416', name: 'NS3416 65W GaN Power Socket', priceMinor: 3200000, img: `${S3_PRODUCTS_BASE}/ns3416/img-1.png`, category: 'Extension Sockets' },
  { skuId: '51c2d6f5-82ae-5eae-8f5d-5975fd7318fc', productId: 'cd9acab9-5bce-5274-a051-773e756d1b0e', code: 'NS3604C', name: 'NS3604C Multi-Socket Extension Box', priceMinor: 2750000, img: `${S3_PRODUCTS_BASE}/ns3604c/img-1.png`, category: 'Extension Sockets' },
  { skuId: 'b9f0156b-c3d2-5bf6-8113-b88f83c01e6d', productId: '95be469d-489f-5d09-9308-18f6941e4d41', code: 'NS4', name: 'NS4 Home Charger', priceMinor: 950000, img: `${S3_PRODUCTS_BASE}/ns4/img-1.png`, category: 'Chargers' },
  { skuId: 'e5e75b4f-26fa-56bd-a68f-c10aa50082f3', productId: '240af070-7cac-5840-93f7-731aff6bf976', code: 'NS6', name: 'NS6 Large Motion-Activated Cabinet Light (410MM)', priceMinor: 1950000, img: `${S3_PRODUCTS_BASE}/ns6/img-1.png`, category: 'Motion-Activated Lights' },
  { skuId: '4af2eb38-f4cc-5bc0-b182-01e667ed00b7', productId: '82478136-b526-5238-94c9-d076af6ebc47', code: 'NS6-1', name: 'NS6-1 Medium Motion-Activated Cabinet Light (220MM)', priceMinor: 1450000, img: `${S3_PRODUCTS_BASE}/ns6_1/img-1.png`, category: 'Motion-Activated Lights' },
  { skuId: '21d1fa9a-6d1e-54fb-98e0-72439394fe00', productId: '0a51dae9-2795-507b-84a6-100c06513332', code: 'NS901C', name: 'NS901C Type-C to Type-C Charging Cable', priceMinor: 450000, img: `${S3_PRODUCTS_BASE}/ns901c/img-1.png`, category: 'Cables' },
  { skuId: '70bdf50e-781f-5578-9afb-bcf69125a1f3', productId: '0de50201-b6bf-5270-b7d4-79766c7f9447', code: 'NS901i', name: 'NS901i Type-C to Lightning Charging Cable', priceMinor: 420000, img: `${S3_PRODUCTS_BASE}/ns901i/img-1.png`, category: 'Cables' },
  { skuId: '49aca633-ca39-5771-aabd-0cd1448db881', productId: '033336d7-5025-5112-9af2-726e6e02caf4', code: 'NS96U', name: 'NS96U 3-in-1 Charging Cable', priceMinor: 520000, img: `${S3_PRODUCTS_BASE}/ns96u/img-1.png`, category: 'Cables' },
  { skuId: '04ae2d72-94ab-5ff8-82a4-28272755ee75', productId: 'fee9c518-4071-5aa7-a72b-6ed0ed1b83d3', code: 'PQ19', name: 'PQ19 Power Bank, 10,000mAh', priceMinor: 1650000, img: `${S3_PRODUCTS_BASE}/pq19/img-1.png`, category: 'Power Banks' },
  { skuId: '75e0a2eb-54e6-552e-b99c-a956f8557592', productId: '1bac82ef-a37c-56b7-a290-afbddbd914a5', code: 'PQ20', name: 'PQ20 Power Bank, 20,000mAh', priceMinor: 2650000, img: `${S3_PRODUCTS_BASE}/pq20/img-1.png`, category: 'Power Banks' },
  { skuId: '7faca25c-8831-5149-84e4-47e037580cac', productId: '4ad4e90d-ec4e-5caa-f7ad88e19e29', code: 'PQ28', name: 'PQ28 Magnetic Wireless Power Bank, 5,000mAh', priceMinor: 1950000, img: `${S3_PRODUCTS_BASE}/pq28/img-1.jpeg`, category: 'Power Banks' },
  { skuId: '3e82bda0-2606-580f-98ef-a01e322d325a', productId: 'c7db7adb-726b-5173-a385-004b258ea128', code: 'PQ30', name: 'PQ30 Power Bank, 30,000mAh', priceMinor: 3450000, img: `${S3_PRODUCTS_BASE}/pq30/img-1.png`, category: 'Power Banks' },
  { skuId: '3882394e-69bd-5c71-9b14-fcf7a82481bd', productId: 'c995e043-e1e8-5979-b4ea-e6d1dedc7322', code: 'PQ50', name: 'PQ50 Power Bank, 50,000mAh', priceMinor: 4850000, img: `${S3_PRODUCTS_BASE}/pq50/img-1.png`, category: 'Power Banks' },
  { skuId: 'ecbe959f-d3e9-5f25-8cb5-1718bf14972e', productId: '4351a029-79f9-57e0-94e8-466d7ad4ef19', code: 'ZS6', name: 'ZS6 Multi-Device Desktop Fast Charger', priceMinor: 2650000, img: `${S3_PRODUCTS_BASE}/zs6/img-1.png`, category: 'Chargers' },
  { skuId: '0df9e4fb-2794-55fe-a1f9-d8977114b7e9', productId: 'fa096df5-7313-5a7a-aa01-4475ee45b98f', code: 'ZS8', name: 'ZS8 Ultra-Fast GaN Travel Charger 65W', priceMinor: 2150000, img: `${S3_PRODUCTS_BASE}/zs8/img-1.png`, category: 'Chargers' }
];

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  readonly items = signal<CartLineItem[]>([]);
  readonly savedItems = signal<CartLineItem[]>([]);
  readonly cartId = signal<string | null>(null);
  readonly cartVersion = signal<number>(1);
  readonly loading = signal(false);
  readonly syncing = signal(false);

  readonly itemCount = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly subtotalNaira = computed(() =>
    this.items().reduce((n, i) => n + (i.unitPriceMinorUnits * i.quantity) / 100, 0)
  );
  readonly subtotalDisplay = computed(() =>
    String.fromCharCode(8358) + this.subtotalNaira().toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  constructor() {
    effect(() => {
      const isAuth = this.session.authenticated();
      const uid = this.session.userId();
      if (isAuth && uid) {
        this.handleUserLogin(uid);
      } else if (!isAuth) {
        this.handleUserLogout();
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    const uid = this.session.userId() || this.session.email() || 'default_user';
    headers = headers.set('x-user-id', uid);
    const email = this.session.email();
    if (email) headers = headers.set('x-user-email', email);
    return headers;
  }

  private handleUserLogin(userId: string) {
    this.loadCart().subscribe();
  }

  private handleUserLogout() {
    this.cartId.set(null);
    this.cartVersion.set(1);
    sessionStorage.removeItem('nigson_active_cart_id');
    this.items.set([]);
  }

  private resolveSkuMetadata(input: string, fallback?: Partial<SkuMetadata>): SkuMetadata {
    const found = OFFICIAL_SKUS.find(s => 
      s.skuId === input || 
      s.code === input || 
      (s.productId && s.productId === input) ||
      s.code.toLowerCase() === input.toLowerCase()
    );
    if (found) {
      return {
        ...found,
        name: fallback?.name || found.name,
        priceMinor: (fallback?.priceMinor != null && fallback.priceMinor > 0) ? fallback.priceMinor : found.priceMinor,
        img: fallback?.img || found.img,
        category: fallback?.category || found.category
      };
    }
    return {
      skuId: input,
      code: fallback?.code || input,
      name: fallback?.name || `Product (${input.slice(0, 8)})`,
      priceMinor: (fallback?.priceMinor != null && fallback.priceMinor > 0) ? fallback.priceMinor : 2850000,
      img: fallback?.img || '/assets/hero-accessories.jpg',
      category: fallback?.category || 'General'
    };
  }

  ensureCart(): Observable<string | null> {
    if (!this.session.authenticated()) return of(null);
    if (this.cartId()) return of(this.cartId());

    const storedId = sessionStorage.getItem('nigson_active_cart_id');
    const headers = this.getAuthHeaders();

    if (storedId) {
      return this.http.get<BackendCart>(`/api/v1/carts/${storedId}`, { headers }).pipe(
        tap(cart => {
          this.cartId.set(cart.id);
          this.cartVersion.set(cart.version || 1);
          this.items.set(this.mapLines(cart.lines));
        }),
        map(cart => cart.id),
        catchError(() => this.createNewCart())
      );
    }
    return this.createNewCart();
  }

  private createNewCart(): Observable<string | null> {
    const headers = this.getAuthHeaders().set('Idempotency-Key', crypto.randomUUID());
    return this.http.post<BackendCart>('/api/v1/carts', { marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6' }, { headers }).pipe(
      tap(cart => {
        this.cartId.set(cart.id);
        this.cartVersion.set(cart.version || 1);
        sessionStorage.setItem('nigson_active_cart_id', cart.id);
        this.items.set(this.mapLines(cart.lines));
      }),
      map(cart => cart.id),
      catchError(err => {
        console.warn('[CartService] createNewCart database error:', err);
        return of(null);
      })
    );
  }

  loadCart(): Observable<CartSummary | null> {
    if (!this.session.authenticated()) {
      this.items.set([]);
      this.cartId.set(null);
      return of(null);
    }
    this.loading.set(true);
    return this.ensureCart().pipe(
      switchMap(cartId => {
        if (!cartId) {
          this.loading.set(false);
          return of(null);
        }
        const headers = this.getAuthHeaders();
        return this.http.get<BackendCart>(`/api/v1/carts/${cartId}`, { headers }).pipe(
          map(cart => {
            this.cartId.set(cart.id);
            this.cartVersion.set(cart.version || 1);
            const mapped = this.mapLines(cart.lines);
            this.items.set(mapped);
            this.loading.set(false);
            const summary: CartSummary = {
              cartId: cart.id,
              items: mapped,
              subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
              currency: 'NGN',
              marketId: cart.marketId,
              version: cart.version || 1
            };
            return summary;
          }),
          catchError(err => {
            console.warn('[CartService] loadCart database error:', err);
            this.loading.set(false);
            return of(null);
          })
        );
      })
    );
  }

  addItem(skuId: string, quantity = 1, details?: { sku?: string; name?: string; category?: string; priceMinor?: number; image?: string }): Observable<CartSummary | null> {
    if (!this.session.authenticated()) {
      this.session.signIn(window.location.pathname);
      return of(null);
    }

    this.syncing.set(true);
    return this.ensureCart().pipe(
      switchMap(cartId => {
        if (!cartId) {
          this.syncing.set(false);
          return of(null);
        }
        const currentLine = this.items().find(i => i.skuId === skuId || i.sku === skuId);
        const targetQty = (currentLine?.quantity || 0) + quantity;

        const headers = this.getAuthHeaders();
        return this.http.put<BackendCart>(
          `/api/v1/carts/${cartId}/lines/${skuId}`,
          { quantity: targetQty },
          { headers }
        ).pipe(
          map(cart => {
            this.cartId.set(cart.id);
            this.cartVersion.set(cart.version || 1);
            const mapped = this.mapLines(cart.lines);
            this.items.set(mapped);
            this.syncing.set(false);
            return {
              cartId: cart.id,
              items: mapped,
              subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
              currency: 'NGN',
              marketId: cart.marketId,
              version: cart.version || 1
            };
          }),
          catchError(err => {
            console.error('[CartService] addItem database sync error:', err);
            this.syncing.set(false);
            return of(null);
          })
        );
      })
    );
  }

  updateQty(lineIdOrSku: string, quantity: number): Observable<CartSummary | null> {
    if (!this.session.authenticated() || !this.cartId()) {
      return of(null);
    }
    if (quantity <= 0) {
      return this.removeItem(lineIdOrSku);
    }
    const it = this.items().find(i => i.lineId === lineIdOrSku || i.skuId === lineIdOrSku || i.sku === lineIdOrSku);
    if (!it) return of(null);

    this.syncing.set(true);
    const headers = this.getAuthHeaders();
    return this.http.put<BackendCart>(
      `/api/v1/carts/${this.cartId()}/lines/${it.skuId || it.sku}`,
      { quantity: quantity },
      { headers }
    ).pipe(
      map(cart => {
        this.cartVersion.set(cart.version || 1);
        const mapped = this.mapLines(cart.lines);
        this.items.set(mapped);
        this.syncing.set(false);
        return {
          cartId: cart.id,
          items: mapped,
          subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
          currency: 'NGN',
          marketId: cart.marketId,
          version: cart.version || 1
        };
      }),
      catchError(err => {
        console.error('[CartService] updateQty database error:', err);
        this.syncing.set(false);
        return of(null);
      })
    );
  }

  removeItem(lineOrSkuId: string): Observable<CartSummary | null> {
    if (!this.session.authenticated() || !this.cartId()) {
      return of(null);
    }
    const currentItems = this.items();
    const it = currentItems.find(i => i.lineId === lineOrSkuId || i.skuId === lineOrSkuId || i.sku === lineOrSkuId);
    if (!it) return of(null);

    this.syncing.set(true);
    const headers = this.getAuthHeaders();

    return this.http.delete<void>(
      `/api/v1/carts/${this.cartId()}/lines/${it.skuId || it.sku}`,
      { headers, observe: 'response' }
    ).pipe(
      switchMap(() => this.loadCart()),
      catchError(err => {
        console.warn('[CartService] removeItem database error:', err);
        this.syncing.set(false);
        return of(null);
      })
    );
  }

  clearCart(): Observable<void> {
    this.items.set([]);
    if (this.session.authenticated() && this.cartId()) {
      const headers = this.getAuthHeaders();
      const id = this.cartId();
      sessionStorage.removeItem('nigson_active_cart_id');
      this.cartId.set(null);
      return this.http.delete<void>(`/api/v1/carts/${id}`, { headers }).pipe(
        catchError(() => of(undefined))
      );
    }
    return of(undefined);
  }

  saveForLater(lineId: string): Observable<unknown> {
    const it = this.items().find(i => i.lineId === lineId);
    if (it) {
      this.savedItems.update(s => [...s, it]);
      return this.removeItem(lineId);
    }
    return of(null);
  }

  loadSaved(): Observable<CartLineItem[]> {
    return of(this.savedItems());
  }

  moveToCart(skuId: string): Observable<CartSummary | null> {
    const it = this.savedItems().find(s => s.skuId === skuId || s.sku === skuId);
    if (it) {
      this.savedItems.update(s => s.filter(x => x.skuId !== it.skuId));
      return this.addItem(it.skuId, it.quantity);
    }
    return of(null);
  }

  lineForSku(skuId: string): CartLineItem | undefined {
    return this.items().find(i => i.skuId === skuId || i.sku === skuId);
  }

  formatPrice(minorUnits: number): string {
    return String.fromCharCode(8358) + (minorUnits / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private mapLines(lines: BackendLine[]): CartLineItem[] {
    return (lines || []).map(line => {
      const meta = this.resolveSkuMetadata(line.skuId);
      return {
        lineId: line.id || ('line-' + Math.random().toString(36).substring(2, 9)),
        skuId: line.skuId,
        sku: (line as any).sku || meta.code,
        name: (line as any).name || meta.name,
        unitPriceMinorUnits: Number((line as any).unitPriceMinorUnits) || meta.priceMinor,
        quantity: parseInt(String(line.quantity), 10) || 1,
        imageUrl: (line as any).imageUrl || meta.img,
        categoryName: (line as any).categoryName || meta.category
      };
    });
  }
}
