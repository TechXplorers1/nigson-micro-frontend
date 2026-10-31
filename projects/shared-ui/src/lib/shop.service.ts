import { Injectable, signal, computed, Injector, inject, effect } from '@angular/core';
import { SessionService } from './session.service';
import { CartService } from './cart.service';
import { Product } from './catalog.service';
import { Review } from './reviews';
import { LS_SAVED, LS_ORDERS, LS_USER, LS_REVIEWS } from './utils';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  createdAt: string;
  phone?: string;
}

export interface CartItem {
  sku: string;
  skuId?: string;
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
  private session = inject(SessionService);
  private injector = inject(Injector);

  readonly hydrated = signal(false);
  readonly user = signal<User | null>(null);
  readonly saved = signal<SavedProduct[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly reviews = signal<Review[]>([]);
  readonly loginRequired = signal<{ open: boolean; reason?: string }>({ open: false });

  readonly cart = computed<CartItem[]>(() => {
    return this.cartService.items().map(i => ({
      sku: i.sku || i.skuId,
      skuId: i.skuId,
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
        const rawSession = localStorage.getItem('nigson_dev_session') || sessionStorage.getItem('nigson_dev_session');
        if (rawSession) {
          try {
            const parsed = JSON.parse(rawSession);
            if (parsed && (parsed.authenticated || parsed.userId)) {
              this.user.set({
                id: parsed.userId || 'user',
                fullName: parsed.fullName || 'Nigson User',
                email: parsed.email || '',
                roles: parsed.roles || ['CUSTOMER'],
                createdAt: new Date().toISOString()
              });
              return;
            }
          } catch { }
        }
        this.user.set(null);
      }
    });
  }

  private init() {
    try {
      const s = localStorage.getItem(LS_SAVED);
      if (s) this.saved.set(JSON.parse(s));
      const o = localStorage.getItem(LS_ORDERS);
      if (o) this.orders.set(JSON.parse(o));

      const rawSession = localStorage.getItem('nigson_dev_session') || sessionStorage.getItem('nigson_dev_session');
      if (rawSession) {
        const parsed = JSON.parse(rawSession);
        if (parsed && (parsed.authenticated || parsed.userId)) {
          this.user.set({
            id: parsed.userId || 'user',
            fullName: parsed.fullName || 'Nigson User',
            email: parsed.email || '',
            roles: parsed.roles || ['CUSTOMER'],
            createdAt: new Date().toISOString()
          });
        }
      }
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
  }

  reviewsFor(sku: string): Review[] {
    return this.reviews().filter(r => r.sku === sku || (r as any).productId === sku);
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
  }

  private persistSaved(s: SavedProduct[]) {
    this.saved.set(s);
    try { localStorage.setItem(LS_SAVED, JSON.stringify(s)); } catch { }
  }

  private persistOrders(o: Order[]) {
    this.orders.set(o);
    try { localStorage.setItem(LS_ORDERS, JSON.stringify(o)); } catch { }
  }

  authenticate(user: User) {
    this.user.set(user);
  }

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

  addToCart(item: Omit<CartItem, 'qty'> & { skuId?: string; priceMinorUnits?: number }, qty = 1): boolean {
    if (!this.session.authenticated()) {
      this.loginRequired.set({ open: true, reason: 'Please sign in to add products to your cart.' });
      this.session.signIn(window.location.pathname);
      return false;
    }
    const skuId = item.skuId || (item as any).id || item.sku;
    const priceMinor = item.priceMinorUnits ?? Math.round((item.price ?? 0) * 100);
    this.cartService.addItem(skuId, qty, {
      sku: item.sku,
      name: item.name,
      category: item.category,
      priceMinor: priceMinor,
      image: item.image
    }).subscribe();
    return true;
  }

  removeFromCart(skuOrLineId: string) {
    this.cartService.removeItem(skuOrLineId).subscribe();
  }

  updateQty(skuOrLineId: string, qty: number) {
    this.cartService.updateQty(skuOrLineId, qty).subscribe();
  }

  clearCart() {
    this.cartService.clearCart().subscribe();
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
  }

  toggleSaved(item: Omit<SavedProduct, 'savedAt'>) {
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

  isSaved(sku: string): boolean {
    return this.saved().some(s => s.sku === sku);
  }

  initialsOf(fullName: string | undefined): string {
    if (!fullName) return 'U';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }
}
