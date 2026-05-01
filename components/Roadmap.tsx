"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROADMAP, type RoadmapItem } from "@/lib/modules";

function RoadmapItem({ name, phase, gate }: RoadmapItem) {
  const config = {
    active:  { bg: "bg-emerald-500/10 border-emerald-500/30", text: "text-emerald-400", badge: "default" as const,     dot: "bg-emerald-500" },
    gated:   { bg: "bg-blue-500/10 border-blue-500/30",       text: "text-blue-400",    badge: "secondary" as const,   dot: "bg-blue-500" },
    killed:  { bg: "bg-red-500/10 border-red-500/30",         text: "text-red-400/70",  badge: "destructive" as const, dot: "bg-red-500" },
  }[phase];

  return (
    <div className={`rounded-md border px-3 py-2 ${config.bg}`}>
      <div className="flex items-center gap-2">
        <div className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
        <span className={`text-sm font-medium ${phase === "killed" ? "line-through text-muted-foreground" : ""}`}>
          {name}
        </span>
      </div>
      {gate && <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">{gate}</p>}
    </div>
  );
}

const PHASES: Array<{ key: "active" | "gated" | "killed"; title: string; desc: string }> = [
  { key: "active",  title: "Active Now",  desc: "Running in production" },
  { key: "gated",   title: "Gated",       desc: "Waiting on a falsification condition" },
  { key: "killed",  title: "Killed",      desc: "Falsified or removed — not coming back" },
];

export function Roadmap() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Roadmap</CardTitle>
          <Badge variant="outline" className="text-xs">Living doc</Badge>
        </div>
        <p className="text-xs text-muted-foreground">Updates when modules ship, graduate, or get killed</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PHASES.map(({ key, title, desc }) => {
            const items = ROADMAP.filter((r) => r.phase === key);
            return (
              <div key={key}>
                <div className="mb-3">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className="space-y-2">
                  {items.map((item) => (
                    <RoadmapItem key={item.name} {...item} />
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
