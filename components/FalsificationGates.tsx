"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PaperStats, PostmortemStats } from "@/lib/types";

const T70_REVIEW_DATE = new Date("2026-05-09T00:00:00-07:00");
const T73_TARGET = 30;
const T21_WR_TARGET = 60;
const T21_TRADES_TARGET = 30;

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
  const t73Status: "pass" | "active" | "blocked" = pfPaperClosed >= T73_TARGET ? "pass" : "active";
  const t21Status: "pass" | "active" | "blocked" =
    pfPaperWR >= T21_WR_TARGET && pfPaperClosed >= T21_TRADES_TARGET
      ? "pass"
      : pfPaperClosed >= T21_TRADES_TARGET && pfPaperWR < 40
      ? "blocked"
      : "active";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Falsification Gates</CardTitle>
        <p className="text-xs text-muted-foreground">
          Pre-committed conditions that unlock the next phase · PF-only doctrine 2026-05-02
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
              desc="T70 scanner running alert-only. Review 2026-05-09 — if ≥5 signals AND ≥50% WR, enable auto-execute."
              value={t70Progress}
              max={t70Max}
              unit="d"
              status={t70DaysLeft === 0 ? "pass" : "active"}
            />
            <GateRow
              id="T73"
              label="Claude Role Re-evaluation"
              desc="After 30+ closed PF paper round-trips: evaluate WR by conviction tier → decide Claude's role as thesis validator. PF-only count; pre-PF historical 27 fills excluded by doctrine."
              value={pfPaperClosed}
              max={T73_TARGET}
              unit=" PF closes"
              status={t73Status}
            />
            <GateRow
              id="T21"
              label="Go-Live WR Gate (Kraken)"
              desc="≥60% WR over ≥30 closed PF paper round-trips required before TRADING_ENABLED=true. SHORT crypto signals tracked separately as Kraken-staged sim cohort (does NOT count toward this gate)."
              value={Math.round(pfPaperWR)}
              max={T21_WR_TARGET}
              unit="%"
              status={t21Status}
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
                Postmortem context · Simulation WR:{" "}
                <span className="font-mono">{postmortem?.winRate ?? "—"}%</span>
                {" · "}Brier score:{" "}
                <span className="font-mono">{postmortem?.avgBrier?.toFixed(3) ?? "—"}</span>
                {" · "}Pending signals:{" "}
                <span className="font-mono">{postmortem?.pendingCount?.toLocaleString() ?? "—"}</span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
