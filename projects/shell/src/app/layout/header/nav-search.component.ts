import { Component, ElementRef, ViewChild, HostListener, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-nav-search',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideSearch, LucideX],
  template: `
    <div class="relative w-full" #wrapRef>
      <div
        class="flex items-center transition-all duration-300 overflow-hidden h-10 rounded-md border"
        [ngClass]="{
          'bg-white border-hairline w-full': full,
          'bg-white border-brand shadow-sm': open() && !full,
          'bg-gray-100 border-transparent hover:bg-gray-200': !open() && !full
        }"
      >
        <button
          type="button"
          (click)="open() ? submit() : open.set(true)"
          class="grid h-10 w-10 shrink-0 place-items-center text-muted-ink hover:text-brand transition-colors"
        >
          <svg lucideSearch class="h-4 w-4"></svg>
        </button>

        <input
          #inputRef
          type="text"
          [(ngModel)]="query"
          (keydown.enter)="submit()"
          placeholder="Search products, SKU, category..."
          class="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none px-2"
        />

        <button
          *ngIf="query() || open()"
          type="button"
          (click)="clearOrClose()"
          class="grid h-10 w-10 shrink-0 place-items-center text-muted-ink hover:text-brand transition-colors"
        >
          <svg lucideX class="h-4 w-4"></svg>
        </button>
      </div>
    </div>
  `
})
export class NavSearchComponent {
  @Input() full = true;
  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('wrapRef') wrapRef!: ElementRef<HTMLDivElement>;

  open = signal(false);
  query = signal('');

  constructor(private router: Router) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.full && this.open() && !this.wrapRef.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.open.set(false);
  }

  clearOrClose() {
    if (this.query()) {
      this.query.set('');
      this.inputRef.nativeElement.focus();
    } else if (!this.full) {
      this.open.set(false);
    }
  }

  submit() {
    const term = this.query().trim();
    if (!term) {
      this.inputRef.nativeElement.focus();
      return;
    }
    this.open.set(false);
    this.query.set(''); // Clear search on submit just like the original React app
    this.router.navigate(['/search'], { queryParams: { q: term } });
  }
}
