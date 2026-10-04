"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { money, type BrokerAccounting } from "@/lib/accounting";

export function PFOnlyPanel({ accounting, loading }: { accounting: BrokerAccounting | null; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Paper accounting evidence</CardTitle>
          <Badge variant="outline">{accounting ? "Gross reconciled" : "Evidence unavailable"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? <Skeleton className="h-24 w-full" /> : !accounting ? (
          <p role="status">Fresh reconciled accounting is unavailable. Profit figures are withheld; this is not a zero-profit result. The dashboard retries automatically.</p>
        ) : (
          <>
            <p className="text-muted-foreground">Captured {new Date(accounting.as_of).toLocaleString()} · {accounting.stock_fills} stock fills reconciled across the paper account.</p>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><dt className="text-muted-foreground">PF realized gross</dt><dd className="font-mono mt-1">{money(accounting.pf_realized_gross_usd)}</dd></div>
              <div><dt className="text-muted-foreground">Partial-exit contribution</dt><dd className="font-mono mt-1">{money(accounting.pf_partial_exit_gross_usd)}</dd><p className="text-xs text-muted-foreground mt-1">Already included in realized gross.</p></div>
              <div><dt className="text-muted-foreground">Unallocated account fees</dt><dd className="font-mono mt-1">${accounting.unallocated_account_fee_debits_usd.toFixed(2)}</dd><p className="text-xs text-muted-foreground mt-1">Account-wide debits; not all attributable to PF.</p></div>
            </dl>
          </>
        )}
        <p className="text-muted-foreground">Gross uses broker fill prices, including partial exits. Fee allocation and whole-account cash reconciliation remain incomplete, so net profit is unavailable. Open-position marks are shown separately and are not added to this captured total.</p>
        <p className="text-muted-foreground">Annualized return, Sharpe and drawdown are unavailable until a complete daily portfolio ledger covers cash, exposure, dividends and open positions. Legacy orders cannot reliably identify individual strategies.</p>
      </CardContent>
    </Card>
  );
}
