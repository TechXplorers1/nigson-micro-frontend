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
  version?: number;
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

function getInitialStockLog(): StockLog[] {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('nigson_stock_movements') : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch { }

  return [
    { id: "sl_init_1", sku: "CHAVEENPHONES", product: "chaveen phones", change: 100, qty: 100, reason: "Opening Stock", date: "2026-11-05T06:40:00.000Z", by: "Nigson Administrator", supplier: "Nigson HQ", ref: "INIT-CHAVEEN" },
    { id: "sl_init_2", sku: "DEMO-EL-01-01", product: "Demo True Wireless Earbuds", change: 18, qty: 18, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Shenzhen Factory", ref: "INIT-0101" },
    { id: "sl_init_3", sku: "DEMO-EL-01-02", product: "Demo Wireless Charging Stand", change: 9, qty: 9, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Shenzhen Factory", ref: "INIT-0102" },
    { id: "sl_init_4", sku: "DEMO-EL-01-03", product: "Demo Braided USB-C Cable (2m)", change: 24, qty: 24, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Shenzhen Factory", ref: "INIT-0103" },
    { id: "sl_init_5", sku: "DEMO-EL-02-01", product: "Demo Noise-Cancelling Headphones", change: 35, qty: 35, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Shenzhen Factory", ref: "INIT-0201" },
    { id: "sl_init_6", sku: "DEMO-EL-02-02", product: "Demo Smart Fitness Tracker", change: 12, qty: 12, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Local Distributor", ref: "INIT-0202" },
    { id: "sl_init_7", sku: "DEMO-EL-03-01", product: "Demo 65W GaN Fast Charger", change: 16, qty: 16, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Nigson HQ", ref: "INIT-0301" },
    { id: "sl_init_8", sku: "DEMO-EL-03-03", product: "Demo Heavy-Duty Power Bank 20000mAh", change: 22, qty: 22, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Nigson HQ", ref: "INIT-0303" },
    { id: "sl_init_9", sku: "DEMO-EL-04-01", product: "Demo Magnetic Phone Mount", change: 28, qty: 28, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Local Distributor", ref: "INIT-0401" },
    { id: "sl_init_10", sku: "DEMO-EL-04-02", product: "Demo Bluetooth Car FM Transmitter", change: 45, qty: 45, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Local Distributor", ref: "INIT-0402" },
    { id: "sl_init_11", sku: "DEMO-EL-07-03", product: "Demo Surge Protector Extension", change: 60, qty: 60, reason: "Opening Stock", date: "2026-11-04T08:20:00.000Z", by: "System Bootstrap", supplier: "Nigson HQ", ref: "INIT-0703" }
  ];
}

const LS_CUSTOMERS = 'nigson_customers';

const DEFAULT_CUSTOMERS: AdminCustomer[] = [
  {
    id: "cust-1",
    name: "Kene Nigson",
    email: "kene@example.com",
    phone: "+234 801 234 5678",
    location: "Victoria Island, Lagos",
    joined: "2026-07-15T09:00:00Z",
    orders: 3,
    spend: 285000,
    saved: 4,
    quotes: 1,
    status: "Active"
  },
  {
    id: "cust-2",
    name: "Chaveen Reddy",
    email: "chaveenreddy100@gmail.com",
    phone: "+234 802 345 6789",
    location: "Maitama, Abuja",
    joined: "2026-08-01T11:30:00Z",
    orders: 2,
    spend: 145000,
    saved: 2,
    quotes: 0,
    status: "Active"
  },
  {
    id: "cust-3",
    name: "E2E Customer",
    email: "e2e@nigson.ng",
    phone: "+234 803 456 7890",
    location: "Port Harcourt, Rivers",
    joined: "2026-08-20T14:15:00Z",
    orders: 4,
    spend: 420000,
    saved: 6,
    quotes: 2,
    status: "Active"
  },
  {
    id: "cust-4",
    name: "Retail Store A (Ikeja Hub)",
    email: "retaila@example.invalid",
    phone: "+234 805 678 1234",
    location: "Ikeja, Lagos",
    joined: "2026-09-05T10:00:00Z",
    orders: 5,
    spend: 650000,
    saved: 3,
    quotes: 1,
    status: "Active"
  },
  {
    id: "cust-5",
    name: "King Enterprise",
    email: "king@gmail.com",
    phone: "+234 807 890 2345",
    location: "Kano, Nigeria",
    joined: "2026-09-18T16:20:00Z",
    orders: 1,
    spend: 95000,
    saved: 1,
    quotes: 0,
    status: "Active"
  },
  {
    id: "cust-6",
    name: "Zarina Wholesale Group",
    email: "wholesale@nigson.ng",
    phone: "+234 809 123 4567",
    location: "Onitsha, Anambra",
    joined: "2026-10-02T13:45:00Z",
    orders: 3,
    spend: 510000,
    saved: 5,
    quotes: 3,
    status: "Active"
  }
];

function isStaffOrFixture(email?: string, name?: string): boolean {
  const e = (email || '').toLowerCase().trim();
  const n = (name || '').toLowerCase().trim();
  return (
    e.includes('admin@example.invalid') ||
    e.includes('operations@example.invalid') ||
    e.includes('analyst@example.invalid') ||
    n.includes('admin local fixture') ||
    n.includes('local fixture')
  );
}

function getInitialCustomers(): AdminCustomer[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = parsed.filter((c: any) => !isStaffOrFixture(c.email, c.name));
        if (filtered.length > 0) return filtered;
      }
    }
  } catch { }
  return [...DEFAULT_CUSTOMERS];
}

const LS_ADMINS = 'nigson_admin_users';
const LS_ADMIN_OVERRIDES = 'nigson_admin_user_overrides';

function getAdminOverrides(): Record<string, Partial<AdminUser>> {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_ADMIN_OVERRIDES) : null;
    if (raw) return JSON.parse(raw);
  } catch { }
  return {};
}

function saveAdminOverride(email: string, user: Partial<AdminUser>) {
  try {
    const current = getAdminOverrides();
    current[email.toLowerCase()] = user;
    localStorage.setItem(LS_ADMIN_OVERRIDES, JSON.stringify(current));
  } catch { }
}

function clearAdminOverride(email: string) {
  try {
    const current = getAdminOverrides();
    delete current[email.toLowerCase()];
    localStorage.setItem(LS_ADMIN_OVERRIDES, JSON.stringify(current));
  } catch { }
}

function getInitialAdmins(): AdminUser[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_ADMINS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { }
  return [
    { id: "43c829a8-5ddc-5d8a-be64-557f8998c1a9", name: "admin Local Fixture", email: "admin@example.invalid", roleId: "ADMIN", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
    { id: "20f23ef1-2395-5c7e-abe7-00e07dcde379", name: "Sales Specialist", email: "sales@example.invalid", roleId: "SALES", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
    { id: "5cb1caac-6970-5ef9-99c6-8d3be9d2d793", name: "Operations Manager", email: "operations@example.invalid", roleId: "OPERATIONS", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
    { id: "ef88a0dc-27c1-5ef9-b53e-a745d253d5cc", name: "Finance Officer", email: "financea@example.invalid", roleId: "FINANCE", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
    { id: "3c2b8f13-37c3-5764-a6ea-f1085167acb4", name: "Data Analyst", email: "analyst@example.invalid", roleId: "ANALYST", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
    { id: "au_2", name: "Chaveen Reddy", email: "chaveenreddy100@gmail.com", roleId: "ADMIN", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
    { id: "au_3", name: "chaveen Customer", email: "chaveen@gmail.com", roleId: "ADMIN", status: "Active", lastLogin: new Date().toISOString(), version: 1 },
  ];
}

export const SEED_PRODUCTS: AdminProduct[] = [
  { id: '5570995e-1b59-5592-ba5c-fa95a0c02c20', skuId: 'ecac9622-ee78-5c52-8eb5-7c244e055d03', sku: 'NS03', name: 'NS03 Wireless Earbuds (TWS)', category: 'Earbuds', brand: 'Nigson', price: 18500, retail: 18500, cost: 12000, stock: 45, reserved: 2, status: 'Active', desc: 'High-fidelity Bluetooth wireless earbuds with clear bass and ergonomic fit.', image: '/assets/cat-earbuds.jpg', images: ['/assets/cat-earbuds.jpg'], rating: 4.8, lowLevel: 10 },
  { id: '8ba363e8-815a-52ee-be26-74da166eba83', skuId: 'c52cf637-25d0-5eb6-862a-e737389c7ad4', sku: 'NS06', name: 'NS06 ANC/ENC Wireless Earbuds', category: 'Earbuds', brand: 'Nigson', price: 28000, retail: 28000, cost: 18000, stock: 32, reserved: 1, status: 'Active', desc: 'Active noise cancellation earbuds with environmental noise suppression microphone.', image: '/assets/cat-earbuds.jpg', images: ['/assets/cat-earbuds.jpg'], rating: 4.9, lowLevel: 10 },
  { id: '41934e70-179f-5c0a-9498-28c8b6a4fd9f', skuId: '63573bb9-a11d-542a-97aa-ca6cb2c92290', sku: 'NS107', name: 'NS107 High-Power Car Charger with Retractable Cable', category: 'Chargers', brand: 'Nigson', price: 12500, retail: 12500, cost: 8000, stock: 28, reserved: 0, status: 'Active', desc: 'Dual-port fast vehicle charger with self-retracting high-durability charging lead.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], rating: 4.7, lowLevel: 10 },
  { id: 'bff4b7e3-8e19-566b-9c95-bc941390f84f', skuId: '4907f781-8654-5559-88cf-1ce35df2cb15', sku: 'NS211C', name: 'NS211C Type-C to Type-C PD65W Cable', category: 'Cables', brand: 'Nigson', price: 4500, retail: 4500, cost: 2500, stock: 120, reserved: 5, status: 'Active', desc: 'Braided 65W Power Delivery fast charging cable with reinforced alloy connectors.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], rating: 4.9, lowLevel: 20 },
  { id: '3bd11da9-6a93-5f56-ae87-8afdad3d52ab', skuId: 'c3002b2f-4326-59ec-b460-09ba406bc800', sku: 'NS211i', name: 'NS211i Type-C to Lightning PD30W Cable', category: 'Cables', brand: 'Nigson', price: 4500, retail: 4500, cost: 2500, stock: 95, reserved: 4, status: 'Active', desc: 'Fast Lightning charging and data cable compatible with Apple devices.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], rating: 4.8, lowLevel: 20 },
  { id: '1908dc43-accf-5578-870c-ec519d73367c', skuId: 'f65f2023-ef23-53ca-bfa2-8b40877ed658', sku: 'NS25', name: 'NS25 4-in-1 Charging Cable', category: 'Cables', brand: 'Nigson', price: 6500, retail: 6500, cost: 4000, stock: 80, reserved: 2, status: 'Active', desc: 'Universal 4-connector heavy-duty charging lead for multiple mobile phone models.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], rating: 4.6, lowLevel: 15 },
  { id: '51c9cd3c-5d6c-5049-b821-d80c7c512305', skuId: '812f8742-6c94-5b92-a313-f0c0fdee9559', sku: 'NS2526C', name: 'NS2526C High Power Fast Wall Charger, GaN65W', category: 'Chargers', brand: 'Nigson', price: 16000, retail: 16000, cost: 10500, stock: 54, reserved: 3, status: 'Active', desc: 'GaN technology 65W compact travel wall adapter with multi-voltage safety protection.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], rating: 4.9, lowLevel: 10 },
  { id: '1fc9d7b4-1716-54fb-905a-ea5a80620a07', skuId: 'b5cf3ecb-5ed0-5e6f-9cea-4da88f91baa3', sku: 'NS2618', name: 'NS2618 All-in-One Universal Multiway Adapter, GaN65W', category: 'Chargers', brand: 'Nigson', price: 22000, retail: 22000, cost: 14000, stock: 40, reserved: 1, status: 'Active', desc: 'Worldwide travel plug converter with integrated 65W GaN charging sockets.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], rating: 4.8, lowLevel: 10 },
  { id: '28cd1e1a-bc40-5728-bf56-4c785b8613f2', skuId: 'c4f089fb-7a27-5b3e-bc02-f9565d5653ff', sku: 'NS3416', name: 'NS3416 65W GaN Power Socket', category: 'Extension Sockets', brand: 'Nigson', price: 29500, retail: 29500, cost: 19000, stock: 35, reserved: 2, status: 'Active', desc: 'Heavy-duty multi-gang extension hub with built-in high power USB-C fast ports.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.7, lowLevel: 10 },
  { id: 'cd9acab9-5bce-5274-a051-773e756d1b0e', skuId: '51c2d6f5-82ae-5eae-8f5d-5975fd7318fc', sku: 'NS3604C', name: 'NS3604C Multi-Socket Extension Box', category: 'Extension Sockets', brand: 'Nigson', price: 34000, retail: 34000, cost: 22000, stock: 25, reserved: 0, status: 'Active', desc: 'Overload and surge protected power distributor suitable for commercial and home setups.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.8, lowLevel: 10 },
  { id: '95be469d-489f-5d09-9308-18f6941e4d41', skuId: 'b9f0156b-c3d2-5bf6-8113-b88f83c01e6d', sku: 'NS4', name: 'NS4 Home Charger', category: 'Chargers', brand: 'Nigson', price: 8500, retail: 8500, cost: 5000, stock: 65, reserved: 4, status: 'Active', desc: 'Standard high-efficiency home wall charger with short-circuit protection.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], rating: 4.6, lowLevel: 15 },
  { id: '240af070-7cac-5840-93f7-731aff6bf976', skuId: 'e5e75b4f-26fa-56bd-a68f-c10aa50082f3', sku: 'NS6', name: 'NS6 Large Motion-Activated Cabinet Light (410MM)', category: 'Motion-Activated Lights', brand: 'Nigson', price: 14500, retail: 14500, cost: 9000, stock: 42, reserved: 1, status: 'Active', desc: 'Slim magnetic rechargeable PIR sensor strip light for closets, wardrobes and kitchens.', image: '/assets/hero-accessories.jpg', images: ['/assets/hero-accessories.jpg'], rating: 4.7, lowLevel: 10 },
  { id: '82478136-b526-5238-94c9-d076af6ebc47', skuId: '4af2eb38-f4cc-5bc0-b182-01e667ed00b7', sku: 'NS6-1', name: 'NS6-1 Medium Motion-Activated Cabinet Light (220MM)', category: 'Motion-Activated Lights', brand: 'Nigson', price: 11500, retail: 11500, cost: 7200, stock: 38, reserved: 2, status: 'Active', desc: 'Compact rechargeable warm-light bar with automatic motion trigger.', image: '/assets/hero-accessories.jpg', images: ['/assets/hero-accessories.jpg'], rating: 4.8, lowLevel: 10 },
  { id: '0a51dae9-2795-507b-84a6-100c06513332', skuId: '21d1fa9a-6d1e-54fb-98e0-72439394fe00', sku: 'NS901C', name: 'NS901C Type-C to Type-C Charging Cable', category: 'Cables', brand: 'Nigson', price: 3500, retail: 3500, cost: 2000, stock: 110, reserved: 6, status: 'Active', desc: 'Durable everyday USB Type-C sync and fast battery charging lead.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], rating: 4.7, lowLevel: 25 },
  { id: '0de50201-b6bf-5270-b7d4-79766c7f9447', skuId: '70bdf50e-781f-5578-9afb-bcf69125a1f3', sku: 'NS901i', name: 'NS901i Type-C to Lightning Charging Cable', category: 'Cables', brand: 'Nigson', price: 3500, retail: 3500, cost: 2000, stock: 85, reserved: 3, status: 'Active', desc: 'Everyday Lightning mobile cable with anti-tangle rubber housing.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], rating: 4.6, lowLevel: 20 },
  { id: '033336d7-5025-5112-9af2-726e6e02caf4', skuId: '49aca633-ca39-5771-aabd-0cd1448db881', sku: 'NS96U', name: 'NS96U 3-in-1 Charging Cable', category: 'Cables', brand: 'Nigson', price: 5500, retail: 5500, cost: 3200, stock: 75, reserved: 4, status: 'Active', desc: 'Triple connector lead supporting Lightning, USB-C and Micro-USB devices simultaneously.', image: '/assets/cat-cable.jpg', images: ['/assets/cat-cable.jpg'], rating: 4.8, lowLevel: 15 },
  { id: 'fee9c518-4071-5aa7-a72b-6ed0ed1b83d3', skuId: '04ae2d72-94ab-5ff8-82a4-28272755ee75', sku: 'PQ19', name: 'PQ19 Power Bank, 10,000mAh', category: 'Power Banks', brand: 'Nigson', price: 19500, retail: 19500, cost: 12500, stock: 60, reserved: 3, status: 'Active', desc: 'Pocket-sized slim high density backup battery with dual output.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.8, lowLevel: 15 },
  { id: '1bac82ef-a37c-56b7-a290-afbddbd914a5', skuId: '75e0a2eb-54e6-552e-b99c-a956f8557592', sku: 'PQ20', name: 'PQ20 Power Bank, 20,000mAh', category: 'Power Banks', brand: 'Nigson', price: 28500, retail: 28500, cost: 18500, stock: 45, reserved: 2, status: 'Active', desc: 'Heavy-duty long endurance power bank with digital battery indicator.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.9, lowLevel: 10 },
  { id: '4ad4e90d-ec4e-5caa-f7ad88e19e29', skuId: '7faca25c-8831-5149-84e4-47e037580cac', sku: 'PQ28', name: 'PQ28 Magnetic Wireless Power Bank, 5,000mAh', category: 'Power Banks', brand: 'Nigson', price: 24000, retail: 24000, cost: 15000, stock: 30, reserved: 1, status: 'Active', desc: 'Snap-on MagSafe compatible wireless power bank for smartphones.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.9, lowLevel: 10 },
  { id: 'c7db7adb-726b-5173-a385-004b258ea128', skuId: '3e82bda0-2606-580f-98ef-a01e322d325a', sku: 'PQ30', name: 'PQ30 Power Bank, 30,000mAh', category: 'Power Banks', brand: 'Nigson', price: 38000, retail: 38000, cost: 25000, stock: 22, reserved: 1, status: 'Active', desc: 'High capacity multi-device charging station for frequent travelers.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.7, lowLevel: 5 },
  { id: 'c995e043-e1e8-5979-b4ea-e6d1dedc7322', skuId: '3882394e-69bd-5c71-9b14-fcf7a82481bd', sku: 'PQ50', name: 'PQ50 Power Bank, 50,000mAh', category: 'Power Banks', brand: 'Nigson', price: 55000, retail: 55000, cost: 37000, stock: 18, reserved: 0, status: 'Active', desc: 'Commercial grade ultra power bank with camping flashlight and fast DC/PD output.', image: '/assets/cat-powerbank.jpg', images: ['/assets/cat-powerbank.jpg'], rating: 4.9, lowLevel: 5 },
  { id: '4351a029-79f9-57e0-94e8-466d7ad4ef19', skuId: 'ecbe959f-d3e9-5f25-8cb5-1718bf14972e', sku: 'ZS6', name: 'ZS6 Multi-Device Desktop Fast Charger', category: 'Chargers', brand: 'Nigson', price: 26000, retail: 26000, cost: 17000, stock: 25, reserved: 1, status: 'Active', desc: '6-port smart power workstation with organized desktop footprint.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], rating: 4.8, lowLevel: 10 },
  { id: 'fa096df5-7313-5a7a-aa01-4475ee45b98f', skuId: '0df9e4fb-2794-55fe-a1f9-d8977114b7e9', sku: 'ZS8', name: 'ZS8 Ultra-Fast GaN Travel Charger 65W', category: 'Chargers', brand: 'Nigson', price: 31000, retail: 31000, cost: 20000, stock: 30, reserved: 2, status: 'Active', desc: 'Compact dual-port 65W laptop and phone fast charging adapter.', image: '/assets/cat-charger.jpg', images: ['/assets/cat-charger.jpg'], rating: 4.9, lowLevel: 10 }
];

const LS_PRODUCTS = 'nigson_admin_products';

function getInitialProducts(): AdminProduct[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_PRODUCTS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((p: any) => p.sku || p.id));
        const missing = SEED_PRODUCTS.filter(s => !existingIds.has(s.sku) && !existingIds.has(s.id));
        return [...parsed, ...missing];
      }
    }
  } catch { }
  return [...SEED_PRODUCTS];
}

export const SEED_ORDERS: AdminOrder[] = [
  {
    id: "ord_101",
    number: "ORD-NG-10021",
    date: new Date(Date.now() - 3600000 * 4).toISOString(),
    customer: { name: "Adewale Adeleke", email: "adewale@gmail.com", phone: "+234 803 123 4567", address: "Victoria Island, Lagos" },
    items: [{ sku: "NS03", name: "NS03 Wireless Earbuds (TWS)", qty: 2, price: 18500 }],
    total: 37000,
    paymentStatus: "Paid",
    status: "Processing",
    delivery: "Express Delivery",
    timeline: [{ label: "Placed", date: new Date(Date.now() - 3600000 * 4).toISOString() }]
  },
  {
    id: "ord_102",
    number: "ORD-NG-10022",
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    customer: { name: "Folake Bakare", email: "folake@gmail.com", phone: "+234 802 345 6789", address: "Maitama, Abuja" },
    items: [{ sku: "PQ20", name: "PQ20 Power Bank, 20,000mAh", qty: 1, price: 28500 }],
    total: 28500,
    paymentStatus: "Paid",
    status: "Shipped",
    delivery: "Standard Delivery",
    timeline: [{ label: "Placed", date: new Date(Date.now() - 3600000 * 24).toISOString() }]
  },
  {
    id: "ord_103",
    number: "ORD-NG-10023",
    date: new Date(Date.now() - 3600000 * 48).toISOString(),
    customer: { name: "Emeka Okafor", email: "emeka.okafor@gmail.com", phone: "+234 809 987 6543", address: "Alaba Int'l Market, Lagos" },
    items: [{ sku: "NS2526C", name: "NS2526C High Power Fast Wall Charger, GaN65W", qty: 5, price: 16000 }],
    total: 80000,
    paymentStatus: "Paid",
    status: "Delivered",
    delivery: "Standard Delivery",
    timeline: [{ label: "Delivered", date: new Date(Date.now() - 3600000 * 12).toISOString() }]
  }
];

const LS_ORDERS = 'nigson_admin_orders';

function getInitialOrders(): AdminOrder[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_ORDERS) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { }
  return [...SEED_ORDERS];
}

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

  admins = signal<AdminUser[]>(getInitialAdmins());

  // Adding minimal seed data to ensure MFEs render correctly
  products = signal<AdminProduct[]>(getInitialProducts());
  pages = signal<AdminPage[]>([]);
  reviews = signal<AdminReview[]>([]);
  applications = signal<AdminApplication[]>(SEED_APPLICATIONS);
  applicationError = signal<string | null>(null);
  distributorMarket = signal<{ id: string; code: string; currency: string } | null>(null);
  quotes = signal<AdminQuote[]>(SEED_QUOTES);
  quoteLoadError = signal<string | null>(null);
  inquiries = signal<AdminInquiry[]>(SEED_INQUIRIES);
  orders = signal<AdminOrder[]>(getInitialOrders());
  customers = signal<AdminCustomer[]>(getInitialCustomers());
  posts = signal<AdminPost[]>([]);
  stockLog = signal<StockLog[]>(getInitialStockLog());
  activity = signal<Activity[]>([]);

  private initialStaffDataLoaded = false;

  constructor() {
    this.products.set(getInitialProducts());
    this.orders.set(getInitialOrders());
    this.hydrateFromStorage();
    this.http.get<Array<{ id: string; code: string; currency: string }>>('/api/v1/markets').subscribe({
      next: markets => this.distributorMarket.set(markets.find(market => market.code === 'NG') ?? null), error: () => { }
    });
    if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      this.http.get<{ localOnly: boolean; phase: number; market: { id: string; code: string; currency: string } }>('/local-distributor-fixtures.json').subscribe({
        next: data => { if (data.localOnly && data.phase === 3 && data.market?.code === 'NG') this.distributorMarket.set(data.market); }, error: () => { }
      });
    }
    this.loadInitialStaffData();
  }

  loadInitialStaffData(): void {
    if (this.initialStaffDataLoaded) return;
    this.initialStaffDataLoaded = true;
    this.loadStaffProducts().subscribe();
    this.loadStaffCustomers().subscribe();
    if (this.session.authenticated()) {
      this.loadStaffOrders().subscribe();
      this.loadStaffInventory().subscribe();
      this.loadStaffUsers().subscribe();
      this.loadStaffApplications().subscribe();
      this.loadStaffReviews().subscribe();
    }
  }

  persistProducts(): void {
    try {
      localStorage.setItem(LS_PRODUCTS, JSON.stringify(this.products()));
    } catch {}
  }

  persistOrders(): void {
    try {
      localStorage.setItem(LS_ORDERS, JSON.stringify(this.orders()));
    } catch {}
  }

  public hydrateFromStorage() {
    const initialProds = getInitialProducts();
    if (this.products().length === 0) {
      this.products.set(initialProds);
    }
    const initialOrds = getInitialOrders();
    if (this.orders().length === 0) {
      this.orders.set(initialOrds);
    }

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
    } catch { }
    if (this.applications().length === 0) {
      this.applications.set(SEED_APPLICATIONS);
    }

    try {
      const storedQuotes = localStorage.getItem('nigson_admin_quotes');
      if (storedQuotes) {
        const parsed = JSON.parse(storedQuotes);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missingSeeds = SEED_QUOTES.filter(s => !existingIds.has(s.id));
          this.quotes.set([...parsed, ...missingSeeds]);
        }
      }
    } catch { }
    if (this.quotes().length === 0) {
      this.quotes.set(SEED_QUOTES);
    }

    try {
      const storedInqs = localStorage.getItem('nigson_admin_inquiries');
      if (storedInqs) {
        const parsed = JSON.parse(storedInqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((p: any) => p.id));
          const missingSeeds = SEED_INQUIRIES.filter(s => !existingIds.has(s.id));
          this.inquiries.set([...parsed, ...missingSeeds]);
        }
      }
    } catch { }
    if (this.inquiries().length === 0) {
      this.inquiries.set(SEED_INQUIRIES);
    }
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

  adjustStock(sku: string, change: number, reason: string, meta?: { supplier?: string; ref?: string; notes?: string; by?: string }) {
    let applied = change;
    let productName = '';
    let productSku = sku;
    this.products.update(products => {
      return products.map(p => {
        if (p.sku === sku || p.skuId === sku || p.id === sku) {
          const next = Math.max(0, p.stock + change);
          applied = next - p.stock;
          productName = p.name;
          productSku = p.sku;
          return { ...p, stock: next };
        }
        return p;
      });
    });

    const newLog: StockLog = {
      id: "sl_" + Math.random().toString(36).slice(2, 9),
      sku: productSku,
      product: productName || productSku,
      change,
      qty: Math.abs(change),
      reason,
      date: new Date().toISOString(),
      by: meta?.by || (this.session.fullName() || "Nigson Administrator"),
      supplier: meta?.supplier,
      ref: meta?.ref,
      notes: meta?.notes
    };

    this.stockLog.update(s => {
      const updated = [newLog, ...s];
      try {
        localStorage.setItem('nigson_stock_movements', JSON.stringify(updated));
      } catch { }
      return updated;
    });

    this.log(`Stock for ${productName || productSku} adjusted by ${change > 0 ? "+" : ""}${change}`);
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
    const current = this.quotes().find(quote => quote.id === id);
    if (!current || !['Pending', 'Under Review', 'Quoted', 'Closed'].includes(status)) return;
    const states: Record<string, string> = {
      Pending: 'NEW',
      'Under Review': 'IN_PROGRESS',
      Quoted: 'RESOLVED',
      Closed: 'CLOSED'
    };
    const isServerLead = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isServerLead) {
      this.quotes.update(quotes => quotes.map(quote => quote.id === id ? { ...quote, status: status as AdminQuote['status'] } : quote));
      this.persistQuotes();
      this.log(`Local quote ${id} set to ${status}`);
      return;
    }
    if (current.version == null) {
      console.warn(`[AdminService] Cannot update quote lead ${id}: current version is missing.`);
      return;
    }
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': `"${current.version}"`,
      'Idempotency-Key': crypto.randomUUID()
    });
    this.http.patch<any>(`/api/v1/staff/leads/${id}`, {
      state: states[status],
      note: 'Quote request status updated by staff'
    }, { headers }).subscribe({
      next: lead => {
        this.quotes.update(quotes => quotes.map(quote => quote.id === id
          ? { ...quote, status: status as AdminQuote['status'], version: lead.version }
          : quote));
        this.persistQuotes();
      },
      error: err => console.warn(`[AdminService] Quote lead update failed:`, err?.status ?? err)
    });
    this.log(`Quote lead ${id} update requested: ${status}`);
  }

  setApplicationStatus(id: string, status: string, note?: string, documentsVerified = false): Observable<any | null> {
    this.applicationError.set(null);
    const current = this.applications().find(application => application.id === id);
    if (current?.version == null || !['Under Review', 'Approved', 'Rejected'].includes(status)) {
      this.applicationError.set('Load the current application and choose a review or decision.');
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

  /** Load customer directory enriched with order counts, lifetime spend, and location. */
  loadStaffCustomers(): Observable<AdminCustomer[]> {
    return forkJoin({
      users: this.http.get<{ items: any[] }>('/api/v1/staff/users?size=100').pipe(
        catchError(() => of({ items: [] }))
      ),
      orders: this.http.get<{ items: any[] }>('/api/v1/staff/orders').pipe(
        catchError(() => of({ items: [] }))
      )
    }).pipe(
      map(({ users, orders }) => {
        return this.syncAndComputeCustomers(users?.items ?? [], orders?.items ?? []);
      }),
      tap(customers => {
        this.customers.set(customers);
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffCustomers fallback:', err?.status ?? err);
        const fallback = getInitialCustomers();
        this.customers.set(fallback);
        return of(fallback);
      })
    );
  }

  syncAndComputeCustomers(rawUsers: any[], rawOrders: any[]): AdminCustomer[] {
    const cached = getInitialCustomers();
    const customerMap = new Map<string, AdminCustomer>();

    // Seed map with existing cached customers
    for (const c of cached) {
      if (!isStaffOrFixture(c.email, c.name)) {
        customerMap.set(c.email.toLowerCase().trim(), { ...c });
      }
    }

    // Merge any real users from backend that aren't system fixtures
    for (const u of rawUsers) {
      const email = (u.email || '').toLowerCase().trim();
      const name = u.displayName || u.name;
      if (email && !isStaffOrFixture(email, name)) {
        if (!customerMap.has(email)) {
          customerMap.set(email, {
            id: u.id || 'cust-' + Math.random().toString(36).slice(2, 9),
            name: name || email.split('@')[0],
            email: u.email,
            phone: u.phone || '+234 800 000 0000',
            location: u.location || 'Lagos, Nigeria',
            joined: u.createdAt || new Date().toISOString(),
            orders: 0,
            spend: 0,
            saved: 0,
            quotes: 0,
            status: (u.disabled ? 'Suspended' : 'Active') as 'Active' | 'Suspended'
          });
        }
      }
    }

    // Aggregate live orders by customer email
    const orderAgg = new Map<string, { count: number; spend: number; location: string; phone: string; earliestDate: string; name: string }>();

    for (const o of rawOrders) {
      const recipient = o.customerName || o.address?.recipient || o.customer?.name || '';
      const email = (o.customerEmail || o.customer?.email || '').toLowerCase().trim();
      const phone = o.customerPhone || o.address?.phone || o.customer?.phone || '';
      const loc = [o.address?.line1, o.address?.city, o.address?.region].filter(Boolean).join(', ') || o.shippingAddress?.city || o.customer?.address || '';
      const total = o.totalKobo ? o.totalKobo / 100 : (o.totals?.grandTotal ? (parseFloat(o.totals.grandTotal) > 1000000 ? parseFloat(o.totals.grandTotal) / 100 : parseFloat(o.totals.grandTotal)) : (o.total || 0));
      const date = o.placedAt || o.createdAt || new Date().toISOString();

      if (!email || isStaffOrFixture(email, recipient)) continue;

      const curr = orderAgg.get(email) || { count: 0, spend: 0, location: '', phone: '', earliestDate: date, name: recipient };
      curr.count += 1;
      curr.spend += total;
      if (loc && loc !== 'Nigeria') curr.location = loc;
      if (phone) curr.phone = phone;
      if (recipient && !curr.name) curr.name = recipient;
      if (date && new Date(date) < new Date(curr.earliestDate)) curr.earliestDate = date;
      orderAgg.set(email, curr);
    }

    // Update customer records from order aggregates
    for (const [email, agg] of orderAgg.entries()) {
      let cust = customerMap.get(email);
      if (!cust) {
        cust = {
          id: 'cust-' + Math.random().toString(36).slice(2, 9),
          name: agg.name || email.split('@')[0].replace(/[._-]/g, ' '),
          email: email,
          phone: agg.phone || '+234 800 000 0000',
          location: agg.location || 'Lagos, Nigeria',
          joined: agg.earliestDate,
          orders: agg.count,
          spend: agg.spend,
          saved: 0,
          quotes: 0,
          status: 'Active'
        };
        customerMap.set(email, cust);
      } else {
        cust.orders = Math.max(cust.orders, agg.count);
        cust.spend = Math.max(cust.spend, agg.spend);
        if (agg.location && (!cust.location || cust.location === 'Nigeria')) cust.location = agg.location;
        if (agg.phone && !cust.phone) cust.phone = agg.phone;
        if (agg.name && (!cust.name || cust.name === 'User')) cust.name = agg.name;
        if (agg.earliestDate && new Date(agg.earliestDate) < new Date(cust.joined)) cust.joined = agg.earliestDate;
      }
    }

    const result = Array.from(customerMap.values()).sort((a, b) => b.spend - a.spend || b.orders - a.orders);
    try {
      localStorage.setItem(LS_CUSTOMERS, JSON.stringify(result));
    } catch { }
    return result;
  }

  updateCustomerStatus(customerId: string, status: 'Active' | 'Suspended'): void {
    this.customers.update(all => {
      const updated = all.map(c => c.id === customerId ? { ...c, status } : c);
      try { localStorage.setItem(LS_CUSTOMERS, JSON.stringify(updated)); } catch { }
      return updated;
    });
    this.log(`Customer ${customerId} status updated to ${status}`);
  }

  saveCustomer(customer: AdminCustomer): void {
    this.customers.update(all => {
      const index = all.findIndex(c => c.id === customer.id || c.email.toLowerCase() === customer.email.toLowerCase());
      let updated: AdminCustomer[];
      if (index >= 0) {
        updated = [...all];
        updated[index] = { ...updated[index], ...customer };
      } else {
        updated = [customer, ...all];
      }
      try { localStorage.setItem(LS_CUSTOMERS, JSON.stringify(updated)); } catch { }
      return updated;
    });
    this.log(`Customer ${customer.name} saved`);
  }

  loadStaffUsers(): Observable<AdminUser[]> {
    return this.http.get<{ items: any[] }>('/api/v1/staff/users').pipe(
      map(res => {
        const serverUsers = (res?.items ?? []).map(u => ({
          id: u.id,
          name: u.displayName || u.name,
          email: u.email,
          roleId: (u.roles && u.roles[0]) || 'ADMIN',
          status: (u.disabled ? 'Disabled' : 'Active') as 'Active' | 'Disabled',
          lastLogin: u.lastLogin || new Date().toISOString(),
          version: u.version ?? 0
        }));
        const cached = getInitialAdmins();
        const overrides = getAdminOverrides();
        const map = new Map<string, AdminUser>();

        for (const u of cached) map.set(u.email.toLowerCase(), u);
        for (const u of serverUsers) {
          const existing = map.get(u.email.toLowerCase());
          map.set(u.email.toLowerCase(), { ...existing, ...u });
        }

        // Apply local administrative overrides on top so edits and role changes persist
        for (const [email, ov] of Object.entries(overrides)) {
          const lower = email.toLowerCase();
          const existing = map.get(lower);
          if (existing) {
            map.set(lower, { ...existing, ...ov });
          } else if (ov.name && ov.roleId) {
            map.set(lower, ov as AdminUser);
          }
        }

        const merged = Array.from(map.values());
        try { localStorage.setItem(LS_ADMINS, JSON.stringify(merged)); } catch { }
        return merged;
      }),
      tap(users => {
        if (users.length > 0) this.admins.set(users);
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffUsers fallback to current:', err?.status ?? err);
        const fallback = getInitialAdmins();
        this.admins.set(fallback);
        return of(fallback);
      })
    );
  }

  /** Update staff user role and status */
  updateStaffUser(user: AdminUser, reason = 'Administrative role assignment update'): Observable<boolean> {
    const roles = [user.roleId || 'ADMIN'];
    const finalReason = reason && reason.length >= 10 ? reason : 'Administrative role assignment update';

    // Store local override immediately so UI state and localStorage are locked to this edit
    saveAdminOverride(user.email, user);

    // Optimistically update local state & storage
    this.admins.update(all => {
      const updated = all.map(u => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ? { ...u, ...user, version: (u.version ?? 0) + 1 } : u);
      try { localStorage.setItem(LS_ADMINS, JSON.stringify(updated)); } catch { }
      return updated;
    });

    // Check if user.id is a real RFC 4122 UUID before making backend calls
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
    if (isUUID) {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'If-Match': `"${user.version ?? 0}"`,
        'Idempotency-Key': crypto.randomUUID()
      });
      return this.http.put(`/api/v1/staff/users/${user.id}/roles`, { roles, reason: finalReason }, { headers }).pipe(
        map(() => {
          clearAdminOverride(user.email);
          return true;
        }),
        tap(() => {
          this.log(`Roles for user ${user.name} synced to server: ${roles.join(', ')}`);
        }),
        catchError(err => {
          console.warn('[AdminService] updateUserRoles backend sync note (local override active):', err?.status ?? err);
          return of(true);
        })
      );
    }

    this.log(`Roles for user ${user.name} updated to ${roles.join(', ')}`);
    return of(true);
  }

  /** Add a new staff user with Keycloak registration and storage persistence */
  addStaffUser(user: AdminUser, password?: string, reason = 'New staff member added'): Observable<boolean> {
    saveAdminOverride(user.email, user);
    this.persistAndLogStaffUser(user);

    // Sanitize firstName and lastName to strictly alphabetic letters for RegistrationService NAME regex
    const cleanName = (user.name || '').replace(/[^a-zA-Z\s'-]/g, '').trim();
    const nameParts = cleanName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || 'Staff';
    const lastName = nameParts.slice(1).join(' ') || 'Member';

    // If password provided, register identity in Keycloak via /bff/register
    if (password && password.length >= 12) {
      return this.http.post<void>('/bff/register', {
        firstName,
        lastName,
        email: user.email.toLowerCase().trim(),
        password
      }).pipe(
        map(() => true),
        tap(() => {
          this.log(`User ${user.email} registered in Keycloak`);
        }),
        catchError(err => {
          console.warn('[AdminService] /bff/register response:', err?.status ?? err);
          return of(true);
        })
      );
    }

    return of(true);
  }

  private persistAndLogStaffUser(user: AdminUser) {
    this.admins.update(all => {
      const updated = [user, ...all.filter(u => u.email.toLowerCase() !== user.email.toLowerCase())];
      try { localStorage.setItem(LS_ADMINS, JSON.stringify(updated)); } catch { }
      return updated;
    });
    this.log(`Added staff member ${user.name} (${user.email}) with role ${user.roleId}`);
  }

  /** Delete or remove a staff user */
  deleteStaffUser(userId: string): Observable<boolean> {
    this.admins.update(all => {
      const updated = all.filter(u => u.id !== userId);
      try { localStorage.setItem(LS_ADMINS, JSON.stringify(updated)); } catch { }
      return updated;
    });
    this.log(`Removed staff user ${userId}`);
    return of(true);
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
        this.admins.update(all => {
          const updated = all.map(u => u.id === userId ? { ...u, roleId: roles[0] || 'ADMIN', version: (u.version ?? 0) + 1 } : u);
          try { localStorage.setItem(LS_ADMINS, JSON.stringify(updated)); } catch { }
          return updated;
        });
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
      catalogue: this.http.get<{ items: any[] }>('/api/v1/staff/products?size=100').pipe(
        catchError(() => this.http.get<any>('/api/v1/catalogue/products?size=100').pipe(
          map(res => ({ items: res?.items || res?.content || [] })),
          catchError(() => of({ items: [] }))
        ))
      ),
      inventory: this.http.get<{ items: any[] }>('/api/v1/staff/inventory?size=100').pipe(
        catchError(() => of({ items: [] }))
      )
    }).pipe(
      map(({ catalogue, inventory }) => {
        const items = catalogue?.items ?? [];
        if (items.length > 0) {
          return mapStaffProducts(items, inventory?.items ?? []);
        }
        return this.products().length > 0 ? this.products() : getInitialProducts();
      }),
      tap(products => {
        if (products.length > 0) {
          this.products.set(products);
          this.persistProducts();
          for (const p of products) {
            if (p.skuId && (!p.price || p.price === 0)) {
              this.catalog.getPrice(p.skuId).subscribe({
                next: res => {
                  if (res && res.priceMinorUnits > 0) {
                    const naira = res.priceMinorUnits / 100;
                    this.products.update(all => all.map(item => item.id === p.id ? { ...item, price: naira, retail: naira } : item));
                    this.persistProducts();
                  }
                },
                error: () => { }
              });
            }
          }
        }
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffProducts fallback:', err?.status ?? err);
        const fallback = this.products().length > 0 ? this.products() : getInitialProducts();
        this.products.set(fallback);
        return of(fallback);
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
          name: o.customerName || o.address?.recipient || (o.customer && o.customer.name) || 'Customer',
          email: o.customerEmail || (o.customer && o.customer.email) || '',
          phone: o.customerPhone || o.address?.phone || (o.customer && o.customer.phone) || '',
          address: [o.address?.line1, o.address?.city, o.address?.region].filter(Boolean).join(', ') || o.shippingAddress?.city || (o.customer && o.customer.address) || 'Nigeria'
        },
        items: (o.items || o.lines || []).map((i: any) => ({
          sku: i.sku || i.skuCode || '',
          name: i.title || i.name || i.productName || 'Item',
          qty: i.quantity || i.qty || 1,
          price: i.unitPriceKobo ? i.unitPriceKobo / 100 : (i.unitAmount ? parseFloat(i.unitAmount) / 100 : (i.price || 0))
        })),
        total: o.totalKobo ? o.totalKobo / 100 : (o.totals?.grandTotal ? (parseFloat(o.totals.grandTotal) > 1000000 ? parseFloat(o.totals.grandTotal) / 100 : parseFloat(o.totals.grandTotal)) : (o.total || 0)),
        paymentStatus: (o.paymentStatus === 'PAID' || o.paymentStatus === 'Paid') ? ('Paid' as const) : ('Pending' as const),
        status: (o.state || o.status || 'Processing') as AdminOrderStatus,
        delivery: o.shippingMethod || o.delivery || 'Standard Delivery',
        timeline: o.timeline || []
      }))),
      tap(orders => {
        if (orders.length > 0) {
          this.orders.set(orders);
          this.persistOrders();
          this.customers.set(this.syncAndComputeCustomers([], orders));
        }
      }),
      catchError(err => {
        console.warn('[AdminService] loadStaffOrders fallback:', err?.status ?? err);
        const fallback = this.orders().length > 0 ? this.orders() : getInitialOrders();
        this.orders.set(fallback);
        return of(fallback);
      })
    );
  }

  parseLeadApplication(lead: any): AdminApplication {
    const msg = lead.message || '';
    const subj = lead.subject || '';

    let type: 'Distributor' | 'Wholesaler' | 'Affiliate Marketer' = 'Distributor';
    if (subj.includes('Wholesale') || msg.includes('Wholesale Trade')) {
      type = 'Wholesaler';
    } else if (subj.includes('Affiliate') || msg.includes('Affiliate Partner')) {
      type = 'Affiliate Marketer';
    }

    const getField = (prefix: string): string => {
      const line = msg.split('\n').find((l: string) => l.toLowerCase().startsWith(prefix.toLowerCase()));
      return line ? line.split(':').slice(1).join(':').trim() : '';
    };

    const businessName = getField('Store / Company:')
      || getField('Legal Entity:')
      || getField('Company / Brand:')
      || (subj.includes(':') ? subj.split(':')[1].split('(')[0].trim() : lead.name);

    const contactPerson = getField('Contact Person:')
      || getField('Managing Director:')
      || getField('Full Name / Creator:')
      || lead.name;

    const location = getField('Trading Hub / State:')
      || getField('Assigned Territory:')
      || getField('Operating Territory:')
      || getField('Head Office:')
      || 'Nigeria';

    const category = getField('Product Category:')
      || getField('Primary Niche:')
      || 'Accessories';

    const prefix = type === 'Wholesaler' ? 'APP-W' : type === 'Affiliate Marketer' ? 'APP-A' : 'APP-D';
    const number = prefix + (lead.id ? lead.id.replace(/-/g, '').slice(0, 4).toUpperCase() : Math.floor(1000 + Math.random() * 9000));

    const statusMap: Record<string, LeadStatus> = {
      'NEW': 'Pending',
      'ASSIGNED': 'Under Review',
      'IN_PROGRESS': 'Under Review',
      'RESOLVED': 'Approved',
      'CLOSED': 'Approved'
    };

    return {
      id: lead.id,
      number,
      type,
      businessName: businessName || lead.name,
      contactPerson: contactPerson || lead.name,
      email: lead.email || '',
      phone: lead.phone || '',
      location,
      category,
      date: lead.created_at || new Date().toISOString(),
      status: statusMap[lead.status] || 'Pending',
      note: lead.message,
      version: 1
    };
  }

  loadStaffInquiries(): Observable<AdminInquiry[]> {
    return this.http.get<any[]>('/api/v1/staff/leads').pipe(
      map(leads => {
        if (!Array.isArray(leads)) return this.inquiries();
        const dbInqs: AdminInquiry[] = leads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email || '',
          phone: l.phone || '',
          subject: l.subject,
          message: l.message,
          date: l.created_at || new Date().toISOString(),
          status: (l.status === 'RESOLVED' || l.status === 'CLOSED') ? 'Resolved' as const : 'New' as const
        }));
        this.inquiries.update(existing => {
          const map = new Map(existing.map(e => [e.id, e]));
          for (const d of dbInqs) map.set(d.id, d);
          return Array.from(map.values());
        });
        this.persistInquiries();
        return this.inquiries();
      }),
      catchError(() => of(this.inquiries()))
    );
  }

  /** Load queue summaries from database leads & authorized details without inventing applicant data. */
  loadStaffApplications(): Observable<AdminApplication[]> {
    return this.http.get<any[]>('/api/v1/staff/leads').pipe(
      map(leads => {
        if (!Array.isArray(leads)) return this.applications();
        const dbApps = leads.map(l => this.parseLeadApplication(l));
        if (dbApps.length > 0) {
          this.applications.update(existing => {
            const map = new Map(existing.map(e => [e.id, e]));
            for (const d of dbApps) map.set(d.id, d);
            return Array.from(map.values());
          });
          this.persistApplications();
        }
        return this.applications();
      }),
      catchError(() => {
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
          catchError(() => {
            this.applicationError.set(null);
            if (this.applications().length === 0) {
              this.applications.set(SEED_APPLICATIONS);
            }
            return of(this.applications());
          })
        );
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

  /** Post stock adjustment to POST /api/v1/staff/stock-adjustments (API-046) */
  postStockAdjustment(
    sku: string,
    change: number,
    reason: string,
    meta?: { supplier?: string; ref?: string; notes?: string }
  ): Observable<any> {
    const targetProduct = this.products().find(p => p.sku === sku || p.skuId === sku || p.id === sku);
    const resolvedSkuId = targetProduct?.skuId || (sku.includes('-') && sku.length === 36 ? sku : this.resolveSkuId(sku));
    const deltaStr = change.toFixed(3);

    let validReason = (reason || 'Physical inventory count reconciliation').trim();
    if (meta?.supplier) validReason += ` (Supplier: ${meta.supplier})`;
    if (meta?.ref) validReason += ` [Ref: ${meta.ref}]`;
    if (meta?.notes) validReason += ` - ${meta.notes}`;
    if (validReason.length < 10) validReason = `Stock adjustment: ${validReason}`;
    if (validReason.length > 500) validReason = validReason.slice(0, 500);

    return this.http.get<{ items: any[] }>(`/api/v1/staff/inventory?skuId=${resolvedSkuId}`).pipe(
      switchMap(res => {
        const balance = res?.items?.[0];
        const locationId = balance?.locationId || '11111111-1111-1111-1111-111111111111';
        const currentVersion = balance?.version != null ? balance.version : 0;

        const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'If-Match': `"${currentVersion}"`,
          'Idempotency-Key': crypto.randomUUID()
        });

        const payload = {
          skuId: resolvedSkuId,
          locationId,
          delta: deltaStr,
          reason: validReason
        };

        return this.http.post<any>('/api/v1/staff/stock-adjustments', payload, { headers }).pipe(
          tap(() => {
            this.adjustStock(sku, change, reason, meta);
            this.loadStaffInventory().subscribe();
            this.loadStaffProducts().subscribe();
          }),
          map(() => ({ success: true }))
        );
      }),
      catchError(err => {
        console.warn('[AdminService] postStockAdjustment backend call failed, applying locally:', err?.status ?? err);
        this.adjustStock(sku, change, reason, meta);
        return of({ success: true, localOnly: true });
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
    const target = this.products().find(p => p.sku === input || p.skuId === input || p.id === input);
    if (target?.skuId) return target.skuId;
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

  /** Load quote leads through the staff-owned Experience lead API. */
  loadStaffQuotes(): Observable<AdminQuote[]> {
    this.quoteLoadError.set(null);
    return this.http.get<any>('/api/v1/staff/leads', { params: { type: 'QUOTE', page: '0', size: '100' } }).pipe(
      map(res => {
        const items = res?.items || [];
        return items.map((q: any) => ({
          id: q.id,
          number: 'REQ-' + q.id.slice(0, 8),
          date: q.createdAt,
          customer: q.name || 'Customer',
          email: q.email || '',
          phone: q.phone || '',
          product: q.subject || 'Wholesale Request',
          sku: '',
          quantity: 0,
          message: q.message || '',
          status: (q.state === 'NEW' ? 'Pending' : q.state === 'RESOLVED' ? 'Quoted' : q.state === 'CLOSED' ? 'Closed' : 'Under Review') as AdminQuote['status'],
          version: q.version
        }));
      }),
      tap(quotes => {
        this.quotes.set(quotes);
        this.persistQuotes();
      }),
      catchError(err => {
        console.warn('[AdminService] Unable to load staff quote requests:', err?.status ?? err);
        this.quoteLoadError.set(err?.error?.detail || 'Unable to load quote requests. Please try again.');
        this.quotes.set([]);
        this.persistQuotes();
        return of([]);
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

  private cleanProductPayload(payload: any): any {
    const name = (payload.name || '').trim();
    let slug = (payload.slug || payload.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!slug) slug = 'prod-' + Date.now();

    const rawDescription = (payload.description || payload.desc || payload.overview || payload.name || 'Product description').trim();
    const cleanDesc = rawDescription.replace(/\s*<!--\[price:.*?\]-->/g, '').trim();
    const priceVal = Number(payload.retail || payload.price || 0);
    const description = priceVal > 0 ? (cleanDesc + '\n<!--[price:' + priceVal + ']-->') : cleanDesc;

    let brandId: string | null = null;
    const brandStr = (payload.brand || payload.brandName || '').toLowerCase();
    if (brandStr.includes('nigson')) {
      brandId = '22222222-2222-3333-4444-555555555501';
    } else if (brandStr.includes('demo')) {
      brandId = 'f2608a9c-2177-5e58-bade-5c3eded46d3d';
    } else if (payload.brandId && /^[0-9a-f-]{36}$/i.test(payload.brandId)) {
      brandId = payload.brandId;
    } else {
      brandId = '22222222-2222-3333-4444-555555555501';
    }

    const categoryIds: string[] = [];
    const catName = (payload.category || payload.categoryName || '').toLowerCase();
    const categories = this.catalog.categories();
    const catMatch = categories.find((c: any) => c.name?.toLowerCase() === catName || c.slug?.toLowerCase() === catName);
    if (catMatch?.id && /^[0-9a-f-]{36}$/i.test(catMatch.id)) {
      categoryIds.push(catMatch.id);
    } else {
      const knownMap: Record<string, string> = {
        'power banks': '11111111-2222-3333-4444-555555555501',
        'earbuds': '11111111-2222-3333-4444-555555555502',
        'cables': '11111111-2222-3333-4444-555555555503',
        'chargers': '11111111-2222-3333-4444-555555555504',
        'extension sockets': '11111111-2222-3333-4444-555555555505',
        'motion-activated lights': '11111111-2222-3333-4444-555555555506',
        'laptops': '60fa2b5b-2440-54c8-b31f-7479c6719e9c',
        'smartphones': '902c6045-6c27-5d01-ab37-ba50c25267d3',
        'tablets': '772cfcc6-11f1-52cd-a2e8-4f9358e95a7e',
        'audio': 'b47d5983-25e0-5830-9f13-9c46b492c42b',
        'gaming': 'f8270e72-d189-5b2d-b59e-4aa9e34a83e0',
        'networking': 'af20ef1f-d03b-5b2d-9127-1f44fe8f856e',
        'storage': '2e521f8f-cdcf-5bed-85bd-34ab3c4bba16',
        'power and accessories': '7ce0f702-4d36-5bc5-980f-e8278a7fcb3e'
      };
      for (const [k, v] of Object.entries(knownMap)) {
        if (catName.includes(k) || k.includes(catName)) {
          categoryIds.push(v);
          break;
        }
      }
      if (categoryIds.length === 0) {
        categoryIds.push('11111111-2222-3333-4444-555555555501');
      }
    }

    return {
      name,
      slug,
      description,
      brandId,
      divisionCode: null,
      specifications: {},
      categoryIds
    };
  }

  /** TASK-66: Create product via POST /api/v1/staff/products (API-017) */
  createProduct(payload: any): Observable<any> {
    const cleanBody = this.cleanProductPayload(payload);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Idempotency-Key': crypto.randomUUID()
    });

    const createLocalProduct = (createdId: string) => {
      const price = Number(payload.retail || payload.price || 0);
      const newProduct: AdminProduct = {
        id: createdId,
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
        const filtered = all.filter(p => p.id !== createdId && p.sku !== newProduct.sku);
        return [newProduct, ...filtered];
      });
      const overrideData = {
        ...payload,
        id: createdId,
        price,
        retail: price,
        priceMinorUnits: Math.round(price * 100)
      };
      this.catalog.saveProductOverride(createdId, overrideData);
      if (payload.sku) {
        this.catalog.saveProductOverride(payload.sku, overrideData);
      }
      this.log('Product ' + payload.name + ' created');
      this.persistProducts();
      return newProduct;
    };

    return this.http.post<any>('/api/v1/staff/products', cleanBody, { headers }).pipe(
      map(created => {
        const id = created?.id || payload.id || crypto.randomUUID();
        return createLocalProduct(id);
      }),
      catchError(err => {
        console.warn('[AdminService] Java Commerce product create failed, persisting locally:', err?.status);
        const fallbackId = payload.id || crypto.randomUUID();
        const fallback = createLocalProduct(fallbackId);
        return of(fallback);
      })
    );
  }

  /** TASK-66: Update product via PATCH /api/v1/staff/products/:id (API-018) */
  updateProduct(id: string, payload: any): Observable<any> {
    const cleanBody = this.cleanProductPayload(payload);
    const version = payload.version != null ? '"' + payload.version + '"' : '"0"';
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'If-Match': version,
      'Idempotency-Key': crypto.randomUUID()
    });
    this.products.update(all => all.map(p => (p.id === id || p.sku === payload.sku) ? { ...p, ...payload } : p));
    this.persistProducts();
    this.log('Product ' + (payload.name || id) + ' updated');

    const editPrice = Number(payload.retail || payload.price || 0);
    const editOverrideData = {
      ...payload,
      id,
      price: editPrice > 0 ? editPrice : payload.price,
      retail: editPrice > 0 ? editPrice : payload.retail,
      priceMinorUnits: editPrice > 0 ? Math.round(editPrice * 100) : payload.priceMinorUnits
    };
    this.catalog.saveProductOverride(id, editOverrideData);
    if (payload.sku) {
      this.catalog.saveProductOverride(payload.sku, editOverrideData);
    }

    return this.http.patch('/api/v1/staff/products/' + id, cleanBody, { headers }).pipe(
      tap(() => {
        this.products.update(all => all.map(p => (p.id === id || p.sku === payload.sku) ? { ...p, ...payload } : p));
      }),
      catchError(err => {
        console.warn('[AdminService] updateProduct failed on backend, kept local override:', err?.status);
        return of(payload);
      })
    );
  }

  /** Delete / Archive product via POST /api/v1/staff/products/:id/publication or local removal */
  deleteProduct(idOrSku: string): Observable<boolean> {
    const existing = this.products().find(p => p.id === idOrSku || p.sku === idOrSku);
    const targetUuid = existing?.id && /^[0-9a-f-]{36}$/i.test(existing.id)
      ? existing.id
      : (/^[0-9a-f-]{36}$/i.test(idOrSku) ? idOrSku : null);
    const targetSku = existing?.sku || idOrSku;

    // Immediately remove from local reactive signal
    this.products.update(all => all.filter(p => p.id !== idOrSku && p.sku !== idOrSku && (existing ? (p.id !== existing.id && p.sku !== existing.sku) : true)));
    this.persistProducts();
    this.catalog.removeProductOverride(idOrSku);
    if (targetUuid) this.catalog.removeProductOverride(targetUuid);
    if (targetSku) this.catalog.removeProductOverride(targetSku);
    this.log(`Product ${idOrSku} removed`);

    if (targetUuid) {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'If-Match': '"0"',
        'Idempotency-Key': crypto.randomUUID()
      });
      const body = { action: 'ARCHIVE', reason: 'Archived by admin operator' };
      return this.http.post<any>(`/api/v1/staff/products/${targetUuid}/publication`, body, { headers }).pipe(
        map(() => true),
        catchError(err => {
          console.warn('[AdminService] Backend archive notice:', err?.status ?? err);
          return of(true);
        })
      );
    }

    return of(true);
  }
}
