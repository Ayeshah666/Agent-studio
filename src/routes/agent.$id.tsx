import { createFileRoute, Link, Outlet, notFound } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SlidersHorizontal, Rocket, Pause } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { AdvancedSettingsDialog } from "@/components/agent/AdvancedSettingsDialog";
import { agentQuery, updateAgent } from "@/lib/agents";
import { WORKSPACE_TABS } from "@/lib/agent-options";

export const Route = createFileRoute("/agent/$id")({
  loader: async ({ context, params }) => {
    const a = await context.queryClient.ensureQueryData(agentQuery(params.id));
    if (!a) throw notFound();
    return { name: a.name };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.name} — AgentStudio` : "Agent — AgentStudio";
    return {
      meta: [
        { title: t },
        { name: "description", content: "Configure your AI agent." },
        { property: "og:title", content: t },
        { property: "og:description", content: "Configure your AI agent." },
      ],
    };
  },
  notFoundComponent: AgentNotFound,
  component: Workspace,
});

function AgentNotFound() {
  return <div className="p-10 text-muted-foreground">Agent not found. <Link to="/agents" className="underline">Back to agents</Link></div>;
}

function Workspace() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: agent } = useSuspenseQuery(agentQuery(id));
  const [name, setName] = useState(agent?.name ?? "");
  const [advOpen, setAdvOpen] = useState(false);
  useEffect(() => { setName(agent?.name ?? ""); }, [agent?.name]);
  if (!agent) return <AgentNotFound />;

  const save = async (patch: Parameters<typeof updateAgent>[1], msg?: string) => {
    try {
      const updated = await updateAgent(id, patch);
      qc.setQueryData(agentQuery(id).queryKey, updated);
      qc.invalidateQueries({ queryKey: ["agents"] });
      if (msg) toast.success(msg);
    } catch (e) {
      toast.error("Save failed", { description: (e as Error).message });
    }
  };

  const live = agent.status === "active";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b px-8 pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => name.trim() && name !== agent.name && save({ name: name.trim() })}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                className="min-w-0 rounded-md bg-transparent px-1 text-xl font-semibold tracking-tight outline-none hover:bg-accent focus:bg-accent"
                aria-label="Agent name"
              />
              <StatusBadge status={agent.status} />
            </div>
            <p className="px-1 text-sm text-muted-foreground">{agent.business_name || agent.industry || "No business name"}</p>
          </div>
          <Button variant="outline" onClick={() => setAdvOpen(true)}><SlidersHorizontal className="h-4 w-4" /> Advanced</Button>
          <Button onClick={() => save({ status: live ? "paused" : "active" }, live ? "Agent paused" : "Agent published")}>
            {live ? <Pause className="h-4 w-4" /> : <Rocket className="h-4 w-4" />} {live ? "Pause" : "Publish"}
          </Button>
        </div>
        <nav className="-mb-px mt-5 flex gap-1 overflow-x-auto">
          {WORKSPACE_TABS.map((t) =>
            t.slug ? (
              <Link key={t.slug} to="/agent/$id/$tab" params={{ id, tab: t.slug }} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "!border-primary !text-foreground font-medium" }}>{t.label}</Link>
            ) : (
              <Link key="agent" to="/agent/$id" params={{ id }} activeOptions={{ exact: true }} className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground" activeProps={{ className: "!border-primary !text-foreground font-medium" }}>{t.label}</Link>
            ),
          )}
        </nav>
      </header>
      <div className="flex-1 px-8 py-8">
        <Outlet />
      </div>
      <AdvancedSettingsDialog open={advOpen} onOpenChange={setAdvOpen} agent={agent} onSave={(s) => save({ settings: s }, "Advanced settings saved")} />
    </div>
  );
}
