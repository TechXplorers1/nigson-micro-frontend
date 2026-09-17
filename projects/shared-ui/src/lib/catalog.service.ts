import { Injectable } from '@angular/core';

export interface Product {
  name: string;
  sku: string;
  category: string;
  price: number;
  originalPrice?: number;
  desc: string;
  stock?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CatalogService {
  readonly CAT_IMG: Record<string, string> = {
    'Earbuds': '/assets/cat-earbuds.jpg',
    'Power Banks': '/assets/cat-powerbank.jpg',
    'Wireless Chargers': '/assets/cat-charger.jpg',
    'Car Chargers': '/assets/cat-charger.jpg',
    'Home Chargers': '/assets/cat-charger.jpg',
    'Cables': '/assets/cat-cable.jpg',
    'Adapters': '/assets/cat-charger.jpg',
    'Power Strips': '/assets/cat-powerbank.jpg',
    'Lighting': '/assets/hero-accessories.jpg',
    'FMCG': '/assets/hero-accessories.jpg',
  };

  readonly FALLBACK_IMG = '/assets/hero-accessories.jpg';

  readonly CATEGORIES = [
    "All",
    "Earbuds",
    "Power Banks",
    "Wireless Chargers",
    "Car Chargers",
    "Home Chargers",
    "Cables",
    "Adapters",
    "Power Strips",
    "Lighting",
    "FMCG",
  ] as const;

  readonly PRODUCTS: Product[] = [
    { name: "TWS Wireless Earbuds Pro", sku: "NG-EB-01", category: "Earbuds", price: 28500, desc: "Active noise cancellation, 30h playback, IPX5 water resistance." },
    { name: "In-Ear Bluetooth Earbuds", sku: "NG-EB-02", category: "Earbuds", price: 14500, desc: "Comfort fit with premium bass — great daily driver for retailers." },
    { name: "20,000mAh Fast Power Bank", sku: "NG-PB-01", category: "Power Banks", price: 18500, desc: "22.5W PD + QC. Charges phones 4-5 times on a single cycle." },
    { name: "10,000mAh Slim Power Bank", sku: "NG-PB-02", category: "Power Banks", price: 10500, desc: "Pocket-friendly form factor with USB-C in/out." },
    { name: "Magnetic Wireless Power Bank", sku: "NG-PB-03", category: "Power Banks", price: 22500, desc: "MagSafe-compatible 15W wireless charging on the go." },
    { name: "15W Magnetic Wireless Charger", sku: "NG-WC-01", category: "Wireless Chargers", price: 18500, desc: "Snap-on magnetic pad for iPhone and Qi phones." },
    { name: "Dual USB Car Charger", sku: "NG-CC-01", category: "Car Chargers", price: 9500, desc: "Compact 36W PD car adapter with dual output." },
    { name: "GaN 65W Home Charger", sku: "NG-CH-01", category: "Home Chargers", price: 16500, desc: "Charge laptop + two phones simultaneously." },
    { name: "20W Fast Home Charger", sku: "NG-CH-02", category: "Home Chargers", price: 8500, desc: "USB-C PD wall adapter — universal Nigerian pin." },
    { name: "Braided Lightning Cable 1.2m", sku: "NG-CB-01", category: "Cables", price: 6500, desc: "MFI-quality nylon braided cable, tangle-free." },
    { name: "USB-C to USB-C 60W Cable", sku: "NG-CB-02", category: "Cables", price: 7500, desc: "Fast-charge PD cable with e-marker chip." },
    { name: "4-in-1 Multi Charging Cable", sku: "NG-CB-03", category: "Cables", price: 8500, desc: "USB-A/C to Lightning + Type-C — one cable, all devices." },
    { name: "Universal Travel Adapter", sku: "NG-AD-01", category: "Adapters", price: 13500, desc: "Works in 150+ countries. Dual USB output." },
    { name: "GaN Adapter 100W", sku: "NG-AD-02", category: "Adapters", price: 28500, desc: "Four-port desktop adapter for power users." },
    { name: "6-Outlet Power Strip", sku: "NG-PS-01", category: "Power Strips", price: 15500, desc: "Surge-protected extension with USB ports." },
    { name: "Rechargeable LED Night Lamp", sku: "NG-LP-01", category: "Lighting", price: 12500, desc: "Warm-touch dimmable bedside lamp." },
    { name: "Zarina Personal Care Range", sku: "NG-FM-01", category: "FMCG", price: 4500, desc: "Our in-house personal care line — moisturisers, soaps, more." },
    { name: "Household Essentials Bundle", sku: "NG-FM-02", category: "FMCG", price: 12000, desc: "Canned foods, cleaning and household staples." },
  ];

  readonly DEAL_SKUS = new Set(["NG-EB-02", "NG-PB-02", "NG-CC-01", "NG-CH-02", "NG-CB-01", "NG-FM-01"]);
  readonly NEW_ARRIVAL_SKUS = new Set(["NG-EB-01", "NG-PB-01", "NG-PB-03", "NG-WC-01"]);

  imageFor(category: string): string {
    return this.CAT_IMG[category] ?? this.FALLBACK_IMG;
  }

  productBySku(sku: string): Product | undefined {
    return this.PRODUCTS.find((p) => p.sku === sku);
  }

  recommendedFor(sku: string): Product[] {
    const current = this.productBySku(sku);
    const others = this.PRODUCTS.filter((p) => p.sku !== sku);
    const sameCat = others.filter((p) => p.category === current?.category);
    const rest = others.filter((p) => p.category !== current?.category);
    return [...sameCat, ...rest].slice(0, 4);
  }

  formatPrice(n: number) {
    return "₦" + n.toLocaleString("en-NG");
  }

  isDeal(p: Product): boolean {
    return this.DEAL_SKUS.has(p.sku);
  }

  isNewArrival(p: Product): boolean {
    return this.NEW_ARRIVAL_SKUS.has(p.sku);
  }

  stockFor(sku: string): number {
    let h = 0;
    for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) % 9973;
    return 8 + (h % 43);
  }

  hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  ratingFor(sku: string) {
    const h = this.hash(sku);
    const average = +(4.2 + ((h % 8) / 10)).toFixed(1);
    const count = 48 + (h % 260);
    const five = Math.min(92, 60 + (h % 30));
    const four = Math.max(4, Math.round((100 - five) * 0.55));
    const three = Math.max(1, Math.round((100 - five - four) * 0.6));
    const two = Math.max(0, Math.round((100 - five - four - three) * 0.6));
    const one = Math.max(0, 100 - five - four - three - two);
    return { average, count, breakdown: { 5: five, 4: four, 3: three, 2: two, 1: one } };
  }
}

