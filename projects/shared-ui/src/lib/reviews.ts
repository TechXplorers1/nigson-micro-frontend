export type Review = {
  id: string;
  sku: string;
  name: string;
  rating: number;
  text: string;
  date: string; // ISO
};

export type Rating = { average: number; count: number; breakdown: Record<1 | 2 | 3 | 4 | 5, number> };

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic rating between 4.2 and 4.9 with a realistic breakdown. */
export function ratingFor(sku: string): Rating {
  const h = hash(sku);
  const average = +(4.2 + ((h % 8) / 10)).toFixed(1);
  const count = 48 + (h % 260);
  const five = Math.min(92, 60 + (h % 30));
  const four = Math.max(4, Math.round((100 - five) * 0.55));
  const three = Math.max(1, Math.round((100 - five - four) * 0.6));
  const two = Math.max(0, Math.round((100 - five - four - three) * 0.6));
  const one = Math.max(0, 100 - five - four - three - two);
  return { average, count, breakdown: { 5: five, 4: four, 3: three, 2: two, 1: one } as Record<1 | 2 | 3 | 4 | 5, number> };
}

const NAMES = ["David Okonkwo", "Sarah Adeyemi", "Emeka Nwosu", "Fatima Bello", "Tunde Balogun", "Grace Eze", "Ibrahim Musa", "Chioma Nnaji"];
const TEXTS = [
  "Excellent product and very good battery life. Ordered in bulk for my shop and customers love it.",
  "Good quality and fast delivery. Packaging was neat and everything arrived intact.",
  "Solid build quality for the price. Will definitely restock again next month.",
  "Works exactly as described. The wholesale pricing makes a real difference for my margins.",
  "Very reliable so far. Nigson support responded quickly when I had a question.",
  "Great value. A few units took time to arrive but overall a good experience.",
];

/** 4 seeded reviews per product. */
export function seedReviews(sku: string): Review[] {
  const h = hash(sku);
  const days = [2, 7, 19, 44];
  return days.map((d, i) => {
    const k = (h + i * 7) % NAMES.length;
    const t = (h + i * 3) % TEXTS.length;
    return {
      id: `${sku}-seed-${i}`,
      sku,
      name: NAMES[k],
      rating: i === 3 ? 3 : i === 1 ? 4 : 5,
      text: TEXTS[t],
      date: new Date(Date.now() - d * 86400000).toISOString(),
    };
  });
}

export function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diff / 86400000);
  if (day < 1) return "Today";
  if (day === 1) return "1 day ago";
  if (day < 7) return `${day} days ago`;
  if (day < 14) return "1 week ago";
  if (day < 30) return `${Math.floor(day / 7)} weeks ago`;
  if (day < 60) return "1 month ago";
  return `${Math.floor(day / 30)} months ago`;
}
