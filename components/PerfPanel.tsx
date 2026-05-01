"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaperStats, TradingStatus } from "@/lib/types";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "red" | "yellow" | "default";
  loading?: boolean;
}

function MetricCard({ label, value, sub, color = "default", loading }: MetricCardProps) {
  const colorClass =
    color === "green" ? "text-emerald-400" :
    color === "red" ? "text-red-400" :
    color === "yellow" ? "text-amber-400" :
    "text-foreground";

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {loading ? (
          <Skeleton className="h-7 w-20 mt-1" />
        ) : (
          <p className={`text-2xl font-mono font-semibold ${colorClass}`}>{value}</p>
        )}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function PerfPanel({
  paper,
  trading,
  loading,
}: {
  paper: PaperStats | undefined;
  trading: TradingStatus | undefined;
  loading: boolean;
}) {
  const pnl = paper?.totalPnl ?? 0;
  const wr = parseFloat(paper?.winRate ?? "0");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard
        label="Paper WR"
        value={loading ? "—" : paper?.winRate ?? "—"}
        sub={loading ? "" : `${paper?.totalTrades ?? 0} trades · ${paper?.wins ?? 0}W/${paper?.losses ?? 0}L`}
        color={wr >= 60 ? "green" : wr >= 50 ? "yellow" : "red"}
        loading={loading}
      />
      <MetricCard
        label="Paper PnL"
        value={loading ? "—" : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}`}
        color={pnl >= 0 ? "green" : "red"}
        loading={loading}
      />
      <MetricCard
        label="Open Positions"
        value={loading ? "—" : paper?.openPositions?.length ?? 0}
        sub="PatternFinding fills"
        loading={loading}
      />
      <MetricCard
        label="Paper Trading"
        value={paper?.paperTradingEnabled ? "ON" : "OFF"}
        color={paper?.paperTradingEnabled ? "green" : "red"}
        loading={loading}
      />
      <MetricCard
        label="Kraken Live"
        value={trading?.tradingEnabled ? "ON" : "OFF"}
        color={trading?.tradingEnabled ? "green" : "yellow"}
        sub={trading?.tradingEnabled ? undefined : "Needs 60% WR"}
        loading={loading}
      />
      <MetricCard
        label="PF Mode"
        value="pf_only"
        sub="Claude bypassed"
        color="default"
        loading={false}
      />
    </div>
  );
}
