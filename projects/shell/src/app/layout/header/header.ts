import { Component, HostListener, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideMenu, LucideX, LucideChevronDown, LucideShoppingCart, LucideUser, LucidePackage, LucideLogOut, LucideHandshake, LucideTruck } from '@lucide/angular';
import { ShopService } from 'shared-ui';
import { NavSearchComponent } from './nav-search.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideMenu, LucideX, LucideChevronDown, LucideShoppingCart, LucideUser, LucidePackage, LucideLogOut, LucideHandshake, LucideTruck, NavSearchComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  open = signal(false);
  megaOpen = signal(false);
  profileOpen = signal(false);
  showSecondRow = signal(true);

  productMenu = [
    { label: 'Earbuds', to: '/products' },
    { label: 'Power Banks', to: '/products' },
    { label: 'Chargers', to: '/products' },
    { label: 'Cables', to: '/products' },
    { label: 'Smart Watches', to: '/products' },
    { label: 'Power Solutions', to: '/products' },
    { label: 'Universal Adapters', to: '/products' },
    { label: 'FMCG Products', to: '/products' },
  ];

  private lastScrollY = 0;

  constructor(public shop: ShopService, private router: Router) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const currentScrollY = window.scrollY;
    if (currentScrollY < 50) {
      this.showSecondRow.set(true);
    } else if (currentScrollY > this.lastScrollY + 5) {
      this.showSecondRow.set(false);
    } else if (currentScrollY < this.lastScrollY - 5) {
      this.showSecondRow.set(true);
    }
    this.lastScrollY = currentScrollY;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.profileOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown-container')) {
        this.profileOpen.set(false);
      }
    }
  }

  toggleOpen() {
    this.open.update(v => !v);
  }

  toggleProfileOpen() {
    this.profileOpen.update(v => !v);
  }

  handleLogout() {
    this.shop.signOut();
    this.profileOpen.set(false);
    this.router.navigate(['/']);
  }

  isProductsRoute(): boolean {
    return this.router.url.startsWith('/products');
  }
}
