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
          {[0, 1, 2, 3, 4, 5, 6].map((j) => (
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
                <TableHead className="text-xs">Side</TableHead>
                <TableHead className="text-xs text-right">Entry</TableHead>
                <TableHead className="text-xs text-right">Current</TableHead>
                <TableHead className="text-xs text-right">Stop</TableHead>
                <TableHead className="text-xs text-right">Target</TableHead>
                <TableHead className="text-xs text-right">U-P&amp;L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <LoadingRows />
              ) : !positions?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
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
                      <TableCell className="text-right font-mono text-sm">${p.entryPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {p.currentPrice !== null ? `$${p.currentPrice.toFixed(2)}` : "—"}
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
