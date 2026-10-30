/**
 * Nigson CMS Database Bridge Server
 * Provides direct, robust persistence to PostgreSQL for Content Management pages,
 * blog posts, products, and reviews.
 */
const http = require('http');
const cp = require('child_process');
const crypto = require('crypto');

const PORT = 8085;

// Mapping of page IDs to Content Type and Slug
const PAGE_MAPPING = {
  home: { type: 'HOME', slug: 'home', title: 'Home' },
  about: { type: 'ABOUT', slug: 'about', title: 'About Us' },
  insights: { type: 'BLOG', slug: 'insights', title: 'Insights & Blog' },
  contact: { type: 'CONTACT', slug: 'contact', title: 'Contact Us' },
  distributor: { type: 'DIVISION', slug: 'distributor', title: 'Distributor Network' },
  careers: { type: 'CAREERS', slug: 'careers', title: 'Careers' }
};

const DEFAULT_PRODUCTS = [
  {
    id: "11111111-2222-3333-4444-555555555501",
    sku: "NG-EB-01",
    skuId: "11111111-2222-3333-4444-555555555511",
    name: "Nigson TWS Earbuds Pro ANC",
    slug: "nigson-tws-earbuds-pro-anc",
    category: "Earbuds",
    categoryId: "10000000-0000-0000-0000-000000000001",
    categoryName: "Earbuds",
    brand: "Nigson",
    brandName: "Nigson",
    price: 28500,
    retail: 28500,
    retailPrice: 28500,
    wholesale: 22800,
    wholesalePrice: 22800,
    distributor: 19950,
    distributorPrice: 19950,
    desc: "Active Noise Cancelling wireless earbuds with 36-hour total battery life and IPX5 water resistance.",
    description: "Active Noise Cancelling wireless earbuds with 36-hour total battery life and IPX5 water resistance.",
    image: "/assets/cat-earbuds.jpg",
    imageUrl: "/assets/cat-earbuds.jpg",
    images: ["/assets/cat-earbuds.jpg"],
    stock: 120,
    reserved: 5,
    rating: 4.8,
    status: "Active",
    available: true,
    pricing: { priceKobo: 2850000 },
    specifications: {
      warranty: "12 Months",
      connectors: "Bluetooth 5.3, USB-C",
      powerRating: "300mAh Case, 40mAh Earbuds",
      buildMaterial: "Matte Polycarbonate",
      certification: "CE, RoHS, SONCAP"
    }
  },
  {
    id: "22222222-2222-3333-4444-555555555502",
    sku: "NG-PB-01",
    skuId: "22222222-2222-3333-4444-555555555512",
    name: "Nigson 20,000mAh 65W Fast Power Bank",
    slug: "nigson-20000mah-65w-fast-power-bank",
    category: "Power Banks",
    categoryId: "10000000-0000-0000-0000-000000000002",
    categoryName: "Power Banks",
    brand: "Nigson",
    brandName: "Nigson",
    price: 18500,
    retail: 18500,
    retailPrice: 18500,
    wholesale: 14800,
    wholesalePrice: 14800,
    distributor: 12950,
    distributorPrice: 12950,
    desc: "High-density Li-Polymer power bank with 65W USB-C Power Delivery, capable of charging laptops and phones.",
    description: "High-density Li-Polymer power bank with 65W USB-C Power Delivery, capable of charging laptops and phones.",
    image: "/assets/cat-powerbank.jpg",
    imageUrl: "/assets/cat-powerbank.jpg",
    images: ["/assets/cat-powerbank.jpg"],
    stock: 85,
    reserved: 8,
    rating: 4.9,
    status: "Active",
    available: true,
    pricing: { priceKobo: 1850000 },
    specifications: {
      warranty: "18 Months",
      connectors: "2x USB-C, 1x USB-A",
      powerRating: "20,000mAh 65W Max PD",
      buildMaterial: "Anodized Aluminum",
      certification: "SONCAP, CE, FCC"
    }
  },
  {
    id: "33333333-2222-3333-4444-555555555503",
    sku: "NG-CH-01",
    skuId: "33333333-2222-3333-4444-555555555513",
    name: "Nigson 65W GaN Triple-Port Fast Wall Charger",
    slug: "nigson-65w-gan-triple-port-fast-wall-charger",
    category: "Fast Chargers",
    categoryId: "10000000-0000-0000-0000-000000000003",
    categoryName: "Fast Chargers",
    brand: "Nigson",
    brandName: "Nigson",
    price: 14200,
    retail: 14200,
    retailPrice: 14200,
    wholesale: 11360,
    wholesalePrice: 11360,
    distributor: 9940,
    distributorPrice: 9940,
    desc: "Gallium Nitride (GaN) fast charger with dual USB-C and single USB-A ports, UK 3-pin standard.",
    description: "Gallium Nitride (GaN) fast charger with dual USB-C and single USB-A ports, UK 3-pin standard.",
    image: "/assets/cat-charger.jpg",
    imageUrl: "/assets/cat-charger.jpg",
    images: ["/assets/cat-charger.jpg"],
    stock: 210,
    reserved: 12,
    rating: 4.7,
    status: "Active",
    available: true,
    pricing: { priceKobo: 1420000 },
    specifications: {
      warranty: "12 Months",
      connectors: "2x USB-C (PD 3.0), 1x USB-A (QC 4.0)",
      powerRating: "65W Max Output",
      buildMaterial: "GaN Semiconductor + Flame Retardant PC",
      certification: "UK Standard 3-Pin, CE, SONCAP"
    }
  },
  {
    id: "44444444-2222-3333-4444-555555555504",
    sku: "NG-CB-01",
    skuId: "44444444-2222-3333-4444-555555555514",
    name: "Nigson Armored Braided Type-C to Type-C Cable (2m)",
    slug: "nigson-armored-braided-type-c-to-type-c-cable-2m",
    category: "Cables & Adapters",
    categoryId: "10000000-0000-0000-0000-000000000004",
    categoryName: "Cables & Adapters",
    brand: "Nigson",
    brandName: "Nigson",
    price: 4500,
    retail: 4500,
    retailPrice: 4500,
    wholesale: 3600,
    wholesalePrice: 3600,
    distributor: 3150,
    distributorPrice: 3150,
    desc: "100W Power Delivery nylon-braided cable with aluminum alloy connectors, tested to 25,000 bends.",
    description: "100W Power Delivery nylon-braided cable with aluminum alloy connectors, tested to 25,000 bends.",
    image: "/assets/cat-cable.jpg",
    imageUrl: "/assets/cat-cable.jpg",
    images: ["/assets/cat-cable.jpg"],
    stock: 500,
    reserved: 30,
    rating: 4.6,
    status: "Active",
    available: true,
    pricing: { priceKobo: 450000 },
    specifications: {
      warranty: "24 Months",
      connectors: "USB-C to USB-C (E-Marker IC)",
      powerRating: "100W (20V/5A), 480Mbps Data",
      buildMaterial: "Double Braided Nylon + Aluminum Alloy",
      certification: "USB-IF, CE, RoHS"
    }
  },
  {
    id: "55555555-2222-3333-4444-555555555505",
    sku: "NG-CC-01",
    skuId: "55555555-2222-3333-4444-555555555515",
    name: "Nigson MagSafe 15W Wireless Car Charger & Mount",
    slug: "nigson-magsafe-15w-wireless-car-charger-mount",
    category: "Fast Chargers",
    categoryId: "10000000-0000-0000-0000-000000000003",
    categoryName: "Fast Chargers",
    brand: "Nigson",
    brandName: "Nigson",
    price: 12800,
    retail: 12800,
    retailPrice: 12800,
    wholesale: 10240,
    wholesalePrice: 10240,
    distributor: 8960,
    distributorPrice: 8960,
    desc: "Automatic magnetic alignment car vent mount with fast wireless charging and 360-degree rotation.",
    description: "Automatic magnetic alignment car vent mount with fast wireless charging and 360-degree rotation.",
    image: "/assets/cat-charger.jpg",
    imageUrl: "/assets/cat-charger.jpg",
    images: ["/assets/cat-charger.jpg"],
    stock: 64,
    reserved: 2,
    rating: 4.5,
    status: "Active",
    available: true,
    pricing: { priceKobo: 1280000 },
    specifications: {
      warranty: "12 Months",
      connectors: "Qi Wireless, USB-C Input",
      powerRating: "15W Max Wireless Output",
      buildMaterial: "Tempered Glass + Aluminum Frame",
      certification: "Qi Certified, CE, FCC"
    }
  },
  {
    id: "66666666-2222-3333-4444-555555555506",
    sku: "NG-SP-01",
    skuId: "66666666-2222-3333-4444-555555555516",
    name: "Nigson 6-Way Surge Protector Extension with 4 USB Ports",
    slug: "nigson-6-way-surge-protector-extension-with-4-usb-ports",
    category: "Cables & Adapters",
    categoryId: "10000000-0000-0000-0000-000000000004",
    categoryName: "Cables & Adapters",
    brand: "Nigson",
    brandName: "Nigson",
    price: 16500,
    retail: 16500,
    retailPrice: 16500,
    wholesale: 13200,
    wholesalePrice: 13200,
    distributor: 11550,
    distributorPrice: 11550,
    desc: "Flame-retardant multi-socket surge protector with individual switches, overload breaker, and fast USB ports.",
    description: "Flame-retardant multi-socket surge protector with individual switches, overload breaker, and fast USB ports.",
    image: "/assets/cat-powerbank.jpg",
    imageUrl: "/assets/cat-powerbank.jpg",
    images: ["/assets/cat-powerbank.jpg"],
    stock: 140,
    reserved: 10,
    rating: 4.7,
    status: "Active",
    available: true,
    pricing: { priceKobo: 1650000 },
    specifications: {
      warranty: "12 Months",
      connectors: "6 Universal Sockets + 4 USB Ports",
      powerRating: "2500W / 10A Max, 1750 Joules Surge Protection",
      buildMaterial: "750°C Flame Retardant Phosphor Bronze",
      certification: "SONCAP, CE, ISO9001"
    }
  }
];

function queryPg(sql) {
  try {
    return cp.execFileSync(
      'docker',
      ['exec', '-i', 'nigson-local-postgres-1', 'psql', '-U', 'nigson_bootstrap', '-d', 'nigson', '-t', '-A'],
      { input: sql, encoding: 'utf8' }
    ).trim();
  } catch (err) {
    console.error('[CMS Bridge] PostgreSQL error:', err.message);
    throw err;
  }
}

function queryPgJson(sql) {
  const cleanSql = sql.trim().replace(/;+$/, '');
  const wrapped = `SELECT json_agg(t) FROM (${cleanSql}) t;`;
  const res = queryPg(wrapped);
  if (!res || res === '') return [];
  try {
    return JSON.parse(res) || [];
  } catch {
    return [];
  }
}

function ensureValidUuid(id) {
  if (id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  return crypto.randomUUID();
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function syncProductToPostgresTables(p) {
  try {
    const uuid = ensureValidUuid(p.id);
    const skuUuid = ensureValidUuid(p.skuId);
    const skuCode = (p.sku || ('SKU-' + uuid.slice(0, 8))).replace(/'/g, "''");
    const name = (p.name || 'Product').replace(/'/g, "''");
    const slug = (p.slug || slugify(p.name) || ('prod-' + uuid.slice(0, 8))).replace(/'/g, "''");
    const desc = (p.description || p.desc || '').replace(/'/g, "''");
    const specs = JSON.stringify(p.specifications || {}).replace(/'/g, "''");

    const sql = `
      INSERT INTO commerce.product (id, created_by, updated_by, name, slug, description, specifications, status, revision)
      VALUES ('${uuid}', 'admin', 'admin', '${name}', '${slug}', '${desc}', '${specs}'::jsonb, 'ACTIVE', 1)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name, 
        description = EXCLUDED.description, 
        specifications = EXCLUDED.specifications, 
        updated_at = now();

      INSERT INTO commerce.sku (id, product_id, code, variant_name, unit, created_by, updated_by)
      VALUES ('${skuUuid}', '${uuid}', '${skuCode}', 'Standard', 'PIECE', 'admin', 'admin')
      ON CONFLICT (id) DO UPDATE SET 
        code = EXCLUDED.code, 
        updated_at = now();
    `;
    queryPg(sql);
  } catch (err) {
    console.warn('[CMS Bridge] Non-fatal notice syncing to commerce.product:', err.message);
  }
}

function ensureTablesAndPages() {
  console.log('[CMS Bridge] Ensuring experience database tables...');
  
  // Create admin_cms_store table for robust JSON persistence of CMS entities
  queryPg(`
    CREATE TABLE IF NOT EXISTS experience.admin_cms_store (
      key VARCHAR(100) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  `);

  // Ensure default brand and categories exist in commerce schema
  try {
    queryPg(`
      INSERT INTO commerce.brand (id, created_by, updated_by, name, slug, active)
      VALUES ('00000000-0000-0000-0000-000000000001', 'system', 'system', 'Nigson', 'nigson', true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO commerce.category (id, created_by, updated_by, name, slug, sort_order, active)
      VALUES 
        ('10000000-0000-0000-0000-000000000001', 'system', 'system', 'Earbuds', 'earbuds', 1, true),
        ('10000000-0000-0000-0000-000000000002', 'system', 'system', 'Power Banks', 'power-banks', 2, true),
        ('10000000-0000-0000-0000-000000000003', 'system', 'system', 'Fast Chargers', 'fast-chargers', 3, true),
        ('10000000-0000-0000-0000-000000000004', 'system', 'system', 'Cables & Adapters', 'cables-adapters', 4, true),
        ('10000000-0000-0000-0000-000000000005', 'system', 'system', 'Industrial Lubricants', 'industrial-lubricants', 5, true),
        ('10000000-0000-0000-0000-000000000006', 'system', 'system', 'Solar & Inverters', 'solar-inverters', 6, true)
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch (e) {
    console.warn('[CMS Bridge] Note on commerce schema seed:', e.message);
  }

  // Ensure products key exists in experience.admin_cms_store
  try {
    const existingProds = queryPg(`SELECT key FROM experience.admin_cms_store WHERE key = 'products' LIMIT 1;`);
    if (!existingProds) {
      console.log('[CMS Bridge] Initializing default products in experience.admin_cms_store...');
      queryPg(`
        INSERT INTO experience.admin_cms_store (key, data, updated_at)
        VALUES ('products', '${JSON.stringify(DEFAULT_PRODUCTS).replace(/'/g, "''")}'::jsonb, now());
      `);
      for (const p of DEFAULT_PRODUCTS) {
        syncProductToPostgresTables(p);
      }
    }
  } catch (e) {
    console.warn('[CMS Bridge] Error initializing products:', e.message);
  }

  // Ensure page_insights exists in admin_cms_store
  try {
    const existingInsights = queryPg(`SELECT key FROM experience.admin_cms_store WHERE key = 'page_insights' LIMIT 1;`);
    if (!existingInsights) {
      console.log('[CMS Bridge] Initializing default page_insights in experience.admin_cms_store...');
      const defaultInsights = {
        id: 'insights',
        status: 'Published',
        sections: [
          {
            id: 'hero',
            visible: true,
            fields: {
              eyebrow: 'Insights',
              heading: 'Latest from Nigson.',
              body: 'Product updates, industry trends and business news.'
            },
            cards: []
          },
          {
            id: 'articles',
            visible: true,
            fields: {
              intro: '',
              readLabel: 'Read article'
            },
            cards: []
          },
          {
            id: 'cta',
            visible: true,
            fields: {
              heading: 'Want wholesale pricing on what you just read about?',
              body: 'Our sales desk responds to every quote request within 24 hours.',
              btnLabel: 'Request a quote',
              btnLink: '/quote'
            },
            cards: []
          }
        ]
      };
      savePageToDatabase('insights', 'Insights', defaultInsights.sections);
    }
  } catch (e) {
    console.warn('[CMS Bridge] Note on page_insights initialization:', e.message);
  }

  // Ensure default CMS pages
  for (const [pageId, info] of Object.entries(PAGE_MAPPING)) {
    const existing = queryPg(`SELECT id FROM experience.content_item WHERE content_type = '${info.type}' AND slug = '${info.slug}' LIMIT 1;`);
    if (!existing) {
      const itemId = crypto.randomUUID();
      const revId = crypto.randomUUID();
      const body = JSON.stringify({ schemaVersion: 1, blocks: [] });
      const metadata = JSON.stringify({ title: info.title, description: info.title, robots: 'INDEX', alternates: [], structuredData: {} });
      const hash = crypto.createHash('sha256').update(body + metadata).digest('hex');

      const sql = `
        INSERT INTO experience.content_item (id, created_by, updated_by, content_type, slug, locale, status)
        VALUES ('${itemId}', 'system', 'system', '${info.type}', '${info.slug}', 'en', 'ACTIVE');
        INSERT INTO experience.content_revision (id, created_by, updated_by, content_item_id, revision, title, body, metadata, state, published_at, approved_by, checksum_sha256)
        VALUES ('${revId}', 'system', 'system', '${itemId}', 1, '${info.title.replace(/'/g, "''")}', '${body.replace(/'/g, "''")}'::jsonb, '${metadata.replace(/'/g, "''")}'::jsonb, 'PUBLISHED', now(), '${itemId}', '${hash}');
        UPDATE experience.content_item SET current_published_revision_id = '${revId}', updated_at = now() WHERE id = '${itemId}';
      `;
      queryPg(sql);
      console.log(`[CMS Bridge] Initialized content_item and revision for ${info.type}/${info.slug} (${pageId})`);
    }
  }
}

function loadAllProductsFromDatabase() {
  try {
    const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'products';`);
    if (rows.length > 0 && rows[0].data_text) {
      const prods = JSON.parse(rows[0].data_text);
      if (Array.isArray(prods) && prods.length > 0) return prods;
    }
  } catch (err) {
    console.error('[CMS Bridge] Error loading products:', err.message);
  }
  return DEFAULT_PRODUCTS;
}

function saveProductsToDatabase(products) {
  queryPg(`
    INSERT INTO experience.admin_cms_store (key, data, updated_at)
    VALUES ('products', '${JSON.stringify(products).replace(/'/g, "''")}'::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
  `);
}

function savePageToDatabase(pageId, title, sections) {
  const mapping = PAGE_MAPPING[pageId] || { type: pageId.toUpperCase(), slug: pageId.toLowerCase(), title: title || pageId };
  const type = mapping.type;
  const slug = mapping.slug;
  const pageTitle = title || mapping.title;

  let itemId = queryPg(`SELECT id FROM experience.content_item WHERE content_type = '${type}' AND slug = '${slug}' LIMIT 1;`);
  if (!itemId) {
    itemId = crypto.randomUUID();
    queryPg(`
      INSERT INTO experience.content_item (id, created_by, updated_by, content_type, slug, locale, status)
      VALUES ('${itemId}', 'admin', 'admin', '${type}', '${slug}', 'en', 'ACTIVE');
    `);
  }

  const blocks = (sections || []).map(s => ({
    type: 'TEXT',
    text: JSON.stringify({
      id: s.id,
      visible: s.visible !== false,
      fields: s.fields || {},
      cards: s.cards || []
    })
  }));

  const body = JSON.stringify({ schemaVersion: 1, blocks: blocks });
  const metadata = JSON.stringify({
    title: pageTitle,
    description: 'Official page for ' + pageTitle,
    robots: 'INDEX',
    alternates: [],
    structuredData: {}
  });

  const hash = crypto.createHash('sha256').update(body + metadata).digest('hex');
  const revId = crypto.randomUUID();

  const lastRevStr = queryPg(`SELECT COALESCE(max(revision), 0) FROM experience.content_revision WHERE content_item_id = '${itemId}';`);
  const nextRev = (parseInt(lastRevStr, 10) || 0) + 1;

  const sql = `
    INSERT INTO experience.content_revision (id, created_by, updated_by, content_item_id, revision, title, body, metadata, state, published_at, approved_by, checksum_sha256)
    VALUES ('${revId}', 'admin', 'admin', '${itemId}', ${nextRev}, '${pageTitle.replace(/'/g, "''")}', '${body.replace(/'/g, "''")}'::jsonb, '${metadata.replace(/'/g, "''")}'::jsonb, 'PUBLISHED', now(), '${itemId}', '${hash}');
    UPDATE experience.content_item SET current_published_revision_id = '${revId}', version = version + 1, updated_at = now(), updated_by = 'admin' WHERE id = '${itemId}';
    INSERT INTO experience.admin_cms_store (key, data, updated_at)
    VALUES ('page_${pageId}', '${JSON.stringify({ id: pageId, status: 'Published', sections }).replace(/'/g, "''")}'::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
  `;
  queryPg(sql);

  console.log(`[CMS Bridge] Successfully saved & published ${pageId} (${type}/${slug}) revision ${nextRev} to PostgreSQL!`);
  return { success: true, revision: nextRev, publishedAt: new Date().toISOString() };
}

function loadAllPagesFromDatabase() {
  const sql = `
    SELECT i.content_type, i.slug, r.title, r.body::text AS body_text, r.updated_at
    FROM experience.content_item i
    JOIN experience.content_revision r ON r.id = i.current_published_revision_id
    WHERE i.status = 'ACTIVE' AND i.deleted_at IS NULL AND r.state = 'PUBLISHED'
  `;
  const rows = queryPgJson(sql);
  const result = {};

  for (const row of rows) {
    let pageId = null;
    for (const [pId, info] of Object.entries(PAGE_MAPPING)) {
      if (info.type === row.content_type && info.slug === row.slug) {
        pageId = pId;
        break;
      }
    }
    if (!pageId) continue;

    try {
      const parsedBody = JSON.parse(row.body_text || '{}');
      const sections = [];
      for (const b of (parsedBody.blocks || [])) {
        if (b.type === 'TEXT' && b.text) {
          try {
            sections.push(JSON.parse(b.text));
          } catch {}
        }
      }
      if (sections.length > 0) {
        result[pageId] = {
          id: pageId,
          status: 'Published',
          updatedAt: row.updated_at,
          sections: sections
        };
      }
    } catch (e) {
      console.warn(`[CMS Bridge] Could not parse body for ${pageId}:`, e.message);
    }
  }

  const storeRows = queryPgJson(`SELECT key, data::text AS data_text FROM experience.admin_cms_store WHERE key LIKE 'page_%';`);
  for (const sr of storeRows) {
    try {
      const pId = sr.key.replace('page_', '');
      const parsed = JSON.parse(sr.data_text || '{}');
      if (parsed.sections && parsed.sections.length > 0) {
        result[pId] = parsed;
      }
    } catch {}
  }

  return result;
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-Match, Idempotency-Key, X-CSRF-TOKEN, X-Correlation-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', server: 'cms-db-bridge' }));
    return;
  }

  // ─── CATALOGUE & PRODUCTS API ──────────────────────────────────────────────
  if ((url.pathname === '/api/v1/catalogue/products' || url.pathname === '/api/v1/staff/products') && req.method === 'GET') {
    try {
      const q = (url.searchParams.get('q') || '').toLowerCase().trim();
      const catId = url.searchParams.get('categoryId');
      const all = loadAllProductsFromDatabase();

      let filtered = all;
      if (q) {
        filtered = filtered.filter(p => 
          (p.name && p.name.toLowerCase().includes(q)) || 
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }
      if (catId) {
        filtered = filtered.filter(p => p.categoryId === catId || p.category === catId || p.categoryName === catId);
      }

      const responsePayload = {
        items: filtered,
        content: filtered,
        totalElements: filtered.length,
        totalPages: 1,
        page: 0,
        size: 100
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responsePayload));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Single Product
  if (url.pathname.startsWith('/api/v1/catalogue/products/') && req.method === 'GET') {
    const idOrSku = url.pathname.replace('/api/v1/catalogue/products/', '').split('/')[0];
    const all = loadAllProductsFromDatabase();
    const found = all.find(p => p.id === idOrSku || p.sku === idOrSku || p.slug === idOrSku);
    if (found) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(found));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Product not found' }));
    }
    return;
  }

  // Categories & Brands
  if (url.pathname === '/api/v1/catalogue/categories' && req.method === 'GET') {
    const cats = [
      { id: '10000000-0000-0000-0000-000000000001', name: 'Earbuds', slug: 'earbuds', imageUrl: '/assets/cat-earbuds.jpg' },
      { id: '10000000-0000-0000-0000-000000000002', name: 'Power Banks', slug: 'power-banks', imageUrl: '/assets/cat-powerbank.jpg' },
      { id: '10000000-0000-0000-0000-000000000003', name: 'Fast Chargers', slug: 'fast-chargers', imageUrl: '/assets/cat-charger.jpg' },
      { id: '10000000-0000-0000-0000-000000000004', name: 'Cables & Adapters', slug: 'cables-adapters', imageUrl: '/assets/cat-cable.jpg' },
      { id: '10000000-0000-0000-0000-000000000005', name: 'Industrial Lubricants', slug: 'industrial-lubricants', imageUrl: '/assets/hero-accessories.jpg' },
      { id: '10000000-0000-0000-0000-000000000006', name: 'Solar & Inverters', slug: 'solar-inverters', imageUrl: '/assets/hero-accessories.jpg' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(cats));
    return;
  }

  if (url.pathname === '/api/v1/catalogue/brands' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ id: '00000000-0000-0000-0000-000000000001', name: 'Nigson', slug: 'nigson' }]));
    return;
  }

  // Create Product via POST /api/v1/staff/products
  if (url.pathname === '/api/v1/staff/products' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const uuid = ensureValidUuid(payload.id);
        const skuUuid = ensureValidUuid(payload.skuId);
        const skuCode = payload.sku || ('NG-SKU-' + uuid.slice(0, 6).toUpperCase());
        const price = Number(payload.retail || payload.retailPrice || payload.price || 0);

        const newProduct = {
          id: uuid,
          sku: skuCode,
          skuId: skuUuid,
          name: payload.name || 'New Product',
          slug: payload.slug || slugify(payload.name || 'product') + '-' + uuid.slice(0, 6),
          category: payload.category || payload.categoryName || 'General',
          categoryId: payload.categoryId || '10000000-0000-0000-0000-000000000001',
          categoryName: payload.category || payload.categoryName || 'General',
          brand: payload.brand || 'Nigson',
          brandName: payload.brand || 'Nigson',
          price: price,
          retail: price,
          retailPrice: price,
          wholesale: Number(payload.wholesale || payload.wholesalePrice || Math.round(price * 0.8)),
          wholesalePrice: Number(payload.wholesale || payload.wholesalePrice || Math.round(price * 0.8)),
          distributor: Number(payload.distributor || payload.distributorPrice || Math.round(price * 0.7)),
          distributorPrice: Number(payload.distributor || payload.distributorPrice || Math.round(price * 0.7)),
          desc: payload.desc || payload.description || '',
          description: payload.description || payload.desc || '',
          image: (payload.images && payload.images[0]) || payload.image || '/assets/hero-accessories.jpg',
          imageUrl: (payload.images && payload.images[0]) || payload.image || '/assets/hero-accessories.jpg',
          images: (payload.images && payload.images.length > 0) ? payload.images : [payload.image || '/assets/hero-accessories.jpg'],
          stock: Number(payload.stock || 100),
          reserved: 0,
          rating: 5.0,
          status: payload.status || 'Active',
          available: true,
          pricing: { priceKobo: Math.round(price * 100) },
          specifications: payload.specifications || {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const all = loadAllProductsFromDatabase();
        // Remove existing if any
        const filtered = all.filter(p => p.id !== uuid && p.sku !== skuCode);
        const updated = [newProduct, ...filtered];
        saveProductsToDatabase(updated);

        // Sync to Postgres commerce schema
        syncProductToPostgresTables(newProduct);

        console.log(`[CMS Bridge] Successfully created and saved product: ${newProduct.name} (${newProduct.sku})`);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newProduct));
      } catch (err) {
        console.error('[CMS Bridge] Create product error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Update Product via PATCH / PUT /api/v1/staff/products/:id
  if (url.pathname.startsWith('/api/v1/staff/products/') && (req.method === 'PATCH' || req.method === 'PUT')) {
    const id = url.pathname.replace('/api/v1/staff/products/', '').split('/')[0];
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const all = loadAllProductsFromDatabase();
        let target = all.find(p => p.id === id || p.sku === id);

        if (!target) {
          target = { id: ensureValidUuid(id), sku: payload.sku || id };
        }

        const price = Number(payload.retail || payload.retailPrice || payload.price || target.price || 0);
        const updatedProduct = {
          ...target,
          ...payload,
          id: target.id,
          price: price,
          retail: price,
          retailPrice: price,
          pricing: { priceKobo: Math.round(price * 100) },
          updatedAt: new Date().toISOString()
        };

        const updatedList = all.map(p => (p.id === target.id || p.sku === target.sku) ? updatedProduct : p);
        saveProductsToDatabase(updatedList);
        syncProductToPostgresTables(updatedProduct);

        console.log(`[CMS Bridge] Successfully updated product: ${updatedProduct.name}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updatedProduct));
      } catch (err) {
        console.error('[CMS Bridge] Update product error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // ─── PAGES & CMS STORE ─────────────────────────────────────────────────────
  if (url.pathname === '/api/v1/content/all-pages' && req.method === 'GET') {
    try {
      const data = loadAllPagesFromDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if ((url.pathname === '/api/v1/content/publish' || url.pathname.startsWith('/api/v1/content/save/')) && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const pageId = payload.pageId || (url.pathname.split('/').pop());
        const title = payload.title || '';
        const sections = payload.sections || [];

        if (!pageId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'pageId is required' }));
          return;
        }

        const result = savePageToDatabase(pageId, title, sections);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        console.error('[CMS Bridge] Save error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Generic key-value store for other CMS items (blog posts, reviews, products)
  if (url.pathname.startsWith('/api/v1/content/store/') && req.method === 'GET') {
    const key = url.pathname.replace('/api/v1/content/store/', '');
    try {
      const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = '${key.replace(/'/g, "''")}';`);
      if (rows.length > 0 && rows[0].data_text) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(rows[0].data_text);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Key not found' }));
      }
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (url.pathname.startsWith('/api/v1/content/store/') && req.method === 'POST') {
    const key = url.pathname.replace('/api/v1/content/store/', '');
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        queryPg(`
          INSERT INTO experience.admin_cms_store (key, data, updated_at)
          VALUES ('${key.replace(/'/g, "''")}', '${bodyData.replace(/'/g, "''")}'::jsonb, now())
          ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
        `);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, key }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

ensureTablesAndPages();

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[CMS Bridge] Server running on http://0.0.0.0:${PORT}`);
});
