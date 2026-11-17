import { describe, expect, it } from 'vitest';
import { distributorCommand, distributorDisplayState, distributorActionBlock, leadDisplayState, partnerLeadActionAllowed } from './distributor-workflow';
describe('Distributor workflow wire contract', () => {
  it('never displays approved while Commerce acknowledgement is pending', () => {
    expect(distributorDisplayState('ACTIVATION_PENDING')).toBe('Activation Pending');
    expect(distributorDisplayState('APPROVED')).toBe('Approved');
  });
  it('requires explicit document review confirmation', () => {
    expect(() => distributorCommand('Under Review','Reviewed document',false)).toThrow();
    expect(distributorCommand('Under Review','Reviewed document',true)).toEqual({ action: 'review', body: { reason: 'Reviewed document', documentsVerified: true } });
  });
  it('uses the real decision endpoint and explicit enum instead of approval/rejection URLs', () => {
    expect(distributorCommand('Approved','Second staff decision',false,'market-id')).toEqual({ action: 'decision', body: { reason: 'Second staff decision', decision: 'APPROVE', marketId: 'market-id' } });
    expect(distributorCommand('Rejected','Invalid document',false).body.decision).toBe('REJECT');
  });
  it('requires the configured market for approval', () => {
    expect(() => distributorCommand('Approved','Decision',true)).toThrow('market');
  });
  it('does not fabricate a server transition back to submitted', () => {
    expect(() => distributorCommand('Pending','Reset',true)).toThrow();
  });
});

describe('Distributor decision prerequisites',()=>{
 const reviewed={state:'UNDER_REVIEW',reviewerPartyId:'reviewer'};
 it('blocks approval before review and by the reviewer',()=>{
  expect(distributorActionBlock({state:'SUBMITTED'},'Approved','approver','market')).toContain('review');
  expect(distributorActionBlock(reviewed,'Approved','reviewer','market')).toContain('Another');
  expect(distributorActionBlock(reviewed,'Approved','approver','market')).toBeNull();
 });
 it('fails closed when reviewer, market or clean documents are missing',()=>{
  expect(distributorActionBlock({state:'UNDER_REVIEW'},'Approved','approver','market')).toContain('Reviewer');
  expect(distributorActionBlock(reviewed,'Approved','approver')).toContain('market');
  expect(distributorActionBlock({state:'SUBMITTED',documents:[{fileId:'file',scanStatus:'PENDING'}]},'Under Review','reviewer')).toContain('CLEAN');
 });
 it('preserves pending and suspended states and blocks terminal decisions',()=>{
  for(const [wire,label] of [['ACTIVATION_PENDING','Activation Pending'],['SUSPENSION_PENDING','Suspension Pending'],['SUSPENDED','Suspended']])expect(distributorDisplayState(wire)).toBe(label);
  expect(distributorDisplayState('unexpected')).toBe('Unknown');
  for(const state of ['APPROVED','REJECTED','SUSPENDED','ACTIVATION_PENDING'])expect(distributorActionBlock({state},'Rejected','sales','market')).not.toBeNull();
 });
 it('does not call lead resolution distributor approval',()=>{
  expect(leadDisplayState('RESOLVED')).toBe('Resolved');expect(leadDisplayState('CLOSED')).toBe('Closed');
  expect(partnerLeadActionAllowed('NEW','Start work')).toBe(true);expect(partnerLeadActionAllowed('CLOSED','Resolve')).toBe(false);
 });
 it('requires a human reason for a decision',()=>{expect(()=>distributorCommand('Rejected',' ',false)).toThrow('reason');});
});
