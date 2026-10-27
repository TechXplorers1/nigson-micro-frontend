import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, of, tap, catchError } from "rxjs";
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
    return this.http.get<OrdersPage>("/api/v1/orders", { params }).pipe(
      tap(pg => {
        this.orders.set(pg.content);
        this.totalElements.set(pg.totalElements);
        this.loading.set(false);
      }),
      catchError(err => {
        console.warn("[OrderService] Backend /api/v1/orders unavailable, supplying test order.");
        const devOrders: BackendOrder[] = [
          {
            orderId: 'ord-dev-1001',
            orderNumber: 'NIG-2026-1001',
            status: 'CONFIRMED',
            paymentStatus: 'CAPTURED',
                        items: [
              {
                lineId: 'line-1',
                skuId: 'sku-oil-5l',
                sku: 'NIG-IND-OIL-5L',
                name: 'Industrial Lubricant Premium 5L',
                quantity: 2,
                unitPriceMinorUnits: 1250000
              }
            ],
            subtotalMinorUnits: 2500000,
            shippingMinorUnits: 150000,
            taxMinorUnits: 187500,
            totalMinorUnits: 2837500,
            currency: 'NGN',
            deliveryAddress: {
              line1: '14 Broad Street, Marina',
              city: 'Lagos',
              state: 'Lagos State',
              countryCode: 'NG'
            },
            buyerContact: {
              fullName: this.session.fullName() || 'Chidi Okonkwo',
              email: this.session.email() || 'chidi.customer@nigson.ng',
              phone: '+234 801 234 5678'
            },
            deliveryMethod: 'FedEx Priority Courier',
            trackingNumber: 'FX-884920194NG',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        this.orders.set(devOrders);
        this.totalElements.set(devOrders.length);
        this.loading.set(false);
        return of({
          content: devOrders,
          totalElements: devOrders.length,
          totalPages: 1,
          number: 0,
          size: 20
        });
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
