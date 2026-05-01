"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostmortemStats, PaperStats } from "@/lib/types";

const SOURCE_META: Record<string, { label: string; note: string }> = {
  picks:        { label: "Claude Picks (pre-PF)",   note: "Contaminated — old Claude picks at 65% conf, 7.7% actual WR" },
  btc_scalp_sim:{ label: "BTC Scalp Sim",           note: "Simulation only — killed 2026-04-14 (R:R structurally negative on Kraken)" },
  pf:           { label: "PatternFinding (PF)",      note: "Active — ConvictionScorer gated, Claude bypassed" },
};

function wr(bucket: { total: number; wins: number }): number {
  return bucket.total > 0 ? Math.round((bucket.wins / bucket.total) * 100) : 0;
}

function wrColor(rate: number): string {
  if (rate >= 60) return "text-emerald-400";
  if (rate >= 45) return "text-amber-400";
  return "text-red-400";
}

export function BrierBreakdown({
  postmortem,
  paper,
  loading,
}: {
  postmortem: PostmortemStats | undefined;
  paper: PaperStats | undefined;
  loading: boolean;
}) {
  const bySource = postmortem?.bySource ?? {};
  const pfPaperTrades = paper?.totalTrades ?? 0;
  const pfPaperWR = parseFloat(paper?.winRate ?? "0");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Signal Source Quality</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              avg Brier:{" "}
              <span className={postmortem?.avgBrier != null && postmortem.avgBrier > 0.25 ? "text-red-400" : "text-emerald-400"}>
                {postmortem?.avgBrier?.toFixed(3) ?? "—"}
              </span>
              {" "}(random = 0.250)
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Overall Brier inflated by old Claude picks contamination — per-source breakdown below
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Historical postmortem sources */}
            {Object.entries(bySource).map(([source, bucket]) => {
              const meta = SOURCE_META[source];
              const rate = wr(bucket);
              return (
                <div key={source} className="rounded-md border border-border bg-card/50 px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{meta?.label ?? source}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-mono font-semibold ${wrColor(rate)}`}>{rate}% WR</span>
                      <span className="text-xs text-muted-foreground font-mono">{bucket.total} trades</span>
                      <span className={`text-xs font-mono ${bucket.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {bucket.pnl >= 0 ? "+" : ""}${bucket.pnl}
                      </span>
                    </div>
                  </div>
                  {meta?.note && (
                    <p className="text-xs text-muted-foreground">{meta.note}</p>
                  )}
                </div>
              );
            })}

            {/* Live PF paper row */}
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{SOURCE_META.pf.label}</span>
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">LIVE</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {pfPaperTrades > 0 ? (
                    <>
                      <span className={`text-sm font-mono font-semibold ${wrColor(pfPaperWR)}`}>
                        {Math.round(pfPaperWR)}% WR
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">{pfPaperTrades} trades</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">accumulating…</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{SOURCE_META.pf.note}</p>
            </div>

            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              T73 gate: ≥30 closed PF paper trades → evaluate Claude role.{" "}
              <span className="font-mono">{pfPaperTrades}/30</span> closed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
