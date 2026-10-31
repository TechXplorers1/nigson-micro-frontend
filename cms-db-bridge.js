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

const DEFAULT_PRODUCTS = [];

const OFFICIAL_SKU_PRICES = {
  'NS03': 1450000,
  'NS06': 2450000,
  'NS107': 1850000,
  'NS211C': 350000,
  'NS211i': 350000,
  'NS25': 450000,
  'NS2526C': 1650000,
  'NS2618': 1850000,
  'NS3416': 2650000,
  'NS3604C': 1950000,
  'NS4': 950000,
  'NS6': 1950000,
  'NS6-1': 1450000,
  'NS901C': 450000,
  'NS901i': 420000,
  'NS96U': 520000,
  'PQ19': 1650000,
  'PQ20': 2650000,
  'PQ28': 1950000,
  'PQ30': 3450000,
  'PQ50': 4850000,
  'ZS6': 2650000,
  'ZS8': 2150000
};

const CATEGORY_IMAGE_MAP = {
  'Power Banks': '/assets/cat-powerbank.jpg',
  'Earbuds': '/assets/cat-earbuds.jpg',
  'Cables': '/assets/cat-cable.jpg',
  'Chargers': '/assets/cat-charger.jpg',
  'Fast Chargers': '/assets/cat-charger.jpg',
  'Extension Sockets': '/assets/cat-powerbank.jpg',
  'Motion-Activated Lights': '/assets/hero-accessories.jpg'
};

function extractSkuFromSlugOrName(slug, name) {
  if (slug) {
    const clean = slug.replace(/^nigson-/, '');
    if (clean.startsWith('ns6-1')) return 'NS6-1';
    if (clean.startsWith('ns2526c')) return 'NS2526C';
    if (clean.startsWith('ns3604c')) return 'NS3604C';
    if (clean.startsWith('ns211c')) return 'NS211C';
    if (clean.startsWith('ns211i')) return 'NS211i';
    if (clean.startsWith('ns901c')) return 'NS901C';
    if (clean.startsWith('ns901i')) return 'NS901i';
    if (clean.startsWith('ns96u')) return 'NS96U';
    return clean.split('-')[0].toUpperCase();
  }
  if (name) {
    return name.split(' ')[0].toUpperCase();
  }
  return 'NG-SKU';
}

function resolveCategoryFromSku(sku, fallback = 'General') {
  const upper = (sku || '').toUpperCase();
  if (upper.startsWith('NS03') || upper.startsWith('NS06')) return 'Earbuds';
  if (upper.startsWith('PQ')) return 'Power Banks';
  if (upper.startsWith('NS211') || upper.startsWith('NS25') || upper.startsWith('NS901') || upper.startsWith('NS96')) return 'Cables';
  if (upper.startsWith('NS107') || upper.startsWith('NS2526') || upper.startsWith('NS2618') || upper.startsWith('NS4') || upper.startsWith('ZS')) return 'Chargers';
  if (upper.startsWith('NS3416') || upper.startsWith('NS3604')) return 'Extension Sockets';
  if (upper.startsWith('NS6')) return 'Motion-Activated Lights';
  return fallback;
}

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
    const rawId = (p.id || '').replace(/'/g, "''");
    const cleanSku = (p.sku || '').replace(/'/g, "''");
    const cleanSlug = (p.slug || slugify(p.name || '')).replace(/'/g, "''");

    // Look for existing product in PostgreSQL by ID, SKU, or slug
    let targetUuid = '';
    if (rawId || cleanSku || cleanSlug) {
      targetUuid = queryPg(`
        SELECT p.id FROM commerce.product p
        LEFT JOIN commerce.sku s ON s.product_id = p.id
        WHERE (${rawId ? `p.id::text = '${rawId}'` : 'false'}
           OR ${cleanSku ? `s.code = '${cleanSku}'` : 'false'}
           OR ${cleanSlug ? `p.slug = '${cleanSlug}'` : 'false'})
        LIMIT 1;
      `);
    }

    const uuid = targetUuid || ensureValidUuid(p.id);
    const skuUuid = ensureValidUuid(p.skuId);
    const skuCode = (p.sku || ('SKU-' + uuid.slice(0, 8))).replace(/'/g, "''");
    const name = (p.name || 'Product').replace(/'/g, "''");
    const desc = (p.description || p.desc || '').replace(/'/g, "''");
    const specs = JSON.stringify(p.specifications || {}).replace(/'/g, "''");

    if (targetUuid) {
      // Existing product: update fields and reactivate if soft-deleted
      queryPg(`
        UPDATE commerce.product SET 
          name = '${name}',
          description = '${desc}',
          specifications = '${specs}'::jsonb,
          status = 'ACTIVE',
          deleted_at = NULL,
          updated_at = now()
        WHERE id = '${uuid}';

        INSERT INTO commerce.sku (id, product_id, code, variant_name, unit, created_by, updated_by, active, deleted_at)
        VALUES ('${skuUuid}', '${uuid}', '${skuCode}', 'Standard', 'PIECE', 'admin', 'admin', true, NULL)
        ON CONFLICT (code) DO UPDATE SET 
          product_id = EXCLUDED.product_id,
          variant_name = EXCLUDED.variant_name,
          active = true,
          deleted_at = NULL,
          updated_at = now();
      `);
    } else {
      // New product: ensure slug uniqueness
      let finalSlug = cleanSlug || ('prod-' + uuid.slice(0, 8));
      const existingCount = queryPg(`SELECT count(*) FROM commerce.product WHERE slug = '${finalSlug}';`);
      if (Number(existingCount) > 0) {
        finalSlug = `${finalSlug}-${uuid.slice(0, 6)}`;
      }

      queryPg(`
        INSERT INTO commerce.product (id, created_by, updated_by, name, slug, description, specifications, status, revision, brand_id, published_at)
        VALUES ('${uuid}', 'admin', 'admin', '${name}', '${finalSlug}', '${desc}', '${specs}'::jsonb, 'ACTIVE', 1, '22222222-2222-3333-4444-555555555501', now())
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name, 
          description = EXCLUDED.description, 
          specifications = EXCLUDED.specifications, 
          status = 'ACTIVE',
          deleted_at = NULL,
          updated_at = now();

        INSERT INTO commerce.sku (id, product_id, code, variant_name, unit, created_by, updated_by, active, deleted_at)
        VALUES ('${skuUuid}', '${uuid}', '${skuCode}', 'Standard', 'PIECE', 'admin', 'admin', true, NULL)
        ON CONFLICT (code) DO UPDATE SET 
          product_id = EXCLUDED.product_id,
          variant_name = EXCLUDED.variant_name,
          active = true,
          deleted_at = NULL,
          updated_at = now();
      `);
    }

    // Link category in commerce.product_category
    let catId = p.categoryId;
    if (!catId || catId.startsWith('10000000')) {
      const catName = (p.category || p.categoryName || '').replace(/'/g, "''");
      if (catName) {
        catId = queryPg(`SELECT id FROM commerce.category WHERE lower(name) = lower('${catName}') LIMIT 1;`);
      }
    }
    if (catId && /^[0-9a-f-]{36}$/i.test(catId)) {
      queryPg(`
        DELETE FROM commerce.product_category WHERE product_id = '${uuid}';
        INSERT INTO commerce.product_category (id, created_by, updated_by, product_id, category_id)
        VALUES (gen_random_uuid(), 'admin', 'admin', '${uuid}', '${catId}')
        ON CONFLICT (product_id, category_id) DO NOTHING;
      `);
    }
  } catch (err) {
    console.error('[CMS Bridge] Non-fatal notice syncing to commerce.product:', err.message);
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
      VALUES ('22222222-2222-3333-4444-555555555501', 'system', 'system', 'Nigson', 'nigson', true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO commerce.category (id, created_by, updated_by, version, parent_id, name, slug, sort_order, active)
      VALUES 
        ('11111111-2222-3333-4444-555555555501', 'system', 'system', 0, NULL, 'Power Banks', 'power-banks', 1, true),
        ('11111111-2222-3333-4444-555555555502', 'system', 'system', 0, NULL, 'Earbuds', 'earbuds', 2, true),
        ('11111111-2222-3333-4444-555555555503', 'system', 'system', 0, NULL, 'Cables', 'cables', 3, true),
        ('11111111-2222-3333-4444-555555555504', 'system', 'system', 0, NULL, 'Chargers', 'chargers', 4, true),
        ('11111111-2222-3333-4444-555555555505', 'system', 'system', 0, NULL, 'Extension Sockets', 'extension-sockets', 5, true),
        ('11111111-2222-3333-4444-555555555506', 'system', 'system', 0, NULL, 'Motion-Activated Lights', 'motion-activated-lights', 6, true)
      ON CONFLICT (id) DO NOTHING;
    `);
  } catch (e) {
    console.warn('[CMS Bridge] Note on commerce schema seed:', e.message);
  }

  // Ensure default orders exist in experience.admin_cms_store
  try {
    const existingOrders = queryPg(`SELECT key FROM experience.admin_cms_store WHERE key = 'orders' LIMIT 1;`);
    if (!existingOrders) {
      console.log('[CMS Bridge] Initializing default orders in experience.admin_cms_store...');
      const sampleOrders = [
        {
          id: 'e4a19b88-348e-4a68-9a7c-482029bfb401',
          orderId: 'e4a19b88-348e-4a68-9a7c-482029bfb401',
          orderNumber: 'ORD-2026-1089',
          number: 'ORD-2026-1089',
          createdAt: '2026-10-30T14:22:10.000Z',
          placedAt: '2026-10-30T14:22:10.000Z',
          date: '2026-10-30T14:22:10.000Z',
          customer: {
            name: 'E2E Retailer',
            email: 'retailA@synthetic.test',
            phone: '+234 803 123 4567',
            address: '14 Commercial Avenue, Yaba, Lagos'
          },
          customerName: 'E2E Retailer',
          customerEmail: 'retailA@synthetic.test',
          customerPhone: '+234 803 123 4567',
          shippingAddress: {
            line1: '14 Commercial Avenue',
            city: 'Yaba',
            state: 'Lagos',
            countryCode: 'NG',
            postalCode: '100001'
          },
          deliveryAddress: {
            line1: '14 Commercial Avenue',
            city: 'Yaba',
            state: 'Lagos',
            countryCode: 'NG',
            postalCode: '100001'
          },
          buyerContact: {
            fullName: 'E2E Retailer',
            email: 'retailA@synthetic.test',
            phone: '+234 803 123 4567'
          },
          paymentMethod: 'Credit Card',
          items: [
            {
              lineId: 'line-1089-1',
              sku: 'NS06',
              skuId: 'c52cf637-25d0-5eb6-862a-e737389c7ad4',
              name: 'NS06 ANC/ENC Wireless Earbuds',
              title: 'NS06 ANC/ENC Wireless Earbuds',
              quantity: 2,
              qty: 2,
              price: 24500,
              unitPriceMinorUnits: 2450000,
              imageUrl: 'http://localhost:4566/nigson-product-images/products/ns06/img-1.png'
            }
          ],
          lines: [
            {
              lineId: 'line-1089-1',
              sku: 'NS06',
              skuId: 'c52cf637-25d0-5eb6-862a-e737389c7ad4',
              name: 'NS06 ANC/ENC Wireless Earbuds',
              quantity: 2,
              unitAmount: '24500.00',
              imageUrl: 'http://localhost:4566/nigson-product-images/products/ns06/img-1.png'
            }
          ],
          subtotal: 49000,
          subtotalMinorUnits: 4900000,
          shipping: 3500,
          shippingMinorUnits: 350000,
          tax: 3675,
          taxMinorUnits: 367500,
          total: 56175,
          totalMinorUnits: 5617500,
          totalKobo: 5617500,
          totals: {
            subtotal: '49000.00',
            delivery: '3500.00',
            tax: '3675.00',
            grandTotal: '56175.00'
          },
          currency: 'NGN',
          paymentStatus: 'Paid',
          status: 'Delivered',
          delivery: 'Standard Delivery',
          shippingMethod: 'Standard Delivery',
          deliveryMethod: 'Standard Delivery',
          estimatedDeliveryDate: '2026-11-03',
          timeline: [
            { label: 'Order Placed', date: '2026-10-30T14:22:10.000Z' },
            { label: 'Payment Confirmed', date: '2026-10-30T14:23:00.000Z' },
            { label: 'Dispatched', date: '2026-10-31T09:00:00.000Z' }
          ]
        },
        {
          id: 'f82b7190-2211-4011-b552-39049929da92',
          orderId: 'f82b7190-2211-4011-b552-39049929da92',
          orderNumber: 'ORD-2026-1090',
          number: 'ORD-2026-1090',
          createdAt: '2026-10-31T11:05:40.000Z',
          placedAt: '2026-10-31T11:05:40.000Z',
          date: '2026-10-31T11:05:40.000Z',
          customer: {
            name: 'Bhari Wholesale',
            email: 'wholesale@bhari.test',
            phone: '+234 802 999 8888',
            address: '8 Marina Road, Lagos Island, Lagos'
          },
          customerName: 'Bhari Wholesale',
          customerEmail: 'wholesale@bhari.test',
          customerPhone: '+234 802 999 8888',
          shippingAddress: {
            line1: '8 Marina Road',
            city: 'Lagos Island',
            state: 'Lagos',
            countryCode: 'NG',
            postalCode: '100001'
          },
          deliveryAddress: {
            line1: '8 Marina Road',
            city: 'Lagos Island',
            state: 'Lagos',
            countryCode: 'NG',
            postalCode: '100001'
          },
          buyerContact: {
            fullName: 'Bhari Wholesale',
            email: 'wholesale@bhari.test',
            phone: '+234 802 999 8888'
          },
          paymentMethod: 'Debit Card',
          items: [
            {
              lineId: 'line-1090-1',
              sku: '23-56',
              skuId: '7c8ab40b-91c5-4516-9b68-668c55e83073',
              name: 'bhari phones',
              title: 'bhari phones',
              quantity: 3,
              qty: 3,
              price: 4500,
              unitPriceMinorUnits: 450000,
              imageUrl: '/assets/cat-earbuds.jpg'
            }
          ],
          lines: [
            {
              lineId: 'line-1090-1',
              sku: '23-56',
              skuId: '7c8ab40b-91c5-4516-9b68-668c55e83073',
              name: 'bhari phones',
              quantity: 3,
              unitAmount: '4500.00',
              imageUrl: '/assets/cat-earbuds.jpg'
            }
          ],
          subtotal: 13500,
          subtotalMinorUnits: 1350000,
          shipping: 3500,
          shippingMinorUnits: 350000,
          tax: 1013,
          taxMinorUnits: 101300,
          total: 18013,
          totalMinorUnits: 1801300,
          totalKobo: 1801300,
          totals: {
            subtotal: '13500.00',
            delivery: '3500.00',
            tax: '1013.00',
            grandTotal: '18013.00'
          },
          currency: 'NGN',
          paymentStatus: 'Paid',
          status: 'Processing',
          delivery: 'Standard Delivery',
          shippingMethod: 'Standard Delivery',
          deliveryMethod: 'Standard Delivery',
          estimatedDeliveryDate: '2026-11-04',
          timeline: [
            { label: 'Order Placed', date: '2026-10-31T11:05:40.000Z' },
            { label: 'Payment Confirmed', date: '2026-10-31T11:06:00.000Z' }
          ]
        }
      ];
      queryPg(`
        INSERT INTO experience.admin_cms_store (key, data, updated_at)
        VALUES ('orders', '${JSON.stringify(sampleOrders).replace(/'/g, "''")}'::jsonb, now())
        ON CONFLICT (key) DO NOTHING;
      `);
      console.log('[CMS Bridge] Initialized default orders in experience.admin_cms_store.');
    }
  } catch (e) {
    console.warn('[CMS Bridge] Note on orders initialization:', e.message);
  }

// Default products seeding disabled in favor of live commerce.product tables

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
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.specifications::text AS specifications_text,
        p.status,
        s.id AS sku_id,
        s.code AS sku_code,
        s.variant_name,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        b.name AS brand_name,
        (
          SELECT json_agg(ar.object_key ORDER BY ar.sort_order)
          FROM commerce.asset_reference ar
          WHERE ar.product_id = p.id AND ar.status = 'PUBLISHED'
        ) AS asset_keys
      FROM commerce.product p
      LEFT JOIN LATERAL (
        SELECT id, code, variant_name 
        FROM commerce.sku 
        WHERE product_id = p.id AND active = true AND deleted_at IS NULL 
        ORDER BY id 
        LIMIT 1
      ) s ON true
      LEFT JOIN LATERAL (
        SELECT c2.id, c2.name, c2.slug
        FROM commerce.product_category pc
        JOIN commerce.category c2 ON c2.id = pc.category_id AND c2.active = true AND c2.deleted_at IS NULL
        WHERE pc.product_id = p.id
        ORDER BY c2.sort_order ASC
        LIMIT 1
      ) c ON true
      LEFT JOIN commerce.brand b ON b.id = p.brand_id AND b.active = true AND b.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
      ORDER BY p.name ASC;
    `;
    const rows = queryPgJson(sql);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(r => {
        const sku = r.sku_code || extractSkuFromSlugOrName(r.slug, r.name);
        const categoryName = r.category_name || resolveCategoryFromSku(sku, 'General');
        const defaultMinor = OFFICIAL_SKU_PRICES[sku] || 450000;
        const price = defaultMinor / 100;

        let images = [];
        if (Array.isArray(r.asset_keys) && r.asset_keys.length > 0) {
          images = r.asset_keys.map(k => `http://localhost:4566/nigson-product-images/${k}`);
        } else {
          images = [CATEGORY_IMAGE_MAP[categoryName] || '/assets/hero-accessories.jpg'];
        }

        let specs = {};
        try {
          specs = r.specifications_text ? JSON.parse(r.specifications_text) : {};
        } catch {}

        return {
          id: r.id,
          sku: sku,
          skuId: r.sku_id || r.id,
          name: r.name,
          slug: r.slug,
          category: categoryName,
          categoryId: r.category_id || '',
          categoryName: categoryName,
          brand: r.brand_name || 'Nigson',
          brandName: r.brand_name || 'Nigson',
          price: price,
          retail: price,
          retailPrice: price,
          wholesale: Math.round(price * 0.8),
          wholesalePrice: Math.round(price * 0.8),
          distributor: Math.round(price * 0.7),
          distributorPrice: Math.round(price * 0.7),
          desc: r.description || r.name,
          description: r.description || r.name,
          image: images[0],
          imageUrl: images[0],
          images: images,
          stock: 120,
          reserved: 0,
          rating: 4.8,
          status: r.status || 'Active',
          available: true,
          pricing: { priceKobo: defaultMinor },
          specifications: specs
        };
      });
    }
  } catch (err) {
    console.error('[CMS Bridge] Error loading products from commerce schema:', err.message);
  }

  // Fallback to experience.admin_cms_store
  try {
    const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'products';`);
    if (rows.length > 0 && rows[0].data_text) {
      const prods = JSON.parse(rows[0].data_text);
      if (Array.isArray(prods) && prods.length > 0) return prods;
    }
  } catch {}

  return [];
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
  if ((url.pathname.startsWith('/api/v1/catalogue/products/') || url.pathname.startsWith('/api/v1/staff/products/')) && req.method === 'GET') {
    const idOrSku = url.pathname.replace(/^\/api\/v1\/(catalogue|staff)\/products\//, '').split('/')[0];
    const all = loadAllProductsFromDatabase();
    const search = decodeURIComponent(idOrSku || '').toLowerCase().trim();
    const found = all.find(p => 
      p.id?.toLowerCase() === search || 
      p.sku?.toLowerCase() === search || 
      p.slug?.toLowerCase() === search
    );
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
    try {
      const dbCats = queryPgJson(`
        SELECT c.id, c.name, c.slug, 
               COALESCE((SELECT count(*) FROM commerce.product_category pc WHERE pc.category_id = c.id), 0) as product_count
        FROM commerce.category c
        WHERE c.active = true AND c.deleted_at IS NULL
        ORDER BY c.sort_order ASC, c.name ASC;
      `);
      if (Array.isArray(dbCats) && dbCats.length > 0) {
        const mapped = dbCats.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: CATEGORY_IMAGE_MAP[c.name] || '/assets/hero-accessories.jpg'
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mapped));
        return;
      }
    } catch (err) {
      console.warn('[CMS Bridge] Error loading categories from DB:', err.message);
    }

    const fallbackCats = [
      { id: '11111111-2222-3333-4444-555555555501', name: 'Power Banks', slug: 'power-banks', imageUrl: '/assets/cat-powerbank.jpg' },
      { id: '11111111-2222-3333-4444-555555555502', name: 'Earbuds', slug: 'earbuds', imageUrl: '/assets/cat-earbuds.jpg' },
      { id: '11111111-2222-3333-4444-555555555503', name: 'Cables', slug: 'cables', imageUrl: '/assets/cat-cable.jpg' },
      { id: '11111111-2222-3333-4444-555555555504', name: 'Chargers', slug: 'chargers', imageUrl: '/assets/cat-charger.jpg' },
      { id: '11111111-2222-3333-4444-555555555505', name: 'Extension Sockets', slug: 'extension-sockets', imageUrl: '/assets/cat-powerbank.jpg' },
      { id: '11111111-2222-3333-4444-555555555506', name: 'Motion-Activated Lights', slug: 'motion-activated-lights', imageUrl: '/assets/hero-accessories.jpg' }
    ];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(fallbackCats));
    return;
  }

  if (url.pathname === '/api/v1/catalogue/brands' && req.method === 'GET') {
    try {
      const dbBrands = queryPgJson(`
        SELECT id, name, slug 
        FROM commerce.brand 
        WHERE active = true AND deleted_at IS NULL 
        ORDER BY name ASC;
      `);
      if (Array.isArray(dbBrands) && dbBrands.length > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(dbBrands));
        return;
      }
    } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify([{ id: '22222222-2222-3333-4444-555555555501', name: 'Nigson', slug: 'nigson' }]));
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

  // Delete Product via DELETE /api/v1/staff/products/:id
  if (url.pathname.startsWith('/api/v1/staff/products/') && req.method === 'DELETE') {
    const idOrSku = url.pathname.replace('/api/v1/staff/products/', '').split('/')[0];
    try {
      const clean = idOrSku.replace(/'/g, "''");
      const targetUuid = queryPg(`
        SELECT p.id FROM commerce.product p 
        LEFT JOIN commerce.sku s ON s.product_id = p.id 
        WHERE p.id::text = '${clean}' OR s.code = '${clean}' OR p.slug = '${clean}'
        LIMIT 1;
      `);

      if (targetUuid) {
        queryPg(`
          UPDATE commerce.sku SET deleted_at = now(), active = false WHERE product_id = '${targetUuid}';
          UPDATE commerce.product SET deleted_at = now(), status = 'ARCHIVED' WHERE id = '${targetUuid}';
          DELETE FROM commerce.product_category WHERE product_id = '${targetUuid}';
        `);
        console.log(`[CMS Bridge] Successfully soft-deleted product ${targetUuid} (${idOrSku})`);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deleted: idOrSku }));
    } catch (err) {
      console.error('[CMS Bridge] Delete product error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ─── CARTS (DATABASE PERSISTENCE) ──────────────────────────────────────────

  function extractCartUserKey(req) {
    return req.headers['x-user-id'] || req.headers['x-user-email'] || 'default_user';
  }

  // Create or get active user cart: POST /api/v1/carts
  if (url.pathname === '/api/v1/carts' && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const userKey = payload.userId || extractCartUserKey(req);
        const storeKey = `cart_${userKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

        const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = '${storeKey}';`);
        let cart = null;
        if (rows.length > 0 && rows[0].data_text) {
          try { cart = JSON.parse(rows[0].data_text); } catch {}
        }

        if (!cart) {
          cart = {
            id: crypto.randomUUID(),
            marketId: payload.marketId || '29b78d62-ec0d-5ff9-8319-b485ecb093d6',
            organizationId: null,
            state: 'ACTIVE',
            lines: [],
            version: 1,
            userId: userKey,
            lastActivityAt: new Date().toISOString()
          };
          const jsonStr = JSON.stringify(cart).replace(/'/g, "''");
          queryPg(`
            INSERT INTO experience.admin_cms_store (key, data, updated_at)
            VALUES ('${storeKey}', '${jsonStr}'::jsonb, now())
            ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
          `);
          console.log(`[CMS Bridge] Initialized new database cart ${cart.id} for user ${userKey}`);
        } else {
          console.log(`[CMS Bridge] Loaded existing database cart ${cart.id} for user ${userKey} (${cart.lines?.length || 0} lines)`);
        }

        res.writeHead(201, {
          'Content-Type': 'application/json',
          'ETag': `"${cart.version || 1}"`,
          'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify(cart));
      } catch (err) {
        console.error('[CMS Bridge] Create cart error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Get active cart by user or ID: GET /api/v1/carts or GET /api/v1/carts/:id
  if ((url.pathname === '/api/v1/carts' || (url.pathname.startsWith('/api/v1/carts/') && !url.pathname.includes('/lines'))) && req.method === 'GET') {
    const rawId = url.pathname.replace('/api/v1/carts/', '').replace('/api/v1/carts', '').split('/')[0];
    const cartId = rawId && rawId !== 'undefined' && rawId !== 'null' ? rawId : '';
    const userKey = extractCartUserKey(req);
    try {
      const rows = queryPgJson(`SELECT key, data::text AS data_text FROM experience.admin_cms_store WHERE key LIKE 'cart_%';`);
      let foundCart = null;

      for (const r of rows) {
        try {
          const c = JSON.parse(r.data_text);
          if (cartId && c.id === cartId) {
            foundCart = c;
            break;
          }
          if (userKey && c.userId === userKey) {
            foundCart = c;
            break;
          }
        } catch {}
      }

      if (foundCart) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'ETag': `"${foundCart.version || 1}"`,
          'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify(foundCart));
      } else {
        const newCart = {
          id: cartId || crypto.randomUUID(),
          marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6',
          organizationId: null,
          state: 'ACTIVE',
          lines: [],
          version: 1,
          userId: userKey,
          lastActivityAt: new Date().toISOString()
        };
        const storeKey = `cart_${userKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        queryPg(`
          INSERT INTO experience.admin_cms_store (key, data, updated_at)
          VALUES ('${storeKey}', '${JSON.stringify(newCart).replace(/'/g, "''")}'::jsonb, now())
          ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
        `);
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'ETag': `"${newCart.version}"`,
          'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify(newCart));
      }
    } catch (err) {
      console.error('[CMS Bridge] GET cart error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Add or update line item: PUT /api/v1/carts/:id/lines/:skuId
  if (url.pathname.startsWith('/api/v1/carts/') && url.pathname.includes('/lines/') && req.method === 'PUT') {
    const parts = url.pathname.replace('/api/v1/carts/', '').split('/lines/');
    const cartId = parts[0];
    const skuId = parts[1]?.split('/')[0];
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const qty = Number(payload.quantity ?? payload.qty ?? 1);

        const rows = queryPgJson(`SELECT key, data::text AS data_text FROM experience.admin_cms_store WHERE key LIKE 'cart_%';`);
        let targetCart = null;
        let targetKey = null;

        for (const r of rows) {
          try {
            const c = JSON.parse(r.data_text);
            if (c.id === cartId) {
              targetCart = c;
              targetKey = r.key;
              break;
            }
          } catch {}
        }

        if (!targetCart) {
          const userKey = extractCartUserKey(req);
          targetKey = `cart_${userKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          targetCart = {
            id: cartId,
            marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6',
            organizationId: null,
            state: 'ACTIVE',
            lines: [],
            version: 1,
            userId: userKey,
            lastActivityAt: new Date().toISOString()
          };
        }

        targetCart.lines = targetCart.lines || [];
        let existingLine = targetCart.lines.find(l => l.skuId === skuId || l.sku === skuId);

        if (qty <= 0) {
          targetCart.lines = targetCart.lines.filter(l => l.skuId !== skuId && l.sku !== skuId);
        } else if (existingLine) {
          existingLine.quantity = String(qty);
        } else {
          const allProds = loadAllProductsFromDatabase();
          const prod = allProds.find(p => p.sku === skuId || p.skuId === skuId || p.id === skuId);
          const lineId = crypto.randomUUID();
          targetCart.lines.push({
            id: lineId,
            skuId: prod ? (prod.skuId || prod.id) : skuId,
            sku: prod ? prod.sku : skuId,
            name: prod ? prod.name : `Product (${skuId})`,
            quantity: String(qty),
            unitPriceMinorUnits: prod ? (prod.pricing?.priceKobo || Math.round(prod.price * 100)) : 2850000,
            imageUrl: prod ? (prod.imageUrl || prod.image) : '/assets/hero-accessories.jpg',
            categoryName: prod ? (prod.categoryName || prod.category) : 'General'
          });
        }

        targetCart.version = (targetCart.version || 0) + 1;
        targetCart.lastActivityAt = new Date().toISOString();

        const jsonStr = JSON.stringify(targetCart).replace(/'/g, "''");
        queryPg(`
          INSERT INTO experience.admin_cms_store (key, data, updated_at)
          VALUES ('${targetKey}', '${jsonStr}'::jsonb, now())
          ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
        `);

        console.log(`[CMS Bridge] Updated cart ${targetCart.id} line ${skuId} (qty: ${qty}) in PostgreSQL`);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'ETag': `"${targetCart.version}"`,
          'Cache-Control': 'no-store'
        });
        res.end(JSON.stringify(targetCart));
      } catch (err) {
        console.error('[CMS Bridge] Update cart line error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Remove line item: DELETE /api/v1/carts/:id/lines/:skuId
  if (url.pathname.startsWith('/api/v1/carts/') && url.pathname.includes('/lines/') && req.method === 'DELETE') {
    const parts = url.pathname.replace('/api/v1/carts/', '').split('/lines/');
    const cartId = parts[0];
    const skuId = parts[1]?.split('/')[0];
    try {
      const rows = queryPgJson(`SELECT key, data::text AS data_text FROM experience.admin_cms_store WHERE key LIKE 'cart_%';`);
      let targetCart = null;
      let targetKey = null;

      for (const r of rows) {
        try {
          const c = JSON.parse(r.data_text);
          if (c.id === cartId) {
            targetCart = c;
            targetKey = r.key;
            break;
          }
        } catch {}
      }

      if (targetCart) {
        targetCart.lines = (targetCart.lines || []).filter(l => l.skuId !== skuId && l.sku !== skuId);
        targetCart.version = (targetCart.version || 0) + 1;
        targetCart.lastActivityAt = new Date().toISOString();

        const jsonStr = JSON.stringify(targetCart).replace(/'/g, "''");
        queryPg(`
          UPDATE experience.admin_cms_store 
          SET data = '${jsonStr}'::jsonb, updated_at = now()
          WHERE key = '${targetKey}';
        `);
        console.log(`[CMS Bridge] Removed line ${skuId} from cart ${cartId} in PostgreSQL`);
      }

      res.writeHead(204, {
        'Cache-Control': 'no-store',
        'ETag': `"${targetCart?.version || 1}"`
      });
      res.end();
    } catch (err) {
      console.error('[CMS Bridge] Delete cart line error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Clear cart: DELETE /api/v1/carts/:id
  if (url.pathname.startsWith('/api/v1/carts/') && req.method === 'DELETE') {
    const cartId = url.pathname.replace('/api/v1/carts/', '').split('/')[0];
    try {
      const rows = queryPgJson(`SELECT key, data::text AS data_text FROM experience.admin_cms_store WHERE key LIKE 'cart_%';`);
      for (const r of rows) {
        try {
          const c = JSON.parse(r.data_text);
          if (c.id === cartId) {
            c.lines = [];
            c.version = (c.version || 0) + 1;
            c.lastActivityAt = new Date().toISOString();
            const jsonStr = JSON.stringify(c).replace(/'/g, "''");
            queryPg(`
              UPDATE experience.admin_cms_store 
              SET data = '${jsonStr}'::jsonb, updated_at = now()
              WHERE key = '${r.key}';
            `);
            console.log(`[CMS Bridge] Cleared cart ${cartId} in PostgreSQL`);
            break;
          }
        } catch {}
      }
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      res.end();
    } catch (err) {
      console.error('[CMS Bridge] Clear cart error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // ─── ORDERS & CHECKOUT ─────────────────────────────────────────────────────

  // GET Staff Orders list (Admin view: all orders across all customers): GET /api/v1/staff/orders
  if (url.pathname === '/api/v1/staff/orders' && req.method === 'GET') {
    try {
      const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
      let orders = [];
      if (rows.length > 0 && rows[0].data_text) {
        orders = JSON.parse(rows[0].data_text);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        items: orders,
        content: orders,
        totalElements: orders.length,
        page: 0,
        size: orders.length,
        totalPages: 1
      }));
    } catch (err) {
      console.error('[CMS Bridge] GET staff orders error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET Customer Orders list (Customer view: filtered strictly to caller's account): GET /api/v1/orders
  if (url.pathname === '/api/v1/orders' && req.method === 'GET') {
    try {
      const userEmail = (req.headers['x-user-email'] || url.searchParams.get('customerEmail') || '').toLowerCase().trim();
      const userId = (req.headers['x-user-id'] || url.searchParams.get('userId') || '').trim();

      const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
      let orders = [];
      if (rows.length > 0 && rows[0].data_text) {
        orders = JSON.parse(rows[0].data_text);
      }

      // If user identity is provided, filter strictly to that user's orders.
      // If neither email nor userId is provided, return empty list (prevents leaking store orders).
      let customerOrders = [];
      if (userEmail || userId) {
        customerOrders = orders.filter(o => {
          const oEmail = (o.customerEmail || o.customer?.email || o.buyerContact?.email || '').toLowerCase().trim();
          const oUserId = (o.userId || o.customer?.id || '').trim();
          const emailMatch = userEmail && oEmail && oEmail === userEmail;
          const userMatch = userId && oUserId && oUserId === userId;
          return Boolean(emailMatch || userMatch);
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        items: customerOrders,
        content: customerOrders,
        totalElements: customerOrders.length,
        page: 0,
        size: customerOrders.length,
        totalPages: 1
      }));
    } catch (err) {
      console.error('[CMS Bridge] GET customer orders error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET Single Order Detail: GET /api/v1/orders/:id
  if (url.pathname.startsWith('/api/v1/orders/') && !url.pathname.includes('/cancellation') && !url.pathname.includes('/cancel') && !url.pathname.includes('/tracking') && req.method === 'GET') {
    const idOrNum = url.pathname.replace('/api/v1/orders/', '').split('/')[0];
    try {
      const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
      let orders = [];
      if (rows.length > 0 && rows[0].data_text) {
        orders = JSON.parse(rows[0].data_text);
      }
      const match = orders.find(o => 
        (o.id && o.id.toLowerCase() === idOrNum.toLowerCase()) ||
        (o.orderId && o.orderId.toLowerCase() === idOrNum.toLowerCase()) ||
        (o.orderNumber && o.orderNumber.toLowerCase() === idOrNum.toLowerCase()) ||
        (o.number && o.number.toLowerCase() === idOrNum.toLowerCase())
      );
      if (match) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(match));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
    } catch (err) {
      console.error('[CMS Bridge] GET single order error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET Order Tracking: GET /api/v1/orders/:id/tracking
  if (url.pathname.startsWith('/api/v1/orders/') && url.pathname.includes('/tracking') && req.method === 'GET') {
    const idOrNum = url.pathname.replace('/api/v1/orders/', '').replace('/tracking', '').split('/')[0];
    try {
      const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
      let orders = [];
      if (rows.length > 0 && rows[0].data_text) {
        orders = JSON.parse(rows[0].data_text);
      }
      const match = orders.find(o => 
        (o.id && o.id.toLowerCase() === idOrNum.toLowerCase()) ||
        (o.orderId && o.orderId.toLowerCase() === idOrNum.toLowerCase()) ||
        (o.orderNumber && o.orderNumber.toLowerCase() === idOrNum.toLowerCase()) ||
        (o.number && o.number.toLowerCase() === idOrNum.toLowerCase())
      );
      if (match) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          orderId: match.id,
          trackingNumber: match.trackingNumber || `TRK-${match.orderNumber?.replace(/[^0-9]/g, '') || '9921'}`,
          carrier: 'Nigson Logistics Express',
          status: match.status,
          estimatedDelivery: match.estimatedDeliveryDate,
          scans: (match.timeline || []).map(t => ({
            timestamp: t.date,
            status: t.label,
            location: 'Lagos Distribution Center',
            description: t.label
          }))
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Tracking not found' }));
      }
    } catch (err) {
      console.error('[CMS Bridge] GET tracking error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Cancel Order: POST /api/v1/orders/:id/cancellation or POST /api/v1/orders/:id/cancel
  if (url.pathname.startsWith('/api/v1/orders/') && (url.pathname.endsWith('/cancellation') || url.pathname.endsWith('/cancel')) && req.method === 'POST') {
    const id = url.pathname.replace('/api/v1/orders/', '').replace(/\/cancellation|\/cancel/, '').split('/')[0];
    try {
      const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
      let orders = [];
      if (rows.length > 0 && rows[0].data_text) {
        orders = JSON.parse(rows[0].data_text);
      }
      let targetOrder = null;
      for (const o of orders) {
        if (o.id === id || o.orderId === id || o.number === id || o.orderNumber === id) {
          o.status = 'Cancelled';
          o.timeline = o.timeline || [];
          o.timeline.push({ label: 'Order Cancelled by Customer', date: new Date().toISOString() });
          targetOrder = o;
          break;
        }
      }
      if (targetOrder) {
        const jsonStr = JSON.stringify(orders).replace(/'/g, "''");
        queryPg(`
          UPDATE experience.admin_cms_store 
          SET data = '${jsonStr}'::jsonb, updated_at = now()
          WHERE key = 'orders';
        `);
        console.log(`[CMS Bridge] Order ${id} cancelled successfully.`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(targetOrder));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Order not found' }));
      }
    } catch (err) {
      console.error('[CMS Bridge] Cancel order error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Create Order / Checkout: POST /api/v1/orders or POST /api/v1/checkout/orders or POST /api/v1/checkout/attempts
  if ((url.pathname === '/api/v1/orders' || url.pathname === '/api/v1/checkout/orders' || url.pathname === '/api/v1/checkout/attempts') && req.method === 'POST') {
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const orderId = crypto.randomUUID();
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const orderNum = payload.orderNumber || `ORD-2026-${randNum}`;
        const now = new Date().toISOString();

        const custName = payload.customer?.name || payload.customerName || payload.fullName || 'Customer';
        const custEmail = payload.customer?.email || payload.customerEmail || payload.email || req.headers['x-user-email'] || 'customer@synthetic.test';
        const userId = payload.userId || payload.customer?.id || req.headers['x-user-id'] || '';
        const custPhone = payload.customer?.phone || payload.customerPhone || payload.phone || '+234 800 000 0000';
        const custAddress = payload.customer?.address || `${payload.shippingAddress?.line1 || ''}, ${payload.shippingAddress?.city || 'Lagos'}, ${payload.shippingAddress?.state || 'Lagos'}`;

        const items = (payload.items || []).map((it, idx) => ({
          lineId: it.lineId || `line-${randNum}-${idx + 1}`,
          sku: it.sku || it.skuCode || 'NG-SKU',
          skuId: it.skuId || ensureValidUuid(it.id),
          name: it.name || it.title || 'Product Item',
          title: it.name || it.title || 'Product Item',
          quantity: Number(it.quantity || it.qty || 1),
          qty: Number(it.quantity || it.qty || 1),
          price: Number(it.price || (it.unitPriceMinorUnits ? it.unitPriceMinorUnits / 100 : 0)),
          unitPriceMinorUnits: Number(it.unitPriceMinorUnits || (it.price ? Math.round(it.price * 100) : 0)),
          imageUrl: it.imageUrl || it.image || '/assets/hero-accessories.jpg'
        }));

        const subtotalMinor = payload.subtotalMinorUnits ?? Math.round((payload.subtotal || items.reduce((s, i) => s + (i.price * i.qty), 0)) * 100);
        const shippingMinor = payload.shippingMinorUnits ?? (items.length > 0 ? 350000 : 0);
        const taxMinor = payload.taxMinorUnits ?? Math.round(subtotalMinor * 0.075);
        const totalMinor = payload.totalMinorUnits ?? (subtotalMinor + shippingMinor + taxMinor);
        const totalNaira = totalMinor / 100;

        const newOrder = {
          id: orderId,
          orderId: orderId,
          orderNumber: orderNum,
          number: orderNum,
          userId: userId,
          createdAt: now,
          placedAt: now,
          date: now,
          customer: {
            id: userId,
            name: custName,
            email: custEmail,
            phone: custPhone,
            address: custAddress
          },
          customerName: custName,
          customerEmail: custEmail,
          customerPhone: custPhone,
          shippingAddress: {
            line1: payload.shippingAddress?.line1 || custAddress,
            city: payload.shippingAddress?.city || 'Lagos',
            state: payload.shippingAddress?.state || 'Lagos',
            countryCode: payload.shippingAddress?.countryCode || 'NG',
            postalCode: payload.shippingAddress?.postalCode || '100001'
          },
          deliveryAddress: {
            line1: payload.shippingAddress?.line1 || custAddress,
            city: payload.shippingAddress?.city || 'Lagos',
            state: payload.shippingAddress?.state || 'Lagos',
            countryCode: payload.shippingAddress?.countryCode || 'NG',
            postalCode: payload.shippingAddress?.postalCode || '100001'
          },
          buyerContact: {
            fullName: custName,
            email: custEmail,
            phone: custPhone
          },
          paymentMethod: payload.paymentMethod || 'Credit Card',
          items: items,
          lines: items.map(i => ({
            lineId: i.lineId,
            sku: i.sku,
            skuId: i.skuId,
            name: i.name,
            quantity: i.quantity,
            unitAmount: (i.unitPriceMinorUnits / 100).toFixed(2),
            imageUrl: i.imageUrl
          })),
          subtotal: subtotalMinor / 100,
          subtotalMinorUnits: subtotalMinor,
          shipping: shippingMinor / 100,
          shippingMinorUnits: shippingMinor,
          tax: taxMinor / 100,
          taxMinorUnits: taxMinor,
          total: totalNaira,
          totalMinorUnits: totalMinor,
          totalKobo: totalMinor,
          totals: {
            subtotal: (subtotalMinor / 100).toFixed(2),
            delivery: (shippingMinor / 100).toFixed(2),
            tax: (taxMinor / 100).toFixed(2),
            grandTotal: totalNaira.toFixed(2)
          },
          currency: 'NGN',
          paymentStatus: 'Paid',
          status: 'Processing',
          delivery: payload.delivery || 'Standard Delivery',
          shippingMethod: payload.shippingMethod || 'Standard Delivery',
          deliveryMethod: 'Standard Delivery',
          estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          timeline: [
            { label: 'Order Placed', date: now },
            { label: 'Payment Confirmed', date: now }
          ]
        };

        // Prepend to orders in experience.admin_cms_store
        const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
        let currentOrders = [];
        if (rows.length > 0 && rows[0].data_text) {
          try { currentOrders = JSON.parse(rows[0].data_text); } catch {}
        }
        currentOrders.unshift(newOrder);

        const jsonStr = JSON.stringify(currentOrders).replace(/'/g, "''");
        queryPg(`
          INSERT INTO experience.admin_cms_store (key, data, updated_at)
          VALUES ('orders', '${jsonStr}'::jsonb, now())
          ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
        `);

        console.log(`[CMS Bridge] Successfully created order ${orderNum} (${orderId}) for ${custName}`);

        // Clear active cart for this user in PostgreSQL
        try {
          const userKey = payload.userId || custEmail || custName;
          const storeKey = `cart_${userKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
          const emptyCart = {
            id: crypto.randomUUID(),
            marketId: '29b78d62-ec0d-5ff9-8319-b485ecb093d6',
            organizationId: null,
            state: 'ACTIVE',
            lines: [],
            version: 1,
            userId: userKey,
            lastActivityAt: now
          };
          queryPg(`
            INSERT INTO experience.admin_cms_store (key, data, updated_at)
            VALUES ('${storeKey}', '${JSON.stringify(emptyCart).replace(/'/g, "''")}'::jsonb, now())
            ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = now();
          `);
        } catch (clearErr) {
          console.warn('[CMS Bridge] Notice clearing cart after order:', clearErr.message);
        }

        const responseBody = {
          ...newOrder,
          order: newOrder,
          payment: {
            state: 'CAPTURED',
            status: 'PAID'
          }
        };

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseBody));
      } catch (err) {
        console.error('[CMS Bridge] Create order error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Update Staff Order Status: POST /api/v1/staff/orders/:id/processing or PATCH /api/v1/staff/orders/:id
  if (url.pathname.startsWith('/api/v1/staff/orders/') && (url.pathname.endsWith('/processing') || req.method === 'PATCH' || req.method === 'POST')) {
    const id = url.pathname.replace('/api/v1/staff/orders/', '').replace('/processing', '').split('/')[0];
    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(bodyData || '{}');
        const rows = queryPgJson(`SELECT data::text AS data_text FROM experience.admin_cms_store WHERE key = 'orders';`);
        let orders = [];
        if (rows.length > 0 && rows[0].data_text) {
          orders = JSON.parse(rows[0].data_text);
        }
        let updatedOrder = null;
        for (const o of orders) {
          if (o.id === id || o.orderId === id || o.number === id || o.orderNumber === id) {
            if (payload.status) {
              o.status = payload.status;
            } else if (payload.reason && payload.reason.includes('updated to ')) {
              const matched = payload.reason.match(/updated to ([a-zA-Z]+)/i);
              if (matched) o.status = matched[1];
            } else if (!o.status || o.status === 'Pending') {
              o.status = 'Processing';
            }
            if (payload.paymentStatus) o.paymentStatus = payload.paymentStatus;
            o.timeline = o.timeline || [];
            o.timeline.push({ label: `Status updated to ${o.status}`, date: new Date().toISOString() });
            updatedOrder = o;
            break;
          }
        }
        if (updatedOrder) {
          const jsonStr = JSON.stringify(orders).replace(/'/g, "''");
          queryPg(`
            UPDATE experience.admin_cms_store 
            SET data = '${jsonStr}'::jsonb, updated_at = now()
            WHERE key = 'orders';
          `);
          console.log(`[CMS Bridge] Updated order ${id} status to ${updatedOrder.status}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updatedOrder));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Order not found' }));
        }
      } catch (err) {
        console.error('[CMS Bridge] Update order status error:', err);
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
