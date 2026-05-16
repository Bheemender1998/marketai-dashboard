"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MODULES, type ModuleStatus } from "@/lib/modules";

const STATUS_CONFIG: Record<ModuleStatus, { label: string; dot: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  live:     { label: "LIVE",     dot: "bg-emerald-500", badge: "default" },
  disabled: { label: "DISABLED", dot: "bg-amber-500",   badge: "secondary" },
  gated:    { label: "GATED",    dot: "bg-blue-500",    badge: "outline" },
  killed:   { label: "KILLED",   dot: "bg-red-500",     badge: "destructive" },
};

function ModuleCard({ name, status, desc }: { name: string; status: ModuleStatus; desc: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{name}</span>
          <Badge variant={cfg.badge} className="text-[10px] px-1.5 py-0">{cfg.label}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// Doctrine 2026-05-02: hide KILLED tier from the live system view.
// Killed pipelines confuse the live picture; their existence is visible in
// git history + memory archives. Dashboard renders only what's running or
// gated to run.
const SECTIONS: Array<{ title: string; filter: ModuleStatus }> = [
  { title: "Live", filter: "live" },
  { title: "Gated", filter: "gated" },
  { title: "Disabled", filter: "disabled" },
];

export function SystemStatus() {
  const killedCount = MODULES.filter((m) => m.status === "killed").length;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle
            className="text-base cursor-help underline decoration-dotted decoration-muted-foreground/40"
            title={
              "System status by tier. LIVE = currently running and executing. GATED = wired in code but blocked behind " +
              "an env flag or threshold (will activate when condition met). DISABLED = explicitly turned off via env flag " +
              "(autonomy gates, morning brief). KILLED tier is hidden by doctrine 2026-05-02 — those modules are dead and " +
              "won't be revived; rendering them confuses the live picture."
            }
          >
            System Status
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            Audited 2026-05-16 · {killedCount} killed modules hidden
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {SECTIONS.map(({ title, filter }) => {
            const modules = MODULES.filter((m) => m.status === filter);
            if (modules.length === 0) return null;
            return (
              <div key={filter} className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 pb-1 border-b border-border">
                  {title} ({modules.length})
                </p>
                <div className="divide-y divide-border/40">
                  {modules.map((m) => (
                    <ModuleCard key={m.name} {...m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
