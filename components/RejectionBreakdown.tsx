"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Rejections } from "@/lib/types";

function GateLabel({ gate }: { gate: string }) {
  const label = gate.replace(/_/g, " ");
  return <span className="capitalize">{label}</span>;
}

export function RejectionBreakdown({
  rejections,
  loading,
}: {
  rejections: Rejections | undefined;
  loading: boolean;
}) {
  const total = rejections?.total ?? 0;
  const top = rejections?.byGate?.slice(0, 7) ?? [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Rejection Breakdown</CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {loading ? "—" : `${rejections?.last24hCount ?? 0} last 24h`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-6 w-full" />)
        ) : top.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No rejection data</p>
        ) : (
          top.map(({ gate, count }) => {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={gate}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <GateLabel gate={gate} />
                  <span className="font-mono text-xs text-muted-foreground">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
        {!loading && total > 0 && (
          <p className="text-xs text-muted-foreground pt-1">
            {total.toLocaleString()} total rejections logged
          </p>
        )}
      </CardContent>
    </Card>
  );
}
