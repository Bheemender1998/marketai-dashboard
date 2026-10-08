"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CfReview } from "@/lib/cfReview";
import type { CfReference } from "@/lib/cfReference";

const blockers: Record<string, string> = {
  incomplete_candidate_scan: "Candidate scan had incomplete source coverage.",
  missing_cf_quote_report: "Live quote report was not captured.",
  pf_received_cohort_after_open: "PF first received the candidate list after the market opened.",
  cohort_received_after_open: "CF first recorded the candidate list after the market opened.",
  missing_cf_cohort: "The candidate list is missing.",
  missing_intake_session: "A trading session has no archived intake.",
  invalid_source_receipt: "A source record failed validation.",
  source_record_changed_or_disappeared: "An expected source record changed or disappeared.",
  source_validation_failed: "Source evidence needs further review.",
  before_first_entry_session: "This session predates the fixed paper entry rule.",
  policy_frozen_after_open: "The paper rule was not frozen before this session opened.",
  prior_position_unresolved: "An earlier modeled position still needs an evidenced exit.",
  missing_entry_quote: "An eligible candidate has no usable entry quote.",
  unresolved_entered_position: "A modeled entry has no verified same-day exit.",
  missing_matched_benchmark: "A matching IWM benchmark quote is missing.",
};

const pct = (value: number | null) => value === null ? "Unavailable" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
const dollars = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function CfReviewPanel({ review, reference, loading }: {
  review: CfReview | null; reference: CfReference | null; loading: boolean;
}) {
  const reasons = reference?.blockers ?? review?.next_work.blockers ?? [];
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">CF same-day study</CardTitle>
          <Badge variant="outline">Paper only · {reference ? "Reference observations" : review ? "Evidence review" : "Evidence unavailable"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? <Skeleton className="h-36 w-full" /> : !review && !reference ? (
          <p role="status">Verified CF evidence is unavailable. The dashboard retries automatically; no return is inferred.</p>
        ) : (
          <>
            <p className="text-muted-foreground">Evaluated through {reference?.session_date ?? review?.session_date} · recorded {new Date((reference ?? review)!.as_of).toLocaleString()}</p>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div><dt className="text-muted-foreground">Paper baseline</dt><dd className="font-mono mt-1">$10,000</dd></div>
              <div><dt className="text-muted-foreground">Annual net goal</dt><dd className="font-mono mt-1">$3,000 · 30%</dd></div>
              <div><dt className="text-muted-foreground">Candidates retained</dt><dd className="font-mono mt-1">{reference?.retained_candidates ?? review?.retained_candidate_decisions}</dd><p className="text-xs text-muted-foreground">Across all observed sessions</p></div>
              <div><dt className="text-muted-foreground">Completed sessions</dt><dd className="font-mono mt-1">{reference?.completed_trading_sessions ?? review?.completed_trading_sessions}</dd></div>
            </dl>
            <p><strong>{reference?.net_profit_usd != null ? `Modeled net: ${dollars(reference.net_profit_usd)} · ${pct(reference.return_on_capital_pct)} on original capital.` : "Whole-study net profit and return: unavailable."}</strong> The annual goal is aspirational; the entry rule is unvalidated and actual fills are unverified.</p>
            {reference ? <>
              <p className="text-muted-foreground">{reference.closed_modeled_trades ? `${reference.closed_modeled_trades} modeled closes · partial closed-position net ${dollars(reference.known_closed_position_net_usd)}.` : "No modeled trades closed."} Unresolved positions: {reference.unresolved_positions}. Complete sessions: {reference.coverage.complete ?? 0} · incomplete: {reference.coverage.incomplete ?? 0} · missing intake: {reference.coverage.missing ?? 0}.</p>
              <div className="border-t pt-4 space-y-2">
                <h3 className="font-medium">Observed price changes · {reference.observation_session_date ?? "no session available"}</h3>
                {!reference.current_session_observed && <p role="status">The latest evaluated session has no observations; any table below belongs to the earlier date shown.</p>}
                {reference.price_observations ? <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">Endpoint quote observations including rejected candidates, separate from modeled portfolio profit</caption>
                    <thead className="text-muted-foreground"><tr className="border-b">
                      <th scope="col" className="py-2 pr-4 font-normal">Candidate group</th>
                      <th scope="col" className="py-2 pr-4 font-normal">Observed / total</th>
                      <th scope="col" className="py-2 pr-4 font-normal">Mean after costs</th>
                      <th scope="col" className="py-2 pr-4 font-normal">Ended ≥5%</th>
                      <th scope="col" className="py-2 font-normal">Ended ≥10%</th>
                    </tr></thead>
                    <tbody>{(["multi", "single", "benchmark"] as const).map(key => {
                      const group = reference.price_observations![key];
                      return <tr key={key} className="border-b last:border-0">
                        <th scope="row" className="py-2 pr-4 font-medium whitespace-nowrap">{{ multi: "Multi-screen", single: "Single-screen", benchmark: "IWM benchmark" }[key]}</th>
                        <td className="py-2 pr-4 font-mono">{group.observed} / {group.total}</td>
                        <td className="py-2 pr-4 font-mono">{pct(group.mean_cost_stressed_return_pct)}</td>
                        <td className="py-2 pr-4 font-mono">{group.at_least_5pct_at_time_exit}</td>
                        <td className="py-2 font-mono">{group.at_least_10pct_at_time_exit}</td>
                      </tr>;
                    })}</tbody>
                  </table>
                </div> : <p>No verified price observations are available.</p>}
                <p className="text-xs text-muted-foreground">Observed from 5 minutes after open to 5 minutes before close. Means include quoted spread plus a 0.50% round-trip cost allowance; the 5%/10% counts include spread only. Rejected candidates are included. These are endpoint changes, not intraday highs or earned portfolio returns.</p>
              </div>
            </> : <p role="status" className="text-muted-foreground">Reference results are unavailable. The last saved review has {review?.coverage.unimplemented ?? 0} sessions awaiting evaluation and {review?.coverage.missing ?? 0} missing intake sessions.</p>}
            <div>
              <p className="font-medium">Next: {reasons.length ? "Investigate data gaps and collect the next session" : "Observe the frozen rule on future sessions"}</p>
              {reasons.length > 0 && <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                {reasons.map(reason => <li key={reason}>{blockers[reason] ?? "Source evidence needs further review."}</li>)}
              </ul>}
            </div>
            <p className="text-muted-foreground">{review ? `Reviewed checkpoints: ${review.reviewed_checkpoints.join(", ") || "none"} (review through ${review.session_date}).` : "Review history is unavailable."} Reviews follow completed trading sessions 1, 2, 4, 5, 7, 10, 15, 20, 30, then every 30. Automatic hypothesis testing and rule promotion remain pending.</p>
          </>
        )}
        <p className="text-xs text-muted-foreground">Dedicated same-day paper study; separate from existing PF broker results. Every modeled position must close that session. Capital and previous results carry forward when rules change.</p>
      </CardContent>
    </Card>
  );
}
