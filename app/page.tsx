"use client";

import useSWR from "swr";
import { useState } from "react";
import { Header } from "@/components/Header";
import { PerfPanel } from "@/components/PerfPanel";
import { OpenPositions } from "@/components/OpenPositions";
import { RejectionBreakdown } from "@/components/RejectionBreakdown";
import { FalsificationGates } from "@/components/FalsificationGates";
import { BrierBreakdown } from "@/components/BrierBreakdown";
import { SystemStatus } from "@/components/SystemStatus";
import { Roadmap } from "@/components/Roadmap";
import { LiveMetricsPanel } from "@/components/LiveMetricsPanel";
import { PFOnlyPanel } from "@/components/PFOnlyPanel";
import { TruthSourcesLegend } from "@/components/TruthSourcesLegend";
import { SignalActivityPanel } from "@/components/SignalActivityPanel";
import { KrakenStagedSimPanel } from "@/components/KrakenStagedSimPanel";
import { verifiedAccounting } from "@/lib/accounting";
import type {
  PaperStats, PostmortemStats, Rejections, TradingStatus,
  EnrichedPositionsResponse, PaperMetrics,
} from "@/lib/types";

const BASE = "https://marketai-backend-production-1493.up.railway.app";
const fetcher = async (url: string) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(20_000), cache: "no-store" });
  if (!response.ok) throw new Error(`Data unavailable (${response.status})`);
  return response.json();
};
const REFRESH = 30_000;

export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: paper, error: paperErr, isLoading: paperLoading } =
    useSWR<PaperStats>(`${BASE}/api/paper/stats`, fetcher, {
      refreshInterval: REFRESH, onSuccess: () => setLastUpdated(new Date()),
    });

  const { data: accountingData, error: accountingError, isLoading: accountingLoading } =
    useSWR<unknown>(`${BASE}/api/paper/accounting`, fetcher, { refreshInterval: REFRESH });
  const accounting = accountingError ? null : verifiedAccounting(accountingData);

  const { data: postmortem, isLoading: pmLoading } =
    useSWR<PostmortemStats>(`${BASE}/api/postmortem/stats`, fetcher, { refreshInterval: REFRESH });

  const { data: rejections, isLoading: rejLoading } =
    useSWR<Rejections>(`${BASE}/api/rejections`, fetcher, { refreshInterval: REFRESH });

  const { data: trading, isLoading: tradingLoading } =
    useSWR<TradingStatus>(`${BASE}/api/trading/status`, fetcher, { refreshInterval: REFRESH });

  const { data: enriched, isLoading: enrichedLoading } =
    useSWR<EnrichedPositionsResponse>(`${BASE}/api/paper/positions-enriched`, fetcher, { refreshInterval: REFRESH });

  const { data: metrics, isLoading: metricsLoading } =
    useSWR<PaperMetrics>(`${BASE}/api/paper/metrics`, fetcher, { refreshInterval: REFRESH });

  const isOnline = !paperErr && paper !== undefined;
  const loading =
    paperLoading || pmLoading || rejLoading || tradingLoading ||
    enrichedLoading || metricsLoading;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Header isOnline={isOnline} lastUpdated={lastUpdated} />
      <PerfPanel paper={paper} trading={trading} accounting={accounting} loading={paperLoading || tradingLoading} accountingLoading={accountingLoading} />
      <TruthSourcesLegend />
      <PFOnlyPanel accounting={accounting} loading={accountingLoading} />
      <FalsificationGates accounting={accounting} />
      <LiveMetricsPanel metrics={metrics} loading={metricsLoading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpenPositions positions={enriched?.positions} loading={enrichedLoading} />
        <RejectionBreakdown rejections={rejections} loading={loading} />
      </div>
      <SignalActivityPanel paper={paper} postmortem={postmortem} rejections={rejections} loading={loading} />
      <KrakenStagedSimPanel rejections={rejections} postmortem={postmortem} loading={loading} />
      <BrierBreakdown postmortem={postmortem} loading={pmLoading} />
      <SystemStatus />
      <Roadmap />
    </main>
  );
}
