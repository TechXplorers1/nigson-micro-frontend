/**
 * Nigson CMS Database Bridge Server
 * Provides direct, robust persistence to PostgreSQL for Content Management pages,
 * blog posts, and reviews.
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

function savePageToDatabase(pageId, title, sections) {
  const mapping = PAGE_MAPPING[pageId] || { type: pageId.toUpperCase(), slug: pageId.toLowerCase(), title: title || pageId };
  const type = mapping.type;
  const slug = mapping.slug;
  const pageTitle = title || mapping.title;

  // 1. Get or create content_item
  let itemId = queryPg(`SELECT id FROM experience.content_item WHERE content_type = '${type}' AND slug = '${slug}' LIMIT 1;`);
  if (!itemId) {
    itemId = crypto.randomUUID();
    queryPg(`
      INSERT INTO experience.content_item (id, created_by, updated_by, content_type, slug, locale, status)
      VALUES ('${itemId}', 'admin', 'admin', '${type}', '${slug}', 'en', 'ACTIVE');
    `);
  }

  // 2. Prepare revision blocks
  const blocks = (sections || []).map(s => ({
    type: 'TEXT',
    text: JSON.stringify({
      id: s.id,
      visible: s.visible !== false,
      fields: s.fields || {},
      cards: s.cards || []
    })
  }));

  const body = JSON.stringify({
    schemaVersion: 1,
    blocks: blocks
  });

  const metadata = JSON.stringify({
    title: pageTitle,
    description: 'Official page for ' + pageTitle,
    robots: 'INDEX',
    alternates: [],
    structuredData: {}
  });

  const hash = crypto.createHash('sha256').update(body + metadata).digest('hex');
  const revId = crypto.randomUUID();

  // 3. Determine next revision number
  const lastRevStr = queryPg(`SELECT COALESCE(max(revision), 0) FROM experience.content_revision WHERE content_item_id = '${itemId}';`);
  const nextRev = (parseInt(lastRevStr, 10) || 0) + 1;

  // 4. Insert revision and update current published revision in PostgreSQL
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

  // Also check admin_cms_store for any pages with custom sections
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-Match, Idempotency-Key');

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

  // Generic key-value store for other CMS items (blog posts, reviews)
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
