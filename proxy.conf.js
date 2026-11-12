const unavailable = target => (_error, req, res) => {
  if (res.headersSent || res.writableEnded) return;
  const service = target.endsWith(':8082') ? 'Experience' : target.endsWith(':8081') ? 'Commerce' : 'Storage';
  res.writeHead(503, {'Content-Type':'application/problem+json','Cache-Control':'no-store'});
  res.end(JSON.stringify({type:'urn:nigson:problem:backend-unavailable',title:'Backend unavailable',status:503,
    detail:`${service} is unreachable at ${target}. Check its container status and startup configuration.`,
    instance:req.url?.split('?')[0],code:'BACKEND_UNAVAILABLE'}));
};
const direct = target => ({
  target, secure:false, changeOrigin:true, logLevel:'silent',
  onError:unavailable(target),
  configure:proxy => proxy.on('error',unavailable(target))
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
