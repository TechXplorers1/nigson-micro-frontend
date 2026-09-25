import { Component, computed, inject, signal, OnInit, effect, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CmsService, PageContent, SectionContent, SectionDef } from 'shared-ui';
import { LucidePlus, LucidePencil, LucideTrash2, LucideGlobe, LucideFileText, LucideSave, LucideEye, LucideEyeOff, LucideGripVertical, LucideCheckCircle2, LucideChevronRight, LucidePanelTop, LucideSparkles, LucideGrid3x3, LucideFlame, LucideBuilding2, LucideTag, LucideTrendingUp, LucideShieldCheck, LucideMessageSquareQuote, LucideBriefcase, LucidePanelBottom, LucideExternalLink } from '@lucide/angular';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-visual-home-editor',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    LucidePlus, LucidePencil, LucideTrash2, LucideGlobe, LucideFileText, LucideSave, LucideEye, LucideEyeOff, LucideGripVertical, LucideCheckCircle2, LucideChevronRight,
    LucidePanelTop, LucideSparkles, LucideGrid3x3, LucideFlame, LucideBuilding2, LucideTag, LucideTrendingUp, LucideShieldCheck, LucideMessageSquareQuote, LucideBriefcase, LucidePanelBottom
  ],
  template: `
    <div class="fixed inset-0 z-50 flex flex-col bg-[#f0f2f5] font-sans antialiased select-none">
      <!-- TOP TOOLBAR -->
      <header class="z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5 shadow-sm">
        <div class="flex items-center gap-4">
          <a routerLink="/admin/pages" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            &larr;
          </a>
          <div class="h-6 w-px bg-gray-200"></div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-[15px] font-semibold text-gray-900">{{ pageDef()?.name || 'Page' }}</h1>
              <span class="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">DRAFT</span>
              <span *ngIf="isDirty()" class="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">UNSAVED CHANGES</span>
            </div>
            <a [href]="pageDef()?.path" target="_blank" class="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-600 transition-colors">
              nigson.com{{ pageDef()?.path }} <svg lucideExternalLink class="h-3 w-3"></svg>
            </a>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex items-center rounded-lg bg-gray-100 p-1">
            <button (click)="previewMode.set(false)" [class.bg-white]="!previewMode()" [class.shadow-sm]="!previewMode()" class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all">
              <svg lucidePencil class="h-3.5 w-3.5"></svg> Edit
            </button>
            <button (click)="previewMode.set(true)" [class.bg-white]="previewMode()" [class.shadow-sm]="previewMode()" class="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all">
              <svg lucideEye class="h-3.5 w-3.5"></svg> Preview
            </button>
          </div>

          <div class="h-6 w-px bg-gray-200"></div>

          <button (click)="handleSaveDraft()" [disabled]="isSaving()" class="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50">
            <svg lucideSave class="h-4 w-4" [class.animate-pulse]="isSaving()"></svg>
            {{ isSaving() ? 'Saving...' : 'Save Draft' }}
          </button>
          
          <button class="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition-all">
            <svg lucideGlobe class="h-4 w-4"></svg> Publish
          </button>
        </div>
      </header>

      <!-- MAIN EDITOR WORKSPACE -->
      <div class="flex flex-1 overflow-hidden relative">
        
        <!-- LEFT SIDEBAR: Layers/Sections -->
        <aside class="z-20 flex w-72 shrink-0 flex-col border-r border-gray-200 bg-white transition-all duration-300">
          <div class="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
            <h2 class="text-sm font-bold text-gray-900">Page Sections</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto p-3 space-y-1">
            <button 
              *ngFor="let section of activeSections(); let i = index"
              (click)="selectedSectionId.set(section.id)"
              [class.bg-blue-50]="selectedSectionId() === section.id"
              [class.text-blue-700]="selectedSectionId() === section.id"
              [class.text-gray-700]="selectedSectionId() !== section.id"
              class="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-center gap-3">
                <svg lucideGripVertical class="h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100"></svg>
                <div class="flex items-center gap-2.5">
                  <span class="truncate">{{ getSectionTitle(section.id) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button (click)="$event.stopPropagation(); toggleVisible(section.id)" class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors">
                  <svg *ngIf="section.visible" lucideEye class="h-3.5 w-3.5"></svg>
                  <svg *ngIf="!section.visible" lucideEyeOff class="h-3.5 w-3.5"></svg>
                </button>
              </div>
            </button>
          </div>
        </aside>

        <!-- CENTER: Canvas / Iframe Preview -->
        <main class="relative flex flex-1 flex-col items-center overflow-y-auto bg-gray-50 p-8">
          <div class="relative w-full max-w-[1200px] overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 transition-all duration-300" style="min-height: 800px;">
            <iframe *ngIf="previewUrl()" [src]="previewUrl()" class="h-full w-full border-0 min-h-[800px]"></iframe>
          </div>
        </main>

        <!-- RIGHT SIDEBAR: Contextual Editor -->
        <aside class="z-20 flex w-[380px] shrink-0 flex-col border-l border-gray-200 bg-white transition-all duration-300">
          <div class="flex h-14 shrink-0 items-center border-b border-gray-100 px-5">
            <h2 class="text-sm font-bold text-gray-900">Edit {{ getSectionTitle(selectedSectionId()) }}</h2>
          </div>
          <div class="flex-1 overflow-y-auto p-5">
            <div *ngIf="selectedSectionDef() as def">
              <p class="text-sm text-gray-500 mb-6">{{ def.note }}</p>
              
              <div class="space-y-5">
                <div *ngFor="let field of def.fields" class="space-y-1.5">
                  <label class="text-[11px] font-bold uppercase tracking-wider text-gray-500">{{ field.label }}</label>
                  
                  <input *ngIf="field.type === 'text' || field.type === 'link'"
                    type="text"
                    [value]="selectedSectionContent()?.fields?.[field.key] || ''"
                    (input)="setField(def.id, field.key, $any($event.target).value)"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                  
                  <textarea *ngIf="field.type === 'textarea'"
                    [value]="selectedSectionContent()?.fields?.[field.key] || ''"
                    (input)="setField(def.id, field.key, $any($event.target).value)"
                    rows="4"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  `
})
export class VisualHomeEditorComponent implements OnInit {
  cms = inject(CmsService);
  sanitizer = inject(DomSanitizer);
  route = inject(ActivatedRoute);
  
  pageId = signal<string>('home');
  selectedSectionId = signal<string>('hero');
  previewMode = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  previewUrl = signal<SafeResourceUrl | null>(null);

  pageDef = computed(() => this.cms.pageDef(this.pageId()));
  draft = computed(() => this.cms.drafts()[this.pageId()]);
  pub = computed(() => this.cms.published()[this.pageId()]);

  isDirty = computed(() => JSON.stringify(this.pub()?.sections) !== JSON.stringify(this.draft()?.sections));
  
  validSectionIds = computed(() => new Set(this.pageDef()?.sections.map((s: SectionDef) => s.id) || []));
  activeSections = computed(() => (this.draft()?.sections || []).filter((s: SectionContent) => this.validSectionIds().has(s.id)));

  selectedSectionDef = computed(() => this.pageDef()?.sections.find((s: SectionDef) => s.id === this.selectedSectionId()));
  selectedSectionContent = computed(() => this.draft()?.sections.find((s: SectionContent) => s.id === this.selectedSectionId()));

  constructor() {
    effect(() => {
      const def = this.pageDef();
      if (def) {
        const url = 'http://localhost:4200' + def.path + '?preview=true';
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        if (def.sections.length > 0) {
          this.selectedSectionId.set(def.sections[0].id);
        }
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    // Try ActivatedRoute first
    this.route.paramMap.subscribe(params => {
      const routeId = params.get('id');
      if (routeId) {
        this.pageId.set(routeId);
      } else {
        // Fallback: extract from URL if route injection gave us the parent route
        const parts = window.location.pathname.split('/');
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart !== 'pages') {
          this.pageId.set(lastPart);
        }
      }
    });
  }

  getSectionTitle(id: string): string {
    return this.pageDef()?.sections.find((s: SectionDef) => s.id === id)?.title || id;
  }

  setField(secId: string, key: string, value: string) {
    this.cms.updateDraft(this.pageId(), (p: PageContent) => ({
      ...p,
      sections: p.sections.map((s: SectionContent) => 
        s.id === secId ? { ...s, fields: { ...s.fields, [key]: value } } : s
      )
    }));
  }

  toggleVisible(secId: string) {
    this.cms.updateDraft(this.pageId(), (p: PageContent) => ({
      ...p,
      sections: p.sections.map((s: SectionContent) => 
        s.id === secId ? { ...s, visible: !s.visible } : s
      )
    }));
  }

  handleSaveDraft() {
    this.isSaving.set(true);
    setTimeout(() => {
      this.cms.saveDraft(this.pageId());
      this.isSaving.set(false);
    }, 500);
  }
}
