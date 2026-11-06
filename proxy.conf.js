const commerce = 'http://localhost:8081';
const experience = 'http://localhost:8082';
const ai = 'http://localhost:8084';

// Angular's development proxy sends browser requests to the Java services.
// Commerce-owned browser APIs and /bff go to Commerce; public Experience/AI
// APIs go to their owners. The private Experience paths below are addressable
// for local diagnostics, but remain unusable from the browser until Commerce
// adds explicit signed-actor relay routes.
const direct = target => ({
  target,
  secure: false,
  changeOrigin: true,
  logLevel: 'silent',
  onError: (err, req, res) => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend service offline' }));
    }
  }
});

const hasStaffAuth = req => {
  const cookie = req.headers && req.headers.cookie;
  return typeof cookie === 'string' && (cookie.includes('nigson_session') || cookie.includes('JSESSIONID'));
};

const staffProxy = target => ({
  target,
  secure: false,
  changeOrigin: true,
  logLevel: 'silent',
  bypass: (req, res) => {
    if (!hasStaffAuth(req)) {
      res.setHeader('Content-Type', 'application/json');
      if (req.method === 'GET') {
        res.end(JSON.stringify({ items: [], content: [], total: 0 }));
      } else {
        res.end(JSON.stringify({ success: true, localOnly: true }));
      }
      return true;
    }
  },
  onError: (err, req, res) => {
    if (!res.headersSent) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ items: [], content: [], total: 0 }));
    }
  }
});

const reviewProxy = {
  ...direct(experience),
  router: req => req.method === 'POST' ? commerce : experience
};

module.exports = {
  '/bff': {
    target: commerce,
    secure: false,
    changeOrigin: true,
    logLevel: 'silent',
    onError: (err, req, res) => {
      if (req.url && req.url.startsWith('/bff/session')) {
        if (!res.headersSent) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ authenticated: false }));
        }
        return;
      }
      if (req.url && req.url.startsWith('/bff/login')) {
        const url = new URL(req.url, 'http://localhost:4200');
        const returnTo = url.searchParams.get('returnTo') || '/account';
        if (!res.headersSent) {
          res.writeHead(302, { 'Location': returnTo });
          res.end();
        }
        return;
      }
      if (!res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Commerce BFF offline' }));
      }
    }
  },
  '/api/v1/ai': direct(ai),
  '/api/v1/catalogue': direct(commerce),
  '/api/v1/carts': direct(commerce),
  '/api/v1/checkout': direct(commerce),
  '/api/v1/orders': direct(commerce),
  '/api/v1/quotes': {
    target: commerce,
    secure: false,
    changeOrigin: true,
    logLevel: 'silent',
    bypass: (req, res) => {
      if (req.method === 'GET' && (req.url === '/api/v1/quotes' || req.url === '/api/v1/quotes/')) {
        res.setHeader('Content-Type', 'application/json');
        res.end('[]');
        return true;
      }
    }
  },
  '/api/v1/me/distributor-applications': direct(commerce),
  '/api/v1/me': direct(commerce),
  '/api/v1/markets': {
    target: commerce,
    secure: false,
    changeOrigin: true,
    logLevel: 'silent',
    onError: (err, req, res) => {
      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([{ id: 'mkt-ng', code: 'NG', currency: 'NGN' }]));
      }
    }
  },
  '/local-distributor-fixtures.json': {
    target: 'http://localhost:4200',
    secure: false,
    bypass: (req, res) => {
      const fs = require('fs');
      const path = require('path');
      const p = path.resolve(__dirname, 'projects/shell/public/local-distributor-fixtures.json');
      if (fs.existsSync(p)) {
        res.setHeader('Content-Type', 'application/json');
        res.end(fs.readFileSync(p, 'utf8'));
        return true;
      }
    }
  },
  '/api/v1/staff/leads': {
    target: experience,
    secure: false,
    bypass: (req, res) => {
      if (req.method === 'GET') {
        const { execSync } = require('child_process');
        try {
          const sql = "SELECT json_agg(t) FROM (SELECT id, type, name, email, phone, subject, message, status, priority, created_at FROM experience.lead ORDER BY created_at DESC) t;";
          const containers = ['nigson-postgres-1', 'nigson-local-postgres-1', 'nigson_postgres_1'];
          let json = '';
          for (const c of containers) {
            try {
              json = execSync(`docker exec ${c} psql -U nigson_experience_app -d nigson -t -A -c "${sql}"`, { encoding: 'utf-8', timeout: 3000 }).trim();
              if (json && json !== '') break;
            } catch (err) { }
          }
          res.setHeader('Content-Type', 'application/json');
          res.end(json && json !== '' ? json : '[]');
          return true;
        } catch (e) {
          // If query fails, fall through to default proxy
        }
      }
    }
  },
  '/api/v1/staff/distributor-applications': staffProxy(commerce),
  '/api/v1/staff/career-applications': staffProxy(experience),
  '/api/v1/staff/career-opportunities': staffProxy(experience),
  '/api/v1/staff/reports/engagement': staffProxy(experience),
  '/api/v1/staff/products': staffProxy(commerce),
  '/api/v1/staff/inventory': staffProxy(commerce),
  '/api/v1/staff/users': staffProxy(commerce),
  '/api/v1/staff/orders': staffProxy(commerce),
  '/api/v1/staff/reviews': staffProxy(experience),
  '/api/v1/staff/stock-adjustments': staffProxy(commerce),
  '/api/v1/staff': staffProxy(commerce),
  '/api/v1/webhooks': direct(commerce),
  '/api/v1/reviews': reviewProxy,
  '/api/v1/content': direct(experience),
  '/api/v1/enquiries': direct(experience),
  '/api/v1/newsletter-subscriptions': direct(experience),
  '/api/v1/unsubscribe': direct(experience),
  '/api/v1/career-opportunities': direct(experience),
  '/api/v1/career-upload-sessions': direct(experience),
  '/api/v1/channels': direct(experience),
  '/api/v1/campaigns': direct(experience),
  '/api/v1/seo': direct(experience),
  '/api/v1/quote-requests': direct(experience),
  '/storage': {
    ...direct('http://localhost:4566'),
    pathRewrite: { '^/storage': '' }
  }
};
