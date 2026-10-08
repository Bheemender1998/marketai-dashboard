export interface CfReview {
  available: true;
  kind: "cf_same_day_review_v1";
  as_of: string;
  session_date: string;
  completed_trading_sessions: number;
  reviewed_checkpoints: number[];
  coverage: Record<string, number>;
  starting_paper_capital_usd: 10000;
  annual_net_profit_target_usd: 3000;
  retained_candidate_decisions: number;
  net_profit_usd: null;
  return_on_capital_pct: null;
  entry_evaluator_implemented: false;
  hypothesis_executor_implemented: false;
  next_work: { action: "INVESTIGATE_DATA" | "COMPLETE_PAPER_EVALUATOR"; blockers: string[] };
  promotion_enabled: false;
  trade_authorized: false;
  real_capital_verdict: "NO_GO";
}

export function verifiedCfReview(value: unknown, now = Date.now()): CfReview | null {
  if (!value || typeof value !== "object") return null;
  const d = value as CfReview;
  const age = now - Date.parse(d.as_of);
  const count = (n: unknown) => typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
  const checkpoints = [1, 2, 4, 5, 7, 10, 15, 20, 30];
  if (d.available !== true || d.kind !== "cf_same_day_review_v1" || !Number.isFinite(age) || age < 0 ||
      typeof d.session_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d.session_date) ||
      !Number.isFinite(Date.parse(d.session_date + "T23:50:00Z")) ||
      new Date(d.session_date + "T23:50:00Z").toISOString().slice(0, 10) !== d.session_date ||
      d.session_date < "2026-10-07" ||
      Date.parse(d.as_of) < Date.parse(d.session_date + "T23:50:00Z") ||
      d.starting_paper_capital_usd !== 10000 || d.annual_net_profit_target_usd !== 3000 ||
      !count(d.completed_trading_sessions) || !d.completed_trading_sessions || !count(d.retained_candidate_decisions) ||
      d.net_profit_usd !== null || d.return_on_capital_pct !== null ||
      d.entry_evaluator_implemented !== false || d.hypothesis_executor_implemented !== false ||
      d.promotion_enabled !== false || d.trade_authorized !== false || d.real_capital_verdict !== "NO_GO" ||
      !Array.isArray(d.reviewed_checkpoints) || new Set(d.reviewed_checkpoints).size !== d.reviewed_checkpoints.length ||
      d.reviewed_checkpoints.length !== checkpoints.filter(n => n <= d.completed_trading_sessions).length +
        Math.max(0, Math.floor(d.completed_trading_sessions / 30) - 1) ||
      d.reviewed_checkpoints.some(n => !count(n) || n > d.completed_trading_sessions ||
        !(checkpoints.includes(n) || (n >= 60 && n % 30 === 0))) ||
      !d.coverage || Object.entries(d.coverage).some(([k,v]) =>
        !["complete", "incomplete", "missing", "unimplemented"].includes(k) || !count(v)) ||
      Object.values(d.coverage).reduce((a,b) => a+b, 0) !== d.completed_trading_sessions ||
      (d.coverage.complete ?? 0) !== 0 || (d.coverage.incomplete ?? 0) !== 0 ||
      !["INVESTIGATE_DATA", "COMPLETE_PAPER_EVALUATOR"].includes(d.next_work?.action) ||
      !Array.isArray(d.next_work.blockers) || d.next_work.blockers.some(v => typeof v !== "string")) return null;
  return d;
}
