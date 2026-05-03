"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EnrichedPosition } from "@/lib/types";

function pct(entry: number, target: number) {
  return (((target - entry) / entry) * 100).toFixed(1);
}

function LoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
            <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function OpenPositions({
  positions,
  loading,
}: {
  positions: EnrichedPosition[] | undefined;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Open Positions</CardTitle>
          <Badge variant="outline" className="text-xs font-mono">
            {loading ? "—" : positions?.length ?? 0}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[480px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="text-xs">Ticker</TableHead>
                <TableHead
                  className="text-xs cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="LONG = bet price goes up (buy now, sell later). SHORT = bet price goes down (borrow + sell now, buy back later). PF SHORTs require conviction ≥0.75 and shortable-on-Alpaca asset."
                >
                  Side
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Position quantity (shares for stocks, units for crypto). Sized from confidence: 80-100% conf=$55, 65-79%=$37, 50-64%=$28, <50%=$18. Hard cap $74."
                >
                  Qty
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Entry price = price at which the paper trade opened on Alpaca. Slippage from the signal's intended entry is captured in slippageUsd on the closed-trade record."
                >
                  Entry
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Current market price (latest bar / quote from Alpaca). Updated every dashboard refresh (~30s)."
                >
                  Current
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Market value = qty × current price. Notional exposure of this position right now."
                >
                  Mkt Val
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Stop loss price. Trailing logic: starts at the signal's specified stop, advances to breakeven once unrealized P&L hits 50% of target distance, trails at 30% distance after that."
                >
                  Stop
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Take-profit target price. Partial profit (50% of position) closed at 75% of target distance; remainder rides trailing stop."
                >
                  Target
                </TableHead>
                <TableHead
                  className="text-xs text-right cursor-help underline decoration-dotted decoration-muted-foreground/40"
                  title="Unrealized P&L = (current − entry) × qty for LONG, (entry − current) × qty for SHORT. Floats with current price; locks in only when the position closes."
                >
                  U-P&amp;L
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows />
              ) : !positions?.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-6">
                    No open positions
                  </TableCell>
                </TableRow>
              ) : (
                positions.map((p) => {
                  const upnl = p.unrealizedPnl ?? 0;
                  const upnlColor = upnl >= 0 ? "text-emerald-400" : "text-red-400";
                  return (
                    <TableRow key={p.ticker}>
                      <TableCell className="font-mono text-sm font-medium">{p.ticker}</TableCell>
                      <TableCell>
                        <Badge variant={p.direction === "LONG" ? "default" : "destructive"} className="text-xs">
                          {p.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {p.qty !== null ? p.qty.toFixed(p.qty < 1 ? 4 : 2) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">${p.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {p.currentPrice !== null ? `$${p.currentPrice.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground">
                        {p.marketValue !== null ? `$${p.marketValue.toFixed(2)}` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-red-400">
                        ${p.stop.toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-1">({pct(p.entryPrice, p.stop)}%)</span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-400">
                        ${p.target.toFixed(2)}
                        <span className="text-xs text-muted-foreground ml-1">(+{pct(p.entryPrice, p.target)}%)</span>
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${upnlColor}`}>
                        {p.unrealizedPnl !== null ? `${upnl >= 0 ? "+" : ""}$${upnl.toFixed(2)}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
