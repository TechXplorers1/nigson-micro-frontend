import '@angular/compiler';
import {signal} from '@angular/core';
import {of,Subject} from 'rxjs';
import {describe,it,expect,vi} from 'vitest';
import {AdminService} from './admin.service';
import {LOCAL_API_FAILURE_CODES} from '../api-errors.service';

function setup() {
 const service=Object.create(AdminService.prototype) as AdminService;
 const catalogue=new Subject<any>();
 const http={get:vi.fn((url:string)=>url.startsWith('/api/v1/staff/products')?catalogue:url.startsWith('/api/v1/staff/inventory')?of({items:[],totalPages:1}):of({unitAmount:'100'}))};
 Object.assign(service,{http,products:signal([]),errors:signal({})});
 return {service,http,catalogue};
}
describe('Admin product loading',()=>{
 it('shares concurrent loads, skips unpublished prices, and refreshes after completion',()=>{
  const {service,http,catalogue}=setup();
  service.loadStaffProducts().subscribe();
  service.loadStaffProducts().subscribe();
  expect(http.get.mock.calls.filter(([url])=>url.startsWith('/api/v1/staff/products'))).toHaveLength(1);
  catalogue.next({items:[{id:'draft',status:'DRAFT',skus:[{id:'draft-sku'}]},{id:'active',status:'ACTIVE',skus:[{id:'active-sku',packSize:'1'}]}],totalPages:1});
  catalogue.complete();
  expect(http.get.mock.calls.filter(([url])=>url.includes('/price'))).toHaveLength(1);
  expect(service.products().find(p=>p.id==='draft')?.priceSubtitle).toContain('after publication');
  expect(service.products().find(p=>p.id==='active')?.price).toBe(100);
  service.loadStaffProducts().subscribe();
  expect(http.get.mock.calls.filter(([url])=>url.startsWith('/api/v1/staff/products'))).toHaveLength(2);
 });
});
