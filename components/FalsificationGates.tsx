"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PaperStats, PostmortemStats } from "@/lib/types";

const T70_REVIEW_DATE = new Date("2026-05-23T00:00:00-07:00");
// T73 verdict-N (decided early Option B 2026-05-15 at N=27 because Wilson
// worst-case at N=30 still cleared 55% gate). Bar renders 100% complete.
const T73_DECISION_N = 27;
// Council go-live ladder (supersedes T21). N closes is the only gate
// the dashboard tracks here; Sharpe + Brier surface in the postmortem
// footer below.
const COUNCIL_N_TARGET = 60;

function GateRow({
  id,
  label,
  desc,
  value,
  max,
  unit,
  status,
}: {
  id: string;
  label: string;
  desc: string;
  value: number;
  max: number;
  unit: string;
  status: "pass" | "active" | "blocked";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor =
    status === "pass" ? "bg-emerald-500" :
    status === "blocked" ? "bg-red-500" :
    "bg-blue-500";
  const badgeVariant = status === "pass" ? "default" : status === "blocked" ? "destructive" : "secondary";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{id}</span>
          <span className="text-sm font-medium">{label}</span>
          <Badge variant={badgeVariant} className="text-xs">
            {status === "pass" ? "PASS" : status === "blocked" ? "BLOCKED" : "ACTIVE"}
          </Badge>
        </div>
        <span className="text-sm font-mono">
          {value}{unit} / {max}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}

export function FalsificationGates({
  paper,
  postmortem,
  loading,
}: {
  paper: PaperStats | undefined;
  postmortem: PostmortemStats | undefined;
  loading: boolean;
}) {
  const now = new Date();
  const t70DaysLeft = Math.max(0, Math.ceil((T70_REVIEW_DATE.getTime() - now.getTime()) / 86400000));
  const t70Max = 14;
  const t70Progress = t70Max - t70DaysLeft;

  // Doctrine 2026-05-02: Kraken go-live gates on PF paper-fill performance only.
  // Pre-PF mixed-source paper fills (legacy_pre_pf bucket) are excluded from T73/T21.
  // bySource ships from backend PR 149.
  const pfBucket = paper?.bySource?.patternfinding;
  const legacyBucket = paper?.bySource?.legacy_pre_pf;
  const pfPaperClosed = pfBucket?.totalTrades ?? 0;
  const pfPaperWR = pfBucket ? parseFloat(pfBucket.winRate.replace("%", "")) || 0 : 0;
  const legacyPaperTrades = legacyBucket?.totalTrades ?? paper?.totalTrades ?? 0;
  const legacyPaperWR = legacyBucket
    ? parseFloat(legacyBucket.winRate.replace("%", "")) || 0
    : parseFloat(paper?.winRate ?? "0");
  // T73 verdict-locked Option B 2026-05-15 — render as PASS regardless of
  // current N (Wilson worst-case at decision time already cleared the gate).
  const t73Status: "pass" | "active" | "blocked" = "pass";
  // Council ladder = N≥60. Status is pass when N≥60, active otherwise.
  // No WR-blocked branch here — council ladder is a conjunction (N + Sharpe
  // + Brier), not single-blocked on any one metric.
  const councilStatus: "pass" | "active" | "blocked" =
    pfPaperClosed >= COUNCIL_N_TARGET ? "pass" : "active";

  // Live-source-filtered postmortem footer (PR 3, 2026-05-02). Backend PR 3
  // adds bySource[src].brierSum so the dashboard can compute live-only Brier.
  // Live-source WR is computed from sum(live.wins) / sum(live.total) — drops
  // the contaminated picks/btc_scalp_sim/surge contribution.
  const LIVE_SOURCE_KEYS = ["patternfinding", "tom", "t70"];
  const { liveSourceWR, liveSourceBrier } = (() => {
    const bs = postmortem?.bySource ?? {};
    let wins = 0;
    let total = 0;
    let brierSum = 0;
    let brierTotal = 0;
    for (const k of LIVE_SOURCE_KEYS) {
      const b = bs[k];
      if (!b) continue;
      total += b.total;
      wins += b.wins;
      if (typeof b.brierSum === "number") {
        brierSum += b.brierSum;
        brierTotal += b.total;
      }
    }
    return {
      liveSourceWR: total > 0 ? Math.round((wins / total) * 100) : null,
      liveSourceBrier: brierTotal > 0 ? brierSum / brierTotal : null,
    };
  })();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Falsification Gates</CardTitle>
        <p className="text-xs text-muted-foreground">
          Pre-committed conditions on the path to TRADING_ENABLED=true · PF-only doctrine 2026-05-02 · Edge EARLY-PROVEN 2026-05-15
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading gate data…</p>
        ) : (
          <>
            <GateRow
              id="T70"
              label="Deterministic Scanner Review"
              desc="T70 scanner running alert-only. Review 2026-05-23 (Branch C extension — low signal volume). If ≥5 signals AND ≥50% WR at review, enable auto-execute."
              value={t70Progress}
              max={t70Max}
              unit="d"
              status={t70DaysLeft === 0 ? "pass" : "active"}
            />
            <GateRow
              id="T73"
              label="Edge Proof Gate (CLEARED 2026-05-15)"
              desc="Verdict 2026-05-15 Option B locked at N=27 — 24W/4L (85.2% WR), Wilson 95% LB 67.5% > 55% gate by 12.5pp. Claude bypassed permanently; harden ConvictionScorer instead."
              value={T73_DECISION_N}
              max={T73_DECISION_N}
              unit=" PF closes"
              status={t73Status}
            />
            <GateRow
              id="N≥60"
              label="Council Go-Live Ladder"
              desc="PF cohort target = N≥60 closes for council eval. Full ladder is N + Sharpe≥1.0 + Brier≤0.25 (Sharpe and Brier surface in postmortem footer below). Supersedes T21. ETA ~2026-06-07 at current cadence."
              value={pfPaperClosed}
              max={COUNCIL_N_TARGET}
              unit=" PF closes"
              status={councilStatus}
            />
            <div className="pt-2 border-t border-border space-y-1">
              <p
                className="text-xs text-muted-foreground cursor-help"
                title={
                  "PF paper round-trips on Alpaca, source-tagged at execution. Backend bySource rollup distinguishes " +
                  "patternfinding (counts toward gate) from legacy_pre_pf (excluded by doctrine 2026-05-02). " +
                  "Source-tagging is forward-only — pre-PR historical 27 fills bucket as legacy_pre_pf because their " +
                  "original source was lost when the killed pipelines were torn down."
                }
              >
                Pre-PF historical (excluded by doctrine):{" "}
                <span className="font-mono">{legacyPaperTrades}</span> fills @{" "}
                <span className="font-mono">{Math.round(legacyPaperWR)}%</span> WR (BTC scalp / picks / GLD era — all sources killed/dormant).
              </p>
              <p className="text-xs text-muted-foreground">
                Postmortem context · Live-source sim WR:{" "}
                <span className="font-mono">{liveSourceWR !== null ? `${liveSourceWR}%` : "—"}</span>
                {" · "}Live-source Brier:{" "}
                <span className="font-mono">{liveSourceBrier !== null ? liveSourceBrier.toFixed(3) : "—"}</span>
                {" · "}Pending signals:{" "}
                <span className="font-mono">{postmortem?.pendingCount?.toLocaleString() ?? "—"}</span>
                {liveSourceWR === null && (
                  <span
                    className="ml-2 italic cursor-help"
                    title="Per-source live filter requires backend PR 3 brierSum + bySource accumulators. Once deployed, mixed-source 26%/0.315 numbers (contaminated by killed picks/btc_scalp) get filtered out."
                  >
                    (live filter active post backend PR 3)
                  </span>
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
