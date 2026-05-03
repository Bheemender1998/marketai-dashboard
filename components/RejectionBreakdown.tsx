"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Rejections } from "@/lib/types";

const GATE_TOOLTIPS: Record<string, string> = {
  already_have_position:
    "Signal blocked because a position on this ticker is already open. Prevents stacking unintended size on a single name. " +
    "Strategy stacking (one open position per source per ticker) is gated separately by strategy_stack_candidate.",
  safety_check_failed:
    "9-stage Risk Agent rejected the signal — covers stop-loss validation, target sanity, position-size cap ($55 max), " +
    "buying-power check, market-hours check, asset class compatibility, etc. Generic gate; check logs for the specific stage.",
  no_position_to_reduce:
    "REDUCE/SELL signal arrived for a ticker without an open paper position to close. Common when PF emits exit signals " +
    "for tickers that never opened (e.g., signals filtered out at validation but still emit a paired exit).",
  short_conviction_floor:
    "PF SHORT signal blocked because conviction (0.0-1.0 score from ConvictionScorer) is below SHORT_CONVICTION_FLOOR " +
    "(default 0.75). Fail-closed: missing conviction also blocks. Prevents low-conviction SHORTs from executing — SHORTs " +
    "have higher risk than LONGs in the current setup.",
  crypto_short_unavailable:
    "PF SHORT signal on crypto blocked at execution: Alpaca paper does not support shorting crypto. Recorded in postmortem " +
    "as a Kraken-staged sim cohort (post PR-2) for future Kraken SHORT-crypto activation evidence; does NOT count toward " +
    "Kraken go-live gate.",
  stock_short_unavailable:
    "PF SHORT signal on a stock that Alpaca marked not shortable (easy_to_borrow=false). Hard borrow / institutional-only " +
    "stocks fall here. Signal is logged but no paper trade opens.",
  validation_failed:
    "Signal failed signalValidator (entry/stop/target sanity, direction, ticker). Returns blocked={gate, reason} with the " +
    "specific validator error. Bug S T56 fix shipped 2026-05-02 ensures these don't shadow-tag-escape into postmortem.",
  sector_exposure_cap:
    "Signal would push sector exposure beyond cap. Prevents concentration risk by limiting how many tickers in the same " +
    "correlation group (25 universal groups in correlationFilter.js) can be held simultaneously.",
  execution_gate:
    "Generic execution-time gate failure (insufficient buying power, weekend, killswitch active, etc.). Reason field has " +
    "the specific cause. Does not shadow-contaminate postmortem (Bug S T56 fix shipped).",
  dry_run:
    "DRY_RUN env flag is true — no paper trades execute. Signals still flow through validation and logging.",
  r6_lockdown_shadow:
    "R6_LOCKDOWN env flag was true at signal time — R6.1 entry-zone auto-execute path was sealed during a contamination " +
    "lockdown. Should be inactive currently (R6_LOCKDOWN=false since 2026-04-26).",
};

function GateLabel({ gate }: { gate: string }) {
  const label = gate.replace(/_/g, " ");
  const tooltip = GATE_TOOLTIPS[gate];
  return (
    <span
      className={"capitalize" + (tooltip ? " cursor-help underline decoration-dotted decoration-muted-foreground/40" : "")}
      title={tooltip}
    >
      {label}
    </span>
  );
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
          <CardTitle
            className="text-base cursor-help underline decoration-dotted decoration-muted-foreground/40"
            title={
              "Per-gate count of signals blocked before execution. Each gate has its own meaning — hover the gate name " +
              "for details. High already_have_position counts are usually fine (signal was correct, position was already " +
              "open). High safety_check_failed needs investigation. High no_position_to_reduce indicates phantom REDUCE " +
              "signals for un-opened positions."
            }
          >
            Rejection Breakdown
          </CardTitle>
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
