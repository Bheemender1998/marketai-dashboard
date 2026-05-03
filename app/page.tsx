"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
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
import type {
  PaperStats, PostmortemStats, Rejections, TradingStatus,
  EnrichedPositionsResponse, PaperMetrics,
} from "@/lib/types";

const BASE = "https://marketai-backend-production-1493.up.railway.app";
const fetcher = (url: string) => fetch(url).then((r) => r.json());
const REFRESH = 30_000;

export default function DashboardPage() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { data: paper, error: paperErr, isLoading: paperLoading } =
    useSWR<PaperStats>(`${BASE}/api/paper/stats`, fetcher, { refreshInterval: REFRESH });

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

  useEffect(() => {
    if (paper) setLastUpdated(new Date());
  }, [paper]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Header isOnline={isOnline} lastUpdated={lastUpdated} />
      <PerfPanel paper={paper} trading={trading} loading={loading} />
      <TruthSourcesLegend />
      <LiveMetricsPanel metrics={metrics} loading={metricsLoading} />
      <PFOnlyPanel positions={enriched?.positions} metrics={metrics} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpenPositions positions={enriched?.positions} loading={enrichedLoading} />
        <RejectionBreakdown rejections={rejections} loading={loading} />
      </div>
      <FalsificationGates paper={paper} postmortem={postmortem} loading={loading} />
      <SignalActivityPanel paper={paper} postmortem={postmortem} rejections={rejections} loading={loading} />
      <BrierBreakdown postmortem={postmortem} paper={paper} loading={loading} />
      <SystemStatus />
      <Roadmap />
    </main>
  );
}
