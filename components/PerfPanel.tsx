"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaperStats, TradingStatus } from "@/lib/types";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "red" | "yellow" | "default";
  loading?: boolean;
  tooltip?: string;
}

function MetricCard({ label, value, sub, color = "default", loading, tooltip }: MetricCardProps) {
  const colorClass =
    color === "green" ? "text-emerald-400" :
    color === "red" ? "text-red-400" :
    color === "yellow" ? "text-amber-400" :
    "text-foreground";

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p
          className={
            "text-xs text-muted-foreground uppercase tracking-wider mb-1" +
            (tooltip ? " cursor-help underline decoration-dotted decoration-muted-foreground/40" : "")
          }
          title={tooltip}
        >
          {label}
        </p>
        {loading ? (
          <Skeleton className="h-7 w-20 mt-1" />
        ) : (
          <p className={`text-2xl font-mono font-semibold ${colorClass}`}>{value}</p>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function PerfPanel({
  paper,
  trading,
  loading,
}: {
  paper: PaperStats | undefined;
  trading: TradingStatus | undefined;
  loading: boolean;
}) {
  const pf = paper?.bySource?.patternfinding;
  const legacy = paper?.bySource?.legacy_pre_pf;
  // Prefer PF bucket; fall back to legacy bucket; last resort: aggregate paper.
  const primaryWR = pf
    ? parseFloat(pf.winRate.replace("%", "")) || 0
    : parseFloat(paper?.winRate ?? "0");
  const primaryPnl = pf?.totalPnl ?? paper?.totalPnl ?? 0;
  const primaryTrades = pf?.totalTrades ?? paper?.totalTrades ?? 0;
  const primaryWins = pf?.wins ?? paper?.wins ?? 0;
  const primaryLosses = pf?.losses ?? paper?.losses ?? 0;
  const primaryLabel = pf ? "PF Paper WR" : "Paper WR (legacy)";
  const primaryPnlLabel = pf ? "PF Paper PnL" : "Paper PnL (legacy)";
  const legacySub = legacy
    ? `legacy: ${legacy.totalTrades} fills @ ${legacy.winRate}`
    : "";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        label={primaryLabel}
        value={loading ? "—" : `${Math.round(primaryWR)}%`}
        sub={
          loading
            ? ""
            : `${primaryTrades} trades · ${primaryWins}W/${primaryLosses}L${legacySub ? " · " + legacySub : ""}`
        }
        color={primaryWR >= 60 ? "green" : primaryWR >= 50 ? "yellow" : "red"}
        loading={loading}
        tooltip={
          pf
            ? "PatternFinding-only paper-fill win rate — counts toward the Kraken go-live gate (T21: ≥60% WR over ≥30 PF closes). " +
              "Pre-PF mixed-source fills are bucketed separately as legacy_pre_pf and excluded by doctrine 2026-05-02."
            : "Win rate across all paper fills on Alpaca. Pre-PF mixed-source mix (BTC scalp, picks, GLD era). " +
              "EXCLUDED from Kraken go-live gate by doctrine 2026-05-02. PF-only WR shows here once first PF paper trade closes."
        }
      />
      <MetricCard
        label={primaryPnlLabel}
        value={loading ? "—" : `${primaryPnl >= 0 ? "+" : ""}$${primaryPnl.toFixed(2)}`}
        color={primaryPnl >= 0 ? "green" : "red"}
        loading={loading}
        tooltip={
          pf
            ? "PatternFinding-only realized P&L (slippage and fees subtracted). Does NOT include unrealized P&L on the " +
              "currently-open PF positions."
            : "Cumulative realized P&L across all paper fills. Pre-PF mixed-source trades. Slippage/fees subtracted. " +
              "Does NOT include unrealized P&L on open positions."
        }
      />
      <MetricCard
        label="Open Positions"
        value={loading ? "—" : paper?.openPositions?.length ?? 0}
        sub="PatternFinding fills"
        loading={loading}
        tooltip={
          "Currently open paper positions on Alpaca. All PF-era opens are MARKETAI_100 universe (~100 tickers). " +
          "Each position has trailing-stop logic: breakeven at 50% to target, trailing at 30% distance after that, " +
          "partial profit at 75% of target."
        }
      />
      <MetricCard
        label="Paper Trading"
        value={paper?.paperTradingEnabled ? "ON" : "OFF"}
        color={paper?.paperTradingEnabled ? "green" : "red"}
        loading={loading}
        tooltip={
          "PAPER_TRADING_ENABLED env flag. When ON, PF signals execute as paper trades on Alpaca paper account. " +
          "When OFF, signals are still emitted and tracked in postmortem but no fills occur."
        }
      />
      <MetricCard
        label="Kraken Live"
        value={trading?.tradingEnabled ? "ON" : "OFF"}
        color={trading?.tradingEnabled ? "green" : "yellow"}
        sub={trading?.tradingEnabled ? undefined : "Needs ≥30 PF closes @ ≥60% WR"}
        loading={loading}
        tooltip={
          "TRADING_ENABLED env flag — controls Kraken live trading. PF-only doctrine 2026-05-02: requires ≥30 closed " +
          "PatternFinding paper round-trips on Alpaca at ≥60% WR before flip. Plus pentest + killswitch sim within 90 days, " +
          "rollback memo committed, Kraken Phase 1 LONG-only at flip."
        }
      />
      <MetricCard
        label="PF Mode"
        value="pf_only"
        sub="Claude bypassed"
        color="default"
        loading={false}
        tooltip={
          "PF_MODE env flag. pf_only = PatternFinding signals execute directly via ConvictionScorer fundamental gating, " +
          "Claude is NOT in the trade loop. Other modes (consensus, claude_only) constrain to a 9-ticker hardcoded portfolio. " +
          "pf_only enables the full MARKETAI_100 universe (~100 tickers excluding SPY/QQQ)."
        }
      />
    </div>
  );
}
