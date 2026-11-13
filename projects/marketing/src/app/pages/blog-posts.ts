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
