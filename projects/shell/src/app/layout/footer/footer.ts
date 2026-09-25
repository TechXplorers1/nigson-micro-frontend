import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrls: ['./footer.css']
})
export class FooterComponent {
  
  readonly currentYear = new Date().getFullYear();

  readonly COLUMNS = [
    {
      heading: "Get to Know Us",
      links: [
        { label: "About", to: "/about" },
        { label: "Insights", to: "/insights" },
        { label: "Careers", to: "/careers" },
      ],
    },
    {
      heading: "Shop",
      links: [
        { label: "All Products", to: "/products" },
        { label: "Deals", to: "/products" },
        { label: "New Arrivals", to: "/products" },
        { label: "Best Sellers", to: "/products" },
        { label: "Categories", to: "/products" },
      ],
    },
    {
      heading: "Customer",
      links: [
        { label: "My Account", to: "/account" },
        { label: "Orders", to: "/account/orders" },
        { label: "Shipping", to: "/support/shipping" },
        { label: "Returns", to: "/support/returns" },
      ],
    },
    {
      heading: "Business",
      links: [
        { label: "Wholesale", to: "/distributor" },
        { label: "Become a Partner", to: "/distributor" },
        { label: "Become an Affiliate", to: "/support/affiliate" },
        { label: "Request a Quote", to: "/quote" },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "Contact Us", to: "/contact" },
        { label: "WhatsApp", href: "https://wa.me/2348073467809" },
        { label: "FAQs", to: "/support/faqs" },
        { label: "Help Center", to: "/support/help" },
      ],
    },
  ];
}
