import { Injectable, computed, signal, inject, effect, untracked, WritableSignal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, map, catchError, forkJoin, switchMap, defer, throwError } from 'rxjs';
import { SessionService } from '../session.service';
import { CatalogService } from '../catalog.service';
import { applyInventory, mapStaffProducts } from './inventory-mapping';
import { distributorCommand, distributorDisplayState } from './distributor-workflow';

export type SectionKey =
  | "dashboard" | "pages" | "products" | "reviews" | "distributors"
  | "quotes" | "inquiries" | "inventory" | "orders" | "customers"
  | "analytics" | "blog" | "admins" | "roles";

export type AdminProduct = {
  id: string; version?: number; skuVersion?: number; packSize?: string; categoryIds?: string[]; slug?: string; brandId?: string; skuId?: string; name: string; sku: string; category: string; price: number;
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
  id: string; version?: number; state?: string; sku: string; product: string; author: string; rating: number;
  text: string; date: string; status: "Published" | "Hidden";
};

export type LeadStatus = "Pending" | "Under Review" | "Approved" | "Rejected";

export type AdminApplication = {
  id: string; number: string; type: "Distributor" | "Wholesaler" | "Affiliate Marketer"; businessName: string;
  contactPerson: string; email: string; phone: string; location: string; category: string;
  date: string; status: LeadStatus; note?: string; version?: number;
};

export type AdminQuote = {
  id: string; number: string; customer: string; email: string; phone: string;
  product: string; sku: string; quantity: number; message: string; date: string;
  status: "Pending" | "Under Review" | "Quoted" | "Closed";
  version?: number;
};

export type AdminInquiry = {
  id: string; version?: number; name: string; email: string; phone: string; subject: string;
  message: string; date: string; status: "New" | "In Progress" | "Resolved";
};

export type AdminOrderStatus = "Pending" | "Confirmed" | "Processing" | "Packed" | "Shipped" | "Delivered" | "Cancelled";

export type AdminOrder = {
  id: string; version?: number; rawState?: string; number: string; date: string;
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
  id: string; name: string; email: string; roles?: string[]; roleId: string;
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

@Injectable({ providedIn: 'root' })
export class AdminService {
  readonly session = inject(SessionService);
  readonly http = inject(HttpClient);
  readonly catalog = inject(CatalogService);
  readonly errors = signal<Record<string, string>>({});
  readonly roles = signal<AdminRole[]>(Object.entries(ROLE_PERMISSIONS).map(([id, permissions]) => ({ id, name: id.replaceAll('_', ' '), permissions })));
  readonly admins = signal<AdminUser[]>([]);
  readonly products = signal<AdminProduct[]>([]);
  readonly pages = signal<AdminPage[]>([]);
  readonly reviews = signal<AdminReview[]>([]);
  readonly applications = signal<AdminApplication[]>([]);
  readonly applicationError = signal<string | null>(null);
  readonly distributorMarket = signal<{ id: string; code: string; currency: string } | null>(null);
  readonly quotes = signal<AdminQuote[]>([]);
  readonly quoteLoadError = signal<string | null>(null);
  readonly inquiries = signal<AdminInquiry[]>([]);
  readonly orders = signal<AdminOrder[]>([]);
  readonly customers = signal<AdminCustomer[]>([]);
  readonly posts = signal<AdminPost[]>([]);
  readonly stockLocations = signal<Array<{id:string;code:string;name:string}>>([]);
  readonly stockLog = signal<StockLog[]>([]);
  readonly activity = signal<Activity[]>([]);
  readonly currentRole = computed(() => this.roles().find(r => this.session.roles().includes(r.id)) ?? null);
  private loadedFor = '';

  constructor() {
    effect(() => {
      const key = this.session.authenticated() && this.session.isStaff() ? this.session.userId() + ':' + this.session.roles().join(',') : '';
      untracked(() => {
        if (key === this.loadedFor) return;
        this.loadedFor = key;
        this.admins.set([]); this.products.set([]); this.orders.set([]); this.customers.set([]);
        this.quotes.set([]); this.applications.set([]); this.inquiries.set([]); this.reviews.set([]); this.stockLog.set([]); this.activity.set([]); this.errors.set({});
        if (key) this.loadInitialStaffData();
      });
    });
  }

  can(section: SectionKey): boolean { return this.session.roles().some(role => ROLE_PERMISSIONS[role]?.includes(section)); }
  isSuper(): boolean { return this.session.isAdmin(); }
  log(text: string): void { this.activity.update(rows => [{ id: crypto.randomUUID(), text, date: new Date().toISOString() }, ...rows].slice(0, 40)); }
  message(error: any): string { return error?.error?.detail || error?.message || 'The operation failed. Reload the current record and try again.'; }
  private fail(key: string, error: any): Observable<never> { this.errors.update(all => ({ ...all, [key]: this.message(error) })); return throwError(() => error); }
  private clear(key: string): void { this.errors.update(all => { const copy = { ...all }; delete copy[key]; return copy; }); }
  private headers(version?: number): HttpHeaders {
    if (version !== undefined && (!Number.isSafeInteger(version) || version < 0)) throw new Error('The current record version is missing. Reload before saving.');
    let headers = new HttpHeaders({ 'Idempotency-Key': crypto.randomUUID() });
    if (version !== undefined) headers = headers.set('If-Match', `"${version}"`);
    return headers;
  }
  private rows(path:string,page=0):Observable<any[]> {
    return this.http.get<any>(`${path}${path.includes('?')?'&':'?'}page=${page}&size=100`).pipe(switchMap(result=>{
      const rows=result?.items??result?.content;
      if(!Array.isArray(rows))throw new Error('The backend returned an invalid table response.');
      return page+1<result.totalPages?this.rows(path,page+1).pipe(map(next=>[...rows,...next])):of(rows);
    }));
  }
  private table<T>(key: string, request: Observable<any[]>, target: WritableSignal<T[]>): Observable<T[]> {
    this.clear(key);
    return request.pipe(tap(rows => target.set(rows)), catchError(error => { target.set([]); this.errors.update(all => ({ ...all, [key]: this.message(error) })); return of([]); }));
  }
  loadInitialStaffData(): void {
    if (!this.session.authenticated() || !this.session.isStaff()) return;
    this.http.get<any[]>('/api/v1/markets').subscribe({ next: rows => this.distributorMarket.set(rows.find(row => row.code === 'NG') ?? null), error: error => this.errors.update(all => ({...all, markets: this.message(error)})) });
    if (this.session.hasRole('CONTENT_EDITOR') && this.session.hasRole('OPERATIONS')) this.loadStaffProducts().subscribe();
    if (this.session.hasRole('OPERATIONS')) { this.loadStaffOrders().subscribe(); this.loadStaffInventory().subscribe({error:()=>{}}); this.loadStockLocations().subscribe(); this.loadStockMovements().subscribe(); }
    if (this.session.hasRole('SALES')) { this.loadStaffCustomers().subscribe(); this.loadStaffQuotes().subscribe(); this.loadStaffInquiries().subscribe(); this.loadStaffApplications().subscribe(); }
    if (this.session.hasRole('ADMIN')) this.loadStaffUsers().subscribe();
    if (this.session.hasRole('CONTENT_PUBLISHER')) this.loadStaffReviews().subscribe();
  }
  // Kept for existing view initialization; server state is the only source of records.
  hydrateFromStorage(): void {}
  addLocalApplication(_application: Partial<AdminApplication>): void { throw new Error('The application must be acknowledged by the backend before it appears in the admin portal.'); }
  addLocalInquiry(_inquiry: Partial<AdminInquiry>): void { throw new Error('The inquiry must be acknowledged by the backend before it appears in the admin portal.'); }
  addLocalQuote(_quote: Partial<AdminQuote>): void { throw new Error('The quote request must be acknowledged by the backend before it appears in the admin portal.'); }
  persistProducts(): void {}
  persistOrders(): void {}
  persistApplications(): void {}
  persistQuotes(): void {}
  persistInquiries(): void {}

  loadStaffProducts(): Observable<AdminProduct[]> {
    const request = forkJoin({ catalogue: this.rows('/api/v1/staff/products'), balances: this.rows('/api/v1/staff/inventory') }).pipe(
      map(({catalogue, balances}) => mapStaffProducts(catalogue, balances)),
      switchMap(products => products.length ? forkJoin(products.map(product => !product.skuId ? of(product) : this.http.get<any>(`/api/v1/catalogue/skus/${product.skuId}/price?market=NG&quantity=${product.packSize || '1'}`).pipe(
        map(price => ({...product, price: Number(price.unitAmount), retail: Number(price.unitAmount)})),
        catchError(error => of({...product, priceSubtitle: this.message(error)}))
      ))) : of([]))
    );
    return this.table('Products', request, this.products);
  }
  loadStaffInventory(): Observable<any[]> {
    return this.rows('/api/v1/staff/inventory').pipe(tap(rows => this.products.update(products => applyInventory(products, rows))), catchError(error => this.fail('Inventory', error)));
  }
  loadStockLocations(): Observable<any[]> {
    return this.table('Warehouses',this.http.get<any[]>('/api/v1/staff/stock-locations'),this.stockLocations);
  }
  loadInventory(): Observable<any[]> { return this.loadStaffInventory(); }
  loadStockMovements(): Observable<StockLog[]> {
    return this.table('Stock movements', this.rows('/api/v1/staff/inventory-movements').pipe(map(rows => rows.map(row => ({...row, qty: Math.abs(Number(row.change)), change: Number(row.change)})))), this.stockLog);
  }
  postStockAdjustment(sku: string, change: number, reason: string, meta?: {supplier?: string; ref?: string; notes?: string; locationId?: string}): Observable<any> {
    return defer(() => {
      this.clear('Stock adjustment');
      if (!Number.isFinite(change) || change === 0) throw new Error('Enter a non-zero stock adjustment.');
      const product = this.products().find(p => p.sku === sku || p.skuId === sku || p.id === sku);
      const skuId = product?.skuId || (/^[a-f0-9-]{36}$/i.test(sku) ? sku : null);
      if (!skuId) throw new Error('Choose an existing SKU from the inventory.');
      const explanation = [reason, meta?.supplier && `Supplier: ${meta.supplier}`, meta?.ref && `Reference: ${meta.ref}`, meta?.notes].filter(Boolean).join(' — ').trim();
      if (explanation.length < 10 || explanation.length > 500) throw new Error('Provide a stock adjustment reason between 10 and 500 characters.');
      return this.rows(`/api/v1/staff/inventory?skuId=${skuId}`).pipe(switchMap(balances => {
        let balance = meta?.locationId ? balances.find(row => row.locationId === meta.locationId) : balances.length === 1 ? balances[0] : null;
        if (!balance && meta?.locationId && this.stockLocations().some(row=>row.id===meta.locationId)) balance={locationId:meta.locationId,version:0};
        if (!balance) throw new Error('Choose an existing warehouse before adjusting stock.');
        return this.http.post<any>('/api/v1/staff/stock-adjustments', {skuId, locationId: balance.locationId, delta: String(change), reason: explanation}, {headers: this.headers(balance.version)});
      }), switchMap(result => this.loadStaffProducts().pipe(map(() => result))), tap(() => {this.log('Stock adjustment recorded'); this.loadStockMovements().subscribe();}));
    }).pipe(catchError(error => this.fail('Stock adjustment', error)));
  }
  adjustStock(sku: string, change: number, reason: string, meta?: any): void { this.postStockAdjustment(sku, change, reason, meta).subscribe({error: () => {}}); }

  private productBody(payload: any, categories: any[], brands: any[]): any {
    const category = categories.find(row => row.id === payload.categoryId || row.name.toLowerCase() === (payload.category || payload.categoryName || '').toLowerCase());
    const categoryIds = category ? [category.id] : payload.categoryIds || [];
    if (!categoryIds.length) throw new Error('Choose a category returned by the backend.');
    const brandName = (payload.brand || '').trim();
    const brand = brands.find(row => brandName ? row.name.toLowerCase() === brandName.toLowerCase() : row.id === payload.brandId);
    if (brandName && !brand && !payload.brandId) throw new Error('Choose an existing brand or create it before saving.');
    const specifications = Object.fromEntries(Object.entries(payload.specifications || {}).filter(([,value]) => value !== undefined && value !== null && value !== ''));
    return {name: (payload.name || '').trim(), slug: payload.slug || (payload.name || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''), description: payload.description ?? payload.desc ?? '', brandId: brand?.id || null, divisionCode: null, categoryIds, specifications};
  }
  createProduct(payload: any): Observable<any> {
    if(!payload.sku?.trim() || !payload.carrierPackaging) return throwError(()=>new Error('SKU and measured shipping package are required before creating a product.'));
    return forkJoin({categories: this.http.get<any[]>('/api/v1/catalogue/categories?market=NG'), brands: this.http.get<any[]>('/api/v1/catalogue/brands')}).pipe(
      switchMap(({categories, brands}) => this.http.post<any>('/api/v1/staff/products', this.productBody(payload, categories, brands), {headers: this.headers()})),
      switchMap(product => {
        if (!payload.sku?.trim()) throw new Error('The product draft was created, but a SKU code is required. Reload drafts before retrying.');
        const body = {code: payload.sku.trim(), variantName: payload.name.trim(), unit: 'unit', quantityScale: 0, packSize: '1', carrierPackaging: payload.carrierPackaging};
        return this.http.post<any>(`/api/v1/staff/products/${product.id}/skus`, body, {headers: this.headers(product.version)}).pipe(
          switchMap(() => this.http.get<any>(`/api/v1/staff/products/${product.id}`))
        );
      }),
      tap(() => {this.log('Product and SKU saved as a draft'); this.loadStaffProducts().subscribe();}),
      catchError(error => this.fail('Save product', error))
    );
  }
  updateProduct(id: string, payload: any): Observable<any> {
    return forkJoin({current: this.http.get<any>(`/api/v1/staff/products/${id}`), categories: this.http.get<any[]>('/api/v1/catalogue/categories?market=NG'), brands: this.http.get<any[]>('/api/v1/catalogue/brands')}).pipe(
      switchMap(({current, categories, brands}) => this.http.patch<any>(`/api/v1/staff/products/${id}`, this.productBody(payload, categories, brands), {headers: this.headers(payload.version ?? current.version)})),
      tap(() => {this.log('Product changes saved'); this.loadStaffProducts().subscribe();}), catchError(error => this.fail('Save product', error))
    );
  }
  publishProduct(id: string, action: 'PUBLISH'|'ARCHIVE', reason = 'Catalogue publication updated by staff'): Observable<any> {
    return this.http.get<any>(`/api/v1/staff/products/${id}`).pipe(
      switchMap(product => action === 'ARCHIVE' ? of(product) : this.http.get<any[]>('/api/v1/markets').pipe(switchMap(markets => {
        const market = markets.find(row => row.code === 'NG');if(!market)throw new Error('The Nigeria market is not configured.');
        return this.http.put<any>(`/api/v1/staff/products/${id}/markets/${market.id}`,{eligible:true,reason:'Product published for the Nigeria market by staff'},{headers:this.headers(product.version)});
      }))),
      switchMap(product => this.http.post<any>(`/api/v1/staff/products/${id}/publication`,{action,reason},{headers:this.headers(product.version)})),tap(()=>this.loadStaffProducts().subscribe()),catchError(error=>this.fail('Product publication',error))
    );
  }
  deleteProduct(idOrSku: string): Observable<boolean> {
    const id = this.products().find(p => p.id === idOrSku || p.sku === idOrSku)?.id || idOrSku;
    return this.publishProduct(id, 'ARCHIVE').pipe(map(() => true));
  }
  loadStaffUsers(): Observable<AdminUser[]> {
    return this.table('Staff users', this.rows('/api/v1/staff/users').pipe(map(rows => rows.filter(row => row.roles.length).map(row => ({id: row.id, name: row.displayName, email: row.email || '', roleId: row.roles[0], roles: row.roles, status: 'Active' as const, version: row.version})))), this.admins);
  }
  updateUserRoles(userId: string, roles: string[], reason = 'Staff role assignment updated by administrator'): Observable<boolean> {
    return defer(() => {
      this.clear('Staff permissions');
      const current = this.admins().find(user => user.id === userId);
      if (!current || current.version == null) throw new Error('Reload the current staff record before changing roles.');
      return this.http.put<any>(`/api/v1/staff/users/${userId}/roles`, {roles, reason}, {headers: this.headers(current.version)}).pipe(switchMap(() => this.loadStaffUsers()), map(() => true));
    }).pipe(catchError(error => this.fail('Staff permissions', error)));
  }
  updateStaffUser(user:AdminUser,reason='Staff role assignment updated by administrator'):Observable<boolean>{return this.http.put<any>(`/api/v1/staff/users/${user.id}/roles`,{roles:user.status==='Disabled'?[]:user.roles||[user.roleId],reason},{headers:this.headers(user.version)}).pipe(switchMap(()=>this.loadStaffUsers()),map(()=>true),catchError(e=>this.fail('Staff permissions',e)));}
  addStaffUser(user:AdminUser,_password?:string,reason='Existing customer assigned staff permissions'):Observable<boolean>{return this.rows(`/api/v1/staff/users?q=${encodeURIComponent(user.email)}`).pipe(switchMap(rows=>{const party=rows.find(row=>row.email?.toLowerCase()===user.email.toLowerCase());if(!party)throw new Error('Register this account through Sign up before assigning staff access.');return this.updateStaffUser({...user,id:party.id,version:party.version},reason);}),catchError(e=>this.fail('Assign staff roles',e)));}
  deleteStaffUser(userId: string): Observable<boolean> { return this.updateUserRoles(userId, [], 'Staff access removed by administrator'); }
  loadStaffCustomers(): Observable<AdminCustomer[]> {
    return this.table('Customers', this.rows('/api/v1/staff/customers').pipe(map(rows => rows.map(row => ({...row, email: row.email || '', phone: row.phone || '', location: '', saved: 0, status: row.status === 'ACTIVE' ? 'Active' as const : 'Suspended' as const})))), this.customers);
  }
  updateCustomerStatus(_id: string, _status: 'Active'|'Suspended'): void { this.errors.update(all => ({...all, Customers: 'Customer account suspension is not available through this portal. Staff access is managed on Admin Users.'})); }
  saveCustomer(_customer: AdminCustomer): void { throw new Error('Customer profiles are managed by their account owners.'); }
  loadStaffOrders(): Observable<AdminOrder[]> {
    return this.table('Orders', this.rows('/api/v1/staff/orders').pipe(map(rows => rows.map(order => ({id: order.id, number: order.orderNumber, date: order.createdAt, version: order.version, rawState: order.status,
      customer: {name: order.address?.recipient || '', email: '', phone: order.address?.phone || '', address: [order.address?.line1, order.address?.city, order.address?.region].filter(Boolean).join(', ')},
      items: (order.lines || []).map((line: any) => ({sku: line.skuCode, name: line.name, qty: Number(line.quantity), price: Number(line.unitAmount)})), total: Number(order.totals.grandTotal), paymentStatus: order.paymentStatus === 'PAID' ? 'Paid' as const : order.paymentStatus === 'REFUNDED' ? 'Refunded' as const : 'Pending' as const,
      status: ({PENDING:'Pending',PAID:'Confirmed',PROCESSING:'Processing',SHIPPED:'Shipped',DELIVERED:'Delivered',CANCELLED:'Cancelled'} as any)[order.status] || order.status,
      delivery: order.fulfillmentStatus, timeline: []})))), this.orders);
  }
  setOrderStatus(id: string, status: string): void {
    const order = this.orders().find(row => row.id === id);
    if (status !== 'Processing') { this.errors.update(all => ({...all, Orders: 'Shipping and delivery require a recorded shipment and stock allocation. They cannot be changed as a display status.'})); return; }
    this.http.post(`/api/v1/staff/orders/${id}/processing`, {reason: 'Order released for processing by operations'}, {headers: this.headers(order?.version)}).pipe(switchMap(() => this.loadStaffOrders()), catchError(error => this.fail('Order processing', error))).subscribe({error: () => {}});
  }
  loadStaffQuotes(): Observable<AdminQuote[]> {
    this.quoteLoadError.set(null);
    return this.table('Quote requests', this.rows('/api/v1/staff/leads?type=QUOTE').pipe(map(rows => rows.map(row => ({id:row.id,number:'REQ-'+row.id.slice(0,8),customer:row.name,email:row.email,phone:row.phone || '',product:row.subject,sku:'',quantity:0,message:row.message,date:row.createdAt,version:row.version,status:({NEW:'Pending',ASSIGNED:'Under Review',IN_PROGRESS:'Under Review',RESOLVED:'Quoted',CLOSED:'Closed'} as any)[row.state]})))), this.quotes).pipe(tap(() => this.quoteLoadError.set(this.errors()['Quote requests'] || null)));
  }
  private updateLead(id: string, version: number | undefined, state: string, note: string): Observable<any> {
    return defer(() => {if (version == null) throw new Error('Reload the current lead before saving.');return this.http.patch<any>(`/api/v1/staff/leads/${id}`, {state, note}, {headers: this.headers(version)});});
  }
  setQuoteStatus(id: string, status: string): void {
    const row = this.quotes().find(row => row.id === id);
    const state = ({Pending:'NEW','Under Review':'IN_PROGRESS',Quoted:'RESOLVED',Closed:'CLOSED'} as any)[status];
    this.updateLead(id,row?.version,state,'Quote request status updated by staff').pipe(switchMap(() => this.loadStaffQuotes()), catchError(error => this.fail('Quote request update',error))).subscribe({error: () => {}});
  }
  loadStaffInquiries(): Observable<AdminInquiry[]> {
    return this.table('Contact inquiries', this.rows('/api/v1/staff/leads?type=CONTACT').pipe(map(rows => rows.map(row => ({id:row.id,name:row.name,email:row.email,phone:row.phone || '',subject:row.subject,message:row.message,date:row.createdAt,version:row.version,status:({NEW:'New',ASSIGNED:'In Progress',IN_PROGRESS:'In Progress',RESOLVED:'Resolved',CLOSED:'Resolved'} as any)[row.state]})))), this.inquiries);
  }
  setInquiryStatus(id: string, status: string): void {
    const row = this.inquiries().find(row => row.id === id);
    this.updateLead(id,row?.version,status === 'Resolved' ? 'RESOLVED' : 'IN_PROGRESS','Contact inquiry updated by staff').pipe(switchMap(() => this.loadStaffInquiries()),catchError(error => this.fail('Inquiry update',error))).subscribe({error: () => {}});
  }
  loadStaffApplications(): Observable<AdminApplication[]> {
    this.applicationError.set(null);
    return this.table('Distributor applications',this.rows('/api/v1/staff/distributor-applications').pipe(switchMap(rows => rows.length ? forkJoin(rows.map(row => this.http.get<any>(`/api/v1/staff/distributor-applications/${row.id}`).pipe(map(detail=>({...row,...detail}))))) : of([])),map(rows => rows.map(row => ({id:row.id,number:row.id.slice(0,8),type:'Distributor' as const,businessName:row.organizationName || '',contactPerson:row.contactName || '',email:row.email || '',phone:row.phone || '',location:row.countryCode || '',category:'',date:row.submittedAt,status:distributorDisplayState(row.state),note:row.reviewReason || '',version:row.version})))),this.applications).pipe(tap(() => this.applicationError.set(this.errors()['Distributor applications'] || null)));
  }
  setApplicationStatus(id: string, status: string, note?: string, documentsVerified = false): Observable<any> {
    return defer(() => {
      this.applicationError.set(null);
      const row = this.applications().find(row => row.id === id);
      if (row?.version == null) throw new Error('Reload the current distributor application before deciding.');
      const {action, body} = distributorCommand(status,note?.trim() || 'Distributor application reviewed by staff',documentsVerified,this.distributorMarket()?.id);
      return this.http.post<any>(`/api/v1/staff/distributor-applications/${id}/${action}`,body,{headers:this.headers(row.version)}).pipe(switchMap(result => this.loadStaffApplications().pipe(map(() => result))));
    }).pipe(catchError(error => {this.applicationError.set(this.message(error));return this.fail('Distributor decision',error);}));
  }
  loadStaffReviews(): Observable<AdminReview[]> {
    return this.table('Reviews',this.rows('/api/v1/staff/reviews').pipe(map(rows => rows.map(row => ({id:row.id,sku:'',product:row.productId || '',author:row.authorName || row.author || 'Customer',rating:row.rating,text:row.text || row.body,date:row.createdAt,status:row.state === 'PUBLISHED' ? 'Published' as const : 'Hidden' as const,version:row.version,state:row.state})))),this.reviews);
  }
  moderateReview(id: string, decision: 'PUBLISH'|'WITHDRAW'|'REJECT'): Observable<any> {
    return defer(() => {const row=this.reviews().find(row=>row.id===id);if(row?.version==null)throw new Error('Reload the current review before moderating.');return this.http.post<any>(`/api/v1/staff/reviews/${id}/moderation`,{decision,reason:'Review moderated by content publisher'},{headers:this.headers(row.version)});}).pipe(switchMap(result=>this.loadStaffReviews().pipe(map(()=>result))),catchError(error=>this.fail('Review moderation',error)));
  }
  loadCommerceReport(from?: string,to?: string): Observable<any> { return this.http.get('/api/v1/staff/reports/commerce',{params:{from:from||new Date(Date.now()-30*86400000).toISOString(),to:to||new Date().toISOString(),currency:'NGN'}}).pipe(catchError(error=>this.fail('Commerce report',error))); }
  loadEngagementReport(from?: string,to?: string): Observable<any> { return this.http.get('/api/v1/staff/reports/engagement',{params:{from:from||new Date(Date.now()-30*86400000).toISOString(),to:to||new Date().toISOString()}}).pipe(catchError(error=>this.fail('Engagement report',error))); }
}
