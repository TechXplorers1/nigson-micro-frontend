import { Injectable, computed, signal, inject } from '@angular/core';
import { ShopService } from '../shop.service';

export type SectionKey =
  | "dashboard" | "pages" | "products" | "reviews" | "distributors"
  | "quotes" | "inquiries" | "inventory" | "orders" | "customers"
  | "analytics" | "blog" | "admins" | "roles";

export type AdminProduct = {
  id: string; name: string; sku: string; category: string; price: number;
  desc: string; image: string; images?: string[]; status: "Active" | "Draft";
  stock: number; reserved: number; rating: number;
};

export type AdminPage = {
  id: string; name: string; path: string; heading: string; description: string;
  image: string; status: "Published" | "Draft"; updatedAt: string;
};

export type AdminReview = {
  id: string; sku: string; product: string; author: string; rating: number;
  text: string; date: string; status: "Published" | "Hidden";
};

export type LeadStatus = "Pending" | "Under Review" | "Approved" | "Rejected";

export type AdminApplication = {
  id: string; number: string; type: "Distributor" | "Wholesaler"; businessName: string;
  contactPerson: string; email: string; phone: string; location: string; category: string;
  date: string; status: LeadStatus; note?: string;
};

export type AdminQuote = {
  id: string; number: string; customer: string; email: string; phone: string;
  product: string; sku: string; quantity: number; message: string; date: string;
  status: "Pending" | "Under Review" | "Quoted" | "Closed";
};

export type AdminInquiry = {
  id: string; name: string; email: string; phone: string; subject: string;
  message: string; date: string; status: "New" | "In Progress" | "Resolved";
};

export type AdminOrderStatus = "Pending" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Delivered" | "Cancelled";

export type AdminOrder = {
  id: string; number: string; date: string;
  customer: { name: string; email: string; phone: string; address: string };
  items: { sku: string; name: string; qty: number; price: number }[];
  total: number; paymentStatus: "Paid" | "Pending" | "Refunded";
  status: AdminOrderStatus; delivery: string; timeline: { label: string; date: string }[];
};

export type AdminCustomer = {
  id: string; name: string; email: string; phone: string; location: string;
  joined: string; orders: number; spend: number; saved: number; quotes: number;
  status: "Active" | "Suspended";
};

export type AdminPost = {
  id: string; slug: string; title: string; excerpt: string; tag: string;
  image: string; date: string; status: "Published" | "Draft"; body?: string;
};

export type AdminUser = {
  id: string; name: string; email: string; roleId: string;
  status: "Active" | "Disabled"; lastLogin: string;
};

export type AdminRole = { id: string; name: string; permissions: SectionKey[] };

export type StockLog = { id: string; sku: string; product: string; change: number; qty?: number; reason: string; date: string; by: string; supplier?: string; ref?: string; notes?: string; };

export type Activity = { id: string; text: string; date: string };

const ALL_SECTIONS: SectionKey[] = ["dashboard", "pages", "products", "reviews", "distributors", "quotes", "inquiries", "inventory", "orders", "customers", "analytics", "blog", "admins", "roles"];

@Injectable({ providedIn: 'root' })
export class AdminService {
  shop = inject(ShopService);
  
  // Seed basic data
  roles = signal<AdminRole[]>([
    { id: "r_super", name: "Super Admin", permissions: [...ALL_SECTIONS] },
    { id: "r_content", name: "Content Manager", permissions: ["dashboard", "pages", "products", "reviews", "blog"] },
    { id: "r_sales", name: "Sales/Lead Manager", permissions: ["dashboard", "distributors", "quotes", "inquiries", "orders", "customers", "inventory", "analytics"] },
    { id: "r_blog", name: "Blog Manager", permissions: ["dashboard", "blog"] },
  ]);

  admins = signal<AdminUser[]>([
    { id: "au_1", name: "Nigson Administrator", email: "admin@nigson.com", roleId: "r_super", status: "Active", lastLogin: new Date().toISOString() },
    { id: "au_2", name: "Ada Christopher", email: "ada.content@nigson.com", roleId: "r_content", status: "Active", lastLogin: new Date().toISOString() },
    { id: "au_3", name: "Segun Alabi", email: "segun.sales@nigson.com", roleId: "r_sales", status: "Active", lastLogin: new Date().toISOString() },
    { id: "au_4", name: "Ruth Ejike", email: "ruth.blog@nigson.com", roleId: "r_blog", status: "Disabled", lastLogin: new Date().toISOString() },
  ]);

  // Adding minimal seed data to ensure MFEs render correctly
  products = signal<AdminProduct[]>([]);
  pages = signal<AdminPage[]>([]);
  reviews = signal<AdminReview[]>([]);
  applications = signal<AdminApplication[]>([]);
  quotes = signal<AdminQuote[]>([]);
  inquiries = signal<AdminInquiry[]>([]);
  orders = signal<AdminOrder[]>([]);
  customers = signal<AdminCustomer[]>([]);
  posts = signal<AdminPost[]>([]);
  stockLog = signal<StockLog[]>([]);
  activity = signal<Activity[]>([]);

  constructor() {
    // Generate minimal dummy data
    const p: AdminProduct[] = [
      { id: '1', name: 'TWS Earbuds Pro', sku: 'NG-EB-01', category: 'Earbuds', price: 28500, desc: 'Earbuds', image: '', status: 'Active', stock: 100, reserved: 10, rating: 4.5 },
      { id: '2', name: '20,000mAh Fast Power Bank', sku: 'NG-PB-01', category: 'Power Banks', price: 18500, desc: 'Power Bank', image: '', status: 'Active', stock: 200, reserved: 20, rating: 4.8 }
    ];
    this.products.set(p);
    
    this.customers.set([
      { id: 'cu_1', name: 'David Okonkwo', email: 'david@mail.com', phone: '+234 8011111111', location: 'Lagos', joined: new Date().toISOString(), orders: 5, spend: 100000, saved: 2, quotes: 0, status: 'Active' },
      { id: 'cu_2', name: 'Sarah Adeyemi', email: 'sarah@mail.com', phone: '+234 8022222222', location: 'Abuja', joined: new Date().toISOString(), orders: 2, spend: 30000, saved: 0, quotes: 1, status: 'Active' }
    ]);
  }

  currentRole = computed(() => {
    const userEmail = this.shop.user()?.email?.toLowerCase();
    const me = this.admins().find((a) => a.email.toLowerCase() === userEmail);
    return this.roles().find((r) => r.id === me?.roleId) ?? this.roles().find((r) => r.id === "r_super") ?? null;
  });

  can(section: SectionKey): boolean {
    const role = this.currentRole();
    return !!role?.permissions.includes(section);
  }

  log(text: string) {
    this.activity.update(a => [{ id: "a_" + Math.random().toString(36).slice(2, 9), text, date: new Date().toISOString() }, ...a].slice(0, 40));
  }

  adjustStock(sku: string, change: number, reason: string) {
    let applied = 0;
    let productName = '';
    this.products.update(products => {
      return products.map(p => {
        if (p.sku === sku) {
          const next = Math.max(0, p.stock + change);
          applied = next - p.stock;
          productName = p.name;
          return { ...p, stock: next };
        }
        return p;
      });
    });
    
    if (applied !== 0) {
      this.stockLog.update(s => [{
        id: "sl_" + Math.random().toString(36).slice(2, 9), sku, product: productName, change: applied, reason, date: new Date().toISOString(), by: "Nigson Administrator"
      }, ...s]);
      this.log(`Stock for ${productName} adjusted by ${applied > 0 ? "+" : ""}${applied}`);
    }
  }

  setOrderStatus(orderId: string, status: string) {
    this.orders.update(orders => orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: status as AdminOrderStatus };
      }
      return o;
    }));
  }
}
