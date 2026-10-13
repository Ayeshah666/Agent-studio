import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

// Bare page loaded inside the Chatbot Builder's preview frame.
export const Route = createFileRoute("/widget-preview/$id")({
  validateSearch: (s: Record<string, unknown>) => ({ site: typeof s["site"] === "string" ? s["site"] : "", embed: s["embed"] === true || s["embed"] === 1 || s["embed"] === "1" }),
  head: () => ({ meta: [{ title: "Chatbot preview — AgentStudio" }, { name: "description", content: "Live chatbot widget preview." }, { property: "og:title", content: "Chatbot preview — AgentStudio" }, { property: "og:description", content: "Live chatbot widget preview." }, { name: "robots", content: "noindex" }] }),
  component: Preview,
});

function Preview() {
  const { id } = Route.useParams();
  const { site, embed } = Route.useSearch();
  useEffect(() => {
    if (document.querySelector("script[data-agent]")) return;
    const s = document.createElement("script");
    s.src = `${window.location.origin}/api/public/widget/script`;
    s.setAttribute("data-agent", id);
    s.setAttribute("data-preview", "");
    s.onload = () => window.parent.postMessage({ type: "agentstudio:ready" }, window.location.origin);
    document.body.appendChild(s);
  }, [id]);

  if (embed && site) return <iframe src={site} title="Website preview" className="fixed inset-0 h-full w-full border-0" />;
  let host = "your-website.com";
  try { if (site) host = new URL(site).hostname; } catch { /* keep */ }
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex items-center gap-6 border-b bg-background px-8 py-4">
        <div className="h-6 w-28 rounded bg-foreground/80" />
        <div className="ml-auto flex gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-3 w-14 rounded bg-muted-foreground/30" />)}</div>
      </div>
      <div className="mx-auto max-w-3xl px-8 py-16">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{host}</p>
        <div className="mt-4 h-9 w-3/4 rounded bg-foreground/80" />
        <div className="mt-3 h-9 w-1/2 rounded bg-foreground/60" />
        <div className="mt-8 space-y-3">{[100, 95, 88, 92, 70].map((w, i) => <div key={i} className="h-3 rounded bg-muted-foreground/25" style={{ width: `${w}%` }} />)}</div>
        <div className="mt-10 grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-xl bg-background shadow-sm" />)}</div>
      </div>
    </div>
  );
}
