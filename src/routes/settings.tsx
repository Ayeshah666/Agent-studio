import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — AgentStudio" },
      { name: "description", content: "Workspace preferences for AgentStudio." },
      { property: "og:title", content: "Settings — AgentStudio" },
      { property: "og:description", content: "Workspace preferences for AgentStudio." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-soft">
        <h2 className="font-medium">AI keys</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI features run on the server; no keys are stored in the browser. Use the dark mode switch in the sidebar to change the theme.
        </p>
      </div>
    </div>
  ),
});
