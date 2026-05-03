"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaperMetrics, PfSignalSim } from "@/lib/types";

function MetricCell({
  label, live, backtest, format, color, tooltip,
}: {
  label: string;
  live: number;
  backtest: number;
  format: (n: number) => string;
  color: (n: number) => string;
  tooltip: string;
}) {
  return (
    <div className="space-y-1">
      <p
        className="text-[10px] text-muted-foreground uppercase tracking-wider cursor-help underline decoration-dotted decoration-muted-foreground/40"
        title={tooltip}
      >
        {label}
      </p>
      <p className={`text-lg font-mono font-semibold ${color(live)}`}>{format(live)}</p>
      <p className="text-[10px] text-muted-foreground font-mono">backtest: {format(backtest)}</p>
    </div>
  );
}

export function LiveMetricsPanel({
  metrics,
  loading,
}: {
  metrics: PaperMetrics | undefined;
  loading: boolean;
}) {
  if (loading || !metrics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">PF Signal Simulation vs Backtest</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pf: PfSignalSim = metrics.pfSignalSim;
  const { backtest } = metrics;
  const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const fmtNum = (n: number) => n.toFixed(2);
  const colorPos = (n: number) => n >= 0 ? "text-emerald-400" : "text-red-400";
  const colorSharpe = (n: number) => n >= 1 ? "text-emerald-400" : n >= 0 ? "text-amber-400" : "text-red-400";
  const colorDD = (n: number) => n > -0.05 ? "text-emerald-400" : n > -0.15 ? "text-amber-400" : "text-red-400";

  const isEmpty = pf.tradeCount === 0;
  const lifetimeWR = pf.lifetime.total > 0 ? Math.round((pf.lifetime.wins / pf.lifetime.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle
            className="text-base cursor-help underline decoration-dotted decoration-muted-foreground/40"
            title={
              "PF SIGNAL SIMULATION — postmortem agent watches each PatternFinding signal against its notional stop/target. " +
              "Disconnected from real Alpaca paper fills. A signal-sim LOSS does NOT mean a paper trade lost — the corresponding " +
              "paper position may still be open and profitable (different exit logic: trailing stops, partial profit at 75%, " +
              "breakeven at 50%). For real paper-fill performance see the PerfPanel above. " +
              "These numbers do NOT count toward the Kraken go-live gate."
            }
          >
            PF Signal Simulation vs Backtest
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            windowed: {pf.tradeCount} trades · {pf.dayCount} days
            {" · "}lifetime:{" "}
            <span className="font-mono">{pf.lifetime.total}</span> resolutions ·{" "}
            <span className="font-mono">{lifetimeWR}%</span> WR ·{" "}
            <span className={`font-mono ${pf.lifetime.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {pf.lifetime.pnl >= 0 ? "+" : ""}${pf.lifetime.pnl}
            </span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">PF: awaiting first signal resolution in the live ring buffer</p>
            <p className="text-[11px] text-muted-foreground">
              {pf.lifetime.total > 0 ? (
                <>
                  {pf.lifetime.total} lifetime PF resolutions exist but rotated out of the 200-entry buffer (currently dominated
                  by stale surge-era entries).{" "}
                </>
              ) : (
                <>No PF resolutions yet. </>
              )}
              Backtest baseline: ANN{" "}
              <span className="font-mono">{fmtPct(backtest.ann)}</span> · Sharpe{" "}
              <span className="font-mono">{fmtNum(backtest.sharpe)}</span> · MaxDD{" "}
              <span className="font-mono">{fmtPct(backtest.maxDD)}</span> over {backtest.events.toLocaleString()} events.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <MetricCell
              label="ANN Return"
              live={pf.ann}
              backtest={backtest.ann}
              format={fmtPct}
              color={colorPos}
              tooltip={"Annualized return = (totalPnl / $100k starting capital) × (365 / spanDays). Computed over the resolved-signal window. Backtest uses the same formula on historical events."}
            />
            <MetricCell
              label="Sharpe"
              live={pf.sharpe}
              backtest={backtest.sharpe}
              format={fmtNum}
              color={colorSharpe}
              tooltip={"Sharpe ratio = mean(dailyPnl) / std(dailyPnl) × √252. Returns 0 if fewer than 2 active days (need variance to compute std)."}
            />
            <MetricCell
              label="Max DD"
              live={pf.maxDD}
              backtest={backtest.maxDD}
              format={fmtPct}
              color={colorDD}
              tooltip={"Max drawdown = largest peak-to-trough drop in cumulative equity, expressed as a fraction of running peak (negative). E.g., -5.23% means equity dipped 5.23% below its prior peak at worst point."}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
