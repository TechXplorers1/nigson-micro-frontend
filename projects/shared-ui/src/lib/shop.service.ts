import { Injectable, signal, computed } from '@angular/core';
import { Product } from './catalog.service';
import { LS_CART, LS_SAVED, LS_ORDERS, LS_USER, LS_REVIEWS } from './utils';
import { seedReviews, Review } from './reviews';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  avatarColor: string;
  phone?: string;
  avatarUrl?: string;
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
  readonly hydrated = signal(false);
  readonly user = signal<User | null>(null);
  readonly cart = signal<CartItem[]>([]);
    readonly saved = signal<SavedProduct[]>([]);
  readonly orders = signal<Order[]>([]);
  readonly reviews = signal<Review[]>([]);
  readonly loginRequired = signal<{ open: boolean; reason?: string }>({ open: false });

  readonly cartCount = computed(() => this.cart().reduce((n, i) => n + i.qty, 0));
  readonly cartSubtotal = computed(() => this.cart().reduce((n, i) => n + i.qty * i.price, 0));
  readonly isAdmin = computed(() => this.user()?.role === 'admin');

  constructor() {
    this.init();
  }

  private init() {
    try {
      const u = localStorage.getItem(LS_USER);
      if (u) this.user.set(JSON.parse(u));
      const c = localStorage.getItem(LS_CART);
      if (c) this.cart.set(JSON.parse(c));
            const s = localStorage.getItem(LS_SAVED);
      if (s) this.saved.set(JSON.parse(s));
      const o = localStorage.getItem(LS_ORDERS);
      if (o) this.orders.set(JSON.parse(o));
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
    try { localStorage.setItem(LS_USER, JSON.stringify(updated)); } catch {}
  }

  reviewsFor(sku: string) {
    const all = this.reviews();
    const specific = all.filter(r => r.sku === sku);
    if (specific.length === 0) {
      // Auto-seed for demo
      const seeded = seedReviews(sku);
      setTimeout(() => {
        if (!this.reviews().some(r => r.sku === sku)) {
          this.reviews.update(r => [...r, ...seeded]);
        }
      }, 0);
      return seeded;
    }
    return specific.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addReview(r: { sku: string; name: string; rating: number; text: string }) {
    const nr: Review = {
      id: Math.random().toString(36).substring(2, 9),
      date: new Date().toISOString(),
      ...r
    };
    this.reviews.update(all => [nr, ...all]);
    try { localStorage.setItem(LS_REVIEWS, JSON.stringify(this.reviews())); } catch {}
  }

  private persistCart(c: CartItem[]) {
    this.cart.set(c);
    try { localStorage.setItem(LS_CART, JSON.stringify(c)); } catch {}
  }

  private persistSaved(s: SavedProduct[]) {
    this.saved.set(s);
    try { localStorage.setItem(LS_SAVED, JSON.stringify(s)); } catch {}
  }

    authenticate(user: User) {
    this.user.set(user);
    try { localStorage.setItem(LS_USER, JSON.stringify(user)); } catch {}
  }

  signOut() {
    this.user.set(null);
    try { localStorage.removeItem(LS_USER); } catch {}
  }

  addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
    if (!this.user()) {
      alert("Please sign in to add products to your cart.");
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
    return true;
  }

  removeFromCart(sku: string) {
    this.persistCart(this.cart().filter(c => c.sku !== sku));
  }

  updateQty(sku: string, qty: number) {
    this.persistCart(
      this.cart()
        .map(c => (c.sku === sku ? { ...c, qty: Math.max(0, qty) } : c))
        .filter(c => c.qty > 0)
    );
  }

    private persistOrders(o: Order[]) {
    this.orders.set(o);
    try { localStorage.setItem(LS_ORDERS, JSON.stringify(o)); } catch {}
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

  clearCart() {
    this.persistCart([]);
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



