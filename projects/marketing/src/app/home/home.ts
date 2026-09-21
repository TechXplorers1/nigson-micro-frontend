import { Component, computed, inject, OnInit, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideShieldCheck, LucideTruck } from '@lucide/angular';
import { CmsService } from 'shared-ui';

import { FlashSaleComponent } from '../components/flash-sale.component';
import { NewArrivalsComponent } from '../components/new-arrivals.component';
import { BestSellersComponent } from '../components/best-sellers.component';
import { WholesaleCtaComponent } from '../components/wholesale-cta.component';
import { ServiceBenefitsComponent } from '../components/service-benefits.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    LucideArrowRight, 
    LucideShieldCheck, 
    LucideTruck,
    FlashSaleComponent,
    NewArrivalsComponent,
    BestSellersComponent,
    WholesaleCtaComponent,
    ServiceBenefitsComponent
  ],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  cms = inject(CmsService);
  
  // Create computed signals for specific sections in the CMS
  heroSection = computed(() => this.cms.getPageSections('home').get('home_hero'));
  categoriesSection = computed(() => this.cms.getPageSections('home').get('home_categories'));
  promoSection = computed(() => this.cms.getPageSections('home').get('home_promo_banner'));
  wholesaleSection = computed(() => this.cms.getPageSections('home').get('home_wholesale_cta'));
  seoSection = computed(() => this.cms.getPageSections('home').get('home_seo'));

  readonly SHOP_CATEGORIES = [
    { name: "Earbuds", filter: "earbuds", img: "/assets/shopcat/earbuds.jpg" },
    { name: "Power Banks", filter: "power-banks", img: "/assets/shopcat/power-banks.jpg" },
    { name: "Chargers", filter: "chargers", img: "/assets/shopcat/chargers.jpg" },
    { name: "Cables", filter: "cables", img: "/assets/shopcat/cables.jpg" },
    { name: "Mobile Accessories", filter: "mobile-accessories", img: "/assets/shopcat/mobile-accessories.jpg" },
    { name: "Car Chargers", filter: "car-chargers", img: "/assets/shopcat/car-chargers.jpg" },
    { name: "Home & Power", filter: "home-power", img: "/assets/shopcat/home-power.jpg" },
    { name: "FMCG", filter: "fmcg", img: "/assets/shopcat/fmcg.jpg" },
    { name: "Deals", filter: "deals", img: "/assets/shopcat/deals.jpg" },
  ];

  platformId = inject(PLATFORM_ID);

  ngOnInit() {
    // Other init logic if needed
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

      document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }
  }
}
