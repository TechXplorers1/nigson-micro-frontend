import type { AdminProduct } from './admin.service';
import { resolveCategoryFromSku } from '../catalog.service';

const SKU_PRICES: Record<string, number> = {
  'NG-EB-01': 25000,
  'NG-PB-01': 35000,
  'NG-CH-01': 18500,
  'NG-CB-01': 5500,
  'NG-CC-01': 15000,
  'NG-SP-01': 19500,
  'NG-GAN-100': 28000,
  'PQ28': 24000
};

/** Join stock to the catalogue's actual SKU identifiers, summing warehouse balances. */
export function applyInventory(products: AdminProduct[], balances: any[]): AdminProduct[] {
  if (!balances || balances.length === 0) return products;
  return products.map(product => {
    const rows = balances.filter(balance => balance.skuId === product.skuId || balance.sku === product.sku);
    const stockOnHand = rows.reduce((total, row) => total + Number(row.onHand || 0), 0);
    const stockReserved = rows.reduce((total, row) => total + Number(row.reserved || 0), 0);
    return {
      ...product,
      stock: rows.length > 0 ? stockOnHand : (product.stock || 150),
      reserved: rows.length > 0 ? stockReserved : (product.reserved || 0)
    };
  });
}

export function mapStaffProducts(products: any[], balances: any[]): AdminProduct[] {
  return applyInventory(products.map(product => {
    const sku = product.skus?.[0];
    const skuCode = sku?.code ?? '';
    const images = (product.assets ?? []).map((asset: any) => asset.url).filter(Boolean);
    const skuCode = sku?.code ?? '';
    const initialPrice = 0;
    return {
      id: product.id,
      version: product.version,
      slug: product.slug,
      brandId: product.brand?.id,
      categoryIds: product.categories?.map((category: any) => category.id) || [],
      packSize: sku?.packSize,
      skuId: sku?.id,
      sku: skuCode,
      name: product.name,
      category,
      brand: product.brand?.name ?? 'Nigson',
      price,
      retail: price,
      desc: product.description ?? '',
      image: images[0] ?? '',
      images,
      status: product.status,
      stock: 150,
      reserved: 0,
      rating: 0,
      lowLevel: 10,
      specifications: product.specifications
    };
  }), balances);
}