"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TruthSourcesLegend() {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">What the numbers mean</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2 max-w-prose">
        <p><strong className="text-foreground">Broker accounting</strong> reconciles paper stock fills and remaining quantities. Gross profit includes partial exits; it is not net profit or proof of an investing edge.</p>
        <p><strong className="text-foreground">Signal simulation</strong> records modeled outcomes with different entries and exits. It does not establish an executable profit or a broker fill.</p>
        <p><strong className="text-foreground">Forward research</strong> must test frozen rules on completed unseen cohorts. Historical win rates and ranking scores cannot authorize real capital.</p>
      </CardContent>
    </Card>
  );
}
