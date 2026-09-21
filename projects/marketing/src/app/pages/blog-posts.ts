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

    let bodyParas: string[] = [];
    if (typeof ap.body === "string" && ap.body.trim()) {
      bodyParas = ap.body.split(/\n\n+/).map((s: string) => s.trim()).filter(Boolean);
    } else if (Array.isArray(ap.body) && ap.body.length > 0) {
      bodyParas = ap.body;
    } else if (existing?.body && existing.body.length > 0) {
      bodyParas = existing.body;
    } else {
      bodyParas = ap.excerpt ? [ap.excerpt] : ["No content available."];
    }

    let sections = existing?.sections;
    if (!sections || sections.length === 0 || ap.body) {
      sections = [{ paragraphs: bodyParas }];
    }

    results.push({
      slug,
      title: ap.title || existing?.title || "Untitled Article",
      date: ap.date ? formatDate(ap.date) : (existing?.date || "2026"),
      tag: ap.tag || existing?.tag || "Industry",
      author: existing?.author || "Nigson Editorial",
      readMinutes: existing?.readMinutes || Math.max(3, Math.ceil((ap.excerpt || "").split(" ").length / 30)),
      excerpt: ap.excerpt || existing?.excerpt || "",
      img: ap.image || existing?.img || blogMarket,
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
