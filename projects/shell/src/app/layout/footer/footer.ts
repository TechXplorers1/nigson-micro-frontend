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
        { label: "About", to: "/marketing/about" },
        { label: "Insights", to: "/marketing/insights" },
        { label: "Careers", to: "/marketing/careers" },
      ],
    },
    {
      heading: "Shop",
      links: [
        { label: "All Products", to: "/shop/products" },
        { label: "Deals", to: "/shop/products" },
        { label: "New Arrivals", to: "/shop/products" },
        { label: "Best Sellers", to: "/shop/products" },
        { label: "Categories", to: "/shop/products" },
      ],
    },
    {
      heading: "Customer",
      links: [
        { label: "My Account", to: "/account" },
        { label: "Orders", to: "/account/orders" },
        { label: "Shipping", to: "/marketing/support/shipping" },
        { label: "Returns", to: "/marketing/support/returns" },
      ],
    },
    {
      heading: "Business",
      links: [
        { label: "Wholesale", to: "/marketing/distributor" },
        { label: "Become a Partner", to: "/marketing/distributor" },
        { label: "Become an Affiliate", to: "/marketing/support/affiliate" },
        { label: "Request a Quote", to: "/quote" },
      ],
    },
    {
      heading: "Support",
      links: [
        { label: "Contact Us", to: "/marketing/contact" },
        { label: "WhatsApp", href: "https://wa.me/2348073467809" },
        { label: "FAQs", to: "/marketing/support/faqs" },
        { label: "Help Center", to: "/marketing/support/help" },
      ],
    },
  ];
}
