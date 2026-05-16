/**
 * AI_CONTEXT: Farming score algorithm — rates property likelihood to list
 *
 * Dependencies: none (pure function)
 * Exports: computeFarmingScore(investorSignals, clerkSignals, permits) → { score, rating, reasons, signalCount }
 *
 * Scoring weights:
 *   Distressed (highest): lis_pendens +25, probate +20, lien +15, death +12, judgment +10
 *   Voluntary: out-of-state absentee +12, in-state absentee +10, corporate +8, trust +8,
 *              long-term +8, high equity +6, no homestead +5, senior +4, vacant +2
 *   Permits: investment -5, maintenance/prep +3
 *   Penalty: recent purchase (<3yr) -5
 *   Rating: 70+ HIGH, 40-69 MEDIUM, 0-39 LOW
 */

export function computeFarmingScore(investorSignals, clerkSignals = [], permits = []) {
  let score = 0;
  const reasons = [];

  // DISTRESSED signals from clerk records (highest weight)
  const activeLP = clerkSignals.filter(s => s.signal === 'lis_pendens');
  const activeProbate = clerkSignals.filter(s => s.signal === 'probate');
  const activeLiens = clerkSignals.filter(s => s.signal === 'lien');
  const judgments = clerkSignals.filter(s => s.signal === 'final_judgment');
  const deaths = clerkSignals.filter(s => s.signal === 'death');

  if (activeLP.length) { score += 25; reasons.push(`Litigation pending — pre-foreclosure filing ${activeLP[0].recordDate}`); }
  if (activeProbate.length) { score += 20; reasons.push(`Probate filing — ${activeProbate[0].recordDate}`); }
  if (activeLiens.length) { score += 15; reasons.push(`${activeLiens.length} lien(s) recorded`); }
  if (judgments.length) { score += 10; reasons.push('Final judgment (foreclosure) entered'); }
  if (deaths.length) { score += 12; reasons.push('Death certificate recorded — estate sale likely'); }

  // VOLUNTARY signals from DOR parcel data
  if (investorSignals) {
    if (investorSignals.absenteeOwner && investorSignals.outOfStateOwner) {
      score += 12; reasons.push('Out-of-state absentee owner');
    } else if (investorSignals.absenteeOwner) {
      score += 10; reasons.push('Absentee owner (in-state)');
    }
    if (investorSignals.corporateOwner) { score += 8; reasons.push('Corporate/LLC owner — investment property'); }
    if (investorSignals.trustOwner) { score += 8; reasons.push('Trust/estate owner'); }
    if (investorSignals.longTermOwner) { score += 8; reasons.push(`Long-term owner (${investorSignals.yearsOwned || '15+'}yr)`); }
    if (investorSignals.highEquity) { score += 6; reasons.push(`High equity (${investorSignals.estimatedEquityPct || '>50'}%)`); }
    if (!investorSignals.homesteadExemption) { score += 5; reasons.push('No homestead — not primary residence'); }
    if (investorSignals.seniorOwner) { score += 4; reasons.push('Senior owner exemption'); }
    if (investorSignals.vacantLot) { score += 2; reasons.push('Vacant lot'); }
  }

  // PERMIT signals — renovation activity
  if (permits.length > 0) {
    const recentPermits = permits.filter(p => {
      const d = p.issueDate || p.PermitDate || p.ApplicationDate;
      if (!d) return false;
      const ts = typeof d === 'number' ? d : Date.parse(d);
      return ts > Date.now() - 365 * 24 * 60 * 60 * 1000;
    });

    if (recentPermits.length > 0) {
      const types = recentPermits.map(p =>
        (p.description || p.ApplicationDescription || p.TYPE || '').toUpperCase()
      );
      const investmentPermits = types.filter(t =>
        t.includes('KITCHEN') || t.includes('ADDITION') || t.includes('POOL') ||
        t.includes('REMODEL') || t.includes('RENOVATION') || t.includes('NEW CONSTRUCTION')
      );
      const prepPermits = types.filter(t =>
        t.includes('ROOF') || t.includes('AC') || t.includes('HVAC') ||
        t.includes('PAINT') || t.includes('FENCE') || t.includes('WINDOW') ||
        t.includes('DEMOLITION') || t.includes('TERMITE')
      );

      if (investmentPermits.length > 0) {
        score -= 5;
        reasons.push(`Recent investment permits (${investmentPermits.length}) — less likely to sell`);
      }
      if (prepPermits.length > 0) {
        score += 3;
        reasons.push(`Maintenance permits (${prepPermits.length}) — possible prep for sale`);
      }
    }
  }

  // Recent purchase penalty
  if (investorSignals?.yearsOwned && investorSignals.yearsOwned < 3) {
    score -= 5;
    reasons.push('Recent purchase (< 3 years) — less likely to sell');
  }

  // Cap 0-100
  score = Math.max(0, Math.min(100, score));

  // Rating
  const rating = score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

  return { score, rating, reasons, signalCount: reasons.length };
}
