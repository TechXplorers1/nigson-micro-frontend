import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService, CatalogService } from 'shared-ui';
import { LucideHeart, LucideTrash2, LucideShoppingCart, LucidePackageOpen } from '@lucide/angular';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideHeart, LucideTrash2, LucideShoppingCart, LucidePackageOpen],
  template: `
    <div class="space-y-6">
      <div class="rounded-2xl border border-hairline bg-white p-6 md:p-8">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-widest text-brand">Saved</p>
            <h2 class="text-2xl font-extrabold">My Wishlist</h2>
          </div>
          <span class="rounded-full bg-surface-alt px-3 py-1 text-xs font-bold text-muted-ink">
            {{ shop.saved().length }} item{{ shop.saved().length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="shop.saved().length === 0" class="rounded-2xl border border-hairline bg-white p-16 text-center">
        <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface-alt">
          <svg lucidePackageOpen class="h-8 w-8 text-muted-ink"></svg>
        </div>
        <p class="mt-4 text-lg font-bold text-ink">Your wishlist is empty</p>
        <p class="mt-2 text-sm text-muted-ink">Products you save will appear here for quick access.</p>
        <a routerLink="/products" class="mt-6 inline-flex items-center gap-2 rounded-full bg-brand text-white px-6 py-3 text-sm font-semibold hover:bg-brand-deep transition-colors">
          Browse Products
        </a>
      </div>

      <!-- Wishlist grid -->
      <div *ngIf="shop.saved().length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let item of shop.saved()" class="rounded-2xl border border-hairline bg-white p-5 flex flex-col gap-4">
          <a [routerLink]="['/products', item.sku]" class="block">
            <div class="aspect-square w-full rounded-xl bg-surface-alt overflow-hidden">
              <img *ngIf="item.image" [src]="item.image" [alt]="item.name" class="h-full w-full object-cover" />
            </div>
          </a>
          <div class="flex-1">
            <a [routerLink]="['/products', item.sku]" class="hover:text-brand transition-colors">
              <p class="font-bold text-ink line-clamp-2">{{ item.name }}</p>
            </a>
            <p class="mt-1 text-xs text-muted-ink">{{ item.category }}</p>
            <p class="mt-2 text-lg font-extrabold text-[#D62828]">{{ catalog.formatPrice(item.price) }}</p>
          </div>
          <div class="flex gap-2">
            <button
              (click)="addToCart(item)"
              class="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand text-white px-4 py-2.5 text-xs font-semibold hover:bg-brand-deep transition-colors"
            >
              <svg lucideShoppingCart class="h-3.5 w-3.5"></svg> Add to Cart
            </button>
            <button
              (click)="remove(item.sku)"
              class="inline-flex items-center justify-center rounded-full border border-hairline px-3 py-2.5 text-xs font-semibold text-muted-ink hover:border-brand hover:text-brand transition-colors"
            >
              <svg lucideTrash2 class="h-3.5 w-3.5"></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class WishlistComponent {
  shop = inject(ShopService);
  catalog = inject(CatalogService);

  addToCart(item: any) {
    this.shop.addToCart({
      sku: item.sku,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      qty: 1
    });
    // Remove from saved after adding to cart
    this.shop.toggleSaved({ sku: item.sku, name: item.name, category: item.category, price: item.price, image: item.image });
  }

  remove(sku: string) {
    const item = this.shop.saved().find(s => s.sku === sku);
    if (item) this.shop.toggleSaved({ sku: item.sku, name: item.name, category: item.category, price: item.price, image: item.image });
  }
}
