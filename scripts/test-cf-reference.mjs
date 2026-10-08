import assert from 'node:assert/strict';
import { verifiedCfReference } from '../lib/cfReference.ts';

const now = Date.parse('2026-10-08T16:00:00Z');
const group = (total,mean) => ({ total, observed: total, missing: 0, mean_cost_stressed_return_pct: mean,
  at_least_5pct_at_time_exit: 0, at_least_10pct_at_time_exit: 0 });
const valid = { available: true, kind: 'cf_same_day_reference_v1', as_of: '2026-10-08T13:00:00.668Z',
  session_date: '2026-10-07', completed_trading_sessions: 1, starting_paper_capital_usd: 10000,
  annual_net_profit_target_usd: 3000, retained_candidates: 65, closed_modeled_trades: 0,
  unresolved_positions: 0, coverage: { incomplete: 1 }, known_closed_position_net_usd: 0,
  net_profit_usd: null, return_on_capital_pct: null,
  price_observations: { multi: group(5,-1.415), single: { ...group(60,-1.846),
    at_least_5pct_at_time_exit: 3, at_least_10pct_at_time_exit: 1 }, benchmark: group(1,-0.891) },
  observation_session_date: '2026-10-07', current_session_observed: true,
  blockers: ['incomplete_candidate_scan'], evaluator_implemented: true, entry_rule_validated: false,
  actual_fills_verified: false, promotion_enabled: false, trade_authorized: false, real_capital_verdict: 'NO_GO' };
assert.equal(verifiedCfReference(valid,now)?.price_observations.multi.observed,5);
assert.equal(verifiedCfReference(valid,now+7*86400000)?.as_of,valid.as_of);
assert.equal(verifiedCfReference(valid,now)?.candidate_research,null);
const comparison={diagnostic_paired_sessions:1,qualifying_paired_sessions:0,
  diagnostic_mean_selected_change_pct:-2.5,diagnostic_mean_difference_pp:-1.36,
  mean_selected_change_pct:null,mean_difference_pp:null,mean_selected_minus_iwm_pp:null,
  minimum_difference_pp:null,maximum_difference_pp:null,next_action:'COLLECT_UNSEEN_SESSIONS'};
const research={as_of:'2026-10-08T15:00:00Z',session_date:'2026-10-07',reviewed_checkpoints:[1],
  qualifying_sessions:0,comparisons:{held_near_prior_high:{...comparison},already_up_5_to_10_pct:{...comparison}},
  candidate_research_executor_implemented:true,automatic_entry_rule_changes:false,
  statistical_validation_complete:false,promotion_enabled:false};
const researched={...valid,candidate_research:research};
assert.equal(verifiedCfReference(researched,now)?.candidate_research.comparisons.held_near_prior_high.diagnostic_mean_selected_change_pct,-2.5);
assert.equal(verifiedCfReference(researched,now)?.candidate_research.comparisons.held_near_prior_high.mean_selected_change_pct,null);
for(const change of [
  r=>{r.as_of='2099-01-01';},r=>{r.as_of='2026-10-07';},r=>{r.session_date='2026-10-08';},
  r=>{r.qualifying_sessions=1;},r=>{r.reviewed_checkpoints=[];},r=>{r.promotion_enabled=true;},
  r=>{r.automatic_entry_rule_changes=true;},r=>{r.statistical_validation_complete=true;},
  r=>{delete r.comparisons.held_near_prior_high;},r=>{r.comparisons.held_near_prior_high.mean_selected_change_pct=0;},
  r=>{r.comparisons.held_near_prior_high.diagnostic_mean_selected_change_pct=NaN;},
  r=>{r.comparisons.held_near_prior_high.diagnostic_mean_selected_change_pct=-101;},
  r=>{r.comparisons.held_near_prior_high.next_action='DESIGN_EXECUTION_STUDY';},
]) {const value=structuredClone(researched);change(value.candidate_research);const out=verifiedCfReference(value,now);
  assert.equal(out?.available,true);assert.equal(out.candidate_research,null);}
const future=structuredClone(researched);
Object.assign(future,{as_of:'2026-11-06T22:00:00Z',session_date:'2026-11-06',observation_session_date:'2026-11-06',
  completed_trading_sessions:23,coverage:{incomplete:23}});
Object.assign(future.candidate_research,{as_of:'2026-11-06T22:01:00Z',session_date:'2026-11-06',qualifying_sessions:20,
  reviewed_checkpoints:[1,2,4,5,7,10,15,20]});
for(const g of Object.values(future.candidate_research.comparisons)) Object.assign(g,{
  diagnostic_paired_sessions:20,qualifying_paired_sessions:20,diagnostic_mean_selected_change_pct:2,
  diagnostic_mean_difference_pp:.5,mean_selected_change_pct:2,mean_difference_pp:.5,
  mean_selected_minus_iwm_pp:1,minimum_difference_pp:.1,maximum_difference_pp:.9,next_action:'DESIGN_EXECUTION_STUDY'});
const futureNow=Date.parse('2026-11-07T00:00:00Z');
assert.equal(verifiedCfReference(future,futureNow)?.candidate_research.comparisons.held_near_prior_high.next_action,'DESIGN_EXECUTION_STUDY');
future.candidate_research.comparisons.held_near_prior_high.diagnostic_mean_selected_change_pct=-.1;
assert.equal(verifiedCfReference(future,futureNow)?.candidate_research,null);
const complete = { ...valid, coverage: { complete: 1 }, blockers: [], closed_modeled_trades: 1,
  known_closed_position_net_usd: 12.34, net_profit_usd: 12.34, return_on_capital_pct: 0.1234 };
assert.equal(verifiedCfReference(complete,now)?.net_profit_usd,12.34);
// A missing new intake keeps prior observations dated; it cannot become a zero return.
const missing = { ...valid, session_date: '2026-10-08', completed_trading_sessions: 2,
  as_of: '2026-10-08T21:00:00Z', coverage: { incomplete: 1, missing: 1 }, current_session_observed: false };
assert.equal(verifiedCfReference(missing,now+86400000)?.observation_session_date,'2026-10-07');
assert.equal(verifiedCfReference({ ...valid, coverage: { missing: 1 }, price_observations: null,
  observation_session_date: null, current_session_observed: false },now)?.price_observations,null);
assert.equal(verifiedCfReference({ ...valid, closed_modeled_trades: 1,
  known_closed_position_net_usd: -20, unresolved_positions: 1 },now)?.net_profit_usd,null);
for (const patch of [
  { net_profit_usd: 0 }, { return_on_capital_pct: 30 }, { known_closed_position_net_usd: 3 },
  { starting_paper_capital_usd: 5000 }, { annual_net_profit_target_usd: 500 },
  { trade_authorized: true }, { entry_rule_validated: true }, { actual_fills_verified: true },
  { evaluator_implemented: false }, { promotion_enabled: true }, { real_capital_verdict: 'GO' },
  { as_of: '2099-01-01' }, { as_of: {} }, { session_date: '2026-02-31' }, { session_date: '2026-10-06' },
  { retained_candidates: 2 }, { completed_trading_sessions: 2 }, { closed_modeled_trades: 6 },
  { coverage: { complete: 1 } }, { observation_session_date: '2026-10-09' }, { current_session_observed: false },
  { price_observations: null }, { price_observations: {} },
  { price_observations: { ...valid.price_observations, multi: { ...group(5,1), observed: 4 } } },
  { price_observations: { ...valid.price_observations, multi: group(0,0) } },
  { price_observations: { ...valid.price_observations, multi: group(5,-101) } },
  { price_observations: { ...valid.price_observations, single: { ...group(60,1), at_least_10pct_at_time_exit: 1 } } },
]) assert.equal(verifiedCfReference({ ...valid, ...patch },now),null,JSON.stringify(patch));
for (const patch of [{ known_closed_position_net_usd: 30 }, { return_on_capital_pct: 30 },
  { unresolved_positions: 1 }, { blockers: ['missing_entry_quote'] }, { net_profit_usd: null }]) {
  assert.equal(verifiedCfReference({ ...complete, ...patch },now),null);
}
console.log('PASS: reference observation dates, costs, coverage, unknown returns and partial modeled outcomes');
