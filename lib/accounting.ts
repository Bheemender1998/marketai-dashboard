export interface BrokerAccounting {
  available: true;
  reason: "gross_reconciled";
  as_of: string;
  pf_realized_gross_usd: number;
  pf_partial_exit_gross_usd: number;
  unallocated_account_fee_debits_usd: number;
  pf_entries: number;
  pf_closed_entries: number;
  stock_fills: number;
  net_performance_available: false;
  real_capital_verdict: "NO_GO";
}

export function verifiedAccounting(value: unknown, now = Date.now()): BrokerAccounting | null {
  if (!value || typeof value !== "object") return null;
  const d = value as Record<string, unknown>;
  const age = now - Date.parse(typeof d.as_of === "string" ? d.as_of : "");
  const amounts = [d.pf_realized_gross_usd, d.pf_partial_exit_gross_usd, d.unallocated_account_fee_debits_usd];
  const counts = [d.pf_entries, d.pf_closed_entries, d.stock_fills];
  if (d.available !== true || d.reason !== "gross_reconciled" || d.real_capital_verdict !== "NO_GO" ||
      d.net_performance_available !== false || !Number.isFinite(age) || age < 0 || age > 6 * 3600000 ||
      amounts.some(n => typeof n !== "number" || !Number.isFinite(n)) ||
      counts.some(n => typeof n !== "number" || !Number.isSafeInteger(n) || n < 0) ||
      (d.pf_closed_entries as number) > (d.pf_entries as number) ||
      (d.unallocated_account_fee_debits_usd as number) < 0) return null;
  return d as unknown as BrokerAccounting;
}

export const money = (value: number) => new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", signDisplay: "exceptZero",
}).format(value);
