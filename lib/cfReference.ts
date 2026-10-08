export interface CfPriceObservations {
  total: number;
  observed: number;
  missing: number;
  mean_cost_stressed_return_pct: number | null;
  at_least_5pct_at_time_exit: number;
  at_least_10pct_at_time_exit: number;
}

interface CfComparison {
  diagnostic_paired_sessions: number;
  qualifying_paired_sessions: number;
  diagnostic_mean_selected_change_pct: number | null;
  diagnostic_mean_difference_pp: number | null;
  mean_selected_change_pct: number | null;
  mean_difference_pp: number | null;
  mean_selected_minus_iwm_pp: number | null;
  minimum_difference_pp: number | null;
  maximum_difference_pp: number | null;
  next_action: "COLLECT_UNSEEN_SESSIONS" | "DESIGN_EXECUTION_STUDY" | "RESEARCH_ENTRY_TIMING";
}

interface CfCandidateResearch {
  as_of: string;
  session_date: string;
  reviewed_checkpoints: number[];
  qualifying_sessions: number;
  comparisons: Record<"held_near_prior_high" | "already_up_5_to_10_pct", CfComparison>;
  candidate_research_executor_implemented: true;
  automatic_entry_rule_changes: false;
  statistical_validation_complete: false;
  promotion_enabled: false;
}

export interface CfReference {
  available: true;
  kind: "cf_same_day_reference_v1";
  as_of: string;
  session_date: string;
  completed_trading_sessions: number;
  starting_paper_capital_usd: 10000;
  annual_net_profit_target_usd: 3000;
  retained_candidates: number;
  closed_modeled_trades: number;
  unresolved_positions: number;
  coverage: Record<string, number>;
  known_closed_position_net_usd: number;
  net_profit_usd: number | null;
  return_on_capital_pct: number | null;
  price_observations: Record<"multi" | "single" | "benchmark", CfPriceObservations> | null;
  observation_session_date: string | null;
  current_session_observed: boolean;
  candidate_research: CfCandidateResearch | null;
  blockers: string[];
  evaluator_implemented: true;
  entry_rule_validated: false;
  actual_fills_verified: false;
  promotion_enabled: false;
  trade_authorized: false;
  real_capital_verdict: "NO_GO";
}

export function verifiedCfReference(value: unknown, now = Date.now()): CfReference | null {
  if (!value || typeof value !== "object") return null;
  const d = value as CfReference;
  const count = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const date = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v+"T00:00:00Z")) && new Date(v+"T00:00:00Z").toISOString().slice(0,10) === v;
  if (typeof d.as_of !== "string") return null;
  const recorded = Date.parse(d.as_of);
  if (d.available !== true || d.kind !== "cf_same_day_reference_v1" ||
      !Number.isFinite(recorded) || recorded > now || !date(d.session_date) ||
      d.session_date < "2026-10-07" || d.session_date > new Date(recorded).toISOString().slice(0,10) ||
      d.starting_paper_capital_usd !== 10000 || d.annual_net_profit_target_usd !== 3000 ||
      !count(d.completed_trading_sessions) || !d.completed_trading_sessions || !count(d.retained_candidates) ||
      !count(d.closed_modeled_trades) || !count(d.unresolved_positions) || d.unresolved_positions > 5 ||
      d.closed_modeled_trades+d.unresolved_positions > d.retained_candidates ||
      d.closed_modeled_trades+d.unresolved_positions > 5*d.completed_trading_sessions ||
      !Number.isFinite(d.known_closed_position_net_usd) || d.known_closed_position_net_usd < -10000 ||
      (!d.closed_modeled_trades && d.known_closed_position_net_usd !== 0) ||
      !d.coverage || Array.isArray(d.coverage) || Object.entries(d.coverage).some(([k,v]) =>
        !["complete","incomplete","missing"].includes(k) || !count(v)) ||
      Object.values(d.coverage).reduce((a,b) => a+b,0) !== d.completed_trading_sessions ||
      !Array.isArray(d.blockers) || d.blockers.some(v => typeof v !== "string") ||
      d.evaluator_implemented !== true || d.entry_rule_validated !== false || d.actual_fills_verified !== false ||
      d.promotion_enabled !== false || d.trade_authorized !== false || d.real_capital_verdict !== "NO_GO") return null;
  const complete = d.coverage.complete === d.completed_trading_sessions;
  if (complete ? d.unresolved_positions !== 0 || d.blockers.length !== 0 ||
      d.net_profit_usd !== d.known_closed_position_net_usd || !Number.isFinite(d.return_on_capital_pct) ||
      Math.abs(d.net_profit_usd/100-(d.return_on_capital_pct as number)) > 0.000051 :
      d.net_profit_usd !== null || d.return_on_capital_pct !== null) return null;
  if (d.price_observations === null) {
    if (d.observation_session_date !== null || d.current_session_observed !== false || !(d.coverage.missing > 0)) return null;
  } else {
    if (!d.price_observations || Object.keys(d.price_observations).sort().join(",") !== "benchmark,multi,single" ||
        !date(d.observation_session_date) || d.observation_session_date < "2026-10-07" ||
        d.observation_session_date > d.session_date ||
        d.current_session_observed !== (d.observation_session_date === d.session_date)) return null;
    for (const g of Object.values(d.price_observations)) {
      if (!g || [g.total,g.observed,g.missing,g.at_least_5pct_at_time_exit,g.at_least_10pct_at_time_exit].some(v => !count(v)) ||
          g.observed+g.missing !== g.total || g.at_least_10pct_at_time_exit > g.at_least_5pct_at_time_exit ||
          g.at_least_5pct_at_time_exit > g.observed ||
          (g.observed === 0 ? g.mean_cost_stressed_return_pct !== null :
            !Number.isFinite(g.mean_cost_stressed_return_pct) || (g.mean_cost_stressed_return_pct as number) < -100.5)) return null;
    }
    if (d.price_observations.benchmark.total !== 1 ||
        d.price_observations.multi.total+d.price_observations.single.total > d.retained_candidates) return null;
  }
  if (!d.current_session_observed && (complete || !(d.coverage.missing > 0))) return null;
  return { ...d, candidate_research: verifiedCandidateResearch(d.candidate_research,d,now) };
}

function verifiedCandidateResearch(value: unknown, reference: CfReference, now: number): CfCandidateResearch | null {
  if (!value || typeof value !== "object") return null;
  const d = value as CfCandidateResearch;
  const count = (n: unknown): n is number => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const recorded = typeof d.as_of === "string" ? Date.parse(d.as_of) : NaN;
  if (!Number.isFinite(recorded) || recorded > now || recorded < Date.parse(reference.as_of) ||
      d.session_date !== reference.session_date || !count(d.qualifying_sessions) ||
      d.qualifying_sessions > reference.completed_trading_sessions ||
      (d.session_date < "2026-10-09" && d.qualifying_sessions !== 0) ||
      d.candidate_research_executor_implemented !== true || d.automatic_entry_rule_changes !== false ||
      d.statistical_validation_complete !== false || d.promotion_enabled !== false ||
      !d.comparisons || Object.keys(d.comparisons).sort().join(",") !== "already_up_5_to_10_pct,held_near_prior_high") return null;
  const first = [1,2,4,5,7,10,15,20,30].filter(n => n <= reference.completed_trading_sessions);
  if (!Array.isArray(d.reviewed_checkpoints) ||
      d.reviewed_checkpoints.length !== first.length+Math.max(0,Math.floor(reference.completed_trading_sessions/30)-1) ||
      d.reviewed_checkpoints.some((n,i) => n !== (i < first.length ? first[i] : (i-first.length+2)*30))) return null;
  for (const g of Object.values(d.comparisons)) {
    if (!g || !count(g.diagnostic_paired_sessions) || !count(g.qualifying_paired_sessions) ||
        g.diagnostic_paired_sessions > reference.completed_trading_sessions ||
        g.qualifying_paired_sessions > Math.min(g.diagnostic_paired_sessions,d.qualifying_sessions)) return null;
    const diagnostic = [g.diagnostic_mean_selected_change_pct,g.diagnostic_mean_difference_pp];
    const qualified = [g.mean_selected_change_pct,g.mean_difference_pp,g.mean_selected_minus_iwm_pp,
      g.minimum_difference_pp,g.maximum_difference_pp];
    if ((g.diagnostic_paired_sessions === 0 ? diagnostic.some(n => n !== null) : diagnostic.some(n => !Number.isFinite(n))) ||
        (g.qualifying_paired_sessions === 0 ? qualified.some(n => n !== null) : qualified.some(n => !Number.isFinite(n)))) return null;
    if (g.diagnostic_paired_sessions === g.qualifying_paired_sessions &&
        (g.diagnostic_mean_selected_change_pct !== g.mean_selected_change_pct || g.diagnostic_mean_difference_pp !== g.mean_difference_pp)) return null;
    if ((g.diagnostic_paired_sessions && (g.diagnostic_mean_selected_change_pct! < -100.5 ||
          g.diagnostic_mean_selected_change_pct!-g.diagnostic_mean_difference_pp! < -100.5)) ||
        (g.qualifying_paired_sessions && (g.mean_selected_change_pct! < -100.5 ||
          g.mean_selected_change_pct!-g.mean_difference_pp! < -100.5 ||
          g.mean_selected_change_pct!-g.mean_selected_minus_iwm_pp! < -100.5 ||
          g.minimum_difference_pp! > g.mean_difference_pp! || g.maximum_difference_pp! < g.mean_difference_pp!))) return null;
    const action = g.qualifying_paired_sessions < 20 ? "COLLECT_UNSEEN_SESSIONS" :
      g.mean_selected_change_pct! > 0 && g.mean_difference_pp! > 0 && g.mean_selected_minus_iwm_pp! > 0 ?
        "DESIGN_EXECUTION_STUDY" : "RESEARCH_ENTRY_TIMING";
    if (g.next_action !== action) return null;
  }
  return d;
}
