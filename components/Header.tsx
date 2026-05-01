"use client";

import { Badge } from "@/components/ui/badge";

export function Header({ isOnline, lastUpdated }: { isOnline: boolean; lastUpdated: Date | null }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">MarketAI Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Signal pipeline · Paper trading · Falsification gates
        </p>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="text-xs text-muted-foreground font-mono">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
          {isOnline ? "● LIVE" : "○ OFFLINE"}
        </Badge>
      </div>
    </div>
  );
}
