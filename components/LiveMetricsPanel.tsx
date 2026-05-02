"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaperMetrics } from "@/lib/types";

function MetricCell({
  label, live, backtest, format, color,
}: {
  label: string;
  live: number;
  backtest: number;
  format: (n: number) => string;
  color: (n: number) => string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
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
          <CardTitle className="text-base">Live vs Backtest Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { all, backtest } = metrics;
  const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const fmtNum = (n: number) => n.toFixed(2);
  const colorPos = (n: number) => n >= 0 ? "text-emerald-400" : "text-red-400";
  const colorSharpe = (n: number) => n >= 1 ? "text-emerald-400" : n >= 0 ? "text-amber-400" : "text-red-400";
  const colorDD = (n: number) => n > -0.05 ? "text-emerald-400" : n > -0.15 ? "text-amber-400" : "text-red-400";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Live vs Backtest Metrics</CardTitle>
        <p className="text-xs text-muted-foreground">
          {all.tradeCount} trades · {all.dayCount} active days
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <MetricCell label="ANN Return"  live={all.ann}    backtest={backtest.ann}    format={fmtPct} color={colorPos} />
          <MetricCell label="Sharpe"      live={all.sharpe} backtest={backtest.sharpe} format={fmtNum} color={colorSharpe} />
          <MetricCell label="Max DD"      live={all.maxDD}  backtest={backtest.maxDD}  format={fmtPct} color={colorDD} />
        </div>
      </CardContent>
    </Card>
  );
}
