export interface OpenPosition {
  ticker: string;
  direction: string;
  entryPrice: number;
  stop: number;
  target: number;
}

export interface RecentTrade {
  ticker: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  pnlUsd: number;
  win: boolean;
  closeReason: string;
  date: string;
  // Source-tagging shipped backend PR 149 (2026-05-02). Forward-only:
  // pre-PR closed trades have null source, classified as legacy_pre_pf
  // by the bySource rollup.
  source?: string | null;
}

export interface SourceTradesBucket {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: string;
  totalPnl: number;
}

export interface PaperStats {
  paperTradingEnabled: boolean;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: string;
  totalPnl: number;
  openPositions: OpenPosition[];
  recentTrades: RecentTrade[];
  // Per-source rollup added backend PR 149. Always-present field; key
  // legacy_pre_pf holds pre-PF mixed-source historical fills.
  bySource?: Record<string, SourceTradesBucket>;
}

export interface SourceBucket {
  total: number;
  wins: number;
  pnl: number;
}

export interface PostmortemStats {
  totalResolved: number;
  wins: number;
  losses: number;
  expired: number;
  totalPnl: number;
  brierSum: number;
  bySource: Record<string, SourceBucket>;
  byAssetClass: Record<string, SourceBucket>;
  byTimeframe: Record<string, SourceBucket>;
  winRate: number;
  avgBrier: number;
  pendingCount: number;
  onTrack: boolean;
}

export interface RejectionGate {
  gate: string;
  count: number;
}

export interface Rejections {
  total: number;
  last24hCount: number;
  byGate: RejectionGate[];
}

export interface TradingStatus {
  tradingEnabled: boolean;
  dryRun: boolean;
}

export interface EnrichedPosition extends OpenPosition {
  currentPrice: number | null;
  qty: number | null;
  marketValue: number | null;
  unrealizedPnl: number | null;
  source: string | null;
  pfStrategy: string | null;
}

export interface MetricsBucket {
  ann: number;
  sharpe: number;
  maxDD: number;
  tradeCount: number;
  totalPnl: number;
  dayCount: number;
}

export interface PfSignalSim extends MetricsBucket {
  lifetime: {
    total: number;
    wins: number;
    pnl: number;
  };
}

export interface PaperMetrics {
  pfSignalSim: PfSignalSim;
  /**
   * Backward-compat alias kept by backend for one deploy cycle.
   * Will be dropped in cleanup PR after this dashboard PR ships.
   */
  patternfinding?: MetricsBucket;
  backtest: {
    ann: number;
    sharpe: number;
    maxDD: number;
    events: number;
    live: number;
    target: number;
  };
}

export interface EnrichedPositionsResponse {
  positions: EnrichedPosition[];
}
