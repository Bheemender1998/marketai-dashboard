"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaperStats, PostmortemStats, Rejections } from "@/lib/types";

const LIVE_SOURCES: Record<string, { label: string; status: string }> = {
  patternfinding: { label: "PatternFinding (PF)",      status: "executor" },
  tom:            { label: "Turn-of-Month emitter",     status: "alert-only · 30d obs" },
  t70:            { label: "T70 Deterministic Scanner", status: "alert-only · 14d review" },
};

interface SourceFlow {
  source: string;
  label: string;
  statusNote: string;
  emittedLifetime: number;
  executedLifetime: number;
  resolvedLifetime: number;
  pendingShare: string;
}

export function SignalActivityPanel({
  paper,
  postmortem,
  rejections,
  loading,
}: {
  paper: PaperStats | undefined;
  postmortem: PostmortemStats | undefined;
  rejections: Rejections | undefined;
  loading: boolean;
}) {
  // Build per-source flow rows from existing endpoints.
  // Limitation: postmortem.pendingCount is NOT per-source today, so pendingShare
  // is shown as proportional split if multiple sources have resolved signals.
  // /api/rejections.byGate is per-gate, not per-source — overall block count is
  // shown as a separate total below the table.
  const pmBySource = postmortem?.bySource ?? {};
  const paperBySource = paper?.bySource ?? {};
  const totalResolvedAcrossLive = Object.entries(pmBySource)
    .filter(([s]) => s in LIVE_SOURCES)
    .reduce((sum, [, b]) => sum + (b?.total ?? 0), 0);
  const pendingTotal = postmortem?.pendingCount ?? 0;

  const rows: SourceFlow[] = Object.keys(LIVE_SOURCES).map((source) => {
    const meta = LIVE_SOURCES[source];
    const pm = pmBySource[source];
    const pp = paperBySource[source];
    const resolved = pm?.total ?? 0;
    const executed = pp?.totalTrades ?? 0;
    // Emit ~ resolved + (pending share) + (executed but not yet resolved). For
    // the lifetime view, emit ≈ resolved + executed (no double-count: executed
    // signals that resolved are already in resolved).
    const emitted = resolved + Math.max(0, executed - resolved);
    const pendingShare =
      totalResolvedAcrossLive > 0 && pendingTotal > 0
        ? `~${Math.round((resolved / totalResolvedAcrossLive) * pendingTotal)}`
        : "0";
    return {
      source,
      label: meta.label,
      statusNote: meta.status,
      emittedLifetime: emitted,
      executedLifetime: executed,
      resolvedLifetime: resolved,
      pendingShare,
    };
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle
            className="text-base cursor-help underline decoration-dotted decoration-muted-foreground/40"
            title={
              "Per-source signal-flow snapshot. EMITTED = signals sent to postmortem (resolved + pending + executed). " +
              "EXECUTED = paper trades opened on Alpaca (counts toward Kraken go-live gate). " +
              "RESOLVED = signal-sim outcomes (notional stop/target hit; independent of paper-trade outcome). " +
              "PENDING (~) = postmortem signals awaiting resolution (proportionally allocated since pendingCount is not per-source today). " +
              "Killed sources (picks, btc_scalp_sim, surge) are filtered out per dashboard doctrine 2026-05-02."
            }
          >
            Signal Activity (live sources)
          </CardTitle>
          <span className="text-xs text-muted-foreground font-mono">
            {loading ? "—" : `${rejections?.last24hCount ?? 0} blocked / 24h`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          What&apos;s flowing through the live pipelines · lifetime totals (24h block counter is endpoint-aggregated, not per-source)
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-xs text-right">Emitted</TableHead>
                    <TableHead className="text-xs text-right">Executed</TableHead>
                    <TableHead className="text-xs text-right">Resolved (sim)</TableHead>
                    <TableHead className="text-xs text-right">Pending (~)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.source}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{r.label}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{r.statusNote}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.emittedLifetime}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-emerald-400">{r.executedLifetime}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-blue-400">{r.resolvedLifetime}</TableCell>
                      <TableCell className="text-right font-mono text-xs text-muted-foreground">{r.pendingShare}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground pt-3 border-t border-border mt-3">
              Total blocked signals (24h):{" "}
              <span className="font-mono">{rejections?.last24hCount?.toLocaleString() ?? "—"}</span>
              {" · "}lifetime blocked:{" "}
              <span className="font-mono">{rejections?.total?.toLocaleString() ?? "—"}</span>
              {" · "}see RejectionBreakdown panel for per-gate split.{" "}
              <span
                className="ml-1 italic cursor-help"
                title="Per-source block counts not yet exposed by /api/rejections (byGate is per-gate, not per-source). A future backend PR can split byGate × bySource if the per-source attribution is needed for kill/keep decisions."
              >
                (per-source split deferred)
              </span>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
