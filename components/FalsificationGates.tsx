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

  const totalTrades = paper?.totalTrades ?? 0;
  const wr = parseFloat(paper?.winRate ?? "0");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Falsification Gates</CardTitle>
        <p className="text-xs text-muted-foreground">Pre-committed conditions that unlock the next phase</p>
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
              desc="After 30+ closed PF paper trades: evaluate WR by conviction tier → decide whether to add Claude as thesis validator."
              value={totalTrades}
              max={T73_TARGET}
              unit=" trades"
              status={totalTrades >= T73_TARGET ? "pass" : "active"}
            />
            <GateRow
              id="T21"
              label="Go-Live WR Gate (Kraken)"
              desc="60% WR over 30+ paper trades required before TRADING_ENABLED=true. Currently: paper ledger."
              value={Math.round(wr)}
              max={T21_WR_TARGET}
              unit="%"
              status={wr >= T21_WR_TARGET && totalTrades >= T21_TRADES_TARGET ? "pass" : wr < 40 ? "blocked" : "active"}
            />
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Simulation WR (postmortem):{" "}
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
