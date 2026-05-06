"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EnrichedPosition, PaperMetrics, PaperStats, RecentTrade } from "@/lib/types";

interface ActualMetrics {
  sharpe: number | null;
  maxDD: number;
  ann: number | null;
  unrealizedPnl: number;
  profitable: number;
  totalMktVal: number;
  dayCount: number;
  closedPnl: number;
}

function computePFActualMetrics(
  recentTrades: RecentTrade[],
  pfPositions: EnrichedPosition[]
): ActualMetrics {
  const pfTrades = recentTrades
    .filter((t) => t.source === "patternfinding")
    .sort((a, b) => a.date.localeCompare(b.date));

  const dailyPnl: Record<string, number> = {};
  for (const t of pfTrades) {
    const day = t.date.slice(0, 10);
    dailyPnl[day] = (dailyPnl[day] ?? 0) + t.pnlUsd;
  }
  const dailyReturns = Object.values(dailyPnl);
  const n = dailyReturns.length;
  const mean = n > 0 ? dailyReturns.reduce((a, b) => a + b, 0) / n : 0;
  const variance =
    n > 1
      ? dailyReturns.reduce((s, r) => s + (r - mean) ** 2, 0) / (n - 1)
      : 0;
  const sharpe =
    n > 1 && variance > 0 ? (mean / Math.sqrt(variance)) * Math.sqrt(252) : null;

  let equity = 0, peak = 0, maxDD = 0;
  for (const t of pfTrades) {
    equity += t.pnlUsd;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (equity - peak) / peak : 0;
    if (dd < maxDD) maxDD = dd;
  }

  const unrealizedPnl = pfPositions.reduce((s, p) => s + (p.unrealizedPnl ?? 0), 0);
  const profitable = pfPositions.filter((p) => (p.unrealizedPnl ?? 0) > 0).length;
  const totalMktVal = pfPositions.reduce((s, p) => s + (p.marketValue ?? 0), 0);
  const closedPnl = pfTrades.reduce((s, t) => s + t.pnlUsd, 0);

  let ann: number | null = null;
  if (pfTrades.length >= 2) {
    const t0 = new Date(pfTrades[0].date).getTime();
    const t1 = new Date(pfTrades[pfTrades.length - 1].date).getTime();
    const daySpan = Math.max(1, (t1 - t0) / 86400000);
    if (daySpan >= 7) {
      const refCapital = totalMktVal > 0 ? totalMktVal : 37 * pfTrades.length;
      ann = (closedPnl / refCapital) * (365 / daySpan);
    }
  }

  return { sharpe, maxDD, ann, unrealizedPnl, profitable, totalMktVal, dayCount: n, closedPnl };
}

function MetricMini({
  label,
  value,
  sub,
  color,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  tooltip?: string;
}) {
  return (
    <div className="space-y-0.5" title={tooltip}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`font-mono font-semibold text-sm ${color ?? ""}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground font-mono">{sub}</p>}
    </div>
  );
}

export function PFOnlyPanel({
  positions,
  metrics,
  paper,
  loading,
}: {
  positions: EnrichedPosition[] | undefined;
  metrics: PaperMetrics | undefined;
  paper: PaperStats | undefined;
  loading: boolean;
}) {
  const pfPositions = positions?.filter((p) => p.source === "patternfinding") ?? [];
  const backtest = metrics?.backtest;
  const pfSim = metrics?.pfSignalSim;
  const byPF = paper?.bySource?.patternfinding;

  const actual = computePFActualMetrics(paper?.recentTrades ?? [], pfPositions);

  const closedWR =
    byPF && (byPF.wins + byPF.losses) > 0
      ? Math.round((byPF.wins / (byPF.wins + byPF.losses)) * 100)
      : null;
  const closedCount = (byPF?.wins ?? 0) + (byPF?.losses ?? 0);
  const target = backtest?.target ?? 30;
  const progressPct = Math.min(100, Math.round((closedCount / target) * 100));

  const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const fmtPnl = (n: number) => `${n >= 0 ? "+" : ""}$${Math.abs(n).toFixed(2)}`;

  return (
    <Card className="border-amber-500/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Alpaca Paper — PF-Sourced Fills</CardTitle>
          <Badge variant="outline" className="text-xs font-mono">
            {closedCount}/{target} closes to gate
          </Badge>
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {loading || !metrics || !paper ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <>
            {/* ── Simulation context strip ── */}
            <div
              className="rounded-md bg-muted/40 border border-border/40 px-3 py-2 text-[11px] text-muted-foreground"
              title="Raw PF signal pool — postmortem agent tracks every signal against its notional stop/target, independent of whether an Alpaca order was placed. ConvictionScorer + safety gates filter this pool down to actual paper fills."
            >
              <span className="font-medium text-foreground/60">Signal simulation (unfiltered pool):</span>
              {pfSim ? (
                <span className="ml-2 font-mono">
                  {pfSim.tradeCount} trades · ANN{" "}
                  <span className={pfSim.ann >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {fmtPct(pfSim.ann)}
                  </span>{" "}
                  · Sharpe{" "}
                  <span className={pfSim.sharpe >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {pfSim.sharpe.toFixed(2)}
                  </span>{" "}
                  · MaxDD{" "}
                  <span className={pfSim.maxDD > -0.05 ? "text-emerald-400" : "text-red-400"}>
                    {fmtPct(pfSim.maxDD)}
                  </span>
                </span>
              ) : (
                <span className="ml-2 text-muted-foreground">no windowed data yet</span>
              )}
            </div>

            {/* ── Closed fills metrics ── */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Closed fills ({closedCount} trades)
              </p>
              <div className="grid grid-cols-4 gap-3">
                <MetricMini
                  label="Win Rate"
                  value={closedWR !== null ? `${closedWR}%` : "—"}
                  sub={byPF ? `${byPF.wins}W/${byPF.losses}L` : "no closes"}
                  color={closedWR !== null && closedWR >= 60 ? "text-emerald-400" : "text-amber-400"}
                  tooltip="Closed PF-sourced paper fills only. Does not include open unrealized positions."
                />
                <MetricMini
                  label="Realized PnL"
                  value={byPF ? fmtPnl(byPF.totalPnl) : "—"}
                  color={(byPF?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}
                  tooltip="Sum of pnlUsd for all closed patternfinding-sourced paper trades."
                />
                <MetricMini
                  label={`Sharpe${actual.dayCount > 0 ? ` (${actual.dayCount}d)` : ""}`}
                  value={actual.sharpe !== null ? actual.sharpe.toFixed(2) : "— (<2d)"}
                  color={
                    actual.sharpe === null
                      ? "text-muted-foreground"
                      : actual.sharpe >= 1
                      ? "text-emerald-400"
                      : actual.sharpe >= 0
                      ? "text-amber-400"
                      : "text-red-400"
                  }
                  tooltip={`Dollar-Sharpe: mean(dailyPnl)/std(dailyPnl)×√252 over ${actual.dayCount} active trading day(s). Statistically meaningful at N≥30 days.`}
                />
                <MetricMini
                  label="Max DD"
                  value={fmtPct(actual.maxDD)}
                  color={actual.maxDD > -0.05 ? "text-emerald-400" : actual.maxDD > -0.15 ? "text-amber-400" : "text-red-400"}
                  tooltip="Largest peak-to-trough drop in cumulative closed-trade equity."
                />
              </div>
              <div className="mt-2">
                <MetricMini
                  label={`ANN${actual.ann === null ? " (<7d)" : ""}`}
                  value={actual.ann !== null ? fmtPct(actual.ann) : "— (<7d)"}
                  color={actual.ann === null ? "text-muted-foreground" : actual.ann >= 0 ? "text-emerald-400" : "text-red-400"}
                  tooltip="Annualized return = (realizedPnl / capitalDeployed) × (365 / daySpan). Shown only when daySpan ≥ 7 days."
                />
              </div>
            </div>

            {/* ── Open positions aggregate ── */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Open positions ({pfPositions.length})
              </p>
              <div className="grid grid-cols-4 gap-3">
                <MetricMini
                  label="Unrealized PnL"
                  value={fmtPnl(actual.unrealizedPnl)}
                  color={actual.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}
                  tooltip="Sum of unrealizedPnl across all open PF-sourced positions (mark-to-market)."
                />
                <MetricMini
                  label="% Profitable"
                  value={pfPositions.length > 0 ? `${Math.round((actual.profitable / pfPositions.length) * 100)}%` : "—"}
                  sub={`${actual.profitable}/${pfPositions.length} up`}
                  color={actual.profitable / Math.max(pfPositions.length, 1) >= 0.6 ? "text-emerald-400" : "text-amber-400"}
                  tooltip="Fraction of open positions currently showing positive unrealized PnL."
                />
                <MetricMini
                  label="Mkt Value"
                  value={`$${actual.totalMktVal.toFixed(0)}`}
                  tooltip="Total mark-to-market value of PF-sourced open positions."
                />
                <MetricMini
                  label="Combined PnL"
                  value={fmtPnl((byPF?.totalPnl ?? 0) + actual.unrealizedPnl)}
                  color={(byPF?.totalPnl ?? 0) + actual.unrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}
                  tooltip="Realized PnL (closed fills) + unrealized PnL (open positions). Total PF P&L at mark-to-market."
                />
              </div>
            </div>

            {/* ── Open positions table ── */}
            <div>
              <div className="max-h-[280px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-xs">Ticker</TableHead>
                      <TableHead className="text-xs">Strategy</TableHead>
                      <TableHead className="text-xs text-right">Entry</TableHead>
                      <TableHead className="text-xs text-right">Current</TableHead>
                      <TableHead className="text-xs text-right">U-P&amp;L</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pfPositions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-4">
                          No PF-source open positions yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      pfPositions.map((p) => {
                        const upnl = p.unrealizedPnl ?? 0;
                        return (
                          <TableRow key={p.ticker}>
                            <TableCell className="font-mono text-sm">{p.ticker}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.pfStrategy ?? "—"}</TableCell>
                            <TableCell className="text-right font-mono text-sm">${p.entryPrice.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {p.currentPrice !== null ? `$${p.currentPrice.toFixed(2)}` : "—"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono text-sm ${upnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {p.unrealizedPnl !== null
                                ? `${upnl >= 0 ? "+" : ""}$${Math.abs(upnl).toFixed(2)}`
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
