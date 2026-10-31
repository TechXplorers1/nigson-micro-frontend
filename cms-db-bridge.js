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

      -- Remove stale mock products from admin_cms_store
      DELETE FROM experience.admin_cms_store WHERE key = 'products';
    `);
  } catch (e) {
    console.warn('[CMS Bridge] Note on commerce schema seed:', e.message);
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
