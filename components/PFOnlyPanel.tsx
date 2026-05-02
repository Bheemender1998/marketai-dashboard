"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EnrichedPosition, PaperMetrics } from "@/lib/types";

export function PFOnlyPanel({
  positions,
  metrics,
  loading,
}: {
  positions: EnrichedPosition[] | undefined;
  metrics: PaperMetrics | undefined;
  loading: boolean;
}) {
  const pfPositions = positions?.filter(p => p.source === "patternfinding") ?? [];
  const pf = metrics?.patternfinding;
  const backtest = metrics?.backtest;
  const progress = backtest ? (pf?.tradeCount ?? 0) / backtest.target : 0;
  const progressPct = Math.min(100, Math.round(progress * 100));

  return (
    <Card className="border-amber-500/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">PatternFinding — Isolated Performance</CardTitle>
          <Badge variant="outline" className="text-xs font-mono">
            {pf?.tradeCount ?? 0}/{backtest?.target ?? 30} live
          </Badge>
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-amber-400 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !metrics ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Trades</p>
                <p className="font-mono font-semibold">{pf?.tradeCount ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">PnL</p>
                <p className={`font-mono font-semibold ${(pf?.totalPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {(pf?.totalPnl ?? 0) >= 0 ? "+" : ""}${(pf?.totalPnl ?? 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Sharpe</p>
                <p className="font-mono font-semibold">{(pf?.sharpe ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Max DD</p>
                <p className="font-mono font-semibold text-red-400">{((pf?.maxDD ?? 0) * 100).toFixed(2)}%</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-2">PF-Source Open Positions ({pfPositions.length})</p>
              <div className="max-h-[240px] overflow-y-auto">
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
                            <TableCell className={`text-right font-mono text-sm ${upnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {p.unrealizedPnl !== null ? `${upnl >= 0 ? "+" : ""}$${upnl.toFixed(2)}` : "—"}
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
