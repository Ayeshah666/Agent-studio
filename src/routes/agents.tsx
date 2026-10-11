import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus, Search, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { agentsQuery } from "@/lib/agents";
import { AGENT_TYPE_LABEL, type AgentType } from "@/lib/agent-options";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "AI Agents — AgentStudio" },
      { name: "description", content: "All your AI call agents and chatbots in one place." },
      { property: "og:title", content: "AI Agents — AgentStudio" },
      { property: "og:description", content: "All your AI call agents and chatbots in one place." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(agentsQuery()),
  component: AgentsPage,
});

const TYPE_FILTERS: { v: "all" | AgentType; l: string }[] = [
  { v: "all", l: "All" }, { v: "both", l: "Voice + Chatbot" }, { v: "voice", l: "Voice Only" }, { v: "chatbot", l: "Chatbot Only" },
];
const STATUS_FILTERS = ["all", "active", "paused", "draft"] as const;

function AgentsPage() {
  const { data: agents } = useSuspenseQuery(agentsQuery());
  const [type, setType] = useState<"all" | AgentType>("all");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [q, setQ] = useState("");

  const list = useMemo(
    () => agents.filter((a) =>
      (type === "all" || a.agent_type === type) &&
      (status === "all" || a.status === status) &&
      (!q || `${a.name} ${a.business_name ?? ""} ${a.industry ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    ),
    [agents, type, status, q],
  );

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">AI Agents</h1>
        <Button asChild><Link to="/"><Plus className="h-4 w-4" /> New Agent</Link></Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {TYPE_FILTERS.map((f) => (
          <button key={f.v} className="chip" data-active={type === f.v} onClick={() => setType(f.v)}>{f.l}</button>
        ))}
        <div className="mx-2 h-6 w-px bg-border" />
        {STATUS_FILTERS.map((s) => (
          <button key={s} className="chip capitalize" data-active={status === s} onClick={() => setStatus(s)}>{s}</button>
        ))}
        <div className="relative ml-auto w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search agents" className="pl-9" />
        </div>
      </div>

      {list.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          {agents.length === 0 ? "No agents yet. Create your first one from the dashboard." : "No agents match these filters."}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <Link key={a.id} to="/agent/$id" params={{ id: a.id }} className="rounded-2xl border bg-card p-5 shadow-soft transition hover:border-ring">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{a.name}</h3>
                  <p className="truncate text-sm text-muted-foreground">{a.business_name || "No business name"}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {a.industry && <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{a.industry}</span>}
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{AGENT_TYPE_LABEL[a.agent_type as AgentType]}</span>
              </div>
              <div className="mt-5 flex gap-4 border-t pt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{a.call_count} calls</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="h-3.5 w-3.5" />{a.chat_count} chats</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
