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
    const skuCode = sku?.code ?? '';
    const specs = product.specifications || {};
    const specPrice = specs['starting_price'] ? Number(specs['starting_price']) : 0;
    const initialPrice = (!isNaN(specPrice) && specPrice > 0) ? specPrice : 0;
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
      category: product.categories?.map((category: any) => category.name).join(', ') || 'Uncategorised',
      brand: product.brand?.name ?? '',
      price: initialPrice,
      retail: initialPrice,
      wholesale: specs['wholesale_rate'] ? Number(specs['wholesale_rate']) : (initialPrice > 0 ? Math.round(initialPrice * 0.85) : undefined),
      distributor: specs['distributor_rate'] ? Number(specs['distributor_rate']) : (initialPrice > 0 ? Math.round(initialPrice * 0.70) : undefined),
      priceSubtitle: specs['price_subtitle'] || undefined,
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