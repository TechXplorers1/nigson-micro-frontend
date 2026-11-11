const direct = target => ({
  target,
  secure: false,
  changeOrigin: true,
  logLevel: 'silent',
  onError: (_error, req, res) => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/problem+json' });
      res.end(JSON.stringify({ type: 'urn:nigson:problem:provider-unavailable', title: 'Backend unavailable', status: 503,
        detail: 'The local backend could not be reached. Start Commerce and Experience with make run-core.',
        instance: req.url?.split('?')[0], code: 'PROVIDER_UNAVAILABLE' }));
    }
  }
});
const commerce = direct('http://localhost:8081');
const experience = direct('http://localhost:8082');
module.exports = {
  '/bff': commerce,
  '/api/v1/staff': commerce,
  '/api/v1/reviews': { ...experience, router: req => req.method === 'POST' ? 'http://localhost:8081' : 'http://localhost:8082' },
  '/api/v1/content': experience,
  '/api/v1/enquiries': experience,
  '/api/v1/newsletter-subscriptions': experience,
  '/api/v1/unsubscribe': experience,
  '/api/v1/career-opportunities': experience,
  '/api/v1/career-upload-sessions': experience,
  '/api/v1/channels': experience,
  '/api/v1/campaigns': experience,
  '/api/v1/seo': experience,
  '/api/v1': commerce,
  '/storage': { ...direct('http://localhost:4566'), pathRewrite: { '^/storage': '' } }
};
