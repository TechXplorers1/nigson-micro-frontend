import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AdminHeadingComponent } from 'shared-ui';
import {
  LucidePlus,
  LucidePencil,
  LucideTrash2,
  LucideGlobe,
  LucideFileText,
  LucideExternalLink,
  LucideX,
  LucideCheckCircle2,
  LucideSearch,
  LucideEye,
  LucideList,
  LucideHeading
} from '@lucide/angular';

export interface BlogSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface AdminBlogPost {
  id: string;
  title: string;
  slug: string;
  tag: string;
  author: string;
  date: string;
  status: 'Published' | 'Draft';
  excerpt: string;
  image: string;
  body: string;
  sections?: BlogSection[];
}

export function parseMarkdownToSections(markdown: string): BlogSection[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = markdown.split(/\r?\n/);
  const sections: BlogSection[] = [];
  let currentSection: BlogSection = { paragraphs: [], bullets: [] };
  let currentParagraphLines: string[] = [];

  function flushParagraph() {
    if (currentParagraphLines.length > 0) {
      const p = currentParagraphLines.join(' ').trim();
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

export const DEFAULT_POSTS: AdminBlogPost[] = [
  {
    id: 'post-1',
    title: 'Welcome to Nigson Products',
    slug: 'welcome',
    tag: 'Industry',
    author: 'Nigson Editorial Team',
    date: 'Oct 2026',
    status: 'Published',
    excerpt: 'Welcome to our new store.',
    image: '/assets/blog-market.jpg',
    body: `Welcome to Nigson Products. We are excited to announce the launch of our new official online store and distributor hub, bringing Nigeria's premier technology accessories, power solutions, and commercial products directly to retailers and consumers nationwide.

### What We Offer
- Authentic, high-grade mobile & computing accessories
- Enterprise power protection & rapid GaN charging units
- Dedicated B2B wholesale pricing with nationwide delivery
- Comprehensive manufacturer warranties on all inventory

### Partner With Nigson
Whether you operate a retail shop or oversee corporate procurement, our dedicated sales desk is ready to support your business with competitive margins and dependable supply.`,
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
    id: 'post-2',
    title: 'Launching the GaN 100W adapter across Nigeria',
    slug: 'launching-gan-100w',
    tag: 'Product Update',
    author: 'Nigson Product Team',
    date: 'Jun 2026',
    status: 'Published',
    excerpt: 'Our new 4-port GaN charger is now available to distributors nationwide.',
    image: '/assets/blog-gan.jpg',
    body: `Nigson is proud to announce the nationwide rollout of our flagship GaN 100W four-port desktop adapter — engineered for power users, small offices and busy homes across Nigeria.

### Why GaN matters
GaN (Gallium Nitride) technology delivers up to 3× more efficiency than conventional silicon chargers, in a footprint less than half the size. That means faster charging, lower heat, and a single wall socket that can power a laptop, two phones and a pair of earbuds simultaneously.

### What ships in the box
- Universal Nigerian pin compatibility
- Over-current and over-voltage protection
- Four ports — 3× USB-C, 1× USB-A
- Nigson standard 12-month warranty

### Availability
Retailers report strong early demand — particularly from remote-work customers and university students. Stock is available now from our Lagos, Aba and Kano hubs.

Distributors can request bulk pricing via our Quote form or the WhatsApp sales desk.`,
    sections: [
      {
        paragraphs: [
          "Nigson is proud to announce the nationwide rollout of our flagship GaN 100W four-port desktop adapter — engineered for power users, small offices and busy homes across Nigeria."
        ]
      },
      {
        heading: "Why GaN matters",
        paragraphs: [
          "GaN (Gallium Nitride) technology delivers up to 3× more efficiency than conventional silicon chargers, in a footprint less than half the size. That means faster charging, lower heat, and a single wall socket that can power a laptop, two phones and a pair of earbuds simultaneously."
        ]
      },
      {
        heading: "What ships in the box",
        bullets: [
          "Universal Nigerian pin compatibility",
          "Over-current and over-voltage protection",
          "Four ports — 3× USB-C, 1× USB-A",
          "Nigson standard 12-month warranty"
        ]
      },
      {
        heading: "Availability",
        paragraphs: [
          "Retailers report strong early demand — particularly from remote-work customers and university students. Stock is available now from our Lagos, Aba and Kano hubs.",
          "Distributors can request bulk pricing via our Quote form or the WhatsApp sales desk."
        ]
      }
    ]
  },
  {
    id: 'post-3',
    title: 'The 2026 phone accessories market outlook',
    slug: '2026-market-outlook',
    tag: 'Industry',
    author: 'Nigson Insights Desk',
    date: 'May 2026',
    status: 'Published',
    excerpt: "Consumer demand is shifting — here's how retailers should plan inventory.",
    image: '/assets/blog-market.jpg',
    body: `Nigeria's phone accessories market is projected to grow 14% in 2026, driven by rising smartphone penetration and the migration to USB-C across nearly every device category.

### Three shifts that matter this year
- USB-C is now the dominant connector across new phones — stock accordingly.
- Power banks above 20,000mAh outsell smaller units 3:1 as grid reliability remains uneven.
- TWS earbuds keep displacing wired sets, especially in the 15,000–30,000 NGN band.

### Planning with Nigson
Distributors partnering with Nigson benefit from advance sight of import cycles and category forecasts — allowing them to align stock and cash flow with demand curves rather than react to them.

Talk to your account manager about the 2026 planning pack, or request one directly from our sales team.`,
    sections: [
      {
        paragraphs: [
          "Nigeria's phone accessories market is projected to grow 14% in 2026, driven by rising smartphone penetration and the migration to USB-C across nearly every device category."
        ]
      },
      {
        heading: "Three shifts that matter this year",
        bullets: [
          "USB-C is now the dominant connector across new phones — stock accordingly.",
          "Power banks above 20,000mAh outsell smaller units 3:1 as grid reliability remains uneven.",
          "TWS earbuds keep displacing wired sets, especially in the 15,000–30,000 NGN band."
        ]
      },
      {
        heading: "Planning with Nigson",
        paragraphs: [
          "Distributors partnering with Nigson benefit from advance sight of import cycles and category forecasts — allowing them to align stock and cash flow with demand curves rather than react to them.",
          "Talk to your account manager about the 2026 planning pack, or request one directly from our sales team."
        ]
      }
    ]
  },
  {
    id: 'post-4',
    title: 'Nigson Properties breaks ground on Periwinkle',
    slug: 'periwinkle-groundbreaking',
    tag: 'Announcement',
    author: 'Nigson Communications',
    date: 'Apr 2026',
    status: 'Published',
    excerpt: '9-unit mixed residential development kicks off in Lekki.',
    image: '/assets/blog-groundbreak.jpg',
    body: `Nigson Properties Limited has officially broken ground on Periwinkle — a 9-unit mixed residential development in Lekki, comprising eight 3-bedroom units and a signature 4-bedroom pent-floor with BQ.

### What we are building
- Eight 3-bedroom units and one 4-bedroom pent-floor with BQ
- Premium finishes and smart-home readiness
- Dedicated solar and inverter power
- Generous shared amenities

### Timeline and next steps
Construction is scheduled for 18 months, with a target handover of Q4 2027. Early buyer registrations are open — units at ground-breaking pricing are available on a first-come basis.

Contact our Properties team to arrange a private walkthrough of the plans and pricing.`,
    sections: [
      {
        paragraphs: [
          "Nigson Properties Limited has officially broken ground on Periwinkle — a 9-unit mixed residential development in Lekki, comprising eight 3-bedroom units and a signature 4-bedroom pent-floor with BQ."
        ]
      },
      {
        heading: "What we are building",
        bullets: [
          "Eight 3-bedroom units and one 4-bedroom pent-floor with BQ",
          "Premium finishes and smart-home readiness",
          "Dedicated solar and inverter power",
          "Generous shared amenities"
        ]
      },
      {
        heading: "Timeline and next steps",
        paragraphs: [
          "Construction is scheduled for 18 months, with a target handover of Q4 2027. Early buyer registrations are open — units at ground-breaking pricing are available on a first-come basis.",
          "Contact our Properties team to arrange a private walkthrough of the plans and pricing."
        ]
      }
    ]
  },
  {
    id: 'post-5',
    title: 'How to spot counterfeit power banks',
    slug: 'spot-counterfeit-power-banks',
    tag: 'Guide',
    author: 'Nigson Quality Assurance',
    date: 'Mar 2026',
    status: 'Published',
    excerpt: 'A quick checklist for retailers to protect their customers.',
    image: '/assets/blog-counterfeit.jpg',
    body: `Counterfeit power banks aren't just a margin problem — they're a safety hazard. Here's the quick checklist we train every Nigson retailer to run before accepting stock.

### The four-point checklist
- Weight test: a 20,000mAh unit under 350g is almost certainly under-rated or filled with sand/paper.
- Charge cycle: a genuine 10,000mAh unit should recharge a 4,000mAh phone at least twice.
- Print quality: crisp printing, aligned USB ports, matched serial numbers on box, unit and certificate.
- Certification: SONCAP, CE and RoHS marks, plus a scannable QR authenticity code.

### When in doubt
Buy from an authorised Nigson distributor. Our supply chain guarantees genuine cells, tested to spec, every cycle.`,
    sections: [
      {
        paragraphs: [
          "Counterfeit power banks aren't just a margin problem — they're a safety hazard. Here's the quick checklist we train every Nigson retailer to run before accepting stock."
        ]
      },
      {
        heading: "The four-point checklist",
        bullets: [
          "Weight test: a 20,000mAh unit under 350g is almost certainly under-rated or filled with sand/paper.",
          "Charge cycle: a genuine 10,000mAh unit should recharge a 4,000mAh phone at least twice.",
          "Print quality: crisp printing, aligned USB ports, matched serial numbers on box, unit and certificate.",
          "Certification: SONCAP, CE and RoHS marks, plus a scannable QR authenticity code."
        ]
      },
      {
        heading: "When in doubt",
        paragraphs: [
          "Buy from an authorised Nigson distributor. Our supply chain guarantees genuine cells, tested to spec, every cycle."
        ]
      }
    ]
  }
];

@Component({
  selector: 'app-admin-blog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AdminHeadingComponent,
    LucidePlus,
    LucidePencil,
    LucideTrash2,
    LucideGlobe,
    LucideFileText,
    LucideExternalLink,
    LucideX,
    LucideCheckCircle2,
    LucideSearch,
    LucideEye,
    LucideList,
    LucideHeading
  ],
  template: `
    <!-- Top notification banner -->
    <div *ngIf="toastMessage()" class="fixed top-20 right-8 z-50 flex items-center gap-3 rounded-xl bg-emerald-600 px-5 py-3 text-white shadow-2xl transition-all">
      <svg lucideCheckCircle2 class="h-5 w-5 shrink-0"></svg>
      <span class="text-sm font-semibold">{{ toastMessage() }}</span>
    </div>

    <lib-admin-heading title="Blog Posts" subtitle="Write and manage articles. Add a new post to appear in Insights.">
      <button
        (click)="openCreateModal()"
        class="flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow"
      >
        <svg lucidePlus class="h-4 w-4"></svg> New Post
      </button>
    </lib-admin-heading>

    <div class="rounded-2xl border border-hairline bg-white shadow-sm overflow-hidden mt-4">
      <!-- Search and Filter bar -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-hairline p-4 bg-surface/50">
        <div class="relative flex-1 w-full sm:max-w-md">
          <svg lucideSearch class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"></svg>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by title, tag, slug, or content..."
            class="w-full rounded-xl border border-hairline bg-white py-2 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <!-- Filter tabs -->
        <div class="flex items-center gap-1 rounded-xl bg-surface-alt p-1 text-xs font-semibold">
          <button
            (click)="statusFilter.set('ALL')"
            [class]="statusFilter() === 'ALL' ? 'rounded-lg bg-white px-3 py-1.5 text-ink shadow-sm' : 'rounded-lg px-3 py-1.5 text-muted-ink hover:text-ink'"
          >
            All ({{ posts().length }})
          </button>
          <button
            (click)="statusFilter.set('Published')"
            [class]="statusFilter() === 'Published' ? 'rounded-lg bg-white px-3 py-1.5 text-emerald-600 shadow-sm' : 'rounded-lg px-3 py-1.5 text-muted-ink hover:text-emerald-600'"
          >
            Published
          </button>
          <button
            (click)="statusFilter.set('Draft')"
            [class]="statusFilter() === 'Draft' ? 'rounded-lg bg-white px-3 py-1.5 text-amber-600 shadow-sm' : 'rounded-lg px-3 py-1.5 text-muted-ink hover:text-amber-600'"
          >
            Draft
          </button>
        </div>
      </div>

      <!-- Posts Table -->
      <div class="overflow-x-auto">
        <table class="w-full min-w-[760px] text-left text-sm text-ink">
          <thead class="border-b border-hairline bg-surface-alt/50 text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-4">Article</th>
              <th class="px-6 py-4">Tag</th>
              <th class="px-6 py-4">Author</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-hairline">
            <tr
              *ngFor="let p of filteredPosts()"
              class="group transition-colors hover:bg-surface-alt/40 cursor-pointer"
              (click)="openEditModal(p)"
            >
              <!-- Thumbnail + Title + Excerpt -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3.5">
                  <div class="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-alt border border-hairline shadow-2xs">
                    <img
                      [src]="p.image || '/assets/blog-market.jpg'"
                      [alt]="p.title"
                      class="h-full w-full object-cover transition-transform group-hover:scale-105"
                      (error)="handleImageError($event)"
                    />
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-ink group-hover:text-brand transition-colors line-clamp-1">{{ p.title }}</p>
                    <p class="text-xs text-muted-ink line-clamp-1 mt-0.5">{{ p.excerpt }}</p>
                    <span class="text-[11px] text-gray-400 font-mono">/insights/{{ p.slug }}</span>
                  </div>
                </div>
              </td>

              <!-- Tag -->
              <td class="px-6 py-4 whitespace-nowrap" (click)="$event.stopPropagation()">
                <span
                  class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  [ngClass]="{
                    'bg-blue-50 text-blue-700': p.tag === 'Product Update',
                    'bg-emerald-50 text-emerald-700': p.tag === 'Guide',
                    'bg-amber-50 text-amber-700': p.tag === 'Announcement',
                    'bg-purple-50 text-purple-700': p.tag === 'Industry',
                    'bg-gray-100 text-gray-700': !['Product Update', 'Guide', 'Announcement', 'Industry'].includes(p.tag)
                  }"
                >
                  {{ p.tag }}
                </span>
              </td>

              <!-- Author -->
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink" (click)="$event.stopPropagation()">
                {{ p.author }}
              </td>

              <!-- Date -->
              <td class="px-6 py-4 whitespace-nowrap text-xs text-muted-ink font-medium" (click)="$event.stopPropagation()">
                {{ p.date }}
              </td>

              <!-- Status Toggle -->
              <td class="px-6 py-4 whitespace-nowrap" (click)="$event.stopPropagation()">
                <button
                  type="button"
                  (click)="toggleStatus(p)"
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all hover:scale-105"
                  [ngClass]="p.status === 'Published' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'"
                  [title]="'Click to toggle status (currently ' + p.status + ')'"
                >
                  <svg *ngIf="p.status === 'Published'" lucideGlobe class="h-3.5 w-3.5"></svg>
                  <svg *ngIf="p.status === 'Draft'" lucideFileText class="h-3.5 w-3.5"></svg>
                  <span>{{ p.status }}</span>
                </button>
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 text-right whitespace-nowrap" (click)="$event.stopPropagation()">
                <div class="flex items-center justify-end gap-1.5">
                  <!-- View on site button -->
                  <a
                    [href]="'/insights/' + p.slug"
                    target="_blank"
                    class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-surface-alt hover:text-ink"
                    title="Open Article on Website"
                  >
                    <svg lucideExternalLink class="h-4 w-4"></svg>
                  </a>

                  <!-- Edit button -->
                  <button
                    (click)="openEditModal(p)"
                    class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-brand/10 hover:text-brand"
                    title="Edit / Open Post"
                  >
                    <svg lucidePencil class="h-4 w-4"></svg>
                  </button>

                  <!-- Delete button -->
                  <button
                    (click)="delete(p.id)"
                    class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink transition-colors hover:bg-rose-100 hover:text-rose-600"
                    title="Delete Post"
                  >
                    <svg lucideTrash2 class="h-4 w-4"></svg>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr *ngIf="filteredPosts().length === 0">
              <td colspan="6" class="p-12 text-center text-muted-ink">
                <svg lucideFileText class="mx-auto h-10 w-10 text-gray-300 mb-2"></svg>
                <p class="font-medium text-sm">No blog posts found matching your criteria.</p>
                <button
                  (click)="resetToDefaults()"
                  class="mt-3 text-xs font-semibold text-brand hover:underline"
                >
                  Reset to Insights Defaults
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL / POST EDITOR DIALOG -->
    <div
      *ngIf="isModalOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
      (click)="closeModal()"
    >
      <div
        class="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-hairline"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between border-b border-hairline px-6 py-4 bg-surface/50">
          <div>
            <h2 class="text-xl font-bold text-ink">{{ isEditing() ? 'Edit Article' : 'Create New Article' }}</h2>
            <p class="text-xs text-muted-ink mt-0.5">Manage article content, section headings, and bullet points for the Insights page.</p>
          </div>
          <div class="flex items-center gap-2">
            <!-- Mode Switcher: Write vs Preview -->
            <div class="flex items-center bg-surface-alt rounded-lg p-0.5 text-xs font-semibold mr-2">
              <button
                type="button"
                (click)="editorTab.set('write')"
                [class]="editorTab() === 'write' ? 'bg-white text-ink shadow-2xs rounded-md px-3 py-1' : 'text-muted-ink hover:text-ink px-3 py-1'"
              >
                Write Content
              </button>
              <button
                type="button"
                (click)="editorTab.set('preview')"
                [class]="editorTab() === 'preview' ? 'bg-white text-ink shadow-2xs rounded-md px-3 py-1' : 'text-muted-ink hover:text-ink px-3 py-1'"
              >
                Live Preview
              </button>
            </div>

            <a
              *ngIf="editingPost.slug"
              [href]="'/insights/' + editingPost.slug"
              target="_blank"
              class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline mr-2"
            >
              <svg lucideExternalLink class="h-3.5 w-3.5"></svg> View on Site
            </a>
            <button
              (click)="closeModal()"
              class="grid h-8 w-8 place-items-center rounded-lg text-muted-ink hover:bg-surface-alt hover:text-ink transition-colors"
            >
              <svg lucideX class="h-5 w-5"></svg>
            </button>
          </div>
        </div>

        <!-- Modal Form Body (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-6 space-y-5">
          <!-- WRITE TAB -->
          <ng-container *ngIf="editorTab() === 'write'">
            <!-- Title & Slug -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Title *</label>
                <input
                  type="text"
                  [(ngModel)]="editingPost.title"
                  (ngModelChange)="onTitleChange($event)"
                  placeholder="e.g. Launching the GaN 100W adapter across Nigeria"
                  class="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium"
                />
              </div>
              <div>
                <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Slug (URL path) *</label>
                <input
                  type="text"
                  [(ngModel)]="editingPost.slug"
                  placeholder="e.g. launching-gan-100w"
                  class="w-full rounded-xl border border-hairline bg-white px-3.5 py-2.5 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 font-mono"
                />
              </div>
            </div>

            <!-- Tag, Author, Date, Status -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Category / Tag</label>
                <select
                  [(ngModel)]="editingPost.tag"
                  class="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  <option value="Industry">Industry</option>
                  <option value="Product Update">Product Update</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Guide">Guide</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Author</label>
                <input
                  type="text"
                  [(ngModel)]="editingPost.author"
                  placeholder="e.g. Nigson Product Team"
                  class="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Date</label>
                <input
                  type="text"
                  [(ngModel)]="editingPost.date"
                  placeholder="e.g. Jun 2026"
                  class="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  [(ngModel)]="editingPost.status"
                  class="w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  [ngClass]="editingPost.status === 'Published' ? 'text-emerald-700' : 'text-amber-700'"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <!-- Cover Image & Quick Picker -->
            <div>
              <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Cover Image URL</label>
              <div class="flex gap-3 items-center">
                <input
                  type="text"
                  [(ngModel)]="editingPost.image"
                  placeholder="/assets/blog-gan.jpg"
                  class="flex-1 rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 font-mono"
                />
                <div class="h-10 w-16 shrink-0 overflow-hidden rounded-xl border border-hairline bg-surface-alt shadow-2xs">
                  <img
                    [src]="editingPost.image || '/assets/blog-market.jpg'"
                    alt="Preview"
                    class="h-full w-full object-cover"
                    (error)="handleImageError($event)"
                  />
                </div>
              </div>
              <!-- Preset image selectors -->
              <div class="flex flex-wrap items-center gap-2 mt-2">
                <span class="text-xs text-muted-ink">Preset images:</span>
                <button
                  type="button"
                  *ngFor="let img of presetImages"
                  (click)="editingPost.image = img.url"
                  class="rounded-lg border border-hairline px-2.5 py-1 text-[11px] font-medium transition-all hover:border-brand hover:text-brand"
                  [class.bg-brand/10]="editingPost.image === img.url"
                  [class.text-brand]="editingPost.image === img.url"
                >
                  {{ img.label }}
                </button>
              </div>
            </div>

            <!-- Excerpt -->
            <div>
              <label class="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">Excerpt / Summary *</label>
              <textarea
                [(ngModel)]="editingPost.excerpt"
                rows="2"
                placeholder="Short summary shown on the Insights card (e.g. Our new 4-port GaN charger is now available to distributors nationwide.)..."
                class="w-full rounded-xl border border-hairline bg-white px-3.5 py-2 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              ></textarea>
            </div>

            <!-- Full Content / Body with Headings & Bullets Toolbar -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-bold text-ink uppercase tracking-wider">
                  Article Content (with Headings & Bullet points) *
                </label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="insertHeading()"
                    class="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted-ink hover:text-ink hover:bg-surface-alt"
                  >
                    <svg lucideHeading class="h-3 w-3"></svg> + Section Heading
                  </button>
                  <button
                    type="button"
                    (click)="insertBullet()"
                    class="inline-flex items-center gap-1 rounded-lg border border-hairline bg-surface px-2 py-0.5 text-[11px] font-semibold text-muted-ink hover:text-ink hover:bg-surface-alt"
                  >
                    <svg lucideList class="h-3 w-3"></svg> + Bullet Point
                  </button>
                </div>
              </div>

              <textarea
                #contentTextarea
                [(ngModel)]="editingPost.body"
                rows="12"
                placeholder="Write full article here. Use '### Heading' for sections and '- Bullet point' for list items..."
                class="w-full rounded-xl border border-hairline bg-white p-4 text-xs font-mono text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 leading-relaxed"
              ></textarea>
              <p class="mt-1 text-[11px] text-muted-ink">
                <strong>Formatting guide:</strong> Use <code>### Heading Name</code> for section titles, <code>- Item</code> for bullet points, and blank lines to separate paragraphs.
              </p>
            </div>
          </ng-container>

          <!-- LIVE PREVIEW TAB -->
          <ng-container *ngIf="editorTab() === 'preview'">
            <div class="rounded-2xl border border-hairline bg-white p-6 sm:p-8 space-y-6">
              <div class="flex flex-wrap items-center gap-3 text-xs">
                <span class="rounded-full bg-brand/10 px-3 py-1 font-semibold text-brand uppercase tracking-widest">
                  {{ editingPost.tag || 'Industry' }}
                </span>
                <span class="text-muted-ink">{{ editingPost.date }}</span>
                <span class="text-muted-ink">&bull;</span>
                <span class="text-muted-ink">By {{ editingPost.author || 'Nigson Team' }}</span>
              </div>

              <h1 class="text-3xl font-extrabold text-ink leading-tight tracking-tight">
                {{ editingPost.title || 'Untitled Article' }}
              </h1>

              <p class="text-lg text-muted-ink italic border-l-4 border-brand pl-4">
                {{ editingPost.excerpt || 'No summary excerpt provided.' }}
              </p>

              <div class="aspect-[16/9] max-h-72 overflow-hidden rounded-2xl bg-surface-alt">
                <img
                  [src]="editingPost.image || '/assets/blog-market.jpg'"
                  [alt]="editingPost.title"
                  class="h-full w-full object-cover"
                />
              </div>

              <!-- Rendered Sections with Headings & Bullets -->
              <div class="space-y-6 pt-4 border-t border-hairline">
                <ng-container *ngFor="let s of previewSections()">
                  <div class="space-y-3">
                    <h2 *ngIf="s.heading" class="text-2xl font-bold text-ink tracking-tight">
                      {{ s.heading }}
                    </h2>
                    <p *ngFor="let p of s.paragraphs" class="text-base text-ink/85 leading-relaxed">
                      {{ p }}
                    </p>
                    <ul *ngIf="s.bullets?.length" class="space-y-2 pl-2">
                      <li *ngFor="let b of s.bullets" class="flex items-start gap-3 text-base text-ink/85 leading-relaxed">
                        <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"></span>
                        <span>{{ b }}</span>
                      </li>
                    </ul>
                  </div>
                </ng-container>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between border-t border-hairline px-6 py-4 bg-surface/50">
          <button
            type="button"
            (click)="closeModal()"
            class="rounded-xl border border-hairline px-5 py-2.5 text-sm font-semibold text-muted-ink hover:bg-surface-alt hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="savePost()"
              class="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow"
            >
              <svg lucideCheckCircle2 class="h-4 w-4"></svg>
              <span>{{ isEditing() ? 'Save Changes' : 'Create Article' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminBlogComponent {
  searchQuery = signal('');
  statusFilter = signal<'ALL' | 'Published' | 'Draft'>('ALL');
  toastMessage = signal<string | null>(null);

  posts = signal<AdminBlogPost[]>([]);
  private http = inject(HttpClient);

  // Modal State
  isModalOpen = signal(false);
  isEditing = signal(false);
  editorTab = signal<'write' | 'preview'>('write');
  editingPost: AdminBlogPost = this.createEmptyPost();

  presetImages = [
    { label: 'Market / Accessories', url: '/assets/blog-market.jpg' },
    { label: 'GaN 100W Charger', url: '/assets/blog-gan.jpg' },
    { label: 'Periwinkle / Construction', url: '/assets/blog-groundbreak.jpg' },
    { label: 'Power Banks / Inspection', url: '/assets/blog-counterfeit.jpg' }
  ];

  constructor() {
    this.load();
  }

  createEmptyPost(): AdminBlogPost {
    return {
      id: 'post-' + Date.now(),
      title: '',
      slug: '',
      tag: 'Industry',
      author: 'Nigson Team',
      date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      status: 'Published',
      excerpt: '',
      image: '/assets/blog-market.jpg',
      body: ''
    };
  }

  load() {
    // 1. Try loading from localStorage first
    try {
      const raw = localStorage.getItem('nigson.admin.v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.posts) && parsed.posts.length > 0) {
          // Check if it's the old 2 dummy posts or missing structured headings
          const hasInsightsContent = parsed.posts.some((p: any) => p.slug === 'launching-gan-100w' && p.body?.includes('###'));
          if (hasInsightsContent && parsed.posts.length >= 5) {
            this.posts.set(parsed.posts);
          }
        }
      }
    } catch {}

    // 2. Fetch from PostgreSQL database bridge
    this.http.get<AdminBlogPost[]>('http://localhost:8085/api/v1/content/store/blog_posts').pipe(
      catchError(() => of(null))
    ).subscribe(data => {
      if (Array.isArray(data) && data.length > 0 && data.some(p => p.body?.includes('###'))) {
        this.posts.set(data);
        this.syncLocalStorage(data);
      } else {
        // Seed default 5 posts matching the Insights page with full headings and bullets
        this.resetToDefaults();
      }
    });
  }

  resetToDefaults() {
    this.posts.set([...DEFAULT_POSTS]);
    this.saveAll();
    this.showToast('Reset to 5 Insights articles with headings & bullets');
  }

  syncLocalStorage(posts: AdminBlogPost[]) {
    try {
      const raw = localStorage.getItem('nigson.admin.v2') || '{}';
      const parsed = JSON.parse(raw);
      parsed.posts = posts;
      localStorage.setItem('nigson.admin.v2', JSON.stringify(parsed));
    } catch {}
  }

  saveAll() {
    const allPosts = this.posts();
    this.syncLocalStorage(allPosts);

    // Persist to PostgreSQL via database bridge
    this.http.post('http://localhost:8085/api/v1/content/store/blog_posts', allPosts).pipe(
      catchError(() => of(null))
    ).subscribe();
  }

  showToast(message: string) {
    this.toastMessage.set(message);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 3500);
  }

  filteredPosts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();

    return this.posts().filter(p => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q) ||
        (p.tag || '').toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.body || '').toLowerCase().includes(q);

      const matchesStatus = filter === 'ALL' || p.status === filter;

      return matchesSearch && matchesStatus;
    });
  });

  previewSections = computed(() => {
    return parseMarkdownToSections(this.editingPost.body || '');
  });

  // Modal open handlers
  openCreateModal() {
    this.isEditing.set(false);
    this.editorTab.set('write');
    this.editingPost = this.createEmptyPost();
    this.isModalOpen.set(true);
  }

  openEditModal(post: AdminBlogPost) {
    this.isEditing.set(true);
    this.editorTab.set('write');
    // Clone post to prevent mutating directly before save
    this.editingPost = {
      ...post,
      image: post.image || '/assets/blog-market.jpg',
      body: post.body || post.excerpt || ''
    };
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onTitleChange(title: string) {
    if (!this.isEditing() && title) {
      this.editingPost.slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
  }

  insertHeading() {
    const snippet = '\n\n### New Section Heading\nSection content goes here.\n';
    this.editingPost.body = (this.editingPost.body || '') + snippet;
  }

  insertBullet() {
    const snippet = '\n- Bullet point detail item';
    this.editingPost.body = (this.editingPost.body || '') + snippet;
  }

  savePost() {
    if (!this.editingPost.title.trim()) {
      alert('Please enter a title for the post.');
      return;
    }

    if (!this.editingPost.slug.trim()) {
      this.editingPost.slug = this.editingPost.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (!this.editingPost.excerpt.trim()) {
      this.editingPost.excerpt = this.editingPost.body
        ? this.editingPost.body.split('\n')[0].replace(/^#{1,4}\s+/, '').slice(0, 120) + '...'
        : 'Article from Nigson.';
    }

    // Automatically parse sections so both formats are saved
    const parsedSections = parseMarkdownToSections(this.editingPost.body || '');
    const currentPost: AdminBlogPost = {
      ...this.editingPost,
      sections: parsedSections
    };

    if (this.isEditing()) {
      this.posts.update(ps => ps.map(p => p.id === currentPost.id ? currentPost : p));
      this.showToast(`Updated "${currentPost.title}"`);
    } else {
      this.posts.update(ps => [currentPost, ...ps]);
      this.showToast(`Created new article "${currentPost.title}"`);
    }

    this.saveAll();
    this.closeModal();
  }

  delete(id: string) {
    const postToDelete = this.posts().find(p => p.id === id);
    const title = postToDelete ? `"${postToDelete.title}"` : 'this post';

    if (confirm(`Are you sure you want to delete ${title}?`)) {
      this.posts.update(ps => ps.filter(p => p.id !== id));
      this.saveAll();
      this.showToast('Post deleted');
    }
  }

  toggleStatus(p: AdminBlogPost) {
    const nextStatus: 'Published' | 'Draft' = p.status === 'Published' ? 'Draft' : 'Published';
    this.posts.update(ps => ps.map(x => x.id === p.id ? { ...x, status: nextStatus } : x));
    this.saveAll();
    this.showToast(`Post marked as ${nextStatus}`);
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && !img.src.includes('blog-market.jpg')) {
      img.src = '/assets/blog-market.jpg';
    }
  }
}
