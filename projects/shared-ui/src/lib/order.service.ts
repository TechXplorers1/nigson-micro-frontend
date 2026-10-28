import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, of, tap, catchError, map } from "rxjs";
import { SessionService } from "./session.service";

/**
 * Backend Order DTO (TASK-41 to TASK-46)
 * Aligned to GET /api/v1/orders, GET /api/v1/orders/:orderId, and /api/v1/orders/:orderId/tracking.
 */
export interface OrderItem {
  lineId: string;
  skuId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPriceMinorUnits: number;
  imageUrl?: string;
}

export interface OrderAddress {
  line1: string;
  city: string;
  state: string;
  countryCode: string;
  postalCode?: string;
}

export interface TrackingScan {
  timestamp: string;
  status: string;
  location?: string;
  description?: string;
}

export interface OrderTracking {
  orderId: string;
  trackingNumber?: string;
  carrier: string;
  status: string;
  estimatedDelivery?: string;
  scans: TrackingScan[];
}

export interface BackendOrder {
  orderId: string;
  orderNumber: string;
  status: "PENDING" | "CONFIRMED" | "PACKED" | "SHIPPED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "AUTHORISED" | "CAPTURED" | "FAILED" | "REFUNDED";
  items: OrderItem[];
  subtotalMinorUnits: number;
  shippingMinorUnits: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
  currency: string;
  deliveryAddress: OrderAddress;
  buyerContact: { fullName: string; email: string; phone?: string };
  deliveryMethod: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersPage {
  content: BackendOrder[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: "root" })
export class OrderService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  readonly orders = signal<BackendOrder[]>([]);
  readonly loading = signal(false);
  readonly totalElements = signal(0);

  /** TASK-41: Load paginated order history */
  loadOrders(page = 0, size = 20): Observable<OrdersPage | null> {
    if (!this.session.authenticated()) return of(null);
    this.loading.set(true);
    const params = new HttpParams().set("page", String(page)).set("size", String(size));
    return this.http.get<any>("/api/v1/orders", { params }).pipe(
      map(pg => {
        const rawList = pg?.items || pg?.content || [];
        const mappedOrders: BackendOrder[] = rawList.map((raw: any) => ({
          orderId: raw.id || raw.orderId,
          orderNumber: raw.orderNumber,
          status: raw.status,
          paymentStatus: raw.paymentStatus,
          items: (raw.lines || raw.items || []).map((l: any) => ({
            lineId: l.id || l.lineId,
            skuId: l.skuId,
            sku: l.skuCode || l.sku || '',
            name: l.name || '',
            quantity: Number(l.quantity) || 1,
            unitPriceMinorUnits: Math.round(parseFloat(l.unitAmount || '0') * 100),
            imageUrl: l.imageUrl
          })),
          subtotalMinorUnits: Math.round(parseFloat(raw.totals?.subtotal || '0') * 100),
          shippingMinorUnits: Math.round(parseFloat(raw.totals?.delivery || '0') * 100),
          taxMinorUnits: Math.round(parseFloat(raw.totals?.tax || '0') * 100),
          totalMinorUnits: Math.round(parseFloat(raw.totals?.grandTotal || '0') * 100),
          currency: raw.currency || 'NGN',
          deliveryAddress: raw.address ? {
            line1: raw.address.line1 || '',
            city: raw.address.city || '',
            state: raw.address.region || raw.address.state || '',
            countryCode: raw.address.countryCode || 'NG',
            postalCode: raw.address.postalCode
          } : { line1: '', city: '', state: '', countryCode: 'NG' },
          buyerContact: {
            fullName: raw.address?.recipient || '',
            email: '',
            phone: raw.address?.phone || ''
          },
          deliveryMethod: raw.fulfillmentStatus || 'STANDARD',
          trackingNumber: undefined,
          createdAt: raw.createdAt || new Date().toISOString(),
          updatedAt: raw.createdAt || new Date().toISOString()
        }));

        const resultPage: OrdersPage = {
          content: mappedOrders,
          totalElements: pg?.totalElements ?? mappedOrders.length,
          totalPages: pg?.totalPages ?? 1,
          number: pg?.page ?? page,
          size: pg?.size ?? size
        };
        return resultPage;
      }),
      tap(pg => {
        this.orders.set(pg.content);
        this.totalElements.set(pg.totalElements);
        this.loading.set(false);
      }),
      catchError(err => {
        console.error("[OrderService] Backend /api/v1/orders failed:", err?.status ?? err);
        this.orders.set([]);
        this.totalElements.set(0);
        this.loading.set(false);
        return of(null);
      })
    );
  }

  /** TASK-42: Get single order detail */
  getOrder(orderId: string): Observable<BackendOrder> {
    return this.http.get<BackendOrder>("/api/v1/orders/" + orderId);
  }

  /** TASK-44: Cancel order (API-040: POST /api/v1/orders/:orderId/cancellation) */
  cancelOrder(orderId: string): Observable<BackendOrder | null> {
    return this.http.post<BackendOrder>("/api/v1/orders/" + orderId + "/cancellation", {}).pipe(
      tap(updated => this.orders.update(list => list.map(o => o.orderId === orderId ? updated : o))),
      catchError(err => {
        console.warn("[OrderService] cancelOrder /cancellation failed, retrying /cancel:", err);
        return this.http.post<BackendOrder>("/api/v1/orders/" + orderId + "/cancel", {}).pipe(
          tap(updated => this.orders.update(list => list.map(o => o.orderId === orderId ? updated : o))),
          catchError(err2 => {
            console.error("[OrderService] cancelOrder failed:", err2);
            return of(null);
          })
        );
      })
    );
  }

  /** TASK-45: Get order tracking (API-051: GET /api/v1/orders/:orderId/tracking) */
  getTracking(orderId: string): Observable<OrderTracking | null> {
    return this.http.get<OrderTracking>("/api/v1/orders/" + orderId + "/tracking").pipe(
      catchError(err => {
        console.warn("[OrderService] getTracking:", err);
        return of(null);
      })
    );
  }

  /** Format kobo to NGN display */
  formatPrice(minorUnits: number): string {
    return String.fromCharCode(8358) + (minorUnits / 100).toLocaleString("en-NG", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  /** Map backend status enum to display label */
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PENDING: "Pending", CONFIRMED: "Confirmed", PACKED: "Packed",
      SHIPPED: "Shipped", OUT_FOR_DELIVERY: "Out For Delivery",
      DELIVERED: "Delivered", CANCELLED: "Cancelled"
    };
    return map[status] ?? status;
  }

  /** Map status to CSS badge classes */
  statusColor(status: string): string {
    const colors: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      PACKED: "bg-indigo-100 text-indigo-700",
      SHIPPED: "bg-violet-100 text-violet-700",
      OUT_FOR_DELIVERY: "bg-orange-100 text-orange-700",
      DELIVERED: "bg-emerald-100 text-emerald-700",
      CANCELLED: "bg-rose-100 text-rose-700",
    };
    return colors[status] ?? "bg-surface-alt";
  }
}
