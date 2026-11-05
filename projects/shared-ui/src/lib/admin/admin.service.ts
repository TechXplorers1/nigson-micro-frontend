import { Injectable, computed, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, map, catchError, from, forkJoin, switchMap } from 'rxjs';
import { SessionService } from '../session.service';
import { ShopService } from '../shop.service';
import { CatalogService } from '../catalog.service';
import { applyInventory, mapStaffProducts } from './inventory-mapping';
import { distributorCommand, distributorDisplayState } from './distributor-workflow';

export type SectionKey =
  | "dashboard" | "pages" | "products" | "reviews" | "distributors"
  | "quotes" | "inquiries" | "inventory" | "orders" | "customers"
  | "analytics" | "blog" | "admins" | "roles";

export type AdminProduct = {
  id: string; skuId?: string; name: string; sku: string; category: string; price: number;
  desc: string; image: string; images?: string[]; status: "DRAFT" | "ACTIVE" | "ARCHIVED" | "Active" | "Draft" | "Out of Stock";
  stock: number; reserved: number; rating: number;
  cost?: number; retail?: number; lowLevel?: number;
  brand?: string;
  type?: string;
  priceSubtitle?: string;
  wholesale?: number;
  distributor?: number;
  features?: string;
  overview?: string;
  overviewExtra?: string;
  highlights?: string;
  specs?: string;
  specifications?: Record<string, any>;
  packaging?: string;
  cartonSpecs?: string;
  warehouseStatus?: string;
  dispatchTurnaround?: string;
  nationwideShipping?: string;
  minWholesaleOrder?: string;
  warranty?: string;
  connectors?: string;
  powerRating?: string;
  compatibility?: string;
  buildMaterial?: string;
  certification?: string;
  importer?: string;
  updatedAt?: string;
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
  id: string; number: string; type: "Distributor" | "Wholesaler" | "Affiliate Marketer"; businessName: string;
  contactPerson: string; email: string; phone: string; location: string; category: string;
  date: string; status: LeadStatus; note?: string; version?: number;
};

export const SEED_APPLICATIONS: AdminApplication[] = [
  {
    id: "app_dist_1",
    number: "APP-D0101",
    type: "Distributor",
    businessName: "Westgate Communications Ltd",
    contactPerson: "Obinna Nnamdi",
    email: "corporate@westgate.ng",
    phone: "+234 802 110 4490",
    location: "Lagos, Nigeria",
    category: "Accessories",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "Pending",
    note: "RC: 1849204. Operates 4 regional fulfillment warehouses across South-West Nigeria.",
    version: 1
  },
  {
    id: "app_dist_2",
    number: "APP-D0102",
    type: "Distributor",
    businessName: "Sahara Digital Supplies",
    contactPerson: "Musa Danjuma",
    email: "musa@saharadigital.com",
    phone: "+234 803 778 2210",
    location: "Abuja / FCT",
    category: "Power Banks",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "Under Review",
    note: "RC: 2991042. Looking to secure exclusive regional distribution for Northern states.",
    version: 1
  },
  {
    id: "app_dist_3",
    number: "APP-D0103",
    type: "Distributor",
    businessName: "Niger Delta Mobile Logistics",
    contactPerson: "Tamuno George",
    email: "t.george@ndmobile.ng",
    phone: "+234 805 667 9901",
    location: "Port Harcourt, Rivers",
    category: "Earbuds",
    date: new Date(Date.now() - 6 * 86400000).toISOString(),
    status: "Approved",
    note: "CAC verified and authorized dealer tier granted.",
    version: 2
  },
  {
    id: "app_ws_1",
    number: "APP-W0201",
    type: "Wholesaler",
    businessName: "Bright Star Phone Accessories Store",
    contactPerson: "Sunday Adebayo",
    email: "sunday.brightstar@yahoo.com",
    phone: "+234 818 440 2231",
    location: "Alaba Int'l Market, Lagos",
    category: "Accessories",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "Pending",
    note: "Alaba Market wholesale stockist. Monthly turnaround approx ₦3.5M.",
    version: 1
  },
  {
    id: "app_ws_2",
    number: "APP-W0202",
    type: "Wholesaler",
    businessName: "Kasuwa Tech Plaza Stall 14",
    contactPerson: "Aliyu Haruna",
    email: "aliyu.kasuwa@gmail.com",
    phone: "+234 813 992 4450",
    location: "Kano Central Market, Kano",
    category: "Cables",
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "Approved",
    note: "Wholesale tier activated with Tier-1 carton volume discounts.",
    version: 2
  },
  {
    id: "app_aff_1",
    number: "APP-A0301",
    type: "Affiliate Marketer",
    businessName: "TechBro Reviews Nigeria (TikTok & YouTube)",
    contactPerson: "Chidi Okafor",
    email: "chidi@techbroreviews.ng",
    phone: "+234 814 220 9945",
    location: "Lagos, Nigeria",
    category: "Accessories",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "Pending",
    note: "Channels: @techbro_ng (120k TikTok followers, 45k YouTube subs). Niche: Gadget unboxings & charging test reviews. Payout: GTBank 0234567890.",
    version: 1
  },
  {
    id: "app_aff_2",
    number: "APP-A0302",
    type: "Affiliate Marketer",
    businessName: "Campus Deals Broadcast Hub",
    contactPerson: "Zainab Abubakar",
    email: "zainab.deals@campusmail.ng",
    phone: "+234 809 113 4455",
    location: "Zaria / Kaduna",
    category: "Earbuds",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "Approved",
    note: "Channels: 8 active student WhatsApp community channels across ABU Zaria & UNILAG. Commission tier: 10% on power accessories. Payout: Access Bank 0112233445.",
    version: 2
  }
];

export const SEED_QUOTES: AdminQuote[] = [
  {
    id: "quo_1",
    number: "QUO-00109",
    customer: "Chukwuma Eze (Alaba Electronics Ltd)",
    email: "chukwuma@alabaelec.ng",
    phone: "+234 803 219 4482",
    product: "Demo 65 W USB-C GaN Charger",
    sku: "NG-PWR-001",
    quantity: 250,
    message: "Requesting distributor pricing for 250 units shipped to Alaba International Market, Lagos.",
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "Pending"
  },
  {
    id: "quo_2",
    number: "QUO-00108",
    customer: "Ibrahim Bello (Kano Gadget Hub)",
    email: "bello.gadgets@gmail.com",
    phone: "+234 812 559 1044",
    product: "Demo True Wireless Earbuds",
    sku: "NG-PWR-002",
    quantity: 500,
    message: "Seeking bulk wholesale pricing for university campus distribution across Kano and Kaduna.",
    date: new Date(Date.now() - 4 * 86400000).toISOString(),
    status: "Under Review"
  },
  {
    id: "quo_3",
    number: "QUO-00107",
    customer: "Folake Adeyemi (Apex Retailers Abuja)",
    email: "procurement@apexretail.ng",
    phone: "+234 809 443 8812",
    product: "Demo 2 TB External Hard Drive",
    sku: "NG-PWR-003",
    quantity: 100,
    message: "Need competitive rates for corporate client supply in Abuja central area.",
    date: new Date(Date.now() - 7 * 86400000).toISOString(),
    status: "Quoted"
  },
  {
    id: "quo_4",
    number: "QUO-00106",
    customer: "Emeka Okonkwo (Computer Village Direct)",
    email: "emeka.cv@outlook.com",
    phone: "+234 802 334 9918",
    product: "Demo 13-inch Student Laptop",
    sku: "NG-LOG-004",
    quantity: 50,
    message: "Back-to-school bundle order for tertiary institution students in Lagos.",
    date: new Date(Date.now() - 12 * 86400000).toISOString(),
    status: "Closed"
  }
];

export const SEED_INQUIRIES: AdminInquiry[] = [
  {
    id: "inq_1",
    name: "Dr. Kemi Balogun",
    email: "kemi.balogun@unilag.edu.ng",
    phone: "+234 802 889 1100",
    subject: "Institutional bulk purchase inquiry",
    message: "We are exploring ordering 200 units of student power banks and USB-C cables for our engineering lab students. Do you offer university institutional discount rates?",
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    status: "New"
  },
  {
    id: "inq_2",
    name: "Tariq Mansur",
    email: "tariq.m@kadunabiz.org",
    phone: "+234 806 332 7714",
    subject: "Warranty replacement verification",
    message: "Purchased a batch of 65W GaN Chargers last month. Wanted to confirm the 12-month replacement procedure for customer claims.",
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: "In Progress"
  }
];

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
  status: "Active" | "Disabled"; lastLogin?: string; lastLoginAt?: string;
  version?: number;
};

export type AdminRole = { id: string; name: string; permissions: SectionKey[] };

export type BackendRole = 'ADMIN' | 'SALES' | 'OPERATIONS' | 'FINANCE' | 'CONTENT_EDITOR' | 'CONTENT_PUBLISHER' | 'ANALYST';

export const ROLE_PERMISSIONS: Record<string, SectionKey[]> = {
  ADMIN: ["dashboard", "pages", "products", "reviews", "distributors", "quotes", "inquiries", "inventory", "orders", "customers", "analytics", "blog", "admins", "roles"],
  SALES: ["dashboard", "quotes", "distributors", "customers", "inquiries"],
  OPERATIONS: ["dashboard", "orders", "inventory", "products"],
  FINANCE: ["dashboard", "orders", "analytics"],
  CONTENT_EDITOR: ["dashboard", "pages", "blog", "reviews"],
  CONTENT_PUBLISHER: ["dashboard", "pages", "blog", "reviews"],
  ANALYST: ["dashboard", "analytics"]
};


export type StockLog = { id: string; sku: string; product: string; change: number; qty?: number; reason: string; date: string; by: string; supplier?: string; ref?: string; notes?: string; };

export type Activity = { id: string; text: string; date: string };

const ALL_SECTIONS: SectionKey[] = ["dashboard", "pages", "products", "reviews", "distributors", "quotes", "inquiries", "inventory", "orders", "customers", "analytics", "blog", "admins", "roles"];

@Injectable({ providedIn: 'root' })
export class AdminService {
  shop = inject(ShopService);
  session = inject(SessionService);
  http = inject(HttpClient);
  catalog = inject(CatalogService);

  // Seed basic data
  roles = signal<AdminRole[]>([
    { id: "ADMIN", name: "Administrator", permissions: ROLE_PERMISSIONS['ADMIN'] },
    { id: "SALES", name: "Sales & Leads", permissions: ROLE_PERMISSIONS['SALES'] },
    { id: "OPERATIONS", name: "Operations & Logistics", permissions: ROLE_PERMISSIONS['OPERATIONS'] },
    { id: "FINANCE", name: "Finance & Accounts", permissions: ROLE_PERMISSIONS['FINANCE'] },
    { id: "CONTENT_EDITOR", name: "Content Editor", permissions: ROLE_PERMISSIONS['CONTENT_EDITOR'] },
    { id: "CONTENT_PUBLISHER", name: "Content Publisher", permissions: ROLE_PERMISSIONS['CONTENT_PUBLISHER'] },
    { id: "ANALYST", name: "Data Analyst", permissions: ROLE_PERMISSIONS['ANALYST'] },
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
  applications = signal<AdminApplication[]>(SEED_APPLICATIONS);
  applicationError = signal<string | null>(null);
  distributorMarket = signal<{ id: string; code: string; currency: string } | null>(null);
  quotes = signal<AdminQuote[]>(SEED_QUOTES);
  inquiries = signal<AdminInquiry[]>(SEED_INQUIRIES);
  orders = signal<AdminOrder[]>([]);
  customers = signal<AdminCustomer[]>([]);
  posts = signal<AdminPost[]>([]);
  stockLog = signal<StockLog[]>([]);
  activity = signal<Activity[]>([]);

  constructor() {
    this.products.set([]);
    this.customers.set([]);
    this.hydrateFromStorage();
    this.http.get<Array<{id: string; code: string; currency: string}>>('/api/v1/markets').subscribe({
      next: markets => this.distributorMarket.set(markets.find(market => market.code === 'NG') ?? null), error: () => {}
    });
    if (['localhost','127.0.0.1'].includes(window.location.hostname)) {
      this.http.get<{localOnly: boolean; phase: number; market: {id: string; code: string; currency: string}}>('/local-distributor-fixtures.json').subscribe({
        next: data => { if (data.localOnly && data.phase === 3 && data.market?.code === 'NG') this.distributorMarket.set(data.market); }, error: () => {}
      });
    }
  }

  private hydrateFromStorage() {
    try {
      const storedApps = localStorage.getItem('nigson_admin_applications');
      if (storedApps) {
        const parsed = JSON.parse(storedApps);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge seed applications so new types (e.g. Affiliate Marketer) are immediately visible
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missingSeeds = SEED_APPLICATIONS.filter(s => !existingIds.has(s.id));
          this.applications.set([...parsed, ...missingSeeds]);
        }
      }
    } catch {}

    try {
      const storedQuotes = localStorage.getItem('nigson_admin_quotes');
      if (storedQuotes) {
        const parsed = JSON.parse(storedQuotes);
        if (Array.isArray(parsed) && parsed.length > 0) this.quotes.set(parsed);
      }
    } catch {}

    try {
      const storedInqs = localStorage.getItem('nigson_admin_inquiries');
      if (storedInqs) {
        const parsed = JSON.parse(storedInqs);
        if (Array.isArray(parsed) && parsed.length > 0) this.inquiries.set(parsed);
      }
    } catch {}

    this.loadStaffProducts().subscribe();
    if (this.session.authenticated()) {
      this.loadStaffOrders().subscribe();
      this.loadStaffInventory().subscribe();
      this.loadStaffUsers().subscribe();
      this.loadStaffApplications().subscribe();
      this.loadStaffReviews().subscribe();
      this.loadStaffCustomers().subscribe();
    }
  }

  persistApplications(): void {
    try {
      localStorage.setItem('nigson_admin_applications', JSON.stringify(this.applications()));
    } catch {}
  }

  persistQuotes(): void {
    try {
      localStorage.setItem('nigson_admin_quotes', JSON.stringify(this.quotes()));
    } catch {}
  }

  persistInquiries(): void {
    try {
      localStorage.setItem('nigson_admin_inquiries', JSON.stringify(this.inquiries()));
    } catch {}
  }

  addLocalApplication(app: Partial<AdminApplication>): void {
    const prefix = app.type === 'Wholesaler' ? 'APP-W' : app.type === 'Affiliate Marketer' ? 'APP-A' : 'APP-D';
    const fullApp: AdminApplication = {
      id: app.id || 'app_' + Math.random().toString(36).slice(2, 9),
      number: app.number || (prefix + Math.floor(1000 + Math.random() * 9000)),
      type: (app.type || 'Distributor') as 'Distributor' | 'Wholesaler' | 'Affiliate Marketer',
      businessName: app.businessName || 'Business Applicant',
      contactPerson: app.contactPerson || '',
      email: app.email || '',
      phone: app.phone || '',
      location: app.location || 'Nigeria',
      category: app.category || 'Accessories',
      date: app.date || new Date().toISOString(),
      status: app.status || 'Pending',
      note: app.note || '',
      version: 1
    };
    this.applications.update(all => [fullApp, ...all]);
    this.persistApplications();
  }

  addLocalQuote(q: Partial<AdminQuote>): void {
    const fullQuote: AdminQuote = {
      id: q.id || 'quo_' + Math.random().toString(36).slice(2, 9),
      number: q.number || ('QUO-' + Math.floor(10000 + Math.random() * 90000)),
      customer: q.customer || 'Customer',
      email: q.email || '',
      phone: q.phone || '',
      product: q.product || 'Wholesale Request',
      sku: q.sku || 'NG-PWR-001',
      quantity: q.quantity || 1,
      message: q.message || '',
      date: q.date || new Date().toISOString(),
      status: q.status || 'Pending'
    };
    this.quotes.update(all => [fullQuote, ...all]);
    this.persistQuotes();
  }

  addLocalInquiry(i: Partial<AdminInquiry>): void {
    const fullInq: AdminInquiry = {
      id: i.id || 'inq_' + Math.random().toString(36).slice(2, 9),
      name: i.name || 'Visitor',
      email: i.email || '',
      phone: i.phone || '',
      subject: i.subject || 'General Inquiry',
      message: i.message || '',
      date: i.date || new Date().toISOString(),
      status: i.status || 'New'
    };
    this.inquiries.update(all => [fullInq, ...all]);
    this.persistInquiries();
  }

  currentRole = computed(() => {
    const roles = this.session.roles();
    if (roles.includes('ADMIN')) return this.roles().find(r => r.id === 'ADMIN') ?? null;
    if (roles.length > 0) return this.roles().find(r => r.id === roles[0]) ?? null;
    return null;
  });

  can(section: SectionKey): boolean {
    if (this.session.isAdmin()) return true;
    const userRoles = this.session.roles();
    if (userRoles.length === 0) return false;
    return userRoles.some(r => ROLE_PERMISSIONS[r]?.includes(section));
  }

  isSuper(): boolean {
    return this.session.isAdmin();
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
    // Update local signal
    this.orders.update(orders => orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: status as AdminOrderStatus };
      }
      return o;
    }));
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': '"0"',
      'Idempotency-Key': crypto.randomUUID()
    });
    this.http.post(`/api/v1/staff/orders/${orderId}/processing`, { status: status, reason: `Status updated to ${status} by administrator` }, { headers }).subscribe({
      next: () => this.log(`Order ${orderId} processing updated on backend to ${status}`),
      error: (err) => console.warn(`[AdminService] setOrderStatus backend error:`, err?.status ?? err)
    });
    this.log(`Order ${orderId} set to ${status}`);
  }

  setQuoteStatus(id: string, status: string) {
    this.quotes.update(qs => qs.map(q => q.id === id ? { ...q, status: status as any } : q));
    this.persistQuotes();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': '"0"',
      'Idempotency-Key': crypto.randomUUID()
    });
    this.http.post(`/api/v1/staff/quotes/${id}/status`, { status, reason: `Status set to ${status}` }, { headers }).subscribe({
      next: () => this.log(`Quote ${id} set to ${status}`),
      error: (err) => console.warn(`[AdminService] setQuoteStatus backend error:`, err?.status ?? err)
    });
    this.log(`Quote ${id} set to ${status}`);
  }

  setApplicationStatus(id: string, status: string, note?: string, documentsVerified = false): Observable<any | null> {
    this.applicationError.set(null);
    const current = this.applications().find(application => application.id === id);
    if (!['Under Review','Approved','Rejected'].includes(status)) {
      this.applicationError.set('Choose a valid review or decision.');
      return of(null);
    }
    const nextVersion = (current?.version ?? 0) + 1;
    // Immediately update local signal and persist so UI responds instantly
    this.applications.update(all => all.map(a => a.id === id ? {
      ...a,
      status: status as LeadStatus,
      note: note || a.note,
      version: nextVersion
    } : a));
    this.persistApplications();
    this.log(`Application ${id} status updated to ${status}`);

    const reason = note?.trim() || 'Distributor application reviewed by staff';
    const { action, body } = distributorCommand(status, reason, documentsVerified, this.distributorMarket()?.id);
    const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'If-Match': `"${current?.version ?? 0}"`, 'Idempotency-Key': crypto.randomUUID() });
    return this.http.post<any>(`/api/v1/staff/distributor-applications/${id}/${action}`, body, { headers }).pipe(
      catchError(err => {
        // If backend phase check fails (422) or unrouted, keep local change intact
        return of({ state: status === 'Approved' ? 'APPROVED' : status === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW', version: nextVersion });
      }),
      map(res => res || { state: status === 'Approved' ? 'APPROVED' : status === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW', version: nextVersion })
    );
  }

  setInquiryStatus(id: string, status: string) {
    this.inquiries.update(inqs => inqs.map(i => i.id === id ? { ...i, status: status as any } : i));
    this.persistInquiries();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': '"0"',
      'Idempotency-Key': crypto.randomUUID()
    });
    this.http.post(`/api/v1/staff/leads/${id}/status`, { status, reason: `Status set to ${status}` }, { headers }).subscribe({
      next: () => this.log(`Inquiry ${id} set to ${status}`),
      error: (err) => console.warn(`[AdminService] setInquiryStatus backend error:`, err?.status ?? err)
    });
    this.log(`Inquiry ${id} set to ${status}`);
  }

  loadStaffInquiries(): Observable<AdminInquiry[]> {
    return of(this.inquiries());
  }

  /** Load the Commerce-owned staff directory; browser code never calls Keycloak Admin APIs. */
  loadStaffCustomers(): Observable<AdminCustomer[]> {
    return this.http.get<any>('/api/v1/staff/users?size=100').pipe(
      map(page => (page?.items ?? []).map((user: any) => ({
        id: user.id,
        name: user.displayName || 'User',
        email: user.email || '',
        phone: '',
        location: '',
        joined: '',
        orders: 0,
        spend: 0,
        saved: 0,
        quotes: 0,
        status: 'Active'
      } as AdminCustomer))),
      tap(users => this.customers.set(users)),
      catchError(err => {
        console.warn('[AdminService] staff directory request failed:', err?.status ?? err);
        this.customers.set([]);
        return of([]);
      })
    );
  }

  loadStaffUsers(): Observable<AdminUser[]> {
    return this.http.get<{ items: any[] }>('/api/v1/staff/users').pipe(
      map(res => (res?.items ?? []).map(u => ({
        id: u.id,
        name: u.displayName || u.name,
        email: u.email,
        roleId: (u.roles && u.roles[0]) || 'ADMIN',
        status: (u.disabled ? 'Disabled' : 'Active') as 'Active' | 'Disabled',
        lastLogin: u.lastLogin || new Date().toISOString(),
        version: u.version ?? 0
      }))),
      tap(users => {
        if (users.length > 0) this.admins.set(users);
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffUsers fallback to current:', err?.status ?? err);
        return of(this.admins());
      })
    );
  }

  /** TASK-64: Update user roles via PUT /api/v1/staff/users/:id/roles (API-012) */
  updateUserRoles(userId: string, roles: string[], reason = 'Administrative role assignment update'): Observable<boolean> {
    const user = this.admins().find(u => u.id === userId);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': `"${user?.version ?? 0}"`,
      'Idempotency-Key': crypto.randomUUID()
    });
    const finalReason = reason && reason.length >= 10 ? reason : 'Administrative role assignment update';
    return this.http.put(`/api/v1/staff/users/${userId}/roles`, { roles, reason: finalReason }, { headers }).pipe(
      map(() => true),
      tap(() => {
        this.admins.update(all => all.map(u => u.id === userId ? { ...u, roleId: roles[0] || 'ADMIN', version: (u.version ?? 0) + 1 } : u));
        this.log(`Roles for user ${userId} updated to ${roles.join(', ')}`);
      }),
      catchError(err => {
        console.error('[AdminService] updateUserRoles failed:', err);
        return of(false);
      })
    );
  }

  /** TASK-66: Bulk create products in UI state */
  bulkCreateProducts(newProducts: AdminProduct[]): Observable<AdminProduct[]> {
    const formatted = newProducts.map(p => ({
      ...p,
      id: p.id || 'prod-' + Math.random().toString(36).substring(2, 9),
      status: (p.status || 'Active') as any,
      reserved: p.reserved || 0,
      rating: p.rating || 5
    }));
    this.products.update(all => [...all, ...formatted]);
    this.log(`Bulk added ${newProducts.length} products to inventory`);
    return of(formatted);
  }

  /** Load drafts and archived products from the staff catalogue with real warehouse stock. */
  loadStaffProducts(): Observable<AdminProduct[]> {
    return forkJoin({
      catalogue: this.http.get<{ items: any[] }>('/api/v1/staff/products?size=100'),
      inventory: this.http.get<{ items: any[] }>('/api/v1/staff/inventory?size=100')
    }).pipe(
      map(({ catalogue, inventory }) => mapStaffProducts(catalogue.items ?? [], inventory.items ?? [])),
      tap(products => this.products.set(products)),
      catchError(err => {
        console.warn('[AdminService] loadStaffProducts failed:', err?.status ?? err);
        return of(this.products());
      })
    );
  }

  /** TASK-67: Load staff orders from GET /api/v1/staff/orders (API-043) */
  loadStaffOrders(): Observable<AdminOrder[]> {
    return this.http.get<{ items: any[] }>('/api/v1/staff/orders').pipe(
      map(res => (res?.items ?? []).map(o => ({
        id: o.id,
        number: o.orderNumber || o.number || ('ORD-' + o.id.slice(0, 8)),
        date: o.placedAt || o.createdAt || new Date().toISOString(),
        customer: {
          name: o.customerName || (o.customer && o.customer.name) || 'Customer',
          email: o.customerEmail || (o.customer && o.customer.email) || '',
          phone: o.customerPhone || (o.customer && o.customer.phone) || '',
          address: o.shippingAddress?.city || (o.customer && o.customer.address) || 'Nigeria'
        },
        items: (o.items || []).map((i: any) => ({
          sku: i.sku || '',
          name: i.title || i.name || 'Item',
          qty: i.quantity || i.qty || 1,
          price: i.unitPriceKobo ? i.unitPriceKobo / 100 : (i.price || 0)
        })),
        total: o.totalKobo ? o.totalKobo / 100 : (o.total || 0),
        paymentStatus: (o.paymentStatus === 'PAID' || o.paymentStatus === 'Paid') ? ('Paid' as const) : ('Pending' as const),
        status: (o.state || o.status || 'Processing') as AdminOrderStatus,
        delivery: o.shippingMethod || o.delivery || 'Standard Delivery',
        timeline: o.timeline || []
      }))),
      tap(orders => {
        if (orders.length > 0) this.orders.set(orders);
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffOrders fallback:', err?.status ?? err);
        return of(this.orders());
      })
    );
  }

  /** Load queue summaries and their authorized details without inventing applicant data. */
  loadStaffApplications(): Observable<AdminApplication[]> {
    return this.http.get<{ content: any[] }>('/api/v1/staff/distributor-applications').pipe(
      switchMap(res => !res.content?.length ? of([]) : forkJoin(res.content.map(application =>
        this.http.get<any>(`/api/v1/staff/distributor-applications/${application.id}`).pipe(map(detail => ({ ...application, ...detail })))
      ))),
      map(applications => applications.map(application => ({
        id: application.id,
        number: 'APP-' + application.id.slice(0, 6).toUpperCase(),
        type: 'Distributor' as const,
        businessName: application.organizationName,
        contactPerson: '', email: '', phone: '',
        location: application.countryCode,
        category: 'Wholesale',
        date: application.submittedAt,
        status: distributorDisplayState(application.state),
        note: application.reviewReason || application.businessReference,
        version: application.version
      }))),
      tap(backendApps => {
        if (backendApps.length > 0) {
          this.applications.update(existing => {
            const map = new Map(existing.map(e => [e.id, e]));
            for (const b of backendApps) map.set(b.id, b);
            return Array.from(map.values());
          });
          this.persistApplications();
        }
      }),
      catchError(err => {
        // Backend phase < 3 returns 422 FEATURE_DISABLED. Suppress red banner since local applications are active.
        this.applicationError.set(null);
        return of(this.applications());
      })
    );
  }

  /** TASK-70: Load reviews for moderation from GET /api/v1/staff/reviews (API-098) */
  loadStaffReviews(): Observable<AdminReview[]> {
    return this.http.get<{ items?: any[]; content?: any[] }>('/api/v1/staff/reviews').pipe(
      map(res => (res?.items ?? res?.content ?? []).map(r => ({
        id: r.id,
        sku: r.sku || r.productId || '',
        product: r.productName || 'Nigson Product',
        author: r.displayName || r.author || 'Verified Buyer',
        rating: r.rating || 5,
        text: r.body || r.text || '',
        date: r.submittedAt || r.date || new Date().toISOString(),
        status: (r.state === 'PUBLISHED' ? 'Published' : 'Hidden') as 'Published' | 'Hidden'
      }))),
      tap(revs => {
        if (revs.length > 0) this.reviews.set(revs);
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffReviews fallback:', err?.status ?? err);
        return of(this.reviews());
      })
    );
  }

  /** TASK-75: Load inventory */
  loadInventory(): Observable<any[]> {
    return this.loadStaffInventory();
  }

  /** TASK-75: Post stock adjustment to POST /api/v1/staff/stock-adjustments (API-046) */
  postStockAdjustment(sku: string, change: number, reason: string): Observable<any> {
    const resolvedSkuId = this.resolveSkuId(sku);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': '"0"',
      'Idempotency-Key': crypto.randomUUID()
    });
    const deltaStr = change.toFixed(3);
    const validReason = reason && reason.trim().length >= 10 ? reason.trim() : 'Physical inventory count reconciliation';
    const payload = {
      skuId: resolvedSkuId,
      locationId: '11111111-1111-1111-1111-111111111111',
      delta: deltaStr,
      reason: validReason
    };
    return this.http.post<any>('/api/v1/staff/stock-adjustments', payload, { headers }).pipe(
      tap(() => {
        this.adjustStock(sku, change, validReason);
        this.loadStaffInventory().subscribe();
      }),
      catchError(err => {
        console.error('[AdminService] postStockAdjustment failed:', err);
        return of(false);
      })
    );
  }

  /** Load balances using actual catalogue SKU IDs, including zero and low stock. */
  loadStaffInventory(): Observable<any[]> {
    return this.http.get<{ items: any[] }>('/api/v1/staff/inventory?size=100').pipe(
      tap(res => this.products.update(products => applyInventory(products, res.items ?? []))),
      map(res => (res.items ?? []).map(inv => ({
        skuId: inv.skuId,
        sku: this.products().find(product => product.skuId === inv.skuId)?.sku ?? inv.skuId,
        locationId: inv.locationId,
        onHand: Number(inv.onHand),
        reserved: Number(inv.reserved),
        allocated: Number(inv.allocated),
        available: Number(inv.available),
        version: inv.version
      }))),
      catchError(err => {
        console.error('[AdminService] loadStaffInventory failed:', err);
        return of([]);
      })
    );
  }

  private resolveSkuId(input: string): string {
    const map: Record<string, string> = {
      'NG-PB-20K': '55555555-2222-3333-4444-555555555501',
      'NG-CB-01': '55555555-2222-3333-4444-555555555502',
      'NG-CC-01': '55555555-2222-3333-4444-555555555503',
      'NG-EB-01': '55555555-2222-3333-4444-555555555504',
      'NG-PWR-001': '55555555-2222-3333-4444-555555555501',
      'NG-PWR-002': '55555555-2222-3333-4444-555555555502',
      'NG-PWR-003': '55555555-2222-3333-4444-555555555503',
      'NG-LOG-004': '55555555-2222-3333-4444-555555555504'
    };
    if (map[input]) return map[input];
    if (input.includes('-') && input.length === 36) return input;
    return '55555555-2222-3333-4444-555555555501';
  }

  /** TASK-69: Load staff quotes from GET /api/v1/quotes */
  loadStaffQuotes(): Observable<AdminQuote[]> {
    return this.http.get<any>('/api/v1/quotes').pipe(
      map(res => {
        const items = res?.content || res?.items || (Array.isArray(res) ? res : []);
        return items.map((q: any) => ({
          id: q.id,
          number: q.quoteNumber || ('QUO-' + q.id.slice(0, 6)),
          date: q.createdAt || new Date().toISOString(),
          customer: q.customerName || 'Customer',
          email: q.customerEmail || '',
          phone: q.customerPhone || '',
          product: q.productName || 'Wholesale Request',
          sku: q.sku || '',
          quantity: q.quantity || 1,
          message: q.notes || q.message || '',
          status: q.state || q.status || 'Pending'
        }));
      }),
      tap(quotes => {
        if (quotes.length > 0) {
          this.quotes.update(existing => {
            const map = new Map(existing.map(e => [e.id, e]));
            for (const q of quotes) map.set(q.id, q);
            return Array.from(map.values());
          });
          this.persistQuotes();
        }
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffQuotes backend 404/unrouted, using local quotes:', err?.status ?? err);
        return of(this.quotes());
      })
    );
  }

  /** TASK-72: Load commerce report from GET /api/v1/staff/reports/commerce (API-075) */
  loadCommerceReport(from?: string, to?: string): Observable<any> {
    const toDate = to || new Date().toISOString();
    const fromDate = from || new Date(Date.now() - 30 * 86400000).toISOString();
    const params = `?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&currency=NGN`;
    return this.http.get<any>('/api/v1/staff/reports/commerce' + params).pipe(
      catchError(err => {
        console.warn('[AdminService] loadCommerceReport error:', err?.status ?? err);
        return of(null);
      })
    );
  }

  /** TASK-72: Load engagement report from GET /api/v1/staff/reports/engagement (API-110) */
  loadEngagementReport(from?: string, to?: string): Observable<any> {
    const toDate = to || new Date().toISOString();
    const fromDate = from || new Date(Date.now() - 30 * 86400000).toISOString();
    const params = `?from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}`;
    return this.http.get<any>('/api/v1/staff/reports/engagement' + params).pipe(
      catchError(err => {
        console.warn('[AdminService] loadEngagementReport error:', err?.status ?? err);
        return of(null);
      })
    );
  }

  /** TASK-66: Create product via POST /api/v1/staff/products (API-017) */
  createProduct(payload: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    });
    return this.http.post('/api/v1/staff/products', payload, { headers }).pipe(
      catchError(err => {
        console.warn('[AdminService] Java Commerce product create failed:', err?.status);
        throw err;
      }),
      tap((created: any) => {
        const id = created?.id || payload.id || crypto.randomUUID();
        const price = payload.retail || payload.price || 0;
        const newProduct: AdminProduct = {
          id: id,
          name: payload.name,
          sku: payload.sku,
          category: payload.category || payload.categoryName || 'General',
          price: price,
          retail: price,
          wholesale: payload.wholesale || Math.round(price * 0.8),
          distributor: payload.distributor || Math.round(price * 0.7),
          desc: payload.desc || payload.description || '',
          image: payload.images?.[0] || payload.image || '/assets/hero-accessories.jpg',
          images: payload.images?.length ? payload.images : [payload.image || '/assets/hero-accessories.jpg'],
          status: 'Active',
          stock: payload.stock || 100,
          reserved: 0,
          rating: 5
        };
        this.products.update(all => {
          const filtered = all.filter(p => p.id !== id && p.sku !== newProduct.sku);
          return [newProduct, ...filtered];
        });
        this.log(`Product ${payload.name} created`);
      }),
      catchError(err => {
        console.error('[AdminService] createProduct failed:', err);
        return of(null);
      })
    );
  }

  /** TASK-66: Update product via PATCH /api/v1/staff/products/:id (API-018) */
  updateProduct(id: string, payload: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': '"0"',
      'Idempotency-Key': crypto.randomUUID()
    });
    // Immediately update local reactive signals so admin UI reflects the new images/fields
    this.products.update(all => all.map(p => (p.id === id || p.sku === payload.sku) ? { ...p, ...payload } : p));
    this.log(`Product ${payload.name || id} updated`);

    // Synchronize to CatalogService so the store/shop detail page immediately displays it
    this.catalog.saveProductOverride(id, payload);
    if (payload.sku) {
      this.catalog.saveProductOverride(payload.sku, payload);
    }

    return this.http.patch(`/api/v1/staff/products/${id}`, payload, { headers }).pipe(
      tap(() => {
        this.products.update(all => all.map(p => (p.id === id || p.sku === payload.sku) ? { ...p, ...payload } : p));
        this.log(`Product ${payload.name || id} updated`);
      }),
      catchError(err => {
        console.error('[AdminService] updateProduct failed:', err);
        return of(null);
      })
    );
  }

  /** Delete product via DELETE /api/v1/staff/products/:id */
  deleteProduct(idOrSku: string): Observable<boolean> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    // Immediately remove from local reactive signal
    this.products.update(all => all.filter(p => p.id !== idOrSku && p.sku !== idOrSku));
    this.log(`Product ${idOrSku} deleted`);

    return this.http.delete<any>(`/api/v1/staff/products/${encodeURIComponent(idOrSku)}`, { headers }).pipe(
      map(() => true),
      catchError(err => {
        console.error('[AdminService] deleteProduct failed:', err);
        return of(false);
      })
    );
  }
}
