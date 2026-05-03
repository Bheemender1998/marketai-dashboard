"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Rejections, PostmortemStats } from "@/lib/types";

export function KrakenStagedSimPanel({
  rejections,
  postmortem,
  loading,
}: {
  rejections: Rejections | undefined;
  postmortem: PostmortemStats | undefined;
  loading: boolean;
}) {
  // Count of SHORT crypto signals paper-blocked (would have traded on Kraken).
  // Source: /api/rejections.byGate where gate === 'crypto_short_unavailable'.
  // Limitation: this is a COUNT only — not a sim track-record. Building a real
  // "would-have-traded WR/PnL" cohort requires backend work: synthesize stop/
  // target levels for blocked signals (PF emits only `entry`, no stop/target
  // until executePaperTrade reconciles), set shadow=true to prevent live-stats
  // contamination, and add testRunner assertions. Deferred — see commit body.
  const cryptoShortBlocked = rejections?.byGate?.find(
    (g) => g.gate === "crypto_short_unavailable"
  )?.count ?? 0;

  // If a future backend PR populates bySource.kraken_staged_short_crypto with
  // proper sim outcomes, this panel auto-upgrades by reading that bucket.
  const stagedBucket = postmortem?.bySource?.kraken_staged_short_crypto;
  const hasSimData = stagedBucket != null && stagedBucket.total > 0;

  return (
    <Card className="border-amber-500/30 bg-amber-500/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle
            className="text-base cursor-help underline decoration-dotted decoration-muted-foreground/40"
            title={
              "Kraken-staged sim cohort: PatternFinding SHORT crypto signals that paper-blocked on Alpaca " +
              "(line 529-531 of src/alpacaTrader.js — Alpaca paper venue cannot short crypto). These signals " +
              "would have routed to Kraken once TRADING_ENABLED=true. Tracking them as a separate cohort builds " +
              "evidence for a future Kraken SHORT-crypto activation decision (does NOT count toward the Kraken " +
              "go-live gate, which is paper-fill round-trips only per 2026-05-02 doctrine)."
            }
          >
            Kraken-Staged Sim Cohort
          </CardTitle>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">SHORT crypto · paper-blocked</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          PF SHORT crypto signals that would have routed to Kraken (Alpaca paper can&apos;t short crypto)
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Signals blocked (lifetime)
                </p>
                <p className="text-2xl font-mono font-semibold text-amber-400">
                  {cryptoShortBlocked}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  from /api/rejections gate=crypto_short_unavailable
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Sim track-record
                </p>
                {hasSimData ? (
                  <>
                    <p className="text-2xl font-mono font-semibold">
                      {Math.round((stagedBucket!.wins / stagedBucket!.total) * 100)}% WR
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {stagedBucket!.total} resolved · ${stagedBucket!.pnl} sim PnL
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-mono text-muted-foreground">awaiting backend</p>
                    <p
                      className="text-[10px] text-muted-foreground mt-1 cursor-help"
                      title={
                        "Sim WR/PnL requires backend work that adversarial review BLOCKED in this session: " +
                        "synthesize stop/target for blocked signals (PF emits only entry), set shadow=true to " +
                        "prevent live-stats contamination, add testRunner assertions for the blocked-signal → " +
                        "postmortem round-trip. Deferred to a future PR with full coverage."
                      }
                    >
                      bySource.kraken_staged_short_crypto not populated yet
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Activation criterion (proposed):</strong> ≥10 round-trip-equivalent
                sim resolutions at ≥60% sim-WR before Kraken Phase 1 LONG-only gate unlocks Phase 2 SHORT-crypto
                trading. Until then, Kraken go-live (when it triggers) is{" "}
                <span className="font-mono">KRAKEN_DIRECTION_WHITELIST=LONG</span> only.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
