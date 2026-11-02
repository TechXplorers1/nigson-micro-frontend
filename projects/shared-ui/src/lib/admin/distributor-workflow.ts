/** Wire states remain pending until the owner acknowledges actual approval. */
export function distributorDisplayState(state: string): 'Pending' | 'Under Review' | 'Approved' | 'Rejected' {
  return ({ APPROVED: 'Approved', REJECTED: 'Rejected', UNDER_REVIEW: 'Under Review' } as const)[state as 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW'] || 'Pending';
}
export function distributorCommand(status: string, reason: string, documentsVerified: boolean, marketId?: string) {
  if (status === 'Under Review') {
    if (!documentsVerified) throw new Error('Confirm that you have reviewed the registration document.');
    return { action: 'review', body: { reason, documentsVerified: true } };
  }
  if (status === 'Approved') {
    if (!marketId) throw new Error('A configured approval market is required.');
    return { action: 'decision', body: { reason, decision: 'APPROVE', marketId } };
  }
  if (status === 'Rejected') return { action: 'decision', body: { reason, decision: 'REJECT' } };
  throw new Error('Choose a review or decision.');
}
