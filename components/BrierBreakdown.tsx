"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostmortemStats } from "@/lib/types";

const SOURCES = { patternfinding: "PatternFinding", tom: "Turn-of-Month", t70: "T70 scanner" };

export function BrierBreakdown({ postmortem, loading }: { postmortem: PostmortemStats | undefined; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base">Signal calibration: not established</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">Current conviction values are ranking scores, not validated probabilities. A legacy Brier calculation cannot clear the calibration gate.</p>
        {loading ? <Skeleton className="h-14 w-full" /> : !postmortem ? <p>Source counts are unavailable.</p> : (
          <dl className="space-y-2">
            {Object.entries(SOURCES).map(([key, label]) => (
              <div key={key} className="flex justify-between gap-4"><dt>{label}</dt><dd className="font-mono">{postmortem.bySource?.[key]?.total?.toLocaleString() ?? "—"} modeled resolutions</dd></div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}
