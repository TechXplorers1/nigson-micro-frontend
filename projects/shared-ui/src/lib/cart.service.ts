import { Injectable, inject, signal, computed, effect } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, of, tap, catchError, switchMap, map, forkJoin } from "rxjs";
import { SessionService } from "./session.service";

export interface CartLineItem {
  lineId: string;
  skuId: string;
  productId?: string;
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
  quantity: string | number;
  sku?: string;
  name?: string;
  unitPriceMinorUnits?: number;
  imageUrl?: string;
  categoryName?: string;
}

interface BackendCart {
  id: string;
  marketId: string;
  organizationId: string | null;
  state: string;
  lines: BackendLine[];
  version: number;
  lastActivityAt: string;
  userId?: string;
}

export interface SkuMetadata {
  skuId: string;
  productId?: string;
  code: string;
  name: string;
  priceMinor: number;
  img: string;
  category: string;
}

const S3_PRODUCTS_BASE = 'http://localhost:4566/nigson-product-images/products';

const OFFICIAL_SKUS: SkuMetadata[] = [
  { skuId: 'ecac9622-ee78-5c52-8eb5-7c244e055d03', productId: '5570995e-1b59-5592-ba5c-fa95a0c02c20', code: 'NS03', name: 'NS03 Wireless Earbuds (TWS)', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns03/img-1.png`, category: 'Earbuds' },
  { skuId: 'c52cf637-25d0-5eb6-862a-e737389c7ad4', productId: '8ba363e8-815a-52ee-be26-74da166eba83', code: 'NS06', name: 'NS06 ANC/ENC Wireless Earbuds', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns06/img-1.png`, category: 'Earbuds' },
  { skuId: '63573bb9-a11d-542a-97aa-ca6cb2c92290', productId: '41934e70-179f-5c0a-9498-28c8b6a4fd9f', code: 'NS107', name: 'NS107 High-Power Car Charger with Retractable Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns107/img-1.png`, category: 'Chargers' },
  { skuId: '4907f781-8654-5559-88cf-1ce35df2cb15', productId: 'bff4b7e3-8e19-566b-9c95-bc941390f84f', code: 'NS211C', name: 'NS211C Type-C to Type-C PD65W Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns211c/img-1.png`, category: 'Cables' },
  { skuId: 'c3002b2f-4326-59ec-b460-09ba406bc800', productId: '3bd11da9-6a93-5f56-ae87-8afdad3d52ab', code: 'NS211i', name: 'NS211i Type-C to Lightning PD30W Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns211i/img-1.png`, category: 'Cables' },
  { skuId: 'f65f2023-ef23-53ca-bfa2-8b40877ed658', productId: '1908dc43-accf-5578-870c-ec519d73367c', code: 'NS25', name: 'NS25 4-in-1 Charging Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns25/img-1.png`, category: 'Cables' },
  { skuId: '812f8742-6c94-5b92-a313-f0c0fdee9559', productId: '51c9cd3c-5d6c-5049-b821-d80c7c512305', code: 'NS2526C', name: 'NS2526C High Power Fast Wall Charger, GaN65W', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns2526c/img-1.png`, category: 'Chargers' },
  { skuId: 'b5cf3ecb-5ed0-5e6f-9cea-4da88f91baa3', productId: '1fc9d7b4-1716-54fb-905a-ea5a80620a07', code: 'NS2618', name: 'NS2618 All-in-One Universal Multiway Adapter, GaN65W', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns2618/img-1.png`, category: 'Chargers' },
  { skuId: 'c4f089fb-7a27-5b3e-bc02-f9565d5653ff', productId: '28cd1e1a-bc40-5728-bf56-4c785b8613f2', code: 'NS3416', name: 'NS3416 65W GaN Power Socket', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns3416/img-1.png`, category: 'Extension Sockets' },
  { skuId: '51c2d6f5-82ae-5eae-8f5d-5975fd7318fc', productId: 'cd9acab9-5bce-5274-a051-773e756d1b0e', code: 'NS3604C', name: 'NS3604C Multi-Socket Extension Box', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns3604c/img-1.png`, category: 'Extension Sockets' },
  { skuId: 'b9f0156b-c3d2-5bf6-8113-b88f83c01e6d', productId: '95be469d-489f-5d09-9308-18f6941e4d41', code: 'NS4', name: 'NS4 Home Charger', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns4/img-1.png`, category: 'Chargers' },
  { skuId: 'e5e75b4f-26fa-56bd-a68f-c10aa50082f3', productId: '240af070-7cac-5840-93f7-731aff6bf976', code: 'NS6', name: 'NS6 Large Motion-Activated Cabinet Light (410MM)', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns6/img-1.png`, category: 'Motion-Activated Lights' },
  { skuId: '4af2eb38-f4cc-5bc0-b182-01e667ed00b7', productId: '82478136-b526-5238-94c9-d076af6ebc47', code: 'NS6-1', name: 'NS6-1 Medium Motion-Activated Cabinet Light (220MM)', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns6_1/img-1.png`, category: 'Motion-Activated Lights' },
  { skuId: '21d1fa9a-6d1e-54fb-98e0-72439394fe00', productId: '0a51dae9-2795-507b-84a6-100c06513332', code: 'NS901C', name: 'NS901C Type-C to Type-C Charging Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns901c/img-1.png`, category: 'Cables' },
  { skuId: '70bdf50e-781f-5578-9afb-bcf69125a1f3', productId: '0de50201-b6bf-5270-b7d4-79766c7f9447', code: 'NS901i', name: 'NS901i Type-C to Lightning Charging Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns901i/img-1.png`, category: 'Cables' },
  { skuId: '49aca633-ca39-5771-aabd-0cd1448db881', productId: '033336d7-5025-5112-9af2-726e6e02caf4', code: 'NS96U', name: 'NS96U 3-in-1 Charging Cable', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/ns96u/img-1.png`, category: 'Cables' },
  { skuId: '04ae2d72-94ab-5ff8-82a4-28272755ee75', productId: 'fee9c518-4071-5aa7-a72b-6ed0ed1b83d3', code: 'PQ19', name: 'PQ19 Power Bank, 10,000mAh', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/pq19/img-1.png`, category: 'Power Banks' },
  { skuId: '75e0a2eb-54e6-552e-b99c-a956f8557592', productId: '1bac82ef-a37c-56b7-a290-afbddbd914a5', code: 'PQ20', name: 'PQ20 Power Bank, 20,000mAh', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/pq20/img-1.png`, category: 'Power Banks' },
  { skuId: '7faca25c-8831-5149-84e4-47e037580cac', productId: '4ad4e90d-ec4e-5caa-f7ad88e19e29', code: 'PQ28', name: 'PQ28 Magnetic Wireless Power Bank, 5,000mAh', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/pq28/img-1.jpeg`, category: 'Power Banks' },
  { skuId: '3e82bda0-2606-580f-98ef-a01e322d325a', productId: 'c7db7adb-726b-5173-a385-004b258ea128', code: 'PQ30', name: 'PQ30 Power Bank, 30,000mAh', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/pq30/img-1.png`, category: 'Power Banks' },
  { skuId: '3882394e-69bd-5c71-9b14-fcf7a82481bd', productId: 'c995e043-e1e8-5979-b4ea-e6d1dedc7322', code: 'PQ50', name: 'PQ50 Power Bank, 50,000mAh', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/pq50/img-1.png`, category: 'Power Banks' },
  { skuId: 'ecbe959f-d3e9-5f25-8cb5-1718bf14972e', productId: '4351a029-79f9-57e0-94e8-466d7ad4ef19', code: 'ZS6', name: 'ZS6 Multi-Device Desktop Fast Charger', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/zs6/img-1.png`, category: 'Chargers' },
  { skuId: '0df9e4fb-2794-55fe-a1f9-d8977114b7e9', productId: 'fa096df5-7313-5a7a-aa01-4475ee45b98f', code: 'ZS8', name: 'ZS8 Ultra-Fast GaN Travel Charger 65W', priceMinor: 0, img: `${S3_PRODUCTS_BASE}/zs8/img-1.png`, category: 'Chargers' }
];

export const DEMO_PRODUCTS_METADATA: SkuMetadata[] = [
  { skuId: '8dd03db8-c840-5da9-a005-67174d5272fc', productId: 'afb3c9bf-4885-5f5b-b929-a0ea7cb76df2', code: 'DEMO-EL-01-01', name: 'Demo 14-inch Ultrabook', priceMinor: 52000000, img: '/assets/cat-powerbank.jpg', category: 'Laptops' },
  { skuId: 'dd3573ba-5a3a-5c20-be9c-c3265f48e7dc', productId: '7fad7d19-05f3-5517-8cfb-9b609eaa64f3', code: 'DEMO-EL-01-02', name: 'Demo 15-inch Performance Laptop', priceMinor: 78000000, img: '/assets/cat-powerbank.jpg', category: 'Laptops' },
  { skuId: '024bcad4-81c6-5379-97d2-947e77a9a8c4', productId: '16378b8b-e963-54ad-bfd0-27039459ca47', code: 'DEMO-EL-01-03', name: 'Demo 13-inch Student Laptop', priceMinor: 45200000, img: '/assets/cat-powerbank.jpg', category: 'Laptops' },
  { skuId: 'c9122607-2f48-5329-b497-70725334813b', productId: 'ab80d37e-4dca-5e9f-8aa6-461bba6d991b', code: 'DEMO-EL-02-01', name: 'Demo 5G Smartphone 128 GB', priceMinor: 18500000, img: '/assets/hero-accessories.jpg', category: 'Smartphones' },
  { skuId: 'c59b5e73-0da1-5ba9-98cd-7f183ffb59ef', productId: '6babee4f-7b82-562f-89a6-3a64334f6c22', code: 'DEMO-EL-02-02', name: 'Demo Pro Smartphone 256 GB', priceMinor: 31000000, img: '/assets/hero-accessories.jpg', category: 'Smartphones' },
  { skuId: 'b546d4f3-4605-5016-90dd-36a0168a3452', productId: '7b76a39b-85bf-5490-92bd-d0f54b96f1c6', code: 'DEMO-EL-02-03', name: 'Demo Compact Smartphone 64 GB', priceMinor: 9500000, img: '/assets/hero-accessories.jpg', category: 'Smartphones' },
  { skuId: '13b3215c-6a3f-538e-afb7-530d96a5ac4a', productId: '8a3a8400-13c3-5111-9795-755942a20863', code: 'DEMO-EL-03-01', name: 'Demo 10-inch Android Tablet', priceMinor: 11000000, img: '/assets/cat-powerbank.jpg', category: 'Tablets' },
  { skuId: 'ac5217b8-d5af-58ab-bff5-0b6462adb152', productId: 'da31161c-eef2-518d-a4e8-1dfb6d277628', code: 'DEMO-EL-03-02', name: 'Demo 11-inch Drawing Tablet', priceMinor: 24000000, img: '/assets/cat-powerbank.jpg', category: 'Tablets' },
  { skuId: '613216bb-4795-5039-b0f2-0df2a01528f8', productId: '7448afea-6817-50af-b242-b49c2c0ebb6d', code: 'DEMO-EL-03-03', name: 'Demo 8-inch Kids Tablet', priceMinor: 6500000, img: '/assets/cat-powerbank.jpg', category: 'Tablets' },
  { skuId: 'b38607c1-f008-5923-8e29-0de559560329', productId: 'cfae03e5-b480-52e6-9fed-df8b23a3a12b', code: 'DEMO-EL-04-01', name: 'Demo Wireless Noise-Cancelling Headphones', priceMinor: 4800000, img: '/assets/cat-earbuds.jpg', category: 'Audio' },
  { skuId: '03538c8a-5dcb-5d1a-a5e1-9d1670ba9620', productId: '1137ba42-7718-5f64-9461-9900d52e68b7', code: 'DEMO-EL-04-02', name: 'Demo True Wireless Earbuds', priceMinor: 2600000, img: '/assets/cat-earbuds.jpg', category: 'Audio' },
  { skuId: '877d2857-7d5a-5472-bced-8c938c564905', productId: '5444f3bc-4e84-50ed-9903-042087710f0e', code: 'DEMO-EL-04-03', name: 'Demo Portable Bluetooth Speaker', priceMinor: 2700000, img: '/assets/cat-earbuds.jpg', category: 'Audio' },
  { skuId: 'a4240469-5751-5ee3-b11e-423b5bcd1df1', productId: '729cc696-6588-59b7-aad3-75a268413ca3', code: 'DEMO-EL-05-01', name: 'Demo Mechanical Gaming Keyboard', priceMinor: 3500000, img: '/assets/hero-accessories.jpg', category: 'Gaming' },
  { skuId: '0677c163-e73d-5c80-bfa4-93c0a255e882', productId: 'b720ab55-fe00-55ec-b112-fce043589208', code: 'DEMO-EL-05-02', name: 'Demo Wireless Gaming Mouse', priceMinor: 1800000, img: '/assets/hero-accessories.jpg', category: 'Gaming' },
  { skuId: 'b4a11381-8921-50b8-b979-aa303945a1eb', productId: 'd45b7897-222c-54ba-9ef8-9c3640dfa4ed', code: 'DEMO-EL-05-03', name: 'Demo 27-inch Gaming Monitor', priceMinor: 21500000, img: '/assets/hero-accessories.jpg', category: 'Gaming' },
  { skuId: '29f666d2-5b32-5564-a5cf-f095215c81b3', productId: '8fced558-b0fa-58f1-8dd5-dbe2f012ef8e', code: 'DEMO-EL-06-01', name: 'Demo Wi-Fi 6 Dual-Band Router', priceMinor: 4200000, img: '/assets/hero-accessories.jpg', category: 'Networking' },
  { skuId: 'd7d48669-6d1d-5b96-bc0b-d146de217738', productId: '8dec8340-6b04-54d9-80fa-01ad2943d7dd', code: 'DEMO-EL-06-02', name: 'Demo 8-Port Gigabit Switch', priceMinor: 2200000, img: '/assets/hero-accessories.jpg', category: 'Networking' },
  { skuId: 'b0c7bd40-d1b8-546f-8bdc-c2194894d605', productId: '7d9c70a9-2a25-5c51-9b8a-67685dcbd7a7', code: 'DEMO-EL-06-03', name: 'Demo USB Wi-Fi Adapter', priceMinor: 850000, img: '/assets/hero-accessories.jpg', category: 'Networking' },
  { skuId: '3ac8e4e4-49c7-549c-958f-9051347f33d2', productId: '65604e71-466b-5ffa-8293-3cbacd038b62', code: 'DEMO-EL-07-01', name: 'Demo 1 TB Portable SSD', priceMinor: 8500000, img: '/assets/cat-powerbank.jpg', category: 'Storage' },
  { skuId: 'e96bcd85-3620-5858-8dda-acfda62ff3b6', productId: '2f85101c-1c36-5f86-a3b1-e382aec189f4', code: 'DEMO-EL-07-02', name: 'Demo 2 TB External Hard Drive', priceMinor: 2100000, img: '/assets/cat-powerbank.jpg', category: 'Storage' },
  { skuId: '4fc83b37-fd00-547d-8c67-129976973011', productId: '961350eb-4b06-5081-9840-7fa09679d95e', code: 'DEMO-EL-07-03', name: 'Demo 128 GB USB Flash Drive', priceMinor: 850000, img: '/assets/cat-powerbank.jpg', category: 'Storage' },
  { skuId: '7ddfd7c5-0e32-5482-80d6-05f656854a11', productId: '29c5d453-66c5-527a-818a-2f4da2b022a6', code: 'DEMO-EL-08-01', name: 'Demo 65 W USB-C GaN Charger', priceMinor: 1500000, img: '/assets/cat-charger.jpg', category: 'Power and Accessories' },
  { skuId: 'd9a0ad9d-c004-572b-af94-86cb6618222d', productId: '716b41e5-0bcf-5d17-85b6-b601d6c5c0a5', code: 'DEMO-EL-08-02', name: 'Demo 20000 mAh Power Bank', priceMinor: 2500000, img: '/assets/cat-powerbank.jpg', category: 'Power and Accessories' },
  { skuId: 'e286c2ac-8c4a-5838-bc0a-dbbdccd1a68a', productId: '5aa7e4a1-d035-56cd-aeab-465f2cd64dee', code: 'DEMO-EL-08-03', name: 'Demo 6-Outlet Surge Protector', priceMinor: 1700000, img: '/assets/cat-powerbank.jpg', category: 'Power and Accessories' }
];

export const ALL_KNOWN_SKUS: SkuMetadata[] = [
  ...OFFICIAL_SKUS,
  ...DEMO_PRODUCTS_METADATA
];

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private session = inject(SessionService);

  readonly items = signal<CartLineItem[]>([]);
  readonly savedItems = signal<CartLineItem[]>([]);
  readonly cartId = signal<string | null>(null);
  readonly cartVersion = signal<number>(0);
  readonly loading = signal(false);
  readonly syncing = signal(false);

  // Selective Checkout Signals
  readonly selectedLineIds = signal<Set<string>>(new Set());

  readonly itemCount = computed(() => this.items().reduce((n, i) => n + i.quantity, 0));
  readonly subtotalNaira = computed(() =>
    this.items().reduce((n, i) => n + (i.unitPriceMinorUnits * i.quantity) / 100, 0)
  );
  readonly subtotalDisplay = computed(() =>
    String.fromCharCode(8358) + this.subtotalNaira().toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  readonly selectedItems = computed(() => {
    const selected = this.selectedLineIds();
    return this.items().filter(i => selected.has(i.lineId || i.skuId));
  });

  readonly selectedItemCount = computed(() =>
    this.selectedItems().reduce((n, i) => n + i.quantity, 0)
  );

  readonly selectedSubtotalNaira = computed(() =>
    this.selectedItems().reduce((n, i) => n + (i.unitPriceMinorUnits * i.quantity) / 100, 0)
  );

  readonly selectedSubtotalDisplay = computed(() =>
    String.fromCharCode(8358) + this.selectedSubtotalNaira().toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );

  readonly isAllSelected = computed(() => {
    const list = this.items();
    if (!list.length) return false;
    const selected = this.selectedLineIds();
    return list.every(i => selected.has(i.lineId || i.skuId));
  });

  isSelected(lineOrSkuId: string): boolean {
    return this.selectedLineIds().has(lineOrSkuId);
  }

  toggleSelected(lineOrSkuId: string) {
    const current = new Set(this.selectedLineIds());
    if (current.has(lineOrSkuId)) {
      current.delete(lineOrSkuId);
    } else {
      current.add(lineOrSkuId);
    }
    this.selectedLineIds.set(current);
  }

  selectAll(selected: boolean) {
    if (selected) {
      const all = new Set(this.items().map(i => i.lineId || i.skuId));
      this.selectedLineIds.set(all);
    } else {
      this.selectedLineIds.set(new Set());
    }
  }

  constructor() {
    effect(() => {
      const isAuth = this.session.authenticated();
      const uid = this.session.userId();
      if (isAuth && uid) {
        this.handleUserLogin(uid);
      } else if (!isAuth) {
        this.handleUserLogout();
      }
    });
  }

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  private handleUserLogin(userId: string) {
    this.loadCart().subscribe();
  }

  private handleUserLogout() {
    this.cartId.set(null);
    this.cartVersion.set(0);
    sessionStorage.removeItem('nigson_active_cart_id');
    this.items.set([]);
    this.selectedLineIds.set(new Set());
  }

  private skuCache = new Map<string, SkuMetadata>();

  private resolveSkuMetadata(input: string, fallback?: Partial<SkuMetadata>): SkuMetadata {
    const found = ALL_KNOWN_SKUS.find(s => 
      s.skuId === input || 
      s.code === input || 
      (s.productId && s.productId === input) ||
      s.code.toLowerCase() === input.toLowerCase()
    );
    if (found) {
      return {
        ...found,
        name: fallback?.name || found.name,
        priceMinor: fallback?.priceMinor ?? found.priceMinor,
        img: fallback?.img || found.img,
        category: fallback?.category || found.category
      };
    }

    // Check in-memory or persisted skuCache
    let cached = this.skuCache.get(input);
    if (!cached) {
      try {
        const stored = localStorage.getItem('nigson_sku_meta_' + input);
        if (stored) cached = JSON.parse(stored);
      } catch {}
    }
    if (cached) {
      return {
        ...cached,
        name: fallback?.name || cached.name,
        priceMinor: fallback?.priceMinor ?? cached.priceMinor,
        img: fallback?.img || cached.img,
        category: fallback?.category || cached.category
      };
    }

    return {
      skuId: input,
      code: fallback?.code || input,
      name: fallback?.name || `SKU ${input.slice(0, 8)}`,
      priceMinor: fallback?.priceMinor ?? 0,
      img: fallback?.img || '/assets/hero-accessories.jpg',
      category: fallback?.category || 'General'
    };
  }

  registerSkuMetadata(meta: SkuMetadata) {
    if (!meta || !meta.skuId) return;
    this.skuCache.set(meta.skuId, meta);
    if (meta.code) this.skuCache.set(meta.code, meta);
    if (meta.code) this.skuCache.set(meta.code.toLowerCase(), meta);
    if (meta.productId) this.skuCache.set(meta.productId, meta);
    try {
      localStorage.setItem('nigson_sku_meta_' + meta.skuId, JSON.stringify(meta));
      if (meta.productId) localStorage.setItem('nigson_sku_meta_' + meta.productId, JSON.stringify(meta));
      if (meta.code) localStorage.setItem('nigson_sku_meta_' + meta.code, JSON.stringify(meta));
    } catch {}
  }

  ensureCart(): Observable<string | null> {
    if (!this.session.authenticated()) return of(null);
    if (this.cartId()) return of(this.cartId());

    const storedId = sessionStorage.getItem('nigson_active_cart_id');
    const headers = this.getAuthHeaders();

    if (storedId) {
      return this.http.get<BackendCart>(`/api/v1/carts/${storedId}`, { headers }).pipe(
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
    const headers = this.getAuthHeaders().set('Idempotency-Key', crypto.randomUUID());
    return this.http.get<Array<{ id: string; code: string; currency: string }>>('/api/v1/markets').pipe(
      map(markets => markets.find(market => market.code === 'NG' && market.currency === 'NGN')?.id || null),
      switchMap(marketId => marketId ? this.http.post<BackendCart>('/api/v1/carts', { marketId }, { headers }) : of(null)),
      switchMap(cart => cart ? of(cart) : of(null)),
      tap(cart => {
        if (!cart) return;
        this.cartId.set(cart.id);
        this.cartVersion.set(cart.version);
        sessionStorage.setItem('nigson_active_cart_id', cart.id);
        this.items.set(this.mapLines(cart.lines));
      }),
      map(cart => cart?.id ?? null),
      catchError(err => {
        console.warn('[CartService] Java Commerce cart creation failed:', err);
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
        const headers = this.getAuthHeaders();
        return this.http.get<BackendCart>(`/api/v1/carts/${cartId}`, { headers }).pipe(
          switchMap(cart => {
            this.cartId.set(cart.id);
            this.cartVersion.set(cart.version);
            return this.loadLinePrices(this.mapLines(cart.lines)).pipe(map(mapped => {
              this.items.set(mapped);
              this.loading.set(false);
              return {
                cartId: cart.id,
                items: mapped,
                subtotalMinorUnits: mapped.reduce((sum, line) => sum + line.unitPriceMinorUnits * line.quantity, 0),
                currency: 'NGN',
                marketId: cart.marketId,
                version: cart.version
              };
            }));
          }),
          catchError(err => {
            console.warn('[CartService] loadCart database error:', err);
            this.loading.set(false);
            return of(null);
          })
        );
      })
    );
  }

  addItem(skuId: string, quantity = 1, details?: { sku?: string; productId?: string; name?: string; category?: string; priceMinor?: number; image?: string }): Observable<CartSummary | null> {
    if (!this.session.authenticated()) {
      this.session.signIn(window.location.pathname);
      return of(null);
    }

    // Persist rich metadata for this SKU
    if (details) {
      const meta: SkuMetadata = {
        skuId,
        productId: details.productId,
        code: details.sku || skuId,
        name: details.name || `SKU ${skuId.slice(0, 8)}`,
        priceMinor: details.priceMinor || 0,
        img: details.image || '/assets/hero-accessories.jpg',
        category: details.category || 'General'
      };
      this.skuCache.set(skuId, meta);
      if (details.sku) this.skuCache.set(details.sku, meta);
      if (details.productId) this.skuCache.set(details.productId, meta);
      try {
        localStorage.setItem('nigson_sku_meta_' + skuId, JSON.stringify(meta));
        if (details.sku) localStorage.setItem('nigson_sku_meta_' + details.sku, JSON.stringify(meta));
        if (details.productId) localStorage.setItem('nigson_sku_meta_' + details.productId, JSON.stringify(meta));
      } catch {}
    }

    this.syncing.set(true);
    return this.ensureCart().pipe(
      switchMap(cartId => {
        if (!cartId) {
          this.syncing.set(false);
          return of(null);
        }
        const currentLine = this.items().find(i => i.skuId === skuId || i.sku === skuId);
        const targetQty = (currentLine?.quantity || 0) + quantity;

        const headers = this.getAuthHeaders()
          .set('If-Match', `"${this.cartVersion()}"`)
          .set('Idempotency-Key', crypto.randomUUID());

        return this.http.put<BackendCart>(
          `/api/v1/carts/${cartId}/lines/${skuId}`,
          { quantity: String(targetQty) },
          { headers }
        ).pipe(
          switchMap(cart => this.loadLinePrices(this.mapLines(cart.lines)).pipe(map(mapped => {
            this.cartId.set(cart.id);
            this.cartVersion.set(cart.version);
            this.items.set(mapped);
            this.syncing.set(false);
            return {
              cartId: cart.id,
              items: mapped,
              subtotalMinorUnits: mapped.reduce((sum, line) => sum + line.unitPriceMinorUnits * line.quantity, 0),
              currency: 'NGN',
              marketId: cart.marketId,
              version: cart.version
            };
          }))),
          catchError(err => {
            console.error('[CartService] addItem database sync error:', err);
            this.syncing.set(false);
            return of(null);
          })
        );
      })
    );
  }

  updateQty(lineIdOrSku: string, quantity: number): Observable<CartSummary | null> {
    if (!this.session.authenticated() || !this.cartId()) {
      return of(null);
    }
    if (quantity <= 0) {
      return this.removeItem(lineIdOrSku);
    }
    const it = this.items().find(i =>
      i.lineId === lineIdOrSku ||
      i.skuId === lineIdOrSku ||
      i.sku === lineIdOrSku ||
      (i.sku && lineIdOrSku && i.sku.toLowerCase() === lineIdOrSku.toLowerCase())
    );
    if (!it) {
      console.warn('[CartService] updateQty target item not found in cart for:', lineIdOrSku);
      return of(null);
    }

    const prevItems = this.items();
    // Optimistic UI update so quantity stepper feels instant and responsive
    this.items.set(prevItems.map(item => item === it ? { ...item, quantity } : item));

    const targetSkuId = it.skuId;
    this.syncing.set(true);
    const headers = this.getAuthHeaders()
      .set('If-Match', `"${this.cartVersion()}"`)
      .set('Idempotency-Key', crypto.randomUUID());

    return this.http.put<BackendCart>(
      `/api/v1/carts/${this.cartId()}/lines/${targetSkuId}`,
      { quantity: String(quantity) },
      { headers }
    ).pipe(
      switchMap(cart => this.loadLinePrices(this.mapLines(cart.lines)).pipe(map(mapped => {
        this.cartVersion.set(cart.version);
        this.items.set(mapped);
        this.syncing.set(false);
        return {
          cartId: cart.id,
          items: mapped,
          subtotalMinorUnits: mapped.reduce((sum, line) => sum + line.unitPriceMinorUnits * line.quantity, 0),
          currency: 'NGN',
          marketId: cart.marketId,
          version: cart.version
        };
      }))),
      catchError(err => {
        console.error('[CartService] updateQty database error:', err);
        this.items.set(prevItems);
        this.syncing.set(false);
        return of(null);
      })
    );
  }

  removeItem(lineOrSkuId: string): Observable<CartSummary | null> {
    if (!this.session.authenticated() || !this.cartId()) {
      return of(null);
    }
    const currentItems = this.items();
    const it = currentItems.find(i =>
      i.lineId === lineOrSkuId ||
      i.skuId === lineOrSkuId ||
      i.sku === lineOrSkuId ||
      (i.sku && lineOrSkuId && i.sku.toLowerCase() === lineOrSkuId.toLowerCase())
    );
    if (!it) return of(null);

    // Optimistic UI update
    this.items.set(currentItems.filter(item => item !== it));

    const targetSkuId = it.skuId;
    this.syncing.set(true);
    const headers = this.getAuthHeaders()
      .set('If-Match', `"${this.cartVersion()}"`)
      .set('Idempotency-Key', crypto.randomUUID());

    return this.http.delete<void>(
      `/api/v1/carts/${this.cartId()}/lines/${targetSkuId}`,
      { headers, observe: 'response' }
    ).pipe(
      switchMap(() => this.loadCart()),
      catchError(err => {
        console.warn('[CartService] removeItem database error:', err);
        this.items.set(currentItems);
        this.syncing.set(false);
        return of(null);
      })
    );
  }

  clearCart(): Observable<void> {
    this.items.set([]);
    this.cartId.set(null);
    this.cartVersion.set(0);
    sessionStorage.removeItem('nigson_active_cart_id');
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

  private loadLinePrices(lines: CartLineItem[]): Observable<CartLineItem[]> {
    if (!lines.length) return of([]);
    return forkJoin(lines.map(line => this.http.get<any>(
      `/api/v1/catalogue/skus/${encodeURIComponent(line.skuId)}/price?market=NG&quantity=${line.quantity}`
    ).pipe(
      map(price => ({ ...line, unitPriceMinorUnits: Math.round(Number(price.unitAmount) * 100) })),
      catchError(() => of({ ...line, unitPriceMinorUnits: 0 }))
    )));
  }

  private mapLines(lines: BackendLine[]): CartLineItem[] {
    const mapped = (lines || []).map(line => {
      const meta = this.resolveSkuMetadata(line.skuId);
      return {
        lineId: line.id || ('line-' + Math.random().toString(36).substring(2, 9)),
        skuId: line.skuId,
        productId: meta.productId,
        sku: (line as any).sku || meta.code,
        name: (line as any).name || meta.name,
        unitPriceMinorUnits: Number((line as any).unitPriceMinorUnits) || meta.priceMinor || 0,
        quantity: parseInt(String(line.quantity), 10) || 1,
        imageUrl: (line as any).imageUrl || meta.img,
        categoryName: (line as any).categoryName || meta.category
      };
    });

    // Ensure newly loaded items are selected for checkout by default
    const currentSelected = new Set(this.selectedLineIds());
    if (currentSelected.size === 0) {
      mapped.forEach(l => currentSelected.add(l.lineId || l.skuId));
    } else {
      mapped.forEach(l => {
        // Keep item selected if it was before or if it's newly added
        const key = l.lineId || l.skuId;
        if (!currentSelected.has(key)) {
          currentSelected.add(key);
        }
      });
    }
    this.selectedLineIds.set(currentSelected);
    return mapped;
  }
}
