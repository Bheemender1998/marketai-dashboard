"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PerfPanel } from "@/components/PerfPanel";
import { OpenPositions } from "@/components/OpenPositions";
import { RejectionBreakdown } from "@/components/RejectionBreakdown";
import { FalsificationGates } from "@/components/FalsificationGates";
import { SystemStatus } from "@/components/SystemStatus";
import { Roadmap } from "@/components/Roadmap";
import type { PaperStats, PostmortemStats, Rejections, TradingStatus } from "@/lib/types";

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

  const isOnline = !paperErr && paper !== undefined;
  const loading = paperLoading || pmLoading || rejLoading || tradingLoading;

  useEffect(() => {
    if (paper) setLastUpdated(new Date());
  }, [paper]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Header isOnline={isOnline} lastUpdated={lastUpdated} />
      <PerfPanel paper={paper} trading={trading} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OpenPositions positions={paper?.openPositions} loading={loading} />
        <RejectionBreakdown rejections={rejections} loading={loading} />
      </div>
      <FalsificationGates paper={paper} postmortem={postmortem} loading={loading} />
      <SystemStatus />
      <Roadmap />
    </main>
  );
}
