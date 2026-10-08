"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CfReview } from "@/lib/cfReview";

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
};

export function CfReviewPanel({ review, loading }: { review: CfReview | null; loading: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">CF same-day study</CardTitle>
          <Badge variant="outline">{review ? "Evidence review" : "Review unavailable"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {loading ? <Skeleton className="h-36 w-full" /> : !review ? (
          <p role="status">A verified CF review is unavailable. The dashboard retries automatically; no return is inferred.</p>
        ) : (
          <>
            <p className="text-muted-foreground">Last completed review: session {review.session_date} · recorded {new Date(review.as_of).toLocaleString()}</p>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div><dt className="text-muted-foreground">Paper baseline</dt><dd className="font-mono mt-1">$10,000</dd></div>
              <div><dt className="text-muted-foreground">Annual net goal</dt><dd className="font-mono mt-1">$3,000 · 30%</dd></div>
              <div><dt className="text-muted-foreground">Candidates retained</dt><dd className="font-mono mt-1">{review.retained_candidate_decisions}</dd><p className="text-xs text-muted-foreground">Across all observed sessions</p></div>
              <div><dt className="text-muted-foreground">Completed sessions</dt><dd className="font-mono mt-1">{review.completed_trading_sessions}</dd></div>
            </dl>
            <p><strong>Net profit and return: unavailable.</strong> Entries and exits still need a validated paper-trading policy. The annual goal is aspirational.</p>
            <p className="text-muted-foreground">Session coverage: {review.coverage.complete ?? 0} evaluated · {review.coverage.unimplemented ?? 0} awaiting an evaluator · {(review.coverage.missing ?? 0) + (review.coverage.incomplete ?? 0)} missing or incomplete.</p>
            <div>
              <p className="font-medium">Next: {review.next_work.action === "INVESTIGATE_DATA" ? "Investigate data gaps" : "Complete and validate the paper evaluator"}</p>
              {review.next_work.blockers.length > 0 && <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                {review.next_work.blockers.map(reason => <li key={reason}>{blockers[reason] ?? "Source evidence needs further review."}</li>)}
              </ul>}
            </div>
            <p className="text-muted-foreground">Reviewed checkpoints: {review.reviewed_checkpoints.join(", ") || "none"}. Reviews follow completed trading sessions 1, 2, 4, 5, 7, 10, 15, 20, 30, then every 30. Rule testing and promotion remain pending.</p>
          </>
        )}
        <p className="text-xs text-muted-foreground">Dedicated same-day paper study; separate from existing PF broker results. Every modeled position must close that session. Capital and previous results carry forward when rules change.</p>
      </CardContent>
    </Card>
  );
}
