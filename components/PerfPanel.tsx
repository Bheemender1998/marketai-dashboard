"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaperStats, TradingStatus } from "@/lib/types";
import { money, type BrokerAccounting } from "@/lib/accounting";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "red" | "yellow" | "default";
  loading?: boolean;
  tooltip?: string;
}

function MetricCard({ label, value, sub, color = "default", loading, tooltip }: MetricCardProps) {
  const colorClass =
    color === "green" ? "text-emerald-400" :
    color === "red" ? "text-red-400" :
    color === "yellow" ? "text-amber-400" :
    "text-foreground";

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p
          className={
            "text-xs text-muted-foreground uppercase tracking-wider mb-1" +
            (tooltip ? " cursor-help underline decoration-dotted decoration-muted-foreground/40" : "")
          }
          title={tooltip}
        >
          {label}
        </p>
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

export function PerfPanel({ paper, trading, accounting, loading, accountingLoading }: {
  paper: PaperStats | undefined;
  trading: TradingStatus | undefined;
  accounting: BrokerAccounting | null;
  loading: boolean;
  accountingLoading: boolean;
}) {
  const gross = accounting?.pf_realized_gross_usd;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <MetricCard label="PF realized gross" value={gross === undefined ? "—" : money(gross)}
        sub="Includes partial exits · before fees" loading={accountingLoading}
        color={gross === undefined ? "default" : gross >= 0 ? "green" : "red"} />
      <MetricCard label="Closed PF entries" value={accounting?.pf_closed_entries ?? "—"}
        sub="Fully closed opening orders" loading={accountingLoading} />
      <MetricCard label="Remaining PF entries"
        value={accounting ? accounting.pf_entries - accounting.pf_closed_entries : "—"}
        sub="Some quantity remains open" loading={accountingLoading} />
      <MetricCard label="Net performance" value="Pending" sub="Fees and equity history unresolved" />
      <MetricCard label="Paper trading" value={paper ? paper.paperTradingEnabled ? "ON" : "OFF" : "—"}
        loading={loading} sub="Operational setting" />
      <MetricCard label="Live trading" value={trading ? trading.tradingEnabled ? "ON" : "OFF" : "—"}
        loading={loading} sub="Setting is not capital approval" color={trading?.tradingEnabled ? "yellow" : "default"} />
    </div>
  );
}
