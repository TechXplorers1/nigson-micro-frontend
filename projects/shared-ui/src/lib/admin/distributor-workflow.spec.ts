import { describe, expect, it } from 'vitest';
import { distributorCommand, distributorDisplayState } from './distributor-workflow';
describe('Distributor workflow wire contract', () => {
  it('never displays approved while Commerce acknowledgement is pending', () => {
    expect(distributorDisplayState('ACTIVATION_PENDING')).toBe('Pending');
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
