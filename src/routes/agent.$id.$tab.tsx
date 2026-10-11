import { createFileRoute, notFound } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { WORKSPACE_TABS } from "@/lib/agent-options";

export const Route = createFileRoute("/agent/$id/$tab")({
  loader: ({ params }) => {
    const tab = WORKSPACE_TABS.find((t) => t.slug && t.slug === params.tab);
    if (!tab) throw notFound();
    return { label: tab.label };
  },
  component: TabPlaceholder,
});

function TabPlaceholder() {
  const { label } = Route.useLoaderData();
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed p-16 text-center">
      <Construction className="mb-3 h-6 w-6 text-muted-foreground" />
      <h2 className="font-semibold">{label}</h2>
      <p className="mt-1 text-sm text-muted-foreground">This section is coming soon.</p>
    </div>
  );
}
