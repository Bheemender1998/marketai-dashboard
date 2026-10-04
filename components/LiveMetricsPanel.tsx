"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaperMetrics } from "@/lib/types";

export function LiveMetricsPanel({ metrics, loading }: { metrics: PaperMetrics | undefined; loading: boolean }) {
  const pf = metrics?.pfSignalSim;
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Legacy signal simulation</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {loading ? <Skeleton className="h-10 w-full" /> : pf ? (
          <p>{pf.lifetime.total.toLocaleString()} recorded resolutions · {pf.tradeCount} in the current window · {pf.dayCount} active days</p>
        ) : <p>Signal simulation data is unavailable.</p>}
        <p>These overlapping modeled outcomes use legacy timing and a rotating history. They are not independent trades or completed forward-study cohorts. Portfolio returns and risk ratios are withheld because the underlying history cannot support them.</p>
      </CardContent>
    </Card>
  );
}
