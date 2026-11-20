import {Component,inject,OnInit,signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {HttpClient,HttpParams} from '@angular/common/http';
import {AffiliateService,affiliateUrl} from 'shared-ui';
import {finalize} from 'rxjs';
import {AffiliateEarningsComponent} from './affiliate-earnings.component';
import {AffiliatePayoutComponent} from './affiliate-payout.component';
interface Product {id:string;name:string;imageUrl?:string;}
@Component({selector:'app-affiliate',standalone:true,imports:[CommonModule,FormsModule,RouterLink,AffiliateEarningsComponent,AffiliatePayoutComponent],template:`
 <app-affiliate-payout *ngIf="affiliate.state()==='ACTIVE' || affiliate.state()==='SUSPENDED'"></app-affiliate-payout>
 <app-affiliate-earnings *ngIf="affiliate.state()==='ACTIVE' || affiliate.state()==='SUSPENDED'"></app-affiliate-earnings>
 <section class="rounded-2xl border border-hairline bg-white p-6 space-y-5">
  <h2 class="text-2xl font-extrabold">Affiliate product links</h2>
  <p>Share a product link. It opens the normal product page and remembers your referral in the same browser for seven days, including through sign-in.</p>
  <p *ngIf="affiliate.loading()" role="status">Checking affiliate access...</p>
  <p *ngIf="affiliate.error()" role="alert" class="text-red-700">{{ affiliate.error() }}</p>
  <p *ngIf="!affiliate.loading() && affiliate.state()!=='ACTIVE'">{{ affiliate.state()==='SUSPENDED'?'Affiliate access is suspended. New referrals cannot be recorded.':'Affiliate approval is required to create links.' }} <a routerLink="/affiliate" class="underline">View application</a></p>
  <ng-container *ngIf="affiliate.state()==='ACTIVE'">
   <form (ngSubmit)="search(0)" class="flex gap-3"><input [(ngModel)]="query" name="search" aria-label="Search products" placeholder="Search products" class="min-w-0 flex-1 rounded-xl border p-3"><button [disabled]="loading()" class="rounded-full bg-brand px-5 text-white">Search</button></form>
   <p *ngIf="error()" role="alert" class="text-red-700">{{error()}}</p><p *ngIf="notice()" role="status">{{notice()}}</p>
   <input *ngIf="lastLink()" [value]="lastLink()" readonly aria-label="Your referral link" class="w-full rounded-xl border p-3" (click)="$any($event.target).select()">
   <div *ngFor="let product of products()" class="flex items-center gap-4 border-t py-4"><img *ngIf="product.imageUrl" [src]="product.imageUrl" [alt]="product.name" class="h-16 w-16 object-contain"><a [routerLink]="['/products',product.id]" class="flex-1 font-semibold">{{product.name}}</a><button (click)="copy(product)" [disabled]="!!copying()" class="rounded-full bg-brand px-4 py-2 text-white">{{copying()===product.id?'Preparing...':'Copy referral link'}}</button></div>
   <p *ngIf="!loading() && !products().length">No products found.</p>
   <div class="flex gap-4"><button (click)="search(page()-1)" [disabled]="loading() || page()===0">Previous</button><span>Page {{page()+1}}</span><button (click)="search(page()+1)" [disabled]="loading() || page()+1>=pages()">Next</button></div>
  </ng-container>
 </section>`})
export class AffiliateComponent implements OnInit {
 readonly affiliate=inject(AffiliateService);private http=inject(HttpClient);
 readonly products=signal<Product[]>([]);readonly loading=signal(false);readonly error=signal('');readonly notice=signal('');readonly copying=signal('');readonly lastLink=signal('');readonly page=signal(0);readonly pages=signal(0);query='';
 ngOnInit(){this.affiliate.load().subscribe({next:r=>{if(r.state==='ACTIVE')this.search(0);},error:()=>{}});}
 search(page:number){if(this.affiliate.state()!=='ACTIVE'||this.loading()||page<0)return;this.loading.set(true);this.error.set('');this.http.get<{items:Product[];totalPages:number}>('/api/v1/catalogue/products',{params:new HttpParams().set('market','NG').set('page',String(page)).set('size','20').appendAll(this.query.trim()?{q:this.query.trim()}:{})}).pipe(finalize(()=>this.loading.set(false))).subscribe({next:r=>{this.products.set(r.items);this.page.set(page);this.pages.set(r.totalPages);},error:()=>this.error.set('Products could not be loaded. Please try again.')});}
 copy(product:Product){if(this.copying())return;this.copying.set(product.id);this.error.set('');this.notice.set('');this.affiliate.link(product.id).pipe(finalize(()=>this.copying.set(''))).subscribe({next:async link=>{try{const url=affiliateUrl(link.path);this.lastLink.set(url);try{await navigator.clipboard.writeText(url);this.notice.set('Referral link copied.');}catch{this.notice.set('Select and copy your referral link above.');}}catch{this.error.set('The referral link could not be confirmed.');}},error:()=>this.error.set('A link could not be created. Refresh your affiliate access and try again.')});}
}
