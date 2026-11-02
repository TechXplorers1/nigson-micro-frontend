const commerce = 'http://localhost:8081';
const experience = 'http://localhost:8082';
const ai = 'http://localhost:8084';

// Angular's development proxy sends browser requests to the Java services.
// Commerce-owned browser APIs and /bff go to Commerce; public Experience/AI
// APIs go to their owners. The private Experience paths below are addressable
// for local diagnostics, but remain unusable from the browser until Commerce
// adds explicit signed-actor relay routes.
const direct = target => ({ target, secure: false, changeOrigin: true, logLevel: 'warn' });
const reviewProxy = {
  ...direct(experience),
  router: req => req.method === 'POST' ? commerce : experience
};

module.exports = {
  '/bff': direct(commerce),
  '/api/v1/ai': direct(ai),
  '/api/v1/catalogue': direct(commerce),
  '/api/v1/carts': direct(commerce),
  '/api/v1/checkout': direct(commerce),
  '/api/v1/orders': direct(commerce),
  '/api/v1/quotes': direct(commerce),
  '/api/v1/me/distributor-applications': direct(experience),
  '/api/v1/me': direct(commerce),
  '/api/v1/markets': direct(commerce),
  '/api/v1/staff/leads': direct(experience),
  '/api/v1/staff/distributor-applications': direct(experience),
  '/api/v1/staff/career-applications': direct(experience),
  '/api/v1/staff/career-opportunities': direct(experience),
  '/api/v1/staff/reports/engagement': direct(experience),
  '/api/v1/experience': direct(experience),
  '/api/v1/distributor-applications': direct(experience),
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
  '/api/v1/quote-requests': direct(experience),
  '/storage': {
    ...direct('http://localhost:4566'),
    pathRewrite: { '^/storage': '' }
  }
};
