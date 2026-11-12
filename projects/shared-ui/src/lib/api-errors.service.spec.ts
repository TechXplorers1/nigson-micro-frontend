import '@angular/compiler';
import {HttpErrorResponse} from '@angular/common/http';
import {describe,it,expect} from 'vitest';
import {ApiErrorsService,apiFailureDetail} from './api-errors.service';
describe('Actionable API errors',()=>{
 it('explains a plain proxy 502 without claiming the backend rejected it',()=>{
  const value=new ApiErrorsService().describe(new HttpErrorResponse({status:502,statusText:'Bad Gateway',error:''}),'GET','/bff/session');
  expect(value).toContain('API proxy could not reach the backend');expect(value).not.toContain('backend rejected');
 });
 it('keeps server configuration guidance and correlation references',()=>{
  const error=new HttpErrorResponse({status:503,error:{detail:'Service unavailable',correlationId:'safe-reference',violations:[{field:'document',message:'Document storage is not configured.'}]}});
  expect(apiFailureDetail(error)).toContain('Document storage is not configured.');expect(new ApiErrorsService().describe(error)).toContain('safe-reference');
 });
 it('explains an unactivated market as configuration, not a missing resource',()=>{
  const error=new HttpErrorResponse({status:422,error:{code:'MARKET_RULE_VIOLATION',detail:'The market operation does not meet approved selling rules.',correlationId:'market-reference'}});
  const value=new ApiErrorsService().describe(error,'GET','/api/v1/catalogue/categories?market=NG');
  expect(value).toContain('not activated for selling');expect(value).toContain('market-reference');
  expect(value).not.toContain('The requested resource is unavailable');
 });
});
