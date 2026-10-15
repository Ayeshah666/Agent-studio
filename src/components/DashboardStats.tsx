import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, Activity, Phone, Hash, MessageSquare, UserPlus, Sparkles as NewIcon } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/crm";

const statsQuery = {
  queryKey: ["dashboard-stats"],
  queryFn: async () => {
    const [a, c, v, l] = await Promise.all([
      supabase.from("agents").select("id, name, status, created_at"),
      supabase.from("calls").select("id, agent_id, created_at, agents(name)").order("created_at", { ascending: false }).limit(500),
      supabase.from("conversations").select("id, agent_id, created_at, agents(name)").order("created_at", { ascending: false }).limit(20),
      supabase.from("leads").select("id, agent_id, name, created_at, agents(name)").order("created_at", { ascending: false }).limit(20),
    ]);
    const err = a.error || c.error || v.error || l.error;
    if (err) throw err;
    return { agents: a.data, calls: c.data, convs: v.data, leads: l.data };
  },
};

export function DashboardStats() {
  const { data } = useQuery(statsQuery);
  const [metric, setMetric] = useState<"agents" | "calls">("calls");
  const [days, setDays] = useState("30");

  const series = useMemo(() => {
    const n = Number(days);
    const out: { day: string; value: number }[] = [];
    const counts = new Map<string, number>();
    const src = metric === "agents" ? data?.agents ?? [] : data?.calls ?? [];
    for (const r of src) { const k = r.created_at.slice(0, 10); counts.set(k, (counts.get(k) ?? 0) + 1); }
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      out.push({ day: d.slice(5), value: counts.get(d) ?? 0 });
    }
    return out;
  }, [data, metric, days]);

  const recent = useMemo(() => {
    if (!data) return [];
    return [
      ...data.agents.map((x) => ({ id: x.id, at: x.created_at, icon: NewIcon, text: `Agent “${x.name}” created`, agentId: x.id })),
      ...data.calls.slice(0, 20).map((x) => ({ id: x.id, at: x.created_at, icon: Phone, text: `Call handled by ${x.agents?.name ?? "an agent"}`, agentId: x.agent_id })),
      ...data.convs.map((x) => ({ id: x.id, at: x.created_at, icon: MessageSquare, text: `New chat with ${x.agents?.name ?? "an agent"}`, agentId: x.agent_id })),
      ...data.leads.map((x) => ({ id: x.id, at: x.created_at, icon: UserPlus, text: `Lead ${x.name ? `“${x.name}” ` : ""}captured by ${x.agents?.name ?? "an agent"}`, agentId: x.agent_id })),
    ].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  }, [data]);

  const stats = [
    { label: "Total Agents", value: data?.agents.length, icon: Bot },
    { label: "Active Agents", value: data?.agents.filter((a) => a.status === "active").length, icon: Activity },
    { label: "Total Calls", value: data?.calls.length, icon: Phone },
    { label: "Phone Numbers", value: 0, icon: Hash },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-6 pb-16">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between text-sm text-muted-foreground">{label}<Icon className="h-4 w-4" /></div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{value ?? "–"}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-semibold">Activity</h3>
            <ToggleGroup type="single" size="sm" variant="outline" value={metric} onValueChange={(v) => v && setMetric(v as "agents" | "calls")}>
              <ToggleGroupItem value="agents">Agents</ToggleGroupItem>
              <ToggleGroupItem value="calls">Calls</ToggleGroupItem>
            </ToggleGroup>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ChartContainer config={{ value: { label: metric === "agents" ? "Agents" : "Calls", color: "var(--primary)" } }} className="h-56 w-full">
            <LineChart data={series} margin={{ left: -20, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={24} fontSize={11} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-semibold">Recent Activity</h3>
          {recent.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
          <ul className="space-y-3">
            {recent.map((r) => (
              <li key={r.id} className="flex gap-3 text-sm">
                <r.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  {r.agentId ? <Link to="/agent/$id" params={{ id: r.agentId }} className="line-clamp-2 hover:underline">{r.text}</Link> : <span>{r.text}</span>}
                  <div className="text-xs text-muted-foreground">{fmtDate(r.at)}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
