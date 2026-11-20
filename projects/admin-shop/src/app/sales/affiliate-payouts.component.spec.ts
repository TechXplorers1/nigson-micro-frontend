import '@angular/compiler';
import {Injector} from '@angular/core';
import {of,throwError} from 'rxjs';
import {describe,it,expect,vi} from 'vitest';
import {AffiliatePayoutService} from 'shared-ui';
import {AdminAffiliatePayoutsComponent} from './affiliate-payouts.component';
const payout:any={id:'payout',version:0,state:'PREPARED',amount:'45.00',period:'2026-11'};
const account:any={partyId:'party',name:'Synthetic affiliate',bank:{id:'bank',version:1,status:'APPROVED'},payouts:[payout],canPrepare:false,canTransfer:true};
function fixture(service:any){return Injector.create({providers:[{provide:AffiliatePayoutService,useValue:service},{provide:AdminAffiliatePayoutsComponent,useFactory:()=>new AdminAffiliatePayoutsComponent()}]}).get(AdminAffiliatePayoutsComponent);}
describe('Manual affiliate payout controls',()=>{
 it('requires separate bank-confirmation and no-transfer attestations',()=>{const service={resolve:vi.fn(()=>of({...payout,state:'PAID'})),list:()=>of({items:[],page:0,totalPages:0}),detail:()=>of(account)};const c=fixture(service);c.selected.set(account);c.reference='SYNTHETIC_REFERENCE';c.resolve(true);c.resolve(false);expect(service.resolve).not.toHaveBeenCalled();c.confirmed=true;c.resolve(true);expect(service.resolve).toHaveBeenCalledWith(payout,true,'SYNTHETIC_REFERENCE',true);expect(c.confirmed).toBe(false);expect(c.notice()).toContain('refreshed');});
 it('does not prepare an ineligible balance',()=>{const service={prepare:vi.fn()};const c=fixture(service);c.selected.set(account);c.prepare();expect(service.prepare).not.toHaveBeenCalled();});
 it('clears stale controls after uncertain outcome without retrying',()=>{const service={resolve:vi.fn(()=>throwError(()=>new Error('lost response')))};const c=fixture(service);c.selected.set(account);c.noTransfer=true;c.cancelReason='Synthetic no transfer';c.resolve(false);expect(service.resolve).toHaveBeenCalledTimes(1);expect(c.selected()).toBeNull();expect(c.error()).toContain('Refresh before retrying');expect(c.notice()).toBe('');});
});
