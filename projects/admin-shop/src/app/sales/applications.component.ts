import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminHeadingComponent, BadgeComponent, statusTone, StatCardComponent } from 'shared-ui';
import { LucideSearch, LucideEye, LucideCheck, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-admin-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminHeadingComponent, BadgeComponent, StatCardComponent, LucideSearch, LucideEye, LucideCheck, LucideX],
  template: `
    <lib-admin-heading title="Distributor Applications" subtitle="Distributor and wholesaler partnership requests"></lib-admin-heading>
    
    <div class="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <lib-stat-card label="Total applications" [value]="admin.applications().length.toString()"></lib-stat-card>
      <lib-stat-card label="Pending" [value]="getStat('Pending').toString()"></lib-stat-card>
      <lib-stat-card label="Approved" [value]="getStat('Approved').toString()"></lib-stat-card>
      <lib-stat-card label="Rejected" [value]="getStat('Rejected').toString()"></lib-stat-card>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-100 flex gap-6">
      <button *ngFor="let t of ['Distributors', 'Wholesalers']"
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
                  <button (click)="viewDetail(a)" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all shadow-sm" title="View"><svg lucideEye class="h-3.5 w-3.5"></svg></button>
                  <button (click)="setStatus(a.id, 'Approved')" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-all shadow-sm" title="Approve"><svg lucideCheck class="h-3.5 w-3.5"></svg></button>
                  <button (click)="setStatus(a.id, 'Rejected')" class="grid h-8 w-8 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm" title="Reject"><svg lucideX class="h-3.5 w-3.5"></svg></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="filteredList().length === 0">
              <td colspan="7" class="p-12 text-center text-muted-ink">No applications match your filters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Overlay -->
    <div *ngIf="view()" class="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div class="w-full max-w-2xl rounded-[24px] border border-gray-100 bg-white p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-extrabold text-ink">Application {{ view().number }}</h2>
          <button (click)="view.set(null)" class="grid h-8 w-8 place-items-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"><svg lucideX class="h-4 w-4"></svg></button>
        </div>
        
        <div class="space-y-4 text-sm">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Business name</p>
              <p class="mt-1 font-semibold text-ink">{{ view().businessName }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Type</p>
              <p class="mt-1 font-semibold text-ink">{{ view().type }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Contact person</p>
              <p class="mt-1 font-semibold text-ink">{{ view().contactPerson }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Email</p>
              <p class="mt-1 font-semibold text-ink">{{ view().email }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Phone</p>
              <p class="mt-1 font-semibold text-ink">{{ view().phone }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Location</p>
              <p class="mt-1 font-semibold text-ink">{{ view().location }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Product category</p>
              <p class="mt-1 font-semibold text-ink">{{ view().category }}</p>
            </div>
            <div class="rounded-xl border border-gray-100 px-4 py-3">
              <p class="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-ink">Submitted</p>
              <p class="mt-1 font-semibold text-ink">{{ view().date | date:'mediumDate' }}</p>
            </div>
          </div>
          
          <div>
            <label class="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-ink">Internal note</label>
            <textarea rows="3" [(ngModel)]="view().note" class="w-full rounded-[20px] border border-gray-200 bg-white px-5 py-4 text-sm text-ink shadow-sm focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"></textarea>
          </div>
          
          <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
            <select [(ngModel)]="view().status" (change)="setStatus(view().id, view().status)" class="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-sm outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100">
              <option *ngFor="let s of rawStatuses" [value]="s">{{ s }}</option>
            </select>
            <div class="flex gap-2">
              <button (click)="saveNote(view())" class="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-bold text-ink hover:bg-gray-50 shadow-sm transition-colors">Save note</button>
              <button (click)="setStatus(view().id, 'Approved')" class="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600 shadow-sm transition-colors">Approve</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminApplicationsComponent {
  admin = inject(AdminService);
  
  tab = signal('Distributors');
  searchQuery = signal('');
  statusFilter = signal('All statuses');
  catFilter = signal('All categories');
  view = signal<any>(null);

  rawStatuses = ["Pending", "Under Review", "Approved", "Rejected"];
  statuses = ["All statuses", ...this.rawStatuses];
  categories = ["All categories", 'Earbuds', 'Power Banks', 'Wireless Chargers', 'Car Chargers', 'Home Chargers', 'Cables', 'Accessories'];

  getTone(status: string) { return statusTone(status); }

  getStat(status: string) {
    return this.admin.applications().filter(a => a.status === status).length;
  }

  filteredList = computed(() => {
    let list = this.admin.applications();
    const type = this.tab() === 'Distributors' ? 'Distributor' : 'Wholesaler';
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
    // Create a copy so we can edit the note without immediate side-effects
    this.view.set({ ...app });
  }

  setStatus(id: string, s: any) {
    this.admin.applications.update(apps => apps.map(a => a.id === id ? { ...a, status: s } : a));
    if (this.view() && this.view().id === id) {
      this.view.update(v => ({ ...v, status: s }));
    }
    this.admin.log(`Application set to ${s}`);
  }

  saveNote(app: any) {
    this.admin.applications.update(apps => apps.map(a => a.id === app.id ? { ...a, note: app.note } : a));
    this.admin.log(`Saved note for application ${app.number}`);
  }
}

