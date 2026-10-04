"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BrokerAccounting } from "@/lib/accounting";

const requirements = [
  ["Net accounting", "Reconcile quantities, cash and all costs; preserve partial fills and exits."],
  ["Source and execution evidence", "Verify complete candidates, inputs, decisions, orders and fills against the same policy version."],
  ["Unseen swing outcomes", "Complete the frozen 10-session study, with 5/20-session checks, SPY and the full candidate benchmark after costs. A correlation-aware lower confidence bound must clear zero after selection adjustments."],
  ["Sample size and risk", "Retain N≥60 PF closes and Sharpe≥1.0 requirements. Independent cohorts, complete daily equity, exposure limits and an adverse market period must also qualify."],
  ["Calibration", "Retain Brier≤0.25 for validated probabilities. Current ranking scores do not establish calibration."],
  ["Operational readiness", "Verify unattended capture, executable entry/exit timing, safety checks, rollback and all remaining release gates."],
];

export function FalsificationGates({ accounting }: { accounting: BrokerAccounting | null }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Real-capital readiness</CardTitle>
          <Badge variant="destructive">NO_GO</Badge>
        </div>
        <p className="text-sm text-muted-foreground">Repeatable swing-trading edge is not established. A trade count or elapsed review date cannot clear these gates.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{accounting ? `${accounting.pf_closed_entries} fully closed PF opening orders are recorded.` : "Reconciled PF close count is unavailable."} Independent completed study cohorts are not yet certified.</p>
        <ul className="divide-y divide-border">
          {requirements.map(([label, detail]) => (
            <li key={label} className="py-3 first:pt-0">
              <div className="flex justify-between gap-3"><span className="font-medium text-sm">{label}</span><span className="text-xs text-amber-400">Pending</span></div>
              <p className="text-sm text-muted-foreground mt-1 max-w-prose">{detail}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
