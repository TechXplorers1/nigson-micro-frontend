import { Component, HostListener, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { LucideMenu, LucideX, LucideChevronDown, LucideChevronRight, LucideShoppingCart, LucideShoppingBag, LucideUser, LucideUserRound, LucidePackage, LucideLogOut, LucideHandshake, LucideTruck, LucideSearch } from '@lucide/angular';
import { ShopService } from 'shared-ui';
import { NavSearchComponent } from './nav-search.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LucideMenu, LucideX, LucideChevronDown, LucideChevronRight, LucideShoppingCart, LucideShoppingBag, LucideUser, LucideUserRound, LucidePackage, LucideLogOut, LucideHandshake, LucideTruck, LucideSearch, NavSearchComponent],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class HeaderComponent {
  open = signal(false);
  megaOpen = signal(false);
  profileOpen = signal(false);
  searchOpen = signal(false);
  scrolled = signal(false);

  constructor(public shop: ShopService, private router: Router) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled.set(window.scrollY > 20);
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

  handleSearch(term: string) {
    const query = term.trim();
    if (query) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }
}
