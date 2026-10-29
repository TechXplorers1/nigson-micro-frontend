const blogGan = "/assets/blog-gan.jpg";
const blogMarket = "/assets/blog-market.jpg";
const blogGroundbreak = "/assets/blog-groundbreak.jpg";
const blogCounterfeit = "/assets/blog-counterfeit.jpg";

export type BlogSection = {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  tag: string;
  author: string;
  readMinutes: number;
  excerpt: string;
  img: string;
  body: string[];
  sections: BlogSection[];
};

export const POSTS: BlogPost[] = [
  {
    slug: "welcome",
    title: "Welcome to Nigson Products",
    date: "Oct 2026",
    tag: "Industry",
    author: "Nigson Editorial Team",
    readMinutes: 3,
    excerpt: "Welcome to our new store.",
    img: blogMarket,
    body: [
      "Welcome to Nigson Products. We are excited to announce the launch of our new official online store and distributor hub, bringing Nigeria's premier technology accessories, power solutions, and commercial products directly to retailers and consumers nationwide.",
      "Browse our full catalog of genuine smartphone accessories, heavy-duty GaN adapters, and reliable power banks with verified manufacturer warranties.",
      "Distributors across Nigeria can now submit wholesale orders directly online, request tailored bulk quotes, and benefit from expedited shipping from our Lagos, Aba and Kano fulfillment centers."
    ],
    sections: [
      {
        paragraphs: [
          "Welcome to Nigson Products. We are excited to announce the launch of our new official online store and distributor hub, bringing Nigeria's premier technology accessories, power solutions, and commercial products directly to retailers and consumers nationwide."
        ]
      },
      {
        heading: "What We Offer",
        bullets: [
          "Authentic, high-grade mobile & computing accessories",
          "Enterprise power protection & rapid GaN charging units",
          "Dedicated B2B wholesale pricing with nationwide delivery",
          "Comprehensive manufacturer warranties on all inventory"
        ]
      },
      {
        heading: "Partner With Nigson",
        paragraphs: [
          "Whether you operate a retail shop or oversee corporate procurement, our dedicated sales desk is ready to support your business with competitive margins and dependable supply."
        ]
      }
    ]
  },
  {
    slug: "launching-gan-100w",
    title: "Launching the GaN 100W adapter across Nigeria",
    date: "Jun 2026",
    tag: "Product Update",
    author: "Nigson Product Team",
    readMinutes: 4,
    excerpt: "Our new 4-port GaN charger is now available to distributors nationwide.",
    img: blogGan,
    body: [
      "Nigson is proud to announce the nationwide rollout of our flagship GaN 100W four-port desktop adapter — engineered for power users, small offices and busy homes across Nigeria.",
      "GaN (Gallium Nitride) technology delivers up to 3× more efficiency than conventional silicon chargers, in a footprint less than half the size. That means faster charging, lower heat, and a single wall socket that can power a laptop, two phones and a pair of earbuds simultaneously.",
      "The unit ships with universal Nigerian pin compatibility, over-current and over-voltage protection, and Nigson's standard 12-month warranty. Distributors can request bulk pricing via our Quote form or WhatsApp desk.",
      "Retailers report strong early demand — particularly from remote-work customers and university students. Stock is available now from our Lagos, Aba and Kano hubs.",
    ],
    sections: [
      {
        paragraphs: [
          "Nigson is proud to announce the nationwide rollout of our flagship GaN 100W four-port desktop adapter — engineered for power users, small offices and busy homes across Nigeria.",
        ],
      },
      {
        heading: "Why GaN matters",
        paragraphs: [
          "GaN (Gallium Nitride) technology delivers up to 3× more efficiency than conventional silicon chargers, in a footprint less than half the size. That means faster charging, lower heat, and a single wall socket that can power a laptop, two phones and a pair of earbuds simultaneously.",
        ],
      },
      {
        heading: "What ships in the box",
        bullets: [
          "Universal Nigerian pin compatibility",
          "Over-current and over-voltage protection",
          "Four ports — 3× USB-C, 1× USB-A",
          "Nigson standard 12-month warranty",
        ],
      },
      {
        heading: "Availability",
        paragraphs: [
          "Retailers report strong early demand — particularly from remote-work customers and university students. Stock is available now from our Lagos, Aba and Kano hubs.",
          "Distributors can request bulk pricing via our Quote form or the WhatsApp sales desk.",
        ],
      },
    ],
  },
  {
    slug: "2026-market-outlook",
    title: "The 2026 phone accessories market outlook",
    date: "May 2026",
    tag: "Industry",
    author: "Nigson Insights Desk",
    readMinutes: 5,
    excerpt: "Consumer demand is shifting — here's how retailers should plan inventory.",
    img: blogMarket,
    body: [
      "Nigeria's phone accessories market is projected to grow 14% in 2026, driven by rising smartphone penetration and the migration to USB-C across nearly every device category.",
      "For retailers, three shifts matter most this year: (1) USB-C is now the dominant connector across new phones — stock accordingly; (2) power banks above 20,000mAh are outselling smaller units 3:1 as grid reliability remains uneven; (3) TWS earbuds continue to displace wired sets, especially in the 15,000-30,000 NGN price band.",
      "Distributors partnering with Nigson benefit from advance sight of import cycles and category forecasts — allowing them to align stock and cash flow with demand curves rather than react to them.",
      "Talk to your account manager about the 2026 planning pack, or request one directly from our sales team.",
    ],
    sections: [
      {
        paragraphs: [
          "Nigeria's phone accessories market is projected to grow 14% in 2026, driven by rising smartphone penetration and the migration to USB-C across nearly every device category.",
        ],
      },
      {
        heading: "Three shifts that matter this year",
        bullets: [
          "USB-C is now the dominant connector across new phones — stock accordingly.",
          "Power banks above 20,000mAh outsell smaller units 3:1 as grid reliability remains uneven.",
          "TWS earbuds keep displacing wired sets, especially in the 15,000–30,000 NGN band.",
        ],
      },
      {
        heading: "Planning with Nigson",
        paragraphs: [
          "Distributors partnering with Nigson benefit from advance sight of import cycles and category forecasts — allowing them to align stock and cash flow with demand curves rather than react to them.",
          "Talk to your account manager about the 2026 planning pack, or request one directly from our sales team.",
        ],
      },
    ],
  },
  {
    slug: "periwinkle-groundbreaking",
    title: "Nigson Properties breaks ground on Periwinkle",
    date: "Apr 2026",
    tag: "Announcement",
    author: "Nigson Communications",
    readMinutes: 3,
    excerpt: "9-unit mixed residential development kicks off in Lekki.",
    img: blogGroundbreak,
    body: [
      "Nigson Properties Limited has officially broken ground on Periwinkle — a 9-unit mixed residential development in Lekki, comprising eight 3-bedroom units and a signature 4-bedroom pent-floor with BQ.",
      "The project continues our tradition of building homes that combine premium finishes, smart-home readiness, dedicated solar and inverter power, and generous shared amenities.",
      "Construction is scheduled for 18 months, with a target handover of Q4 2027. Early buyer registrations are open — units at ground-breaking pricing are available on a first-come basis.",
      "Contact our Properties team to arrange a private walkthrough of the plans and pricing.",
    ],
    sections: [
      {
        paragraphs: [
          "Nigson Properties Limited has officially broken ground on Periwinkle — a 9-unit mixed residential development in Lekki, comprising eight 3-bedroom units and a signature 4-bedroom pent-floor with BQ.",
        ],
      },
      {
        heading: "What we are building",
        bullets: [
          "Eight 3-bedroom units and one 4-bedroom pent-floor with BQ",
          "Premium finishes and smart-home readiness",
          "Dedicated solar and inverter power",
          "Generous shared amenities",
        ],
      },
      {
        heading: "Timeline and next steps",
        paragraphs: [
          "Construction is scheduled for 18 months, with a target handover of Q4 2027. Early buyer registrations are open — units at ground-breaking pricing are available on a first-come basis.",
          "Contact our Properties team to arrange a private walkthrough of the plans and pricing.",
        ],
      },
    ],
  },
  {
    slug: "spot-counterfeit-power-banks",
    title: "How to spot counterfeit power banks",
    date: "Mar 2026",
    tag: "Guide",
    author: "Nigson Quality Assurance",
    readMinutes: 4,
    excerpt: "A quick checklist for retailers to protect their customers.",
    img: blogCounterfeit,
    body: [
      "Counterfeit power banks aren't just a margin problem — they're a safety hazard. Here's the quick checklist we train every Nigson retailer to run before accepting stock.",
      "1. Weight test: Genuine cells are heavier than their fake counterparts. A 20,000mAh unit weighing under 350g is almost certainly under-rated or refilled with sand/paper.",
      "2. Charge cycle: Load-test with a known device. A genuine 10,000mAh unit should recharge a 4,000mAh phone at least twice. Fakes typically manage half of the advertised capacity.",
      "3. Print quality: Look for crisp printing, correctly aligned USB ports, and matched serial numbers between the box, the unit and the certificate.",
      "4. Certification: Nigson-supplied units carry SONCAP, CE and RoHS marks — and a scannable QR authenticity code on the box.",
      "When in doubt, buy from an authorised Nigson distributor. Our supply chain guarantees genuine cells, tested to spec, every cycle.",
    ],
    sections: [
      {
        paragraphs: [
          "Counterfeit power banks aren't just a margin problem — they're a safety hazard. Here's the quick checklist we train every Nigson retailer to run before accepting stock.",
        ],
      },
      {
        heading: "The four-point checklist",
        bullets: [
          "Weight test: a 20,000mAh unit under 350g is almost certainly under-rated or filled with sand/paper.",
          "Charge cycle: a genuine 10,000mAh unit should recharge a 4,000mAh phone at least twice.",
          "Print quality: crisp printing, aligned USB ports, matched serial numbers on box, unit and certificate.",
          "Certification: SONCAP, CE and RoHS marks, plus a scannable QR authenticity code.",
        ],
      },
      {
        heading: "When in doubt",
        paragraphs: [
          "Buy from an authorised Nigson distributor. Our supply chain guarantees genuine cells, tested to spec, every cycle.",
        ],
      },
    ],
  },
];

export function parseMarkdownToSections(markdown: string): BlogSection[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = markdown.split(/\r?\n/);
  const sections: BlogSection[] = [];
  let currentSection: BlogSection = { paragraphs: [], bullets: [] };
  let currentParagraphLines: string[] = [];

  function flushParagraph() {
    if (currentParagraphLines.length > 0) {
      const p = currentParagraphLines.join(" ").trim();
      if (p) {
        if (!currentSection.paragraphs) currentSection.paragraphs = [];
        currentSection.paragraphs.push(p);
      }
      currentParagraphLines = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Check for headings (e.g., "### Heading", "## Heading", "# Heading")
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      if (
        currentSection.heading ||
        (currentSection.paragraphs && currentSection.paragraphs.length > 0) ||
        (currentSection.bullets && currentSection.bullets.length > 0)
      ) {
        sections.push(currentSection);
      }
      currentSection = { heading: headingMatch[1].trim(), paragraphs: [], bullets: [] };
      continue;
    }

    // Check for bullet points (e.g., "- bullet", "* bullet", "• bullet")
    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentSection.bullets) currentSection.bullets = [];
      currentSection.bullets.push(bulletMatch[1].trim());
      continue;
    }

    // Empty line -> paragraph separator
    if (!line) {
      flushParagraph();
      continue;
    }

    // Regular text line
    currentParagraphLines.push(line);
  }

  flushParagraph();
  if (
    currentSection.heading ||
    (currentSection.paragraphs && currentSection.paragraphs.length > 0) ||
    (currentSection.bullets && currentSection.bullets.length > 0)
  ) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ paragraphs: [markdown.trim()] }];
}

export function formatSectionsToMarkdown(sections: BlogSection[]): string {
  if (!sections || sections.length === 0) return "";
  const parts: string[] = [];

  for (const s of sections) {
    if (s.heading) {
      parts.push(`### ${s.heading}`);
    }
    if (s.paragraphs && s.paragraphs.length > 0) {
      parts.push(s.paragraphs.join("\n\n"));
    }
    if (s.bullets && s.bullets.length > 0) {
      parts.push(s.bullets.map(b => `- ${b}`).join("\n"));
    }
  }

  return parts.join("\n\n");
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatDate(d: string): string {
  if (!d) return "2026";
  if (!d.includes("T") && !d.includes("-")) return d;
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return d;
    return dateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

export function getAllPublishedPosts(): BlogPost[] {
  let adminPosts: any[] = [];
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("nigson.admin.v2") : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.posts)) {
        adminPosts = parsed.posts;
      }
    }
  } catch {
    /* ignore */
  }

  if (adminPosts.length === 0) {
    return POSTS;
  }

  const publishedAdminPosts = adminPosts.filter((p) => p.status === "Published");

  const results: BlogPost[] = [];
  const processedSlugs = new Set<string>();

  for (const ap of publishedAdminPosts) {
    const slug = ap.slug || slugify(ap.title);
    if (!slug || processedSlugs.has(slug)) continue;
    processedSlugs.add(slug);

    const existing = POSTS.find((p) => p.slug === slug || p.slug === ap.slug);

    // Parse sections with full headings and bullets support
    let sections: BlogSection[] = [];
    if (Array.isArray(ap.sections) && ap.sections.length > 0) {
      sections = ap.sections;
    } else if (typeof ap.body === "string" && ap.body.trim()) {
      const parsed = parseMarkdownToSections(ap.body);
      const hasStructure = parsed.some(s => s.heading || (s.bullets && s.bullets.length > 0));
      sections = hasStructure ? parsed : (existing?.sections || parsed);
    } else if (existing?.sections && existing.sections.length > 0) {
      sections = existing.sections;
    } else {
      sections = [{ paragraphs: [ap.excerpt || "No content available."] }];
    }

    // Extract flat body paragraphs for fallback
    let bodyParas: string[] = [];
    if (typeof ap.body === "string" && ap.body.trim()) {
      bodyParas = ap.body.split(/\n\n+/).map((s: string) => s.trim().replace(/^#{1,4}\s+/, "")).filter(Boolean);
    } else if (Array.isArray(ap.body) && ap.body.length > 0) {
      bodyParas = ap.body;
    } else if (existing?.body && existing.body.length > 0) {
      bodyParas = existing.body;
    } else {
      bodyParas = [ap.excerpt || "No content available."];
    }

    results.push({
      slug,
      title: ap.title || existing?.title || "Untitled Article",
      date: ap.date ? formatDate(ap.date) : (existing?.date || "2026"),
      tag: ap.tag || existing?.tag || "Industry",
      author: ap.author || existing?.author || "Nigson Editorial",
      readMinutes: existing?.readMinutes || Math.max(3, Math.ceil((ap.excerpt || "").split(" ").length / 30)),
      excerpt: ap.excerpt || existing?.excerpt || "",
      img: ap.image || ap.img || existing?.img || blogMarket,
      body: bodyParas,
      sections,
    });
  }

  // Include default POSTS if not managed in admin or if admin posts list didn't include them
  for (const p of POSTS) {
    if (!processedSlugs.has(p.slug)) {
      const apMatch = adminPosts.find((ap) => (ap.slug || slugify(ap.title)) === p.slug);
      if (!apMatch || apMatch.status === "Published") {
        results.push(p);
        processedSlugs.add(p.slug);
      }
    }
  }

  return results.length > 0 ? results : POSTS;
}

export function getPost(slug: string) {
  if (!slug) return undefined;
  const decoded = decodeURIComponent(slug);
  const posts = getAllPublishedPosts();
  return posts.find((p) => p.slug === slug || p.slug === decoded);
}
