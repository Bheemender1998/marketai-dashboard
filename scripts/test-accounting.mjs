import assert from 'node:assert/strict';
import { verifiedAccounting, money } from '../lib/accounting.ts';

const now = Date.parse('2026-10-04T02:00:00Z');
const valid = { available: true, reason: 'gross_reconciled', as_of: '2026-10-04T01:00:00Z',
  pf_realized_gross_usd: -10.5, pf_partial_exit_gross_usd: 20, unallocated_account_fee_debits_usd: 1.34,
  pf_entries: 5, pf_closed_entries: 3, stock_fills: 12, net_performance_available: false, real_capital_verdict: 'NO_GO' };
assert.equal(verifiedAccounting(valid, now)?.pf_realized_gross_usd, -10.5);
assert.equal(money(-10.5), '-$10.50');
assert.equal(money(394.6232), '+$394.62');
assert.equal(money(0), '$0.00');
for (const bad of [undefined, {}, { ...valid, available: false }, { ...valid, as_of: '2000-01-01' },
  { ...valid, as_of: '2099-01-01' }, { ...valid, pf_realized_gross_usd: NaN },
  { ...valid, pf_closed_entries: 6 }, { ...valid, real_capital_verdict: 'GO' },
  { ...valid, pf_realized_gross_usd: '394.62' }, { ...valid, net_performance_available: true }]) {
  assert.equal(verifiedAccounting(bad, now), null);
}
console.log('PASS: gross accounting, negative money signs, and missing/stale/malformed evidence withheld');
