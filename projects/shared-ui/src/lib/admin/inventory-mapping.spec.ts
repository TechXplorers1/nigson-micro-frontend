import { describe, it, expect } from 'vitest';
import { mapStaffProducts, applyInventory } from './inventory-mapping';

const product = {
  id: 'product-1', name: 'Demo Laptop', status: 'DRAFT',
  brand: { id: 'brand-1', name: 'Demo Electronics' },
  categories: [{ id: 'cat-1', name: 'Laptops' }],
  skus: [{ id: 'sku-1', code: 'DEMO-EL-01-01' }], assets: []
};

describe('Staff inventory mapping', () => {
  it('uses staff category and SKU IDs rather than inferring them from the slug', () => {
    const [row] = mapStaffProducts([product], [{ skuId: 'sku-1', onHand: '18', reserved: '2' }]);
    expect(row).toMatchObject({ id: 'product-1', skuId: 'sku-1', sku: 'DEMO-EL-01-01', category: 'Laptops', stock: 18, reserved: 2, status: 'DRAFT' });
  });
  it('preserves zero stock and never invents a default quantity', () => {
    expect(mapStaffProducts([product], [{ skuId: 'sku-1', onHand: '0', reserved: '0' }])[0].stock).toBe(0);
    expect(mapStaffProducts([product], [])[0].stock).toBe(0);
  });
  it('sums multiple warehouses and ignores unrelated SKU balances', () => {
    const rows = [{ skuId: 'sku-1', onHand: '5', reserved: '1' }, { skuId: 'sku-1', onHand: '7', reserved: '2' }, { skuId: 'other-sku', onHand: '1000' }];
    expect(mapStaffProducts([product], rows)[0]).toMatchObject({ stock: 12, reserved: 3 });
  });
  it('clears old stock after the authoritative balances become empty', () => {
    const products = mapStaffProducts([product], [{ skuId: 'sku-1', onHand: '18' }]);
    expect(applyInventory(products, [])[0].stock).toBe(0);
  });
  it('does not fabricate a retail price or product rating', () => {
    expect(mapStaffProducts([product], [])[0]).toMatchObject({ price: 0, rating: 0 });
  });
});
