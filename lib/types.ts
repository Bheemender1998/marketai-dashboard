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
