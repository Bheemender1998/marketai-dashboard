import assert from 'node:assert/strict';
import { verifiedCfReview } from '../lib/cfReview.ts';
const now = Date.parse('2026-10-08T02:00:00Z');
const valid = { available: true, kind: 'cf_same_day_review_v1', as_of: '2026-10-08T00:01:00Z',
  session_date: '2026-10-07', completed_trading_sessions: 1, reviewed_checkpoints: [1],
  coverage: { unimplemented: 1 }, starting_paper_capital_usd: 10000, annual_net_profit_target_usd: 3000,
  retained_candidate_decisions: 65, net_profit_usd: null, return_on_capital_pct: null,
  entry_evaluator_implemented: false, hypothesis_executor_implemented: false,
  next_work: { action: 'INVESTIGATE_DATA', blockers: ['missing_cf_quote_report'] },
  promotion_enabled: false, trade_authorized: false, real_capital_verdict: 'NO_GO' };
assert.equal(verifiedCfReview(valid,now)?.retained_candidate_decisions,65);
// An old snapshot keeps its recorded date, rather than becoming a fresh result.
assert.equal(verifiedCfReview(valid,now+7*86400000)?.as_of,valid.as_of);
for (const bad of [undefined, {}, { ...valid, net_profit_usd: 0 }, { ...valid, return_on_capital_pct: 30 },
  { ...valid, starting_paper_capital_usd: 5000 }, { ...valid, trade_authorized: true },
  { ...valid, as_of: '2099-01-01' }, { ...valid, as_of: '2026-10-07T20:00:00Z' },
  { ...valid, retained_candidate_decisions: -1 }, { ...valid, reviewed_checkpoints: [2] },
  { ...valid, reviewed_checkpoints: [] }, { ...valid, session_date: '2026-02-31' },
  { ...valid, session_date: '2026-10-06' }, { ...valid, coverage: { complete: 1 } },
  { ...valid, coverage: { unimplemented: 2 } }, { ...valid, next_work: { action: 'BUY', blockers: [] } }]) {
  assert.equal(verifiedCfReview(bad,now),null);
}
console.log('PASS: CF review dates, unknown returns, persistent baseline, coverage and no promotion');
