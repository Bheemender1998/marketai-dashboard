export type ModuleStatus = "live" | "disabled" | "killed" | "gated";

export interface Module {
  name: string;
  status: ModuleStatus;
  desc: string;
}

export const MODULES: Module[] = [
  // LIVE
  { name: "PatternFinding", status: "live", desc: "Primary signal source — MARKETAI_100 (102 tickers)" },
  { name: "ConvictionScorer", status: "live", desc: "Quality gate — BEST/STRONG/WATCH/AVOID tiers" },
  { name: "Alpaca Paper", status: "live", desc: "Trade execution (paper trading)" },
  { name: "Risk Agent", status: "live", desc: "9-stage validation before every order" },
  { name: "Post-Mortem", status: "live", desc: "Win/loss tracking + signal resolution" },
  { name: "Price Alerts", status: "live", desc: "Entry/stop/target checks every 30s" },
  { name: "Trailing Stop", status: "live", desc: "Dynamic exits — breakeven, partial profit" },
  { name: "Circuit Breaker", status: "live", desc: "Portfolio drawdown protection" },
  { name: "Regime Detector", status: "live", desc: "SPY EMAs + VIX, 30-min cache" },
  { name: "Event Monitor", status: "live", desc: "News-driven signals, hourly" },
  { name: "Economic Calendar", status: "live", desc: "FRED blackout for CPI/FOMC windows" },
  { name: "Correlation Filter", status: "live", desc: "25 sector groups — 1 alert per group" },
  // DISABLED
  { name: "TA Autonomy", status: "disabled", desc: "TA_AUTONOMY_DISABLED=true (cron armed, skips work)" },
  { name: "Watchlist Autonomy", status: "disabled", desc: "WATCHLIST_AUTONOMY_DISABLED=true" },
  { name: "Morning Brief", status: "disabled", desc: "MORNING_BRIEF_DISABLED=true (7am cron silenced)" },
  // GATED
  { name: "Kraken Live", status: "gated", desc: "TRADING_ENABLED not set — council ladder: N≥60 PF closes + Sharpe≥1.0 + Brier≤0.25. T73 cleared 2026-05-15 at N=27 (85% WR, Wilson LB 67.5%)." },
  { name: "T70 Auto-Execute", status: "gated", desc: "Alert-only — 14-day review extended to 2026-05-23 (Branch C — low signal volume)" },
  // KILLED
  { name: "Surge Scanner", status: "killed", desc: "Killed 2026-04-25 — falsified at every sub-cut" },
  { name: "BTC Scalp", status: "killed", desc: "BTC_SCALP_ENABLED not set — R:R 0.53:1 structurally impossible" },
  { name: "Research Agent", status: "killed", desc: "Deleted PR #126 — 0 signals, 4 dead data sources" },
  { name: "Scan Agent", status: "killed", desc: "Dead code — runScanInBackground has no caller" },
  { name: "Market Scanner", status: "killed", desc: "Cron registered but not firing in Railway logs" },
];

export interface RoadmapItem {
  name: string;
  phase: "active" | "gated" | "killed";
  gate?: string;
}

export const ROADMAP: RoadmapItem[] = [
  { name: "pf_only mode", phase: "active" },
  { name: "ConvictionScorer", phase: "active" },
  { name: "EventMonitor signals", phase: "active" },
  { name: "Trailing Stop exits", phase: "active" },
  { name: "Economic Calendar blackout", phase: "active" },
  { name: "T70 scanner auto-execute", phase: "gated", gate: "T70 14-day review 2026-05-23 (Branch C)" },
  { name: "Confidence calibration", phase: "gated", gate: "ConvictionScorer recalibration on PF council N≥60 cohort" },
  { name: "Kraken live trading", phase: "gated", gate: "Council ladder: N≥60 PF closes + Sharpe≥1.0 + Brier≤0.25 (~2026-06-07 ETA)" },
  { name: "Autoresearch ratchet — TOM window-N", phase: "gated", gate: "First propose-doc shipped 2026-05-15; shadow.js + evaluator + arbiter build pending" },
  { name: "Surge Scanner", phase: "killed" },
  { name: "BTC Scalp", phase: "killed" },
  { name: "Research Agent", phase: "killed" },
  { name: "Scan Agent", phase: "killed" },
  { name: "Claude thesis validator", phase: "killed" },
  { name: "Agent ablation study", phase: "killed" },
];
