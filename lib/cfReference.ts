export interface CfPriceObservations {
  total: number;
  observed: number;
  missing: number;
  mean_cost_stressed_return_pct: number | null;
  at_least_5pct_at_time_exit: number;
  at_least_10pct_at_time_exit: number;
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
  return d;
}
