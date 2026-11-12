const commerce = 'http://localhost:8081';
const experience = 'http://localhost:8082';
const ai = 'http://localhost:8084';

// Angular's development proxy sends browser requests to the backend microservices.
// Commerce-owned browser APIs, staff gateway APIs, and /bff go to Commerce (8081);
// Public Experience APIs go to Experience (8082); AI APIs go to AI (8084).
// All requests are forwarded directly to real backend services without mock data.
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
  '/api/v1/quotes': direct(commerce),
  '/api/v1/quote-requests': direct(commerce),
  '/api/v1/me/distributor-applications': direct(commerce),
  '/api/v1/me': direct(commerce),
  '/api/v1/markets': direct(commerce),
  '/api/v1/staff': direct(commerce),
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
  '/storage': {
    ...direct('http://localhost:4566'),
    pathRewrite: { '^/storage': '' }
  }
};
