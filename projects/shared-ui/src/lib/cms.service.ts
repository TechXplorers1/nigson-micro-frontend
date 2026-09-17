/**
 * Nigson CMS — section based page content management.
 * Front-end only: content lives in React state and persists to localStorage,
 * so the public website always renders the latest PUBLISHED content.
 */
import { Injectable, signal, computed } from '@angular/core';















/* ---------------------------------- types --------------------------------- */

export type FieldType = "text" | "textarea" | "image" | "link";
export type FieldDef = { key: string; label: string; type: FieldType };

export type SectionDef = {
  id: string;
  title: string;
  note?: string;
  fields: FieldDef[];
  defaults: Record<string, string>;
  cardsLabel?: string;
  cardFields?: FieldDef[];
  defaultCards?: Record<string, string>[];
};

export type PageDef = { id: string; name: string; path: string; sections: SectionDef[] };

export type CmsCard = { id: string; fields: Record<string, string> };
export type SectionContent = { id: string; visible: boolean; fields: Record<string, string>; cards: CmsCard[] };
export type PageContent = { id: string; status: "Published" | "Draft"; updatedAt: string; sections: SectionContent[] };

/* -------------------------------- field kits ------------------------------- */

const F = {
  eyebrow: { key: "eyebrow", label: "Eyebrow", type: "text" } as FieldDef,
  heading: { key: "heading", label: "Heading", type: "text" } as FieldDef,
  body: { key: "body", label: "Description", type: "textarea" } as FieldDef,
  image: { key: "image", label: "Image", type: "image" } as FieldDef,
  btnLabel: { key: "btnLabel", label: "Button label", type: "text" } as FieldDef,
  btnLink: { key: "btnLink", label: "Button link", type: "link" } as FieldDef,
};

const cardTitleBody: FieldDef[] = [
  { key: "title", label: "Title", type: "text" },
  { key: "body", label: "Description", type: "textarea" },
];

/* --------------------------------- schemas -------------------------------- */

export const PAGES: PageDef[] = [
  {
    id: "home",
    name: "Home",
    path: "/",
    sections: [
      {
        id: "nav",
        title: "Navigation",
        note: "Site-wide navigation and header controls.",
        fields: [{ key: "brand", label: "Brand name", type: "text" }],
        defaults: { brand: "NIGSON" },
        cardsLabel: "Menu items",
        cardFields: [
          { key: "label", label: "Label", type: "text" },
          { key: "path", label: "Path", type: "link" },
        ],
        defaultCards: [
          { label: "Deals", path: "/products" },
          { label: "New Arrivals", path: "/products" },
          { label: "Best Sellers", path: "/products" },
          { label: "Wholesale", path: "/distributor" },
        ],
      },
      {
        id: "hero",
        title: "Hero",
        note: "Main homepage hero banner.",
        fields: [
          { key: "badge", label: "Badge text", type: "text" },
          { key: "heading", label: "Heading (Line 1)", type: "text" },
          { key: "headingAccent", label: "Heading (Accent word)", type: "text" },
          F.body,
          { key: "btn1Label", label: "Button 1 label", type: "text" },
          { key: "btn1Link", label: "Button 1 link", type: "link" },
          { key: "btn2Label", label: "Button 2 label", type: "text" },
          { key: "btn2Link", label: "Button 2 link", type: "link" },
          { key: "discountBadge", label: "Discount badge text", type: "text" },
        ],
        defaults: {
          badge: "UP TO 40% OFF",
          heading: "POWER YOUR",
          headingAccent: "EVERYDAY.",
          body: "Discover smarter tech, powerful accessories and everyday essentials at prices you’ll love.",
          btn1Label: "SHOP NOW",
          btn1Link: "/products",
          btn2Label: "EXPLORE DEALS",
          btn2Link: "/products",
          discountBadge: "40% OFF",
        },
      },
      {
        id: "categories",
        title: "Shop by Category",
        note: "Category navigation displayed directly below the Hero.",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "text" },
          { key: "viewAllLabel", label: "View all label", type: "text" },
        ],
        defaults: {
          heading: "Shop by Category",
          subtitle: "Everything you need, all in one place.",
          viewAllLabel: "View all",
        },
        cardsLabel: "Categories",
        cardFields: [
          { key: "name", label: "Category Name", type: "text" },
          { key: "filter", label: "Filter Key", type: "text" },
        ],
        defaultCards: [
          { name: "Earbuds", filter: "earbuds" },
          { name: "Power Banks", filter: "power-banks" },
          { name: "Chargers", filter: "chargers" },
          { name: "Cables", filter: "cables" },
          { name: "Mobile Accessories", filter: "mobile-accessories" },
          { name: "Car Chargers", filter: "car-chargers" },
          { name: "Home & Power", filter: "home-power" },
          { name: "FMCG", filter: "fmcg" },
          { name: "Deals", filter: "deals" },
        ],
      },
      {
        id: "flashSale",
        title: "Flash Sale",
        note: "Limited-time discounted products.",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "text" },
          { key: "badge", label: "Badge text", type: "text" },
        ],
        defaults: {
          heading: "Flash Sale",
          subtitle: "Grab these deals before time runs out.",
          badge: "LIMITED TIME",
        },
      },
      {
        id: "wholesale",
        title: "Nigson Wholesale",
        note: "Wholesale promotional banner for business customers.",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "heading", label: "Heading", type: "text" },
          { key: "body", label: "Body text", type: "textarea" },
          { key: "btn1Label", label: "Button 1 label", type: "text" },
          { key: "btn1Link", label: "Button 1 link", type: "link" },
          { key: "btn2Label", label: "Button 2 label", type: "text" },
          { key: "btn2Link", label: "Button 2 link", type: "link" },
        ],
        defaults: {
          eyebrow: "NIGSON WHOLESALE",
          heading: "BUY MORE. SAVE MORE.",
          body: "Special pricing for bulk orders, retailers and business customers.",
          btn1Label: "SHOP WHOLESALE",
          btn1Link: "/distributor",
          btn2Label: "REQUEST A QUOTE",
          btn2Link: "/quote",
        },
      },
      {
        id: "newArrivals",
        title: "New Arrivals",
        note: "Recently added products.",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "text" },
          { key: "btnLabel", label: "Shop all label", type: "text" },
          { key: "btnLink", label: "Shop all link", type: "link" },
        ],
        defaults: {
          heading: "New Arrivals",
          subtitle: "The latest tech and accessories just landed in stock.",
          btnLabel: "Shop all new arrivals",
          btnLink: "/products",
        },
      },
      {
        id: "bestSellers",
        title: "Best Sellers",
        note: "Popular products customers keep coming back for.",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "subtitle", label: "Subtitle", type: "text" },
        ],
        defaults: {
          heading: "Best Sellers",
          subtitle: "Top-rated items loved by customers across Nigeria.",
        },
      },
      {
        id: "serviceBenefits",
        title: "Service Benefits",
        note: "Customer service and shopping benefits.",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
        ],
        defaults: {
          heading: "Shopping Benefits",
        },
        cardsLabel: "Benefits",
        cardFields: [
          { key: "title", label: "Benefit Title", type: "text" },
          { key: "desc", label: "Description", type: "text" },
        ],
        defaultCards: [
          { title: "Fast & Reliable Delivery", desc: "Across Nigeria" },
          { title: "Secure Payments", desc: "Protected checkout" },
          { title: "Easy Returns", desc: "Hassle-free process" },
          { title: "Customer Support", desc: "We're here to help" },
        ],
      },
      {
        id: "testimonials",
        title: "Testimonials",
        note: "Customer testimonials and reviews.",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "heading", label: "Heading", type: "text" },
        ],
        defaults: {
          eyebrow: "TESTIMONIALS",
          heading: "Trusted by the people who move Nigerian retail.",
        },
        cardsLabel: "Testimonials",
        cardFields: [
          { key: "quote", label: "Quote", type: "textarea" },
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Role", type: "text" },
        ],
        defaultCards: [
          { quote: "Nigson has been our go-to for phone accessories for over 6 years. Consistent stock, honest pricing — they simply deliver.", name: "Chidi O.", role: "Onitsha Wholesaler" },
          { quote: "Their turnaround on large orders is unmatched. Their logistics simply works, and we haven't had a stock issue in years.", name: "Amaka N.", role: "Supermarket Chain Buyer" },
          { quote: "Quality is genuine and predictable. That's rare in this market — and it's why our shelves keep moving.", name: "Bola A.", role: "Retail Chain Manager" },
        ],
      },
      {
        id: "distributorCta",
        title: "Become a Distributor CTA",
        note: "Call-to-action section for distributor applications.",
        fields: [
          { key: "eyebrow", label: "Eyebrow", type: "text" },
          { key: "heading", label: "Heading", type: "text" },
          { key: "body", label: "Body text", type: "textarea" },
          { key: "btnLabel", label: "Button label", type: "text" },
          { key: "btnLink", label: "Button link", type: "link" },
        ],
        defaults: {
          eyebrow: "PARTNERSHIP",
          heading: "Become a Nigson Distributor.",
          body: "Join hundreds of successful distributors and grow your business with a partner that delivers — every week.",
          btnLabel: "Apply now",
          btnLink: "/distributor",
        },
        cardsLabel: "Benefits",
        cardFields: [{ key: "title", label: "Benefit", type: "text" }],
        defaultCards: [
          { title: "Exclusive Pricing" },
          { title: "Marketing Support" },
          { title: "Reliable Supply" },
          { title: "Dedicated Sales Team" },
        ],
      },
      {
        id: "footer",
        title: "Footer",
        note: "Site-wide footer navigation and company information.",
        fields: [
          { key: "tagline", label: "Tagline", type: "textarea" },
          { key: "copyright", label: "Copyright line", type: "text" },
          { key: "motto", label: "Footer motto", type: "text" },
          { key: "credit", label: "Developer credit", type: "text" },
          { key: "creditLink", label: "Developer credit link", type: "link" },
        ],
        defaults: {
          tagline: "Building Value. Delivering Excellence. Creating Lasting Impact.",
          copyright: "Nigson Group of Companies. All rights reserved.",
          motto: "Innovation • Quality • Trust",
          credit: "Develop & Design By Techxplorers Pvt. Ltd",
          creditLink: "https://techxplorers.in/",
        },
      },
    ],
  },

  {
    id: "about",
    name: "About",
    path: "/about",
    sections: [
      {
        id: "hero",
        title: "Hero",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: {
          eyebrow: "About Nigson Group",
          heading: "A three-decade Nigerian legacy, built for the next generation.",
          body: "Founded by the late Chief Ignatius Nwabueze Odunukwe, Nigson has grown from a modest trading business into a diversified enterprise spanning importation, distribution, consumer products and real estate.",
        },
      },
      {
        id: "story",
        title: "Company story",
        fields: [
          { key: "p1", label: "Paragraph 1", type: "textarea" },
          { key: "p2", label: "Paragraph 2", type: "textarea" },
          { key: "p3", label: "Paragraph 3", type: "textarea" },
          { key: "smartEyebrow", label: "Side card eyebrow", type: "text" },
          { key: "smartTitle", label: "Side card title", type: "text" },
        ],
        defaults: {
          p1: "Nigson Imports and Investment Company Limited is a proudly Nigerian-owned enterprise with a rich legacy spanning over three decades. From a modest spare parts business, the company steadily expanded into personal care under the Zarina brand, household goods, FMCG, mobile technology accessories and energy solutions.",
          p2: "Following the passing of its founder in 2019, the business entered a new chapter under the leadership of Miss Ijeoma Odunukwe. It was restructured into two complementary subsidiaries: Nigson Imports & Investment Company Limited and Nigson Properties Limited — reflecting a broader vision for diversification, innovation and long-term growth.",
          p3: "Today, Nigson stands as a symbol of resilience, growth and generational continuity — committed to strengthening its presence across Nigeria, expanding throughout Africa, and positioning itself as a globally recognized Nigerian enterprise.",
          smartEyebrow: "Think Nigson. Think",
          smartTitle: "S.M.A.R.T",
        },
        cardsLabel: "S.M.A.R.T lines",
        cardFields: [{ key: "title", label: "Line", type: "text" }],
        defaultCards: [
          { title: "S — Service Excellence" },
          { title: "M — Market Leadership" },
          { title: "A — Accountability" },
          { title: "R — Reliability" },
          { title: "T — Technology & Innovation" },
        ],
      },
      {
        id: "mission",
        title: "Purpose / Vision / Mission",
        fields: [],
        defaults: {},
        cardsLabel: "Statements",
        cardFields: cardTitleBody,
        defaultCards: [
          { title: "Our Purpose", body: "To enrich lives and create lasting value by delivering quality products, services and innovative solutions that meet the everyday needs of individuals, families and businesses." },
          { title: "Our Vision", body: "To become a leading diversified enterprise in Nigeria and Africa — delivering innovative products, premium real estate and exceptional services for generations to come." },
          { title: "Our Mission", body: "To provide high-quality products, world-class real estate developments and customer-centric services through innovation, professionalism and operational excellence." },
        ],
      },
      {
        id: "journey",
        title: "Our Journey (timeline)",
        fields: [F.eyebrow, F.heading],
        defaults: { eyebrow: "Our Journey", heading: "Three decades. One promise, kept." },
        cardsLabel: "Milestones",
        cardFields: [
          { key: "year", label: "Year", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "body", label: "Description", type: "textarea" },
        ],
        defaultCards: [
          { year: "1993", title: "Founded in Lagos", body: "Chief Ignatius Nwabueze Odunukwe founds Nigson as a modest spare-parts trading business." },
          { year: "2005", title: "Nationwide distribution", body: "Expansion into personal care under the Zarina brand and household goods, reaching dealers across Nigeria." },
          { year: "2014", title: "Mobile & power solutions", body: "Nigson enters the phone accessories and energy solutions market with premium imports." },
          { year: "2019", title: "Second-generation leadership", body: "Following the founder's passing, the group is restructured under Miss Ijeoma Odunukwe into two subsidiaries." },
          { year: "2022", title: "Nigson Properties launched", body: "Landmark residential developments across Lekki, Ologolo and Ikoyi begin delivery." },
          { year: "2026", title: "Pan-African expansion", body: "The group scales operations and positions Nigson as a globally recognised Nigerian enterprise." },
        ],
      },
      {
        id: "values",
        title: "Core Values",
        fields: [F.eyebrow, F.heading],
        defaults: { eyebrow: "Core Values", heading: "The principles behind every decision." },
        cardsLabel: "Values",
        cardFields: cardTitleBody,
        defaultCards: [
          { title: "Professionalism", body: "Best-in-class standards, sound judgement and ethics." },
          { title: "Excellence", body: "Exceptional, uncommon, superior services and results." },
          { title: "Trust", body: "We remain trustworthy — every promise is fulfilled." },
          { title: "Integrity", body: "Our word is our bond. We live up to our commitments." },
          { title: "Value-driven", body: "We relentlessly seek new ways to create and deliver value." },
          { title: "Empathy", body: "We address the real pain points of the clients we serve." },
          { title: "Resilience", body: "Flexible and committed to co-creating solutions." },
        ],
      },
      {
        id: "leadership",
        title: "Leadership / Directors",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: {
          eyebrow: "Leadership / Directors",
          heading: "Meet the team.",
          body: "A dynamic team of second-generation leaders committed to preserving the founder's legacy while driving innovation and growth.",
        },
        cardsLabel: "Members",
        cardFields: [
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Position", type: "text" },
          { key: "bio", label: "Description", type: "textarea" },
          { key: "image", label: "Photo", type: "image" },
        ],
        defaultCards: [
          { name: "Miss Ijeoma Odunukwe", role: "Managing Director & Chief Executive Officer", bio: "Provides strategic leadership across the Group's corporate growth, business development, investments and organizational transformation. Lagos Business School OMP alumna and member of the Institute of Directors.", image: "/assets/Ijeoma_odunukwe_img.jpeg" },
          { name: "Miss Nkem Odunukwe", role: "Director, Imports & Investments", bio: "Leads importation, sourcing, procurement and distribution. Babcock University graduate and Lagos Business School OMP alumna focused on strategic sourcing and supply chain excellence.", image: "/assets/Nkem_Odunukwe.jpeg" },
          { name: "Diana Odunukwe", role: "Director, Properties", bio: "", image: "" },
          { name: "Odinaka Odunukwe", role: "Director, Operations / Properties", bio: "Directs Nigson Properties — acquisition, development, sales strategy and portfolio expansion. B.Sc Pan-Atlantic University; Certified Real Estate Financial Modeling & Investment Analysis Professional.", image: "/assets/Odinaka_Odunukweimg.jpeg" },
        ],
      },
      {
        id: "management",
        title: "Management Team",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: { eyebrow: "Management Team", heading: "Management Team.", body: "" },
        cardsLabel: "Members",
        cardFields: [
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Position", type: "text" },
          { key: "bio", label: "Description", type: "textarea" },
          { key: "image", label: "Photo", type: "image" },
        ],
        defaultCards: [
          { name: "Taiwo Olubunmi Kobamije", role: "Group Head, Finance & Accounts", bio: "Provides strategic financial leadership across Nigson Group, overseeing financial planning, governance, reporting, and financial performance to support sustainable growth.", image: "/assets/taiwo-olubunmi-kobamije.png" },
          { name: "Fatai Damilola Balogun", role: "Head, Human Resources Management", bio: "Leads Nigson Group's human capital strategy, talent development, workforce planning, and organizational culture to build high-performing teams.", image: "" },
          { name: "Adedamola Adeyemi, PMP", role: "Head, Projects & Operations – Nigson Properties", bio: "Leads project delivery and operations at Nigson Properties, overseeing real estate projects, process optimization, quality, and client satisfaction.", image: "" },
          { name: "Ladeinde Olubukola", role: "Head of Sales & Marketing", bio: "Leads sales, marketing, and business development across Nigson Group, driving revenue growth, brand positioning, partnerships, and market expansion.", image: "" },
        ],
      },
      {
        id: "advisory",
        title: "Advisory Board",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: { eyebrow: "Advisory Board", heading: "Advisory Board.", body: "" },
        cardsLabel: "Members",
        cardFields: [
          { key: "name", label: "Name", type: "text" },
          { key: "role", label: "Position", type: "text" },
          { key: "bio", label: "Description", type: "textarea" },
          { key: "image", label: "Photo", type: "image" },
        ],
        defaultCards: [
          { name: "Chidi Okoro", role: "Board Adviser", bio: "Provides strategic counsel on business growth, operational excellence, and corporate governance, drawing on over 30 years of executive leadership experience.", image: "" },
          { name: "Professor Nkemdilim Iheanachor", role: "Board Adviser", bio: "Provides strategic guidance on business growth, innovation, digital transformation, and long-term value creation, with expertise in strategy and international business.", image: "" },
        ],
      },
      {
        id: "careersCta",
        title: "Join our Team CTA",
        fields: [F.eyebrow, F.heading, F.body, F.btnLabel, F.btnLink],
        defaults: {
          eyebrow: "Careers",
          heading: "Join our Team.",
          body: "Build a career at one of Nigeria's most trusted diversified enterprises. Explore open roles across imports, distribution, properties and corporate functions.",
          btnLabel: "View open positions",
          btnLink: "/careers",
        },
        cardsLabel: "Highlights",
        cardFields: cardTitleBody,
        defaultCards: [
          { title: "Full-time roles", body: "Grow across a diversified group" },
          { title: "Internships", body: "Learn from experienced leaders" },
          { title: "Creators", body: "Collaborate on campaigns" },
          { title: "Affiliates", body: "Earn with every referral" },
        ],
      },
    ],
  },

  {
    id: "insights",
    name: "Insights",
    path: "/insights",
    sections: [
      {
        id: "hero",
        title: "Hero",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: {
          eyebrow: "Insights",
          heading: "Latest from Nigson.",
          body: "Product updates, industry trends and business news.",
        },
      },
      {
        id: "articles",
        title: "Article cards",
        note: "Articles are pulled from Blog Posts; use this to set the list intro and read link label.",
        fields: [
          { key: "intro", label: "Section intro", type: "textarea" },
          { key: "readLabel", label: "Read link label", type: "text" },
        ],
        defaults: { intro: "", readLabel: "Read article" },
      },
      {
        id: "cta",
        title: "CTA",
        fields: [F.heading, F.body, F.btnLabel, F.btnLink],
        defaults: {
          heading: "Want wholesale pricing on what you just read about?",
          body: "Our sales desk responds to every quote request within 24 hours.",
          btnLabel: "Request a quote",
          btnLink: "/quote",
        },
      },
    ],
  },

  {
    id: "contact",
    name: "Contact",
    path: "/contact",
    sections: [
      {
        id: "hero",
        title: "Hero",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: {
          eyebrow: "Get in touch",
          heading: "Talk to Nigson.",
          body: "Sales, partnerships, or a dedicated complaints channel — we're here.",
        },
      },
      {
        id: "info",
        title: "Contact information",
        fields: [
          { key: "officeTitle", label: "Office title", type: "text" },
          { key: "address", label: "Address", type: "textarea" },
          { key: "phoneTitle", label: "Phone title", type: "text" },
          { key: "phone", label: "Phone number", type: "text" },
          { key: "emailTitle", label: "Email title", type: "text" },
          { key: "email", label: "Email address", type: "text" },
          { key: "whatsappTitle", label: "WhatsApp title", type: "text" },
          { key: "whatsappBody", label: "WhatsApp text", type: "text" },
          { key: "whatsappLink", label: "WhatsApp link", type: "link" },
        ],
        defaults: {
          officeTitle: "Corporate office",
          address: "Plot 30B, Oladimeji Alo Street,\nOff Freedom Way, Ikate, Lekki, Lagos.",
          phoneTitle: "Phone",
          phone: "+234 807 346 7809",
          emailTitle: "Email",
          email: "info@nigson.com",
          whatsappTitle: "Chat on WhatsApp",
          whatsappBody: "Fastest way to reach sales.",
          whatsappLink: "https://wa.me/2348073467809",
        },
      },
      {
        id: "form",
        title: "Contact form",
        fields: [
          { key: "heading", label: "Form heading", type: "text" },
          { key: "nameLabel", label: "Name label", type: "text" },
          { key: "emailLabel", label: "Email label", type: "text" },
          { key: "subjectLabel", label: "Subject label", type: "text" },
          { key: "messageLabel", label: "Message label", type: "text" },
          { key: "btnLabel", label: "Submit button", type: "text" },
          { key: "successText", label: "Success message", type: "text" },
        ],
        defaults: {
          heading: "Send us a message",
          nameLabel: "Full name",
          emailLabel: "Email",
          subjectLabel: "Subject",
          messageLabel: "Message",
          btnLabel: "Send message",
          successText: "Thank you — we'll be in touch within 24 hours.",
        },
      },
    ],
  },

  {
    id: "distributor",
    name: "Distributor",
    path: "/distributor",
    sections: [
      {
        id: "hero",
        title: "Hero",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: {
          eyebrow: "Partner with Nigson",
          heading: "Become a Nigson distributor.",
          body: "Join Nigeria's most reliable distribution network for phone accessories, power solutions and FMCG.",
        },
      },
      {
        id: "benefits",
        title: "Benefits",
        fields: [{ key: "heading", label: "Heading", type: "text" }],
        defaults: { heading: "What you get" },
        cardsLabel: "Benefits",
        cardFields: [{ key: "title", label: "Benefit", type: "text" }],
        defaultCards: [
          { title: "Exclusive wholesale pricing" },
          { title: "Priority access to new SKUs & launches" },
          { title: "Reliable, consistent supply" },
          { title: "Marketing and merchandising support" },
          { title: "Dedicated sales rep" },
        ],
      },
      {
        id: "form",
        title: "Registration form",
        fields: [
          { key: "heading", label: "Form heading", type: "text" },
          { key: "body", label: "Form intro", type: "textarea" },
          { key: "btnLabel", label: "Submit button", type: "text" },
          { key: "successText", label: "Success message", type: "text" },
        ],
        defaults: {
          heading: "Distributor application",
          body: "Tell us about your business and our team will review your application.",
          btnLabel: "Submit application",
          successText: "Application received — we'll review and get back to you.",
        },
      },
    ],
  },

  {
    id: "careers",
    name: "Careers",
    path: "/careers",
    sections: [
      {
        id: "hero",
        title: "Hero",
        fields: [F.eyebrow, F.heading, F.body],
        defaults: {
          eyebrow: "Join our team",
          heading: "Build a career at Nigson.",
          body: "We're growing across imports, real estate and consumer brands — and we're looking for ambitious people to grow with us.",
        },
      },
      {
        id: "tracks",
        title: "Company introduction / tracks",
        fields: [],
        defaults: {},
        cardsLabel: "Tracks",
        cardFields: cardTitleBody,
        defaultCards: [
          { title: "Full-time roles", body: "Grow with a diversified enterprise across imports, distribution and properties." },
          { title: "Internships", body: "Learn from experienced leaders while building real business impact." },
          { title: "Creators & influencers", body: "Collaborate on product launches and campaigns across our channels." },
          { title: "Affiliate marketers", body: "Earn commission promoting Nigson's product range." },
        ],
      },
      {
        id: "openings",
        title: "Job listings",
        fields: [
          { key: "heading", label: "Heading", type: "text" },
          { key: "btnLabel", label: "Apply button label", type: "text" },
          { key: "applyEmail", label: "Apply email", type: "text" },
        ],
        defaults: { heading: "Open positions", btnLabel: "Apply now", applyEmail: "careers@nigson.com" },
        cardsLabel: "Openings",
        cardFields: [
          { key: "title", label: "Role", type: "text" },
          { key: "type", label: "Type", type: "text" },
          { key: "location", label: "Location", type: "text" },
        ],
        defaultCards: [
          { title: "Sales Executive — Phone Accessories", type: "Full-time", location: "Lagos" },
          { title: "Warehouse Operations Manager", type: "Full-time", location: "Lagos" },
          { title: "Digital Marketing Associate", type: "Full-time", location: "Lagos / Remote" },
          { title: "Business Development Intern", type: "Internship", location: "Lagos" },
        ],
      },
    ],
  },
];

export const pageDef = (id: string) => PAGES.find((p) => p.id === id);
export const sectionDef = (pageId: string, sectionId: string) => pageDef(pageId)?.sections.find((s) => s.id === sectionId);

/* -------------------------------- defaults -------------------------------- */

const defaultPage = (def: PageDef): PageContent => ({
  id: def.id,
  status: "Published",
  updatedAt: new Date(0).toISOString(),
  sections: def.sections.map((s) => ({
    id: s.id,
    visible: true,
    fields: { ...s.defaults },
    cards: (s.defaultCards ?? []).map((c, i) => ({ id: `${s.id}_c${i}`, fields: { ...c } })),
  })),
});

const defaultStore = (): Record<string, PageContent> =>
  Object.fromEntries(PAGES.map((p) => [p.id, defaultPage(p)]));

/* -------------------------------- service -------------------------------- */

const KEY = "nigson_cms_v3";

export type CmsState = { published: Record<string, PageContent>; drafts: Record<string, PageContent> };

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

function mergeWithDefaults(saved: Partial<CmsState> | null): CmsState {
  const base: CmsState = { published: defaultStore(), drafts: defaultStore() };
  if (!saved) return base;
  for (const key of ["published", "drafts"] as const) {
    const bucket = saved[key];
    if (!bucket) continue;
    for (const def of PAGES) {
      const s = bucket[def.id];
      if (!s) continue;
      const fallback = base[key][def.id];
      base[key][def.id] = {
        id: def.id,
        status: s.status === "Draft" ? "Draft" : "Published",
        updatedAt: s.updatedAt ?? fallback.updatedAt,
        sections: def.sections.map((sd) => {
          const found = (s.sections ?? []).find((x) => x.id === sd.id);
          const fb = fallback.sections.find((x) => x.id === sd.id)!;
          if (!found) return fb;
          return {
            id: sd.id,
            visible: found.visible !== false,
            fields: { ...fb.fields, ...(found.fields ?? {}) },
            cards: Array.isArray(found.cards) ? found.cards : fb.cards,
          };
        }).sort((a, b) => {
          const order = (s.sections ?? []).map((x) => x.id);
          const ia = order.indexOf(a.id), ib = order.indexOf(b.id);
          return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
        }),
      };
    }
  }
  return base;
}

export type SectionApi = {
  id: string;
  visible: boolean;
  t: (key: string) => string;
  cards: <T>(mapper: (fields: Record<string, string>, index: number) => T) => T[];
};

@Injectable({
  providedIn: 'root'
})
export class CmsService {
  readonly state = signal<CmsState>({ published: defaultStore(), drafts: defaultStore() });
  readonly hydrated = signal(false);

  constructor() {
    this.init();
  }

  private init() {
    try {
      const raw = localStorage.getItem(KEY);
      this.state.set(mergeWithDefaults(raw ? JSON.parse(raw) : null));
    } catch {
      /* ignore */
    }
    this.hydrated.set(true);
  }

  private persist(next: CmsState) {
    this.state.set(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  getPageSections(pageId: string) {
    const page = computed(() => this.state().published[pageId]);
    return {
      order: computed(() => page()?.sections.map((s) => s.id) ?? []),
      get: (sectionId: string): SectionApi => {
        const p = page();
        if (!p) return { id: sectionId, visible: false, t: () => '', cards: () => [] };
        const s = p.sections.find((x) => x.id === sectionId);
        if (!s) return { id: sectionId, visible: false, t: () => '', cards: () => [] };
        
        return {
          id: s.id,
          visible: s.visible,
          t: (key: string) => s.fields[key] ?? '',
          cards: <T,>(mapper: (f: Record<string, string>, i: number) => T) => s.cards.map((c, i) => mapper(c.fields, i))
        };
      }
    };
  }
}
