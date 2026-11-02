import type { AdminProduct } from './admin.service';

/** Join stock to the catalogue's actual SKU identifiers, summing warehouse balances. */
export function applyInventory(products: AdminProduct[], balances: any[]): AdminProduct[] {
  return products.map(product => {
    const rows = balances.filter(balance => balance.skuId === product.skuId);
    return {
      ...product,
      stock: rows.reduce((total, row) => total + Number(row.onHand || 0), 0),
      reserved: rows.reduce((total, row) => total + Number(row.reserved || 0), 0)
    };
  });
}

export function mapStaffProducts(products: any[], balances: any[]): AdminProduct[] {
  return applyInventory(products.map(product => {
    const sku = product.skus?.[0];
    const images = (product.assets ?? []).map((asset: any) => asset.url).filter(Boolean);
    return {
      id: product.id,
      skuId: sku?.id,
      sku: sku?.code ?? '',
      name: product.name,
      category: product.categories?.map((category: any) => category.name).join(', ') || 'Uncategorised',
      brand: product.brand?.name ?? '',
      price: 0,
      retail: 0,
      desc: product.description ?? '',
      image: images[0] ?? '',
      images,
      status: product.status,
      stock: 0,
      reserved: 0,
      rating: 0,
      lowLevel: 10,
      specifications: product.specifications
    };
  }), balances);
}
