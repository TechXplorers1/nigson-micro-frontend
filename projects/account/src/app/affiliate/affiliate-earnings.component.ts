import {Component,inject,OnInit,signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AffiliateService,AffiliateEarnings} from 'shared-ui';
import {finalize} from 'rxjs';

@Component({selector:'app-affiliate-earnings',standalone:true,imports:[CommonModule],template:`
 <section class="rounded-2xl border border-hairline bg-white p-6 space-y-4 mb-6">
  <div class="flex justify-between gap-4"><h2 class="text-2xl font-extrabold">Order commissions</h2><button (click)="load(result()?.page || 0)" [disabled]="loading()" class="underline">Refresh</button></div>
  <p>Earn 5% of retail merchandise after discounts, excluding shipping and tax. Commission becomes available seven days after confirmed delivery. Refunds reduce commission.</p>
  <p>These order totals show qualification before payouts. The payout balance above shows the amount still available to receive.</p>
  <p *ngIf="loading()" role="status">Loading earnings...</p><p *ngIf="error()" role="alert" class="text-red-700">{{error()}}</p>
  <ng-container *ngIf="result() as earnings">
   <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div><span>Pending</span><p class="font-bold">{{earnings.pending | currency:earnings.currency:'symbol-narrow'}}</p></div>
    <div><span>Qualified before payouts</span><p class="font-bold">{{earnings.available | currency:earnings.currency:'symbol-narrow'}}</p></div>
    <div><span>On hold</span><p class="font-bold">{{earnings.held | currency:earnings.currency:'symbol-narrow'}}</p></div>
    <div><span>Reversed by refunds</span><p class="font-bold">{{earnings.reversed | currency:earnings.currency:'symbol-narrow'}}</p></div>
   </div>
   <p class="text-sm text-muted">Pending includes orders awaiting delivery or the seven-day waiting period. Unresolved refunds and order holds block availability.</p>
   <p *ngIf="!earnings.items.length">No qualifying paid orders yet. Earnings appear for new purchases made through your referral links.</p>
   <div class="overflow-x-auto" *ngIf="earnings.items.length"><table class="w-full text-left text-sm"><thead><tr><th class="py-3">Order</th><th>Commission</th><th>Status</th><th>Available from</th></tr></thead><tbody><tr *ngFor="let item of earnings.items" class="border-t"><td class="py-3 pr-3 break-all">{{item.orderNumber}}</td><td class="pr-3">{{item.net | currency:earnings.currency:'symbol-narrow'}}<span *ngIf="item.reversed!=='0.00'" class="block text-muted">Refund reversal: {{item.reversed | currency:earnings.currency:'symbol-narrow'}}</span></td><td class="pr-3">{{item.state==='HELD'?'On hold':(item.state==='AVAILABLE'?'Qualified':(item.state | titlecase))}}</td><td>{{item.availableAt?(item.availableAt | date:'mediumDate'):'After delivery'}}</td></tr></tbody></table></div>
   <div class="flex gap-4" *ngIf="earnings.totalPages>1"><button (click)="load(earnings.page-1)" [disabled]="loading() || earnings.page===0">Previous</button><span>Page {{earnings.page+1}}</span><button (click)="load(earnings.page+1)" [disabled]="loading() || earnings.page+1>=earnings.totalPages">Next</button></div>
  </ng-container>
 </section>`})
export class AffiliateEarningsComponent implements OnInit {
 private affiliate=inject(AffiliateService);readonly result=signal<AffiliateEarnings|null>(null);readonly loading=signal(false);readonly error=signal('');
 ngOnInit(){this.load(0);}
 load(page:number){if(this.loading()||page<0)return;this.loading.set(true);this.error.set('');this.affiliate.earnings(page).pipe(finalize(()=>this.loading.set(false))).subscribe({next:value=>this.result.set(value),error:()=>{this.result.set(null);this.error.set('Earnings could not be loaded. Please try again.');}});}
}
