"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OpenPosition } from "@/lib/types";

function pct(entry: number, target: number) {
  return (((target - entry) / entry) * 100).toFixed(1);
}

function LoadingRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <TableRow key={i}>
          {[0, 1, 2, 3, 4].map((j) => (
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
  positions: OpenPosition[] | undefined;
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Ticker</TableHead>
              <TableHead className="text-xs">Side</TableHead>
              <TableHead className="text-xs text-right">Entry</TableHead>
              <TableHead className="text-xs text-right">Stop</TableHead>
              <TableHead className="text-xs text-right">Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <LoadingRows />
            ) : !positions?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                  No open positions
                </TableCell>
              </TableRow>
            ) : (
              positions.slice(0, 8).map((p) => (
                <TableRow key={p.ticker}>
                  <TableCell className="font-mono text-sm font-medium">{p.ticker}</TableCell>
                  <TableCell>
                    <Badge variant={p.direction === "LONG" ? "default" : "destructive"} className="text-xs">
                      {p.direction}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">${p.entryPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-400">
                    ${p.stop.toFixed(2)}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({pct(p.entryPrice, p.stop)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-emerald-400">
                    ${p.target.toFixed(2)}
                    <span className="text-xs text-muted-foreground ml-1">
                      (+{pct(p.entryPrice, p.target)}%)
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {(positions?.length ?? 0) > 8 && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            +{(positions?.length ?? 0) - 8} more positions
          </p>
        )}
      </CardContent>
    </Card>
  );
}
