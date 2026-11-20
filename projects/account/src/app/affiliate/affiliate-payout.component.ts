import {Component,inject,OnInit,signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {AffiliatePayoutService,AffiliatePayoutOverview} from 'shared-ui';
import {finalize} from 'rxjs';
@Component({selector:'app-affiliate-payout',standalone:true,imports:[CommonModule,FormsModule],template:`
 <section class="rounded-2xl border border-hairline bg-white p-6 mb-6 space-y-5">
  <div class="flex justify-between gap-4"><h2 class="text-2xl font-extrabold">Payout balance & bank details</h2><button (click)="load()" [disabled]="busy()" class="underline">Refresh</button></div>
  <p>Admin makes monthly bank transfers of your full available balance after reviewing your bank details.</p>
  <p *ngIf="busy()" role="status">Loading...</p><p *ngIf="error()" role="alert" class="text-red-700">{{error()}}</p><p *ngIf="notice()" role="status">{{notice()}}</p>
  <ng-container *ngIf="result() as account">
   <div class="grid grid-cols-2 lg:grid-cols-4 gap-4"><div>Available for payout<p class="font-bold">{{account.balance.available | currency:'NGN':'symbol-narrow'}}</p></div><div>Prepared for payment<p class="font-bold">{{account.balance.reserved | currency:'NGN':'symbol-narrow'}}</p></div><div>Total paid<p class="font-bold">{{account.balance.paid | currency:'NGN':'symbol-narrow'}}</p></div><div>Refund recovery<p class="font-bold">{{account.balance.recovery | currency:'NGN':'symbol-narrow'}}</p></div></div>
   <p *ngIf="account.balance.recovery!=='0.00'" class="text-sm">A refund affected previously paid commission. This amount will be deducted from future qualified earnings.</p>
   <div *ngIf="account.bank as bank" class="border-t pt-4"><p class="font-semibold">{{bank.bankName}} · ••••••{{bank.accountLast4}}</p><p>{{bank.accountName}} — {{bank.status | titlecase}}</p><p *ngIf="bank.reviewReason">Review: {{bank.reviewReason}}</p></div>
   <p *ngIf="!account.bank">Add your Nigerian bank details to receive payouts.</p>
   <p *ngIf="account.balance.reserved!=='0.00'">A payout is prepared. Bank details are locked until Admin resolves that payment.</p>
   <form *ngIf="account.affiliateState==='ACTIVE' && account.balance.reserved==='0.00'" (ngSubmit)="save()" class="grid gap-4 sm:grid-cols-2">
    <label>Bank name<input name="bankName" [(ngModel)]="bankName" required minlength="2" maxlength="120" class="block w-full border rounded-xl p-3"></label>
    <label>Account holder name<input name="accountName" [(ngModel)]="accountName" required minlength="2" maxlength="160" class="block w-full border rounded-xl p-3"></label>
    <label>Account number<input name="accountNumber" [(ngModel)]="accountNumber" required inputmode="numeric" pattern="[0-9]{10}" minlength="10" maxlength="10" autocomplete="off" placeholder="10-digit Nigerian account number" class="block w-full border rounded-xl p-3"></label>
    <div class="self-end"><button type="submit" [disabled]="busy()" class="rounded-full bg-brand px-5 py-3 text-white">{{account.bank?'Submit updated bank details':'Save bank details'}}</button></div>
    <p class="text-sm sm:col-span-2">Any change requires a new Admin review. Bank details are encrypted; only authorized payout staff can view the full number. Enter details carefully—this form does not verify the account with your bank.</p>
   </form>
   <h3 class="font-bold border-t pt-4">Payout history</h3><p *ngIf="!account.payouts.length">No payouts yet.</p>
   <div *ngFor="let payout of account.payouts" class="border-t py-3"><strong>{{payout.amount | currency:'NGN':'symbol-narrow'}}</strong> · {{payout.period}} · {{payout.state | titlecase}}<p *ngIf="payout.transferReference">Transfer reference: {{payout.transferReference}}</p><p *ngIf="payout.paidAt">Recorded paid {{payout.paidAt | date:'medium'}}</p></div>
   <div class="flex gap-4" *ngIf="account.totalPages>1"><button (click)="load(account.page-1)" [disabled]="busy() || account.page===0">Previous</button><span>Page {{account.page+1}}</span><button (click)="load(account.page+1)" [disabled]="busy() || account.page+1>=account.totalPages">Next</button></div>
  </ng-container>
 </section>`})
export class AffiliatePayoutComponent implements OnInit {
 private service=inject(AffiliatePayoutService);readonly result=signal<AffiliatePayoutOverview|null>(null);readonly busy=signal(false);readonly error=signal('');readonly notice=signal('');bankName='';accountName='';accountNumber='';
 ngOnInit(){this.load();}
 load(page=0){if(this.busy()||page<0)return;this.busy.set(true);this.error.set('');this.service.own(page).pipe(finalize(()=>this.busy.set(false))).subscribe({next:value=>this.apply(value),error:()=>{this.result.set(null);this.error.set('Payout details could not be loaded. Please refresh.');}});}
 private apply(value:AffiliatePayoutOverview){this.result.set(value);this.bankName=value.bank?.bankName || '';this.accountName=value.bank?.accountName || '';this.accountNumber='';}
 save(){if(this.busy()||!this.result()||!/^\d{10}$/.test(this.accountNumber)){this.error.set('Enter a 10-digit Nigerian account number.');return;}this.busy.set(true);this.error.set('');this.notice.set('');this.service.save({expectedBankId:this.result()!.bank?.id || null,bankName:this.bankName.trim(),accountName:this.accountName.trim(),accountNumber:this.accountNumber}).pipe(finalize(()=>this.busy.set(false))).subscribe({next:value=>{this.apply(value);this.notice.set('Bank details saved for review.');},error:()=>this.error.set('The save could not be confirmed. Refresh before retrying; bank details may have changed or a payout may be prepared.')});}
}
