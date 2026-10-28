import { Injectable, inject, signal, computed } from "@angular/core";
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
  quantity: string;
}

interface BackendCart {
  id: string;
  marketId: string;
  organizationId: string | null;
  state: string;
  lines: BackendLine[];
  version: number;
  lastActivityAt: string;
}

const KNOWN_SKUS: Record<string, { code: string; name: string; priceMinor: number; img: string; category: string }> = {
  '55555555-2222-3333-4444-555555555501': {
    code: 'NG-PB-20K',
    name: 'Nigson 20000mAh Ultra-Fast Power Bank',
    priceMinor: 2850000,
    img: '/assets/cat-powerbank.jpg',
    category: 'Power Banks'
  },
  '55555555-2222-3333-4444-555555555502': {
    code: 'NG-CB-01',
    name: 'Nigson Armored Braided Type-C Cable (2m)',
    priceMinor: 450000,
    img: '/assets/cat-cable.jpg',
    category: 'Cables & Adapters'
  },
  '55555555-2222-3333-4444-555555555503': {
    code: 'NG-CC-01',
    name: 'Nigson MagSafe 15W Wireless Car Charger',
    priceMinor: 1280000,
    img: '/assets/cat-charger.jpg',
    category: 'Fast Chargers'
  },
  '55555555-2222-3333-4444-555555555504': {
    code: 'NG-EB-01',
    name: 'Nigson SoundPulse ANC Wireless Earbuds',
    priceMinor: 2200000,
    img: '/assets/cat-earbuds.jpg',
    category: 'Earbuds'
  }
};

@Injectable({ providedIn: "root" })
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

  ensureCart(): Observable<string | null> {
    if (!this.session.authenticated()) return of(null);
    if (this.cartId()) return of(this.cartId());

    const storedId = sessionStorage.getItem('nigson_active_cart_id');
    if (storedId) {
      return this.http.get<BackendCart>(`/api/v1/carts/${storedId}`).pipe(
        tap(cart => {
          this.cartId.set(cart.id);
          this.cartVersion.set(cart.version);
          this.items.set(this.mapLines(cart.lines));
        }),
        map(cart => cart.id),
        catchError(() => this.createNewCart())
      );
    }
    return this.createNewCart();
  }

  private createNewCart(): Observable<string | null> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    });
    return this.http.post<BackendCart>('/api/v1/carts', { marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6' }, { headers }).pipe(
      tap(cart => {
        this.cartId.set(cart.id);
        this.cartVersion.set(cart.version);
        sessionStorage.setItem('nigson_active_cart_id', cart.id);
        this.items.set(this.mapLines(cart.lines));
      }),
      map(cart => cart.id),
      catchError(err => {
        console.error('[CartService] createNewCart failed:', err);
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
        return this.http.get<BackendCart>(`/api/v1/carts/${cartId}`).pipe(
          map(cart => {
            this.cartId.set(cart.id);
            this.cartVersion.set(cart.version);
            const mapped = this.mapLines(cart.lines);
            this.items.set(mapped);
            this.loading.set(false);
            const summary: CartSummary = {
              cartId: cart.id,
              items: mapped,
              subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
              currency: 'NGN',
              marketId: cart.marketId,
              version: cart.version
            };
            return summary;
          }),
          catchError(err => {
            console.error('[CartService] loadCart failed:', err);
            this.loading.set(false);
            return of(null);
          })
        );
      })
    );
  }

  addItem(skuId: string, quantity = 1): Observable<CartSummary | null> {
    if (!this.session.authenticated()) return of(null);
    this.syncing.set(true);

    // Resolve sku UUID if sku code was passed
    const resolvedSkuId = this.resolveSkuId(skuId);

    return this.ensureCart().pipe(
      switchMap(cartId => {
        if (!cartId) {
          this.syncing.set(false);
          return of(null);
        }
        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'If-Match': `"${this.cartVersion()}"`,
          'Idempotency-Key': crypto.randomUUID()
        });
        return this.http.put<BackendCart>(
          `/api/v1/carts/${cartId}/lines/${resolvedSkuId}`,
          { quantity: String(quantity) },
          { headers }
        ).pipe(
          map(cart => {
            this.cartId.set(cart.id);
            this.cartVersion.set(cart.version);
            const mapped = this.mapLines(cart.lines);
            this.items.set(mapped);
            this.syncing.set(false);
            return {
              cartId: cart.id,
              items: mapped,
              subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
              currency: 'NGN',
              marketId: cart.marketId,
              version: cart.version
            };
          }),
          catchError(err => {
            console.error('[CartService] addItem failed:', err);
            this.syncing.set(false);
            return of(null);
          })
        );
      })
    );
  }

  updateQty(lineId: string, quantity: number): Observable<CartSummary | null> {
    if (quantity <= 0) return this.removeItem(lineId);
    const it = this.items().find(i => i.lineId === lineId || i.skuId === lineId || i.sku === lineId);
    if (!it || !this.cartId()) return of(null);

    this.syncing.set(true);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': `"${this.cartVersion()}"`,
      'Idempotency-Key': crypto.randomUUID()
    });

    return this.http.put<BackendCart>(
      `/api/v1/carts/${this.cartId()}/lines/${it.skuId}`,
      { quantity: String(quantity) },
      { headers }
    ).pipe(
      map(cart => {
        this.cartVersion.set(cart.version);
        const mapped = this.mapLines(cart.lines);
        this.items.set(mapped);
        this.syncing.set(false);
        return {
          cartId: cart.id,
          items: mapped,
          subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
          currency: 'NGN',
          marketId: cart.marketId,
          version: cart.version
        };
      }),
      catchError(err => {
        console.error('[CartService] updateQty failed:', err);
        this.syncing.set(false);
        return of(null);
      })
    );
  }

  removeItem(lineId: string): Observable<CartSummary | null> {
    const it = this.items().find(i => i.lineId === lineId || i.skuId === lineId || i.sku === lineId);
    if (!it || !this.cartId()) return of(null);

    this.syncing.set(true);
    const headers = new HttpHeaders({
      'If-Match': `"${this.cartVersion()}"`,
      'Idempotency-Key': crypto.randomUUID()
    });

    return this.http.delete<void>(
      `/api/v1/carts/${this.cartId()}/lines/${it.skuId}`,
      { headers, observe: 'response' }
    ).pipe(
      map(res => {
        const etag = res.headers.get('ETag');
        if (etag) {
          const v = parseInt(etag.replace(/"/g, ''), 10);
          if (!isNaN(v)) this.cartVersion.set(v);
        } else {
          this.cartVersion.update(v => v + 1);
        }
        this.items.update(items => items.filter(i => i.lineId !== it.lineId));
        this.syncing.set(false);
        return {
          cartId: this.cartId()!,
          items: this.items(),
          subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
          currency: 'NGN',
          marketId: 'NG',
          version: this.cartVersion()
        };
      }),
      catchError(err => {
        console.error('[CartService] removeItem failed:', err);
        this.syncing.set(false);
        return of(null);
      })
    );
  }

  clearCart(): Observable<void> {
    const current = this.items();
    if (!current.length || !this.cartId()) {
      this.items.set([]);
      return of(undefined);
    }
    this.syncing.set(true);
    // Remove all lines sequentially
    current.forEach(item => {
      this.removeItem(item.lineId).subscribe();
    });
    this.items.set([]);
    this.syncing.set(false);
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

  private resolveSkuId(input: string): string {
    if (input.includes('-') && input.length === 36) return input;
    for (const [uuid, data] of Object.entries(KNOWN_SKUS)) {
      if (data.code === input) return uuid;
    }
    return input;
  }

  private mapLines(lines: BackendLine[]): CartLineItem[] {
    return lines.map(line => {
      const known = KNOWN_SKUS[line.skuId];
      return {
        lineId: line.id,
        skuId: line.skuId,
        sku: known ? known.code : line.skuId,
        name: known ? known.name : `Product (${line.skuId.slice(0, 8)})`,
        unitPriceMinorUnits: known ? known.priceMinor : 2850000,
        quantity: parseInt(line.quantity, 10) || 1,
        imageUrl: known ? known.img : '/assets/hero-accessories.jpg',
        categoryName: known ? known.category : 'General'
      };
    });
  }
}
