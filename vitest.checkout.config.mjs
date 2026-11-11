import base from './vitest.distributor.config.mjs';
export default { ...base, test: { ...base.test, include: ['projects/shop/src/app/checkout/checkout.component.spec.ts'] } };
