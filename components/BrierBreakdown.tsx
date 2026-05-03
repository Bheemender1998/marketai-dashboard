"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostmortemStats, PaperStats } from "@/lib/types";

const LIVE_SOURCES: Record<string, { label: string; note: string }> = {
  patternfinding: {
    label: "PatternFinding (PF)",
    note: "Active — ConvictionScorer gated, Claude bypassed. Signal-sim only — does not count toward Kraken gate.",
  },
  tom: {
    label: "Turn-of-Month emitter",
    note: "Mechanical signal source, 30-day Phase-1 falsification. Stocks/ETFs only. Reviews 2026-05-29 + 2026-06-28.",
  },
  t70: {
    label: "T70 Deterministic Scanner",
    note: "Alert-only currently. 14-day operational review 2026-05-09 — if ≥5 signals AND ≥50% WR, enable auto-execute.",
  },
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
  // Only render LIVE sources per dashboard-legibility doctrine 2026-05-02.
  // Killed sources (picks, btc_scalp_sim, surge, etc.) are intentionally hidden.
  const liveEntries = Object.entries(bySource).filter(([source]) => source in LIVE_SOURCES);
  const pfPaperOpen = paper?.openPositions?.length ?? 0;
  // PF paper fills: 0 in PR 1 (no source-tagging yet on alpacaTrader closed-trades).
  // Will read paper.bySource.patternfinding after PR 2 lands.
  const pfPaperClosed = 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle
            className="text-base cursor-help underline decoration-dotted decoration-muted-foreground/40"
            title={
              "Per-source SIGNAL SIMULATION quality from the postmortem agent. NOT real paper fills — these are notional " +
              "stop/target outcomes computed against price action, regardless of whether a paper trade ever executed. " +
              "Killed sources (picks, btc_scalp_sim, surge) are filtered out per the 2026-05-02 dashboard doctrine."
            }
          >
            Signal Source Quality
          </CardTitle>
          <span
            className="text-xs text-muted-foreground font-mono cursor-help underline decoration-dotted decoration-muted-foreground/30"
            title={
              "Brier score measures probabilistic calibration: 0.0 = perfect, 0.25 = random coin flip, 1.0 = always wrong. " +
              "Lower is better. Mean of squared (predicted_prob − actual_outcome) across resolved signals. Inflated historically " +
              "by old Claude picks contamination — per-source breakdown below shows clean sources only."
            }
          >
            avg Brier:{" "}
            <span className={postmortem?.avgBrier != null && postmortem.avgBrier > 0.25 ? "text-red-400" : "text-emerald-400"}>
              {postmortem?.avgBrier?.toFixed(3) ?? "—"}
            </span>
            {" "}(random = 0.250)
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Live signal sources only — killed pipelines hidden by doctrine
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {liveEntries.length === 0 ? (
              <div className="rounded-md border border-border bg-card/50 px-3 py-3 text-center">
                <p className="text-sm text-muted-foreground">No live-source resolutions yet</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  PF: 18 open, 0 closed. ToM: cron-armed, awaiting first emit. T70: alert-only.
                </p>
              </div>
            ) : (
              liveEntries.map(([source, bucket]) => {
                const meta = LIVE_SOURCES[source];
                const rate = wr(bucket);
                return (
                  <div key={source} className="rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">LIVE</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono font-semibold ${wrColor(rate)}`}>{rate}% sim-WR</span>
                        <span className="text-xs text-muted-foreground font-mono">{bucket.total} sim resolutions</span>
                        <span className={`text-xs font-mono ${bucket.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {bucket.pnl >= 0 ? "+" : ""}${bucket.pnl}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{meta.note}</p>
                  </div>
                );
              })
            )}

            <p
              className="text-xs text-muted-foreground pt-1 border-t border-border cursor-help"
              title={
                "T73 gate is the Claude-role re-evaluation: after 30+ closed PF paper round-trips on Alpaca, evaluate WR by " +
                "conviction tier and decide whether to add Claude back as a thesis validator. PR 2 will source-tag closed " +
                "paper trades so this counter reads PF-only — currently displayed value is a placeholder."
              }
            >
              T73 gate: ≥30 closed PF paper trades → evaluate Claude role.{" "}
              <span className="font-mono">{pfPaperClosed}/30</span> closed · {pfPaperOpen} open.
              <span className="ml-2 text-[10px] italic text-muted-foreground/70">
                (closed counter activates with PR 2 source-tagging)
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
