"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TruthSourcesLegend() {
  return (
    <Card className="border-blue-500/30 bg-blue-500/[0.02]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">How to read this dashboard</CardTitle>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">doctrine 2026-05-02</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground space-y-3 leading-relaxed">
        <div>
          <p className="font-semibold text-foreground mb-1">Two truth sources, two different things.</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>
              <span className="text-emerald-400 font-medium">Paper Fills (real)</span> — round-trips actually executed on Alpaca paper.
              Tracked by <span className="font-mono">/api/paper/stats</span>. The <span className="font-mono">PerfPanel</span> and{" "}
              <span className="font-mono">Open Positions</span> read this. <strong>27 historical fills are pre-PF mix</strong>{" "}
              (BTC scalp / picks / GLD era — sources now killed); excluded by doctrine from the Kraken go-live gate.
            </li>
            <li>
              <span className="text-blue-400 font-medium">Signal Simulation</span> — postmortem agent watches each emitted signal
              against its notional stop/target levels in price action. Independent of whether a paper trade ever opened.
              <strong> A signal can resolve LOSS in sim while the corresponding paper trade is still open and profitable</strong>
              {" "}— different exit logic. The <span className="font-mono">PF Signal Simulation</span> and{" "}
              <span className="font-mono">Signal Source Quality</span> panels read this.
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">Kraken go-live gate (PF-only doctrine).</p>
          <p>
            Flipping <span className="font-mono">TRADING_ENABLED=true</span> on Kraken requires{" "}
            <strong className="text-foreground">≥30 closed PatternFinding paper round-trips at ≥60% WR</strong>. Pre-PF fills
            don&apos;t count — their source pipelines are killed/dormant and have no causal link to live behavior. Currently:{" "}
            <strong className="text-foreground">0 / 30 PF closes</strong> (18 PF positions open).
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">SHORT crypto = parallel sim track, NOT gating.</p>
          <p>
            PF SHORT signals on crypto are paper-blocked on Alpaca (paper venue limitation). They&apos;ll be recorded as a
            separate <span className="font-mono">Kraken-staged sim</span> cohort (post next PR) — used for a future SHORT-crypto
            unlock decision, never for the 30/60% gate. Kraken Phase 1 = LONG-only at flip.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground mb-1">What you won&apos;t see here anymore.</p>
          <p>
            Killed pipelines (BTC scalp, picks, surge, watchlist autonomy, TA autonomy, market scanner) no longer appear in
            new panels. They&apos;re dead; rendering them confuses the live picture. The historical 27 paper fills are kept
            for context only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
