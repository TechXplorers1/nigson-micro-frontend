import { Component, HostListener, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideMessageCircle, LucideBot, LucideX, LucideSend, LucideArrowUp } from '@lucide/angular';

type Msg = { role: 'user' | 'bot'; text: string };
const QUICK = ["Wholesale pricing", "Product catalog", "Become distributor", "Contact us"];

function botReply(input: string): string {
  const q = input.toLowerCase();
  if (/(price|pricing|cost|quote|wholesale)/.test(q))
    return "For wholesale pricing, request a quote via our Quote form or WhatsApp us at +234 807 346 7809 - replies within 24 hours.";
  if (/(distribut|dealer|reseller|partner)/.test(q))
    return "Great! Distributors enjoy exclusive pricing, marketing support and reliable supply. Head to the Distributor page and submit the application form.";
  if (/(product|catalog|earbud|power ?bank|charger|cable|adapter|fmcg)/.test(q))
    return "You'll find our full range - earbuds, power banks, GaN chargers, cables, adapters and FMCG - on the Products page. Use the search or category chips to narrow down.";
  if (/(contact|call|phone|email|whatsapp|reach)/.test(q))
    return "You can reach us on WhatsApp at +234 807 346 7809, or via the Contact page for email and office details.";
  if (/(hi|hello|hey|good\s*(morning|afternoon|evening))/.test(q))
    return "Hi there! 👋 I'm the Nigson assistant. Ask me about products, pricing or distribution.";
  if (/(thank|thanks)/.test(q)) return "You're welcome! Anything else I can help with?";
  return "Thanks for your message. Our team will assist you - try asking about pricing, products or distributor programs. You can also WhatsApp us at +234 807 346 7809.";
}

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideMessageCircle, LucideBot, LucideX, LucideSend, LucideArrowUp],
  template: `
    <!-- Back to Top Button -->
    <button
      (click)="scrollToTop()"
      aria-label="Back to Top"
      class="fixed bottom-6 right-6 z-40 grid h-12 w-12 place-items-center rounded-full bg-white border border-hairline text-ink shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] hover:bg-brand hover:text-white hover:border-brand transition-all duration-300"
      [ngClass]="showTopBtn() ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'"
    >
      <svg lucideArrowUp class="h-5 w-5"></svg>
    </button>

    <!-- AI Assistant -->
    <button
      (click)="aiOpen.set(!aiOpen())"
      aria-label="AI Assistant"
      class="fixed bottom-24 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] hover:bg-brand transition-colors"
    >
      <svg *ngIf="!aiOpen()" lucideMessageCircle class="h-6 w-6"></svg>
      <svg *ngIf="aiOpen()" lucideX class="h-6 w-6"></svg>
    </button>

    <div *ngIf="aiOpen()" class="fixed bottom-44 right-6 z-40 w-[340px] rounded-2xl bg-white border border-hairline shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] overflow-hidden animate-fade-up">
      <div class="bg-ink text-white px-5 py-4 flex items-center gap-2.5">
        <span class="grid h-8 w-8 place-items-center rounded-full bg-brand">
          <svg lucideBot class="h-4 w-4"></svg>
        </span>
        <div>
          <p class="text-sm font-semibold">Nigson Assistant</p>
          <p class="text-[11px] text-white/60">Ask about products, pricing, distribution</p>
        </div>
      </div>
      
      <div #scrollRef class="p-4 space-y-3 max-h-[280px] overflow-y-auto">
        <div *ngFor="let m of msgs()"
             class="rounded-2xl px-4 py-2.5 text-sm max-w-[85%]"
             [ngClass]="m.role === 'bot' ? 'rounded-tl-sm bg-surface-alt text-ink' : 'ml-auto rounded-tr-sm bg-brand text-white'">
          {{ m.text }}
        </div>
        
        <div *ngIf="msgs().length <= 1" class="grid grid-cols-2 gap-2 pt-1">
          <button
            *ngFor="let q of quick"
            (click)="send(q)"
            class="text-xs font-medium text-left rounded-lg border border-hairline px-3 py-2 hover:border-brand hover:text-brand transition-colors"
          >
            {{ q }}
          </button>
        </div>
      </div>
      
      <form (submit)="onSubmit($event)" class="border-t border-hairline p-3 flex gap-2">
        <input
          type="text"
          [(ngModel)]="input"
          name="chatInput"
          placeholder="Type your question..."
          class="flex-1 rounded-full border border-hairline bg-white px-4 py-2 text-sm focus:outline-none focus:border-brand"
        />
        <button
          type="submit"
          class="grid h-9 w-9 place-items-center rounded-full bg-brand text-white hover:bg-brand-deep transition-colors"
        >
          <svg lucideSend class="h-4 w-4"></svg>
        </button>
      </form>
    </div>
  `
})
export class FloatingActionsComponent {
  aiOpen = signal(false);
  showTopBtn = signal(false);
  msgs = signal<Msg[]>([
    { role: 'bot', text: "Hi 👋 I'm your Nigson assistant. How can I help you today?" }
  ]);
  input = '';
  quick = QUICK;

  @ViewChild('scrollRef') scrollRef?: ElementRef<HTMLDivElement>;

  constructor() {
    effect(() => {
      // scroll when msgs update or modal opens
      const currentMsgs = this.msgs();
      const isOpen = this.aiOpen();
      setTimeout(() => {
        if (this.scrollRef?.nativeElement) {
          this.scrollRef.nativeElement.scrollTo({
            top: this.scrollRef.nativeElement.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.showTopBtn.set(window.scrollY > 250);
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmit(e: Event) {
    e.preventDefault();
    this.send(this.input);
  }

  send(text: string) {
    const t = text.trim();
    if (!t) return;
    
    this.msgs.update(m => [...m, { role: 'user', text: t }]);
    this.input = '';
    
    setTimeout(() => {
      this.msgs.update(m => [...m, { role: 'bot', text: botReply(t) }]);
    }, 450);
  }
}
