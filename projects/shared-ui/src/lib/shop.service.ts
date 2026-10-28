import { Injectable, signal, computed, Injector, inject, effect } from '@angular/core';
import { SessionService } from './session.service';
import { Injectable, signal, computed, Injector, inject } from '@angular/core';
import { CartService } from './cart.service';
import { Injectable, signal, computed, Injector, inject, effect } from '@angular/core';
import { Product } from './catalog.service';
import { LS_CART, LS_SAVED, LS_ORDERS, LS_USER, LS_REVIEWS } from './utils';
import { LS_SAVED, LS_ORDERS, LS_USER, LS_REVIEWS } from './utils';
import { Review } from './reviews';

/**
 * User (TASK-13) — aligned to backend Party/session model.
 *
 * id       → Keycloak `sub` UUID from GET /bff/session
 * roles    → backend role array: CUSTOMER | ADMIN | SALES | OPERATIONS |
 *             FINANCE | CONTENT_EDITOR | CONTENT_PUBLISHER | ANALYST
 * fullName → from GET /api/v1/me response
 * email    → IMMUTABLE in backend — display only, never editable
 *
 * Removed: avatarColor (UI-only, no backend field)
 *          avatarUrl   (UI-only, no backend field)
 *          role: 'user'|'admin' (replaced by roles: string[])
 */
export interface User {
  /** Keycloak subject UUID */
  id: string;
  fullName: string;
  /** Immutable — comes from Keycloak, cannot be changed via frontend */
  email: string;
  /** Backend roles e.g. ['CUSTOMER'] or ['ADMIN','SALES'] */
  roles: string[];
  createdAt: string;
  phone?: string;
}

export interface CartItem {
  sku: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  qty: number;
}

export interface SavedProduct {
  sku: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  savedAt: string;
}

export interface Order {
  id: string;
  number: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  estimatedDelivery: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postal: string;
  };
  deliveryMethod: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private cartService = inject(CartService);
  private injector = inject(Injector);

  readonly hydrated = signal(false);
  readonly user = signal<User | null>(null);
  readonly cart = signal<CartItem[]>([]);
  readonly saved = signal<SavedProduct[]>([]);
  readonly saved = signal<SavedProduct[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly reviews = signal<Review[]>([]);
  readonly loginRequired = signal<{ open: boolean; reason?: string }>({ open: false });

  readonly cart = computed<CartItem[]>(() => {
    return this.cartService.items().map(i => ({
      sku: i.sku || i.skuId,
      name: i.name,
      category: i.categoryName || 'General',
      price: i.unitPriceMinorUnits / 100,
      image: i.imageUrl,
      qty: i.quantity
    }));
  });

  readonly cartCount = computed(() => this.cart().reduce((n, i) => n + i.qty, 0));
  readonly cartSubtotal = computed(() => this.cart().reduce((n, i) => n + i.qty * i.price, 0));
  readonly isAdmin = computed(() => this.user()?.roles?.includes('ADMIN') ?? false);

  constructor() {
    this.init();
    effect(() => {
      const session = this.injector.get(SessionService, null, { optional: true });
      if (session && session.authenticated()) {
        this.user.set({
          id: session.userId() || 'user',
          fullName: session.fullName() || 'Nigson User',
          email: session.email() || '',
          roles: session.roles() || ['CUSTOMER'],
          createdAt: new Date().toISOString()
        });
      } else {
        this.user.set(null);
      }
    });
  }

  private init() {
    try {
      // TASK-47: User profile is populated from GET /api/v1/me on session restore
      const c = localStorage.getItem(LS_CART);
      if (c) this.cart.set(JSON.parse(c));
      const s = localStorage.getItem(LS_SAVED);
      const s = localStorage.getItem(LS_SAVED);
      if (s) this.saved.set(JSON.parse(s));
      // TASK-77: Orders are loaded dynamically from OrderService via GET /api/v1/orders
    } catch { /* ignore */ }
    this.hydrated.set(true);
  }

  openLoginRequired(reason?: string) {
    this.loginRequired.set({ open: true, reason });
  }

  closeLoginRequired() {
    this.loginRequired.set({ open: false });
  }

  updateProfile(data: any) {
    const current = this.user();
    if (!current) return;
    const updated = { ...current, ...data };
    this.user.set(updated);
    // TASK-77: Saved via AccountService PATCH /api/v1/me
  }

  reviewsFor(sku: string): Review[] {
    return this.reviews().filter(r => r.sku === sku || r.productId === sku);
  }

  addReview(r: { sku: string; name: string; rating: number; text: string }) {
    const nr: Review = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      displayName: r.name,
      body: r.text,
      ...r
    };
    this.reviews.update(all => [nr, ...all]);
    // TASK-77: Reviews fetched via ReviewService GET /api/v1/reviews
  }

  private persistCart(c: CartItem[]) {
    this.cart.set(c);
    try { localStorage.setItem(LS_CART, JSON.stringify(c)); } catch { }
  }

  private persistSaved(s: SavedProduct[]) {
    this.saved.set(s);
    try { localStorage.setItem(LS_SAVED, JSON.stringify(s)); } catch { }
  }

  authenticate(user: User) {
    this.user.set(user);
    // TASK-77: Authenticated state managed by SessionService /bff/session
  }

  private injector = inject(Injector);

  signOut() {
    this.user.set(null);
    try {
      sessionStorage.removeItem('nigson_dev_session');
      sessionStorage.removeItem('nigson_pkce_verifier');
      sessionStorage.removeItem('nigson_auth_return_url');
      localStorage.removeItem('nigson_dev_session');
      localStorage.removeItem('nigson_user');
    } catch { }

    try {
      const session = this.injector.get(SessionService, null, { optional: true });
      if (session) {
        session.clearSession();
      }
    } catch { }
  }

  addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
    if (!this.user()) {
      alert("Please sign in to add products to your cart.");
      const session = this.injector.get(SessionService, null, { optional: true });
      if (!session?.authenticated()) {
        session?.signIn('/shop');
        return false;
      }
      const current = this.cart();
      const idx = current.findIndex(c => c.sku === item.sku);
      if (idx >= 0) {
        const copy = [...current];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        this.persistCart(copy);
      } else {
        this.persistCart([...current, { ...item, qty }]);
      }
      const skuId = (item as any).id || (item as any).skuId || item.sku;
      this.cartService.addItem(skuId, qty).subscribe();
      return true;
    }
    const skuId = (item as any).id || (item as any).skuId || item.sku;
    this.cartService.addItem(skuId, qty).subscribe();
    return true;
  }

  removeFromCart(sku: string) {
    this.persistCart(this.cart().filter(c => c.sku !== sku));
    this.cartService.removeItem(sku).subscribe();
  }

  updateQty(sku: string, qty: number) {
    this.persistCart(
      this.cart()
        .map(c => (c.sku === sku ? { ...c, qty: Math.max(0, qty) } : c))
        .filter(c => c.qty > 0)
    );
    this.cartService.updateQty(sku, qty).subscribe();
  }

  private persistOrders(o: Order[]) {
    this.orders.set(o);
    try { localStorage.setItem(LS_ORDERS, JSON.stringify(o)); } catch { }
    removeFromCart(sku: string) {
      this.cartService.removeItem(sku).subscribe();
    }

    placeOrder(payload: Omit<Order, 'id' | 'number' | 'date' | 'status'>) {
      const newOrder: Order = {
        ...payload,
        id: Math.random().toString(36).substring(2, 9),
        number: 'ORD-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
        date: new Date().toISOString(),
        status: 'Processing',
      };
      this.persistOrders([newOrder, ...this.orders()]);
      this.clearCart();
      return newOrder;
      updateQty(sku: string, qty: number) {
        this.cartService.updateQty(sku, qty).subscribe();
      }

      clearCart() {
        this.persistCart([]);
        this.cartService.clearCart().subscribe();
      }

      toggleSaved(item: Omit<SavedProduct, 'savedAt'>) {
        if (!this.user()) {
          alert("Please sign in to save products.");
          return false;
        }
        const current = this.saved();
        const exists = current.some(s => s.sku === item.sku);
        if (exists) {
          this.persistSaved(current.filter(s => s.sku !== item.sku));
          return false;
        } else {
          this.persistSaved([{ ...item, savedAt: new Date().toISOString() }, ...current]);
          return true;
        }
      }

      isSaved(sku: string) {
        return this.saved().some(s => s.sku === sku);
      }

      initialsOf(fullName: string | undefined): string {
        if (!fullName) return 'U';
        const parts = fullName.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
      }
    }




