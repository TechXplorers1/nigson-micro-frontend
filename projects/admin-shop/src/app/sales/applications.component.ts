import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone, StatCardComponent, distributorDisplayState } from 'shared-ui';
import { LucideSearch, LucideCheck, LucideX, LucideInfo } from '@lucide/angular';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, BadgeComponent, StatCardComponent, LucideSearch, LucideCheck, LucideX, LucideInfo],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <lib-admin-heading title="Distributor Applications" subtitle="Distributor, wholesaler and affiliate marketer partnership requests"></lib-admin-heading>
      <button (click)="refresh()" [disabled]="admin.loadingApplications()" class="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm hover:bg-gray-50 disabled:opacity-50">
        {{ admin.loadingApplications() ? 'Refreshing...' : 'Refresh from DB' }}
      </button>
    </div>
    <p *ngIf="admin.applicationError()" role="alert" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{{ admin.applicationError() }}</p>
    
    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total applications" [value]="admin.applications().length.toString()"></lib-stat-card>
      <lib-stat-card label="Pending" [value]="getStat('Pending').toString()"></lib-stat-card>
      <lib-stat-card label="Approved" [value]="getStat('Approved').toString()"></lib-stat-card>
      <lib-stat-card label="Rejected" [value]="getStat('Rejected').toString()"></lib-stat-card>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-100 flex gap-6">
      <button *ngFor="let t of ['Distributors', 'Wholesalers', 'Affiliate Marketers']"
              (click)="tab.set(t)"
              [class]="'pb-3 text-sm font-bold transition-all border-b-2 ' + (tab() === t ? 'border-brand text-brand' : 'border-transparent text-gray-400 hover:text-ink')">
        {{ t }}
      </button>
    </div>

    <div class="mb-5 flex flex-wrap gap-3">
      <div class="relative w-[320px]">
        <svg lucideSearch class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"></svg>
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search applications..." class="w-full rounded-full border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-ink shadow-sm outline-none transition-all focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
      </div>
      <select [(ngModel)]="statusFilter" class="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
        <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
      </select>
      <select [(ngModel)]="catFilter" class="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
        <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
      </select>
    </div>

    <div class="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left text-sm text-ink">
          <thead class="border-b border-gray-100 bg-white text-[10px] font-bold uppercase tracking-widest text-muted-ink">
            <tr>
              <th class="px-6 py-5">Application</th>
              <th class="px-6 py-5">Business</th>
              <th class="px-6 py-5">Contact</th>
              <th class="px-6 py-5">Location</th>
              <th class="px-6 py-5">Date</th>
              <th class="px-6 py-5">Status</th>
              <th class="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let a of filteredList()" class="transition-colors hover:bg-gray-50/50">
              <td class="px-6 py-4 whitespace-nowrap font-semibold">{{ a.number }}</td>
              <td class="px-6 py-4"><span class="font-semibold">{{ a.businessName }}</span><br><span class="text-xs text-muted-ink">{{ a.category }}</span></td>
              <td class="px-6 py-4">{{ a.contactPerson }}<br><span class="text-xs text-muted-ink">{{ a.email }}</span></td>
              <td class="px-6 py-4 text-muted-ink">{{ a.location }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-muted-ink">{{ a.date | date:'mediumDate' }}</td>
              <td class="px-6 py-4"><lib-badge [tone]="getTone(a.status)">{{ a.status }}</lib-badge></td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-1.5">
                  <button (click)="viewDetail(a)" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-brand/10 hover:text-brand hover:border-brand/30 transition-all shadow-sm" title="View Complete Details"><svg lucideInfo class="h-4 w-4"></svg></button>
                  <button (click)="setStatus(a.id, 'Approved')" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm" title="Approve"><svg lucideCheck class="h-3.5 w-3.5"></svg></button>
                  <button (click)="setStatus(a.id, 'Rejected')" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm" title="Reject"><svg lucideX class="h-3.5 w-3.5"></svg></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredList().length === 0">
              <td colspan="7" class="p-12 text-center text-muted-ink">
                {{ admin.loadingApplications() ? 'Loading partner applications from database...' : 'No applications match your filters.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div *ngIf="view()" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[24px] border border-gray-100 bg-white p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div class="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
          <div class="flex items-center gap-3">
            <div class="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
              <svg lucideInfo class="h-5 w-5"></svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-extrabold text-ink">Application {{ view().number }}</h2>
                <lib-badge [tone]="getTone(view().type)">{{ view().type }}</lib-badge>
              </div>
              <p class="text-xs text-muted-ink">Submitted on {{ view().date | date:'medium' }}</p>
            </div>
          </div>
          <button (click)="view.set(null)" class="grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
            <svg lucideX class="h-4 w-4"></svg>
          </button>
        </div>
        
        <div class="space-y-4 text-sm">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Business Name</p>
              <p class="mt-1 font-semibold text-ink">{{ view().businessName }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Current Status</p>
              <div class="mt-1">
                <lib-badge [tone]="getTone(view().status)">{{ view().status }}</lib-badge>
              </div>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Contact Person</p>
              <p class="mt-1 font-semibold text-ink">{{ view().contactPerson }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Email Address</p>
              <a [href]="'mailto:' + view().email" class="mt-1 block font-semibold text-brand hover:underline">{{ view().email }}</a>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Phone / WhatsApp</p>
              <p class="mt-1 font-semibold text-ink">{{ view().phone || 'Not provided' }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Location / Territory</p>
              <p class="mt-1 font-semibold text-ink">{{ view().location }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3 bg-surface-alt/40 sm:col-span-2">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Product Category / Focus</p>
              <p class="mt-1 font-semibold text-ink">{{ view().category }}</p>
            </div>
          </div>
          
          <!-- Full Submitted Application Details (Notes, Channels, Bank info, etc.) -->
          <div *ngIf="view().note">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink mb-1.5">Submitted Application Details</p>
            <div class="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 text-xs text-ink leading-relaxed whitespace-pre-wrap">
              {{ view().note }}
            </div>
          </div>

          <!-- Uploaded Proof Documents (Corporate Distributor) -->
          <div *ngIf="view().documents?.length">
            <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink mb-1.5">Verification Documents</p>
            <div class="space-y-2">
              <div *ngFor="let d of view().documents" class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-2.5 text-xs">
                <div>
                  <span class="font-bold text-ink">{{ d.type }}</span>
                  <span class="ml-2 font-mono text-[11px] text-muted-ink">{{ d.fileId }}</span>
                </div>
                <span class="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold">{{ d.scanStatus }}</span>
              </div>
            </div>
          </div>
          
          <div>
            <label class="mb-1.5 block text-xs font-bold uppercase tracking-widest text-muted-ink">Staff Reviewer Note</label>
            <textarea rows="2" [(ngModel)]="reviewerNote" placeholder="Add staff verification or assessment remarks..." class="w-full rounded-[16px] border border-gray-200 bg-white px-4 py-3 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"></textarea>
          </div>
          
          <p *ngIf="admin.applicationError()" role="alert" class="text-sm text-red-700">{{ admin.applicationError() }}</p>
          <ng-container *ngIf="view().type === 'Distributor'">
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="documentsVerified" /> I have reviewed the registration document</label>
            <p class="text-xs text-muted-ink">Approval requires prior verification (&quot;Under Review&quot;) and a different staff member from the reviewer. Market: {{ admin.distributorMarket()?.code || "Not configured" }}.</p>
          </ng-container>
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-muted-ink">Status:</span>
              <select [ngModel]="view().status" (ngModelChange)="setStatus(view().id, $event)" class="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
                <option *ngFor="let s of rawStatuses" [value]="s">{{ s }}</option>
              </select>
            </div>
            <div class="flex flex-wrap gap-2">
              <button *ngIf="view().status === 'Pending'" (click)="setStatus(view().id, 'Under Review')" class="rounded-full bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm transition-colors">Mark Under Review</button>
              <button (click)="setStatus(view().id, 'Approved')" class="rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors">Approve</button>
              <button (click)="setStatus(view().id, 'Rejected')" class="rounded-full bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-sm transition-colors">Reject</button>
              <button (click)="view.set(null)" class="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-ink hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminApplicationsComponent implements OnInit {
  admin = inject(AdminService);

  ngOnInit() {
    this.admin.loadStaffApplications().subscribe();
  }

  refresh() {
    this.admin.loadStaffApplications().subscribe();
  }
  
  tab = signal('Distributors');
  searchQuery = signal('');
  statusFilter = signal('All statuses');
  catFilter = signal('All categories');
  view = signal<any>(null);

  documentsVerified = false;
  reviewerNote = '';
  rawStatuses = ["Pending", "Under Review", "Approved", "Rejected"];
  statuses = ["All statuses", ...this.rawStatuses];
  categories = ["All categories", 'Corporate Distributor', 'Earbuds', 'Power Banks', 'Wireless Chargers', 'Car Chargers', 'Home Chargers', 'Cables', 'Accessories'];

  getTone(status: string) { return statusTone(status); }

  getStat(status: string) {
    return this.admin.applications().filter(a => a.status === status).length;
  }

  filteredList = computed(() => {
    let list = this.admin.applications();
    const typeMap: Record<string, string> = {
      'Distributors': 'Distributor',
      'Wholesalers': 'Wholesaler',
      'Affiliate Marketers': 'Affiliate Marketer'
    };
    const type = typeMap[this.tab()] || 'Distributor';
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    const c = this.catFilter();

    list = list.filter(a => a.type === type);

    if (q) {
      list = list.filter(a => 
        (a.businessName + a.contactPerson + a.email + a.phone + a.location).toLowerCase().includes(q)
      );
    }
    if (s !== 'All statuses') {
      list = list.filter(a => a.status === s);
    }
    if (c !== 'All categories') {
      list = list.filter(a => a.category === c);
    }
    return list;
  });

  viewDetail(app: any) {
    // Create a copy so we edit reviewer note independently from submitted application text
    this.documentsVerified = false;
    this.reviewerNote = app.reviewReason || '';
    this.admin.applicationError.set(null);
    this.view.set({ ...app });
  }

  setStatus(id: string, status: string) {
    const activeModal = this.view()?.id === id;
    const note = activeModal ? this.reviewerNote : `Application marked ${status} by staff`;
    const docsVerified = activeModal ? this.documentsVerified : false;
    this.admin.setApplicationStatus(id, status, note, docsVerified).subscribe(result => {
      if (result && this.view()?.id === id) {
        const stateMap: Record<string, string> = {
          RESOLVED: 'Approved',
          CLOSED: 'Rejected',
          IN_PROGRESS: 'Under Review',
          ASSIGNED: 'Under Review'
        };
        const displayed = stateMap[result.state] || distributorDisplayState(result.state);
        this.view.update((view: any) => ({ ...view, status: displayed, reviewReason: note, version: result.version }));
      }
    });
  }

}

