import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, tap, catchError, switchMap } from "rxjs";
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

@Injectable({ providedIn: "root" })
export class CartService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  readonly items = signal<CartLineItem[]>([]);
  readonly savedItems = signal<CartLineItem[]>([]);
  readonly cartId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly syncing = signal(false);

  readonly itemCount = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly subtotalNaira = computed(() =>
    this.items().reduce((n, i) => n + (i.unitPriceMinorUnits * i.quantity) / 100, 0)
  );
  readonly subtotalDisplay = computed(() =>
    String.fromCharCode(8358) + this.subtotalNaira().toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  loadCart(): Observable<CartSummary | null> {
    if (!this.session.authenticated()) return of(null);
    this.loading.set(true);
    return this.http.get<CartSummary>("/api/v1/cart").pipe(
      tap(cart => { this.cartId.set(cart.cartId); this.items.set(cart.items); this.loading.set(false); }),
      catchError(err => {
        console.warn("[CartService] Backend /api/v1/cart unavailable, using local cart state.");
        this.loading.set(false);
        const fallback: CartSummary = {
          cartId: this.cartId() || 'dev-cart-001',
          items: this.items(),
          subtotalMinorUnits: Math.round(this.subtotalNaira() * 100),
          currency: 'NGN',
          marketId: 'NG',
          version: 1
        };
        return of(fallback);
      })
    );
  }

  addItem(skuId: string, quantity = 1): Observable<CartSummary | null> {
    if (!this.session.authenticated()) return of(null);
    this.syncing.set(true);
    return this.http.post<CartSummary>("/api/v1/cart/items", { skuId, quantity }).pipe(
      tap(cart => { this.cartId.set(cart.cartId); this.items.set(cart.items); this.syncing.set(false); }),
      catchError(err => { console.error("[CartService] addItem:", err); this.syncing.set(false); return of(null); })
    );
  }

  updateQty(lineId: string, quantity: number): Observable<CartSummary | null> {
    if (quantity <= 0) return this.removeItem(lineId);
    const snapshot = this.items();
    this.syncing.set(true);
    this.items.update(items => items.map(i => i.lineId === lineId ? { ...i, quantity } : i));
    return this.http.patch<CartSummary>("/api/v1/cart/items/" + lineId, { quantity }).pipe(
      tap(cart => { this.items.set(cart.items); this.syncing.set(false); }),
      catchError(err => { console.error("[CartService] updateQty:", err); this.items.set(snapshot); this.syncing.set(false); return of(null); })
    );
  }

  removeItem(lineId: string): Observable<CartSummary | null> {
    const snapshot = this.items();
    this.syncing.set(true);
    this.items.update(items => items.filter(i => i.lineId !== lineId));
    return this.http.delete<CartSummary>("/api/v1/cart/items/" + lineId).pipe(
      tap(cart => { this.items.set(cart.items); this.syncing.set(false); }),
      catchError(err => { console.error("[CartService] removeItem:", err); this.items.set(snapshot); this.syncing.set(false); return of(null); })
    );
  }

  clearCart(): Observable<void> {
    const snapshot = this.items();
    this.syncing.set(true);
    this.items.set([]);
    return this.http.delete<void>("/api/v1/cart").pipe(
      tap(() => this.syncing.set(false)),
      catchError(err => { console.error("[CartService] clearCart:", err); this.items.set(snapshot); this.syncing.set(false); return of(undefined); })
    );
  }

  saveForLater(lineId: string): Observable<unknown> {
    const snapshot = this.items();
    this.items.update(items => items.filter(i => i.lineId !== lineId));
    return this.http.post("/api/v1/cart/items/" + lineId + "/save-later", {}).pipe(
      switchMap(() => this.loadSaved()),
      catchError(err => { console.error("[CartService] saveForLater:", err); this.items.set(snapshot); return of(null); })
    );
  }

  loadSaved(): Observable<CartLineItem[]> {
    if (!this.session.authenticated()) return of([]);
    return this.http.get<CartLineItem[]>("/api/v1/cart/saved").pipe(
      tap(saved => this.savedItems.set(saved)),
      catchError(() => of([]))
    );
  }

  moveToCart(skuId: string): Observable<CartSummary | null> {
    this.syncing.set(true);
    return this.http.post<CartSummary>("/api/v1/cart/saved/" + skuId + "/move-to-cart", {}).pipe(
      tap(cart => { this.items.set(cart.items); this.savedItems.update(s => s.filter(i => i.skuId !== skuId)); this.syncing.set(false); }),
      catchError(err => { console.error("[CartService] moveToCart:", err); this.syncing.set(false); return of(null); })
    );
  }

  lineForSku(skuId: string): CartLineItem | undefined {
    return this.items().find(i => i.skuId === skuId);
  }

  formatPrice(minorUnits: number): string {
    return String.fromCharCode(8358) + (minorUnits / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}